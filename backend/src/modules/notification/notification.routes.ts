import { Router } from "express";
import { NotificationController } from "./notification.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";

const router = Router();

// 📢 Hanya HR_ADMIN yang bisa melakukan Broadcast
router.post("/broadcast", authenticate, authorize("HR_ADMIN"), NotificationController.broadcast);

// 👤 Semua User yang login (termasuk HR) bisa melihat notifikasinya sendiri
router.get("/", authenticate, NotificationController.getMyNotifications);
router.patch("/:id/read", authenticate, NotificationController.markAsRead);

export default router;
