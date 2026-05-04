import { Request, Response } from "express";
import { DepartmentService } from "./department.service";

export class DepartmentController {
	static async create(req: Request, res: Response) {
		try {
			const { name } = req.body;
			const data = await DepartmentService.create(name);
			res.json(data);
		} catch (err: any) {
			res.status(400).json({ error: err.message });
		}
	}

	static async getAll(req: Request, res: Response) {
		const data = await DepartmentService.getAll();
		res.json(data);
	}

	static async update(req: Request, res: Response) {
		const { id } = req.params;
		const { name } = req.body;
		const data = await DepartmentService.update(id, name);
		res.json(data);
	}

	static async delete(req: Request, res: Response) {
		const { id } = req.params;
		await DepartmentService.delete(id);
		res.json({ message: "Deleted" });
	}
}
