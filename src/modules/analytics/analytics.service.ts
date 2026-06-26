import { prisma } from "../../infrastructure/db/prisma";

function getDateRange(startDate?: string, endDate?: string): { gte?: Date; lte?: Date } {
  const range: { gte?: Date; lte?: Date } = {};
  if (startDate) range.gte = new Date(startDate);
  if (endDate) range.lte = new Date(endDate);
  return range;
}

export async function getRevenueAnalytics(startDate?: string, endDate?: string) {
  const dateRange = getDateRange(startDate, endDate);

  const where: Record<string, unknown> = {};
  if (startDate || endDate) where.createdAt = dateRange;

  const [totalRevenue, totalOrders, completedOrders, avgOrderValue, paymentStats] = await Promise.all([
    prisma.payment.aggregate({
      where: { status: "SUCCESS", ...(startDate || endDate ? { paidAt: dateRange } : {}) },
      _sum: { amount: true },
    }),
    prisma.order.count({ where }),
    prisma.order.count({ where: { ...where, status: "DELIVERED" } }),
    prisma.order.aggregate({
      where: { ...where, status: "DELIVERED" },
      _avg: { grandTotal: true },
    }),
    prisma.payment.groupBy({
      by: ["provider"],
      where: { status: "SUCCESS", ...(startDate || endDate ? { paidAt: dateRange } : {}) },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const commissionTotal = await prisma.commissionLog.aggregate({
    where: startDate || endDate ? { createdAt: dateRange } : {},
    _sum: { commissionAmount: true, merchantNetAmount: true, grossAmount: true },
  });

  return {
    totalRevenue: totalRevenue._sum.amount ?? 0,
    totalOrders,
    completedOrders,
    avgOrderValue: avgOrderValue._avg?.grandTotal ?? 0,
    platformCommission: commissionTotal._sum.commissionAmount ?? 0,
    merchantNetPayout: commissionTotal._sum.merchantNetAmount ?? 0,
    grossOrderValue: commissionTotal._sum.grossAmount ?? 0,
    paymentProviders: paymentStats.map((p) => ({
      provider: p.provider,
      totalAmount: p._sum.amount ?? 0,
      count: p._count,
    })),
  };
}

export async function getOrderAnalytics(startDate?: string, endDate?: string) {
  const dateRange = getDateRange(startDate, endDate);

  const where: Record<string, unknown> = {};
  if (startDate || endDate) where.createdAt = dateRange;

  const [statusCounts, storeGroupStatusCounts, avgItemsPerOrder, topStores] = await Promise.all([
    prisma.order.groupBy({
      by: ["status"],
      where,
      _count: true,
    }),
    prisma.orderStoreGroup.groupBy({
      by: ["status"],
      where: startDate || endDate ? { createdAt: dateRange } : {},
      _count: true,
    }),
    prisma.orderItem.aggregate({
      where: { order: where },
      _count: true,
    }),
    prisma.orderStoreGroup.findMany({
      where: startDate || endDate ? { createdAt: dateRange } : {},
      take: 10,
      orderBy: { subtotal: "desc" },
      select: {
        storeId: true,
        subtotal: true,
        status: true,
      },
    }),
  ]);

  const totalOrders = statusCounts.reduce((sum: number, s: { _count: number }) => sum + s._count, 0);

  return {
    orderStatusBreakdown: statusCounts.map((s: { status: string; _count: number }) => ({
      status: s.status,
      count: s._count,
    })),
    storeGroupStatusBreakdown: storeGroupStatusCounts.map((s: { status: string; _count: number }) => ({
      status: s.status,
      count: s._count,
    })),
    avgItemsPerOrder: totalOrders > 0 ? (avgItemsPerOrder._count / totalOrders) : 0,
    topStoresByOrderValue: topStores,
  };
}

export async function getMerchantAnalytics(merchantId?: string, startDate?: string, endDate?: string) {
  const dateRange = getDateRange(startDate, endDate);

  const storeWhere: Record<string, unknown> = {};
  if (merchantId) storeWhere.merchantId = merchantId;

  const stores = await prisma.store.findMany({
    where: storeWhere,
    select: { id: true, name: true, rating: true, totalRatings: true },
  });

  const storeIds = stores.map((s) => s.id);

  const orderWhere: Record<string, unknown> = {};
  if (storeIds.length > 0) {
    orderWhere.storeGroups = { some: { storeId: { in: storeIds } } };
  }
  if (startDate || endDate) orderWhere.createdAt = dateRange;

  const [totalOrders, completedOrders, totalRevenue, commissionData] = await Promise.all([
    prisma.order.count({ where: orderWhere }),
    prisma.order.count({ where: { ...orderWhere, status: "DELIVERED" } }),
    prisma.orderStoreGroup.aggregate({
      where: {
        ...(storeIds.length > 0 ? { storeId: { in: storeIds } } : {}),
        ...(startDate || endDate ? { createdAt: dateRange } : {}),
        status: "DELIVERED",
      },
      _sum: { subtotal: true },
    }),
    prisma.commissionLog.aggregate({
      where: {
        ...(merchantId ? { merchantId } : {}),
        ...(startDate || endDate ? { createdAt: dateRange } : {}),
      },
      _sum: { grossAmount: true, commissionAmount: true, merchantNetAmount: true },
    }),
  ]);

  return {
    stores,
    totalOrders,
    completedOrders,
    totalRevenue: totalRevenue._sum.subtotal ?? 0,
    grossAmount: commissionData._sum.grossAmount ?? 0,
    platformCommission: commissionData._sum.commissionAmount ?? 0,
    merchantNet: commissionData._sum.merchantNetAmount ?? 0,
  };
}

export async function getRiderAnalytics(startDate?: string, endDate?: string) {
  const dateRange = getDateRange(startDate, endDate);

  const where: Record<string, unknown> = {};
  if (startDate || endDate) where.createdAt = dateRange;

  const [totalRiders, activeRiders, approvedRiders, assignmentStats, topRiders] = await Promise.all([
    prisma.rider.count(),
    prisma.rider.count({ where: { isOnline: true } }),
    prisma.rider.count({ where: { status: "APPROVED" } }),
    prisma.deliveryAssignment.groupBy({
      by: ["status"],
      where: startDate || endDate ? { createdAt: dateRange } : {},
      _count: true,
    }),
    prisma.rider.findMany({
      take: 10,
      orderBy: { totalDeliveries: "desc" },
      select: {
        id: true,
        rating: true,
        totalDeliveries: true,
        totalEarnings: true,
        user: { select: { id: true, email: true } },
      },
    }),
  ]);

  return {
    totalRiders,
    activeRiders,
    approvedRiders,
    assignmentBreakdown: assignmentStats.map((a) => ({
      status: a.status,
      count: a._count,
    })),
    topRiders,
  };
}

export async function getDashboardSummary() {
  const [
    totalUsers,
    totalMerchants,
    totalProducts,
    totalOrders,
    pendingOrders,
    totalRiders,
    activeRiders,
    totalRevenue,
    pendingWithdrawals,
    pendingReviews,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.merchant.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.count({ where: { status: { in: ["PENDING", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP"] } } }),
    prisma.rider.count(),
    prisma.rider.count({ where: { isOnline: true } }),
    prisma.payment.aggregate({ where: { status: "SUCCESS" }, _sum: { amount: true } }),
    prisma.withdrawal.count({ where: { status: "PENDING" } }),
    prisma.review.count({ where: { status: "PENDING" } }),
  ]);

  return {
    totalUsers,
    totalMerchants,
    totalProducts,
    totalOrders,
    pendingOrders,
    totalRiders,
    activeRiders,
    totalRevenue: totalRevenue._sum.amount ?? 0,
    pendingWithdrawals,
    pendingReviews,
  };
}
