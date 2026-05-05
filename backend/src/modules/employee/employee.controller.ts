import { Request, Response } from "express";
import { EmployeeService } from "./employee.service";

export class EmployeeController {
	static async create(req: Request, res: Response) {
		try {
			const employee = await EmployeeService.create(req.body);

			res.json(employee);
		} catch (error: any) {
			res.status(400).json({ error: error.message });
		}
	}

	static async getAll(req: Request, res: Response) {
			try {
				// 🔥 Ambil dari query URL (?page=1&limit=10&viewMode=active)
				const page = parseInt(req.query.page as string) || 1;
				const limit = parseInt(req.query.limit as string) || 10;
				const status = req.query.viewMode === "inactive" ? "RESIGNED" : "ACTIVE";
	
				const result = await EmployeeService.getAll(page, limit, status);
				res.json(result);
			} catch (error: any) {
				res.status(500).json({ error: error.message });
			}
		}

	static async getById(req: Request, res: Response) {
		const { id } = req.params;
		const data = await EmployeeService.getById(id);
		res.json(data);
	}

	static async update(req: Request, res: Response) {
		const { id } = req.params;
		const data = await EmployeeService.update(id, req.body);
		res.json(data);
	}

	static async changeStatus(req: Request, res: Response) {
			try {
				const { id } = req.params;
				const { status } = req.body; // Untuk employee, ambil `status`
	
				const result = await EmployeeService.changeStatus(id, status);
				res.json(result);
			} catch (error: any) {
				res.status(400).json({ error: error.message });
			}
		}

	static async delete(req: Request, res: Response) {
		const { id } = req.params;
		await EmployeeService.delete(id);
		res.json({ message: "Deleted" });
	}
}
