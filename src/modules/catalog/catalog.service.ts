import { StatusCodes } from "http-status-codes";
import { prisma } from "../../infrastructure/db/prisma";
import { AppError } from "../../common/errors/app-error";
import type {
  BulkImportInput,
  BulkUpdateInput,
  CreateCategoryInput,
  CreateProductInput,
  ModerateProductInput,
  UpdateCategoryInput,
  UpdateProductInput,
} from "./catalog.schema";

export async function createCategory(input: CreateCategoryInput) {
  if (input.parentId) {
    const parent = await prisma.category.findUnique({ where: { id: input.parentId } });
    if (!parent) {
      throw new AppError("Parent category not found", StatusCodes.NOT_FOUND);
    }
  }

  const existing = await prisma.category.findUnique({ where: { slug: input.slug } });
  if (existing) {
    throw new AppError("Category slug already exists", StatusCodes.CONFLICT);
  }

  return prisma.category.create({ data: input });
}

export async function listCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    include: {
      children: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
    },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getCategory(id: string) {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { children: true, parent: true },
  });
  if (!category) {
    throw new AppError("Category not found", StatusCodes.NOT_FOUND);
  }
  return category;
}

export async function updateCategory(id: string, input: UpdateCategoryInput) {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Category not found", StatusCodes.NOT_FOUND);
  }
  return prisma.category.update({ where: { id }, data: input });
}

export async function deleteCategory(id: string) {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Category not found", StatusCodes.NOT_FOUND);
  }
  await prisma.category.delete({ where: { id } });
  return { deleted: true };
}

async function verifyStoreOwnership(userId: string, storeId: string) {
  const merchant = await prisma.merchant.findUnique({ where: { userId } });
  if (!merchant) {
    throw new AppError("Merchant profile not found", StatusCodes.NOT_FOUND);
  }
  const store = await prisma.store.findFirst({ where: { id: storeId, merchantId: merchant.id } });
  if (!store) {
    throw new AppError("Store not found or not owned by you", StatusCodes.NOT_FOUND);
  }
  return store;
}

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

export async function createProduct(userId: string, input: CreateProductInput) {
  await verifyStoreOwnership(userId, input.storeId);

  const existing = await prisma.product.findUnique({
    where: { storeId_slug: { storeId: input.storeId, slug: input.slug } },
  });
  if (existing) {
    throw new AppError("Product slug already exists in this store", StatusCodes.CONFLICT);
  }

  return prisma.product.create({
    data: {
      storeId: input.storeId,
      categoryId: input.categoryId,
      name: input.name,
      slug: input.slug,
      description: input.description,
      basePrice: input.basePrice,
      isAvailable: input.isAvailable,
    },
    include: { variants: true, addons: true, images: true },
  });
}

export async function listProducts(filters: {
  storeId?: string;
  categoryId?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page = filters.page ?? 1;
  const limit = Math.min(filters.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (filters.storeId) where.storeId = filters.storeId;
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.status) where.status = filters.status;
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        _count: { select: { variants: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getProduct(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      category: true,
      variants: { include: { inventory: true } },
      addons: { where: { isActive: true } },
      images: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!product) {
    throw new AppError("Product not found", StatusCodes.NOT_FOUND);
  }
  return product;
}

export async function updateProduct(userId: string, productId: string, input: UpdateProductInput) {
  await verifyProductOwnership(userId, productId);
  return prisma.product.update({
    where: { id: productId },
    data: input,
  });
}

export async function deleteProduct(userId: string, productId: string) {
  await verifyProductOwnership(userId, productId);
  await prisma.product.delete({ where: { id: productId } });
  return { deleted: true };
}

export async function bulkImportProducts(userId: string, input: BulkImportInput) {
  await verifyStoreOwnership(userId, input.storeId);

  const results: { success: boolean; slug: string; error?: string }[] = [];

  for (const item of input.products) {
    try {
      await prisma.product.create({
        data: {
          storeId: input.storeId,
          categoryId: item.categoryId,
          name: item.name,
          slug: item.slug,
          description: item.description,
          basePrice: item.basePrice,
        },
      });
      results.push({ success: true, slug: item.slug });
    } catch (err) {
      results.push({ success: false, slug: item.slug, error: (err as Error).message });
    }
  }

  return { imported: results.filter((r) => r.success).length, failed: results.filter((r) => !r.success).length, results };
}

export async function bulkUpdateProducts(userId: string, input: BulkUpdateInput) {
  const merchant = await prisma.merchant.findUnique({ where: { userId } });
  if (!merchant) {
    throw new AppError("Merchant profile not found", StatusCodes.NOT_FOUND);
  }

  const storeIds = await prisma.store.findMany({
    where: { merchantId: merchant.id },
    select: { id: true },
  });
  const storeIdList = storeIds.map((s: { id: string }) => s.id);

  const results: { success: boolean; id: string; error?: string }[] = [];

  for (const update of input.updates) {
    try {
      const product = await prisma.product.findFirst({
        where: { id: update.id, storeId: { in: storeIdList } },
      });
      if (!product) {
        results.push({ success: false, id: update.id, error: "Product not found or not owned" });
        continue;
      }
      await prisma.product.update({ where: { id: update.id }, data: update });
      results.push({ success: true, id: update.id });
    } catch (err) {
      results.push({ success: false, id: update.id, error: (err as Error).message });
    }
  }

  return { updated: results.filter((r) => r.success).length, failed: results.filter((r) => !r.success).length, results };
}

export async function moderateProduct(productId: string, input: ModerateProductInput) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new AppError("Product not found", StatusCodes.NOT_FOUND);
  }

  return prisma.product.update({
    where: { id: productId },
    data: {
      moderationStatus: input.status,
      moderationNote: input.note,
      status: input.status === "APPROVED" ? "ACTIVE" : "DRAFT",
    },
  });
}
