import type { Request, Response } from "express";
import { getHealthStatus } from "./health.service";

/**
 * @openapi
 * /api/v1/health:
 *   get:
 *     tags: [Health]
 *     summary: Health check endpoint
 *     responses:
 *       200:
 *         description: Service health status
 */
export async function healthController(_req: Request, res: Response): Promise<void> {
  const status = await getHealthStatus();
  res.status(200).json({ success: true, data: status });
}
