import {
  createOrderSchema,
  initiateCheckoutSchema,
  validateCheckoutSchema,
} from "../src/modules/checkout/checkout.schema";

describe("Checkout schemas", () => {
  it("initiateCheckoutSchema should accept minimal input", () => {
    const result = initiateCheckoutSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.deliveryOption).toBe("STANDARD");
    }
  });

  it("initiateCheckoutSchema should accept full input", () => {
    const result = initiateCheckoutSchema.safeParse({
      deliveryAddressId: "123e4567-e89b-12d3-a456-426614174000",
      deliveryOption: "SCHEDULED",
      scheduledFor: "2025-01-01T10:00:00Z",
      note: "Leave at door",
    });
    expect(result.success).toBe(true);
  });

  it("initiateCheckoutSchema should reject invalid deliveryOption", () => {
    const result = initiateCheckoutSchema.safeParse({ deliveryOption: "DRONE" });
    expect(result.success).toBe(false);
  });

  it("validateCheckoutSchema should accept valid input", () => {
    const result = validateCheckoutSchema.safeParse({
      deliveryAddressId: "123e4567-e89b-12d3-a456-426614174000",
      deliveryOption: "STANDARD",
      paymentMethod: "PAYSTACK",
    });
    expect(result.success).toBe(true);
  });

  it("validateCheckoutSchema should reject missing paymentMethod", () => {
    const result = validateCheckoutSchema.safeParse({
      deliveryAddressId: "123e4567-e89b-12d3-a456-426614174000",
      deliveryOption: "STANDARD",
    });
    expect(result.success).toBe(false);
  });

  it("validateCheckoutSchema should reject missing deliveryAddressId", () => {
    const result = validateCheckoutSchema.safeParse({
      deliveryOption: "STANDARD",
      paymentMethod: "WALLET",
    });
    expect(result.success).toBe(false);
  });

  it("validateCheckoutSchema should reject invalid paymentMethod", () => {
    const result = validateCheckoutSchema.safeParse({
      deliveryAddressId: "123e4567-e89b-12d3-a456-426614174000",
      deliveryOption: "STANDARD",
      paymentMethod: "CRYPTO",
    });
    expect(result.success).toBe(false);
  });

  it("createOrderSchema should accept PAYSTACK", () => {
    const result = createOrderSchema.safeParse({
      deliveryAddressId: "123e4567-e89b-12d3-a456-426614174000",
      deliveryOption: "EXPRESS",
      paymentMethod: "PAYSTACK",
    });
    expect(result.success).toBe(true);
  });

  it("createOrderSchema should accept CASH_ON_DELIVERY", () => {
    const result = createOrderSchema.safeParse({
      deliveryAddressId: "123e4567-e89b-12d3-a456-426614174000",
      deliveryOption: "STANDARD",
      paymentMethod: "CASH_ON_DELIVERY",
    });
    expect(result.success).toBe(true);
  });

  it("createOrderSchema should reject PICKUP without address", () => {
    const result = createOrderSchema.safeParse({
      deliveryOption: "PICKUP",
      paymentMethod: "WALLET",
    });
    expect(result.success).toBe(false);
  });
});
