import { Request, Response } from "express";
import { AuthService } from "./auth.service";

export class AuthController {
	static async register(req: Request, res: Response) {
		try {
			// 🔥 Tambahkan destructuring 'name'
			const { name, email, password, role } = req.body;

			// 🔥 Kirim parameter name
			const user = await AuthService.register(name, email, password, role);

			res.json({ message: "User created", user });
		} catch (error: any) {
			res.status(400).json({ error: error.message });
		}
	}

	static async login(req: Request, res: Response) {
		try {
			const { email, password } = req.body;

			const result = await AuthService.login(email, password);

			res.json(result);
		} catch (error: any) {
			res.status(400).json({ error: error.message });
		}
	}

	static async refresh(req: Request, res: Response) {
		try {
			const { refreshToken } = req.body;

			const result = await AuthService.refresh(refreshToken);

			res.json(result);
		} catch (error: any) {
			res.status(401).json({ error: error.message });
		}
	}

	static async logout(req: Request, res: Response) {
		try {
			const { refreshToken } = req.body;

			await AuthService.logout(refreshToken);

			res.json({ message: "Logged out successfully" });
		} catch (error: any) {
			res.status(400).json({ error: error.message });
		}
	}
}
