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
		try {
			// 🔥 Ambil dari query URL (?page=1&limit=10&viewMode=active)
			const page = parseInt(req.query.page as string) || 1;
			const limit = parseInt(req.query.limit as string) || 10;
			const isActive = req.query.viewMode === "inactive" ? false : true;

			const result = await DepartmentService.getAll(page, limit, isActive);
			res.json(result);
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	}

	static async update(req: Request, res: Response) {
		const { id } = req.params;
		const { name } = req.body;
		const data = await DepartmentService.update(id, name);
		res.json(data);
	}

	static async changeStatus(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const { isActive } = req.body; // Untuk employee, ambil `status`

			const result = await DepartmentService.changeStatus(id, isActive);
			res.json(result);
		} catch (error: any) {
			res.status(400).json({ error: error.message });
		}
	}

	static async delete(req: Request, res: Response) {
		const { id } = req.params;
		await DepartmentService.delete(id);
		res.json({ message: "Deleted" });
	}
}
