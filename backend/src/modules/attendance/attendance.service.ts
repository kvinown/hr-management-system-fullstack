import { prisma } from "../../lib/prisma";
import fs from "fs";
import path from "path";

// Fungsi untuk menyimpan gambar Base64 ke folder lokal
function saveLocalImage(base64String: string, fileName: string): string {
	// 1. Bersihkan prefix Base64 (data:image/jpeg;base64, ...)
	const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
	const buffer = Buffer.from(base64Data, "base64");

	// 2. Tentukan path folder tujuan
	const uploadPath = path.join(__dirname, "../../../public/uploads/attendance");

	// 3. Pastikan folder sudah ada, jika belum buat foldernya
	if (!fs.existsSync(uploadPath)) {
		fs.mkdirSync(uploadPath, { recursive: true });
	}

	// 4. Tulis file ke disk
	const fullPath = path.join(uploadPath, fileName);
	fs.writeFileSync(fullPath, buffer);

	// 5. Kembalikan path relatif untuk disimpan di database (agar bisa diakses via URL)
	return `/uploads/attendance/${fileName}`;
}

function getTodayDate() {
	const now = new Date();
	return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function parseTimeToDate(time: string) {
	const [hour, minute] = time.split(":").map(Number);
	const now = new Date();
	return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
}
// Fungsi untuk menghitung jarak (meter) antara dua titik koordinat
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
	const R = 6371e3; // Radius bumi dalam meter
	const φ1 = (lat1 * Math.PI) / 180;
	const φ2 = (lat2 * Math.PI) / 180;
	const Δφ = ((lat2 - lat1) * Math.PI) / 180;
	const Δλ = ((lon2 - lon1) * Math.PI) / 180;

	const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return R * c; // Hasil dalam meter
}

export class AttendanceService {
	// CLOCK IN
	static async clockIn(userId: string, lat: number, lng: number, photo?: string) {
		const employee = await prisma.employee.findUnique({
			where: { userId },
			include: { shift: true },
		});

		if (!employee) throw new Error("Employee not found");

		// Geofencing Check
		const officeLat = await prisma.setting.findUnique({ where: { key: "OFFICE_LAT" } });
		const officeLng = await prisma.setting.findUnique({ where: { key: "OFFICE_LNG" } });
		const maxRadius = await prisma.setting.findUnique({ where: { key: "MAX_GEOFENCE_RADIUS" } });

		if (officeLat && officeLng && maxRadius) {
			const distance = calculateDistance(lat, lng, parseFloat(officeLat.value), parseFloat(officeLng.value));
			if (distance > parseFloat(maxRadius.value)) {
				throw new Error(`Anda berada di luar radius kantor (${Math.round(distance)} meter).`);
			}
		}

		const today = getTodayDate();
		const existing = await prisma.attendance.findFirst({
			where: { employeeId: employee.id, date: today },
		});

		if (existing && existing.clockIn) throw new Error("Already clocked in today");

		// 📸 PROSES SIMPAN FOTO
		let photoPath = null;
		if (photo) {
			const fileName = `IN_${employee.id}_${Date.now()}.jpg`;
			photoPath = saveLocalImage(photo, fileName);
		}

		const now = new Date();
		const shiftStart = parseTimeToDate(employee.shift.startTime);
		const lateTolerance = employee.shift.lateTolerance;
		let status: any = "PRESENT";
		let lateMinutes = 0;

		if (now > shiftStart) {
			const diff = Math.floor((now.getTime() - shiftStart.getTime()) / 60000);
			if (diff > lateTolerance) {
				status = "LATE";
				lateMinutes = diff;
			}
		}

		return prisma.attendance.upsert({
			where: { employeeId_date: { employeeId: employee.id, date: today } },
			update: { clockIn: now, status, lateMinutes, clockInLat: lat, clockInLng: lng, clockInPhoto: photoPath },
			create: { employeeId: employee.id, date: today, clockIn: now, status, lateMinutes, clockInLat: lat, clockInLng: lng, clockInPhoto: photoPath },
		});
	}

	// CLOCK OUT
	static async clockOut(userId: string, lat: number, lng: number, photo?: string) {
		const employee = await prisma.employee.findUnique({
			where: { userId },
			include: { shift: true },
		});

		if (!employee) throw new Error("Employee not found");

		const today = getTodayDate();
		const attendance = await prisma.attendance.findFirst({
			where: { employeeId: employee.id, date: today },
		});

		if (!attendance || !attendance.clockIn) throw new Error("You have not clocked in");
		if (attendance.clockOut) throw new Error("Already clocked out");

		// 📸 PROSES SIMPAN FOTO
		let photoPath = null;
		if (photo) {
			const fileName = `OUT_${employee.id}_${Date.now()}.jpg`;
			photoPath = saveLocalImage(photo, fileName);
		}

		const now = new Date();
		const shiftEnd = parseTimeToDate(employee.shift.endTime);
		let overtimeMinutes = 0;
		let isOvertime = false;
		let finalStatus = attendance.status;

		if (now > shiftEnd) {
			overtimeMinutes = Math.floor((now.getTime() - shiftEnd.getTime()) / 60000);
			isOvertime = true;
			finalStatus = "OVERTIME";
		}

		return prisma.attendance.update({
			where: { id: attendance.id },
			data: {
				clockOut: now,
				overtimeMinutes,
				isOvertime,
				status: finalStatus,
				clockOutLat: lat,
				clockOutLng: lng,
				clockOutPhoto: photoPath,
			},
		});
	}

	static async getAttendance(user: any, query: any) {
		const { startDate, endDate, employeeId, page = 1, limit = 10 } = query;

		const where: any = {};

		// 🔒 Role logic
		if (user.role === "EMPLOYEE") {
			const employee = await prisma.employee.findUnique({
				where: { userId: user.id },
			});

			if (!employee) throw new Error("Employee not found");

			where.employeeId = employee.id;
		} else {
			if (employeeId) {
				where.employeeId = employeeId;
			}
		}

		// 📅 Date filter
		if (startDate && endDate) {
			where.date = {
				gte: new Date(startDate),
				lte: new Date(endDate),
			};
		}

		// 📄 Pagination
		const skip = (Number(page) - 1) * Number(limit);

		const [data, total] = await Promise.all([
			prisma.attendance.findMany({
				where,
				include: {
					employee: {
						select: {
							user: { select: { name: true } }, // 🔥 Memanggil name dari relasi user
						},
					},
				},
				skip,
				take: Number(limit),
				orderBy: {
					date: "desc",
				},
			}),
			prisma.attendance.count({ where }),
		]);

		return {
			data,
			pagination: {
				page: Number(page),
				limit: Number(limit),
				total_items: total,
				total_pages: Math.ceil(total / Number(limit)) || 1,
			},
		};
	}

	// Fungsi getHistory agar sesuai dengan yang didefinisikan di attendance.controller.ts sebelumnya
	static async getHistory(userId: string) {
		const employee = await prisma.employee.findUnique({
			where: { userId },
		});

		if (!employee) throw new Error("Employee not found");

		return prisma.attendance.findMany({
			where: { employeeId: employee.id },
			orderBy: { date: "desc" },
		});
	}

	static async getAll(startDate?: string, endDate?: string, page: number = 1, limit: number = 10, user?: any) {
		const skip = (page - 1) * limit;

		// 1. Siapkan keranjang filter (Where Clause)
		let whereClause: any = {};

		// 2. Jika frontend mengirim rentang tanggal, masukkan ke keranjang
		if (startDate && endDate) {
			whereClause.date = {
				gte: new Date(startDate),
				lte: new Date(endDate),
			};
		}

		// 3. 🔒 KEAMANAN: Jika yang login adalah Karyawan biasa, KUNCI datanya!
		if (user && user.role === "EMPLOYEE") {
			// Cari ID Karyawan dia berdasarkan ID User yang login
			const employee = await prisma.employee.findUnique({
				where: { userId: user.id },
			});

			// Jika tidak ketemu (mungkin datanya rusak), kembalikan array kosong
			if (!employee) {
				return {
					data: [],
					pagination: { total_items: 0, total_pages: 0, page, limit },
				};
			}

			// Masukkan ID Karyawan ke keranjang filter
			whereClause.employeeId = employee.id;
		}

		// 4. Eksekusi query ke Database (Ambil Data & Hitung Total Data untuk Pagination)
		const [attendances, totalItems] = await Promise.all([
			prisma.attendance.findMany({
				where: whereClause,
				include: {
					employee: {
						include: {
							user: {
								select: { name: true, email: true }, // Jangan kirim password ke frontend!
							},
							department: true,
						},
					},
				},
				orderBy: [
					{ date: "desc" }, // Urutkan dari tanggal terbaru
					{ clockIn: "desc" },
				],
				skip, // Lewati sekian data (untuk pagination)
				take: limit, // Ambil maksimal sekian data (untuk pagination)
			}),
			prisma.attendance.count({ where: whereClause }), // Hitung total seluruh data
		]);

		// 5. Kembalikan data beserta informasi halamannya
		return {
			data: attendances,
			pagination: {
				total_items: totalItems,
				total_pages: Math.ceil(totalItems / limit),
				page,
				limit,
			},
		};
	}
}
