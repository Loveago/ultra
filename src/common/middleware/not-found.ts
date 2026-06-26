import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

export function notFoundHandler(req: Request, res: Response): void {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: "Resource not found",
    path: req.path,
  });
}
