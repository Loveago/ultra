import { z } from "zod";

export const addCartItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().min(1).max(99),
  addons: z.array(
    z.object({
      addonId: z.string().uuid(),
      name: z.string(),
      price: z.number().min(0),
    })
  ).default([]),
  note: z.string().max(500).optional(),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1).max(99).optional(),
  addons: z.array(
    z.object({
      addonId: z.string().uuid(),
      name: z.string(),
      price: z.number().min(0),
    })
  ).optional(),
  note: z.string().max(500).optional(),
});

export const applyPromoSchema = z.object({
  code: z.string().min(1).max(50),
});

export const saveCartSchema = z.object({
  name: z.string().min(1).max(100),
});

export const estimateSchema = z.object({
  addressId: z.string().uuid().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type ApplyPromoInput = z.infer<typeof applyPromoSchema>;
export type SaveCartInput = z.infer<typeof saveCartSchema>;
export type EstimateInput = z.infer<typeof estimateSchema>;
