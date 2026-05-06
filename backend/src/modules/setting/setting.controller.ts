import { Request, Response } from "express";
import { SettingService } from "./setting.service";

export class SettingController {
	static async getAll(req: Request, res: Response) {
		try {
			const data = await SettingService.getAll();
			res.json({ data });
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	}

	static async updateBulk(req: Request, res: Response) {
		try {
			const { updates } = req.body; // Expect array: [{ key: "...", value: "..." }]

			if (!Array.isArray(updates)) {
				return res.status(400).json({ error: "Invalid data format. Expected an array of updates." });
			}

			const result = await SettingService.updateBulk(updates);
			res.json(result);
		} catch (error: any) {
			res.status(400).json({ error: error.message });
		}
	}
}
