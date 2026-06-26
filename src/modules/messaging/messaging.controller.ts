import type { Request, Response } from "express";
import {
  createOrGetConversation,
  getConversation,
  getUnreadCount,
  listConversations,
  listMessages,
  markConversationAsRead,
  sendMessage,
} from "./messaging.service";

export async function createConversationController(req: Request, res: Response): Promise<void> {
  const data = await createOrGetConversation(req.auth!.userId, req.body);
  res.status(201).json({ success: true, data });
}

export async function listConversationsController(req: Request, res: Response): Promise<void> {
  const data = await listConversations(req.auth!.userId, {
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 20,
  });
  res.status(200).json({ success: true, data });
}

export async function getConversationController(req: Request, res: Response): Promise<void> {
  const data = await getConversation(req.auth!.userId, req.params.id);
  res.status(200).json({ success: true, data });
}

export async function sendMessageController(req: Request, res: Response): Promise<void> {
  const data = await sendMessage(req.auth!.userId, req.params.id, req.body);
  res.status(201).json({ success: true, data });
}

export async function markReadController(req: Request, res: Response): Promise<void> {
  const data = await markConversationAsRead(req.auth!.userId, req.params.id);
  res.status(200).json({ success: true, data });
}

export async function listMessagesController(req: Request, res: Response): Promise<void> {
  const data = await listMessages(req.auth!.userId, req.params.id, {
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 20,
  });
  res.status(200).json({ success: true, data });
}

export async function unreadCountController(req: Request, res: Response): Promise<void> {
  const data = await getUnreadCount(req.auth!.userId);
  res.status(200).json({ success: true, data });
}
