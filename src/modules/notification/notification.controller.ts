import type { Request, Response } from "express";
import {
  getPreferences,
  getUnreadCount,
  listNotifications,
  markAllRead,
  markNotificationRead,
  sendNotification,
  updatePreferences,
} from "./notification.service";

export async function sendNotificationController(req: Request, res: Response): Promise<void> {
  const data = await sendNotification(req.body);
  res.status(201).json({ success: true, data });
}

export async function listNotificationsController(req: Request, res: Response): Promise<void> {
  const data = await listNotifications(req.auth!.userId, {
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 20,
    unreadOnly: req.query.unreadOnly === "true",
  });
  res.status(200).json({ success: true, data });
}

export async function markReadController(req: Request, res: Response): Promise<void> {
  const data = await markNotificationRead(req.auth!.userId, req.params.id);
  res.status(200).json({ success: true, data });
}

export async function markAllReadController(req: Request, res: Response): Promise<void> {
  const data = await markAllRead(req.auth!.userId);
  res.status(200).json({ success: true, data });
}

export async function unreadCountController(req: Request, res: Response): Promise<void> {
  const data = await getUnreadCount(req.auth!.userId);
  res.status(200).json({ success: true, data });
}

export async function getPreferencesController(req: Request, res: Response): Promise<void> {
  const data = await getPreferences(req.auth!.userId);
  res.status(200).json({ success: true, data });
}

export async function updatePreferencesController(req: Request, res: Response): Promise<void> {
  const data = await updatePreferences(req.auth!.userId, req.body);
  res.status(200).json({ success: true, data });
}
