import type { Request, Response } from "express";
import {
  getMerchantSettlements,
  getWalletBalance,
  getWalletTransactions,
  handlePaystackWebhook,
  initializePaystack,
  initiateRefund,
  processPendingSettlements,
  releaseEscrow,
  verifyPaystackTransaction,
  walletPay,
} from "./payment.service";

export async function initializePaystackController(req: Request, res: Response): Promise<void> {
  const data = await initializePaystack(req.auth!.userId, req.body);
  res.status(200).json({ success: true, data });
}

export async function verifyPaystackController(req: Request, res: Response): Promise<void> {
  const data = await verifyPaystackTransaction(req.params.reference);
  res.status(200).json({ success: true, data });
}

export async function paystackWebhookController(req: Request, res: Response): Promise<void> {
  const signature = req.headers["x-paystack-signature"] as string;
  const data = await handlePaystackWebhook(req.body, signature);
  res.status(200).json(data);
}

export async function walletPayController(req: Request, res: Response): Promise<void> {
  const data = await walletPay(req.auth!.userId, req.body);
  res.status(200).json({ success: true, data });
}

export async function walletBalanceController(req: Request, res: Response): Promise<void> {
  const data = await getWalletBalance(req.auth!.userId);
  res.status(200).json({ success: true, data });
}

export async function walletTransactionsController(req: Request, res: Response): Promise<void> {
  const data = await getWalletTransactions(
    req.auth!.userId,
    req.query.page ? Number(req.query.page) : 1,
    req.query.limit ? Number(req.query.limit) : 20,
  );
  res.status(200).json({ success: true, data });
}

export async function refundController(req: Request, res: Response): Promise<void> {
  const data = await initiateRefund(req.body);
  res.status(200).json({ success: true, data });
}

export async function releaseEscrowController(req: Request, res: Response): Promise<void> {
  const data = await releaseEscrow({ storeGroupId: req.params.storeGroupId });
  res.status(200).json({ success: true, data });
}

export async function merchantSettlementsController(req: Request, res: Response): Promise<void> {
  const data = await getMerchantSettlements(
    req.auth!.userId,
    req.query.page ? Number(req.query.page) : 1,
    req.query.limit ? Number(req.query.limit) : 20,
  );
  res.status(200).json({ success: true, data });
}

export async function processSettlementsController(_req: Request, res: Response): Promise<void> {
  const data = await processPendingSettlements();
  res.status(200).json({ success: true, data });
}
