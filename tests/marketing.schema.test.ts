import {
  createCouponSchema,
  validateCouponSchema,
  createPromotionSchema,
  applyReferralSchema,
} from "../src/modules/marketing/marketing.schema";

describe("Marketing schemas", () => {
  it("createCouponSchema should accept valid percentage coupon", () => {
    const result = createCouponSchema.safeParse({
      code: "SAVE10",
      type: "PERCENTAGE",
      value: 10,
      validFrom: "2024-01-01T00:00:00.000Z",
      validUntil: "2024-12-31T23:59:59.999Z",
    });
    expect(result.success).toBe(true);
  });

  it("createCouponSchema should accept fixed amount coupon", () => {
    const result = createCouponSchema.safeParse({
      code: "FLAT500",
      type: "FIXED_AMOUNT",
      value: 500,
      minOrderAmount: 1000,
      validFrom: "2024-01-01T00:00:00.000Z",
      validUntil: "2024-12-31T23:59:59.999Z",
    });
    expect(result.success).toBe(true);
  });

  it("createCouponSchema should reject short code", () => {
    const result = createCouponSchema.safeParse({
      code: "AB",
      type: "PERCENTAGE",
      value: 10,
      validFrom: "2024-01-01T00:00:00.000Z",
      validUntil: "2024-12-31T23:59:59.999Z",
    });
    expect(result.success).toBe(false);
  });

  it("validateCouponSchema should accept valid input", () => {
    const result = validateCouponSchema.safeParse({
      code: "SAVE10",
      orderAmount: 5000,
    });
    expect(result.success).toBe(true);
  });

  it("validateCouponSchema should reject negative orderAmount", () => {
    const result = validateCouponSchema.safeParse({
      code: "SAVE10",
      orderAmount: -100,
    });
    expect(result.success).toBe(false);
  });

  it("createPromotionSchema should accept valid promotion", () => {
    const result = createPromotionSchema.safeParse({
      title: "Summer Sale",
      discountType: "PERCENTAGE",
      discountValue: 20,
      startsAt: "2024-06-01T00:00:00.000Z",
      endsAt: "2024-08-31T23:59:59.999Z",
    });
    expect(result.success).toBe(true);
  });

  it("applyReferralSchema should accept valid code", () => {
    const result = applyReferralSchema.safeParse({ code: "ULTRA-ABCD1234" });
    expect(result.success).toBe(true);
  });

  it("applyReferralSchema should reject short code", () => {
    const result = applyReferralSchema.safeParse({ code: "AB" });
    expect(result.success).toBe(false);
  });
});
