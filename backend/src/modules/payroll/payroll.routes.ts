import { Router } from "express";
import { PayrollController } from "./payroll.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";

const router = Router();

// 🔒 HR only
router.post("/generate", authenticate, authorize("HR_ADMIN"), PayrollController.generate);
router.get("/:id/payslip", authenticate, authorize("HR_ADMIN"), PayrollController.generatePayslip);

// 🔒 HR only
router.get("/", authenticate, authorize("HR_ADMIN"), PayrollController.getAll);

export default router;
