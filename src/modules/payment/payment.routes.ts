import { Router } from "express";
import { authenticate } from "../../common/middleware/authenticate";
import { authorize } from "../../common/middleware/authorize";
import { validateBody } from "../../common/middleware/validate";
import {
  initializePaystackController,
  merchantSettlementsController,
  paystackWebhookController,
  processSettlementsController,
  refundController,
  releaseEscrowController,
  verifyPaystackController,
  walletBalanceController,
  walletPayController,
  walletTransactionsController,
} from "./payment.controller";
import {
  initializePaystackSchema,
  refundSchema,
  walletPaySchema,
} from "./payment.schema";

export const paymentRoutes = Router();

// Paystack webhook (public — verified via signature)
paymentRoutes.post("/payments/paystack/webhook", paystackWebhookController);

// Authenticated routes
paymentRoutes.use(authenticate);

// Paystack
paymentRoutes.post("/payments/paystack/initialize", validateBody(initializePaystackSchema), initializePaystackController);
paymentRoutes.get("/payments/paystack/verify/:reference", verifyPaystackController);

// Wallet
paymentRoutes.post("/payments/wallet/pay", validateBody(walletPaySchema), walletPayController);
paymentRoutes.get("/payments/wallet/balance", walletBalanceController);
paymentRoutes.get("/payments/wallet/transactions", walletTransactionsController);

// Refunds (admin only)
paymentRoutes.post("/payments/refund", authorize(["ADMIN", "SUPER_ADMIN"]), validateBody(refundSchema), refundController);

// Escrow release (admin only)
paymentRoutes.post("/payments/escrow/:storeGroupId/release", authorize(["ADMIN", "SUPER_ADMIN"]), releaseEscrowController);

// Settlements
paymentRoutes.get("/payments/settlements", authorize(["MERCHANT"]), merchantSettlementsController);
paymentRoutes.post("/payments/settlements/process", authorize(["ADMIN", "SUPER_ADMIN"]), processSettlementsController);
