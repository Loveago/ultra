import {
  listWithdrawalsSchema,
  processWithdrawalSchema,
  requestWithdrawalSchema,
} from "../src/modules/finance/finance.schema";

describe("Finance schemas", () => {
  it("requestWithdrawalSchema should accept bank transfer with bank details", () => {
    const result = requestWithdrawalSchema.safeParse({
      amount: 5000,
      method: "BANK_TRANSFER",
      bankName: "GTBank",
      bankAccountName: "John Doe",
      bankAccountNo: "0123456789",
    });
    expect(result.success).toBe(true);
  });

  it("requestWithdrawalSchema should accept PAYSTACK without bank details", () => {
    const result = requestWithdrawalSchema.safeParse({
      amount: 3000,
      method: "PAYSTACK",
    });
    expect(result.success).toBe(true);
  });

  it("requestWithdrawalSchema should reject bank transfer without bank details", () => {
    const result = requestWithdrawalSchema.safeParse({
      amount: 5000,
      method: "BANK_TRANSFER",
    });
    expect(result.success).toBe(false);
  });

  it("requestWithdrawalSchema should reject negative amount", () => {
    const result = requestWithdrawalSchema.safeParse({
      amount: -100,
      method: "PAYSTACK",
    });
    expect(result.success).toBe(false);
  });

  it("requestWithdrawalSchema should default to BANK_TRANSFER", () => {
    const result = requestWithdrawalSchema.safeParse({
      amount: 1000,
      bankName: "GTBank",
      bankAccountName: "John Doe",
      bankAccountNo: "0123456789",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.method).toBe("BANK_TRANSFER");
    }
  });

  it("processWithdrawalSchema should accept COMPLETED", () => {
    const result = processWithdrawalSchema.safeParse({ status: "COMPLETED" });
    expect(result.success).toBe(true);
  });

  it("processWithdrawalSchema should accept REJECTED with reason", () => {
    const result = processWithdrawalSchema.safeParse({
      status: "REJECTED",
      rejectedReason: "Invalid bank details",
    });
    expect(result.success).toBe(true);
  });

  it("processWithdrawalSchema should reject invalid status", () => {
    const result = processWithdrawalSchema.safeParse({ status: "PENDING" });
    expect(result.success).toBe(false);
  });

  it("listWithdrawalsSchema should apply defaults", () => {
    const result = listWithdrawalsSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it("listWithdrawalsSchema should accept status filter", () => {
    const result = listWithdrawalsSchema.safeParse({ status: "PENDING" });
    expect(result.success).toBe(true);
  });
});
