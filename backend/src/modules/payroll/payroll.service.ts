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

	// 🔥 Tambahkan parameter page dan limit untuk pagination
	static async getAll(user: any) {
		// Jika yang login adalah EMPLOYEE
		if (user.role === "EMPLOYEE") {
			// 1. Cari dulu data Employee dia berdasarkan userId
			const employee = await prisma.employee.findUnique({
				where: { userId: user.id },
			});

			if (!employee) return { data: [] };

			// 2. Kembalikan HANYA payroll milik dia
			const payrolls = await prisma.payroll.findMany({
				where: { employeeId: employee.id },
				include: {
					employee: {
						include: { user: true, department: true },
					},
				},
				orderBy: [{ year: "desc" }, { month: "desc" }],
			});
			return { data: payrolls };
		}

		// Jika yang login adalah HR_ADMIN, berikan semua data
		const payrolls = await prisma.payroll.findMany({
			include: {
				employee: {
					include: { user: true, department: true },
				},
			},
			orderBy: [{ year: "desc" }, { month: "desc" }],
		});

		return { data: payrolls };
	}

	// 🔥 Fungsi Baru: Generate Massal
	static async generateBulk(month: number, year: number) {
		// 1. Ambil semua karyawan yang masih AKTIF
		const activeEmployees = await prisma.employee.findMany({
			where: { status: "ACTIVE" },
		});

		if (activeEmployees.length === 0) {
			throw new Error("No active employees found.");
		}

		// 2. Cek payroll siapa saja yang sudah pernah dibuat di bulan & tahun ini
		const existingPayrolls = await prisma.payroll.findMany({
			where: { month, year },
		});
		const existingEmployeeIds = existingPayrolls.map((p) => p.employeeId);

		// 3. Filter karyawan yang BELUM dibuatkan payroll-nya
		const employeesToProcess = activeEmployees.filter((emp) => !existingEmployeeIds.includes(emp.id));

		if (employeesToProcess.length === 0) {
			throw new Error("All active employees already have payrolls for this period.");
		}

		const startDate = new Date(year, month - 1, 1);
		const endDate = new Date(year, month, 0);

		let generatedCount = 0;

		// 4. Looping & Kalkulasi per karyawan
		for (const employee of employeesToProcess) {
			const attendances = await prisma.attendance.findMany({
				where: {
					employeeId: employee.id,
					date: { gte: startDate, lte: endDate },
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
				if (a.isOvertime) totalOvertimeMinutes += a.overtimeMinutes;
			});

			// Perhitungan Gaji
			const hourlyRate = employee.salary / 173;
			const overtimePay = (totalOvertimeMinutes / 60) * hourlyRate;
			const latePenalty = totalLate * 1000;
			const absentPenalty = totalAbsent * (employee.salary / 22);
			const deductions = latePenalty + absentPenalty;
			const totalSalary = employee.salary + overtimePay - deductions;

			// Insert ke Database
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

		return {
			message: `Successfully generated payrolls for ${generatedCount} employees.`,
			count: generatedCount,
		};
	}
}
