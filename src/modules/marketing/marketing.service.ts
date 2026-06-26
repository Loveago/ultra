import { StatusCodes } from "http-status-codes";
import { prisma } from "../../infrastructure/db/prisma";
import { AppError } from "../../common/errors/app-error";
import type {
  ApplyReferralInput,
  CreateCouponInput,
  CreatePromotionInput,
  ListCouponsInput,
  ListPromotionsInput,
  ValidateCouponInput,
} from "./marketing.schema";

export async function createCoupon(input: CreateCouponInput) {
  const existing = await prisma.coupon.findUnique({ where: { code: input.code } });
  if (existing) {
    throw new AppError("Coupon code already exists", StatusCodes.CONFLICT);
  }

  return prisma.coupon.create({
    data: {
      code: input.code,
      type: input.type as never,
      value: input.value,
      minOrderAmount: input.minOrderAmount,
      maxDiscount: input.maxDiscount,
      usageLimit: input.usageLimit,
      perUserLimit: input.perUserLimit,
      storeId: input.storeId,
      validFrom: new Date(input.validFrom),
      validUntil: new Date(input.validUntil),
    },
  });
}

export async function validateCoupon(userId: string, input: ValidateCouponInput) {
  const coupon = await prisma.coupon.findUnique({
    where: { code: input.code.toUpperCase() },
  });

  if (!coupon || !coupon.isActive) {
    throw new AppError("Invalid or inactive coupon", StatusCodes.NOT_FOUND);
  }

  const now = new Date();
  if (now < coupon.validFrom || now > coupon.validUntil) {
    throw new AppError("Coupon is not valid at this time", StatusCodes.BAD_REQUEST);
  }

  if (input.orderAmount < coupon.minOrderAmount) {
    throw new AppError(`Minimum order amount is ${coupon.minOrderAmount}`, StatusCodes.BAD_REQUEST);
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new AppError("Coupon usage limit reached", StatusCodes.BAD_REQUEST);
  }

  if (coupon.storeId && input.storeId && coupon.storeId !== input.storeId) {
    throw new AppError("Coupon not valid for this store", StatusCodes.BAD_REQUEST);
  }

  const userRedemptions = await prisma.couponRedemption.count({
    where: { couponId: coupon.id, userId },
  });

  if (userRedemptions >= coupon.perUserLimit) {
    throw new AppError("You have already used this coupon the maximum number of times", StatusCodes.BAD_REQUEST);
  }

  let discountAmount = 0;
  if (coupon.type === "PERCENTAGE") {
    discountAmount = (input.orderAmount * coupon.value) / 100;
    if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
      discountAmount = coupon.maxDiscount;
    }
  } else if (coupon.type === "FIXED_AMOUNT") {
    discountAmount = coupon.value;
  } else if (coupon.type === "FREE_DELIVERY") {
    discountAmount = coupon.value;
  }

  return {
    valid: true,
    couponId: coupon.id,
    code: coupon.code,
    type: coupon.type,
    discountAmount,
  };
}

export async function redeemCoupon(userId: string, couponId: string, orderId: string, discountAmount: number) {
  await prisma.coupon.update({
    where: { id: couponId },
    data: { usedCount: { increment: 1 } },
  });

  return prisma.couponRedemption.create({
    data: { couponId, userId, orderId, discountAmount },
  });
}

export async function listCoupons(input: ListCouponsInput) {
  const skip = (input.page - 1) * input.limit;

  const where: Record<string, unknown> = {};
  if (input.isActive !== undefined) where.isActive = input.isActive;

  const [items, total] = await Promise.all([
    prisma.coupon.findMany({ where, skip, take: input.limit, orderBy: { createdAt: "desc" } }),
    prisma.coupon.count({ where }),
  ]);

  return { items, total, page: input.page, limit: input.limit, totalPages: Math.ceil(total / input.limit) };
}

export async function createPromotion(input: CreatePromotionInput) {
  return prisma.promotion.create({
    data: {
      title: input.title,
      description: input.description,
      bannerUrl: input.bannerUrl,
      storeId: input.storeId,
      productIds: input.productIds as never,
      discountType: input.discountType as never,
      discountValue: input.discountValue,
      startsAt: new Date(input.startsAt),
      endsAt: new Date(input.endsAt),
    },
  });
}

export async function listPromotions(input: ListPromotionsInput) {
  const skip = (input.page - 1) * input.limit;

  const where: Record<string, unknown> = {};
  if (input.isActive !== undefined) where.isActive = input.isActive;

  const [items, total] = await Promise.all([
    prisma.promotion.findMany({ where, skip, take: input.limit, orderBy: { startsAt: "desc" } }),
    prisma.promotion.count({ where }),
  ]);

  return { items, total, page: input.page, limit: input.limit, totalPages: Math.ceil(total / input.limit) };
}

export async function getActivePromotions() {
  const now = new Date();
  return prisma.promotion.findMany({
    where: { isActive: true, startsAt: { lte: now }, endsAt: { gte: now } },
    orderBy: { startsAt: "desc" },
  });
}

export async function generateReferralCode(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError("User not found", StatusCodes.NOT_FOUND);
  }

  if (user.referralCode) {
    return { referralCode: user.referralCode };
  }

  const code = `ULTRA-${user.id.slice(0, 8).toUpperCase()}`;
  await prisma.user.update({
    where: { id: userId },
    data: { referralCode: code },
  });

  return { referralCode: code };
}

export async function applyReferral(userId: string, input: ApplyReferralInput) {
  const referrer = await prisma.user.findUnique({ where: { referralCode: input.code } });
  if (!referrer) {
    throw new AppError("Invalid referral code", StatusCodes.NOT_FOUND);
  }

  if (referrer.id === userId) {
    throw new AppError("Cannot use your own referral code", StatusCodes.BAD_REQUEST);
  }

  const existing = await prisma.referral.findUnique({ where: { referredId: userId } });
  if (existing) {
    throw new AppError("You have already applied a referral code", StatusCodes.CONFLICT);
  }

  const rewardPoints = 100;
  const rewardCashback = 50;

  const referral = await prisma.referral.create({
    data: {
      referrerId: referrer.id,
      referredId: userId,
      code: input.code,
      rewardPoints,
      rewardCashback,
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { loyaltyPoints: { increment: rewardPoints }, cashbackBalance: { increment: rewardCashback } },
  });

  await prisma.user.update({
    where: { id: referrer.id },
    data: { loyaltyPoints: { increment: rewardPoints }, cashbackBalance: { increment: rewardCashback } },
  });

  await prisma.loyaltyTransaction.create({
    data: { userId, points: rewardPoints, type: "REFERRAL_BONUS", description: `Referral bonus from ${referrer.email}` },
  });

  await prisma.loyaltyTransaction.create({
    data: { userId: referrer.id, points: rewardPoints, type: "REFERRAL_BONUS", description: `Referral bonus for inviting user` },
  });

  await prisma.cashbackTransaction.create({
    data: { userId, amount: rewardCashback, description: "Referral cashback reward" },
  });

  await prisma.cashbackTransaction.create({
    data: { userId: referrer.id, amount: rewardCashback, description: "Referral cashback reward" },
  });

  return referral;
}

export async function getLoyaltyBalance(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { loyaltyPoints: true, cashbackBalance: true },
  });

  if (!user) {
    throw new AppError("User not found", StatusCodes.NOT_FOUND);
  }

  return user;
}

export async function listLoyaltyTransactions(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.loyaltyTransaction.findMany({ where: { userId }, skip, take: limit, orderBy: { createdAt: "desc" } }),
    prisma.loyaltyTransaction.count({ where: { userId } }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function listCashbackTransactions(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.cashbackTransaction.findMany({ where: { userId }, skip, take: limit, orderBy: { createdAt: "desc" } }),
    prisma.cashbackTransaction.count({ where: { userId } }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}
