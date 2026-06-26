import { StatusCodes } from "http-status-codes";
import { prisma } from "../../infrastructure/db/prisma";
import { AppError } from "../../common/errors/app-error";
import type {
  RegisterMerchantInput,
  ReviewKycInput,
  UploadKycInput,
} from "./merchant.schema";

export async function registerMerchant(userId: string, input: RegisterMerchantInput) {
  const existing = await prisma.merchant.findUnique({ where: { userId } });
  if (existing) {
    throw new AppError("Merchant profile already exists", StatusCodes.CONFLICT);
  }

  const merchant = await prisma.merchant.create({
    data: {
      userId,
      businessName: input.businessName,
      businessType: input.businessType,
      registrationNumber: input.registrationNumber,
      taxId: input.taxId,
    },
  });

  return merchant;
}

export async function getMyMerchant(userId: string) {
  const merchant = await prisma.merchant.findUnique({
    where: { userId },
    include: {
      kycDocuments: { orderBy: { createdAt: "desc" } },
      stores: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          isVerified: true,
          rating: true,
        },
      },
    },
  });

  if (!merchant) {
    throw new AppError("Merchant profile not found", StatusCodes.NOT_FOUND);
  }

  return merchant;
}

export async function uploadKycDocument(userId: string, input: UploadKycInput) {
  const merchant = await prisma.merchant.findUnique({ where: { userId } });
  if (!merchant) {
    throw new AppError("Merchant profile not found", StatusCodes.NOT_FOUND);
  }

  const doc = await prisma.kycDocument.create({
    data: {
      merchantId: merchant.id,
      documentType: input.documentType,
      fileUrl: input.fileUrl,
    },
  });

  await prisma.merchant.update({
    where: { id: merchant.id },
    data: { status: "UNDER_REVIEW" },
  });

  return doc;
}

export async function getKycStatus(userId: string) {
  const merchant = await prisma.merchant.findUnique({
    where: { userId },
    select: {
      status: true,
      verifiedAt: true,
      rejectedReason: true,
      kycDocuments: {
        select: {
          id: true,
          documentType: true,
          status: true,
          rejectionReason: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!merchant) {
    throw new AppError("Merchant profile not found", StatusCodes.NOT_FOUND);
  }

  return merchant;
}

export async function reviewKycDocument(
  documentId: string,
  input: ReviewKycInput,
  reviewerId: string
) {
  const doc = await prisma.kycDocument.findUnique({
    where: { id: documentId },
    include: { merchant: true },
  });

  if (!doc) {
    throw new AppError("KYC document not found", StatusCodes.NOT_FOUND);
  }

  const updated = await prisma.kycDocument.update({
    where: { id: documentId },
    data: {
      status: input.status,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      rejectionReason: input.status === "REJECTED" ? input.rejectionReason : null,
    },
  });

  const allDocs = await prisma.kycDocument.findMany({
    where: { merchantId: doc.merchantId },
    select: { status: true },
  });

  const allApproved = allDocs.length > 0 && allDocs.every((d: { status: string }) => d.status === "APPROVED");
  const anyRejected = allDocs.some((d: { status: string }) => d.status === "REJECTED");

  if (allApproved) {
    await prisma.merchant.update({
      where: { id: doc.merchantId },
      data: { status: "APPROVED", verifiedAt: new Date(), rejectedReason: null },
    });
  } else if (anyRejected && !allApproved) {
    await prisma.merchant.update({
      where: { id: doc.merchantId },
      data: { status: "REJECTED", rejectedReason: input.rejectionReason },
    });
  }

  return updated;
}

export async function getMerchantDashboard(userId: string) {
  const merchant = await prisma.merchant.findUnique({
    where: { userId },
    include: {
      _count: { select: { stores: true, kycDocuments: true } },
      stores: {
        select: {
          id: true,
          name: true,
          status: true,
          isVerified: true,
          rating: true,
          _count: { select: { branches: true } },
        },
      },
    },
  });

  if (!merchant) {
    throw new AppError("Merchant profile not found", StatusCodes.NOT_FOUND);
  }

  return {
    merchant: {
      id: merchant.id,
      businessName: merchant.businessName,
      status: merchant.status,
      verifiedAt: merchant.verifiedAt,
    },
    stats: {
      totalStores: merchant._count.stores,
      totalKycDocuments: merchant._count.kycDocuments,
    },
    stores: merchant.stores,
  };
}
