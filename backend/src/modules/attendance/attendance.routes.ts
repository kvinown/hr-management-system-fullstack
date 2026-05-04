import { Router } from "express";
import { AttendanceController } from "./attendance.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/role.middleware";

const router = Router();


router.post(
    "/clock-in",
    authenticate,
    authorize("EMPLOYEE"),
    AttendanceController.clockIn
);

router.post(
    "/clock-out",
    authenticate,
    authorize("EMPLOYEE"),
    AttendanceController.clockOut
);
router.get("/", authenticate, AttendanceController.getAttendance);

export default router;