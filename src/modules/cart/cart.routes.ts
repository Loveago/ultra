import { Router } from "express";
import { authenticate } from "../../common/middleware/authenticate";
import { validateBody } from "../../common/middleware/validate";
import {
  addCartItemController,
  applyPromoController,
  clearCartController,
  estimateController,
  getCartController,
  listSavedCartsController,
  removeCartItemController,
  removePromoController,
  restoreSavedCartController,
  saveCartController,
  updateCartItemController,
} from "./cart.controller";
import {
  addCartItemSchema,
  applyPromoSchema,
  saveCartSchema,
  updateCartItemSchema,
} from "./cart.schema";

export const cartRoutes = Router();

cartRoutes.use(authenticate);

cartRoutes.get("/cart", getCartController);
cartRoutes.post("/cart/items", validateBody(addCartItemSchema), addCartItemController);
cartRoutes.put("/cart/items/:itemId", validateBody(updateCartItemSchema), updateCartItemController);
cartRoutes.delete("/cart/items/:itemId", removeCartItemController);
cartRoutes.delete("/cart", clearCartController);

cartRoutes.post("/cart/promo", validateBody(applyPromoSchema), applyPromoController);
cartRoutes.delete("/cart/promo/:promoId", removePromoController);

cartRoutes.get("/cart/estimate", estimateController);

cartRoutes.post("/cart/save", validateBody(saveCartSchema), saveCartController);
cartRoutes.get("/cart/saved", listSavedCartsController);
cartRoutes.post("/cart/saved/:savedCartId/restore", restoreSavedCartController);
