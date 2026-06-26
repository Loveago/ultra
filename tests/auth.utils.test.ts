import { durationToMs, generateOtpCode, hashValue } from "../src/modules/auth/auth.utils";

describe("Auth utils", () => {
  it("hashValue should be deterministic", () => {
    expect(hashValue("abc")).toEqual(hashValue("abc"));
    expect(hashValue("abc")).not.toEqual(hashValue("abcd"));
  });

  it("generateOtpCode should create 6-digit codes", () => {
    const code = generateOtpCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it("durationToMs should parse minutes, hours, and days", () => {
    expect(durationToMs("15m")).toBe(900000);
    expect(durationToMs("2h")).toBe(7200000);
    expect(durationToMs("3d")).toBe(259200000);
  });
});
