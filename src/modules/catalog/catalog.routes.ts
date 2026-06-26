import { Router } from "express";
import { authenticate } from "../../common/middleware/authenticate";
import { authorize } from "../../common/middleware/authorize";
import { validateBody } from "../../common/middleware/validate";
import {
  bulkImportController,
  bulkUpdateController,
  createAddonController,
  createCategoryController,
  createImageController,
  createProductController,
  createVariantController,
  deleteAddonController,
  deleteCategoryController,
  deleteImageController,
  deleteProductController,
  deleteVariantController,
  getCategoryController,
  getProductController,
  listAddonsController,
  listCategoriesController,
  listImagesController,
  listProductsController,
  listVariantsController,
  moderateProductController,
  updateAddonController,
  updateCategoryController,
  updateInventoryController,
  updateProductController,
  updateVariantController,
} from "./catalog.controller";
import {
  bulkImportSchema,
  bulkUpdateSchema,
  createAddonSchema,
  createCategorySchema,
  createImageSchema,
  createProductSchema,
  createVariantSchema,
  moderateProductSchema,
  updateAddonSchema,
  updateCategorySchema,
  updateInventorySchema,
  updateProductSchema,
  updateVariantSchema,
} from "./catalog.schema";

export const catalogRoutes = Router();

// Categories
catalogRoutes.post("/categories", authenticate, authorize(["MERCHANT", "ADMIN"]), validateBody(createCategorySchema), createCategoryController);
catalogRoutes.get("/categories", authenticate, listCategoriesController);
catalogRoutes.get("/categories/:id", authenticate, getCategoryController);
catalogRoutes.put("/categories/:id", authenticate, authorize(["MERCHANT", "ADMIN"]), validateBody(updateCategorySchema), updateCategoryController);
catalogRoutes.delete("/categories/:id", authenticate, authorize(["ADMIN"]), deleteCategoryController);

// Products
catalogRoutes.post("/products", authenticate, authorize(["MERCHANT"]), validateBody(createProductSchema), createProductController);
catalogRoutes.get("/products", authenticate, listProductsController);
catalogRoutes.get("/products/:id", authenticate, getProductController);
catalogRoutes.put("/products/:id", authenticate, authorize(["MERCHANT"]), validateBody(updateProductSchema), updateProductController);
catalogRoutes.delete("/products/:id", authenticate, authorize(["MERCHANT"]), deleteProductController);

// Variants
catalogRoutes.post("/products/:id/variants", authenticate, authorize(["MERCHANT"]), validateBody(createVariantSchema), createVariantController);
catalogRoutes.get("/products/:id/variants", authenticate, listVariantsController);
catalogRoutes.put("/products/:id/variants/:variantId", authenticate, authorize(["MERCHANT"]), validateBody(updateVariantSchema), updateVariantController);
catalogRoutes.delete("/products/:id/variants/:variantId", authenticate, authorize(["MERCHANT"]), deleteVariantController);

// Addons
catalogRoutes.post("/products/:id/addons", authenticate, authorize(["MERCHANT"]), validateBody(createAddonSchema), createAddonController);
catalogRoutes.get("/products/:id/addons", authenticate, listAddonsController);
catalogRoutes.put("/products/:id/addons/:addonId", authenticate, authorize(["MERCHANT"]), validateBody(updateAddonSchema), updateAddonController);
catalogRoutes.delete("/products/:id/addons/:addonId", authenticate, authorize(["MERCHANT"]), deleteAddonController);

// Images
catalogRoutes.post("/products/:id/images", authenticate, authorize(["MERCHANT"]), validateBody(createImageSchema), createImageController);
catalogRoutes.get("/products/:id/images", authenticate, listImagesController);
catalogRoutes.delete("/products/:id/images/:imageId", authenticate, authorize(["MERCHANT"]), deleteImageController);

// Inventory
catalogRoutes.put("/products/:id/variants/:variantId/inventory", authenticate, authorize(["MERCHANT"]), validateBody(updateInventorySchema), updateInventoryController);

// Bulk operations
catalogRoutes.post("/products/bulk-import", authenticate, authorize(["MERCHANT"]), validateBody(bulkImportSchema), bulkImportController);
catalogRoutes.put("/products/bulk-update", authenticate, authorize(["MERCHANT"]), validateBody(bulkUpdateSchema), bulkUpdateController);

// Moderation
catalogRoutes.post("/products/:id/moderate", authenticate, authorize(["ADMIN", "SUPER_ADMIN"]), validateBody(moderateProductSchema), moderateProductController);
