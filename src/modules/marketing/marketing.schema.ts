import { z } from "zod";

export const createCouponSchema = z.object({
  code: z.string().min(3).max(50).toUpperCase(),
  type: z.enum(["PERCENTAGE", "FIXED_AMOUNT", "FREE_DELIVERY"]),
  value: z.number().min(0),
  minOrderAmount: z.number().min(0).default(0),
  maxDiscount: z.number().min(0).optional(),
  usageLimit: z.number().int().min(1).optional(),
  perUserLimit: z.number().int().min(1).default(1),
  storeId: z.string().uuid().optional(),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime(),
});

export const validateCouponSchema = z.object({
  code: z.string().min(3).max(50),
  orderAmount: z.number().min(0),
  storeId: z.string().uuid().optional(),
});

export const createPromotionSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  bannerUrl: z.string().url().optional(),
  storeId: z.string().uuid().optional(),
  productIds: z.array(z.string().uuid()).default([]),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT", "FREE_DELIVERY"]),
  discountValue: z.number().min(0),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
});

export const applyReferralSchema = z.object({
  code: z.string().min(3).max(50),
});

export const listCouponsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  isActive: z.coerce.boolean().optional(),
});

export const listPromotionsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  isActive: z.coerce.boolean().optional(),
});

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;
export type CreatePromotionInput = z.infer<typeof createPromotionSchema>;
export type ApplyReferralInput = z.infer<typeof applyReferralSchema>;
export type ListCouponsInput = z.infer<typeof listCouponsSchema>;
export type ListPromotionsInput = z.infer<typeof listPromotionsSchema>;
