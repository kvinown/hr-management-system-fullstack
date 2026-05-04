import { prisma } from "../../lib/prisma";

export class EmployeeService {
	static async create(data: { userId: string; fullName: string; salary: number; departmentId: string; positionId: string; shiftId: string }) {
		const count = await prisma.employee.count();

		const code = `EMP-${String(count + 1).padStart(4, "0")}`;

		const employee = await prisma.employee.create({
			data: {
				code,
				userId: data.userId,
				fullName: data.fullName,
				salary: data.salary,
				status: "ACTIVE",
				departmentId: data.departmentId,
				positionId: data.positionId,
				shiftId: data.shiftId,
			},
		});

		return employee;
	}

	static async getAll() {
		return prisma.employee.findMany({
			include: {
				user: true,
				department: true,
				position: true,
				shift: true,
			},
		});
	}

	static async getById(id: string) {
		return prisma.employee.findUnique({
			where: { id },
			include: {
				user: true,
				department: true,
				position: true,
				shift: true,
			},
		});
	}

	static async update(
		id: string,
		data: Partial<{
			fullName: string;
			salary: number;
			departmentId: string;
			positionId: string;
			shiftId: string;
			status: any;
		}>,
	) {
		return prisma.employee.update({
			where: { id },
			data,
		});
	}

	static async delete(id: string) {
		return prisma.employee.delete({
			where: { id },
		});
	}
}
