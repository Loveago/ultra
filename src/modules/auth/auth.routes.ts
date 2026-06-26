import { Router } from "express";
import { authenticate } from "../../common/middleware/authenticate";
import { authorize } from "../../common/middleware/authorize";
import { validateBody } from "../../common/middleware/validate";
import {
  adminProbeController,
  forgotPasswordController,
  loginController,
  logoutController,
  meController,
  refreshController,
  registerEmailController,
  registerPhoneController,
  resetPasswordController,
  verifyOtpController,
} from "./auth.controller";
import {
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  registerEmailSchema,
  registerPhoneSchema,
  resetPasswordSchema,
  verifyOtpSchema,
} from "./auth.schema";

export const authRoutes = Router();

authRoutes.post("/auth/register/email", validateBody(registerEmailSchema), registerEmailController);
authRoutes.post("/auth/register/phone", validateBody(registerPhoneSchema), registerPhoneController);
authRoutes.post("/auth/otp/verify", validateBody(verifyOtpSchema), verifyOtpController);
authRoutes.post("/auth/login", validateBody(loginSchema), loginController);
authRoutes.post("/auth/refresh", validateBody(refreshTokenSchema), refreshController);
authRoutes.post("/auth/password/forgot", validateBody(forgotPasswordSchema), forgotPasswordController);
authRoutes.post("/auth/password/reset", validateBody(resetPasswordSchema), resetPasswordController);
authRoutes.post("/auth/logout", validateBody(logoutSchema), logoutController);

// Protected routes

authRoutes.get("/auth/me", authenticate, meController);
authRoutes.get("/auth/admin/probe", authenticate, authorize(["ADMIN", "SUPER_ADMIN"]), adminProbeController);
