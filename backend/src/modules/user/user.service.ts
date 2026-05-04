import { prisma } from "../../lib/prisma";

export class UserService {
	static async getAll() {
		return prisma.user.findMany({
			select: {
				id: true,
				email: true,
				role: true,
				createdAt: true,
			},
		});
	}

	static async getById(id: string) {
		return prisma.user.findUnique({
			where: { id },
			select: {
				id: true,
				email: true,
				role: true,
				createdAt: true,
			},
		});
	}
}
