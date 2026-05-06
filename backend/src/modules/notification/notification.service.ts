import { prisma } from "../../lib/prisma";
import { getIO } from "../../lib/socket";

export class NotificationService {
	// 1. Broadcast Pengumuman Global (Untuk Semua Orang)
	static async createBroadcast(title: string, message: string) {
		// Simpan ke DB dengan userId = null (Artinya untuk semua)
		const notification = await prisma.notification.create({
			data: {
				title,
				message,
				type: "ANNOUNCEMENT",
			},
		});

		// 📢 TERIAK KE SEMUA FRONTEND YANG SEDANG ONLINE!
		getIO().emit("new_notification", notification);

		return notification;
	}

	// 2. Notifikasi Personal (Misal: "Gaji kamu sudah cair, Kevin!")
	static async createPersonalNotification(userId: string, title: string, message: string, type: string = "INFO") {
		const notification = await prisma.notification.create({
			data: {
				userId,
				title,
				message,
				type,
			},
		});

		// 📢 Teriak hanya ke spesifik user (Nanti di frontend difilter)
		getIO().emit(`notification_${userId}`, notification);

		return notification;
	}

	// 3. Ambil Notifikasi (Untuk Frontend saat baru loading)
	static async getUserNotifications(userId: string) {
		return prisma.notification.findMany({
			where: {
				OR: [
					{ userId: userId }, // Notifikasi pribadi
					{ userId: null }, // Pengumuman global
				],
			},
			orderBy: { createdAt: "desc" },
			take: 20, // Ambil 20 terbaru saja
		});
	}

	// 4. Tandai Sudah Dibaca
	static async markAsRead(id: string) {
		return prisma.notification.update({
			where: { id },
			data: { isRead: true },
		});
	}
}
