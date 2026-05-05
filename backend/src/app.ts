import express from "express";
import cors from "cors";
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

const app = express();

app.use(cors());
app.use(express.json());
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

app.get("/", (req, res) => {
	res.send("API is running 🚀");
});

export default app;
