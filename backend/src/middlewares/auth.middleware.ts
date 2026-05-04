import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export interface AuthRequest extends Request {
	user?: any;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
	try {
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return res.status(401).json({ error: "Unauthorized" });
		}

		const token = authHeader.split(" ")[1];

		const decoded = jwt.verify(token, JWT_SECRET);

		req.user = decoded;

		next();
	} catch (error) {
		return res.status(401).json({ error: "Invalid or expired token" });
	}
};
