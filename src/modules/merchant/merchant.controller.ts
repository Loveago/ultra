import type { Request, Response } from "express";
import {
  getKycStatus,
  getMerchantDashboard,
  getMyMerchant,
  registerMerchant,
  reviewKycDocument,
  uploadKycDocument,
} from "./merchant.service";

export async function registerMerchantController(req: Request, res: Response): Promise<void> {
  const data = await registerMerchant(req.auth!.userId, req.body);
  res.status(201).json({ success: true, data });
}

export async function getMyMerchantController(req: Request, res: Response): Promise<void> {
  const data = await getMyMerchant(req.auth!.userId);
  res.status(200).json({ success: true, data });
}

export async function uploadKycController(req: Request, res: Response): Promise<void> {
  const data = await uploadKycDocument(req.auth!.userId, req.body);
  res.status(201).json({ success: true, data });
}

export async function getKycStatusController(req: Request, res: Response): Promise<void> {
  const data = await getKycStatus(req.auth!.userId);
  res.status(200).json({ success: true, data });
}

export async function reviewKycController(req: Request, res: Response): Promise<void> {
  const data = await reviewKycDocument(req.params.id, req.body, req.auth!.userId);
  res.status(200).json({ success: true, data });
}

export async function dashboardController(req: Request, res: Response): Promise<void> {
  const data = await getMerchantDashboard(req.auth!.userId);
  res.status(200).json({ success: true, data });
}
