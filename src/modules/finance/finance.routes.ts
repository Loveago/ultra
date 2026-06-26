import { Router } from "express";
import { authenticate } from "../../common/middleware/authenticate";
import { authorize } from "../../common/middleware/authorize";
import { validateBody } from "../../common/middleware/validate";
import {
  adminCommissionSummaryController,
  adminListCommissionsController,
  adminListWithdrawalsController,
  adminProcessWithdrawalController,
  financeOverviewController,
  listMyWithdrawalsController,
  listTransactionsController,
  requestWithdrawalController,
  walletBalanceController,
} from "./finance.controller";
import {
  processWithdrawalSchema,
  requestWithdrawalSchema,
} from "./finance.schema";

export const financeRoutes = Router();

financeRoutes.use(authenticate);

// User wallet & withdrawal routes
financeRoutes.get("/finance/wallet", walletBalanceController);
financeRoutes.get("/finance/wallet/transactions", listTransactionsController);
financeRoutes.get("/finance/overview", financeOverviewController);
financeRoutes.post("/finance/withdrawals", validateBody(requestWithdrawalSchema), requestWithdrawalController);
financeRoutes.get("/finance/withdrawals", listMyWithdrawalsController);

// Admin routes
financeRoutes.get("/finance/admin/withdrawals", authorize(["ADMIN", "SUPER_ADMIN"]), adminListWithdrawalsController);
financeRoutes.put("/finance/admin/withdrawals/:id", authorize(["ADMIN", "SUPER_ADMIN"]), validateBody(processWithdrawalSchema), adminProcessWithdrawalController);
financeRoutes.get("/finance/admin/commissions", authorize(["ADMIN", "SUPER_ADMIN"]), adminListCommissionsController);
financeRoutes.get("/finance/admin/commissions/summary", authorize(["ADMIN", "SUPER_ADMIN"]), adminCommissionSummaryController);
