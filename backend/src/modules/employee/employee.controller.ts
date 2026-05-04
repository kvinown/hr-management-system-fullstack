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
		const data = await EmployeeService.getAll();
		res.json(data);
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

	static async delete(req: Request, res: Response) {
		const { id } = req.params;
		await EmployeeService.delete(id);
		res.json({ message: "Deleted" });
	}
}
