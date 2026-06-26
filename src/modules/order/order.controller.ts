import type { Request, Response } from "express";
import {
  cancelOrder,
  getOrder,
  getOrderTimeline,
  listAdminOrders,
  listMerchantOrders,
  listMyOrders,
  updateOrderStatus,
  updateStoreGroupStatus,
} from "./order.service";

export async function listMyOrdersController(req: Request, res: Response): Promise<void> {
  const data = await listMyOrders(req.auth!.userId, {
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 20,
    status: req.query.status as "PENDING" | "CONFIRMED" | "PREPARING" | "READY_FOR_PICKUP" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED" | undefined,
  });
  res.status(200).json({ success: true, data });
}

export async function getOrderController(req: Request, res: Response): Promise<void> {
  const isAdmin = req.auth!.role === "ADMIN" || req.auth!.role === "SUPER_ADMIN";
  const data = await getOrder(req.auth!.userId, req.params.id, isAdmin);
  res.status(200).json({ success: true, data });
}

export async function updateOrderStatusController(req: Request, res: Response): Promise<void> {
  const data = await updateOrderStatus(req.auth!.userId, req.params.id, req.body);
  res.status(200).json({ success: true, data });
}

export async function updateStoreGroupStatusController(req: Request, res: Response): Promise<void> {
  const data = await updateStoreGroupStatus(
    req.auth!.userId,
    req.params.id,
    req.params.groupId,
    req.body,
  );
  res.status(200).json({ success: true, data });
}

export async function cancelOrderController(req: Request, res: Response): Promise<void> {
  const data = await cancelOrder(req.auth!.userId, req.params.id, req.body);
  res.status(200).json({ success: true, data });
}

export async function orderTimelineController(req: Request, res: Response): Promise<void> {
  const data = await getOrderTimeline(req.auth!.userId, req.params.id);
  res.status(200).json({ success: true, data });
}

export async function merchantOrdersController(req: Request, res: Response): Promise<void> {
  const data = await listMerchantOrders(req.auth!.userId, {
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 20,
    status: req.query.status as "PENDING" | "CONFIRMED" | "PREPARING" | "READY_FOR_PICKUP" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED" | undefined,
  });
  res.status(200).json({ success: true, data });
}

export async function adminOrdersController(req: Request, res: Response): Promise<void> {
  const data = await listAdminOrders({
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 20,
    status: req.query.status as "PENDING" | "CONFIRMED" | "PREPARING" | "READY_FOR_PICKUP" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED" | undefined,
  });
  res.status(200).json({ success: true, data });
}
