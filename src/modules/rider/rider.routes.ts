import { Router } from "express";
import { authenticate } from "../../common/middleware/authenticate";
import { authorize } from "../../common/middleware/authorize";
import { validateBody } from "../../common/middleware/validate";
import {
  acceptAssignmentController,
  addVehicleController,
  assignOrderController,
  deliverController,
  getRiderProfileController,
  listAssignmentsController,
  listDocumentsController,
  listRidersController,
  listVehiclesController,
  locationUpdateController,
  pickupController,
  registerRiderController,
  rejectAssignmentController,
  removeVehicleController,
  riderEarningsController,
  updateRiderProfileController,
  updateRiderStatusController,
  updateVehicleController,
  uploadDocumentController,
  verifyRiderController,
} from "./rider.controller";
import {
  addVehicleSchema,
  assignOrderSchema,
  locationUpdateSchema,
  registerRiderSchema,
  updateRiderSchema,
  updateRiderStatusSchema,
  updateVehicleSchema,
  uploadDocumentSchema,
  verifyRiderSchema,
} from "./rider.schema";

export const riderRoutes = Router();

riderRoutes.use(authenticate);

// Rider self-service routes
riderRoutes.post("/riders/register", validateBody(registerRiderSchema), registerRiderController);
riderRoutes.get("/riders/me", getRiderProfileController);
riderRoutes.put("/riders/me", validateBody(updateRiderSchema), updateRiderProfileController);
riderRoutes.post("/riders/me/documents", validateBody(uploadDocumentSchema), uploadDocumentController);
riderRoutes.get("/riders/me/documents", listDocumentsController);
riderRoutes.post("/riders/me/vehicles", validateBody(addVehicleSchema), addVehicleController);
riderRoutes.get("/riders/me/vehicles", listVehiclesController);
riderRoutes.put("/riders/me/vehicles/:id", validateBody(updateVehicleSchema), updateVehicleController);
riderRoutes.delete("/riders/me/vehicles/:id", removeVehicleController);
riderRoutes.put("/riders/me/status", validateBody(updateRiderStatusSchema), updateRiderStatusController);
riderRoutes.get("/riders/me/earnings", riderEarningsController);
riderRoutes.get("/riders/me/assignments", listAssignmentsController);

// Rider assignment actions
riderRoutes.put("/riders/assignments/:id/accept", acceptAssignmentController);
riderRoutes.put("/riders/assignments/:id/reject", rejectAssignmentController);
riderRoutes.put("/riders/assignments/:id/pickup", pickupController);
riderRoutes.put("/riders/assignments/:id/deliver", deliverController);
riderRoutes.post("/riders/assignments/:id/location", validateBody(locationUpdateSchema), locationUpdateController);

// Admin routes
riderRoutes.post("/riders/admin/verify/:riderId", authorize(["ADMIN", "SUPER_ADMIN"]), validateBody(verifyRiderSchema), verifyRiderController);
riderRoutes.get("/riders/admin/list", authorize(["ADMIN", "SUPER_ADMIN"]), listRidersController);
riderRoutes.post("/riders/admin/assign", authorize(["ADMIN", "SUPER_ADMIN"]), validateBody(assignOrderSchema), assignOrderController);
