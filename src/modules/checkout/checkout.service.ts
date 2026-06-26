import { Prisma } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../../infrastructure/db/prisma";
import { AppError } from "../../common/errors/app-error";
import type {
  CreateOrderInput,
  DeliveryOptionsInput,
  InitiateCheckoutInput,
  ValidateCheckoutInput,
} from "./checkout.schema";

const TAX_RATE = 0.075;

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

export async function initiateCheckout(userId: string, input: InitiateCheckoutInput) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: true,
      promos: { include: { promoCode: true } },
    },
  });

  if (!cart || cart.items.length === 0) {
    throw new AppError("Cart is empty", StatusCodes.BAD_REQUEST);
  }

  const storeIds = [...new Set(cart.items.map((i) => i.storeId))];

  const storeGroups = await Promise.all(
    storeIds.map(async (storeId) => {
      const storeItems = cart.items.filter((i) => i.storeId === storeId);
      const subtotal = storeItems.reduce((sum, item) => {
        const addonTotal = Array.isArray(item.addons)
          ? (item.addons as Array<{ price: number }>).reduce((s, a) => s + a.price, 0)
          : 0;
        return sum + (item.unitPrice + addonTotal) * item.quantity;
      }, 0);

      const store = await prisma.store.findUnique({
        where: { id: storeId },
        select: {
          id: true,
          name: true,
          slug: true,
          branches: {
            where: { isActive: true, isMainBranch: true },
            include: { deliveryZones: { where: { isActive: true } } },
            take: 1,
          },
        },
      });

      return {
        storeId,
        storeName: store?.name ?? "Unknown",
        itemCount: storeItems.length,
        subtotal,
        tax: subtotal * TAX_RATE,
        availableDeliveryZones: store?.branches[0]?.deliveryZones ?? [],
      };
    })
  );

  let address: Record<string, unknown> | null = null;
  if (input.deliveryAddressId) {
    const addr = await prisma.address.findFirst({
      where: { id: input.deliveryAddressId, userId },
    });
    if (!addr) {
      throw new AppError("Delivery address not found", StatusCodes.NOT_FOUND);
    }
    address = addr;
  }

  return {
    cart: {
      id: cart.id,
      subtotal: cart.subtotal,
      taxTotal: cart.taxTotal,
      discountTotal: cart.discountTotal,
      grandTotal: cart.grandTotal,
    },
    storeGroups,
    deliveryAddress: address,
    deliveryOption: input.deliveryOption,
    scheduledFor: input.scheduledFor,
  };
}

export async function getDeliveryOptions(userId: string, _input: DeliveryOptionsInput) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: true },
  });

  if (!cart || cart.items.length === 0) {
    throw new AppError("Cart is empty", StatusCodes.BAD_REQUEST);
  }

  const storeIds = [...new Set(cart.items.map((i) => i.storeId))];

  const options = await Promise.all(
    storeIds.map(async (storeId) => {
      const store = await prisma.store.findUnique({
        where: { id: storeId },
        include: {
          branches: {
            where: { isActive: true, isMainBranch: true },
            include: { deliveryZones: { where: { isActive: true } } },
            take: 1,
          },
        },
      });

      const zones = store?.branches[0]?.deliveryZones ?? [];
      return {
        storeId,
        storeName: store?.name ?? "Unknown",
        deliveryZones: zones.map((z) => ({
          id: z.id,
          name: z.name,
          deliveryFee: z.deliveryFee,
          estimatedDeliveryMin: z.estimatedDeliveryMin,
          minOrderAmount: z.minOrderAmount,
        })),
        availableOptions: ["STANDARD", "PICKUP", ...(zones.length > 0 ? ["EXPRESS", "SCHEDULED"] : [])],
      };
    })
  );

  return { options };
}

export async function validateCheckout(userId: string, input: ValidateCheckoutInput) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: true, promos: { include: { promoCode: true } } },
  });

  if (!cart || cart.items.length === 0) {
    throw new AppError("Cart is empty", StatusCodes.BAD_REQUEST);
  }

  const address = await prisma.address.findFirst({
    where: { id: input.deliveryAddressId, userId },
  });
  if (!address) {
    throw new AppError("Delivery address not found", StatusCodes.NOT_FOUND);
  }

  for (const item of cart.items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      select: { isAvailable: true, moderationStatus: true },
    });
    if (!product || !product.isAvailable || product.moderationStatus !== "APPROVED") {
      throw new AppError(`Product ${item.productId} is no longer available`, StatusCodes.BAD_REQUEST);
    }
  }

  if (input.deliveryOption === "SCHEDULED" && !input.scheduledFor) {
    throw new AppError("Scheduled delivery requires a scheduledFor time", StatusCodes.BAD_REQUEST);
  }

  const storeIds = [...new Set(cart.items.map((i) => i.storeId))];
  let totalDeliveryFee = 0;

  for (const storeId of storeIds) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        branches: {
          where: { isActive: true, isMainBranch: true },
          include: { deliveryZones: { where: { isActive: true }, take: 1 } },
          take: 1,
        },
      },
    });

    if (store?.branches[0]?.deliveryZones[0]) {
      totalDeliveryFee += store.branches[0].deliveryZones[0].deliveryFee;
    }
  }

  const subtotal = cart.subtotal;
  const taxTotal = subtotal * TAX_RATE;
  const discountTotal = cart.discountTotal;
  const grandTotal = subtotal + taxTotal - discountTotal + totalDeliveryFee;

  return {
    valid: true,
    summary: {
      subtotal,
      taxTotal,
      discountTotal,
      deliveryFee: totalDeliveryFee,
      grandTotal,
      itemCount: cart.items.length,
      storeCount: storeIds.length,
    },
    deliveryAddress: address,
    deliveryOption: input.deliveryOption,
    paymentMethod: input.paymentMethod,
  };
}

export async function createOrder(userId: string, input: CreateOrderInput) {
  const validation = await validateCheckout(userId, input);

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: true, promos: { include: { promoCode: true } } },
  });

  if (!cart) {
    throw new AppError("Cart not found", StatusCodes.NOT_FOUND);
  }

  const orderNumber = generateOrderNumber();
  const storeIds = [...new Set(cart.items.map((i) => i.storeId))];

  const order = await prisma.order.create({
    data: {
      userId,
      orderNumber,
      status: "PENDING",
      paymentStatus: "PENDING",
      paymentMethod: input.paymentMethod,
      subtotal: validation.summary.subtotal,
      taxTotal: validation.summary.taxTotal,
      discountTotal: validation.summary.discountTotal,
      deliveryFee: validation.summary.deliveryFee,
      grandTotal: validation.summary.grandTotal,
      deliveryAddressId: input.deliveryAddressId,
      deliveryOption: input.deliveryOption,
      scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : null,
      note: input.note,
      items: {
        create: cart.items.map((item) => ({
          storeId: item.storeId,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          addons: item.addons as Prisma.InputJsonValue,
          note: item.note,
        })),
      },
      storeGroups: {
        create: await Promise.all(
          storeIds.map(async (storeId) => {
            const storeItems = cart.items.filter((i) => i.storeId === storeId);
            const storeSubtotal = storeItems.reduce((sum, item) => {
              const addonTotal = Array.isArray(item.addons)
                ? (item.addons as Array<{ price: number }>).reduce((s, a) => s + a.price, 0)
                : 0;
              return sum + (item.unitPrice + addonTotal) * item.quantity;
            }, 0);

            const store = await prisma.store.findUnique({
              where: { id: storeId },
              include: {
                branches: {
                  where: { isActive: true, isMainBranch: true },
                  include: { deliveryZones: { where: { isActive: true }, take: 1 } },
                  take: 1,
                },
              },
            });

            const deliveryFee = store?.branches[0]?.deliveryZones[0]?.deliveryFee ?? 0;
            const tax = storeSubtotal * TAX_RATE;

            return {
              storeId,
              subtotal: storeSubtotal,
              taxTotal: tax,
              discountTotal: 0,
              deliveryFee,
              total: storeSubtotal + tax + deliveryFee,
            };
          })
        ),
      },
    },
    include: {
      items: true,
      storeGroups: true,
    },
  });

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  await prisma.cartPromo.deleteMany({ where: { cartId: cart.id } });
  await prisma.cart.update({
    where: { id: cart.id },
    data: {
      subtotal: 0,
      taxTotal: 0,
      discountTotal: 0,
      deliveryFee: 0,
      grandTotal: 0,
    },
  });

  return order;
}
