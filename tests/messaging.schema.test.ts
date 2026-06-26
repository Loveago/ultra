import {
  createConversationSchema,
  listConversationsSchema,
  listMessagesSchema,
  sendMessageSchema,
} from "../src/modules/messaging/messaging.schema";

describe("Messaging schemas", () => {
  it("createConversationSchema should accept valid ORDER conversation", () => {
    const result = createConversationSchema.safeParse({
      type: "ORDER",
      contextId: "123e4567-e89b-12d3-a456-426614174000",
      participantIds: ["123e4567-e89b-12d3-a456-426614174001"],
    });
    expect(result.success).toBe(true);
  });

  it("createConversationSchema should accept DIRECT without contextId", () => {
    const result = createConversationSchema.safeParse({
      type: "DIRECT",
      participantIds: ["123e4567-e89b-12d3-a456-426614174001"],
    });
    expect(result.success).toBe(true);
  });

  it("createConversationSchema should reject empty participantIds", () => {
    const result = createConversationSchema.safeParse({
      type: "DIRECT",
      participantIds: [],
    });
    expect(result.success).toBe(false);
  });

  it("createConversationSchema should reject too many participants", () => {
    const result = createConversationSchema.safeParse({
      type: "DIRECT",
      participantIds: Array(11).fill("123e4567-e89b-12d3-a456-426614174001"),
    });
    expect(result.success).toBe(false);
  });

  it("createConversationSchema should reject invalid type", () => {
    const result = createConversationSchema.safeParse({
      type: "GROUP",
      participantIds: ["123e4567-e89b-12d3-a456-426614174001"],
    });
    expect(result.success).toBe(false);
  });

  it("sendMessageSchema should accept text-only message", () => {
    const result = sendMessageSchema.safeParse({ content: "Hello!" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.attachments).toEqual([]);
    }
  });

  it("sendMessageSchema should accept message with attachments", () => {
    const result = sendMessageSchema.safeParse({
      content: "See this image",
      attachments: [
        { url: "https://example.com/img.png", type: "IMAGE", name: "photo.png" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("sendMessageSchema should reject empty content", () => {
    const result = sendMessageSchema.safeParse({ content: "" });
    expect(result.success).toBe(false);
  });

  it("sendMessageSchema should reject too many attachments", () => {
    const result = sendMessageSchema.safeParse({
      content: "Test",
      attachments: Array(6).fill({ url: "https://example.com/f.png", type: "IMAGE" }),
    });
    expect(result.success).toBe(false);
  });

  it("sendMessageSchema should reject invalid attachment type", () => {
    const result = sendMessageSchema.safeParse({
      content: "Test",
      attachments: [{ url: "https://example.com/f.zip", type: "ZIP" }],
    });
    expect(result.success).toBe(false);
  });

  it("listConversationsSchema should apply defaults", () => {
    const result = listConversationsSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it("listMessagesSchema should apply defaults", () => {
    const result = listMessagesSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });
});
