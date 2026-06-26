import {
  createReviewSchema,
  listReviewsSchema,
  moderateReviewSchema,
  replyReviewSchema,
  updateReviewSchema,
} from "../src/modules/review/review.schema";

describe("Review schemas", () => {
  it("createReviewSchema should accept valid product review", () => {
    const result = createReviewSchema.safeParse({
      targetType: "PRODUCT",
      targetId: "123e4567-e89b-12d3-a456-426614174000",
      rating: 5,
      comment: "Great product!",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.images).toEqual([]);
    }
  });

  it("createReviewSchema should accept store review with orderId", () => {
    const result = createReviewSchema.safeParse({
      targetType: "STORE",
      targetId: "123e4567-e89b-12d3-a456-426614174000",
      orderId: "123e4567-e89b-12d3-a456-426614174001",
      rating: 4,
      title: "Good store",
      comment: "Fast delivery",
      images: ["https://example.com/img1.jpg"],
    });
    expect(result.success).toBe(true);
  });

  it("createReviewSchema should accept rider review", () => {
    const result = createReviewSchema.safeParse({
      targetType: "RIDER",
      targetId: "123e4567-e89b-12d3-a456-426614174000",
      rating: 5,
    });
    expect(result.success).toBe(true);
  });

  it("createReviewSchema should reject rating < 1", () => {
    const result = createReviewSchema.safeParse({
      targetType: "PRODUCT",
      targetId: "123e4567-e89b-12d3-a456-426614174000",
      rating: 0,
    });
    expect(result.success).toBe(false);
  });

  it("createReviewSchema should reject rating > 5", () => {
    const result = createReviewSchema.safeParse({
      targetType: "PRODUCT",
      targetId: "123e4567-e89b-12d3-a456-426614174000",
      rating: 6,
    });
    expect(result.success).toBe(false);
  });

  it("createReviewSchema should reject invalid targetType", () => {
    const result = createReviewSchema.safeParse({
      targetType: "MERCHANT",
      targetId: "123e4567-e89b-12d3-a456-426614174000",
      rating: 5,
    });
    expect(result.success).toBe(false);
  });

  it("createReviewSchema should reject too many images", () => {
    const result = createReviewSchema.safeParse({
      targetType: "PRODUCT",
      targetId: "123e4567-e89b-12d3-a456-426614174000",
      rating: 5,
      images: Array(6).fill("https://example.com/img.jpg"),
    });
    expect(result.success).toBe(false);
  });

  it("updateReviewSchema should accept partial update", () => {
    const result = updateReviewSchema.safeParse({ rating: 3 });
    expect(result.success).toBe(true);
  });

  it("replyReviewSchema should accept valid reply", () => {
    const result = replyReviewSchema.safeParse({ reply: "Thank you for your feedback!" });
    expect(result.success).toBe(true);
  });

  it("replyReviewSchema should reject empty reply", () => {
    const result = replyReviewSchema.safeParse({ reply: "" });
    expect(result.success).toBe(false);
  });

  it("moderateReviewSchema should accept APPROVED", () => {
    const result = moderateReviewSchema.safeParse({ status: "APPROVED" });
    expect(result.success).toBe(true);
  });

  it("moderateReviewSchema should accept FLAGGED with reason", () => {
    const result = moderateReviewSchema.safeParse({
      status: "FLAGGED",
      reason: "Inappropriate content",
    });
    expect(result.success).toBe(true);
  });

  it("moderateReviewSchema should reject invalid status", () => {
    const result = moderateReviewSchema.safeParse({ status: "PENDING" });
    expect(result.success).toBe(false);
  });

  it("listReviewsSchema should apply defaults", () => {
    const result = listReviewsSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
      expect(result.data.sortBy).toBe("createdAt");
      expect(result.data.sortOrder).toBe("desc");
    }
  });
});
