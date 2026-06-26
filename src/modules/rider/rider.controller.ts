import type { Request, Response } from "express";
import {
  acceptAssignment,
  addVehicle,
  assignOrderToRider,
  getRiderEarnings,
  getRiderProfile,
  listAllRiders,
  listAssignments,
  listDocuments,
  listVehicles,
  markDelivered,
  markPickedUp,
  registerRider,
  rejectAssignment,
  removeVehicle,
  updateLocation,
  updateRiderProfile,
  updateRiderStatus,
  updateVehicle,
  uploadDocument,
  verifyRider,
} from "./rider.service";

export async function registerRiderController(req: Request, res: Response): Promise<void> {
  const data = await registerRider(req.auth!.userId, req.body);
  res.status(201).json({ success: true, data });
}

export async function getRiderProfileController(req: Request, res: Response): Promise<void> {
  const data = await getRiderProfile(req.auth!.userId);
  res.status(200).json({ success: true, data });
}

export async function updateRiderProfileController(req: Request, res: Response): Promise<void> {
  const data = await updateRiderProfile(req.auth!.userId, req.body);
  res.status(200).json({ success: true, data });
}

export async function uploadDocumentController(req: Request, res: Response): Promise<void> {
  const data = await uploadDocument(req.auth!.userId, req.body);
  res.status(201).json({ success: true, data });
}

export async function listDocumentsController(req: Request, res: Response): Promise<void> {
  const data = await listDocuments(req.auth!.userId);
  res.status(200).json({ success: true, data });
}

export async function addVehicleController(req: Request, res: Response): Promise<void> {
  const data = await addVehicle(req.auth!.userId, req.body);
  res.status(201).json({ success: true, data });
}

export async function listVehiclesController(req: Request, res: Response): Promise<void> {
  const data = await listVehicles(req.auth!.userId);
  res.status(200).json({ success: true, data });
}

export async function updateVehicleController(req: Request, res: Response): Promise<void> {
  const data = await updateVehicle(req.auth!.userId, req.params.id, req.body);
  res.status(200).json({ success: true, data });
}

export async function removeVehicleController(req: Request, res: Response): Promise<void> {
  const data = await removeVehicle(req.auth!.userId, req.params.id);
  res.status(200).json({ success: true, data });
}

export async function updateRiderStatusController(req: Request, res: Response): Promise<void> {
  const data = await updateRiderStatus(req.auth!.userId, req.body);
  res.status(200).json({ success: true, data });
}

export async function riderEarningsController(req: Request, res: Response): Promise<void> {
  const data = await getRiderEarnings(req.auth!.userId);
  res.status(200).json({ success: true, data });
}

export async function listAssignmentsController(req: Request, res: Response): Promise<void> {
  const data = await listAssignments(req.auth!.userId, {
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 20,
    status: req.query.status as "ASSIGNED" | "ACCEPTED" | "REJECTED" | "PICKED_UP" | "DELIVERED" | "CANCELLED" | undefined,
  });
  res.status(200).json({ success: true, data });
}

export async function acceptAssignmentController(req: Request, res: Response): Promise<void> {
  const data = await acceptAssignment(req.auth!.userId, req.params.id);
  res.status(200).json({ success: true, data });
}

export async function rejectAssignmentController(req: Request, res: Response): Promise<void> {
  const data = await rejectAssignment(req.auth!.userId, req.params.id);
  res.status(200).json({ success: true, data });
}

export async function pickupController(req: Request, res: Response): Promise<void> {
  const data = await markPickedUp(req.auth!.userId, req.params.id);
  res.status(200).json({ success: true, data });
}

export async function deliverController(req: Request, res: Response): Promise<void> {
  const data = await markDelivered(req.auth!.userId, req.params.id);
  res.status(200).json({ success: true, data });
}

export async function locationUpdateController(req: Request, res: Response): Promise<void> {
  const data = await updateLocation(req.auth!.userId, req.params.id, req.body);
  res.status(201).json({ success: true, data });
}

export async function verifyRiderController(req: Request, res: Response): Promise<void> {
  const data = await verifyRider(req.params.riderId, req.body);
  res.status(200).json({ success: true, data });
}

export async function listRidersController(req: Request, res: Response): Promise<void> {
  const data = await listAllRiders(
    req.query.page ? Number(req.query.page) : 1,
    req.query.limit ? Number(req.query.limit) : 20,
    req.query.status as string | undefined,
  );
  res.status(200).json({ success: true, data });
}

export async function assignOrderController(req: Request, res: Response): Promise<void> {
  const data = await assignOrderToRider(req.body);
  res.status(201).json({ success: true, data });
}
