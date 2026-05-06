import { prisma } from "../../lib/prisma";

export class SettingService {
	// Ambil semua pengaturan untuk ditampilkan di UI HR
	static async getAll() {
		return prisma.setting.findMany({
			orderBy: { key: "asc" },
		});
	}

	// Fungsi Helper: Ambil satu nilai spesifik (akan sangat berguna nanti untuk Geofencing & Cron)
	static async getValue(key: string): Promise<string | null> {
		const setting = await prisma.setting.findUnique({
			where: { key },
		});
		return setting ? setting.value : null;
	}

	// Update banyak pengaturan sekaligus (Bulk Update)
	static async updateBulk(updates: { key: string; value: string }[]) {
		// Gunakan transaksi agar kalau gagal satu, gagal semua (aman untuk data sensitif)
		const transaction = updates.map((update) =>
			prisma.setting.update({
				where: { key: update.key },
				data: { value: update.value },
			}),
		);

		await prisma.$transaction(transaction);
		return { message: "Settings updated successfully" };
	}
}
