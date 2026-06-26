import type { Request, Response } from "express";
import {
  getAvailableFilters,
  getRecommendations,
  getTrendingProducts,
  globalSearch,
  searchProducts,
  searchStores,
} from "./search.service";

export async function globalSearchController(req: Request, res: Response): Promise<void> {
  const data = await globalSearch({
    q: req.query.q as string,
    limit: req.query.limit ? Number(req.query.limit) : 10,
  });
  res.status(200).json({ success: true, data });
}

export async function productSearchController(req: Request, res: Response): Promise<void> {
  const data = await searchProducts({
    q: req.query.q as string,
    storeId: req.query.storeId as string | undefined,
    categoryId: req.query.categoryId as string | undefined,
    minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
    maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
    minRating: req.query.minRating ? Number(req.query.minRating) : undefined,
    sortBy: (req.query.sortBy as "relevance" | "price_asc" | "price_desc" | "rating" | "newest") || "relevance",
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 20,
  });
  res.status(200).json({ success: true, data });
}

export async function storeSearchController(req: Request, res: Response): Promise<void> {
  const data = await searchStores({
    q: req.query.q as string,
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 20,
  });
  res.status(200).json({ success: true, data });
}

export async function trendingController(req: Request, res: Response): Promise<void> {
  const data = await getTrendingProducts({
    limit: req.query.limit ? Number(req.query.limit) : 20,
    categoryId: req.query.categoryId as string | undefined,
  });
  res.status(200).json({ success: true, data });
}

export async function recommendationsController(req: Request, res: Response): Promise<void> {
  const data = await getRecommendations(req.auth!.userId, {
    limit: req.query.limit ? Number(req.query.limit) : 10,
  });
  res.status(200).json({ success: true, data });
}

export async function filtersController(req: Request, res: Response): Promise<void> {
  const data = await getAvailableFilters(
    req.query.categoryId as string | undefined,
    req.query.storeId as string | undefined,
  );
  res.status(200).json({ success: true, data });
}
