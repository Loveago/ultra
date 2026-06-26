import { StatusCodes } from "http-status-codes";
import { prisma } from "../../infrastructure/db/prisma";
import { AppError } from "../../common/errors/app-error";
import type {
  BlockIpInput,
  ListAuditLogsInput,
  ListRiskScoresInput,
  LogAuditInput,
  RegisterDeviceInput,
} from "./security.schema";

export async function logAudit(
  userId: string | null,
  input: LogAuditInput,
  ipAddress?: string,
  userAgent?: string,
) {
  return prisma.auditLog.create({
    data: {
      userId,
      action: input.action as never,
      resource: input.resource,
      resourceId: input.resourceId,
      ipAddress,
      userAgent,
      metadata: input.metadata as never,
      riskLevel: input.riskLevel as never,
    },
  });
}

export async function listAuditLogs(input: ListAuditLogsInput) {
  const skip = (input.page - 1) * input.limit;

  const where: Record<string, unknown> = {};
  if (input.userId) where.userId = input.userId;
  if (input.action) where.action = input.action;
  if (input.riskLevel) where.riskLevel = input.riskLevel;

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({ where, skip, take: input.limit, orderBy: { createdAt: "desc" } }),
    prisma.auditLog.count({ where }),
  ]);

  return { items, total, page: input.page, limit: input.limit, totalPages: Math.ceil(total / input.limit) };
}

export async function registerDevice(userId: string, input: RegisterDeviceInput, ipAddress?: string, userAgent?: string) {
  const existing = await prisma.deviceFingerprint.findUnique({
    where: { userId_fingerprint: { userId, fingerprint: input.fingerprint } },
  });

  if (existing) {
    return prisma.deviceFingerprint.update({
      where: { id: existing.id },
      data: {
        deviceInfo: input.deviceInfo as never,
        ipAddress,
        userAgent,
        lastSeen: new Date(),
      },
    });
  }

  return prisma.deviceFingerprint.create({
    data: {
      userId,
      fingerprint: input.fingerprint,
      deviceInfo: input.deviceInfo as never,
      ipAddress,
      userAgent,
    },
  });
}

export async function listUserDevices(userId: string) {
  return prisma.deviceFingerprint.findMany({
    where: { userId },
    orderBy: { lastSeen: "desc" },
  });
}

export async function trustDevice(userId: string, deviceId: string, isTrusted: boolean) {
  const device = await prisma.deviceFingerprint.findFirst({
    where: { id: deviceId, userId },
  });

  if (!device) {
    throw new AppError("Device not found", StatusCodes.NOT_FOUND);
  }

  return prisma.deviceFingerprint.update({
    where: { id: deviceId },
    data: { isTrusted },
  });
}

export async function calculateRiskScore(userId: string, entityType: string, entityId: string) {
  const factors: Record<string, number> = {};
  let score = 0;

  const recentOrders = await prisma.order.count({
    where: { userId, createdAt: { gte: new Date(Date.now() - 3600_000) } },
  });
  if (recentOrders > 5) {
    factors["rapid_orders"] = 20;
    score += 20;
  }

  const failedPayments = await prisma.payment.count({
    where: { order: { userId }, status: "FAILED", createdAt: { gte: new Date(Date.now() - 86400_000) } },
  });
  if (failedPayments > 3) {
    factors["failed_payments"] = 25;
    score += 25;
  }

  const userDevices = await prisma.deviceFingerprint.count({
    where: { userId, isTrusted: false },
  });
  if (userDevices > 3) {
    factors["untrusted_devices"] = 15;
    score += 15;
  }

  const recentWithdrawals = await prisma.withdrawal.count({
    where: { userId, createdAt: { gte: new Date(Date.now() - 86400_000) } },
  });
  if (recentWithdrawals > 3) {
    factors["rapid_withdrawals"] = 20;
    score += 20;
  }

  const level = score >= 60 ? "BLOCKED" : score >= 40 ? "HIGH" : score >= 20 ? "MEDIUM" : "LOW";

  return prisma.riskScore.create({
    data: {
      userId,
      entityType,
      entityId,
      score,
      level: level as never,
      factors: factors as never,
    },
  });
}

export async function listRiskScores(input: ListRiskScoresInput) {
  const skip = (input.page - 1) * input.limit;

  const where: Record<string, unknown> = {};
  if (input.level) where.level = input.level;
  if (input.resolved !== undefined) where.resolved = input.resolved;

  const [items, total] = await Promise.all([
    prisma.riskScore.findMany({ where, skip, take: input.limit, orderBy: { createdAt: "desc" } }),
    prisma.riskScore.count({ where }),
  ]);

  return { items, total, page: input.page, limit: input.limit, totalPages: Math.ceil(total / input.limit) };
}

export async function resolveRiskScore(adminId: string, riskId: string) {
  const risk = await prisma.riskScore.findUnique({ where: { id: riskId } });
  if (!risk) {
    throw new AppError("Risk score not found", StatusCodes.NOT_FOUND);
  }

  return prisma.riskScore.update({
    where: { id: riskId },
    data: { resolved: true, resolvedAt: new Date(), resolvedBy: adminId },
  });
}

export async function blockIp(adminId: string, input: BlockIpInput) {
  const existing = await prisma.blockedIp.findUnique({ where: { ipAddress: input.ipAddress } });
  if (existing) {
    throw new AppError("IP already blocked", StatusCodes.CONFLICT);
  }

  return prisma.blockedIp.create({
    data: { ipAddress: input.ipAddress, reason: input.reason, blockedBy: adminId },
  });
}

export async function unblockIp(ipAddress: string) {
  const existing = await prisma.blockedIp.findUnique({ where: { ipAddress } });
  if (!existing) {
    throw new AppError("IP not found in blocklist", StatusCodes.NOT_FOUND);
  }

  await prisma.blockedIp.delete({ where: { ipAddress } });
  return { unblocked: true };
}

export async function listBlockedIps() {
  return prisma.blockedIp.findMany({ orderBy: { createdAt: "desc" } });
}

export async function isIpBlocked(ipAddress: string): Promise<boolean> {
  const blocked = await prisma.blockedIp.findUnique({ where: { ipAddress } });
  return !!blocked;
}
