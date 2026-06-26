import { z } from "zod";

export const logAuditSchema = z.object({
  action: z.enum([
    "LOGIN", "LOGOUT", "REGISTER", "PASSWORD_CHANGE", "ROLE_CHANGE",
    "ORDER_CREATE", "ORDER_CANCEL", "PAYMENT_INIT", "PAYMENT_VERIFY",
    "WITHDRAWAL_REQUEST", "WITHDRAWAL_PROCESS", "MERCHANT_VERIFY",
    "RIDER_APPROVE", "REVIEW_MODERATE", "COUPON_CREATE", "DATA_EXPORT",
  ]),
  resource: z.string().optional(),
  resourceId: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "BLOCKED"]).default("LOW"),
});

export const registerDeviceSchema = z.object({
  fingerprint: z.string().min(8).max(256),
  deviceInfo: z.record(z.unknown()).default({}),
});

export const blockIpSchema = z.object({
  ipAddress: z.string().ip(),
  reason: z.string().max(500).optional(),
});

export const listAuditLogsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  userId: z.string().uuid().optional(),
  action: z.string().optional(),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "BLOCKED"]).optional(),
});

export const listRiskScoresSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  level: z.enum(["LOW", "MEDIUM", "HIGH", "BLOCKED"]).optional(),
  resolved: z.coerce.boolean().optional(),
});

export type LogAuditInput = z.infer<typeof logAuditSchema>;
export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>;
export type BlockIpInput = z.infer<typeof blockIpSchema>;
export type ListAuditLogsInput = z.infer<typeof listAuditLogsSchema>;
export type ListRiskScoresInput = z.infer<typeof listRiskScoresSchema>;
