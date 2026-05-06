import { Router } from "express";
import { ChatController } from "./chat.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import multer from "multer";
import path from "path";
import fs from "fs";

// 📂 Setup Folder Penyimpanan Chat
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		const dir = "public/uploads/chats";
		if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
		cb(null, dir);
	},
	filename: (req, file, cb) => {
		cb(null, `chat-${Date.now()}${path.extname(file.originalname)}`);
	},
});
const upload = multer({ storage });

const router = Router();

router.get("/contacts", authenticate, ChatController.getContacts);
router.get("/history/:contactId", authenticate, ChatController.getHistory);

// 🔥 Route baru untuk kirim file
router.post("/upload", authenticate, upload.single("file"), ChatController.uploadFile);

export default router;
