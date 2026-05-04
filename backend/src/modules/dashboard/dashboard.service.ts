import { prisma } from "../../lib/prisma";

function getTodayRange() {
	const start = new Date();
	start.setHours(0, 0, 0, 0);

	const end = new Date();
	end.setHours(23, 59, 59, 999);

	return { start, end };
}

export class DashboardService {
	static async getSummary() {
		const { start, end } = getTodayRange();

		// 👥 Total employee
		const totalEmployees = await prisma.employee.count();

		const activeEmployees = await prisma.employee.count({
			where: { status: "ACTIVE" },
		});

		// 📅 Attendance today
		const todayAttendance = await prisma.attendance.groupBy({
			by: ["status"],
			where: {
				date: {
					gte: start,
					lte: end,
				},
			},
			_count: true,
		});

		let present = 0;
		let late = 0;
		let absent = 0;

		todayAttendance.forEach((a) => {
			if (a.status === "PRESENT") present = a._count;
			if (a.status === "LATE") late = a._count;
			if (a.status === "ABSENT") absent = a._count;
		});

		// 💰 Payroll bulan ini
		const now = new Date();
		const month = now.getMonth() + 1;
		const year = now.getFullYear();

		const payrolls = await prisma.payroll.findMany({
			where: { month, year },
		});

		const totalSalaryThisMonth = payrolls.reduce((sum, p) => sum + p.totalSalary, 0);

		// ⏱️ Overtime
		const overtimeAgg = await prisma.attendance.aggregate({
			_sum: {
				overtimeMinutes: true,
			},
		});

		return {
			totalEmployees,
			activeEmployees,
			todayAttendance: {
				present,
				late,
				absent,
			},
			payroll: {
				totalSalaryThisMonth,
			},
			overtime: {
				totalOvertimeMinutes: overtimeAgg._sum.overtimeMinutes || 0,
			},
		};
	}
}
