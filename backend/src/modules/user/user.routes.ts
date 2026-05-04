import { Router } from "express";
import { UserController } from "./user.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";

const router = Router();

// 🔒 HR & SUPER ADMIN only
router.get("/", authenticate, authorize("HR_ADMIN", "SUPER_ADMIN"), UserController.getAll);
router.get("/:id", authenticate, authorize("HR_ADMIN", "SUPER_ADMIN"), UserController.getById);

export default router;
