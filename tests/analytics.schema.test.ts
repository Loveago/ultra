import { analyticsDateRangeSchema, merchantAnalyticsSchema } from "../src/modules/analytics/analytics.schema";

describe("Analytics schemas", () => {
  it("analyticsDateRangeSchema should accept empty input", () => {
    const result = analyticsDateRangeSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("analyticsDateRangeSchema should accept valid date range", () => {
    const result = analyticsDateRangeSchema.safeParse({
      startDate: "2024-01-01T00:00:00.000Z",
      endDate: "2024-12-31T23:59:59.999Z",
    });
    expect(result.success).toBe(true);
  });

  it("analyticsDateRangeSchema should accept only startDate", () => {
    const result = analyticsDateRangeSchema.safeParse({
      startDate: "2024-01-01T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("analyticsDateRangeSchema should reject invalid date format", () => {
    const result = analyticsDateRangeSchema.safeParse({
      startDate: "2024-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("merchantAnalyticsSchema should accept merchantId only", () => {
    const result = merchantAnalyticsSchema.safeParse({
      merchantId: "123e4567-e89b-12d3-a456-426614174000",
    });
    expect(result.success).toBe(true);
  });

  it("merchantAnalyticsSchema should accept all fields", () => {
    const result = merchantAnalyticsSchema.safeParse({
      merchantId: "123e4567-e89b-12d3-a456-426614174000",
      startDate: "2024-01-01T00:00:00.000Z",
      endDate: "2024-12-31T23:59:59.999Z",
    });
    expect(result.success).toBe(true);
  });

  it("merchantAnalyticsSchema should accept empty input", () => {
    const result = merchantAnalyticsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("merchantAnalyticsSchema should reject invalid merchantId", () => {
    const result = merchantAnalyticsSchema.safeParse({
      merchantId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });
});
