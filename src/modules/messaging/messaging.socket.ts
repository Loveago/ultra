import type { Server, Socket } from "socket.io";
import { logger } from "../../config/logger";
import { prisma } from "../../infrastructure/db/prisma";

interface SendMessagePayload {
  conversationId: string;
  content: string;
  attachments?: Array<{ url: string; type: string; name?: string }>;
}

export function handleMessagingEvents(io: Server, socket: Socket): void {
  const userId = socket.data.userId as string;

  socket.on("message:subscribe", (data: { conversationId: string }) => {
    socket.join(`conversation:${data.conversationId}`);
    logger.info({ socketId: socket.id, conversationId: data.conversationId }, "Subscribed to conversation");
    socket.emit("message:subscribed", { conversationId: data.conversationId });
  });

  socket.on("message:unsubscribe", (data: { conversationId: string }) => {
    socket.leave(`conversation:${data.conversationId}`);
    socket.emit("message:unsubscribed", { conversationId: data.conversationId });
  });

  socket.on("message:send", async (data: SendMessagePayload) => {
    try {
      const participant = await prisma.conversationParticipant.findUnique({
        where: { conversationId_userId: { conversationId: data.conversationId, userId } },
        include: { conversation: { include: { participants: true } } },
      });

      if (!participant) {
        socket.emit("error", { message: "Not a participant in this conversation" });
        return;
      }

      const message = await prisma.message.create({
        data: {
          conversationId: data.conversationId,
          senderId: userId,
          content: data.content,
          attachments: (data.attachments ?? []) as never,
          readBy: [userId] as never,
        },
      });

      await prisma.conversation.update({
        where: { id: data.conversationId },
        data: { updatedAt: new Date() },
      });

      await prisma.conversationParticipant.updateMany({
        where: { conversationId: data.conversationId, userId: { not: userId } },
        data: { unreadCount: { increment: 1 } },
      });

      io.to(`conversation:${data.conversationId}`).emit("message:new", {
        id: message.id,
        conversationId: data.conversationId,
        senderId: userId,
        content: data.content,
        attachments: data.attachments ?? [],
        createdAt: message.createdAt.toISOString(),
      });

      for (const p of participant.conversation.participants) {
        if (p.userId !== userId) {
          io.to(`user:${p.userId}`).emit("message:notification", {
            conversationId: data.conversationId,
            preview: data.content.substring(0, 50),
            senderId: userId,
          });
        }
      }
    } catch (err) {
      socket.emit("error", { message: (err as Error).message });
    }
  });

  socket.on("message:read", async (data: { conversationId: string }) => {
    try {
      const participant = await prisma.conversationParticipant.findUnique({
        where: { conversationId_userId: { conversationId: data.conversationId, userId } },
      });

      if (!participant) {
        return;
      }

      await prisma.conversationParticipant.update({
        where: { id: participant.id },
        data: { lastReadAt: new Date(), unreadCount: 0 },
      });

      socket.to(`conversation:${data.conversationId}`).emit("message:read_receipt", {
        conversationId: data.conversationId,
        userId,
        readAt: new Date().toISOString(),
      });
    } catch (err) {
      socket.emit("error", { message: (err as Error).message });
    }
  });

  socket.on("message:typing", (data: { conversationId: string; isTyping: boolean }) => {
    socket.to(`conversation:${data.conversationId}`).emit("message:typing", {
      conversationId: data.conversationId,
      userId,
      isTyping: data.isTyping,
    });
  });
}
