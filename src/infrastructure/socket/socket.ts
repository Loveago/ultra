import type { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { Server, type Socket } from "socket.io";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { handleTrackingEvents } from "../../modules/tracking/tracking.socket";
import { handleMessagingEvents } from "../../modules/messaging/messaging.socket";

let io: Server | null = null;

interface AuthPayload {
  sub: string;
  role: string;
}

function authenticateSocket(socket: Socket): Promise<void> {
  return new Promise((resolve, reject) => {
    const token = socket.handshake.auth?.token as string | undefined;

    if (!token) {
      reject(new Error("No token provided"));
      return;
    }

    try {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthPayload;
      socket.data.userId = payload.sub;
      socket.data.role = payload.role;
      resolve();
    } catch {
      reject(new Error("Invalid token"));
    }
  });
}

export function initSocket(server: HttpServer): Server {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.use(async (socket, next) => {
    try {
      await authenticateSocket(socket);
      next();
    } catch (err) {
      logger.warn({ err: (err as Error).message }, "Socket auth failed");
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    logger.info({ socketId: socket.id, userId: socket.data.userId }, "Socket connected");

    socket.on("ping", () => {
      socket.emit("pong", { ok: true, timestamp: Date.now() });
    });

    handleTrackingEvents(io!, socket);
    handleMessagingEvents(io!, socket);

    socket.on("disconnect", () => {
      logger.info({ socketId: socket.id, userId: socket.data.userId }, "Socket disconnected");
    });
  });

  return io;
}

export function getSocket(): Server {
  if (!io) {
    throw new Error("Socket.IO has not been initialized");
  }

  return io;
}
