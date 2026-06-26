import { z } from "zod";

export const createConversationSchema = z.object({
  type: z.enum(["ORDER", "DELIVERY", "SUPPORT", "DIRECT"]),
  contextId: z.string().uuid().optional(),
  participantIds: z.array(z.string().uuid()).min(1).max(10),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(5000),
  attachments: z
    .array(
      z.object({
        url: z.string().url(),
        type: z.enum(["IMAGE", "FILE", "AUDIO", "VIDEO"]),
        name: z.string().max(255).optional(),
      })
    )
    .max(5)
    .default([]),
});

export const listConversationsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const listMessagesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type ListConversationsInput = z.infer<typeof listConversationsSchema>;
export type ListMessagesInput = z.infer<typeof listMessagesSchema>;
