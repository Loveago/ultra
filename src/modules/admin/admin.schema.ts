import { z } from "zod";

export const adminListUsersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  role: z.enum(["CUSTOMER", "MERCHANT", "RIDER", "ADMIN", "SUPER_ADMIN"]).optional(),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

export const adminUpdateUserSchema = z.object({
  role: z.enum(["CUSTOMER", "MERCHANT", "RIDER", "ADMIN", "SUPER_ADMIN"]).optional(),
  isActive: z.boolean().optional(),
});

export const adminListMerchantsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  isVerified: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

export const adminUpdateMerchantSchema = z.object({
  isVerified: z.boolean().optional(),
  commissionRate: z.number().min(0).max(1).optional(),
});

export const adminListRidersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "SUSPENDED"]).optional(),
});

export const adminUpdateRiderSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "SUSPENDED"]).optional(),
  isOnline: z.boolean().optional(),
});

export type AdminListUsersInput = z.infer<typeof adminListUsersSchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
export type AdminListMerchantsInput = z.infer<typeof adminListMerchantsSchema>;
export type AdminUpdateMerchantInput = z.infer<typeof adminUpdateMerchantSchema>;
export type AdminListRidersInput = z.infer<typeof adminListRidersSchema>;
export type AdminUpdateRiderInput = z.infer<typeof adminUpdateRiderSchema>;
