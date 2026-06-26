import type { Request, Response } from "express";
import {
  adminGetSystemStats,
  adminGetUser,
  adminListMerchants,
  adminListRiders,
  adminListUsers,
  adminUpdateMerchant,
  adminUpdateRider,
  adminUpdateUser,
} from "./admin.service";

export async function listUsersController(req: Request, res: Response): Promise<void> {
  const data = await adminListUsers({
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 20,
    role: req.query.role as "CUSTOMER" | "MERCHANT" | "RIDER" | "ADMIN" | "SUPER_ADMIN" | undefined,
    search: req.query.search as string | undefined,
    isActive: req.query.isActive ? req.query.isActive === "true" : undefined,
  });
  res.status(200).json({ success: true, data });
}

export async function getUserController(req: Request, res: Response): Promise<void> {
  const data = await adminGetUser(req.params.id);
  res.status(200).json({ success: true, data });
}

export async function updateUserController(req: Request, res: Response): Promise<void> {
  const data = await adminUpdateUser(req.params.id, req.body);
  res.status(200).json({ success: true, data });
}

export async function listMerchantsController(req: Request, res: Response): Promise<void> {
  const data = await adminListMerchants({
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 20,
    isVerified: req.query.isVerified ? req.query.isVerified === "true" : undefined,
    search: req.query.search as string | undefined,
  });
  res.status(200).json({ success: true, data });
}

export async function updateMerchantController(req: Request, res: Response): Promise<void> {
  const data = await adminUpdateMerchant(req.params.id, req.body);
  res.status(200).json({ success: true, data });
}

export async function listRidersController(req: Request, res: Response): Promise<void> {
  const data = await adminListRiders({
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 20,
    status: req.query.status as "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED" | undefined,
  });
  res.status(200).json({ success: true, data });
}

export async function updateRiderController(req: Request, res: Response): Promise<void> {
  const data = await adminUpdateRider(req.params.id, req.body);
  res.status(200).json({ success: true, data });
}

export async function systemStatsController(_req: Request, res: Response): Promise<void> {
  const data = await adminGetSystemStats();
  res.status(200).json({ success: true, data });
}
