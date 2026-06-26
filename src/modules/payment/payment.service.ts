import { Prisma } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../../infrastructure/db/prisma";
import { AppError } from "../../common/errors/app-error";
import { env } from "../../config/env";
import type {
  InitializePaystackInput,
  RefundInput,
  ReleaseEscrowInput,
  WalletPayInput,
} from "./payment.schema";

const PLATFORM_COMMISSION = env.PLATFORM_COMMISSION_RATE;

async function getOrCreateWallet(userId: string) {
  let wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) {
    wallet = await prisma.wallet.create({ data: { userId } });
  }
  return wallet;
}

async function createEscrowAndSettlement(orderId: string) {
  const storeGroups = await prisma.orderStoreGroup.findMany({
    where: { orderId },
  });

  for (const group of storeGroups) {
    const platformFee = group.subtotal * PLATFORM_COMMISSION;
    const storeAmount = group.total - platformFee;

    await prisma.escrow.create({
      data: {
        storeGroupId: group.id,
        amount: storeAmount,
        status: "HELD",
      },
    });

    await prisma.settlement.create({
      data: {
        storeGroupId: group.id,
        storeAmount,
        platformFee,
        deliveryFee: group.deliveryFee,
        totalAmount: storeAmount,
        status: "PENDING",
      },
    });
  }
}

export async function initializePaystack(userId: string, input: InitializePaystackInput) {
  const order = await prisma.order.findFirst({
    where: { id: input.orderId, userId },
    include: { storeGroups: true },
  });

  if (!order) {
    throw new AppError("Order not found", StatusCodes.NOT_FOUND);
  }

  if (order.paymentStatus === "PAID") {
    throw new AppError("Order already paid", StatusCodes.BAD_REQUEST);
  }

  const reference = `ULK-${order.orderNumber}-${Date.now()}`;

  const payment = await prisma.payment.create({
    data: {
      orderId: order.id,
      provider: "PAYSTACK",
      providerRef: reference,
      amount: order.grandTotal,
      status: "PENDING",
    },
  });

  const response = await fetch(`${env.PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reference,
      amount: Math.round(order.grandTotal * 100),
      currency: "NGN",
      callback_url: input.callbackUrl ?? `${env.CORS_ORIGIN}/payments/callback`,
      metadata: {
        orderId: order.id,
        paymentId: payment.id,
        userId,
      },
    }),
  });

  const data = await response.json() as { status: boolean; data: { authorization_url: string; access_code: string; reference: string } };

  if (!data.status) {
    throw new AppError("Failed to initialize Paystack transaction", StatusCodes.BAD_GATEWAY);
  }

  return {
    paymentId: payment.id,
    reference,
    authorizationUrl: data.data.authorization_url,
    accessCode: data.data.access_code,
  };
}

export async function verifyPaystackTransaction(reference: string) {
  const payment = await prisma.payment.findUnique({
    where: { providerRef: reference },
    include: { order: true },
  });

  if (!payment) {
    throw new AppError("Payment not found", StatusCodes.NOT_FOUND);
  }

  const response = await fetch(`${env.PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
    },
  });

  const data = await response.json() as {
    status: boolean;
    data: {
      status: string;
      amount: number;
      currency: string;
      reference: string;
    };
  };

  if (!data.status) {
    throw new AppError("Failed to verify transaction", StatusCodes.BAD_GATEWAY);
  }

  if (data.data.status === "success") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "SUCCESS",
        paidAt: new Date(),
      },
    });

    await prisma.order.update({
      where: { id: payment.orderId },
      data: {
        paymentStatus: "PAID",
        status: "CONFIRMED",
      },
    });

    await createEscrowAndSettlement(payment.orderId);
  } else {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    });
  }

  return {
    reference,
    status: data.data.status,
    amount: data.data.amount / 100,
  };
}

export async function handlePaystackWebhook(payload: Record<string, unknown>, signature: string) {
  if (signature !== env.PAYSTACK_WEBHOOK_SECRET) {
    throw new AppError("Invalid webhook signature", StatusCodes.UNAUTHORIZED);
  }

  const event = payload.event as string;
  const data = payload.data as Record<string, unknown>;

  if (event === "charge.success") {
    const reference = data.reference as string;
    await verifyPaystackTransaction(reference);
  }

  return { received: true };
}

export async function walletPay(userId: string, input: WalletPayInput) {
  const order = await prisma.order.findFirst({
    where: { id: input.orderId, userId },
  });

  if (!order) {
    throw new AppError("Order not found", StatusCodes.NOT_FOUND);
  }

  if (order.paymentStatus === "PAID") {
    throw new AppError("Order already paid", StatusCodes.BAD_REQUEST);
  }

  const wallet = await getOrCreateWallet(userId);

  if (wallet.balance < order.grandTotal) {
    throw new AppError("Insufficient wallet balance", StatusCodes.BAD_REQUEST);
  }

  const balanceBefore = wallet.balance;
  const balanceAfter = balanceBefore - order.grandTotal;

  await prisma.$transaction(async (tx) => {
    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: balanceAfter },
    });

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "DEBIT",
        amount: order.grandTotal,
        balanceBefore,
        balanceAfter,
        description: `Payment for order ${order.orderNumber}`,
        reference: order.id,
      },
    });

    await tx.payment.create({
      data: {
        orderId: order.id,
        provider: "WALLET",
        amount: order.grandTotal,
        status: "SUCCESS",
        paidAt: new Date(),
      },
    });

    await tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "PAID",
        status: "CONFIRMED",
      },
    });
  });

  await createEscrowAndSettlement(order.id);

  return {
    orderId: order.id,
    newBalance: balanceAfter,
    status: "SUCCESS",
  };
}

export async function getWalletBalance(userId: string) {
  const wallet = await getOrCreateWallet(userId);
  return {
    balance: wallet.balance,
    pendingBalance: wallet.pendingBalance,
    currency: wallet.currency,
  };
}

export async function getWalletTransactions(userId: string, page = 1, limit = 20) {
  const wallet = await getOrCreateWallet(userId);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.walletTransaction.count({ where: { walletId: wallet.id } }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function initiateRefund(input: RefundInput) {
  const payment = await prisma.payment.findUnique({
    where: { id: input.paymentId },
    include: { order: true },
  });

  if (!payment) {
    throw new AppError("Payment not found", StatusCodes.NOT_FOUND);
  }

  if (payment.status !== "SUCCESS") {
    throw new AppError("Can only refund successful payments", StatusCodes.BAD_REQUEST);
  }

  const refundAmount = input.amount ?? payment.amount;

  if (refundAmount > payment.amount) {
    throw new AppError("Refund amount exceeds payment amount", StatusCodes.BAD_REQUEST);
  }

  const refund = await prisma.paymentRefund.create({
    data: {
      paymentId: payment.id,
      amount: refundAmount,
      reason: input.reason,
      status: "PENDING",
    },
  });

  if (payment.provider === "PAYSTACK") {
    const response = await fetch(`${env.PAYSTACK_BASE_URL}/refund`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transaction: payment.providerRef,
        amount: Math.round(refundAmount * 100),
        merchant_note: input.reason ?? "Customer refund",
      }),
    });

    const data = await response.json() as { status: boolean; data: { reference: string } };

    if (data.status) {
      await prisma.paymentRefund.update({
        where: { id: refund.id },
        data: {
          status: "COMPLETED",
          providerRef: data.data.reference,
        },
      });

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: refundAmount >= payment.amount ? "REFUNDED" : "PARTIALLY_REFUNDED",
        },
      });

      await prisma.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: refundAmount >= payment.amount ? "REFUNDED" : "PARTIALLY_REFUNDED",
          status: "CANCELLED",
        },
      });
    }
  } else if (payment.provider === "WALLET") {
    const wallet = await prisma.wallet.findUnique({
      where: { userId: payment.order.userId },
    });

    if (wallet) {
      const balanceBefore = wallet.balance;
      const balanceAfter = balanceBefore + refundAmount;

      await prisma.$transaction(async (tx) => {
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: balanceAfter },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: "REFUND",
            amount: refundAmount,
            balanceBefore,
            balanceAfter,
            description: `Refund for order ${payment.order.orderNumber}`,
            reference: payment.orderId,
          },
        });

        await tx.paymentRefund.update({
          where: { id: refund.id },
          data: { status: "COMPLETED" },
        });

        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: refundAmount >= payment.amount ? "REFUNDED" : "PARTIALLY_REFUNDED",
          },
        });

        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: refundAmount >= payment.amount ? "REFUNDED" : "PARTIALLY_REFUNDED",
            status: "CANCELLED",
          },
        });
      });
    }
  }

  return refund;
}

export async function releaseEscrow(input: ReleaseEscrowInput) {
  const escrow = await prisma.escrow.findUnique({
    where: { storeGroupId: input.storeGroupId },
  });

  if (!escrow) {
    throw new AppError("Escrow not found", StatusCodes.NOT_FOUND);
  }

  if (escrow.status !== "HELD") {
    throw new AppError("Escrow is not in HELD state", StatusCodes.BAD_REQUEST);
  }

  const storeGroup = await prisma.orderStoreGroup.findUnique({
    where: { id: input.storeGroupId },
  });

  if (!storeGroup) {
    throw new AppError("Store group not found", StatusCodes.NOT_FOUND);
  }

  await prisma.escrow.update({
    where: { id: escrow.id },
    data: {
      status: "RELEASED",
      releasedAt: new Date(),
    },
  });

  await prisma.orderStoreGroup.update({
    where: { id: storeGroup.id },
    data: { status: "DELIVERED" },
  });

  const store = await prisma.store.findUnique({
    where: { id: storeGroup.storeId },
  });

  if (store) {
    const merchant = await prisma.merchant.findUnique({
      where: { id: store.merchantId },
    });

    if (merchant) {
      const merchantWallet = await getOrCreateWallet(merchant.userId);
      const balanceBefore = merchantWallet.balance;
      const balanceAfter = balanceBefore + escrow.amount;

      await prisma.$transaction(async (tx) => {
        await tx.wallet.update({
          where: { id: merchantWallet.id },
          data: { balance: balanceAfter },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: merchantWallet.id,
            type: "CREDIT",
            amount: escrow.amount,
            balanceBefore,
            balanceAfter,
            description: `Settlement for store group ${storeGroup.id}`,
            reference: storeGroup.id,
          },
        });

        await tx.settlement.update({
          where: { storeGroupId: storeGroup.id },
          data: {
            status: "SETTLED",
            settledAt: new Date(),
          },
        });
      });
    }
  }

  return { released: true, amount: escrow.amount };
}

export async function getMerchantSettlements(userId: string, page = 1, limit = 20) {
  const merchant = await prisma.merchant.findUnique({ where: { userId } });
  if (!merchant) {
    throw new AppError("Merchant profile not found", StatusCodes.NOT_FOUND);
  }

  const stores = await prisma.store.findMany({
    where: { merchantId: merchant.id },
    select: { id: true },
  });
  const storeIds = stores.map((s: { id: string }) => s.id);

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.settlement.findMany({
      where: { storeGroup: { storeId: { in: storeIds } } },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        storeGroup: { select: { storeId: true, orderId: true, total: true } },
      },
    }),
    prisma.settlement.count({
      where: { storeGroup: { storeId: { in: storeIds } } },
    }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function processPendingSettlements() {
  const pending = await prisma.settlement.findMany({
    where: { status: "PENDING" },
    include: { storeGroup: true },
  });

  const results: { id: string; success: boolean; error?: string }[] = [];

  for (const settlement of pending) {
    try {
      const escrow = await prisma.escrow.findUnique({
        where: { storeGroupId: settlement.storeGroupId },
      });

      if (escrow && escrow.status === "RELEASED") {
        await prisma.settlement.update({
          where: { id: settlement.id },
          data: { status: "SETTLED", settledAt: new Date() },
        });
        results.push({ id: settlement.id, success: true });
      } else {
        results.push({ id: settlement.id, success: false, error: "Escrow not released" });
      }
    } catch (err) {
      results.push({ id: settlement.id, success: false, error: (err as Error).message });
    }
  }

  return {
    processed: results.filter((r) => r.success).length,
    skipped: results.filter((r) => !r.success).length,
    results,
  };
}
