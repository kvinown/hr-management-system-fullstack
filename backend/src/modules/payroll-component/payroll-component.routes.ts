import { Router } from "express";
import { PayrollComponentController } from "./payroll-component.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";

const router = Router();

router.get("/", authenticate, authorize("HR_ADMIN"), PayrollComponentController.getAll);
router.post("/", authenticate, authorize("HR_ADMIN"), PayrollComponentController.create);
router.put("/:id", authenticate, authorize("HR_ADMIN"), PayrollComponentController.update);
router.delete("/:id", authenticate, authorize("HR_ADMIN"), PayrollComponentController.delete);

export default router;
