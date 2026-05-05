import { Router } from "express";
import { PayrollController } from "./payroll.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";

const router = Router();

// 🔒 Hanya HR yang bisa generate gaji
router.post("/generate", authenticate, authorize("HR_ADMIN"), PayrollController.generate);
router.post("/generate-bulk", authenticate, authorize("HR_ADMIN"), PayrollController.generateBulk);

// 🟢 HR dan Employee BISA mengakses ini (Nanti difilter di Service/Controller)
router.get("/", authenticate, PayrollController.getAll);
router.get("/:id/payslip", authenticate, PayrollController.generatePayslip);

export default router;
