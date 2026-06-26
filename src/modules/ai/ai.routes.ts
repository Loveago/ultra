import { Router } from "express";
import { authenticate } from "../../common/middleware/authenticate";
import { authorize } from "../../common/middleware/authorize";
import {
  demandForecastController,
  fraudDetectionController,
  recommendationsController,
  smartSearchController,
} from "./ai.controller";

export const aiRoutes = Router();

aiRoutes.use(authenticate);

// User-facing AI features
aiRoutes.get("/ai/recommendations", recommendationsController);
aiRoutes.get("/ai/search", smartSearchController);

// Admin AI features
aiRoutes.get("/ai/demand-forecast", authorize(["ADMIN", "SUPER_ADMIN", "MERCHANT"]), demandForecastController);
aiRoutes.get("/ai/fraud-detection/:userId", authorize(["ADMIN", "SUPER_ADMIN"]), fraudDetectionController);
aiRoutes.get("/ai/fraud-detection", fraudDetectionController);
