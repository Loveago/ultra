import { z } from "zod";

export const productSearchSchema = z.object({
  q: z.string().min(1).max(200),
  storeId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  sortBy: z.enum(["relevance", "price_asc", "price_desc", "rating", "newest"]).default("relevance"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const storeSearchSchema = z.object({
  q: z.string().min(1).max(200),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const globalSearchSchema = z.object({
  q: z.string().min(1).max(200),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

export const trendingSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  categoryId: z.string().uuid().optional(),
});

export const recommendationsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type ProductSearchInput = z.infer<typeof productSearchSchema>;
export type StoreSearchInput = z.infer<typeof storeSearchSchema>;
export type GlobalSearchInput = z.infer<typeof globalSearchSchema>;
export type TrendingInput = z.infer<typeof trendingSchema>;
export type RecommendationsInput = z.infer<typeof recommendationsSchema>;
