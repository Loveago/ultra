import type { Request, Response } from "express";
import {
  applyReferral,
  createCoupon,
  createPromotion,
  generateReferralCode,
  getActivePromotions,
  getLoyaltyBalance,
  listCashbackTransactions,
  listCoupons,
  listLoyaltyTransactions,
  listPromotions,
  validateCoupon,
} from "./marketing.service";

export async function createCouponController(req: Request, res: Response): Promise<void> {
  const data = await createCoupon(req.body);
  res.status(201).json({ success: true, data });
}

export async function validateCouponController(req: Request, res: Response): Promise<void> {
  const data = await validateCoupon(req.auth!.userId, req.body);
  res.status(200).json({ success: true, data });
}

export async function listCouponsController(req: Request, res: Response): Promise<void> {
  const data = await listCoupons({
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 20,
    isActive: req.query.isActive ? req.query.isActive === "true" : undefined,
  });
  res.status(200).json({ success: true, data });
}

export async function createPromotionController(req: Request, res: Response): Promise<void> {
  const data = await createPromotion(req.body);
  res.status(201).json({ success: true, data });
}

export async function listPromotionsController(req: Request, res: Response): Promise<void> {
  const data = await listPromotions({
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 20,
    isActive: req.query.isActive ? req.query.isActive === "true" : undefined,
  });
  res.status(200).json({ success: true, data });
}

export async function activePromotionsController(_req: Request, res: Response): Promise<void> {
  const data = await getActivePromotions();
  res.status(200).json({ success: true, data });
}

export async function generateReferralCodeController(req: Request, res: Response): Promise<void> {
  const data = await generateReferralCode(req.auth!.userId);
  res.status(200).json({ success: true, data });
}

export async function applyReferralController(req: Request, res: Response): Promise<void> {
  const data = await applyReferral(req.auth!.userId, req.body);
  res.status(200).json({ success: true, data });
}

export async function loyaltyBalanceController(req: Request, res: Response): Promise<void> {
  const data = await getLoyaltyBalance(req.auth!.userId);
  res.status(200).json({ success: true, data });
}

export async function loyaltyTransactionsController(req: Request, res: Response): Promise<void> {
  const data = await listLoyaltyTransactions(
    req.auth!.userId,
    req.query.page ? Number(req.query.page) : 1,
    req.query.limit ? Number(req.query.limit) : 20,
  );
  res.status(200).json({ success: true, data });
}

export async function cashbackTransactionsController(req: Request, res: Response): Promise<void> {
  const data = await listCashbackTransactions(
    req.auth!.userId,
    req.query.page ? Number(req.query.page) : 1,
    req.query.limit ? Number(req.query.limit) : 20,
  );
  res.status(200).json({ success: true, data });
}
