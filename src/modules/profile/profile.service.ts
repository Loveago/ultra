import { StatusCodes } from "http-status-codes";
import { prisma } from "../../infrastructure/db/prisma";
import { AppError } from "../../common/errors/app-error";
import type {
  CreateAddressInput,
  UpdateAddressInput,
  UpdatePreferencesInput,
  UpdateProfileInput,
} from "./profile.schema";

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      phone: true,
      role: true,
      profile: true,
      preferences: true,
    },
  });

  if (!user) {
    throw new AppError("User not found", StatusCodes.NOT_FOUND);
  }

  return user;
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const data: Record<string, unknown> = {};

  if (input.firstName !== undefined) data.firstName = input.firstName;
  if (input.lastName !== undefined) data.lastName = input.lastName;
  if (input.avatarUrl !== undefined) data.avatarUrl = input.avatarUrl;
  if (input.dateOfBirth !== undefined) data.dateOfBirth = new Date(input.dateOfBirth);
  if (input.gender !== undefined) data.gender = input.gender;
  if (input.bio !== undefined) data.bio = input.bio;

  const profile = await prisma.userProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });

  return profile;
}

export async function getAddresses(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createAddress(userId: string, input: CreateAddressInput) {
  if (input.isDefault) {
    await prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  return prisma.address.create({
    data: { userId, ...input },
  });
}

export async function updateAddress(userId: string, addressId: string, input: UpdateAddressInput) {
  const existing = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });

  if (!existing) {
    throw new AppError("Address not found", StatusCodes.NOT_FOUND);
  }

  if (input.isDefault) {
    await prisma.address.updateMany({
      where: { userId, isDefault: true, id: { not: addressId } },
      data: { isDefault: false },
    });
  }

  return prisma.address.update({
    where: { id: addressId },
    data: input,
  });
}

export async function deleteAddress(userId: string, addressId: string) {
  const existing = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });

  if (!existing) {
    throw new AppError("Address not found", StatusCodes.NOT_FOUND);
  }

  await prisma.address.delete({ where: { id: addressId } });

  return { deleted: true };
}

export async function getPreferences(userId: string) {
  let prefs = await prisma.userPreferences.findUnique({
    where: { userId },
  });

  if (!prefs) {
    prefs = await prisma.userPreferences.create({
      data: { userId },
    });
  }

  return prefs;
}

export async function updatePreferences(userId: string, input: UpdatePreferencesInput) {
  return prisma.userPreferences.upsert({
    where: { userId },
    create: { userId, ...input },
    update: input,
  });
}
