import { z } from "zod";

const registrationRoleSchema = z.enum(["CUSTOMER", "RIDER", "MERCHANT"]).default("CUSTOMER");

export const registerEmailSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  role: registrationRoleSchema.optional(),
});

export const registerPhoneSchema = z.object({
  phone: z.string().min(7).max(20),
  password: z.string().min(8).max(72),
  role: registrationRoleSchema.optional(),
});

export const verifyOtpSchema = z.object({
  target: z.string().min(3),
  code: z.string().length(6),
  purpose: z.enum(["VERIFY_ACCOUNT", "RESET_PASSWORD", "LOGIN"]),
});

export const loginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(8).max(72),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(16),
});

export const forgotPasswordSchema = z.object({
  identifier: z.string().min(3),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(16),
  newPassword: z.string().min(8).max(72),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(16),
});

export type RegisterEmailInput = z.infer<typeof registerEmailSchema>;
export type RegisterPhoneInput = z.infer<typeof registerPhoneSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
