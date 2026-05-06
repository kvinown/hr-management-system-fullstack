import { prisma } from "../../lib/prisma";

export class PayrollComponentService {
	static async getAll() {
		return prisma.payrollComponent.findMany({
			orderBy: { name: "asc" },
		});
	}

	static async create(data: { name: string; type: string; amount: number; isDefault?: boolean }) {
		return prisma.payrollComponent.create({
			data: {
				...data,
				isDefault: data.isDefault ?? true,
			},
		});
	}

	static async update(id: string, data: any) {
		return prisma.payrollComponent.update({
			where: { id },
			data,
		});
	}

	static async delete(id: string) {
		return prisma.payrollComponent.delete({
			where: { id },
		});
	}
}
