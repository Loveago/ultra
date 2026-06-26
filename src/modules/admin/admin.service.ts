import { StatusCodes } from "http-status-codes";
import { prisma } from "../../infrastructure/db/prisma";
import { AppError } from "../../common/errors/app-error";
import type {
  AdminListMerchantsInput,
  AdminListRidersInput,
  AdminListUsersInput,
  AdminUpdateMerchantInput,
  AdminUpdateRiderInput,
  AdminUpdateUserInput,
} from "./admin.schema";

export async function adminListUsers(input: AdminListUsersInput) {
  const skip = (input.page - 1) * input.limit;

  const where: Record<string, unknown> = {};
  if (input.role) where.role = input.role as never;
  if (input.isActive !== undefined) where.isActive = input.isActive;
  if (input.search) {
    where.OR = [
      { email: { contains: input.search, mode: "insensitive" } },
      { phone: { contains: input.search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: input.limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, email: true, phone: true, role: true, isActive: true,
        emailVerifiedAt: true, phoneVerifiedAt: true, createdAt: true,
        profile: { select: { firstName: true, lastName: true, avatarUrl: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { items, total, page: input.page, limit: input.limit, totalPages: Math.ceil(total / input.limit) };
}

export async function adminGetUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, email: true, phone: true, role: true, isActive: true,
      emailVerifiedAt: true, phoneVerifiedAt: true, createdAt: true, updatedAt: true,
      profile: true,
      merchant: { select: { id: true, status: true, verifiedAt: true } },
      rider: { select: { id: true, status: true, isOnline: true, rating: true, totalDeliveries: true } },
      wallet: { select: { id: true, balance: true, pendingBalance: true } },
      orders: { select: { id: true, orderNumber: true, status: true, grandTotal: true, createdAt: true }, take: 5, orderBy: { createdAt: "desc" } },
    },
  });

  if (!user) {
    throw new AppError("User not found", StatusCodes.NOT_FOUND);
  }

  return user;
}

export async function adminUpdateUser(userId: string, input: AdminUpdateUserInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError("User not found", StatusCodes.NOT_FOUND);
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      role: input.role as never,
      isActive: input.isActive,
    },
    select: { id: true, email: true, role: true, isActive: true },
  });
}

export async function adminListMerchants(input: AdminListMerchantsInput) {
  const skip = (input.page - 1) * input.limit;

  const where: Record<string, unknown> = {};
  if (input.isVerified !== undefined) where.verifiedAt = { not: null };
  if (input.search) {
    where.OR = [
      { businessName: { contains: input.search, mode: "insensitive" } },
      { user: { email: { contains: input.search, mode: "insensitive" } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.merchant.findMany({
      where,
      skip,
      take: input.limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, email: true, phone: true, isActive: true } },
        stores: { select: { id: true, name: true, rating: true, isVerified: true } },
      },
    }),
    prisma.merchant.count({ where }),
  ]);

  return { items, total, page: input.page, limit: input.limit, totalPages: Math.ceil(total / input.limit) };
}

export async function adminUpdateMerchant(merchantId: string, input: AdminUpdateMerchantInput) {
  const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
  if (!merchant) {
    throw new AppError("Merchant not found", StatusCodes.NOT_FOUND);
  }

  return prisma.merchant.update({
    where: { id: merchantId },
    data: {
      verifiedAt: input.isVerified ? new Date() : null,
    },
    include: { user: { select: { id: true, email: true } } },
  });
}

export async function adminListRiders(input: AdminListRidersInput) {
  const skip = (input.page - 1) * input.limit;

  const where: Record<string, unknown> = {};
  if (input.status) where.status = input.status as never;

  const [items, total] = await Promise.all([
    prisma.rider.findMany({
      where,
      skip,
      take: input.limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, email: true, phone: true, isActive: true } },
        vehicles: { select: { id: true, type: true, plateNumber: true, isActive: true } },
      },
    }),
    prisma.rider.count({ where }),
  ]);

  return { items, total, page: input.page, limit: input.limit, totalPages: Math.ceil(total / input.limit) };
}

export async function adminUpdateRider(riderId: string, input: AdminUpdateRiderInput) {
  const rider = await prisma.rider.findUnique({ where: { id: riderId } });
  if (!rider) {
    throw new AppError("Rider not found", StatusCodes.NOT_FOUND);
  }

  return prisma.rider.update({
    where: { id: riderId },
    data: {
      status: input.status as never,
      isOnline: input.isOnline,
    },
    include: { user: { select: { id: true, email: true } } },
  });
}

export async function adminGetSystemStats() {
  const [
    totalUsers, totalMerchants, totalRiders, totalStores, totalProducts,
    totalOrders, pendingOrders, completedOrders, totalRevenue,
    pendingWithdrawals, pendingReviews, activeConversations,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.merchant.count(),
    prisma.rider.count(),
    prisma.store.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.count({ where: { status: { in: ["PENDING", "CONFIRMED", "PREPARING"] } } }),
    prisma.order.count({ where: { status: "DELIVERED" } }),
    prisma.payment.aggregate({ where: { status: "SUCCESS" }, _sum: { amount: true } }),
    prisma.withdrawal.count({ where: { status: "PENDING" } }),
    prisma.review.count({ where: { status: "PENDING" } }),
    prisma.conversation.count(),
  ]);

  return {
    users: totalUsers,
    merchants: totalMerchants,
    riders: totalRiders,
    stores: totalStores,
    products: totalProducts,
    orders: { total: totalOrders, pending: pendingOrders, completed: completedOrders },
    revenue: totalRevenue._sum.amount ?? 0,
    pendingWithdrawals,
    pendingReviews,
    activeConversations,
  };
}
