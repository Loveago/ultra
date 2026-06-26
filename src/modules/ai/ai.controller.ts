import type { Request, Response } from "express";
import { getDemandForecast, getFraudDetection, getRecommendations, smartSearch } from "./ai.service";

export async function recommendationsController(req: Request, res: Response): Promise<void> {
  const data = await getRecommendations(req.auth!.userId, {
    limit: req.query.limit ? Number(req.query.limit) : 10,
    storeId: req.query.storeId as string | undefined,
  });
  res.status(200).json({ success: true, data });
}

export async function demandForecastController(req: Request, res: Response): Promise<void> {
  const data = await getDemandForecast({
    storeId: req.query.storeId as string | undefined,
    days: req.query.days ? Number(req.query.days) : 7,
  });
  res.status(200).json({ success: true, data });
}

export async function smartSearchController(req: Request, res: Response): Promise<void> {
  const data = await smartSearch({
    query: req.query.query as string,
    limit: req.query.limit ? Number(req.query.limit) : 20,
    storeId: req.query.storeId as string | undefined,
  });
  res.status(200).json({ success: true, data });
}

export async function fraudDetectionController(req: Request, res: Response): Promise<void> {
  const data = await getFraudDetection(req.params.userId || req.auth!.userId);
  res.status(200).json({ success: true, data });
}
