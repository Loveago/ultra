import {
  logAuditSchema,
  registerDeviceSchema,
  blockIpSchema,
  listAuditLogsSchema,
} from "../src/modules/security/security.schema";

describe("Security schemas", () => {
  it("logAuditSchema should accept valid audit log", () => {
    const result = logAuditSchema.safeParse({
      action: "LOGIN",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.riskLevel).toBe("LOW");
      expect(result.data.metadata).toEqual({});
    }
  });

  it("logAuditSchema should accept high risk action", () => {
    const result = logAuditSchema.safeParse({
      action: "WITHDRAWAL_PROCESS",
      riskLevel: "HIGH",
    });
    expect(result.success).toBe(true);
  });

  it("logAuditSchema should reject invalid action", () => {
    const result = logAuditSchema.safeParse({ action: "DELETE_USER" });
    expect(result.success).toBe(false);
  });

  it("registerDeviceSchema should accept valid fingerprint", () => {
    const result = registerDeviceSchema.safeParse({
      fingerprint: "device-fingerprint-abc123",
    });
    expect(result.success).toBe(true);
  });

  it("registerDeviceSchema should reject short fingerprint", () => {
    const result = registerDeviceSchema.safeParse({
      fingerprint: "short",
    });
    expect(result.success).toBe(false);
  });

  it("blockIpSchema should accept valid IP", () => {
    const result = blockIpSchema.safeParse({
      ipAddress: "192.168.1.1",
      reason: "Suspicious activity",
    });
    expect(result.success).toBe(true);
  });

  it("blockIpSchema should reject invalid IP", () => {
    const result = blockIpSchema.safeParse({
      ipAddress: "not-an-ip",
    });
    expect(result.success).toBe(false);
  });

  it("listAuditLogsSchema should apply defaults", () => {
    const result = listAuditLogsSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(50);
    }
  });
});
