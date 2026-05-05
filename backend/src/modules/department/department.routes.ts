import { Router } from "express";
import { DepartmentController } from "./department.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";

const router = Router();

// ✅ GET → semua role boleh
router.get("/", authenticate, DepartmentController.getAll);

// 🔒 HR only
router.post("/", authenticate, authorize("HR_ADMIN"), DepartmentController.create);

router.patch("/:id/status", authenticate, authorize("HR_ADMIN"), DepartmentController.changeStatus);

router.put("/:id", authenticate, authorize("HR_ADMIN"), DepartmentController.update);

router.delete("/:id", authenticate, authorize("HR_ADMIN"), DepartmentController.delete);

export default router;
