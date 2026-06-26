import { Router } from "express";
import { authenticate } from "../../common/middleware/authenticate";
import { authorize } from "../../common/middleware/authorize";
import { validateBody } from "../../common/middleware/validate";
import {
  getPreferencesController,
  listNotificationsController,
  markAllReadController,
  markReadController,
  sendNotificationController,
  unreadCountController,
  updatePreferencesController,
} from "./notification.controller";
import {
  sendNotificationSchema,
  updatePreferencesSchema,
} from "./notification.schema";

export const notificationModuleRoutes = Router();

notificationModuleRoutes.use(authenticate);

// User notification routes
notificationModuleRoutes.get("/notifications", listNotificationsController);
notificationModuleRoutes.get("/notifications/unread-count", unreadCountController);
notificationModuleRoutes.put("/notifications/:id/read", markReadController);
notificationModuleRoutes.put("/notifications/read-all", markAllReadController);

// Preferences
notificationModuleRoutes.get("/notifications/preferences", getPreferencesController);
notificationModuleRoutes.put("/notifications/preferences", validateBody(updatePreferencesSchema), updatePreferencesController);

// Admin: send notification to any user
notificationModuleRoutes.post("/notifications/send", authorize(["ADMIN", "SUPER_ADMIN"]), validateBody(sendNotificationSchema), sendNotificationController);
