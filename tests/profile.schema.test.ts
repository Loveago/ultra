import { z } from "zod";
import {
  createAddressSchema,
  updateAddressSchema,
  updatePreferencesSchema,
  updateProfileSchema,
} from "../src/modules/profile/profile.schema";

describe("Profile schemas", () => {
  it("updateProfileSchema should accept partial profile data", () => {
    const result = updateProfileSchema.safeParse({
      firstName: "John",
      lastName: "Doe",
      gender: "MALE",
    });
    expect(result.success).toBe(true);
  });

  it("updateProfileSchema should reject invalid gender", () => {
    const result = updateProfileSchema.safeParse({ gender: "UNKNOWN" });
    expect(result.success).toBe(false);
  });

  it("updateProfileSchema should reject invalid avatar URL", () => {
    const result = updateProfileSchema.safeParse({ avatarUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("createAddressSchema should accept a valid address", () => {
    const result = createAddressSchema.safeParse({
      label: "Home",
      line1: "123 Main St",
      city: "Lagos",
      isDefault: true,
    });
    expect(result.success).toBe(true);
  });

  it("createAddressSchema should reject missing required fields", () => {
    const result = createAddressSchema.safeParse({ label: "Home" });
    expect(result.success).toBe(false);
  });

  it("updateAddressSchema should accept partial updates", () => {
    const result = updateAddressSchema.safeParse({ isDefault: true });
    expect(result.success).toBe(true);
  });

  it("updatePreferencesSchema should accept partial preferences", () => {
    const result = updatePreferencesSchema.safeParse({
      darkMode: true,
      pushNotifications: false,
    });
    expect(result.success).toBe(true);
  });

  it("updatePreferencesSchema should reject invalid language code", () => {
    const result = updatePreferencesSchema.safeParse({
      preferredLanguage: "english_language_too_long",
    });
    expect(result.success).toBe(false);
  });
});
