import { prisma } from "../../lib/prisma";

export class PositionService {
	static async create(name: string) {
		const count = await prisma.position.count();
		const code = `POS-${String(count + 1).padStart(4, "0")}`;

		return prisma.position.create({
			data: { name, code },
		});
	}

	static async getAll() {
		return prisma.position.findMany();
	}

	static async update(id: string, name: string) {
		return prisma.position.update({
			where: { id },
			data: { name },
		});
	}

	static async delete(id: string) {
		return prisma.position.delete({
			where: { id },
		});
	}
}
