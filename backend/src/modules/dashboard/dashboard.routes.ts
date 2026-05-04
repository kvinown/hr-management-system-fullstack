import { Router } from "express";
import { DashboardController } from "./dashboard.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";

const router = Router();

router.get("/summary", authenticate, authorize("HR_ADMIN"), DashboardController.getSummary);

export default router;
