import { Router } from "express";
import { authenticate } from "../../common/middleware/authenticate";
import { authorize } from "../../common/middleware/authorize";
import { validateBody } from "../../common/middleware/validate";
import {
  adminOrdersController,
  cancelOrderController,
  getOrderController,
  listMyOrdersController,
  merchantOrdersController,
  orderTimelineController,
  updateOrderStatusController,
  updateStoreGroupStatusController,
} from "./order.controller";
import {
  cancelOrderSchema,
  updateOrderStatusSchema,
  updateStoreGroupStatusSchema,
} from "./order.schema";

export const orderRoutes = Router();

orderRoutes.use(authenticate);

// Customer routes
orderRoutes.get("/orders", listMyOrdersController);
orderRoutes.get("/orders/:id", getOrderController);
orderRoutes.post("/orders/:id/cancel", validateBody(cancelOrderSchema), cancelOrderController);
orderRoutes.get("/orders/:id/timeline", orderTimelineController);

// Merchant routes
orderRoutes.get("/orders/merchant/list", authorize(["MERCHANT"]), merchantOrdersController);
orderRoutes.put("/orders/:id/status", authorize(["MERCHANT", "ADMIN", "SUPER_ADMIN"]), validateBody(updateOrderStatusSchema), updateOrderStatusController);
orderRoutes.put("/orders/:id/store-groups/:groupId/status", authorize(["MERCHANT", "ADMIN", "SUPER_ADMIN"]), validateBody(updateStoreGroupStatusSchema), updateStoreGroupStatusController);

// Admin routes
orderRoutes.get("/orders/admin/list", authorize(["ADMIN", "SUPER_ADMIN"]), adminOrdersController);
