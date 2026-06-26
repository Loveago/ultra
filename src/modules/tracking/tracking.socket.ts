import type { Server, Socket } from "socket.io";
import { logger } from "../../config/logger";
import { prisma } from "../../infrastructure/db/prisma";
import { calculateETA } from "./tracking.service";

interface LocationUpdate {
  assignmentId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
}

export function handleTrackingEvents(io: Server, socket: Socket): void {
  const userId = socket.data.userId as string;
  const role = socket.data.role as string;

  socket.on("delivery:subscribe", async (data: { assignmentId?: string; orderId?: string }) => {
    try {
      if (data.assignmentId) {
        const assignment = await prisma.deliveryAssignment.findUnique({
          where: { id: data.assignmentId },
          include: { storeGroup: { include: { order: true } } },
        });

        if (!assignment) {
          socket.emit("error", { message: "Assignment not found" });
          return;
        }

        if (assignment.storeGroup.order.userId !== userId && role !== "RIDER" && role !== "ADMIN" && role !== "SUPER_ADMIN") {
          socket.emit("error", { message: "Not authorized to subscribe to this delivery" });
          return;
        }

        socket.join(`delivery:${data.assignmentId}`);
        logger.info({ socketId: socket.id, assignmentId: data.assignmentId }, "Subscribed to delivery");
        socket.emit("delivery:subscribed", { assignmentId: data.assignmentId });
      } else if (data.orderId) {
        const order = await prisma.order.findUnique({ where: { id: data.orderId } });
        if (!order) {
          socket.emit("error", { message: "Order not found" });
          return;
        }

        if (order.userId !== userId && role !== "ADMIN" && role !== "SUPER_ADMIN") {
          socket.emit("error", { message: "Not authorized" });
          return;
        }

        const assignments = await prisma.deliveryAssignment.findMany({
          where: { storeGroup: { orderId: data.orderId } },
        });

        for (const a of assignments) {
          socket.join(`delivery:${a.id}`);
        }

        socket.join(`order:${data.orderId}`);
        socket.emit("delivery:subscribed", { orderId: data.orderId, assignmentIds: assignments.map((a) => a.id) });
      }
    } catch (err) {
      socket.emit("error", { message: (err as Error).message });
    }
  });

  socket.on("delivery:unsubscribe", (data: { assignmentId?: string; orderId?: string }) => {
    if (data.assignmentId) {
      socket.leave(`delivery:${data.assignmentId}`);
    }
    if (data.orderId) {
      socket.leave(`order:${data.orderId}`);
    }
    socket.emit("delivery:unsubscribed", data);
  });

  socket.on("rider:location", async (data: LocationUpdate) => {
    try {
      if (role !== "RIDER") {
        socket.emit("error", { message: "Only riders can send location updates" });
        return;
      }

      const assignment = await prisma.deliveryAssignment.findFirst({
        where: { id: data.assignmentId, rider: { userId } },
      });

      if (!assignment) {
        socket.emit("error", { message: "Assignment not found" });
        return;
      }

      await prisma.routeTracking.create({
        data: {
          assignmentId: data.assignmentId,
          latitude: data.latitude,
          longitude: data.longitude,
          heading: data.heading,
          speed: data.speed,
        },
      });

      await prisma.rider.update({
        where: { userId },
        data: { latitude: data.latitude, longitude: data.longitude },
      });

      const eta = await calculateETA(data.assignmentId, data.latitude, data.longitude);

      io.to(`delivery:${data.assignmentId}`).emit("delivery:update", {
        assignmentId: data.assignmentId,
        latitude: data.latitude,
        longitude: data.longitude,
        heading: data.heading,
        speed: data.speed,
        timestamp: Date.now(),
      });

      io.to(`delivery:${data.assignmentId}`).emit("delivery:eta", {
        assignmentId: data.assignmentId,
        eta,
        timestamp: Date.now(),
      });
    } catch (err) {
      socket.emit("error", { message: (err as Error).message });
    }
  });

  socket.on("rider:status", async (data: { assignmentId: string; status: string }) => {
    try {
      if (role !== "RIDER") {
        socket.emit("error", { message: "Only riders can send status updates" });
        return;
      }

      io.to(`delivery:${data.assignmentId}`).emit("delivery:status", {
        assignmentId: data.assignmentId,
        status: data.status,
        timestamp: Date.now(),
      });

      if (data.status === "PICKED_UP") {
        io.to(`delivery:${data.assignmentId}`).emit("delivery:picked_up", {
          assignmentId: data.assignmentId,
          timestamp: Date.now(),
        });
      } else if (data.status === "DELIVERED") {
        io.to(`delivery:${data.assignmentId}`).emit("delivery:completed", {
          assignmentId: data.assignmentId,
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      socket.emit("error", { message: (err as Error).message });
    }
  });
}
