import type { Request, Response } from "express";
import {
  blockIp,
  isIpBlocked,
  listAuditLogs,
  listBlockedIps,
  listRiskScores,
  listUserDevices,
  logAudit,
  registerDevice,
  resolveRiskScore,
  trustDevice,
  unblockIp,
} from "./security.service";

export async function logAuditController(req: Request, res: Response): Promise<void> {
  const data = await logAudit(req.auth!.userId, req.body, req.ip, req.get("user-agent"));
  res.status(201).json({ success: true, data });
}

export async function listAuditLogsController(req: Request, res: Response): Promise<void> {
  const data = await listAuditLogs({
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 50,
    userId: req.query.userId as string | undefined,
    action: req.query.action as string | undefined,
    riskLevel: req.query.riskLevel as "LOW" | "MEDIUM" | "HIGH" | "BLOCKED" | undefined,
  });
  res.status(200).json({ success: true, data });
}

export async function registerDeviceController(req: Request, res: Response): Promise<void> {
  const data = await registerDevice(req.auth!.userId, req.body, req.ip, req.get("user-agent"));
  res.status(201).json({ success: true, data });
}

export async function listDevicesController(req: Request, res: Response): Promise<void> {
  const data = await listUserDevices(req.auth!.userId);
  res.status(200).json({ success: true, data });
}

export async function trustDeviceController(req: Request, res: Response): Promise<void> {
  const data = await trustDevice(req.auth!.userId, req.params.id, req.body.isTrusted === true);
  res.status(200).json({ success: true, data });
}

export async function listRiskScoresController(req: Request, res: Response): Promise<void> {
  const data = await listRiskScores({
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 20,
    level: req.query.level as "LOW" | "MEDIUM" | "HIGH" | "BLOCKED" | undefined,
    resolved: req.query.resolved ? req.query.resolved === "true" : undefined,
  });
  res.status(200).json({ success: true, data });
}

export async function resolveRiskScoreController(req: Request, res: Response): Promise<void> {
  const data = await resolveRiskScore(req.auth!.userId, req.params.id);
  res.status(200).json({ success: true, data });
}

export async function blockIpController(req: Request, res: Response): Promise<void> {
  const data = await blockIp(req.auth!.userId, req.body);
  res.status(201).json({ success: true, data });
}

export async function unblockIpController(req: Request, res: Response): Promise<void> {
  const data = await unblockIp(req.params.ipAddress);
  res.status(200).json({ success: true, data });
}

export async function listBlockedIpsController(_req: Request, res: Response): Promise<void> {
  const data = await listBlockedIps();
  res.status(200).json({ success: true, data });
}

export async function checkIpBlockedController(req: Request, res: Response): Promise<void> {
  const blocked = await isIpBlocked(req.params.ipAddress);
  res.status(200).json({ success: true, data: { blocked } });
}
