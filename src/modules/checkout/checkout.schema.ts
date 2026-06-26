import { z } from "zod";

export const initiateCheckoutSchema = z.object({
  deliveryAddressId: z.string().uuid().optional(),
  deliveryOption: z.enum(["STANDARD", "EXPRESS", "SCHEDULED", "PICKUP"]).default("STANDARD"),
  scheduledFor: z.string().datetime().optional(),
  note: z.string().max(500).optional(),
});

export const deliveryOptionsSchema = z.object({
  addressId: z.string().uuid().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const validateCheckoutSchema = z.object({
  deliveryAddressId: z.string().uuid(),
  deliveryOption: z.enum(["STANDARD", "EXPRESS", "SCHEDULED", "PICKUP"]),
  scheduledFor: z.string().datetime().optional(),
  paymentMethod: z.enum(["PAYSTACK", "WALLET", "CASH_ON_DELIVERY"]),
  note: z.string().max(500).optional(),
});

export const createOrderSchema = z.object({
  deliveryAddressId: z.string().uuid(),
  deliveryOption: z.enum(["STANDARD", "EXPRESS", "SCHEDULED", "PICKUP"]),
  scheduledFor: z.string().datetime().optional(),
  paymentMethod: z.enum(["PAYSTACK", "WALLET", "CASH_ON_DELIVERY"]),
  note: z.string().max(500).optional(),
});

export type InitiateCheckoutInput = z.infer<typeof initiateCheckoutSchema>;
export type DeliveryOptionsInput = z.infer<typeof deliveryOptionsSchema>;
export type ValidateCheckoutInput = z.infer<typeof validateCheckoutSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
