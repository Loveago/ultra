import { prisma } from "../../infrastructure/db/prisma";
import type {
  DemandForecastInput,
  RecommendationsInput,
  SmartSearchInput,
} from "./ai.schema";

export async function getRecommendations(userId: string, input: RecommendationsInput) {
  const userOrders = await prisma.order.findMany({
    where: { userId },
    select: {
      items: { select: { productId: true, quantity: true } },
      storeGroups: { select: { storeId: true } },
    },
    take: 20,
    orderBy: { createdAt: "desc" },
  });

  const purchasedProductIds = new Set<string>();
  const storeIds = new Set<string>();
  const categoryScores: Record<string, number> = {};

  for (const order of userOrders) {
    for (const item of order.items) {
      purchasedProductIds.add(item.productId);
    }
    for (const group of order.storeGroups) {
      storeIds.add(group.storeId);
    }
  }

  const purchasedProducts = await prisma.product.findMany({
    where: { id: { in: Array.from(purchasedProductIds) } },
    select: { categoryId: true },
  });

  for (const product of purchasedProducts) {
    if (product.categoryId) {
      categoryScores[product.categoryId] = (categoryScores[product.categoryId] || 0) + 1;
    }
  }

  const topCategoryIds = Object.entries(categoryScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([id]) => id);

  const where: Record<string, unknown> = {
    id: { notIn: Array.from(purchasedProductIds) },
    status: "ACTIVE",
  };
  if (input.storeId) {
    where.storeId = input.storeId;
  } else if (storeIds.size > 0) {
    where.storeId = { in: Array.from(storeIds) };
  }
  if (topCategoryIds.length > 0) {
    where.categoryId = { in: topCategoryIds };
  }

  const recommendations = await prisma.product.findMany({
    where,
    take: input.limit,
    orderBy: { rating: "desc" },
    select: {
      id: true, name: true, basePrice: true, rating: true,
      store: { select: { id: true, name: true } },
      images: { select: { url: true }, take: 1 },
    },
  });

  return {
    recommendations,
    basedOn: {
      orderCount: userOrders.length,
      topCategories: topCategoryIds.length,
      preferredStores: storeIds.size,
    },
  };
}

export async function getDemandForecast(input: DemandForecastInput) {
  const historicalDays = Math.min(input.days * 4, 90);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - historicalDays);

  const where: Record<string, unknown> = {
    createdAt: { gte: startDate },
  };
  if (input.storeId) {
    where.storeGroups = { some: { storeId: input.storeId } };
  }

  const orders = await prisma.order.findMany({
    where,
    select: { createdAt: true, grandTotal: true, _count: { select: { items: true } } },
    orderBy: { createdAt: "asc" },
  });

  const dailyData: Record<string, { count: number; revenue: number; items: number }> = {};
  for (const order of orders) {
    const dayKey = order.createdAt.toISOString().split("T")[0];
    if (!dailyData[dayKey]) {
      dailyData[dayKey] = { count: 0, revenue: 0, items: 0 };
    }
    dailyData[dayKey].count += 1;
    dailyData[dayKey].revenue += order.grandTotal;
    dailyData[dayKey].items += order._count.items;
  }

  const dailyValues = Object.values(dailyData);
  const avgOrders = dailyValues.length > 0 ? dailyValues.reduce((s, d) => s + d.count, 0) / dailyValues.length : 0;
  const avgRevenue = dailyValues.length > 0 ? dailyValues.reduce((s, d) => s + d.revenue, 0) / dailyValues.length : 0;
  const avgItems = dailyValues.length > 0 ? dailyValues.reduce((s, d) => s + d.items, 0) / dailyValues.length : 0;

  const recentAvg = dailyValues.slice(-7);
  const olderAvg = dailyValues.slice(-14, -7);
  const recentAvgOrders = recentAvg.length > 0 ? recentAvg.reduce((s, d) => s + d.count, 0) / recentAvg.length : 0;
  const olderAvgOrders = olderAvg.length > 0 ? olderAvg.reduce((s, d) => s + d.count, 0) / olderAvg.length : 0;
  const trend = recentAvgOrders > olderAvgOrders ? "INCREASING" : recentAvgOrders < olderAvgOrders ? "DECREASING" : "STABLE";
  const trendPercentage = olderAvgOrders > 0 ? ((recentAvgOrders - olderAvgOrders) / olderAvgOrders) * 100 : 0;

  const forecast: Array<{ date: string; predictedOrders: number; predictedRevenue: number; predictedItems: number }> = [];
  const today = new Date();
  for (let i = 1; i <= input.days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dayOfWeek = date.getDay();
    const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.2 : 1.0;
    const trendFactor = 1 + (trendPercentage / 100) * (i / input.days);

    forecast.push({
      date: date.toISOString().split("T")[0],
      predictedOrders: Math.round(avgOrders * weekendMultiplier * trendFactor),
      predictedRevenue: Math.round(avgRevenue * weekendMultiplier * trendFactor * 100) / 100,
      predictedItems: Math.round(avgItems * weekendMultiplier * trendFactor),
    });
  }

  return {
    forecast,
    summary: {
      historicalDays,
      totalHistoricalOrders: orders.length,
      avgDailyOrders: Math.round(avgOrders * 100) / 100,
      avgDailyRevenue: Math.round(avgRevenue * 100) / 100,
      avgDailyItems: Math.round(avgItems * 100) / 100,
      trend,
      trendPercentage: Math.round(trendPercentage * 100) / 100,
    },
  };
}

export async function smartSearch(input: SmartSearchInput) {
  const query = input.query.trim().toLowerCase();
  const terms = query.split(/\s+/).filter((t) => t.length > 0);

  const where: Record<string, unknown> = {
    status: "ACTIVE",
    OR: [
      { name: { contains: input.query, mode: "insensitive" } },
      { description: { contains: input.query, mode: "insensitive" } },
    ],
  };
  if (input.storeId) where.storeId = input.storeId;

  const products = await prisma.product.findMany({
    where,
    take: input.limit * 2,
    orderBy: { rating: "desc" },
    select: {
      id: true, name: true, description: true, basePrice: true, rating: true,
      store: { select: { id: true, name: true } },
      images: { select: { url: true }, take: 1 },
    },
  });

  const scored = products.map((product) => {
    const name = product.name.toLowerCase();
    const desc = (product.description || "").toLowerCase();
    let score = 0;

    for (const term of terms) {
      if (name.includes(term)) score += 10;
      if (name.startsWith(term)) score += 5;
      if (desc.includes(term)) score += 3;
    }

    score += product.rating * 2;

    return { ...product, _searchScore: score };
  });

  scored.sort((a, b) => b._searchScore - a._searchScore);

  const results = scored.slice(0, input.limit).map(({ _searchScore, ...product }) => product);

  return {
    results,
    totalMatches: products.length,
    query: input.query,
  };
}

export async function getFraudDetection(userId: string) {
  const factors: Array<{ factor: string; score: number; detail: string }> = [];
  let totalScore = 0;

  const recentOrders = await prisma.order.count({
    where: { userId, createdAt: { gte: new Date(Date.now() - 3600_000) } },
  });
  if (recentOrders > 5) {
    const s = 25;
    factors.push({ factor: "rapid_orders", score: s, detail: `${recentOrders} orders in last hour` });
    totalScore += s;
  }

  const failedPayments = await prisma.payment.count({
    where: { order: { userId }, status: "FAILED", createdAt: { gte: new Date(Date.now() - 86400_000) } },
  });
  if (failedPayments > 3) {
    const s = 30;
    factors.push({ factor: "failed_payments", score: s, detail: `${failedPayments} failed payments in 24h` });
    totalScore += s;
  }

  const untrustedDevices = await prisma.deviceFingerprint.count({
    where: { userId, isTrusted: false },
  });
  if (untrustedDevices > 3) {
    const s = 15;
    factors.push({ factor: "untrusted_devices", score: s, detail: `${untrustedDevices} untrusted devices` });
    totalScore += s;
  }

  const rapidWithdrawals = await prisma.withdrawal.count({
    where: { userId, createdAt: { gte: new Date(Date.now() - 86400_000) } },
  });
  if (rapidWithdrawals > 3) {
    const s = 20;
    factors.push({ factor: "rapid_withdrawals", score: s, detail: `${rapidWithdrawals} withdrawals in 24h` });
    totalScore += s;
  }

  const highValueOrders = await prisma.order.count({
    where: { userId, grandTotal: { gte: 100000 }, createdAt: { gte: new Date(Date.now() - 86400_000) } },
  });
  if (highValueOrders > 2) {
    const s = 15;
    factors.push({ factor: "high_value_orders", score: s, detail: `${highValueOrders} high-value orders in 24h` });
    totalScore += s;
  }

  const level = totalScore >= 60 ? "BLOCKED" : totalScore >= 40 ? "HIGH" : totalScore >= 20 ? "MEDIUM" : "LOW";

  return {
    userId,
    fraudScore: totalScore,
    level,
    factors,
    recommendation: totalScore >= 40 ? "REVIEW_REQUIRED" : totalScore >= 20 ? "MONITOR" : "ALLOW",
  };
}
