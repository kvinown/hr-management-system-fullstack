import { prisma } from "../../lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_ACCESS_SECRET = process.env.JWT_SECRET as string;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;

export class AuthService {
	// REGISTER
	static async register(name: string, email: string, password: string, role: any) {
		const existingUser = await prisma.user.findUnique({ where: { email } });

		if (existingUser) throw new Error("User already exists");

		const hashedPassword = await bcrypt.hash(password, 10);

		return prisma.user.create({
			data: {
				name,
				email,
				password: hashedPassword,
				role,
			},
		});
	}

	// ACCESS TOKEN
	static generateAccessToken(user: any) {
		return jwt.sign(
			{
				id: user.id,
				name: user.name, // 🔥 Masukkan name ke payload JWT
				email: user.email,
				role: user.role,
			},
			JWT_ACCESS_SECRET,
			{ expiresIn: "15m" },
		);
	}

	// REFRESH TOKEN
	static async generateRefreshToken(userId: string) {
		const token = jwt.sign({ id: userId }, JWT_REFRESH_SECRET, { expiresIn: "7d" });

		await prisma.refreshToken.create({
			data: {
				token,
				userId,
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			},
		});

		return token;
	}

	// LOGIN
	static async login(email: string, password: string) {
		const user = await prisma.user.findUnique({ where: { email } });

		if (!user) throw new Error("Invalid credentials");

		const isMatch = await bcrypt.compare(password, user.password);

		if (!isMatch) throw new Error("Invalid credentials");

		const accessToken = this.generateAccessToken(user);
		const refreshToken = await this.generateRefreshToken(user.id);

		return {
			accessToken,
			refreshToken,
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
			},
		};
	}

	// REFRESH ACCESS TOKEN
	static async refresh(refreshToken: string) {
		try {
			// verify JWT
			jwt.verify(refreshToken, JWT_REFRESH_SECRET);

			const stored = await prisma.refreshToken.findUnique({
				where: { token: refreshToken },
				include: { user: true },
			});

			if (!stored) throw new Error("Invalid refresh token");

			if (stored.expiresAt < new Date()) {
				throw new Error("Refresh token expired");
			}

			const newAccessToken = this.generateAccessToken(stored.user);

			return {
				accessToken: newAccessToken,
			};
		} catch (err) {
			throw new Error("Invalid or expired refresh token");
		}
	}

	// LOGOUT (BONUS - BEST PRACTICE)
	static async logout(refreshToken: string) {
		await prisma.refreshToken.delete({
			where: { token: refreshToken },
		});

		return { message: "Logged out successfully" };
	}
}
