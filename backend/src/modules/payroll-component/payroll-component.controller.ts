import { Request, Response } from "express";
import { PayrollComponentService } from "./payroll-component.service";

export class PayrollComponentController {
	static async getAll(req: Request, res: Response) {
		try {
			const data = await PayrollComponentService.getAll();
			res.json({ data });
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	}

	static async create(req: Request, res: Response) {
		try {
			const data = await PayrollComponentService.create(req.body);
			res.status(201).json(data);
		} catch (error: any) {
			res.status(400).json({ error: error.message });
		}
	}

	static async update(req: Request, res: Response) {
		try {
			const data = await PayrollComponentService.update(req.params.id, req.body);
			res.json(data);
		} catch (error: any) {
			res.status(400).json({ error: error.message });
		}
	}

	static async delete(req: Request, res: Response) {
		try {
			await PayrollComponentService.delete(req.params.id);
			res.json({ message: "Component deleted" });
		} catch (error: any) {
			res.status(400).json({ error: error.message });
		}
	}
}
