import { Request, Response } from "express";
import { ChatService } from "./chat.service";

export class ChatController {
	static async getContacts(req: Request, res: Response) {
		try {
			const user = (req as any).user;
			const contacts = await ChatService.getContacts(user.id); // 🔥 Hapus parameter 'user.role'
			res.json({ data: contacts });
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	}

	static async getHistory(req: Request, res: Response) {
		try {
			const user = (req as any).user;
			const { contactId } = req.params;
			const history = await ChatService.getChatHistory(user.id, contactId);
			res.json({ data: history });
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	}

	// Tambahkan fungsi baru ini untuk menangani upload
	static async uploadFile(req: Request, res: Response) {
		try {
			if (!req.file) throw new Error("No file uploaded");

			const fileUrl = `/uploads/chats/${req.file.filename}`;
			const fileName = req.file.originalname;

			// Deteksi apakah ini gambar atau dokumen
			const ext = req.file.mimetype.split("/")[0];
			const fileType = ext === "image" ? "IMAGE" : "DOCUMENT";

			res.json({ fileUrl, fileName, fileType });
		} catch (error: any) {
			res.status(400).json({ error: error.message });
		}
	}
}
