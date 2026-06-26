import { Prisma } from "@prisma/client";
import { prisma } from "../../infrastructure/db/prisma";
import type {
  GlobalSearchInput,
  ProductSearchInput,
  RecommendationsInput,
  StoreSearchInput,
  TrendingInput,
} from "./search.schema";

export async function searchProducts(input: ProductSearchInput) {
  const skip = (input.page - 1) * input.limit;

  const where: Record<string, unknown> = {
    moderationStatus: "APPROVED",
    isAvailable: true,
    OR: [
      { name: { contains: input.q, mode: "insensitive" } },
      { description: { contains: input.q, mode: "insensitive" } },
      { slug: { contains: input.q, mode: "insensitive" } },
    ],
  };

  if (input.storeId) where.storeId = input.storeId;
  if (input.categoryId) where.categoryId = input.categoryId;
  if (input.minPrice !== undefined || input.maxPrice !== undefined) {
    where.basePrice = {};
    if (input.minPrice !== undefined) (where.basePrice as Record<string, unknown>).gte = input.minPrice;
    if (input.maxPrice !== undefined) (where.basePrice as Record<string, unknown>).lte = input.maxPrice;
  }
  if (input.minRating !== undefined) where.rating = { gte: input.minRating };

  let orderBy: Prisma.ProductOrderByWithRelationInput[];
  switch (input.sortBy) {
    case "price_asc":
      orderBy = [{ basePrice: "asc" }];
      break;
    case "price_desc":
      orderBy = [{ basePrice: "desc" }];
      break;
    case "rating":
      orderBy = [{ rating: "desc" }, { totalRatings: "desc" }];
      break;
    case "newest":
      orderBy = [{ createdAt: "desc" }];
      break;
    default:
      orderBy = [{ totalRatings: "desc" }, { rating: "desc" }];
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: input.limit,
      orderBy,
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        store: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  await prisma.searchAnalytics.create({
    data: {
      searchTerm: input.q,
      resultCount: total,
    },
  });

  return {
    items,
    total,
    page: input.page,
    limit: input.limit,
    totalPages: Math.ceil(total / input.limit),
  };
}

export async function searchStores(input: StoreSearchInput) {
  const skip = (input.page - 1) * input.limit;

  const where = {
    status: "ACTIVE" as const,
    OR: [
      { name: { contains: input.q, mode: "insensitive" as const } },
      { description: { contains: input.q, mode: "insensitive" as const } },
    ],
  };

  const [items, total] = await Promise.all([
    prisma.store.findMany({
      where,
      skip,
      take: input.limit,
      orderBy: { rating: "desc" },
      include: { _count: { select: { branches: true } } },
    }),
    prisma.store.count({ where }),
  ]);

  return {
    items,
    total,
    page: input.page,
    limit: input.limit,
    totalPages: Math.ceil(total / input.limit),
  };
}

export async function globalSearch(input: GlobalSearchInput) {
  const [products, stores] = await Promise.all([
    prisma.product.findMany({
      where: {
        moderationStatus: "APPROVED",
        isAvailable: true,
        OR: [
          { name: { contains: input.q, mode: "insensitive" } },
          { description: { contains: input.q, mode: "insensitive" } },
        ],
      },
      take: input.limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        basePrice: true,
        storeId: true,
      },
    }),
    prisma.store.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { name: { contains: input.q, mode: "insensitive" } },
          { description: { contains: input.q, mode: "insensitive" } },
        ],
      },
      take: input.limit,
      select: {
        id: true,
        name: true,
        slug: true,
        rating: true,
        logoUrl: true,
      },
    }),
  ]);

  return { products, stores };
}

export async function getTrendingProducts(input: TrendingInput) {
  const where: Record<string, unknown> = {
    status: "ACTIVE",
    moderationStatus: "APPROVED",
    isAvailable: true,
  };

  if (input.categoryId) where.categoryId = input.categoryId;

  return prisma.product.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
    take: input.limit,
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      store: { select: { id: true, name: true, slug: true } },
    },
  });
}

export async function getRecommendations(userId: string, input: RecommendationsInput) {
  const userProducts = await prisma.product.findMany({
    where: { store: { merchant: { userId } } },
    select: { categoryId: true },
    distinct: ["categoryId"],
  });

  const categoryIds = userProducts
    .map((p: { categoryId: string | null }) => p.categoryId)
    .filter((id: string | null): id is string => id !== null);

  const where: Record<string, unknown> = {
    status: "ACTIVE",
    moderationStatus: "APPROVED",
    isAvailable: true,
    rating: { gte: 3 },
  };

  if (categoryIds.length > 0) {
    where.categoryId = { in: categoryIds };
  }

  return prisma.product.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
    take: input.limit,
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      store: { select: { id: true, name: true, slug: true } },
    },
  });
}

export async function getAvailableFilters(categoryId?: string, storeId?: string) {
  const where: Record<string, unknown> = {
    moderationStatus: "APPROVED",
    isAvailable: true,
  };

  if (categoryId) where.categoryId = categoryId;
  if (storeId) where.storeId = storeId;

  const [priceRange, categories, stores] = await Promise.all([
    prisma.product.aggregate({
      where,
      _min: { basePrice: true },
      _max: { basePrice: true },
    }),
    prisma.category.findMany({
      where: { isActive: true, products: { some: { moderationStatus: "APPROVED", isAvailable: true } } },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
    prisma.store.findMany({
      where: { status: "ACTIVE", products: { some: where } },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    priceRange: {
      min: priceRange._min.basePrice ?? 0,
      max: priceRange._max.basePrice ?? 0,
    },
    categories,
    stores,
  };
}
