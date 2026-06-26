import {
  addCartItemSchema,
  applyPromoSchema,
  saveCartSchema,
  updateCartItemSchema,
} from "../src/modules/cart/cart.schema";

describe("Cart schemas", () => {
  it("addCartItemSchema should accept valid item", () => {
    const result = addCartItemSchema.safeParse({
      productId: "123e4567-e89b-12d3-a456-426614174000",
      quantity: 2,
    });
    expect(result.success).toBe(true);
  });

  it("addCartItemSchema should accept item with addons", () => {
    const result = addCartItemSchema.safeParse({
      productId: "123e4567-e89b-12d3-a456-426614174000",
      quantity: 1,
      addons: [
        { addonId: "123e4567-e89b-12d3-a456-426614174001", name: "Extra Cheese", price: 2.0 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("addCartItemSchema should reject quantity > 99", () => {
    const result = addCartItemSchema.safeParse({
      productId: "123e4567-e89b-12d3-a456-426614174000",
      quantity: 100,
    });
    expect(result.success).toBe(false);
  });

  it("addCartItemSchema should reject quantity < 1", () => {
    const result = addCartItemSchema.safeParse({
      productId: "123e4567-e89b-12d3-a456-426614174000",
      quantity: 0,
    });
    expect(result.success).toBe(false);
  });

  it("addCartItemSchema should reject invalid productId", () => {
    const result = addCartItemSchema.safeParse({
      productId: "not-a-uuid",
      quantity: 1,
    });
    expect(result.success).toBe(false);
  });

  it("updateCartItemSchema should accept partial update", () => {
    const result = updateCartItemSchema.safeParse({ quantity: 3 });
    expect(result.success).toBe(true);
  });

  it("updateCartItemSchema should accept empty object", () => {
    const result = updateCartItemSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("applyPromoSchema should accept valid code", () => {
    const result = applyPromoSchema.safeParse({ code: "SAVE10" });
    expect(result.success).toBe(true);
  });

  it("applyPromoSchema should reject empty code", () => {
    const result = applyPromoSchema.safeParse({ code: "" });
    expect(result.success).toBe(false);
  });

  it("saveCartSchema should accept valid name", () => {
    const result = saveCartSchema.safeParse({ name: "Weekly Groceries" });
    expect(result.success).toBe(true);
  });

  it("saveCartSchema should reject empty name", () => {
    const result = saveCartSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });
});
