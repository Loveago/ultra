import { Prisma } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../../infrastructure/db/prisma";
import { AppError } from "../../common/errors/app-error";
import type {
  AddCartItemInput,
  ApplyPromoInput,
  EstimateInput,
  SaveCartInput,
  UpdateCartItemInput,
} from "./cart.schema";

const TAX_RATE = 0.075;

async function getOrCreateCart(userId: string) {
  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: true,
      promos: { include: { promoCode: true } },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
      include: {
        items: true,
        promos: { include: { promoCode: true } },
      },
    });
  }

  return cart;
}

async function recalculateCart(cartId: string) {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: true,
      promos: { include: { promoCode: true } },
    },
  });

  if (!cart) return;

  const subtotal = cart.items.reduce((sum, item) => {
    const addonTotal = Array.isArray(item.addons)
      ? (item.addons as Array<{ price: number }>).reduce((s, a) => s + a.price, 0)
      : 0;
    return sum + (item.unitPrice + addonTotal) * item.quantity;
  }, 0);

  const taxTotal = subtotal * TAX_RATE;

  let discountTotal = 0;
  for (const promo of cart.promos) {
    discountTotal += promo.discountAmount;
  }

  const grandTotal = Math.max(0, subtotal + taxTotal - discountTotal + cart.deliveryFee);

  await prisma.cart.update({
    where: { id: cartId },
    data: { subtotal, taxTotal, discountTotal, grandTotal },
  });
}

export async function getCart(userId: string) {
  const cart = await getOrCreateCart(userId);

  const storeGroups: Record<string, unknown> = {};
  for (const item of cart.items) {
    if (!storeGroups[item.storeId]) {
      storeGroups[item.storeId] = { storeId: item.storeId, items: [], subtotal: 0 };
    }
    const group = storeGroups[item.storeId] as { storeId: string; items: unknown[]; subtotal: number };
    group.items.push(item);
    const addonTotal = Array.isArray(item.addons)
      ? (item.addons as Array<{ price: number }>).reduce((s, a) => s + a.price, 0)
      : 0;
    group.subtotal += (item.unitPrice + addonTotal) * item.quantity;
  }

  return {
    ...cart,
    storeGroups: Object.values(storeGroups),
  };
}

export async function addCartItem(userId: string, input: AddCartItemInput) {
  const cart = await getOrCreateCart(userId);

  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    select: { id: true, storeId: true, basePrice: true, isAvailable: true, moderationStatus: true },
  });

  if (!product || !product.isAvailable || product.moderationStatus !== "APPROVED") {
    throw new AppError("Product not available", StatusCodes.BAD_REQUEST);
  }

  let unitPrice = product.basePrice;
  if (input.variantId) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: input.variantId },
      select: { priceAdjustment: true, isActive: true },
    });
    if (!variant || !variant.isActive) {
      throw new AppError("Variant not available", StatusCodes.BAD_REQUEST);
    }
    unitPrice += variant.priceAdjustment;
  }

  const existing = cart.items.find(
    (item) =>
      item.productId === input.productId &&
      item.variantId === input.variantId &&
      JSON.stringify(item.addons) === JSON.stringify(input.addons)
  );

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + input.quantity },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        storeId: product.storeId,
        productId: input.productId,
        variantId: input.variantId,
        quantity: input.quantity,
        unitPrice,
        addons: input.addons as Prisma.InputJsonValue,
        note: input.note,
      },
    });
  }

  await recalculateCart(cart.id);
  return getCart(userId);
}

export async function updateCartItem(userId: string, itemId: string, input: UpdateCartItemInput) {
  const cart = await getOrCreateCart(userId);
  const item = cart.items.find((i) => i.id === itemId);

  if (!item) {
    throw new AppError("Cart item not found", StatusCodes.NOT_FOUND);
  }

  const data: Record<string, unknown> = {};
  if (input.quantity !== undefined) data.quantity = input.quantity;
  if (input.addons !== undefined) data.addons = input.addons as Prisma.InputJsonValue;
  if (input.note !== undefined) data.note = input.note;

  await prisma.cartItem.update({ where: { id: itemId }, data });
  await recalculateCart(cart.id);
  return getCart(userId);
}

export async function removeCartItem(userId: string, itemId: string) {
  const cart = await getOrCreateCart(userId);
  const item = cart.items.find((i) => i.id === itemId);

  if (!item) {
    throw new AppError("Cart item not found", StatusCodes.NOT_FOUND);
  }

  await prisma.cartItem.delete({ where: { id: itemId } });
  await recalculateCart(cart.id);
  return getCart(userId);
}

export async function clearCart(userId: string) {
  const cart = await getOrCreateCart(userId);
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  await prisma.cartPromo.deleteMany({ where: { cartId: cart.id } });
  await recalculateCart(cart.id);
  return { cleared: true };
}

export async function applyPromo(userId: string, input: ApplyPromoInput) {
  const cart = await getOrCreateCart(userId);

  const promo = await prisma.promoCode.findUnique({
    where: { code: input.code.toUpperCase() },
  });

  if (!promo || !promo.isActive) {
    throw new AppError("Invalid promo code", StatusCodes.NOT_FOUND);
  }

  const now = new Date();
  if (promo.validFrom > now || (promo.validTo && promo.validTo < now)) {
    throw new AppError("Promo code has expired", StatusCodes.BAD_REQUEST);
  }

  if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
    throw new AppError("Promo code usage limit reached", StatusCodes.BAD_REQUEST);
  }

  if (cart.subtotal < promo.minOrderAmount) {
    throw new AppError(
      `Minimum order amount of ${promo.minOrderAmount} required`,
      StatusCodes.BAD_REQUEST
    );
  }

  let discount = 0;
  if (promo.type === "PERCENTAGE") {
    discount = (cart.subtotal * promo.value) / 100;
    if (promo.maxDiscount) discount = Math.min(discount, promo.maxDiscount);
  } else {
    discount = Math.min(promo.value, cart.subtotal);
  }

  const existing = await prisma.cartPromo.findUnique({
    where: { cartId_promoCodeId: { cartId: cart.id, promoCodeId: promo.id } },
  });

  if (existing) {
    throw new AppError("Promo code already applied", StatusCodes.CONFLICT);
  }

  await prisma.cartPromo.create({
    data: {
      cartId: cart.id,
      promoCodeId: promo.id,
      discountAmount: discount,
    },
  });

  await prisma.promoCode.update({
    where: { id: promo.id },
    data: { usedCount: { increment: 1 } },
  });

  await recalculateCart(cart.id);
  return getCart(userId);
}

export async function removePromo(userId: string, promoId: string) {
  const cart = await getOrCreateCart(userId);

  const cartPromo = await prisma.cartPromo.findFirst({
    where: { id: promoId, cartId: cart.id },
  });

  if (!cartPromo) {
    throw new AppError("Promo not found in cart", StatusCodes.NOT_FOUND);
  }

  await prisma.cartPromo.delete({ where: { id: promoId } });
  await prisma.promoCode.update({
    where: { id: cartPromo.promoCodeId },
    data: { usedCount: { decrement: 1 } },
  });

  await recalculateCart(cart.id);
  return getCart(userId);
}

export async function getEstimate(userId: string, input: EstimateInput) {
  const cart = await getOrCreateCart(userId);

  if (cart.items.length === 0) {
    throw new AppError("Cart is empty", StatusCodes.BAD_REQUEST);
  }

  const storeIds = [...new Set(cart.items.map((i) => i.storeId))];

  let totalDeliveryFee = 0;
  const storeEstimates: Array<{ storeId: string; deliveryFee: number; estimatedDeliveryMin: number }> = [];

  for (const storeId of storeIds) {
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

    if (store && store.branches.length > 0 && store.branches[0].deliveryZones.length > 0) {
      const zone = store.branches[0].deliveryZones[0];
      totalDeliveryFee += zone.deliveryFee;
      storeEstimates.push({
        storeId,
        deliveryFee: zone.deliveryFee,
        estimatedDeliveryMin: zone.estimatedDeliveryMin,
      });
    } else {
      storeEstimates.push({ storeId, deliveryFee: 0, estimatedDeliveryMin: 30 });
    }
  }

  const taxTotal = cart.subtotal * TAX_RATE;
  const grandTotal = cart.subtotal + taxTotal - cart.discountTotal + totalDeliveryFee;

  await prisma.cart.update({
    where: { id: cart.id },
    data: { deliveryFee: totalDeliveryFee, taxTotal, grandTotal },
  });

  return {
    subtotal: cart.subtotal,
    taxTotal,
    discountTotal: cart.discountTotal,
    deliveryFee: totalDeliveryFee,
    grandTotal,
    storeEstimates,
  };
}

export async function saveCart(userId: string, input: SaveCartInput) {
  const cart = await getOrCreateCart(userId);

  const items = cart.items.map((item) => ({
    productId: item.productId,
    variantId: item.variantId,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    addons: item.addons,
    note: item.note,
    storeId: item.storeId,
  }));

  return prisma.savedCart.create({
    data: {
      userId,
      name: input.name,
      items: items as Prisma.InputJsonValue,
    },
  });
}

export async function listSavedCarts(userId: string) {
  return prisma.savedCart.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function restoreSavedCart(userId: string, savedCartId: string) {
  const savedCart = await prisma.savedCart.findFirst({
    where: { id: savedCartId, userId },
  });

  if (!savedCart) {
    throw new AppError("Saved cart not found", StatusCodes.NOT_FOUND);
  }

  const cart = await getOrCreateCart(userId);
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  const items = savedCart.items as Array<{
    productId: string;
    variantId: string | null;
    quantity: number;
    unitPrice: number;
    addons: unknown[];
    note: string | null;
    storeId: string;
  }>;

  for (const item of items) {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        storeId: item.storeId,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        addons: item.addons as Prisma.InputJsonValue,
        note: item.note,
      },
    });
  }

  await recalculateCart(cart.id);
  return getCart(userId);
}
