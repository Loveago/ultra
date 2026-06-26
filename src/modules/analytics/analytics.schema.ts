import { z } from "zod";

export const analyticsDateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const merchantAnalyticsSchema = z.object({
  merchantId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type AnalyticsDateRangeInput = z.infer<typeof analyticsDateRangeSchema>;
export type MerchantAnalyticsInput = z.infer<typeof merchantAnalyticsSchema>;
