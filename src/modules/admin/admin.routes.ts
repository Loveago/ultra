import { Router } from "express";
import { authenticate } from "../../common/middleware/authenticate";
import { authorize } from "../../common/middleware/authorize";
import { validateBody } from "../../common/middleware/validate";
import {
  listMerchantsController,
  listRidersController,
  listUsersController,
  systemStatsController,
  updateMerchantController,
  updateRiderController,
  updateUserController,
  getUserController,
} from "./admin.controller";
import {
  adminUpdateMerchantSchema,
  adminUpdateRiderSchema,
  adminUpdateUserSchema,
} from "./admin.schema";

export const adminRoutes = Router();

adminRoutes.use(authenticate);
adminRoutes.use(authorize(["ADMIN", "SUPER_ADMIN"]));

// System stats
adminRoutes.get("/admin/stats", systemStatsController);

// User management
adminRoutes.get("/admin/users", listUsersController);
adminRoutes.get("/admin/users/:id", getUserController);
adminRoutes.put("/admin/users/:id", validateBody(adminUpdateUserSchema), updateUserController);

// Merchant management
adminRoutes.get("/admin/merchants", listMerchantsController);
adminRoutes.put("/admin/merchants/:id", validateBody(adminUpdateMerchantSchema), updateMerchantController);

// Rider management
adminRoutes.get("/admin/riders", listRidersController);
adminRoutes.put("/admin/riders/:id", validateBody(adminUpdateRiderSchema), updateRiderController);
