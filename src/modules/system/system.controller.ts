import type { Request, Response } from "express";
import { echoMessage } from "./system.service";

/**
 * @openapi
 * /api/v1/system/echo:
 *   post:
 *     tags: [System]
 *     summary: Validate and echo payload
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *             required: [message]
 *     responses:
 *       200:
 *         description: Echo response
 */
export function echoController(req: Request, res: Response): void {
  const result = echoMessage(req.body);
  res.status(200).json({ success: true, data: result });
}
