import { prisma } from "../../lib/prisma";

export class DepartmentService {
	static async create(name: string) {
		const count = await prisma.department.count();
		const code = `DEP-${String(count + 1).padStart(4, "0")}`;

		return prisma.department.create({
			data: { name, code },
		});
	}

	// 🔥 Tambahkan parameter page, limit, dan isActive
	static async getAll(page: number, limit: number, isActive: boolean) {
		const skip = (page - 1) * limit;

		const [data, total_items] = await Promise.all([
			prisma.department.findMany({
				where: { isActive },
				skip,
				take: limit,
			}),
			prisma.department.count({ where: { isActive } }),
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

	static async update(id: string, name: string) {
		return prisma.department.update({
			where: { id },
			data: { name },
		});
	}

	// Fungsi khusus untuk mengubah status (Active/Inactive)
	static async changeStatus(id: string, isActive: boolean) {
		return prisma.department.update({
			where: { id },
			data: { isActive },
		});
	}

	static async delete(id: string) {
		return prisma.department.update({
			where: { id },
			data: { isActive: false },
		});
	}
}
