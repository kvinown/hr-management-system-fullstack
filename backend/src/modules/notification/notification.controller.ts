import { Request, Response } from "express";
import { NotificationService } from "./notification.service";

export class NotificationController {
	// HR Kirim Pengumuman
	static async broadcast(req: Request, res: Response) {
		try {
			const { title, message } = req.body;
			const data = await NotificationService.createBroadcast(title, message);
			res.status(201).json({ message: "Broadcast sent successfully", data });
		} catch (error: any) {
			res.status(400).json({ error: error.message });
		}
	}

	// Karyawan/HR Ambil Notifikasi Mereka
	static async getMyNotifications(req: Request, res: Response) {
		try {
			const user = (req as any).user; // Ditangkap dari middleware auth
			const data = await NotificationService.getUserNotifications(user.id);
			res.json({ data });
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	}

	// Tandai Notifikasi Sudah Dibaca
	static async markAsRead(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const data = await NotificationService.markAsRead(id);
			res.json({ message: "Marked as read", data });
		} catch (error: any) {
			res.status(400).json({ error: error.message });
		}
	}
}
