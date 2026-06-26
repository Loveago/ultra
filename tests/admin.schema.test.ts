import {
  adminListUsersSchema,
  adminUpdateUserSchema,
  adminUpdateMerchantSchema,
  adminUpdateRiderSchema,
} from "../src/modules/admin/admin.schema";

describe("Admin schemas", () => {
  it("adminListUsersSchema should apply defaults", () => {
    const result = adminListUsersSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it("adminListUsersSchema should accept role filter", () => {
    const result = adminListUsersSchema.safeParse({ role: "MERCHANT" });
    expect(result.success).toBe(true);
  });

  it("adminUpdateUserSchema should accept partial update", () => {
    const result = adminUpdateUserSchema.safeParse({ isActive: false });
    expect(result.success).toBe(true);
  });

  it("adminUpdateUserSchema should accept role change", () => {
    const result = adminUpdateUserSchema.safeParse({ role: "ADMIN" });
    expect(result.success).toBe(true);
  });

  it("adminUpdateMerchantSchema should accept isVerified", () => {
    const result = adminUpdateMerchantSchema.safeParse({ isVerified: true });
    expect(result.success).toBe(true);
  });

  it("adminUpdateMerchantSchema should accept commissionRate", () => {
    const result = adminUpdateMerchantSchema.safeParse({ commissionRate: 0.05 });
    expect(result.success).toBe(true);
  });

  it("adminUpdateRiderSchema should accept status change", () => {
    const result = adminUpdateRiderSchema.safeParse({ status: "APPROVED" });
    expect(result.success).toBe(true);
  });

  it("adminUpdateRiderSchema should reject invalid status", () => {
    const result = adminUpdateRiderSchema.safeParse({ status: "ACTIVE" });
    expect(result.success).toBe(false);
  });
});
