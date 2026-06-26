import type { Request, Response } from "express";
import {
  bulkImportProducts,
  bulkUpdateProducts,
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  getCategory,
  getProduct,
  listCategories,
  listProducts,
  moderateProduct,
  updateCategory,
  updateProduct,
} from "./catalog.service";
import {
  createAddon,
  createImage,
  createVariant,
  deleteAddon,
  deleteImage,
  deleteVariant,
  listAddons,
  listImages,
  listVariants,
  updateAddon,
  updateInventory,
  updateVariant,
} from "./catalog-variants.service";

export async function createCategoryController(req: Request, res: Response): Promise<void> {
  const data = await createCategory(req.body);
  res.status(201).json({ success: true, data });
}

export async function listCategoriesController(_req: Request, res: Response): Promise<void> {
  const data = await listCategories();
  res.status(200).json({ success: true, data });
}

export async function getCategoryController(req: Request, res: Response): Promise<void> {
  const data = await getCategory(req.params.id);
  res.status(200).json({ success: true, data });
}

export async function updateCategoryController(req: Request, res: Response): Promise<void> {
  const data = await updateCategory(req.params.id, req.body);
  res.status(200).json({ success: true, data });
}

export async function deleteCategoryController(req: Request, res: Response): Promise<void> {
  const data = await deleteCategory(req.params.id);
  res.status(200).json({ success: true, data });
}

export async function createProductController(req: Request, res: Response): Promise<void> {
  const data = await createProduct(req.auth!.userId, req.body);
  res.status(201).json({ success: true, data });
}

export async function listProductsController(req: Request, res: Response): Promise<void> {
  const data = await listProducts({
    storeId: req.query.storeId as string | undefined,
    categoryId: req.query.categoryId as string | undefined,
    status: req.query.status as string | undefined,
    search: req.query.search as string | undefined,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });
  res.status(200).json({ success: true, data });
}

export async function getProductController(req: Request, res: Response): Promise<void> {
  const data = await getProduct(req.params.id);
  res.status(200).json({ success: true, data });
}

export async function updateProductController(req: Request, res: Response): Promise<void> {
  const data = await updateProduct(req.auth!.userId, req.params.id, req.body);
  res.status(200).json({ success: true, data });
}

export async function deleteProductController(req: Request, res: Response): Promise<void> {
  const data = await deleteProduct(req.auth!.userId, req.params.id);
  res.status(200).json({ success: true, data });
}

export async function createVariantController(req: Request, res: Response): Promise<void> {
  const data = await createVariant(req.auth!.userId, req.params.id, req.body);
  res.status(201).json({ success: true, data });
}

export async function listVariantsController(req: Request, res: Response): Promise<void> {
  const data = await listVariants(req.params.id);
  res.status(200).json({ success: true, data });
}

export async function updateVariantController(req: Request, res: Response): Promise<void> {
  const data = await updateVariant(req.auth!.userId, req.params.id, req.params.variantId, req.body);
  res.status(200).json({ success: true, data });
}

export async function deleteVariantController(req: Request, res: Response): Promise<void> {
  const data = await deleteVariant(req.auth!.userId, req.params.id, req.params.variantId);
  res.status(200).json({ success: true, data });
}

export async function createAddonController(req: Request, res: Response): Promise<void> {
  const data = await createAddon(req.auth!.userId, req.params.id, req.body);
  res.status(201).json({ success: true, data });
}

export async function listAddonsController(req: Request, res: Response): Promise<void> {
  const data = await listAddons(req.params.id);
  res.status(200).json({ success: true, data });
}

export async function updateAddonController(req: Request, res: Response): Promise<void> {
  const data = await updateAddon(req.auth!.userId, req.params.id, req.params.addonId, req.body);
  res.status(200).json({ success: true, data });
}

export async function deleteAddonController(req: Request, res: Response): Promise<void> {
  const data = await deleteAddon(req.auth!.userId, req.params.id, req.params.addonId);
  res.status(200).json({ success: true, data });
}

export async function createImageController(req: Request, res: Response): Promise<void> {
  const data = await createImage(req.auth!.userId, req.params.id, req.body);
  res.status(201).json({ success: true, data });
}

export async function listImagesController(req: Request, res: Response): Promise<void> {
  const data = await listImages(req.params.id);
  res.status(200).json({ success: true, data });
}

export async function deleteImageController(req: Request, res: Response): Promise<void> {
  const data = await deleteImage(req.auth!.userId, req.params.id, req.params.imageId);
  res.status(200).json({ success: true, data });
}

export async function updateInventoryController(req: Request, res: Response): Promise<void> {
  const data = await updateInventory(req.auth!.userId, req.params.id, req.params.variantId, req.body);
  res.status(200).json({ success: true, data });
}

export async function bulkImportController(req: Request, res: Response): Promise<void> {
  const data = await bulkImportProducts(req.auth!.userId, req.body);
  res.status(200).json({ success: true, data });
}

export async function bulkUpdateController(req: Request, res: Response): Promise<void> {
  const data = await bulkUpdateProducts(req.auth!.userId, req.body);
  res.status(200).json({ success: true, data });
}

export async function moderateProductController(req: Request, res: Response): Promise<void> {
  const data = await moderateProduct(req.params.id, req.body);
  res.status(200).json({ success: true, data });
}
