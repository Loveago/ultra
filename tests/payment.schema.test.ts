import {
  initializePaystackSchema,
  refundSchema,
  walletPaySchema,
} from "../src/modules/payment/payment.schema";

describe("Payment schemas", () => {
  it("initializePaystackSchema should accept valid input", () => {
    const result = initializePaystackSchema.safeParse({
      orderId: "123e4567-e89b-12d3-a456-426614174000",
    });
    expect(result.success).toBe(true);
  });

  it("initializePaystackSchema should accept callback URL", () => {
    const result = initializePaystackSchema.safeParse({
      orderId: "123e4567-e89b-12d3-a456-426614174000",
      callbackUrl: "https://example.com/callback",
    });
    expect(result.success).toBe(true);
  });

  it("initializePaystackSchema should reject invalid orderId", () => {
    const result = initializePaystackSchema.safeParse({ orderId: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("initializePaystackSchema should reject invalid callback URL", () => {
    const result = initializePaystackSchema.safeParse({
      orderId: "123e4567-e89b-12d3-a456-426614174000",
      callbackUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("walletPaySchema should accept valid orderId", () => {
    const result = walletPaySchema.safeParse({
      orderId: "123e4567-e89b-12d3-a456-426614174000",
    });
    expect(result.success).toBe(true);
  });

  it("walletPaySchema should reject missing orderId", () => {
    const result = walletPaySchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("refundSchema should accept paymentId only", () => {
    const result = refundSchema.safeParse({
      paymentId: "123e4567-e89b-12d3-a456-426614174000",
    });
    expect(result.success).toBe(true);
  });

  it("refundSchema should accept paymentId + amount + reason", () => {
    const result = refundSchema.safeParse({
      paymentId: "123e4567-e89b-12d3-a456-426614174000",
      amount: 50.0,
      reason: "Customer complaint",
    });
    expect(result.success).toBe(true);
  });

  it("refundSchema should reject negative amount", () => {
    const result = refundSchema.safeParse({
      paymentId: "123e4567-e89b-12d3-a456-426614174000",
      amount: -10,
    });
    expect(result.success).toBe(false);
  });

  it("refundSchema should reject missing paymentId", () => {
    const result = refundSchema.safeParse({ amount: 50 });
    expect(result.success).toBe(false);
  });
});
