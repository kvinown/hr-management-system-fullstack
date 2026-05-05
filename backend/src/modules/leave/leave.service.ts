import { prisma } from "../../lib/prisma";

export class LeaveService {
	// 1. Fungsi Karyawan Mengajukan Cuti
	static async create(userId: string, data: { type: string; startDate: string; endDate: string; reason: string }) {
		// Cari ID Employee dari user yang sedang login
		const employee = await prisma.employee.findUnique({
			where: { userId },
		});

		if (!employee) throw new Error("Employee profile not found");

		// Generate Kode Unik: LV-YYYYMMDD-Random
		const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
		const randomStr = Math.floor(1000 + Math.random() * 9000);
		const code = `LV-${dateStr}-${randomStr}`;

		const leave = await prisma.leave.create({
			data: {
				code,
				employeeId: employee.id,
				type: data.type,
				startDate: new Date(data.startDate),
				endDate: new Date(data.endDate),
				reason: data.reason,
				status: "PENDING", // Otomatis Pending
			},
		});

		return { message: "Leave request submitted successfully", data: leave };
	}

	// 2. Fungsi Mengambil Data (Bisa HR, Bisa Karyawan)
	static async getAll(user: any, page: number = 1, limit: number = 10) {
		const skip = (page - 1) * limit;
		let whereClause: any = {};

		// 🔒 Jika yang request adalah Karyawan, batasi hanya data miliknya
		if (user.role === "EMPLOYEE") {
			const employee = await prisma.employee.findUnique({ where: { userId: user.id } });
			if (!employee) return { data: [], pagination: { total_items: 0, total_pages: 0, page, limit } };
			whereClause.employeeId = employee.id;
		}

		const [leaves, totalItems] = await Promise.all([
			prisma.leave.findMany({
				where: whereClause,
				include: {
					employee: {
						include: {
							user: { select: { name: true } },
							department: { select: { name: true } },
						},
					},
				},
				orderBy: { createdAt: "desc" }, // Yang terbaru di atas
				skip,
				take: limit,
			}),
			prisma.leave.count({ where: whereClause }),
		]);

		return {
			data: leaves,
			pagination: {
				total_items: totalItems,
				total_pages: Math.ceil(totalItems / limit) || 1,
				page,
				limit,
			},
		};
	}

	// 3. Fungsi HR Menyetujui/Menolak Cuti dengan Automasi Absensi
	static async updateStatus(id: string, status: "APPROVED" | "REJECTED" | "PENDING", hrName: string) {
		const leave = await prisma.leave.findUnique({ where: { id } });
		if (!leave) throw new Error("Leave request not found");

		// 1. Update status Leave
		const updatedLeave = await prisma.leave.update({
			where: { id },
			data: { status, approvedBy: hrName },
		});

		// 2. 🔥 AUTOMATED SYNC KE ATTENDANCE
		if (status === "APPROVED") {
			// Buat array tanggal dari startDate sampai endDate
			let currentDate = new Date(leave.startDate);
			const endDate = new Date(leave.endDate);

			while (currentDate <= endDate) {
				// Cek apakah hari ini Sabtu (6) atau Minggu (0). Opsional: lewati akhir pekan
				const dayOfWeek = currentDate.getDay();
				if (dayOfWeek !== 0 && dayOfWeek !== 6) {
					// Cari awal dan akhir hari tersebut untuk pengecekan
					const startOfDay = new Date(currentDate.setHours(0, 0, 0, 0));
					const endOfDay = new Date(currentDate.setHours(23, 59, 59, 999));

					// Cek apakah sudah ada absen di tanggal ini
					const existingAttendance = await prisma.attendance.findFirst({
						where: {
							employeeId: leave.employeeId,
							date: { gte: startOfDay, lte: endOfDay },
						},
					});

					if (existingAttendance) {
						// Jika sudah ada (mungkin statusnya ABSENT), timpa menjadi LEAVE
						await prisma.attendance.update({
							where: { id: existingAttendance.id },
							data: { status: "LEAVE", leaveId: leave.id },
						});
					} else {
						// Jika belum ada, buat absensi baru berstatus LEAVE
						await prisma.attendance.create({
							data: {
								employeeId: leave.employeeId,
								date: new Date(startOfDay), // Gunakan jam 00:00
								status: "LEAVE",
								leaveId: leave.id,
							},
						});
					}
				}
				// Maju ke hari berikutnya
				currentDate.setDate(currentDate.getDate() + 1);
			}
		}

		// (Opsional) Jika diubah dari APPROVED kembali ke PENDING/REJECTED,
		// kamu bisa menambahkan logika untuk menghapus/mereset Attendance di sini.

		return { message: `Leave request ${status.toLowerCase()}`, data: updatedLeave };
	}
}
