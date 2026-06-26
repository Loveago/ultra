import { z } from "zod";

export const createReviewSchema = z.object({
  targetType: z.enum(["PRODUCT", "STORE", "RIDER"]),
  targetId: z.string().uuid(),
  orderId: z.string().uuid().optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  comment: z.string().max(5000).optional(),
  images: z.array(z.string().url()).max(5).default([]),
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().max(200).optional(),
  comment: z.string().max(5000).optional(),
  images: z.array(z.string().url()).max(5).optional(),
});

export const replyReviewSchema = z.object({
  reply: z.string().min(1).max(2000),
});

export const moderateReviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "FLAGGED"]),
  reason: z.string().max(500).optional(),
});

export const listReviewsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  targetType: z.enum(["PRODUCT", "STORE", "RIDER"]).optional(),
  targetId: z.string().uuid().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "FLAGGED"]).optional(),
  sortBy: z.enum(["createdAt", "rating", "helpfulCount"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type ReplyReviewInput = z.infer<typeof replyReviewSchema>;
export type ModerateReviewInput = z.infer<typeof moderateReviewSchema>;
export type ListReviewsInput = z.infer<typeof listReviewsSchema>;
