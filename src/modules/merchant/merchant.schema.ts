import { z } from "zod";

export const registerMerchantSchema = z.object({
  businessName: z.string().min(2).max(200),
  businessType: z.enum([
    "SOLE_PROPRIETOR",
    "PARTNERSHIP",
    "LLC",
    "CORPORATION",
    "COOPERATIVE",
    "NON_PROFIT",
  ]),
  registrationNumber: z.string().max(100).optional(),
  taxId: z.string().max(100).optional(),
});

export const uploadKycSchema = z.object({
  documentType: z.enum([
    "BUSINESS_REGISTRATION",
    "TAX_CERTIFICATE",
    "ID_CARD",
    "UTILITY_BILL",
    "BANK_STATEMENT",
    "OPERATING_LICENSE",
  ]),
  fileUrl: z.string().url(),
});

export const reviewKycSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  rejectionReason: z.string().max(500).optional(),
});

export const createStoreSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().max(2000).optional(),
  logoUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
});

export const updateStoreSchema = createStoreSchema.partial().omit({ slug: true });

export const createBranchSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().max(100).default("Nigeria"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isMainBranch: z.boolean().default(false),
});

export const updateBranchSchema = createBranchSchema.partial();

export const setOperatingHoursSchema = z.object({
  hours: z.array(
    z.object({
      dayOfWeek: z.enum([
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
        "SUNDAY",
      ]),
      openTime: z.string().regex(/^\d{2}:\d{2}$/),
      closeTime: z.string().regex(/^\d{2}:\d{2}$/),
      isClosed: z.boolean().default(false),
    })
  ),
});

export const createDeliveryZoneSchema = z.object({
  name: z.string().min(1).max(100),
  deliveryFee: z.number().min(0).default(0),
  estimatedDeliveryMin: z.number().int().min(0).default(30),
  minOrderAmount: z.number().min(0).default(0),
  radiusKm: z.number().min(0.1).max(100),
  latitude: z.number(),
  longitude: z.number(),
});

export type RegisterMerchantInput = z.infer<typeof registerMerchantSchema>;
export type UploadKycInput = z.infer<typeof uploadKycSchema>;
export type ReviewKycInput = z.infer<typeof reviewKycSchema>;
export type CreateStoreInput = z.infer<typeof createStoreSchema>;
export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;
export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;
export type SetOperatingHoursInput = z.infer<typeof setOperatingHoursSchema>;
export type CreateDeliveryZoneInput = z.infer<typeof createDeliveryZoneSchema>;
