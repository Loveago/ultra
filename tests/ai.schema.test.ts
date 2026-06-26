import {
  recommendationsSchema,
  demandForecastSchema,
  smartSearchSchema,
} from "../src/modules/ai/ai.schema";

describe("AI schemas", () => {
  it("recommendationsSchema should apply defaults", () => {
    const result = recommendationsSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(10);
    }
  });

  it("recommendationsSchema should accept storeId", () => {
    const result = recommendationsSchema.safeParse({
      storeId: "123e4567-e89b-12d3-a456-426614174000",
      limit: 5,
    });
    expect(result.success).toBe(true);
  });

  it("recommendationsSchema should reject limit > 50", () => {
    const result = recommendationsSchema.safeParse({ limit: 100 });
    expect(result.success).toBe(false);
  });

  it("demandForecastSchema should apply defaults", () => {
    const result = demandForecastSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.days).toBe(7);
    }
  });

  it("demandForecastSchema should accept custom days", () => {
    const result = demandForecastSchema.safeParse({ days: 30 });
    expect(result.success).toBe(true);
  });

  it("demandForecastSchema should reject days > 90", () => {
    const result = demandForecastSchema.safeParse({ days: 120 });
    expect(result.success).toBe(false);
  });

  it("smartSearchSchema should accept valid query", () => {
    const result = smartSearchSchema.safeParse({
      query: "jollof rice",
      limit: 10,
    });
    expect(result.success).toBe(true);
  });

  it("smartSearchSchema should reject empty query", () => {
    const result = smartSearchSchema.safeParse({ query: "" });
    expect(result.success).toBe(false);
  });

  it("smartSearchSchema should reject query > 200 chars", () => {
    const result = smartSearchSchema.safeParse({ query: "a".repeat(201) });
    expect(result.success).toBe(false);
  });
});
