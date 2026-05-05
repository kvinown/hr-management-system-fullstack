import { prisma } from "../../lib/prisma";
import bcrypt from "bcrypt";

export class EmployeeService {
	static async create(data: { name: string; email: string; password: string; salary: number; departmentId: string; positionId: string; shiftId: string }) {
		// 1. Generate Employee Code
		const count = await prisma.employee.count();
		const code = `EMP-${String(count + 1).padStart(4, "0")}`;

		// 2. Hash Password demi keamanan
		const hashedPassword = await bcrypt.hash(data.password, 10);

		// 3. 🔥 Gunakan Prisma Transaction (Skenario B)
		// Jika salah satu gagal, semuanya akan di-rollback otomatis!
		const result = await prisma.$transaction(async (tx) => {
			// A. Buat akun User terlebih dahulu
			const newUser = await tx.user.create({
				data: {
					name: data.name,
					email: data.email,
					password: hashedPassword,
					role: "EMPLOYEE", // Set role otomatis menjadi EMPLOYEE
				},
			});

			// B. Buat profil Employee dan sambungkan dengan userId yang baru dibuat
			const newEmployee = await tx.employee.create({
				data: {
					code,
					userId: newUser.id, // 🔥 Sambungan Relasinya di sini
					salary: data.salary,
					status: "ACTIVE",
					departmentId: data.departmentId,
					positionId: data.positionId,
					shiftId: data.shiftId,
				},
			});

			return newEmployee;
		});

		return result;
	}

	static async getAll(page: number, limit: number, isActive: any) {
		const skip = (page - 1) * limit;

		const [data, total_items] = await Promise.all([
			prisma.employee.findMany({
				where: { status: isActive },
				skip,
				take: limit,
				// 🔥 Tambahkan blok include ini agar data relasinya ikut terbawa!
				include: {
					user: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
					department: true,
					position: true,
					shift: true,
				},
			}),
			prisma.employee.count({ where: { status: isActive } }),
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

	static async getById(id: string) {
		return prisma.employee.findUnique({
			where: { id },
			include: {
				user: {
					select: {
						id: true,
						name: true, // 🔥 Memanggil name dari tabel User
						email: true,
						role: true,
					},
				},
				department: true,
				position: true,
				shift: true,
			},
		});
	}

	static async update(
		id: string,
		data: Partial<{
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

	// Fungsi khusus untuk mengubah status (Active/Inactive)
	static async changeStatus(id: string, isActive: any) {
		return prisma.employee.update({
			where: { id },
			data: { status: isActive },
		});
	}

	static async delete(id: string) {
		return prisma.employee.update({
			where: { id },
			data: { status: "RESIGNED" },
		});
	}
}
