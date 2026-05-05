import { Router } from "express";
import { ShiftController } from "./shift.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";

const router = Router();

router.get("/", authenticate, ShiftController.getAll);

router.post("/", authenticate, authorize("HR_ADMIN"), ShiftController.create);
router.put("/:id", authenticate, authorize("HR_ADMIN"), ShiftController.update);
router.patch("/:id/status", authenticate, authorize("HR_ADMIN"), ShiftController.changeStatus);
router.delete("/:id", authenticate, authorize("HR_ADMIN"), ShiftController.delete);

export default router;
