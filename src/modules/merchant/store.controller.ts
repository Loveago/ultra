import type { Request, Response } from "express";
import {
  createBranch,
  createDeliveryZone,
  createStore,
  getMyStores,
  getStoreById,
  setOperatingHours,
  updateBranch,
  updateStore,
} from "./store.service";

export async function createStoreController(req: Request, res: Response): Promise<void> {
  const data = await createStore(req.auth!.userId, req.body);
  res.status(201).json({ success: true, data });
}

export async function getMyStoresController(req: Request, res: Response): Promise<void> {
  const data = await getMyStores(req.auth!.userId);
  res.status(200).json({ success: true, data });
}

export async function getStoreController(req: Request, res: Response): Promise<void> {
  const data = await getStoreById(req.params.id);
  res.status(200).json({ success: true, data });
}

export async function updateStoreController(req: Request, res: Response): Promise<void> {
  const data = await updateStore(req.auth!.userId, req.params.id, req.body);
  res.status(200).json({ success: true, data });
}

export async function createBranchController(req: Request, res: Response): Promise<void> {
  const data = await createBranch(req.auth!.userId, req.params.id, req.body);
  res.status(201).json({ success: true, data });
}

export async function updateBranchController(req: Request, res: Response): Promise<void> {
  const data = await updateBranch(req.auth!.userId, req.params.id, req.params.branchId, req.body);
  res.status(200).json({ success: true, data });
}

export async function setOperatingHoursController(req: Request, res: Response): Promise<void> {
  const data = await setOperatingHours(req.auth!.userId, req.params.id, req.params.branchId, req.body);
  res.status(200).json({ success: true, data });
}

export async function createDeliveryZoneController(req: Request, res: Response): Promise<void> {
  const data = await createDeliveryZone(req.auth!.userId, req.params.id, req.params.branchId, req.body);
  res.status(201).json({ success: true, data });
}
