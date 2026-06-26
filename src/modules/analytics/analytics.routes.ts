import { Router } from "express";
import { authenticate } from "../../common/middleware/authenticate";
import { authorize } from "../../common/middleware/authorize";
import {
  dashboardSummaryController,
  merchantAnalyticsController,
  orderAnalyticsController,
  revenueAnalyticsController,
  riderAnalyticsController,
} from "./analytics.controller";

export const analyticsRoutes = Router();

analyticsRoutes.use(authenticate);
analyticsRoutes.use(authorize(["ADMIN", "SUPER_ADMIN"]));

analyticsRoutes.get("/analytics/dashboard", dashboardSummaryController);
analyticsRoutes.get("/analytics/revenue", revenueAnalyticsController);
analyticsRoutes.get("/analytics/orders", orderAnalyticsController);
analyticsRoutes.get("/analytics/merchants", merchantAnalyticsController);
analyticsRoutes.get("/analytics/riders", riderAnalyticsController);
