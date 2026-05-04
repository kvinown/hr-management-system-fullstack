import { prisma } from "../../lib/prisma";

export class PayrollService {
	static async generate(employeeId: string, month: number, year: number) {
		const existing = await prisma.payroll.findFirst({
			where: { employeeId, month, year },
		});

		if (existing) {
			throw new Error("Payroll already generated for this period");
		}
        
		const employee = await prisma.employee.findUnique({
			where: { id: employeeId },
		});

		if (!employee) throw new Error("Employee not found");

		const startDate = new Date(year, month - 1, 1);
		const endDate = new Date(year, month, 0);

		const attendances = await prisma.attendance.findMany({
			where: {
				employeeId,
				date: {
					gte: startDate,
					lte: endDate,
				},
			},
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

			if (a.isOvertime) {
				totalOvertimeMinutes += a.overtimeMinutes;
			}
		});

		// 💰 Overtime
		const hourlyRate = employee.salary / 173;
		const overtimePay = (totalOvertimeMinutes / 60) * hourlyRate;

		// 💸 Deductions
		const latePenalty = totalLate * 1000;
		const absentPenalty = totalAbsent * (employee.salary / 22);

		const deductions = latePenalty + absentPenalty;

		const totalSalary = employee.salary + overtimePay - deductions;

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

	static async getAll() {
		return prisma.payroll.findMany({
			include: {
				employee: {
					select: { fullName: true },
				},
			},
			orderBy: { createdAt: "desc" },
		});
	}
}
