import {
  sendNotificationSchema,
  updatePreferencesSchema,
  listNotificationsSchema,
} from "../src/modules/notification/notification.schema";

describe("Notification schemas", () => {
  it("sendNotificationSchema should accept valid input", () => {
    const result = sendNotificationSchema.safeParse({
      userId: "123e4567-e89b-12d3-a456-426614174000",
      type: "ORDER_STATUS",
      title: "Order Updated",
      body: "Your order has been confirmed",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.channels).toEqual(["IN_APP"]);
      expect(result.data.data).toEqual({});
    }
  });

  it("sendNotificationSchema should accept multiple channels", () => {
    const result = sendNotificationSchema.safeParse({
      userId: "123e4567-e89b-12d3-a456-426614174000",
      type: "PAYMENT_SUCCESS",
      title: "Payment Successful",
      body: "Your payment was successful",
      channels: ["PUSH", "SMS", "EMAIL", "IN_APP"],
      data: { orderId: "abc" },
    });
    expect(result.success).toBe(true);
  });

  it("sendNotificationSchema should reject empty channels", () => {
    const result = sendNotificationSchema.safeParse({
      userId: "123e4567-e89b-12d3-a456-426614174000",
      type: "SYSTEM",
      title: "Test",
      body: "Test",
      channels: [],
    });
    expect(result.success).toBe(false);
  });

  it("sendNotificationSchema should reject invalid type", () => {
    const result = sendNotificationSchema.safeParse({
      userId: "123e4567-e89b-12d3-a456-426614174000",
      type: "INVALID",
      title: "Test",
      body: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("sendNotificationSchema should reject missing title", () => {
    const result = sendNotificationSchema.safeParse({
      userId: "123e4567-e89b-12d3-a456-426614174000",
      type: "SYSTEM",
      body: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("updatePreferencesSchema should accept partial update", () => {
    const result = updatePreferencesSchema.safeParse({ pushEnabled: false });
    expect(result.success).toBe(true);
  });

  it("updatePreferencesSchema should accept fcmToken", () => {
    const result = updatePreferencesSchema.safeParse({
      fcmToken: "abc123token",
      pushEnabled: true,
    });
    expect(result.success).toBe(true);
  });

  it("updatePreferencesSchema should accept null fcmToken", () => {
    const result = updatePreferencesSchema.safeParse({ fcmToken: null });
    expect(result.success).toBe(true);
  });

  it("listNotificationsSchema should apply defaults", () => {
    const result = listNotificationsSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
      expect(result.data.unreadOnly).toBe(false);
    }
  });

  it("listNotificationsSchema should accept unreadOnly", () => {
    const result = listNotificationsSchema.safeParse({ unreadOnly: true });
    expect(result.success).toBe(true);
  });
});
