import jwt from 'jsonwebtoken';
import { NextFunction, Request, Response } from "express";

// Rozszerzenie typu Request o pole user i patient id
declare module 'express-serve-static-core' {
	interface Request {
		user?: {
			id: string;
			role: string;
			doctorId?: string;
			patientId?: string;
			iat: number;
			exp: number;
		};
	}
}

interface DecodedToken {
	id: string;
	role: string;
	doctorId?: string;
	patientId?: string;
	iat: number;
	exp: number;
}

export const verifyToken = (request: Request, response: Response, next: NextFunction): void => {
	const authHeader = request.headers.authorization;
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		response.status(401).json({ message: "Access denied. No token provided." });
		return;
	}

	// Sprawdzenie czy JWT_SECRET istnieje
	if (!process.env.JWT_SECRET) {
		response.status(500).json({ message: "JWT_SECRET is not configured" });
		return;
	}

	// pobierany sam token bez 'Bearer '
	const token = authHeader.split(' ')[1];
	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET) as DecodedToken;

		//doklejanie usera do obiektu request
		request.user = decoded;
		next();
	} catch {
		response.status(401).json({ message: "Invalid token." });
		return;
	}
}

export const authorizeRoles = (...allowedRoles: string[]) => {
	return (request: Request, response: Response, next: NextFunction): void => {
		if (!request.user || !allowedRoles.includes(request.user.role)) {
			response.status(403).json({ 
				message: `Access denied. Role ${request.user?.role || 'unknown'} is not authorized to access this resource.` 
			});
			return;
		}
		next();
	}
}