import { StatusCodes } from "http-status-codes";
import { prisma } from "../../infrastructure/db/prisma";
import { AppError } from "../../common/errors/app-error";
import type {
  CancelOrderInput,
  ListOrdersInput,
  UpdateOrderStatusInput,
  UpdateStoreGroupStatusInput,
} from "./order.schema";

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY_FOR_PICKUP", "CANCELLED"],
  READY_FOR_PICKUP: ["OUT_FOR_DELIVERY", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

function isValidTransition(from: string, to: string): boolean {
  const allowed = VALID_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

async function recordTimeline(
  orderId: string,
  fromStatus: string | null,
  toStatus: string,
  changedBy: string,
  reason?: string,
  note?: string
) {
  await prisma.orderTimeline.create({
    data: {
      orderId,
      fromStatus: fromStatus as never,
      toStatus: toStatus as never,
      changedBy,
      reason,
      note,
    },
  });
}

export async function listMyOrders(userId: string, input: ListOrdersInput) {
  const skip = (input.page - 1) * input.limit;

  const where: Record<string, unknown> = { userId };
  if (input.status) where.status = input.status;

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: input.limit,
      orderBy: { createdAt: "desc" },
      include: {
        storeGroups: { select: { id: true, storeId: true, status: true, total: true } },
        items: { select: { id: true, productId: true, quantity: true, unitPrice: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return { items, total, page: input.page, limit: input.limit, totalPages: Math.ceil(total / input.limit) };
}

export async function getOrder(userId: string, orderId: string, isAdmin = false) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      storeGroups: true,
      payment: { include: { refunds: true } },
      timeline: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!order) {
    throw new AppError("Order not found", StatusCodes.NOT_FOUND);
  }

  if (!isAdmin && order.userId !== userId) {
    const merchant = await prisma.merchant.findUnique({ where: { userId } });
    if (!merchant) {
      throw new AppError("Order not found", StatusCodes.NOT_FOUND);
    }
    const storeIds = await prisma.store.findMany({
      where: { merchantId: merchant.id },
      select: { id: true },
    });
    const storeIdList = storeIds.map((s: { id: string }) => s.id);
    const hasStoreInOrder = order.storeGroups.some((sg) => storeIdList.includes(sg.storeId));
    if (!hasStoreInOrder) {
      throw new AppError("Order not found", StatusCodes.NOT_FOUND);
    }
  }

  return order;
}

export async function updateOrderStatus(
  userId: string,
  orderId: string,
  input: UpdateOrderStatusInput
) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new AppError("Order not found", StatusCodes.NOT_FOUND);
  }

  if (order.status === input.status) {
    throw new AppError("Order is already in this status", StatusCodes.BAD_REQUEST);
  }

  if (!isValidTransition(order.status, input.status)) {
    throw new AppError(
      `Invalid status transition from ${order.status} to ${input.status}`,
      StatusCodes.BAD_REQUEST
    );
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: input.status as never },
  });

  await recordTimeline(orderId, order.status, input.status, userId, input.reason, input.note);

  return prisma.order.findUnique({
    where: { id: orderId },
    include: { timeline: { orderBy: { createdAt: "asc" } } },
  });
}

export async function updateStoreGroupStatus(
  userId: string,
  orderId: string,
  groupId: string,
  input: UpdateStoreGroupStatusInput
) {
  const storeGroup = await prisma.orderStoreGroup.findFirst({
    where: { id: groupId, orderId },
  });

  if (!storeGroup) {
    throw new AppError("Store group not found", StatusCodes.NOT_FOUND);
  }

  if (storeGroup.status === input.status) {
    throw new AppError("Store group is already in this status", StatusCodes.BAD_REQUEST);
  }

  if (!isValidTransition(storeGroup.status, input.status)) {
    throw new AppError(
      `Invalid status transition from ${storeGroup.status} to ${input.status}`,
      StatusCodes.BAD_REQUEST
    );
  }

  await prisma.orderStoreGroup.update({
    where: { id: groupId },
    data: { status: input.status as never },
  });

  await recordTimeline(orderId, storeGroup.status, input.status, userId, input.reason, input.note);

  const allGroups = await prisma.orderStoreGroup.findMany({
    where: { orderId },
  });

  const allDelivered = allGroups.every((g) => g.status === "DELIVERED");
  const anyCancelled = allGroups.some((g) => g.status === "CANCELLED");
  const allCancelled = allGroups.every((g) => g.status === "CANCELLED");

  if (allDelivered) {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "DELIVERED" as never },
    });
    await recordTimeline(orderId, null, "DELIVERED", userId, "All store groups delivered");
  } else if (allCancelled) {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" as never },
    });
    await recordTimeline(orderId, null, "CANCELLED", userId, "All store groups cancelled");
  } else if (anyCancelled && allGroups.every((g) => g.status === "DELIVERED" || g.status === "CANCELLED")) {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "DELIVERED" as never },
    });
    await recordTimeline(orderId, null, "DELIVERED", userId, "All active store groups delivered");
  }

  return prisma.orderStoreGroup.findUnique({
    where: { id: groupId },
    include: { order: { include: { timeline: { orderBy: { createdAt: "asc" } } } } },
  });
}

export async function cancelOrder(userId: string, orderId: string, input: CancelOrderInput) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new AppError("Order not found", StatusCodes.NOT_FOUND);
  }

  if (order.userId !== userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      throw new AppError("Not authorized to cancel this order", StatusCodes.FORBIDDEN);
    }
  }

  if (order.status === "DELIVERED" || order.status === "CANCELLED") {
    throw new AppError("Cannot cancel a delivered or already cancelled order", StatusCodes.BAD_REQUEST);
  }

  if (order.status === "OUT_FOR_DELIVERY") {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      throw new AppError("Cannot cancel order that is out for delivery. Contact support.", StatusCodes.BAD_REQUEST);
    }
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "CANCELLED" as never },
  });

  await recordTimeline(orderId, order.status, "CANCELLED", userId, input.reason, input.note);

  const storeGroups = await prisma.orderStoreGroup.findMany({
    where: { orderId, status: { not: "DELIVERED" } },
  });

  for (const group of storeGroups) {
    if (group.status !== "CANCELLED") {
      await prisma.orderStoreGroup.update({
        where: { id: group.id },
        data: { status: "CANCELLED" as never },
      });
    }
  }

  return { cancelled: true, orderId, reason: input.reason };
}

export async function getOrderTimeline(userId: string, orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new AppError("Order not found", StatusCodes.NOT_FOUND);
  }

  if (order.userId !== userId) {
    const merchant = await prisma.merchant.findUnique({ where: { userId } });
    if (!merchant) {
      throw new AppError("Order not found", StatusCodes.NOT_FOUND);
    }
  }

  return prisma.orderTimeline.findMany({
    where: { orderId },
    orderBy: { createdAt: "asc" },
  });
}

export async function listMerchantOrders(userId: string, input: ListOrdersInput) {
  const merchant = await prisma.merchant.findUnique({ where: { userId } });
  if (!merchant) {
    throw new AppError("Merchant profile not found", StatusCodes.NOT_FOUND);
  }

  const stores = await prisma.store.findMany({
    where: { merchantId: merchant.id },
    select: { id: true },
  });
  const storeIds = stores.map((s: { id: string }) => s.id);

  const skip = (input.page - 1) * input.limit;

  const where: Record<string, unknown> = {
    storeGroups: { some: { storeId: { in: storeIds } } },
  };
  if (input.status) where.status = input.status;

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: input.limit,
      orderBy: { createdAt: "desc" },
      include: {
        storeGroups: {
          where: { storeId: { in: storeIds } },
        },
        items: { where: { storeId: { in: storeIds } } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return { items, total, page: input.page, limit: input.limit, totalPages: Math.ceil(total / input.limit) };
}

export async function listAdminOrders(input: ListOrdersInput) {
  const skip = (input.page - 1) * input.limit;

  const where: Record<string, unknown> = {};
  if (input.status) where.status = input.status;

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: input.limit,
      orderBy: { createdAt: "desc" },
      include: {
        storeGroups: true,
        payment: true,
      },
    }),
    prisma.order.count({ where }),
  ]);

  return { items, total, page: input.page, limit: input.limit, totalPages: Math.ceil(total / input.limit) };
}
