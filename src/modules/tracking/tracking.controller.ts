import type { Request, Response } from "express";
import { getDeliveryTracking, getOrderTracking } from "./tracking.service";

export async function getDeliveryTrackingController(req: Request, res: Response): Promise<void> {
  const data = await getDeliveryTracking(req.params.assignmentId);
  res.status(200).json({ success: true, data });
}

export async function getOrderTrackingController(req: Request, res: Response): Promise<void> {
  const data = await getOrderTracking(req.params.orderId);
  res.status(200).json({ success: true, data });
}
