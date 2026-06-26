import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { AppError } from "../errors/app-error";

type AccessTokenPayload = {
  sub: string;
  role: UserRole;
};

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next(new AppError("Unauthorized", StatusCodes.UNAUTHORIZED));
    return;
  }

  const token = authHeader.replace("Bearer ", "").trim();

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
    req.auth = {
      userId: payload.sub,
      role: payload.role,
    };
    next();
  } catch {
    next(new AppError("Invalid or expired access token", StatusCodes.UNAUTHORIZED));
  }
}
