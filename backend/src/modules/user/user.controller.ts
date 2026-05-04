import { Request, Response } from "express";
import { UserService } from "./user.service";

export class UserController {
	static async getAll(req: Request, res: Response) {
		try {
			const users = await UserService.getAll();
			res.json(users);
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	}

	static async getById(req: Request, res: Response) {
		try {
			const user = await UserService.getById(req.params.id);
			res.json(user);
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	}
}
