import { Request, Response } from "express";
import { LeaveService } from "./leave.service";

export class LeaveController {
	static async create(req: Request, res: Response) {
		try {
			const user = (req as any).user; // Diambil dari middleware token
			const result = await LeaveService.create(user.id, req.body);
			res.status(201).json(result);
		} catch (error: any) {
			res.status(400).json({ error: error.message });
		}
	}

	static async getAll(req: Request, res: Response) {
		try {
			const user = (req as any).user;
			const { page, limit } = req.query;

			const result = await LeaveService.getAll(user, Number(page) || 1, Number(limit) || 10);
			res.json(result);
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	}

	static async updateStatus(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const { status } = req.body; // "APPROVED" atau "REJECTED"
			const user = (req as any).user; // HR yang sedang login

			const result = await LeaveService.updateStatus(id, status, user.name);
			res.json(result);
		} catch (error: any) {
			res.status(400).json({ error: error.message });
		}
	}
}
