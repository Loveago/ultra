import { StatusCodes } from "http-status-codes";
import { prisma } from "../../infrastructure/db/prisma";
import { AppError } from "../../common/errors/app-error";
import type {
  CreateReviewInput,
  ListReviewsInput,
  ModerateReviewInput,
  ReplyReviewInput,
  UpdateReviewInput,
} from "./review.schema";

async function updateTargetRating(targetType: string, targetId: string) {
  const reviews = await prisma.review.findMany({
    where: { targetType: targetType as never, targetId, status: "APPROVED" },
    select: { rating: true },
  });

  if (reviews.length === 0) return;

  const totalRating = reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0);
  const avgRating = totalRating / reviews.length;

  if (targetType === "PRODUCT") {
    await prisma.product.update({
      where: { id: targetId },
      data: { rating: avgRating, totalRatings: reviews.length },
    });
  } else if (targetType === "STORE") {
    await prisma.store.update({
      where: { id: targetId },
      data: { rating: avgRating, totalRatings: reviews.length },
    });
  } else if (targetType === "RIDER") {
    await prisma.rider.update({
      where: { id: targetId },
      data: { rating: avgRating },
    });
  }
}

export async function createReview(userId: string, input: CreateReviewInput) {
  const existing = await prisma.review.findFirst({
    where: {
      userId,
      targetType: input.targetType as never,
      targetId: input.targetId,
      orderId: input.orderId ?? null,
    },
  });

  if (existing) {
    throw new AppError("You have already reviewed this target", StatusCodes.CONFLICT);
  }

  const review = await prisma.review.create({
    data: {
      userId,
      targetType: input.targetType as never,
      targetId: input.targetId,
      orderId: input.orderId,
      rating: input.rating,
      title: input.title,
      comment: input.comment,
      images: input.images as never,
      status: "PENDING",
    },
    include: {
      user: { select: { id: true, email: true } },
    },
  });

  return review;
}

export async function updateReview(userId: string, reviewId: string, input: UpdateReviewInput) {
  const review = await prisma.review.findFirst({
    where: { id: reviewId, userId },
  });

  if (!review) {
    throw new AppError("Review not found", StatusCodes.NOT_FOUND);
  }

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: {
      rating: input.rating,
      title: input.title,
      comment: input.comment,
      images: input.images as never,
      status: "PENDING",
    },
    include: {
      user: { select: { id: true, email: true } },
    },
  });

  if (review.status === "APPROVED") {
    await updateTargetRating(review.targetType, review.targetId);
  }

  return updated;
}

export async function deleteReview(userId: string, reviewId: string) {
  const review = await prisma.review.findFirst({
    where: { id: reviewId, userId },
  });

  if (!review) {
    throw new AppError("Review not found", StatusCodes.NOT_FOUND);
  }

  await prisma.review.delete({ where: { id: reviewId } });

  if (review.status === "APPROVED") {
    await updateTargetRating(review.targetType, review.targetId);
  }

  return { deleted: true };
}

export async function listReviews(input: ListReviewsInput) {
  const skip = (input.page - 1) * input.limit;

  const where: Record<string, unknown> = {};
  if (input.targetType) where.targetType = input.targetType;
  if (input.targetId) where.targetId = input.targetId;
  if (input.rating) where.rating = input.rating;
  if (input.status) where.status = input.status;

  const orderBy: Record<string, string> = {};
  orderBy[input.sortBy] = input.sortOrder;

  const [items, total] = await Promise.all([
    prisma.review.findMany({
      where,
      skip,
      take: input.limit,
      orderBy: orderBy as never,
      include: {
        user: { select: { id: true, email: true } },
      },
    }),
    prisma.review.count({ where }),
  ]);

  return { items, total, page: input.page, limit: input.limit, totalPages: Math.ceil(total / input.limit) };
}

export async function getReview(reviewId: string) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      user: { select: { id: true, email: true } },
    },
  });

  if (!review) {
    throw new AppError("Review not found", StatusCodes.NOT_FOUND);
  }

  return review;
}

export async function replyToReview(userId: string, reviewId: string, input: ReplyReviewInput) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) {
    throw new AppError("Review not found", StatusCodes.NOT_FOUND);
  }

  if (review.targetType === "STORE") {
    const store = await prisma.store.findUnique({ where: { id: review.targetId } });
    if (!store) {
      throw new AppError("Store not found", StatusCodes.NOT_FOUND);
    }
    const merchant = await prisma.merchant.findUnique({ where: { id: store.merchantId } });
    if (!merchant || merchant.userId !== userId) {
      throw new AppError("Not authorized to reply to this review", StatusCodes.FORBIDDEN);
    }
  } else {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      throw new AppError("Not authorized to reply to this review", StatusCodes.FORBIDDEN);
    }
  }

  return prisma.review.update({
    where: { id: reviewId },
    data: {
      reply: input.reply,
      repliedAt: new Date(),
    },
  });
}

export async function moderateReview(adminId: string, reviewId: string, input: ModerateReviewInput) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) {
    throw new AppError("Review not found", StatusCodes.NOT_FOUND);
  }

  const wasApproved = review.status === "APPROVED";

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: { status: input.status as never },
  });

  await prisma.reviewModerationLog.create({
    data: {
      reviewId,
      action: input.status as never,
      reason: input.reason,
      moderatedBy: adminId,
    },
  });

  if (wasApproved || input.status === "APPROVED") {
    await updateTargetRating(review.targetType, review.targetId);
  }

  return updated;
}

export async function markHelpful(reviewId: string) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) {
    throw new AppError("Review not found", StatusCodes.NOT_FOUND);
  }

  return prisma.review.update({
    where: { id: reviewId },
    data: { helpfulCount: { increment: 1 } },
  });
}

export async function getReviewSummary(targetType: string, targetId: string) {
  const reviews = await prisma.review.findMany({
    where: { targetType: targetType as never, targetId, status: "APPROVED" },
    select: { rating: true },
  });

  if (reviews.length === 0) {
    return { averageRating: 0, totalReviews: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  }

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;
  for (const r of reviews) {
    distribution[r.rating] = (distribution[r.rating] || 0) + 1;
    total += r.rating;
  }

  return {
    averageRating: total / reviews.length,
    totalReviews: reviews.length,
    distribution,
  };
}
