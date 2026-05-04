import { Request, Response } from "express";
import { DashboardService } from "./dashboard.service";

export class DashboardController {
	static async getSummary(req: Request, res: Response) {
		try {
			const data = await DashboardService.getSummary();
			res.json(data);
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	}
}
