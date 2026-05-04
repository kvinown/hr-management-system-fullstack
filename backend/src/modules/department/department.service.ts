import { prisma } from "../../lib/prisma";

export class DepartmentService {
	static async create(name: string) {
		const count = await prisma.department.count();
		const code = `DEP-${String(count + 1).padStart(4, "0")}`;

		return prisma.department.create({
			data: { name, code },
		});
	}

	static async getAll() {
		return prisma.department.findMany();
	}

	static async update(id: string, name: string) {
		return prisma.department.update({
			where: { id },
			data: { name },
		});
	}

	static async delete(id: string) {
		return prisma.department.delete({
			where: { id },
		});
	}
}
