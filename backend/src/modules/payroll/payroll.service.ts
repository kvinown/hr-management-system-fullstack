import { prisma } from "../../lib/prisma";

export class PayrollService {
	static async generate(employeeId: string, month: number, year: number) {
		const existing = await prisma.payroll.findFirst({
			where: { employeeId, month, year },
		});

		if (existing) throw new Error("Payroll already generated for this period");

		const employee = await prisma.employee.findUnique({
			where: { id: employeeId },
		});

		if (!employee) throw new Error("Employee not found");

		const startDate = new Date(year, month - 1, 1);
		const endDate = new Date(year, month, 0);

		const attendances = await prisma.attendance.findMany({
			where: { employeeId, date: { gte: startDate, lte: endDate } },
		});

		let totalAttendance = 0;
		let totalLate = 0;
		let totalAbsent = 0;
		let totalOvertimeMinutes = 0;

		attendances.forEach((a) => {
			if (a.status === "PRESENT") totalAttendance++;
			if (a.status === "LATE") {
				totalAttendance++;
				totalLate += a.lateMinutes;
			}
			if (a.status === "ABSENT") totalAbsent++;
			if (a.isOvertime) totalOvertimeMinutes += a.overtimeMinutes;
		});

		// 🔥 FETCH DYNAMIC SETTINGS & COMPONENTS
		const lateSetting = await prisma.setting.findUnique({ where: { key: "LATE_PENALTY_PER_MINUTE" } });
		const latePenaltyRate = lateSetting && !isNaN(Number(lateSetting.value)) ? Number(lateSetting.value) : 1000;

		const components = await prisma.payrollComponent.findMany({ where: { isDefault: true } });
		let extraEarnings = 0;
		let extraDeductions = 0;

		components.forEach((c) => {
			if (c.type === "EARNING") extraEarnings += c.amount;
			if (c.type === "DEDUCTION") extraDeductions += c.amount;
		});

		// Kalkulasi
		const hourlyRate = employee.salary / 173;
		const overtimePay = (totalOvertimeMinutes / 60) * hourlyRate;

		const latePenalty = totalLate * latePenaltyRate;
		const absentPenalty = totalAbsent * (employee.salary / 22);

		const deductions = latePenalty + absentPenalty + extraDeductions;
		const totalSalary = employee.salary + extraEarnings + overtimePay - deductions;

		return prisma.payroll.create({
			data: {
				employeeId,
				month,
				year,
				baseSalary: employee.salary,
				totalAttendance,
				totalLate,
				totalAbsent,
				overtimePay,
				deductions,
				totalSalary,
			},
		});
	}

	static async getAll(user: any) {
		if (user.role === "EMPLOYEE") {
			const employee = await prisma.employee.findUnique({ where: { userId: user.id } });
			if (!employee) return { data: [] };

			const payrolls = await prisma.payroll.findMany({
				where: { employeeId: employee.id },
				include: { employee: { include: { user: true, department: true } } },
				orderBy: [{ year: "desc" }, { month: "desc" }],
			});
			return { data: payrolls };
		}

		const payrolls = await prisma.payroll.findMany({
			include: { employee: { include: { user: true, department: true } } },
			orderBy: [{ year: "desc" }, { month: "desc" }],
		});
		return { data: payrolls };
	}

	static async generateBulk(month: number, year: number) {
		const activeEmployees = await prisma.employee.findMany({ where: { status: "ACTIVE" } });
		if (activeEmployees.length === 0) throw new Error("No active employees found.");

		const existingPayrolls = await prisma.payroll.findMany({ where: { month, year } });
		const existingEmployeeIds = existingPayrolls.map((p) => p.employeeId);

		const employeesToProcess = activeEmployees.filter((emp) => !existingEmployeeIds.includes(emp.id));
		if (employeesToProcess.length === 0) throw new Error("All active employees already have payrolls for this period.");

		const startDate = new Date(year, month - 1, 1);
		const endDate = new Date(year, month, 0);

		// 🔥 FETCH DYNAMIC SETTINGS & COMPONENTS UNTUK BULK
		const lateSetting = await prisma.setting.findUnique({ where: { key: "LATE_PENALTY_PER_MINUTE" } });
		const latePenaltyRate = lateSetting && !isNaN(Number(lateSetting.value)) ? Number(lateSetting.value) : 1000;

		const components = await prisma.payrollComponent.findMany({ where: { isDefault: true } });
		let extraEarnings = 0;
		let extraDeductions = 0;
		components.forEach((c) => {
			if (c.type === "EARNING") extraEarnings += c.amount;
			if (c.type === "DEDUCTION") extraDeductions += c.amount;
		});

		let generatedCount = 0;

		for (const employee of employeesToProcess) {
			const attendances = await prisma.attendance.findMany({
				where: { employeeId: employee.id, date: { gte: startDate, lte: endDate } },
			});

			let totalAttendance = 0;
			let totalLate = 0;
			let totalAbsent = 0;
			let totalOvertimeMinutes = 0;

			attendances.forEach((a) => {
				if (a.status === "PRESENT") totalAttendance++;
				if (a.status === "LATE") {
					totalAttendance++;
					totalLate += a.lateMinutes;
				}
				if (a.status === "ABSENT") totalAbsent++;
				if (a.isOvertime) totalOvertimeMinutes += a.overtimeMinutes;
			});

			const hourlyRate = employee.salary / 173;
			const overtimePay = (totalOvertimeMinutes / 60) * hourlyRate;
			const latePenalty = totalLate * latePenaltyRate;
			const absentPenalty = totalAbsent * (employee.salary / 22);

			const deductions = latePenalty + absentPenalty + extraDeductions;
			const totalSalary = employee.salary + extraEarnings + overtimePay - deductions;

			await prisma.payroll.create({
				data: {
					employeeId: employee.id,
					month,
					year,
					baseSalary: employee.salary,
					totalAttendance,
					totalLate,
					totalAbsent,
					overtimePay,
					deductions,
					totalSalary,
				},
			});
			generatedCount++;
		}

		return { message: `Successfully generated payrolls for ${generatedCount} employees.`, count: generatedCount };
	}
}
