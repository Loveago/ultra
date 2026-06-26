import { z } from "zod";

const validStatuses = ["PENDING", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"] as const;

export const updateOrderStatusSchema = z.object({
  status: z.enum(validStatuses),
  reason: z.string().max(500).optional(),
  note: z.string().max(500).optional(),
});

export const updateStoreGroupStatusSchema = z.object({
  status: z.enum(validStatuses),
  reason: z.string().max(500).optional(),
  note: z.string().max(500).optional(),
});

export const cancelOrderSchema = z.object({
  reason: z.string().min(1).max(500),
  note: z.string().max(500).optional(),
});

export const listOrdersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.enum(validStatuses).optional(),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type UpdateStoreGroupStatusInput = z.infer<typeof updateStoreGroupStatusSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type ListOrdersInput = z.infer<typeof listOrdersSchema>;
