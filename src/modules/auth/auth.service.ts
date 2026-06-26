import type { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { prisma } from "../../infrastructure/db/prisma";
import { AppError } from "../../common/errors/app-error";
import {
  durationToMs,
  generateOtpCode,
  generateRandomToken,
  hashValue,
} from "./auth.utils";
import type {
  ForgotPasswordInput,
  LoginInput,
  LogoutInput,
  RefreshTokenInput,
  RegisterEmailInput,
  RegisterPhoneInput,
  ResetPasswordInput,
  VerifyOtpInput,
} from "./auth.schema";

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

function buildAuthTokens(userId: string, role: UserRole): AuthTokens {
  const accessSignOptions: jwt.SignOptions = {
    subject: userId,
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  };

  const refreshSignOptions: jwt.SignOptions = {
    subject: userId,
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  };

  const accessToken = jwt.sign({ role }, env.JWT_ACCESS_SECRET, accessSignOptions);

  const refreshToken = jwt.sign({ role, type: "refresh" }, env.JWT_REFRESH_SECRET, refreshSignOptions);

  return { accessToken, refreshToken };
}

async function persistRefreshToken(userId: string, refreshToken: string): Promise<void> {
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashValue(refreshToken),
      expiresAt: new Date(Date.now() + durationToMs(env.JWT_REFRESH_EXPIRES_IN)),
    },
  });
}

function resolveChannel(target: string): "EMAIL" | "PHONE" {
  return target.includes("@") ? "EMAIL" : "PHONE";
}

async function issueOtp(target: string, purpose: "VERIFY_ACCOUNT" | "RESET_PASSWORD" | "LOGIN", userId?: string): Promise<string> {
  const code = generateOtpCode();

  await prisma.otpCode.create({
    data: {
      userId,
      purpose,
      channel: resolveChannel(target),
      target,
      codeHash: hashValue(code),
      expiresAt: new Date(Date.now() + env.OTP_EXPIRES_MINUTES * 60 * 1000),
    },
  });

  return code;
}

export async function registerWithEmail(input: RegisterEmailInput) {
  const existing = await prisma.user.findFirst({ where: { email: input.email } });
  if (existing) {
    throw new AppError("Email already registered", StatusCodes.CONFLICT);
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      role: input.role,
    },
  });

  const otp = await issueOtp(input.email, "VERIFY_ACCOUNT", user.id);

  return {
    userId: user.id,
    otpPreview: env.NODE_ENV === "production" ? undefined : otp,
    nextStep: "VERIFY_OTP",
  };
}

export async function registerWithPhone(input: RegisterPhoneInput) {
  const existing = await prisma.user.findFirst({ where: { phone: input.phone } });
  if (existing) {
    throw new AppError("Phone already registered", StatusCodes.CONFLICT);
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: {
      phone: input.phone,
      passwordHash,
      role: input.role,
    },
  });

  const otp = await issueOtp(input.phone, "VERIFY_ACCOUNT", user.id);

  return {
    userId: user.id,
    otpPreview: env.NODE_ENV === "production" ? undefined : otp,
    nextStep: "VERIFY_OTP",
  };
}

export async function verifyOtp(input: VerifyOtpInput) {
  const otpRecord = await prisma.otpCode.findFirst({
    where: {
      target: input.target,
      purpose: input.purpose,
      consumedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord) {
    throw new AppError("OTP not found", StatusCodes.NOT_FOUND);
  }

  if (otpRecord.expiresAt < new Date()) {
    throw new AppError("OTP expired", StatusCodes.BAD_REQUEST);
  }

  if (otpRecord.codeHash !== hashValue(input.code)) {
    throw new AppError("Invalid OTP", StatusCodes.BAD_REQUEST);
  }

  await prisma.otpCode.update({
    where: { id: otpRecord.id },
    data: { consumedAt: new Date() },
  });

  if (otpRecord.userId && input.purpose === "VERIFY_ACCOUNT") {
    await prisma.user.update({
      where: { id: otpRecord.userId },
      data: resolveChannel(input.target) === "EMAIL" ? { emailVerifiedAt: new Date() } : { phoneVerifiedAt: new Date() },
    });
  }

  return { verified: true };
}

export async function login(input: LoginInput) {
  const identifier = input.identifier.trim();

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { phone: identifier }],
    },
  });

  if (!user || !user.passwordHash) {
    throw new AppError("Invalid credentials", StatusCodes.UNAUTHORIZED);
  }

  const passwordValid = await bcrypt.compare(input.password, user.passwordHash);

  if (!passwordValid) {
    throw new AppError("Invalid credentials", StatusCodes.UNAUTHORIZED);
  }

  const tokens = buildAuthTokens(user.id, user.role);
  await persistRefreshToken(user.id, tokens.refreshToken);

  return {
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
    ...tokens,
  };
}

export async function refreshAuthToken(input: RefreshTokenInput) {
  let payload: jwt.JwtPayload;

  try {
    payload = jwt.verify(input.refreshToken, env.JWT_REFRESH_SECRET) as jwt.JwtPayload;
  } catch {
    throw new AppError("Invalid refresh token", StatusCodes.UNAUTHORIZED);
  }

  const refreshToken = await prisma.refreshToken.findFirst({
    where: {
      tokenHash: hashValue(input.refreshToken),
      revokedAt: null,
    },
  });

  if (!refreshToken || refreshToken.expiresAt < new Date()) {
    throw new AppError("Refresh token is expired or revoked", StatusCodes.UNAUTHORIZED);
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });

  if (!user) {
    throw new AppError("User not found", StatusCodes.NOT_FOUND);
  }

  const tokens = buildAuthTokens(user.id, user.role);

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: refreshToken.id },
      data: { revokedAt: new Date() },
    }),
    prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashValue(tokens.refreshToken),
        expiresAt: new Date(Date.now() + durationToMs(env.JWT_REFRESH_EXPIRES_IN)),
      },
    }),
  ]);

  return tokens;
}

export async function forgotPassword(input: ForgotPasswordInput) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: input.identifier }, { phone: input.identifier }],
    },
  });

  if (!user) {
    return { requested: true };
  }

  const rawToken = generateRandomToken();

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashValue(rawToken),
      expiresAt: new Date(Date.now() + env.RESET_TOKEN_EXPIRES_MINUTES * 60 * 1000),
    },
  });

  await issueOtp(input.identifier, "RESET_PASSWORD", user.id);

  return {
    requested: true,
    resetTokenPreview: env.NODE_ENV === "production" ? undefined : rawToken,
  };
}

export async function resetPassword(input: ResetPasswordInput) {
  const tokenRecord = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash: hashValue(input.token),
      usedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
    throw new AppError("Invalid or expired reset token", StatusCodes.BAD_REQUEST);
  }

  const passwordHash = await bcrypt.hash(input.newPassword, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: tokenRecord.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { reset: true };
}

export async function logout(input: LogoutInput) {
  await prisma.refreshToken.updateMany({
    where: {
      tokenHash: hashValue(input.refreshToken),
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  return { loggedOut: true };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError("User not found", StatusCodes.NOT_FOUND);
  }

  return user;
}
