import {
  createBranchSchema,
  createDeliveryZoneSchema,
  createStoreSchema,
  registerMerchantSchema,
  setOperatingHoursSchema,
  uploadKycSchema,
} from "../src/modules/merchant/merchant.schema";

describe("Merchant schemas", () => {
  it("registerMerchantSchema should accept valid input", () => {
    const result = registerMerchantSchema.safeParse({
      businessName: "Acme Inc",
      businessType: "LLC",
      registrationNumber: "RC123456",
    });
    expect(result.success).toBe(true);
  });

  it("registerMerchantSchema should reject invalid businessType", () => {
    const result = registerMerchantSchema.safeParse({
      businessName: "Acme Inc",
      businessType: "TRUST",
    });
    expect(result.success).toBe(false);
  });

  it("uploadKycSchema should accept valid document URL", () => {
    const result = uploadKycSchema.safeParse({
      documentType: "BUSINESS_REGISTRATION",
      fileUrl: "https://s3.amazonaws.com/bucket/doc.pdf",
    });
    expect(result.success).toBe(true);
  });

  it("uploadKycSchema should reject invalid URL", () => {
    const result = uploadKycSchema.safeParse({
      documentType: "ID_CARD",
      fileUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("createStoreSchema should accept valid store with slug", () => {
    const result = createStoreSchema.safeParse({
      name: "My Store",
      slug: "my-store-123",
    });
    expect(result.success).toBe(true);
  });

  it("createStoreSchema should reject slug with uppercase", () => {
    const result = createStoreSchema.safeParse({
      name: "My Store",
      slug: "MyStore",
    });
    expect(result.success).toBe(false);
  });

  it("createBranchSchema should accept valid branch", () => {
    const result = createBranchSchema.safeParse({
      name: "Main Branch",
      line1: "123 Main St",
      city: "Lagos",
    });
    expect(result.success).toBe(true);
  });

  it("createBranchSchema should reject missing line1", () => {
    const result = createBranchSchema.safeParse({
      name: "Main Branch",
      city: "Lagos",
    });
    expect(result.success).toBe(false);
  });

  it("setOperatingHoursSchema should accept valid hours array", () => {
    const result = setOperatingHoursSchema.safeParse({
      hours: [
        { dayOfWeek: "MONDAY", openTime: "09:00", closeTime: "17:00" },
        { dayOfWeek: "SUNDAY", openTime: "10:00", closeTime: "16:00", isClosed: true },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("setOperatingHoursSchema should reject invalid time format", () => {
    const result = setOperatingHoursSchema.safeParse({
      hours: [
        { dayOfWeek: "MONDAY", openTime: "9:00", closeTime: "17:00" },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("createDeliveryZoneSchema should accept valid zone", () => {
    const result = createDeliveryZoneSchema.safeParse({
      name: "Zone A",
      radiusKm: 5.0,
      latitude: 6.5244,
      longitude: 3.3792,
    });
    expect(result.success).toBe(true);
  });

  it("createDeliveryZoneSchema should reject radiusKm of 0", () => {
    const result = createDeliveryZoneSchema.safeParse({
      name: "Zone A",
      radiusKm: 0,
      latitude: 6.5244,
      longitude: 3.3792,
    });
    expect(result.success).toBe(false);
  });
});
