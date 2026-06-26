import type { Request, Response } from "express";
import {
  getDashboardSummary,
  getMerchantAnalytics,
  getOrderAnalytics,
  getRevenueAnalytics,
  getRiderAnalytics,
} from "./analytics.service";

export async function revenueAnalyticsController(req: Request, res: Response): Promise<void> {
  const data = await getRevenueAnalytics(
    req.query.startDate as string | undefined,
    req.query.endDate as string | undefined,
  );
  res.status(200).json({ success: true, data });
}

export async function orderAnalyticsController(req: Request, res: Response): Promise<void> {
  const data = await getOrderAnalytics(
    req.query.startDate as string | undefined,
    req.query.endDate as string | undefined,
  );
  res.status(200).json({ success: true, data });
}

export async function merchantAnalyticsController(req: Request, res: Response): Promise<void> {
  const data = await getMerchantAnalytics(
    req.query.merchantId as string | undefined,
    req.query.startDate as string | undefined,
    req.query.endDate as string | undefined,
  );
  res.status(200).json({ success: true, data });
}

export async function riderAnalyticsController(req: Request, res: Response): Promise<void> {
  const data = await getRiderAnalytics(
    req.query.startDate as string | undefined,
    req.query.endDate as string | undefined,
  );
  res.status(200).json({ success: true, data });
}

export async function dashboardSummaryController(_req: Request, res: Response): Promise<void> {
  const data = await getDashboardSummary();
  res.status(200).json({ success: true, data });
}
