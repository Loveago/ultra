import { z } from "zod";

export const initializePaystackSchema = z.object({
  orderId: z.string().uuid(),
  callbackUrl: z.string().url().optional(),
});

export const verifyPaystackSchema = z.object({
  reference: z.string().min(1),
});

export const walletPaySchema = z.object({
  orderId: z.string().uuid(),
});

export const refundSchema = z.object({
  paymentId: z.string().uuid(),
  amount: z.number().min(0).optional(),
  reason: z.string().max(500).optional(),
});

export const releaseEscrowSchema = z.object({
  storeGroupId: z.string().uuid(),
});

export const processSettlementsSchema = z.object({
  storeGroupId: z.string().uuid().optional(),
});

export type InitializePaystackInput = z.infer<typeof initializePaystackSchema>;
export type VerifyPaystackInput = z.infer<typeof verifyPaystackSchema>;
export type WalletPayInput = z.infer<typeof walletPaySchema>;
export type RefundInput = z.infer<typeof refundSchema>;
export type ReleaseEscrowInput = z.infer<typeof releaseEscrowSchema>;
export type ProcessSettlementsInput = z.infer<typeof processSettlementsSchema>;
