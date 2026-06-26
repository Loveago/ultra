import {
  globalSearchSchema,
  productSearchSchema,
  storeSearchSchema,
  trendingSchema,
} from "../src/modules/search/search.schema";

describe("Search schemas", () => {
  it("productSearchSchema should accept valid search with filters", () => {
    const result = productSearchSchema.safeParse({
      q: "pizza",
      minPrice: 5,
      maxPrice: 50,
      sortBy: "price_asc",
    });
    expect(result.success).toBe(true);
  });

  it("productSearchSchema should apply defaults for page, limit, sortBy", () => {
    const result = productSearchSchema.safeParse({ q: "burger" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
      expect(result.data.sortBy).toBe("relevance");
    }
  });

  it("productSearchSchema should reject empty query", () => {
    const result = productSearchSchema.safeParse({ q: "" });
    expect(result.success).toBe(false);
  });

  it("productSearchSchema should reject invalid sortBy", () => {
    const result = productSearchSchema.safeParse({ q: "pizza", sortBy: "popular" });
    expect(result.success).toBe(false);
  });

  it("productSearchSchema should reject limit > 50", () => {
    const result = productSearchSchema.safeParse({ q: "pizza", limit: 100 });
    expect(result.success).toBe(false);
  });

  it("storeSearchSchema should accept valid search", () => {
    const result = storeSearchSchema.safeParse({ q: "dominos" });
    expect(result.success).toBe(true);
  });

  it("globalSearchSchema should accept valid query with limit", () => {
    const result = globalSearchSchema.safeParse({ q: "pizza", limit: 5 });
    expect(result.success).toBe(true);
  });

  it("globalSearchSchema should reject limit > 20", () => {
    const result = globalSearchSchema.safeParse({ q: "pizza", limit: 25 });
    expect(result.success).toBe(false);
  });

  it("trendingSchema should accept valid input with defaults", () => {
    const result = trendingSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
    }
  });

  it("trendingSchema should accept categoryId", () => {
    const result = trendingSchema.safeParse({
      categoryId: "123e4567-e89b-12d3-a456-426614174000",
    });
    expect(result.success).toBe(true);
  });
});
