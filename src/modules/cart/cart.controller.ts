import type { Request, Response } from "express";
import {
  addCartItem,
  applyPromo,
  clearCart,
  getCart,
  getEstimate,
  listSavedCarts,
  removeCartItem,
  removePromo,
  restoreSavedCart,
  saveCart,
  updateCartItem,
} from "./cart.service";

export async function getCartController(req: Request, res: Response): Promise<void> {
  const data = await getCart(req.auth!.userId);
  res.status(200).json({ success: true, data });
}

export async function addCartItemController(req: Request, res: Response): Promise<void> {
  const data = await addCartItem(req.auth!.userId, req.body);
  res.status(200).json({ success: true, data });
}

export async function updateCartItemController(req: Request, res: Response): Promise<void> {
  const data = await updateCartItem(req.auth!.userId, req.params.itemId, req.body);
  res.status(200).json({ success: true, data });
}

export async function removeCartItemController(req: Request, res: Response): Promise<void> {
  const data = await removeCartItem(req.auth!.userId, req.params.itemId);
  res.status(200).json({ success: true, data });
}

export async function clearCartController(req: Request, res: Response): Promise<void> {
  const data = await clearCart(req.auth!.userId);
  res.status(200).json({ success: true, data });
}

export async function applyPromoController(req: Request, res: Response): Promise<void> {
  const data = await applyPromo(req.auth!.userId, req.body);
  res.status(200).json({ success: true, data });
}

export async function removePromoController(req: Request, res: Response): Promise<void> {
  const data = await removePromo(req.auth!.userId, req.params.promoId);
  res.status(200).json({ success: true, data });
}

export async function estimateController(req: Request, res: Response): Promise<void> {
  const data = await getEstimate(req.auth!.userId, {
    addressId: req.query.addressId as string | undefined,
    latitude: req.query.latitude ? Number(req.query.latitude) : undefined,
    longitude: req.query.longitude ? Number(req.query.longitude) : undefined,
  });
  res.status(200).json({ success: true, data });
}

export async function saveCartController(req: Request, res: Response): Promise<void> {
  const data = await saveCart(req.auth!.userId, req.body);
  res.status(201).json({ success: true, data });
}

export async function listSavedCartsController(req: Request, res: Response): Promise<void> {
  const data = await listSavedCarts(req.auth!.userId);
  res.status(200).json({ success: true, data });
}

export async function restoreSavedCartController(req: Request, res: Response): Promise<void> {
  const data = await restoreSavedCart(req.auth!.userId, req.params.savedCartId);
  res.status(200).json({ success: true, data });
}
