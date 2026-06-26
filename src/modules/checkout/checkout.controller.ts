import type { Request, Response } from "express";
import {
  createOrder,
  getDeliveryOptions,
  initiateCheckout,
  validateCheckout,
} from "./checkout.service";

export async function initiateCheckoutController(req: Request, res: Response): Promise<void> {
  const data = await initiateCheckout(req.auth!.userId, req.body);
  res.status(200).json({ success: true, data });
}

export async function deliveryOptionsController(req: Request, res: Response): Promise<void> {
  const data = await getDeliveryOptions(req.auth!.userId, {
    addressId: req.query.addressId as string | undefined,
    latitude: req.query.latitude ? Number(req.query.latitude) : undefined,
    longitude: req.query.longitude ? Number(req.query.longitude) : undefined,
  });
  res.status(200).json({ success: true, data });
}

export async function validateCheckoutController(req: Request, res: Response): Promise<void> {
  const data = await validateCheckout(req.auth!.userId, req.body);
  res.status(200).json({ success: true, data });
}

export async function createOrderController(req: Request, res: Response): Promise<void> {
  const data = await createOrder(req.auth!.userId, req.body);
  res.status(201).json({ success: true, data });
}
