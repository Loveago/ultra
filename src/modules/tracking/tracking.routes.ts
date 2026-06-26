import { Router } from "express";
import { authenticate } from "../../common/middleware/authenticate";
import {
  getDeliveryTrackingController,
  getOrderTrackingController,
} from "./tracking.controller";

export const trackingRoutes = Router();

trackingRoutes.use(authenticate);

trackingRoutes.get("/tracking/delivery/:assignmentId", getDeliveryTrackingController);
trackingRoutes.get("/tracking/order/:orderId", getOrderTrackingController);
