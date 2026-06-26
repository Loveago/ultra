import { z } from "zod";

export const requestWithdrawalSchema = z.object({
  amount: z.number().positive(),
  method: z.enum(["BANK_TRANSFER", "PAYSTACK", "WALLET"]).default("BANK_TRANSFER"),
  bankName: z.string().max(100).optional(),
  bankAccountName: z.string().max(100).optional(),
  bankAccountNo: z.string().max(20).optional(),
}).refine(
  (data) => {
    if (data.method === "BANK_TRANSFER") {
      return data.bankName && data.bankAccountName && data.bankAccountNo;
    }
    return true;
  },
  { message: "Bank details required for bank transfer withdrawal" }
);

export const processWithdrawalSchema = z.object({
  status: z.enum(["APPROVED", "PROCESSING", "COMPLETED", "REJECTED", "CANCELLED"]),
  reference: z.string().optional(),
  rejectedReason: z.string().max(500).optional(),
});

export const listWithdrawalsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.enum(["PENDING", "APPROVED", "PROCESSING", "COMPLETED", "REJECTED", "CANCELLED"]).optional(),
});

export const listTransactionsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  type: z.enum(["CREDIT", "DEBIT", "REFUND", "WITHDRAWAL", "TOPUP"]).optional(),
});

export const listCommissionsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  merchantId: z.string().uuid().optional(),
});

export type RequestWithdrawalInput = z.infer<typeof requestWithdrawalSchema>;
export type ProcessWithdrawalInput = z.infer<typeof processWithdrawalSchema>;
export type ListWithdrawalsInput = z.infer<typeof listWithdrawalsSchema>;
export type ListTransactionsInput = z.infer<typeof listTransactionsSchema>;
export type ListCommissionsInput = z.infer<typeof listCommissionsSchema>;
