import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ZodError } from "zod";
import { logger } from "../../config/logger";
import { AppError } from "../errors/app-error";

export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      details: error.details,
      path: req.path,
    });
    return;
  }

  if (error instanceof ZodError) {
    const zodError = error as ZodError;
    res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
      success: false,
      message: "Validation failed",
      details: zodError.flatten(),
      path: req.path,
    });
    return;
  }

  logger.error({ error, path: req.path }, "Unhandled error");

  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: "Internal server error",
    path: req.path,
  });
}
