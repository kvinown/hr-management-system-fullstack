import { prisma } from "../../lib/prisma";

function getTodayDate() {
	const now = new Date();
	return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function parseTimeToDate(time: string) {
	const [hour, minute] = time.split(":").map(Number);
	const now = new Date();
	return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
}

export class AttendanceService {
	// CLOCK IN
	static async clockIn(userId: string) {
		const employee = await prisma.employee.findUnique({
			where: { userId },
			include: { shift: true },
		});

		if (!employee) throw new Error("Employee not found");

		const today = getTodayDate();

		const existing = await prisma.attendance.findUnique({
			where: {
				employeeId_date: {
					employeeId: employee.id,
					date: today,
				},
			},
		});

		if (existing && existing.clockIn) {
			throw new Error("Already clocked in today");
		}

		const now = new Date();

		const shiftStart = parseTimeToDate(employee.shift.startTime);
		const lateTolerance = employee.shift.lateTolerance;

		let status: any = "PRESENT";
		let lateMinutes = 0;

		if (now > shiftStart) {
			const diff = Math.floor((now.getTime() - shiftStart.getTime()) / 60000);

			if (diff > lateTolerance) {
				status = "LATE";
				lateMinutes = diff;
			}
		}

		const attendance = await prisma.attendance.upsert({
			where: {
				employeeId_date: {
					employeeId: employee.id,
					date: today,
				},
			},
			update: {
				clockIn: now,
				status,
				lateMinutes,
			},
			create: {
				employeeId: employee.id,
				date: today,
				clockIn: now,
				status,
				lateMinutes,
			},
		});

		return attendance;
	}

	// CLOCK OUT
	static async clockOut(userId: string) {
		const employee = await prisma.employee.findUnique({
			where: { userId },
			include: { shift: true },
		});

		if (!employee) throw new Error("Employee not found");

		const today = getTodayDate();

		const attendance = await prisma.attendance.findUnique({
			where: {
				employeeId_date: {
					employeeId: employee.id,
					date: today,
				},
			},
		});

		if (!attendance || !attendance.clockIn) {
			throw new Error("You have not clocked in");
		}

		if (attendance.clockOut) {
			throw new Error("Already clocked out");
		}

		const now = new Date();
		const shiftEnd = parseTimeToDate(employee.shift.endTime);

		let overtimeMinutes = 0;
		let isOvertime = false;

		if (now > shiftEnd) {
			overtimeMinutes = Math.floor((now.getTime() - shiftEnd.getTime()) / 60000);
			isOvertime = true;
		}

		return prisma.attendance.update({
			where: { id: attendance.id },
			data: {
				clockOut: now,
				overtimeMinutes,
				isOvertime,
			},
		});
	}

	static async getAttendance(user: any, query: any) {
		const { startDate, endDate, employeeId, page = 1, limit = 10 } = query;

		const where: any = {};

		// 🔒 Role logic
		if (user.role === "EMPLOYEE") {
			const employee = await prisma.employee.findUnique({
				where: { userId: user.id },
			});

			if (!employee) throw new Error("Employee not found");

			where.employeeId = employee.id;
		} else {
			if (employeeId) {
				where.employeeId = employeeId;
			}
		}

		// 📅 Date filter
		if (startDate && endDate) {
			where.date = {
				gte: new Date(startDate),
				lte: new Date(endDate),
			};
		}

		// 📄 Pagination
		const skip = (Number(page) - 1) * Number(limit);

		const [data, total] = await Promise.all([
			prisma.attendance.findMany({
				where,
				include: {
					employee: {
						select: {
							fullName: true,
						},
					},
				},
				skip,
				take: Number(limit),
				orderBy: {
					date: "desc",
				},
			}),
			prisma.attendance.count({ where }),
		]);

		return {
			data,
			meta: {
				total,
				page: Number(page),
				lastPage: Math.ceil(total / Number(limit)),
			},
		};
	}
}
