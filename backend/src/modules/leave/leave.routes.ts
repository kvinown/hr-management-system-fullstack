import { Router } from "express";
import { LeaveController } from "./leave.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";

const router = Router();

// 🟢 Bisa diakses semua role (HR & Employee)
router.get("/", authenticate, LeaveController.getAll);
router.post("/", authenticate, LeaveController.create);// Tambahkan ini agar sinkron dengan DynamicCrud Edit
router.put("/:id", authenticate, authorize("HR_ADMIN"), LeaveController.updateStatus);

// 🔒 Hanya bisa diakses HR_ADMIN (Untuk Approve/Reject)
router.patch("/:id/status", authenticate, authorize("HR_ADMIN"), LeaveController.updateStatus);

export default router;
