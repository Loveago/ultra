import type { Request, Response } from "express";
import {
  forgotPassword,
  getCurrentUser,
  login,
  logout,
  refreshAuthToken,
  registerWithEmail,
  registerWithPhone,
  resetPassword,
  verifyOtp,
} from "./auth.service";

/**
 * @openapi
 * /api/v1/auth/register/email:
 *   post:
 *     tags: [Auth]
 *     summary: Register with email and password
 */
export async function registerEmailController(req: Request, res: Response): Promise<void> {
  const data = await registerWithEmail(req.body);
  res.status(201).json({ success: true, data });
}

/**
 * @openapi
 * /api/v1/auth/register/phone:
 *   post:
 *     tags: [Auth]
 *     summary: Register with phone and password
 */
export async function registerPhoneController(req: Request, res: Response): Promise<void> {
  const data = await registerWithPhone(req.body);
  res.status(201).json({ success: true, data });
}

/**
 * @openapi
 * /api/v1/auth/otp/verify:
 *   post:
 *     tags: [Auth]
 *     summary: Verify OTP code
 */
export async function verifyOtpController(req: Request, res: Response): Promise<void> {
  const data = await verifyOtp(req.body);
  res.status(200).json({ success: true, data });
}

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email or phone and password
 */
export async function loginController(req: Request, res: Response): Promise<void> {
  const data = await login(req.body);
  res.status(200).json({ success: true, data });
}

/**
 * @openapi
 * /api/v1/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Rotate and issue new access/refresh tokens
 */
export async function refreshController(req: Request, res: Response): Promise<void> {
  const data = await refreshAuthToken(req.body);
  res.status(200).json({ success: true, data });
}

/**
 * @openapi
 * /api/v1/auth/password/forgot:
 *   post:
 *     tags: [Auth]
 *     summary: Request password reset token
 */
export async function forgotPasswordController(req: Request, res: Response): Promise<void> {
  const data = await forgotPassword(req.body);
  res.status(200).json({ success: true, data });
}

/**
 * @openapi
 * /api/v1/auth/password/reset:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password using reset token
 */
export async function resetPasswordController(req: Request, res: Response): Promise<void> {
  const data = await resetPassword(req.body);
  res.status(200).json({ success: true, data });
}

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Revoke refresh token
 */
export async function logoutController(req: Request, res: Response): Promise<void> {
  const data = await logout(req.body);
  res.status(200).json({ success: true, data });
}

/**
 * @openapi
 * /api/v1/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current authenticated user profile
 */
export async function meController(req: Request, res: Response): Promise<void> {
  const data = await getCurrentUser(req.auth!.userId);
  res.status(200).json({ success: true, data });
}

export async function adminProbeController(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ success: true, data: { allowed: true } });
}
