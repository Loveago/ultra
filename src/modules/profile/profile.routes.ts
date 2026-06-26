import { Router } from "express";
import { authenticate } from "../../common/middleware/authenticate";
import { validateBody } from "../../common/middleware/validate";
import {
  createAddressController,
  deleteAddressController,
  getAddressesController,
  getPreferencesController,
  getProfileController,
  updateAddressController,
  updatePreferencesController,
  updateProfileController,
} from "./profile.controller";
import {
  createAddressSchema,
  updateAddressSchema,
  updatePreferencesSchema,
  updateProfileSchema,
} from "./profile.schema";

export const profileRoutes = Router();

profileRoutes.use(authenticate);

profileRoutes.get("/profile", getProfileController);
profileRoutes.put("/profile", validateBody(updateProfileSchema), updateProfileController);

profileRoutes.get("/profile/addresses", getAddressesController);
profileRoutes.post("/profile/addresses", validateBody(createAddressSchema), createAddressController);
profileRoutes.put("/profile/addresses/:id", validateBody(updateAddressSchema), updateAddressController);
profileRoutes.delete("/profile/addresses/:id", deleteAddressController);

profileRoutes.get("/profile/preferences", getPreferencesController);
profileRoutes.put("/profile/preferences", validateBody(updatePreferencesSchema), updatePreferencesController);
