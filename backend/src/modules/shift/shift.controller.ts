import { Request, Response } from "express";
import { ShiftService } from "./shift.service";

export class ShiftController {
	static async create(req: Request, res: Response) {
		try {
			const data = await ShiftService.create(req.body);
			res.json(data);
		} catch (err: any) {
			res.status(400).json({ error: err.message });
		}
	}

	static async getAll(req: Request, res: Response) {
		const data = await ShiftService.getAll();
		res.json(data);
	}

	static async update(req: Request, res: Response) {
		const { id } = req.params;
		const data = await ShiftService.update(id, req.body);
		res.json(data);
	}

	static async delete(req: Request, res: Response) {
		const { id } = req.params;
		await ShiftService.delete(id);
		res.json({ message: "Deleted" });
	}
}
