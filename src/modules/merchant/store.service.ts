import { StatusCodes } from "http-status-codes";
import { prisma } from "../../infrastructure/db/prisma";
import { AppError } from "../../common/errors/app-error";
import type {
  CreateBranchInput,
  CreateDeliveryZoneInput,
  CreateStoreInput,
  SetOperatingHoursInput,
  UpdateBranchInput,
  UpdateStoreInput,
} from "./merchant.schema";

async function getMerchantId(userId: string): Promise<string> {
  const merchant = await prisma.merchant.findUnique({ where: { userId } });
  if (!merchant) {
    throw new AppError("Merchant profile not found", StatusCodes.NOT_FOUND);
  }
  return merchant.id;
}

async function verifyStoreOwnership(storeId: string, merchantId: string) {
  const store = await prisma.store.findFirst({
    where: { id: storeId, merchantId },
  });
  if (!store) {
    throw new AppError("Store not found or not owned by you", StatusCodes.NOT_FOUND);
  }
  return store;
}

async function verifyBranchOwnership(branchId: string, storeId: string) {
  const branch = await prisma.storeBranch.findFirst({
    where: { id: branchId, storeId },
  });
  if (!branch) {
    throw new AppError("Branch not found", StatusCodes.NOT_FOUND);
  }
  return branch;
}

export async function createStore(userId: string, input: CreateStoreInput) {
  const merchantId = await getMerchantId(userId);

  const existing = await prisma.store.findUnique({ where: { slug: input.slug } });
  if (existing) {
    throw new AppError("Store slug already taken", StatusCodes.CONFLICT);
  }

  return prisma.store.create({
    data: {
      merchantId,
      name: input.name,
      slug: input.slug,
      description: input.description,
      logoUrl: input.logoUrl,
      bannerUrl: input.bannerUrl,
    },
  });
}

export async function getMyStores(userId: string) {
  const merchantId = await getMerchantId(userId);
  return prisma.store.findMany({
    where: { merchantId },
    include: {
      _count: { select: { branches: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getStoreById(storeId: string) {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    include: {
      branches: {
        include: {
          operatingHours: true,
          deliveryZones: true,
        },
      },
    },
  });

  if (!store) {
    throw new AppError("Store not found", StatusCodes.NOT_FOUND);
  }

  return store;
}

export async function updateStore(userId: string, storeId: string, input: UpdateStoreInput) {
  const merchantId = await getMerchantId(userId);
  await verifyStoreOwnership(storeId, merchantId);

  return prisma.store.update({
    where: { id: storeId },
    data: input,
  });
}

export async function createBranch(userId: string, storeId: string, input: CreateBranchInput) {
  const merchantId = await getMerchantId(userId);
  await verifyStoreOwnership(storeId, merchantId);

  if (input.isMainBranch) {
    await prisma.storeBranch.updateMany({
      where: { storeId, isMainBranch: true },
      data: { isMainBranch: false },
    });
  }

  return prisma.storeBranch.create({
    data: { storeId, ...input },
  });
}

export async function updateBranch(
  userId: string,
  storeId: string,
  branchId: string,
  input: UpdateBranchInput
) {
  const merchantId = await getMerchantId(userId);
  await verifyStoreOwnership(storeId, merchantId);
  await verifyBranchOwnership(branchId, storeId);

  if (input.isMainBranch) {
    await prisma.storeBranch.updateMany({
      where: { storeId, isMainBranch: true, id: { not: branchId } },
      data: { isMainBranch: false },
    });
  }

  return prisma.storeBranch.update({
    where: { id: branchId },
    data: input,
  });
}

export async function setOperatingHours(
  userId: string,
  storeId: string,
  branchId: string,
  input: SetOperatingHoursInput
) {
  const merchantId = await getMerchantId(userId);
  await verifyStoreOwnership(storeId, merchantId);
  await verifyBranchOwnership(branchId, storeId);

  await prisma.operatingHour.deleteMany({ where: { branchId } });

  const records = input.hours.map((h) => ({
    branchId,
    dayOfWeek: h.dayOfWeek,
    openTime: h.openTime,
    closeTime: h.closeTime,
    isClosed: h.isClosed,
  }));

  await prisma.operatingHour.createMany({ data: records });

  return prisma.operatingHour.findMany({ where: { branchId } });
}

export async function createDeliveryZone(
  userId: string,
  storeId: string,
  branchId: string,
  input: CreateDeliveryZoneInput
) {
  const merchantId = await getMerchantId(userId);
  await verifyStoreOwnership(storeId, merchantId);
  await verifyBranchOwnership(branchId, storeId);

  return prisma.deliveryZone.create({
    data: { branchId, ...input },
  });
}
