import { Response } from "express";
import { AttendanceService } from "./attendance.service";
import { AuthRequest } from "../../middlewares/auth.middleware";

export class AttendanceController {
	static async clockIn(req: AuthRequest, res: Response) {
		try {
			const { lat, lng, photo } = req.body; // 🔥 Foto diambil dari sini
			if (!lat || !lng) throw new Error("Location data is required");

			const data = await AttendanceService.clockIn(req.user.id, lat, lng, photo);
			res.json(data);
		} catch (err: any) {
			res.status(400).json({ error: err.message });
		}
	}

	static async clockOut(req: AuthRequest, res: Response) {
		try {
			const { lat, lng, photo } = req.body;
			if (!lat || !lng) throw new Error("Location data is required");

			const data = await AttendanceService.clockOut(req.user.id, lat, lng, photo);
			res.json(data);
		} catch (err: any) {
			res.status(400).json({ error: err.message });
		}
	}

	static async getAttendance(req: AuthRequest, res: Response) {
		try {
			const result = await AttendanceService.getAttendance(req.user, req.query);
			res.json(result);
		} catch (error: any) {
			res.status(400).json({ error: error.message });
		}
	}

	static async getHistory(req: any, res: any) {
		try {
			const userId = req.user.id;
			const data = await AttendanceService.getHistory(userId);
			res.json(data);
		} catch (err: any) {
			res.status(400).json({ error: err.message });
		}
	}

	static async getAll(req: AuthRequest, res: Response) {
		try {
			const { startDate, endDate, page, limit } = req.query;
			const user = (req as any).user;

			const result = await AttendanceService.getAll(startDate as string, endDate as string, Number(page) || 1, Number(limit) || 10, user);

			res.json(result);
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	}
}
