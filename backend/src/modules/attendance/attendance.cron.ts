import cron from "node-cron";
import { prisma } from "../../lib/prisma";

export const initAttendanceCron = () => {
	// 🕒 Berjalan setiap hari jam 23:55 malam
	cron.schedule("55 23 * * *", async () => {
		console.log("🧹 [CRON] Menjalankan pembersihan absensi harian...");

		// Ambil tanggal hari ini (tanpa jam)
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		try {
			// 1. LOGIKA AUTO ABSENT
			const employees = await prisma.employee.findMany({
				where: { status: "ACTIVE" },
			});

			for (const emp of employees) {
				const attendance = await prisma.attendance.findUnique({
					where: {
						employeeId_date: {
							employeeId: emp.id,
							date: today,
						},
					},
				});

				// Jika tidak ada absen DAN tidak ada cuti yang di-approve
				if (!attendance) {
					await prisma.attendance.create({
						data: {
							employeeId: emp.id,
							date: today,
							status: "ABSENT",
							isAutoAbsent: true,
							notes: "Sistem: Tidak ada aktivitas absen terdeteksi hari ini.",
						},
					});
				}
			}

			// 2. LOGIKA AUTO CLOCK-OUT
			const incompleteAttendance = await prisma.attendance.findMany({
				where: {
					date: today,
					clockIn: { not: null },
					clockOut: null,
				},
				include: { employee: { include: { shift: true } } },
			});

			for (const att of incompleteAttendance) {
				// Set waktu pulang otomatis sesuai akhir shift mereka
				const [hour, minute] = att.employee.shift.endTime.split(":").map(Number);
				const autoTime = new Date(today);
				autoTime.setHours(hour, minute, 0);

				await prisma.attendance.update({
					where: { id: att.id },
					data: {
						clockOut: autoTime,
						isAutoClockOut: true,
						notes: "Sistem: Karyawan lupa absen pulang, diisi otomatis sesuai jadwal.",
					},
				});
			}

			console.log("✅ [CRON] Pembersihan selesai.");
		} catch (error) {
			console.error("❌ [CRON] Error:", error);
		}
	});
};
