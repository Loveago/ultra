import type { Request, Response } from "express";
import {
  createReview,
  deleteReview,
  getReview,
  getReviewSummary,
  listReviews,
  markHelpful,
  moderateReview,
  replyToReview,
  updateReview,
} from "./review.service";

export async function createReviewController(req: Request, res: Response): Promise<void> {
  const data = await createReview(req.auth!.userId, req.body);
  res.status(201).json({ success: true, data });
}

export async function updateReviewController(req: Request, res: Response): Promise<void> {
  const data = await updateReview(req.auth!.userId, req.params.id, req.body);
  res.status(200).json({ success: true, data });
}

export async function deleteReviewController(req: Request, res: Response): Promise<void> {
  const data = await deleteReview(req.auth!.userId, req.params.id);
  res.status(200).json({ success: true, data });
}

export async function listReviewsController(req: Request, res: Response): Promise<void> {
  const data = await listReviews({
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 20,
    targetType: req.query.targetType as "PRODUCT" | "STORE" | "RIDER" | undefined,
    targetId: req.query.targetId as string | undefined,
    rating: req.query.rating ? Number(req.query.rating) : undefined,
    status: req.query.status as "PENDING" | "APPROVED" | "REJECTED" | "FLAGGED" | undefined,
    sortBy: (req.query.sortBy as "createdAt" | "rating" | "helpfulCount") || "createdAt",
    sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
  });
  res.status(200).json({ success: true, data });
}

export async function getReviewController(req: Request, res: Response): Promise<void> {
  const data = await getReview(req.params.id);
  res.status(200).json({ success: true, data });
}

export async function replyReviewController(req: Request, res: Response): Promise<void> {
  const data = await replyToReview(req.auth!.userId, req.params.id, req.body);
  res.status(200).json({ success: true, data });
}

export async function moderateReviewController(req: Request, res: Response): Promise<void> {
  const data = await moderateReview(req.auth!.userId, req.params.id, req.body);
  res.status(200).json({ success: true, data });
}

export async function markHelpfulController(req: Request, res: Response): Promise<void> {
  const data = await markHelpful(req.params.id);
  res.status(200).json({ success: true, data });
}

export async function reviewSummaryController(req: Request, res: Response): Promise<void> {
  const data = await getReviewSummary(
    req.params.targetType,
    req.params.targetId,
  );
  res.status(200).json({ success: true, data });
}
