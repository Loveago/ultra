import { StatusCodes } from "http-status-codes";
import { prisma } from "../../infrastructure/db/prisma";
import { AppError } from "../../common/errors/app-error";
import type {
  AddVehicleInput,
  AssignOrderInput,
  ListAssignmentsInput,
  LocationUpdateInput,
  RegisterRiderInput,
  UpdateRiderInput,
  UpdateRiderStatusInput,
  UpdateVehicleInput,
  UploadDocumentInput,
  VerifyRiderInput,
} from "./rider.schema";

async function getRiderByUserId(userId: string) {
  const rider = await prisma.rider.findUnique({
    where: { userId },
    include: { documents: true, vehicles: true },
  });
  if (!rider) {
    throw new AppError("Rider profile not found", StatusCodes.NOT_FOUND);
  }
  return rider;
}

export async function registerRider(userId: string, input: RegisterRiderInput) {
  const existing = await prisma.rider.findUnique({ where: { userId } });
  if (existing) {
    throw new AppError("Rider profile already exists", StatusCodes.CONFLICT);
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: "RIDER" },
  });

  return prisma.rider.create({
    data: {
      userId,
      latitude: input.latitude,
      longitude: input.longitude,
    },
    include: { documents: true, vehicles: true },
  });
}

export async function getRiderProfile(userId: string) {
  return getRiderByUserId(userId);
}

export async function updateRiderProfile(userId: string, input: UpdateRiderInput) {
  const rider = await getRiderByUserId(userId);

  return prisma.rider.update({
    where: { id: rider.id },
    data: {
      latitude: input.latitude,
      longitude: input.longitude,
    },
    include: { documents: true, vehicles: true },
  });
}

export async function uploadDocument(userId: string, input: UploadDocumentInput) {
  const rider = await getRiderByUserId(userId);

  return prisma.riderDocument.create({
    data: {
      riderId: rider.id,
      type: input.type,
      fileUrl: input.fileUrl,
    },
  });
}

export async function listDocuments(userId: string) {
  const rider = await getRiderByUserId(userId);
  return prisma.riderDocument.findMany({
    where: { riderId: rider.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function addVehicle(userId: string, input: AddVehicleInput) {
  const rider = await getRiderByUserId(userId);

  if (input.isActive) {
    await prisma.vehicle.updateMany({
      where: { riderId: rider.id, isActive: true },
      data: { isActive: false },
    });
  }

  return prisma.vehicle.create({
    data: {
      riderId: rider.id,
      type: input.type,
      plateNumber: input.plateNumber,
      model: input.model,
      color: input.color,
      isActive: input.isActive,
    },
  });
}

export async function listVehicles(userId: string) {
  const rider = await getRiderByUserId(userId);
  return prisma.vehicle.findMany({
    where: { riderId: rider.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateVehicle(userId: string, vehicleId: string, input: UpdateVehicleInput) {
  const rider = await getRiderByUserId(userId);
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, riderId: rider.id },
  });

  if (!vehicle) {
    throw new AppError("Vehicle not found", StatusCodes.NOT_FOUND);
  }

  if (input.isActive) {
    await prisma.vehicle.updateMany({
      where: { riderId: rider.id, isActive: true, id: { not: vehicleId } },
      data: { isActive: false },
    });
  }

  return prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      plateNumber: input.plateNumber,
      model: input.model,
      color: input.color,
      isActive: input.isActive,
    },
  });
}

export async function removeVehicle(userId: string, vehicleId: string) {
  const rider = await getRiderByUserId(userId);
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, riderId: rider.id },
  });

  if (!vehicle) {
    throw new AppError("Vehicle not found", StatusCodes.NOT_FOUND);
  }

  await prisma.vehicle.delete({ where: { id: vehicleId } });
  return { removed: true };
}

export async function updateRiderStatus(userId: string, input: UpdateRiderStatusInput) {
  const rider = await getRiderByUserId(userId);

  if (rider.status !== "APPROVED" && input.isOnline) {
    throw new AppError("Rider must be approved to go online", StatusCodes.BAD_REQUEST);
  }

  return prisma.rider.update({
    where: { id: rider.id },
    data: {
      isOnline: input.isOnline,
      latitude: input.latitude,
      longitude: input.longitude,
    },
    select: { id: true, isOnline: true, status: true },
  });
}

export async function getRiderEarnings(userId: string) {
  const rider = await getRiderByUserId(userId);

  const completedAssignments = await prisma.deliveryAssignment.findMany({
    where: { riderId: rider.id, status: "DELIVERED" },
    include: { storeGroup: { select: { deliveryFee: true, total: true } } },
  });

  const totalEarnings = completedAssignments.reduce(
    (sum, a) => sum + (a.storeGroup.deliveryFee || 0),
    0,
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayAssignments = completedAssignments.filter(
    (a) => a.deliveredAt && a.deliveredAt >= today,
  );
  const todayEarnings = todayAssignments.reduce(
    (sum, a) => sum + (a.storeGroup.deliveryFee || 0),
    0,
  );

  return {
    totalEarnings,
    totalDeliveries: rider.totalDeliveries,
    todayEarnings,
    todayDeliveries: todayAssignments.length,
    rating: rider.rating,
  };
}

export async function listAssignments(userId: string, input: ListAssignmentsInput) {
  const rider = await getRiderByUserId(userId);
  const skip = (input.page - 1) * input.limit;

  const where: Record<string, unknown> = { riderId: rider.id };
  if (input.status) where.status = input.status;

  const [items, total] = await Promise.all([
    prisma.deliveryAssignment.findMany({
      where,
      skip,
      take: input.limit,
      orderBy: { assignedAt: "desc" },
      include: {
        storeGroup: {
          include: {
            order: { select: { id: true, orderNumber: true, deliveryOption: true, deliveryAddressId: true } },
          },
        },
      },
    }),
    prisma.deliveryAssignment.count({ where }),
  ]);

  return { items, total, page: input.page, limit: input.limit, totalPages: Math.ceil(total / input.limit) };
}

export async function acceptAssignment(userId: string, assignmentId: string) {
  const rider = await getRiderByUserId(userId);
  const assignment = await prisma.deliveryAssignment.findFirst({
    where: { id: assignmentId, riderId: rider.id },
  });

  if (!assignment) {
    throw new AppError("Assignment not found", StatusCodes.NOT_FOUND);
  }

  if (assignment.status !== "ASSIGNED") {
    throw new AppError("Assignment is not in ASSIGNED state", StatusCodes.BAD_REQUEST);
  }

  return prisma.deliveryAssignment.update({
    where: { id: assignmentId },
    data: {
      status: "ACCEPTED",
      acceptedAt: new Date(),
    },
  });
}

export async function rejectAssignment(userId: string, assignmentId: string) {
  const rider = await getRiderByUserId(userId);
  const assignment = await prisma.deliveryAssignment.findFirst({
    where: { id: assignmentId, riderId: rider.id },
  });

  if (!assignment) {
    throw new AppError("Assignment not found", StatusCodes.NOT_FOUND);
  }

  if (assignment.status !== "ASSIGNED") {
    throw new AppError("Assignment is not in ASSIGNED state", StatusCodes.BAD_REQUEST);
  }

  return prisma.deliveryAssignment.update({
    where: { id: assignmentId },
    data: {
      status: "REJECTED",
      cancelledAt: new Date(),
    },
  });
}

export async function markPickedUp(userId: string, assignmentId: string) {
  const rider = await getRiderByUserId(userId);
  const assignment = await prisma.deliveryAssignment.findFirst({
    where: { id: assignmentId, riderId: rider.id },
  });

  if (!assignment) {
    throw new AppError("Assignment not found", StatusCodes.NOT_FOUND);
  }

  if (assignment.status !== "ACCEPTED") {
    throw new AppError("Assignment must be ACCEPTED before pickup", StatusCodes.BAD_REQUEST);
  }

  await prisma.orderStoreGroup.update({
    where: { id: assignment.storeGroupId },
    data: { status: "OUT_FOR_DELIVERY" },
  });

  return prisma.deliveryAssignment.update({
    where: { id: assignmentId },
    data: {
      status: "PICKED_UP",
      pickedUpAt: new Date(),
    },
  });
}

export async function markDelivered(userId: string, assignmentId: string) {
  const rider = await getRiderByUserId(userId);
  const assignment = await prisma.deliveryAssignment.findFirst({
    where: { id: assignmentId, riderId: rider.id },
  });

  if (!assignment) {
    throw new AppError("Assignment not found", StatusCodes.NOT_FOUND);
  }

  if (assignment.status !== "PICKED_UP") {
    throw new AppError("Assignment must be PICKED_UP before delivery", StatusCodes.BAD_REQUEST);
  }

  await prisma.orderStoreGroup.update({
    where: { id: assignment.storeGroupId },
    data: { status: "DELIVERED" },
  });

  await prisma.rider.update({
    where: { id: rider.id },
    data: {
      totalDeliveries: { increment: 1 },
      totalEarnings: { increment: 0 },
    },
  });

  return prisma.deliveryAssignment.update({
    where: { id: assignmentId },
    data: {
      status: "DELIVERED",
      deliveredAt: new Date(),
    },
  });
}

export async function updateLocation(userId: string, assignmentId: string, input: LocationUpdateInput) {
  const rider = await getRiderByUserId(userId);
  const assignment = await prisma.deliveryAssignment.findFirst({
    where: { id: assignmentId, riderId: rider.id },
  });

  if (!assignment) {
    throw new AppError("Assignment not found", StatusCodes.NOT_FOUND);
  }

  await prisma.rider.update({
    where: { id: rider.id },
    data: { latitude: input.latitude, longitude: input.longitude },
  });

  return prisma.routeTracking.create({
    data: {
      assignmentId,
      latitude: input.latitude,
      longitude: input.longitude,
      heading: input.heading,
      speed: input.speed,
    },
  });
}

export async function verifyRider(riderId: string, input: VerifyRiderInput) {
  const rider = await prisma.rider.findUnique({ where: { id: riderId } });
  if (!rider) {
    throw new AppError("Rider not found", StatusCodes.NOT_FOUND);
  }

  return prisma.rider.update({
    where: { id: riderId },
    data: { status: input.status },
  });
}

export async function listAllRiders(page = 1, limit = 20, status?: string) {
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [items, total] = await Promise.all([
    prisma.rider.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, email: true, phone: true } },
        _count: { select: { documents: true, vehicles: true, assignments: true } },
      },
    }),
    prisma.rider.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function assignOrderToRider(input: AssignOrderInput) {
  const rider = await prisma.rider.findUnique({ where: { id: input.riderId } });
  if (!rider) {
    throw new AppError("Rider not found", StatusCodes.NOT_FOUND);
  }

  if (rider.status !== "APPROVED") {
    throw new AppError("Rider is not approved", StatusCodes.BAD_REQUEST);
  }

  if (!rider.isOnline) {
    throw new AppError("Rider is not online", StatusCodes.BAD_REQUEST);
  }

  const storeGroup = await prisma.orderStoreGroup.findUnique({
    where: { id: input.storeGroupId },
  });
  if (!storeGroup) {
    throw new AppError("Store group not found", StatusCodes.NOT_FOUND);
  }

  const existingAssignment = await prisma.deliveryAssignment.findUnique({
    where: { storeGroupId: input.storeGroupId },
  });
  if (existingAssignment) {
    throw new AppError("Store group already has an assignment", StatusCodes.CONFLICT);
  }

  return prisma.deliveryAssignment.create({
    data: {
      riderId: input.riderId,
      storeGroupId: input.storeGroupId,
      status: "ASSIGNED",
    },
    include: {
      rider: { select: { id: true, rating: true } },
      storeGroup: { select: { id: true, storeId: true, total: true } },
    },
  });
}
