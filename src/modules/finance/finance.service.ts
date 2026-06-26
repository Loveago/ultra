import { StatusCodes } from "http-status-codes";
import { prisma } from "../../infrastructure/db/prisma";
import { AppError } from "../../common/errors/app-error";
import { env } from "../../config/env";
import type {
  ListCommissionsInput,
  ListTransactionsInput,
  ListWithdrawalsInput,
  ProcessWithdrawalInput,
  RequestWithdrawalInput,
} from "./finance.schema";

async function getOrCreateWallet(userId: string) {
  let wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) {
    wallet = await prisma.wallet.create({ data: { userId } });
  }
  return wallet;
}

export async function getWalletBalance(userId: string) {
  const wallet = await getOrCreateWallet(userId);
  return {
    balance: wallet.balance,
    pendingBalance: wallet.pendingBalance,
    currency: wallet.currency,
  };
}

export async function listWalletTransactions(userId: string, input: ListTransactionsInput) {
  const wallet = await getOrCreateWallet(userId);
  const skip = (input.page - 1) * input.limit;

  const where: Record<string, unknown> = { walletId: wallet.id };
  if (input.type) where.type = input.type;

  const [items, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where,
      skip,
      take: input.limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.walletTransaction.count({ where }),
  ]);

  return { items, total, page: input.page, limit: input.limit, totalPages: Math.ceil(total / input.limit) };
}

export async function requestWithdrawal(userId: string, input: RequestWithdrawalInput) {
  const wallet = await getOrCreateWallet(userId);

  if (wallet.balance < input.amount) {
    throw new AppError("Insufficient wallet balance", StatusCodes.BAD_REQUEST);
  }

  const fee = input.method === "BANK_TRANSFER" ? Math.max(50, input.amount * 0.01) : 0;
  const netAmount = input.amount - fee;

  await prisma.wallet.update({
    where: { id: wallet.id },
    data: { balance: { decrement: input.amount } },
  });

  const balanceAfter = wallet.balance - input.amount;

  await prisma.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: "WITHDRAWAL",
      amount: input.amount,
      balanceBefore: wallet.balance,
      balanceAfter,
      description: `Withdrawal request via ${input.method}`,
      reference: `wd_${Date.now()}`,
    },
  });

  return prisma.withdrawal.create({
    data: {
      userId,
      amount: input.amount,
      fee,
      netAmount,
      method: input.method as never,
      bankName: input.bankName,
      bankAccountName: input.bankAccountName,
      bankAccountNo: input.bankAccountNo,
    },
  });
}

export async function listMyWithdrawals(userId: string, input: ListWithdrawalsInput) {
  const skip = (input.page - 1) * input.limit;

  const where: Record<string, unknown> = { userId };
  if (input.status) where.status = input.status;

  const [items, total] = await Promise.all([
    prisma.withdrawal.findMany({
      where,
      skip,
      take: input.limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.withdrawal.count({ where }),
  ]);

  return { items, total, page: input.page, limit: input.limit, totalPages: Math.ceil(total / input.limit) };
}

export async function listAllWithdrawals(input: ListWithdrawalsInput) {
  const skip = (input.page - 1) * input.limit;

  const where: Record<string, unknown> = {};
  if (input.status) where.status = input.status;

  const [items, total] = await Promise.all([
    prisma.withdrawal.findMany({
      where,
      skip,
      take: input.limit,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, email: true, phone: true } } },
    }),
    prisma.withdrawal.count({ where }),
  ]);

  return { items, total, page: input.page, limit: input.limit, totalPages: Math.ceil(total / input.limit) };
}

export async function processWithdrawal(adminId: string, withdrawalId: string, input: ProcessWithdrawalInput) {
  const withdrawal = await prisma.withdrawal.findUnique({ where: { id: withdrawalId } });
  if (!withdrawal) {
    throw new AppError("Withdrawal not found", StatusCodes.NOT_FOUND);
  }

  if (withdrawal.status !== "PENDING" && withdrawal.status !== "APPROVED" && withdrawal.status !== "PROCESSING") {
    throw new AppError(`Cannot process withdrawal in ${withdrawal.status} state`, StatusCodes.BAD_REQUEST);
  }

  const updateData: Record<string, unknown> = {
    status: input.status as never,
  };

  if (input.status === "APPROVED") updateData.processedAt = new Date();
  if (input.status === "COMPLETED") {
    updateData.completedAt = new Date();
    if (input.reference) updateData.reference = input.reference;
  }
  if (input.status === "REJECTED") updateData.rejectedReason = input.rejectedReason;
  if (input.status === "CANCELLED") updateData.rejectedReason = input.rejectedReason;

  if (input.status === "REJECTED" || input.status === "CANCELLED") {
    const wallet = await getOrCreateWallet(withdrawal.userId);
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: withdrawal.amount } },
    });

    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "REFUND",
        amount: withdrawal.amount,
        balanceBefore: wallet.balance,
        balanceAfter: wallet.balance + withdrawal.amount,
        description: `Refund for cancelled/rejected withdrawal ${withdrawal.id}`,
        reference: `refund_${withdrawal.id}`,
      },
    });
  }

  return prisma.withdrawal.update({
    where: { id: withdrawalId },
    data: updateData,
  });
}

export async function getFinanceOverview(userId: string) {
  const wallet = await getOrCreateWallet(userId);

  const withdrawals = await prisma.withdrawal.aggregate({
    where: { userId },
    _sum: { amount: true },
    _count: true,
  });

  const completedWithdrawals = await prisma.withdrawal.aggregate({
    where: { userId, status: "COMPLETED" },
    _sum: { netAmount: true },
    _count: true,
  });

  const pendingWithdrawals = await prisma.withdrawal.aggregate({
    where: { userId, status: { in: ["PENDING", "APPROVED", "PROCESSING"] } },
    _sum: { amount: true },
    _count: true,
  });

  const transactions = await prisma.walletTransaction.aggregate({
    where: { walletId: wallet.id },
    _sum: { amount: true },
    _count: true,
  });

  return {
    walletBalance: wallet.balance,
    pendingBalance: wallet.pendingBalance,
    totalWithdrawals: withdrawals._sum.amount ?? 0,
    totalWithdrawalCount: withdrawals._count,
    completedWithdrawals: completedWithdrawals._sum.netAmount ?? 0,
    completedWithdrawalCount: completedWithdrawals._count,
    pendingWithdrawals: pendingWithdrawals._sum.amount ?? 0,
    pendingWithdrawalCount: pendingWithdrawals._count,
    totalTransactions: transactions._count,
  };
}

export async function listCommissions(input: ListCommissionsInput) {
  const skip = (input.page - 1) * input.limit;

  const where: Record<string, unknown> = {};
  if (input.merchantId) where.merchantId = input.merchantId;

  const [items, total] = await Promise.all([
    prisma.commissionLog.findMany({
      where,
      skip,
      take: input.limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.commissionLog.count({ where }),
  ]);

  return { items, total, page: input.page, limit: input.limit, totalPages: Math.ceil(total / input.limit) };
}

export async function getCommissionSummary(merchantId?: string) {
  const where: Record<string, unknown> = {};
  if (merchantId) where.merchantId = merchantId;

  const result = await prisma.commissionLog.aggregate({
    where,
    _sum: { grossAmount: true, commissionAmount: true, merchantNetAmount: true },
    _count: true,
  });

  return {
    totalGross: result._sum.grossAmount ?? 0,
    totalCommission: result._sum.commissionAmount ?? 0,
    totalMerchantNet: result._sum.merchantNetAmount ?? 0,
    totalOrders: result._count,
    commissionRate: env.PLATFORM_COMMISSION_RATE,
  };
}
