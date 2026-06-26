import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../errors/app-error";

export function authorize(roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      next(new AppError("Unauthorized", StatusCodes.UNAUTHORIZED));
      return;
    }

    if (!roles.includes(req.auth.role)) {
      next(new AppError("Forbidden", StatusCodes.FORBIDDEN));
      return;
    }

    next();
  };
}
