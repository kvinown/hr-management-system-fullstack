import { prisma } from "../../lib/prisma";

export class ShiftService {
	static async create(data: { name: string; startTime: string; endTime: string; lateTolerance: number }) {
		const code = `SHIFT-${data.name.toUpperCase().replace(" ", "-")}`;

		return prisma.shift.create({
			data: {
				code,
				...data,
			},
		});
	}

	static async getAll() {
		return prisma.shift.findMany();
	}

	static async update(id: string, data: any) {
		return prisma.shift.update({
			where: { id },
			data,
		});
	}

	static async delete(id: string) {
		return prisma.shift.delete({
			where: { id },
		});
	}
}
