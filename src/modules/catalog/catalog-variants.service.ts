import { Prisma } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../../infrastructure/db/prisma";
import { AppError } from "../../common/errors/app-error";
import type {
  CreateAddonInput,
  CreateImageInput,
  CreateVariantInput,
  UpdateAddonInput,
  UpdateInventoryInput,
  UpdateVariantInput,
} from "./catalog.schema";

async function verifyProductOwnership(userId: string, productId: string) {
  const merchant = await prisma.merchant.findUnique({ where: { userId } });
  if (!merchant) {
    throw new AppError("Merchant profile not found", StatusCodes.NOT_FOUND);
  }
  const product = await prisma.product.findFirst({
    where: { id: productId, store: { merchantId: merchant.id } },
  });
  if (!product) {
    throw new AppError("Product not found or not owned by you", StatusCodes.NOT_FOUND);
  }
  return product;
}

export async function createVariant(userId: string, productId: string, input: CreateVariantInput) {
  await verifyProductOwnership(userId, productId);

  const { initialQuantity, lowStockThreshold, ...variantData } = input;

  return prisma.productVariant.create({
    data: {
      productId,
      ...variantData,
      attributes: variantData.attributes as Prisma.InputJsonValue,
      inventory: {
        create: {
          quantity: initialQuantity,
          lowStockThreshold,
        },
      },
    },
    include: { inventory: true },
  });
}

export async function listVariants(productId: string) {
  return prisma.productVariant.findMany({
    where: { productId },
    include: { inventory: true },
  });
}

export async function updateVariant(userId: string, productId: string, variantId: string, input: UpdateVariantInput) {
  await verifyProductOwnership(userId, productId);

  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, productId },
  });
  if (!variant) {
    throw new AppError("Variant not found", StatusCodes.NOT_FOUND);
  }

  return prisma.productVariant.update({
    where: { id: variantId },
    data: {
      ...input,
      attributes: input.attributes as Prisma.InputJsonValue | undefined,
    },
    include: { inventory: true },
  });
}

export async function deleteVariant(userId: string, productId: string, variantId: string) {
  await verifyProductOwnership(userId, productId);

  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, productId },
  });
  if (!variant) {
    throw new AppError("Variant not found", StatusCodes.NOT_FOUND);
  }

  await prisma.productVariant.delete({ where: { id: variantId } });
  return { deleted: true };
}

export async function createAddon(userId: string, productId: string, input: CreateAddonInput) {
  await verifyProductOwnership(userId, productId);
  return prisma.productAddon.create({ data: { productId, ...input } });
}

export async function listAddons(productId: string) {
  return prisma.productAddon.findMany({ where: { productId, isActive: true } });
}

export async function updateAddon(userId: string, productId: string, addonId: string, input: UpdateAddonInput) {
  await verifyProductOwnership(userId, productId);

  const addon = await prisma.productAddon.findFirst({
    where: { id: addonId, productId },
  });
  if (!addon) {
    throw new AppError("Addon not found", StatusCodes.NOT_FOUND);
  }

  return prisma.productAddon.update({ where: { id: addonId }, data: input });
}

export async function deleteAddon(userId: string, productId: string, addonId: string) {
  await verifyProductOwnership(userId, productId);

  const addon = await prisma.productAddon.findFirst({
    where: { id: addonId, productId },
  });
  if (!addon) {
    throw new AppError("Addon not found", StatusCodes.NOT_FOUND);
  }

  await prisma.productAddon.delete({ where: { id: addonId } });
  return { deleted: true };
}

export async function createImage(userId: string, productId: string, input: CreateImageInput) {
  await verifyProductOwnership(userId, productId);
  return prisma.productImage.create({ data: { productId, ...input } });
}

export async function listImages(productId: string) {
  return prisma.productImage.findMany({
    where: { productId },
    orderBy: { sortOrder: "asc" },
  });
}

export async function deleteImage(userId: string, productId: string, imageId: string) {
  await verifyProductOwnership(userId, productId);

  const image = await prisma.productImage.findFirst({
    where: { id: imageId, productId },
  });
  if (!image) {
    throw new AppError("Image not found", StatusCodes.NOT_FOUND);
  }

  await prisma.productImage.delete({ where: { id: imageId } });
  return { deleted: true };
}

export async function updateInventory(
  userId: string,
  productId: string,
  variantId: string,
  input: UpdateInventoryInput
) {
  await verifyProductOwnership(userId, productId);

  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, productId },
    include: { inventory: true },
  });
  if (!variant) {
    throw new AppError("Variant not found", StatusCodes.NOT_FOUND);
  }

  if (!variant.inventory) {
    return prisma.inventory.create({
      data: {
        variantId,
        quantity: input.quantity ?? 0,
        lowStockThreshold: input.lowStockThreshold ?? 5,
      },
    });
  }

  return prisma.inventory.update({
    where: { variantId },
    data: input,
  });
}
