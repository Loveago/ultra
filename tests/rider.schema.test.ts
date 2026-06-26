import {
  addVehicleSchema,
  assignOrderSchema,
  locationUpdateSchema,
  registerRiderSchema,
  updateRiderStatusSchema,
  uploadDocumentSchema,
  verifyRiderSchema,
} from "../src/modules/rider/rider.schema";

describe("Rider schemas", () => {
  it("registerRiderSchema should accept empty body", () => {
    const result = registerRiderSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("registerRiderSchema should accept location", () => {
    const result = registerRiderSchema.safeParse({
      latitude: 6.4541,
      longitude: 3.3947,
    });
    expect(result.success).toBe(true);
  });

  it("uploadDocumentSchema should accept valid document", () => {
    const result = uploadDocumentSchema.safeParse({
      type: "DRIVERS_LICENSE",
      fileUrl: "https://example.com/doc.pdf",
    });
    expect(result.success).toBe(true);
  });

  it("uploadDocumentSchema should reject invalid URL", () => {
    const result = uploadDocumentSchema.safeParse({
      type: "NATIONAL_ID",
      fileUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("uploadDocumentSchema should reject invalid type", () => {
    const result = uploadDocumentSchema.safeParse({
      type: "BIRTH_CERTIFICATE",
      fileUrl: "https://example.com/doc.pdf",
    });
    expect(result.success).toBe(false);
  });

  it("addVehicleSchema should accept valid vehicle", () => {
    const result = addVehicleSchema.safeParse({
      type: "MOTORCYCLE",
      plateNumber: "LAG-123-ABC",
    });
    expect(result.success).toBe(true);
  });

  it("addVehicleSchema should reject invalid vehicle type", () => {
    const result = addVehicleSchema.safeParse({ type: "HELICOPTER" });
    expect(result.success).toBe(false);
  });

  it("updateRiderStatusSchema should accept isOnline true", () => {
    const result = updateRiderStatusSchema.safeParse({ isOnline: true });
    expect(result.success).toBe(true);
  });

  it("verifyRiderSchema should accept APPROVED", () => {
    const result = verifyRiderSchema.safeParse({ status: "APPROVED" });
    expect(result.success).toBe(true);
  });

  it("verifyRiderSchema should reject invalid status", () => {
    const result = verifyRiderSchema.safeParse({ status: "PENDING" });
    expect(result.success).toBe(false);
  });

  it("assignOrderSchema should accept valid input", () => {
    const result = assignOrderSchema.safeParse({
      storeGroupId: "123e4567-e89b-12d3-a456-426614174000",
      riderId: "123e4567-e89b-12d3-a456-426614174001",
    });
    expect(result.success).toBe(true);
  });

  it("locationUpdateSchema should accept valid coordinates", () => {
    const result = locationUpdateSchema.safeParse({
      latitude: 6.4541,
      longitude: 3.3947,
    });
    expect(result.success).toBe(true);
  });

  it("locationUpdateSchema should reject missing latitude", () => {
    const result = locationUpdateSchema.safeParse({ longitude: 3.3947 });
    expect(result.success).toBe(false);
  });
});
