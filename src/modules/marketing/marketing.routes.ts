import { Router } from "express";
import { authenticate } from "../../common/middleware/authenticate";
import { authorize } from "../../common/middleware/authorize";
import { validateBody } from "../../common/middleware/validate";
import {
  activePromotionsController,
  applyReferralController,
  cashbackTransactionsController,
  createCouponController,
  createPromotionController,
  generateReferralCodeController,
  listCouponsController,
  listPromotionsController,
  loyaltyBalanceController,
  loyaltyTransactionsController,
  validateCouponController,
} from "./marketing.controller";
import {
  applyReferralSchema,
  createCouponSchema,
  createPromotionSchema,
  validateCouponSchema,
} from "./marketing.schema";

export const marketingRoutes = Router();

marketingRoutes.use(authenticate);

// Public (authenticated) — promotions
marketingRoutes.get("/marketing/promotions/active", activePromotionsController);

// Coupons — validate (user)
marketingRoutes.post("/marketing/coupons/validate", validateBody(validateCouponSchema), validateCouponController);

// Referral
marketingRoutes.post("/marketing/referral/generate", generateReferralCodeController);
marketingRoutes.post("/marketing/referral/apply", validateBody(applyReferralSchema), applyReferralController);

// Loyalty & Cashback
marketingRoutes.get("/marketing/loyalty/balance", loyaltyBalanceController);
marketingRoutes.get("/marketing/loyalty/transactions", loyaltyTransactionsController);
marketingRoutes.get("/marketing/cashback/transactions", cashbackTransactionsController);

// Admin — coupons
marketingRoutes.get("/marketing/coupons", authorize(["ADMIN", "SUPER_ADMIN"]), listCouponsController);
marketingRoutes.post("/marketing/coupons", authorize(["ADMIN", "SUPER_ADMIN"]), validateBody(createCouponSchema), createCouponController);

// Admin — promotions
marketingRoutes.get("/marketing/promotions", authorize(["ADMIN", "SUPER_ADMIN"]), listPromotionsController);
marketingRoutes.post("/marketing/promotions", authorize(["ADMIN", "SUPER_ADMIN"]), validateBody(createPromotionSchema), createPromotionController);
