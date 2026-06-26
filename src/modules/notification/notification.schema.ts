import { z } from "zod";

export const sendNotificationSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum([
    "ORDER_STATUS", "PAYMENT_SUCCESS", "PAYMENT_FAILED", "DELIVERY_UPDATE",
    "NEW_MESSAGE", "PROMOTION", "REVIEW_REQUEST", "SYSTEM",
    "ORDER_ASSIGNED", "ESCROW_RELEASED", "SETTLEMENT_COMPLETED",
  ]),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(2000),
  data: z.record(z.unknown()).default({}),
  channels: z.array(z.enum(["PUSH", "SMS", "EMAIL", "IN_APP"])).min(1).default(["IN_APP"]),
});

export const updatePreferencesSchema = z.object({
  pushEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
  fcmToken: z.string().nullable().optional(),
});

export const listNotificationsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  unreadOnly: z.coerce.boolean().default(false),
});

export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
export type ListNotificationsInput = z.infer<typeof listNotificationsSchema>;
