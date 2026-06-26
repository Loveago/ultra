import { Router } from "express";
import { authenticate } from "../../common/middleware/authenticate";
import { authorize } from "../../common/middleware/authorize";
import { validateBody } from "../../common/middleware/validate";
import {
  dashboardController,
  getKycStatusController,
  getMyMerchantController,
  registerMerchantController,
  reviewKycController,
  uploadKycController,
} from "./merchant.controller";
import {
  registerMerchantSchema,
  reviewKycSchema,
  uploadKycSchema,
} from "./merchant.schema";

export const merchantRoutes = Router();

merchantRoutes.post("/merchants/register", authenticate, authorize(["MERCHANT"]), validateBody(registerMerchantSchema), registerMerchantController);
merchantRoutes.get("/merchants/me", authenticate, authorize(["MERCHANT"]), getMyMerchantController);
merchantRoutes.post("/merchants/kyc/documents", authenticate, authorize(["MERCHANT"]), validateBody(uploadKycSchema), uploadKycController);
merchantRoutes.get("/merchants/kyc/status", authenticate, authorize(["MERCHANT"]), getKycStatusController);
merchantRoutes.post("/merchants/kyc/:id/review", authenticate, authorize(["ADMIN", "SUPER_ADMIN"]), validateBody(reviewKycSchema), reviewKycController);
merchantRoutes.get("/merchants/dashboard", authenticate, authorize(["MERCHANT"]), dashboardController);
