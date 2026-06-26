import { z } from "zod";

export const recommendationsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
  storeId: z.string().uuid().optional(),
});

export const demandForecastSchema = z.object({
  storeId: z.string().uuid().optional(),
  days: z.coerce.number().int().min(1).max(90).default(7),
});

export const smartSearchSchema = z.object({
  query: z.string().min(1).max(200),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  storeId: z.string().uuid().optional(),
});

export type RecommendationsInput = z.infer<typeof recommendationsSchema>;
export type DemandForecastInput = z.infer<typeof demandForecastSchema>;
export type SmartSearchInput = z.infer<typeof smartSearchSchema>;
