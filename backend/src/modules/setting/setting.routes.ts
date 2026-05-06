import { Router } from "express";
import { SettingController } from "./setting.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";

const router = Router();

// 🔒 Hanya HR_ADMIN yang bisa mengakses halaman Settings
router.get("/", authenticate, authorize("HR_ADMIN"), SettingController.getAll);
router.put("/bulk", authenticate, authorize("HR_ADMIN"), SettingController.updateBulk);

export default router;
