import { z } from "zod";

export const registerRiderSchema = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const updateRiderSchema = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const uploadDocumentSchema = z.object({
  type: z.enum(["DRIVERS_LICENSE", "NATIONAL_ID", "PASSPORT", "VEHICLE_REGISTRATION", "INSURANCE", "PROOF_OF_ADDRESS"]),
  fileUrl: z.string().url(),
});

export const addVehicleSchema = z.object({
  type: z.enum(["MOTORCYCLE", "BICYCLE", "CAR", "VAN", "TRUCK"]),
  plateNumber: z.string().max(20).optional(),
  model: z.string().max(100).optional(),
  color: z.string().max(50).optional(),
  isActive: z.boolean().default(false),
});

export const updateVehicleSchema = z.object({
  plateNumber: z.string().max(20).optional(),
  model: z.string().max(100).optional(),
  color: z.string().max(50).optional(),
  isActive: z.boolean().optional(),
});

export const updateRiderStatusSchema = z.object({
  isOnline: z.boolean(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const verifyRiderSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "SUSPENDED"]),
  reason: z.string().max(500).optional(),
});

export const assignOrderSchema = z.object({
  storeGroupId: z.string().uuid(),
  riderId: z.string().uuid(),
});

export const locationUpdateSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  heading: z.number().optional(),
  speed: z.number().optional(),
});

export const listAssignmentsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.enum(["ASSIGNED", "ACCEPTED", "REJECTED", "PICKED_UP", "DELIVERED", "CANCELLED"]).optional(),
});

export type RegisterRiderInput = z.infer<typeof registerRiderSchema>;
export type UpdateRiderInput = z.infer<typeof updateRiderSchema>;
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
export type AddVehicleInput = z.infer<typeof addVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type UpdateRiderStatusInput = z.infer<typeof updateRiderStatusSchema>;
export type VerifyRiderInput = z.infer<typeof verifyRiderSchema>;
export type AssignOrderInput = z.infer<typeof assignOrderSchema>;
export type LocationUpdateInput = z.infer<typeof locationUpdateSchema>;
export type ListAssignmentsInput = z.infer<typeof listAssignmentsSchema>;
