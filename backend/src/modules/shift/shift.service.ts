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

	static async getAll(page: number, limit: number, isActive: boolean) {
		const skip = (page - 1) * limit;

		const [data, total_items] = await Promise.all([
			prisma.shift.findMany({
				where: { isActive },
				skip,
				take: limit,
			}),
			prisma.shift.count({ where: { isActive } }),
		]);

		return {
			data,
			pagination: {
				page,
				limit,
				total_items,
				total_pages: Math.ceil(total_items / limit) || 1,
			},
		};
	}

	static async update(id: string, data: any) {
		return prisma.shift.update({
			where: { id },
			data,
		});
	}

	// Fungsi khusus untuk mengubah status (Active/Inactive)
	static async changeStatus(id: string, isActive: boolean) {
		return prisma.shift.update({
			where: { id },
			data: { isActive },
		});
	}

	static async delete(id: string) {
		return prisma.shift.update({
			where: { id },
			data: { isActive: false },
		});
	}
}
