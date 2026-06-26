import { Prisma } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../../infrastructure/db/prisma";
import { AppError } from "../../common/errors/app-error";
import type {
  CreateConversationInput,
  ListConversationsInput,
  ListMessagesInput,
  SendMessageInput,
} from "./messaging.schema";

export async function createOrGetConversation(userId: string, input: CreateConversationInput) {
  const allParticipants = [...new Set([userId, ...input.participantIds])];

  if (input.type === "ORDER" && input.contextId) {
    const existing = await prisma.conversation.findFirst({
      where: { type: input.type, contextId: input.contextId },
      include: { participants: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    });

    if (existing) {
      const isParticipant = existing.participants.some((p) => p.userId === userId);
      if (!isParticipant) {
        throw new AppError("Not authorized to access this conversation", StatusCodes.FORBIDDEN);
      }
      return existing;
    }
  }

  const conversation = await prisma.conversation.create({
    data: {
      type: input.type,
      contextId: input.contextId,
      participants: {
        create: allParticipants.map((pid) => ({ userId: pid })),
      },
    },
    include: {
      participants: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return conversation;
}

export async function listConversations(userId: string, input: ListConversationsInput) {
  const skip = (input.page - 1) * input.limit;

  const [items, total] = await Promise.all([
    prisma.conversationParticipant.findMany({
      where: { userId },
      skip,
      take: input.limit,
      orderBy: { conversation: { updatedAt: "desc" } },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: { select: { id: true, email: true, phone: true, role: true } },
              },
            },
            messages: { orderBy: { createdAt: "desc" }, take: 1 },
          },
        },
      },
    }),
    prisma.conversationParticipant.count({ where: { userId } }),
  ]);

  return {
    items: items.map((p) => ({
      ...p.conversation,
      unreadCount: p.unreadCount,
      lastReadAt: p.lastReadAt,
    })),
    total,
    page: input.page,
    limit: input.limit,
    totalPages: Math.ceil(total / input.limit),
  };
}

export async function getConversation(userId: string, conversationId: string) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
    include: {
      conversation: {
        include: {
          participants: {
            include: {
              user: { select: { id: true, email: true, phone: true, role: true } },
            },
          },
        },
      },
    },
  });

  if (!participant) {
    throw new AppError("Conversation not found or you are not a participant", StatusCodes.NOT_FOUND);
  }

  return {
    ...participant.conversation,
    unreadCount: participant.unreadCount,
    lastReadAt: participant.lastReadAt,
  };
}

export async function sendMessage(userId: string, conversationId: string, input: SendMessageInput) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
    include: {
      conversation: { include: { participants: true } },
    },
  });

  if (!participant) {
    throw new AppError("Conversation not found or you are not a participant", StatusCodes.NOT_FOUND);
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: userId,
      content: input.content,
      attachments: input.attachments as Prisma.InputJsonValue,
      readBy: [userId] as Prisma.InputJsonValue,
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  await prisma.conversationParticipant.updateMany({
    where: { conversationId, userId: { not: userId } },
    data: { unreadCount: { increment: 1 } },
  });

  return message;
}

export async function markConversationAsRead(userId: string, conversationId: string) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });

  if (!participant) {
    throw new AppError("Conversation not found or you are not a participant", StatusCodes.NOT_FOUND);
  }

  await prisma.conversationParticipant.update({
    where: { id: participant.id },
    data: {
      lastReadAt: new Date(),
      unreadCount: 0,
    },
  });

  const unreadMessages = await prisma.message.findMany({
    where: {
      conversationId,
      senderId: { not: userId },
    },
    select: { id: true, readBy: true },
  });

  for (const msg of unreadMessages) {
    const readBy = Array.isArray(msg.readBy) ? (msg.readBy as string[]) : [];
    if (!readBy.includes(userId)) {
      await prisma.message.update({
        where: { id: msg.id },
        data: { readBy: [...readBy, userId] as Prisma.InputJsonValue },
      });
    }
  }

  return { marked: true, conversationId };
}

export async function listMessages(userId: string, conversationId: string, input: ListMessagesInput) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });

  if (!participant) {
    throw new AppError("Conversation not found or you are not a participant", StatusCodes.NOT_FOUND);
  }

  const skip = (input.page - 1) * input.limit;

  const [items, total] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId },
      skip,
      take: input.limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.message.count({ where: { conversationId } }),
  ]);

  return { items, total, page: input.page, limit: input.limit, totalPages: Math.ceil(total / input.limit) };
}

export async function getUnreadCount(userId: string) {
  const result = await prisma.conversationParticipant.aggregate({
    where: { userId },
    _sum: { unreadCount: true },
  });

  return { totalUnread: result._sum.unreadCount ?? 0 };
}
