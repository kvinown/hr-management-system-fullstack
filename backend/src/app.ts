import express from "express";
import cors from "cors";
import path from "path";
import { initAttendanceCron } from "./modules/attendance/attendance.cron";

import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/user/user.routes";
import employeeRoutes from "./modules/employee/employee.routes";
import positionRoutes from "./modules/position/position.routes";
import shiftRoutes from "./modules/shift/shift.routes";
import departmentRoutes from "./modules/department/department.routes";
import attendanceRoutes from "./modules/attendance/attendance.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import payrollRoutes from "./modules/payroll/payroll.routes";
import leaveRoutes from "./modules/leave/leave.routes";
import settingRoutes from "./modules/setting/setting.routes";
import payrollComponentRoutes from "./modules/payroll-component/payroll-component.routes";
import notificationRoutes from "./modules/notification/notification.routes";
import chatRoutes from "./modules/chat/chat.routes";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

initAttendanceCron();
console.log("⏰ Attendance Scheduler is active.");
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/positions", positionRoutes);
app.use("/api/shifts", shiftRoutes);
app.use("/api/attendances", attendanceRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/payrolls", payrollRoutes); 
app.use("/api/leaves", leaveRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/payroll-components", payrollComponentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);

app.get("/", (req, res) => {
	res.send("API is running 🚀");
});

export default app;
