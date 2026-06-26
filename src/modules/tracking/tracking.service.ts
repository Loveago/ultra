import { StatusCodes } from "http-status-codes";
import { prisma } from "../../infrastructure/db/prisma";
import { AppError } from "../../common/errors/app-error";

const EARTH_RADIUS_KM = 6371;
const AVERAGE_SPEED_KMH = 20;

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export async function calculateETA(
  assignmentId: string,
  riderLat: number,
  riderLng: number
): Promise<{ minutes: number; distanceKm: number }> {
  const assignment = await prisma.deliveryAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      storeGroup: {
        include: {
          order: {
            include: {
              items: { select: { storeId: true }, take: 1 },
            },
          },
        },
      },
    },
  });

  if (!assignment) {
    throw new AppError("Assignment not found", StatusCodes.NOT_FOUND);
  }

  const storeId = assignment.storeGroup.storeId;
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    include: {
      branches: {
        where: { isActive: true, isMainBranch: true },
        select: { latitude: true, longitude: true },
        take: 1,
      },
    },
  });

  let destLat: number;
  let destLng: number;

  if (assignment.status === "ACCEPTED") {
    if (store?.branches[0] && store.branches[0].latitude !== null && store.branches[0].longitude !== null) {
      destLat = store.branches[0].latitude;
      destLng = store.branches[0].longitude;
    } else {
      return { minutes: 0, distanceKm: 0 };
    }
  } else {
    const order = assignment.storeGroup.order;
    if (order.deliveryAddressId) {
      const address = await prisma.address.findUnique({
        where: { id: order.deliveryAddressId },
        select: { latitude: true, longitude: true },
      });
      if (address && address.latitude !== null && address.longitude !== null) {
        destLat = address.latitude;
        destLng = address.longitude;
      } else {
        return { minutes: 0, distanceKm: 0 };
      }
    } else {
      return { minutes: 0, distanceKm: 0 };
    }
  }

  const distanceKm = haversineDistance(riderLat, riderLng, destLat, destLng);
  const minutes = Math.ceil((distanceKm / AVERAGE_SPEED_KMH) * 60);

  return { minutes, distanceKm };
}

export async function getDeliveryTracking(assignmentId: string) {
  const assignment = await prisma.deliveryAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      rider: { select: { id: true, latitude: true, longitude: true, rating: true } },
      storeGroup: {
        select: {
          id: true,
          status: true,
          storeId: true,
          order: { select: { id: true, orderNumber: true, deliveryOption: true } },
        },
      },
    },
  });

  if (!assignment) {
    throw new AppError("Assignment not found", StatusCodes.NOT_FOUND);
  }

  const routeHistory = await prisma.routeTracking.findMany({
    where: { assignmentId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  let eta: { minutes: number; distanceKm: number } | null = null;
  if (assignment.rider.latitude && assignment.rider.longitude) {
    eta = await calculateETA(assignmentId, assignment.rider.latitude, assignment.rider.longitude);
  }

  return {
    assignment,
    routeHistory,
    eta,
  };
}

export async function getOrderTracking(orderId: string) {
  const assignments = await prisma.deliveryAssignment.findMany({
    where: { storeGroup: { orderId } },
    include: {
      rider: { select: { id: true, latitude: true, longitude: true, rating: true } },
      storeGroup: {
        select: {
          id: true,
          status: true,
          storeId: true,
        },
      },
    },
  });

  const trackingResults = await Promise.all(
    assignments.map(async (a) => {
      let eta: { minutes: number; distanceKm: number } | null = null;
      if (a.rider.latitude && a.rider.longitude) {
        try {
          eta = await calculateETA(a.id, a.rider.latitude, a.rider.longitude);
        } catch {
          eta = null;
        }
      }
      return { ...a, eta };
    })
  );

  return { assignments: trackingResults };
}
