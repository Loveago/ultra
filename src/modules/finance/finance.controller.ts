import type { Request, Response } from "express";
import {
  getCommissionSummary,
  getFinanceOverview,
  getWalletBalance,
  listAllWithdrawals,
  listCommissions,
  listMyWithdrawals,
  listWalletTransactions,
  processWithdrawal,
  requestWithdrawal,
} from "./finance.service";

export async function walletBalanceController(req: Request, res: Response): Promise<void> {
  const data = await getWalletBalance(req.auth!.userId);
  res.status(200).json({ success: true, data });
}

export async function listTransactionsController(req: Request, res: Response): Promise<void> {
  const data = await listWalletTransactions(req.auth!.userId, {
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 20,
    type: req.query.type as "CREDIT" | "DEBIT" | "REFUND" | "WITHDRAWAL" | "TOPUP" | undefined,
  });
  res.status(200).json({ success: true, data });
}

export async function requestWithdrawalController(req: Request, res: Response): Promise<void> {
  const data = await requestWithdrawal(req.auth!.userId, req.body);
  res.status(201).json({ success: true, data });
}

export async function listMyWithdrawalsController(req: Request, res: Response): Promise<void> {
  const data = await listMyWithdrawals(req.auth!.userId, {
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 20,
    status: req.query.status as "PENDING" | "APPROVED" | "PROCESSING" | "COMPLETED" | "REJECTED" | "CANCELLED" | undefined,
  });
  res.status(200).json({ success: true, data });
}

export async function financeOverviewController(req: Request, res: Response): Promise<void> {
  const data = await getFinanceOverview(req.auth!.userId);
  res.status(200).json({ success: true, data });
}

export async function adminListWithdrawalsController(req: Request, res: Response): Promise<void> {
  const data = await listAllWithdrawals({
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 20,
    status: req.query.status as "PENDING" | "APPROVED" | "PROCESSING" | "COMPLETED" | "REJECTED" | "CANCELLED" | undefined,
  });
  res.status(200).json({ success: true, data });
}

export async function adminProcessWithdrawalController(req: Request, res: Response): Promise<void> {
  const data = await processWithdrawal(req.auth!.userId, req.params.id, req.body);
  res.status(200).json({ success: true, data });
}

export async function adminListCommissionsController(req: Request, res: Response): Promise<void> {
  const data = await listCommissions({
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 20,
    merchantId: req.query.merchantId as string | undefined,
  });
  res.status(200).json({ success: true, data });
}

export async function adminCommissionSummaryController(req: Request, res: Response): Promise<void> {
  const data = await getCommissionSummary(req.query.merchantId as string | undefined);
  res.status(200).json({ success: true, data });
}
