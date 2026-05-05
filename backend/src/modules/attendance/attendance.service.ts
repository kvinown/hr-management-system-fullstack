import { prisma } from "../../lib/prisma";

function getTodayDate() {
	const now = new Date();
	return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function parseTimeToDate(time: string) {
	const [hour, minute] = time.split(":").map(Number);
	const now = new Date();
	return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
}

export class AttendanceService {
	// CLOCK IN
	static async clockIn(userId: string) {
		const employee = await prisma.employee.findUnique({
			where: { userId },
			include: { shift: true },
		});

		if (!employee) throw new Error("Employee not found");

		const today = getTodayDate();

		const existing = await prisma.attendance.findUnique({
			where: {
				employeeId_date: {
					employeeId: employee.id,
					date: today,
				},
			},
		});

		if (existing && existing.clockIn) {
			throw new Error("Already clocked in today");
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

		const attendance = await prisma.attendance.upsert({
			where: {
				employeeId_date: {
					employeeId: employee.id,
					date: today,
				},
			},
			update: {
				clockIn: now,
				status,
				lateMinutes,
			},
			create: {
				employeeId: employee.id,
				date: today,
				clockIn: now,
				status,
				lateMinutes,
			},
		});

		return attendance;
	}

	// CLOCK OUT
	static async clockOut(userId: string) {
		const employee = await prisma.employee.findUnique({
			where: { userId },
			include: { shift: true },
		});

		if (!employee) throw new Error("Employee not found");

		const today = getTodayDate();

		const attendance = await prisma.attendance.findUnique({
			where: {
				employeeId_date: {
					employeeId: employee.id,
					date: today,
				},
			},
		});

		if (!attendance || !attendance.clockIn) {
			throw new Error("You have not clocked in");
		}

		if (attendance.clockOut) {
			throw new Error("Already clocked out");
		}

		const now = new Date();
		const shiftEnd = parseTimeToDate(employee.shift.endTime);

		let overtimeMinutes = 0;
		let isOvertime = false;

		if (now > shiftEnd) {
			overtimeMinutes = Math.floor((now.getTime() - shiftEnd.getTime()) / 60000);
			isOvertime = true;
		}

		return prisma.attendance.update({
			where: { id: attendance.id },
			data: {
				clockOut: now,
				overtimeMinutes,
				isOvertime,
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
