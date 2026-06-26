import { z } from "zod";

export const createCategorySchema = z.object({
  parentId: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
  iconUrl: z.string().url().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial().omit({ slug: true });

export const createProductSchema = z.object({
  storeId: z.string().uuid(),
  categoryId: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().max(5000).optional(),
  basePrice: z.number().min(0),
  isAvailable: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial().omit({ storeId: true, slug: true });

export const createVariantSchema = z.object({
  name: z.string().min(1).max(100),
  sku: z.string().max(100).optional(),
  priceAdjustment: z.number().default(0),
  attributes: z.record(z.unknown()).default({}),
  isActive: z.boolean().default(true),
  initialQuantity: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
});

export const updateVariantSchema = createVariantSchema.partial().omit({ initialQuantity: true, lowStockThreshold: true });

export const createAddonSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().min(0),
  isRequired: z.boolean().default(false),
  maxSelectable: z.number().int().min(1).default(1),
  isActive: z.boolean().default(true),
});

export const updateAddonSchema = createAddonSchema.partial();

export const createImageSchema = z.object({
  url: z.string().url(),
  altText: z.string().max(200).optional(),
  sortOrder: z.number().int().default(0),
});

export const updateInventorySchema = z.object({
  quantity: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
});

export const bulkImportSchema = z.object({
  storeId: z.string().uuid(),
  products: z.array(
    z.object({
      name: z.string().min(1).max(200),
      slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
      description: z.string().max(5000).optional(),
      basePrice: z.number().min(0),
      categoryId: z.string().uuid().optional(),
    })
  ).min(1).max(100),
});

export const bulkUpdateSchema = z.object({
  updates: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(200).optional(),
      description: z.string().max(5000).optional(),
      basePrice: z.number().min(0).optional(),
      isAvailable: z.boolean().optional(),
      status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
    })
  ).min(1).max(100),
});

export const moderateProductSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  note: z.string().max(500).optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateVariantInput = z.infer<typeof createVariantSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;
export type CreateAddonInput = z.infer<typeof createAddonSchema>;
export type UpdateAddonInput = z.infer<typeof updateAddonSchema>;
export type CreateImageInput = z.infer<typeof createImageSchema>;
export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>;
export type BulkImportInput = z.infer<typeof bulkImportSchema>;
export type BulkUpdateInput = z.infer<typeof bulkUpdateSchema>;
export type ModerateProductInput = z.infer<typeof moderateProductSchema>;
