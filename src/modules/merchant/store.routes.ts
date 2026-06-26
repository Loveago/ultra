import { Router } from "express";
import { authenticate } from "../../common/middleware/authenticate";
import { authorize } from "../../common/middleware/authorize";
import { validateBody } from "../../common/middleware/validate";
import {
  createBranchController,
  createDeliveryZoneController,
  createStoreController,
  getMyStoresController,
  getStoreController,
  setOperatingHoursController,
  updateBranchController,
  updateStoreController,
} from "./store.controller";
import {
  createBranchSchema,
  createDeliveryZoneSchema,
  createStoreSchema,
  setOperatingHoursSchema,
  updateBranchSchema,
  updateStoreSchema,
} from "./merchant.schema";

export const storeRoutes = Router();

storeRoutes.post("/stores", authenticate, authorize(["MERCHANT"]), validateBody(createStoreSchema), createStoreController);
storeRoutes.get("/stores", authenticate, authorize(["MERCHANT"]), getMyStoresController);
storeRoutes.get("/stores/:id", authenticate, getStoreController);
storeRoutes.put("/stores/:id", authenticate, authorize(["MERCHANT"]), validateBody(updateStoreSchema), updateStoreController);

storeRoutes.post("/stores/:id/branches", authenticate, authorize(["MERCHANT"]), validateBody(createBranchSchema), createBranchController);
storeRoutes.put("/stores/:id/branches/:branchId", authenticate, authorize(["MERCHANT"]), validateBody(updateBranchSchema), updateBranchController);

storeRoutes.post("/stores/:id/branches/:branchId/hours", authenticate, authorize(["MERCHANT"]), validateBody(setOperatingHoursSchema), setOperatingHoursController);
storeRoutes.post("/stores/:id/branches/:branchId/delivery-zones", authenticate, authorize(["MERCHANT"]), validateBody(createDeliveryZoneSchema), createDeliveryZoneController);
