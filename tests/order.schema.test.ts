import {
  cancelOrderSchema,
  listOrdersSchema,
  updateOrderStatusSchema,
  updateStoreGroupStatusSchema,
} from "../src/modules/order/order.schema";

describe("Order schemas", () => {
  it("updateOrderStatusSchema should accept valid status", () => {
    const result = updateOrderStatusSchema.safeParse({ status: "CONFIRMED" });
    expect(result.success).toBe(true);
  });

  it("updateOrderStatusSchema should accept status with reason", () => {
    const result = updateOrderStatusSchema.safeParse({
      status: "PREPARING",
      reason: "Order confirmed by merchant",
    });
    expect(result.success).toBe(true);
  });

  it("updateOrderStatusSchema should reject invalid status", () => {
    const result = updateOrderStatusSchema.safeParse({ status: "SHIPPED" });
    expect(result.success).toBe(false);
  });

  it("updateStoreGroupStatusSchema should accept valid status", () => {
    const result = updateStoreGroupStatusSchema.safeParse({ status: "READY_FOR_PICKUP" });
    expect(result.success).toBe(true);
  });

  it("cancelOrderSchema should accept valid reason", () => {
    const result = cancelOrderSchema.safeParse({ reason: "Changed my mind" });
    expect(result.success).toBe(true);
  });

  it("cancelOrderSchema should reject empty reason", () => {
    const result = cancelOrderSchema.safeParse({ reason: "" });
    expect(result.success).toBe(false);
  });

  it("cancelOrderSchema should reject missing reason", () => {
    const result = cancelOrderSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("listOrdersSchema should apply defaults", () => {
    const result = listOrdersSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it("listOrdersSchema should accept status filter", () => {
    const result = listOrdersSchema.safeParse({ status: "DELIVERED" });
    expect(result.success).toBe(true);
  });

  it("listOrdersSchema should reject limit > 50", () => {
    const result = listOrdersSchema.safeParse({ limit: 100 });
    expect(result.success).toBe(false);
  });
});
