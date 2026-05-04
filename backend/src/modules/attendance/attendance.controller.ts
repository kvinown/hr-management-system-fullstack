import { Response } from "express";
import { AttendanceService } from "./attendance.service";
import { AuthRequest } from "../../middlewares/auth.middleware";

export class AttendanceController {
	static async clockIn(req: AuthRequest, res: Response) {
		console.log("USER:", req.user);
		try {
			const data = await AttendanceService.clockIn(req.user.id);
			res.json(data);
		} catch (err: any) {
			res.status(400).json({ error: err.message });
		}
	}

	static async clockOut(req: AuthRequest, res: Response) {
		try {
			const data = await AttendanceService.clockOut(req.user.id);
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
}
