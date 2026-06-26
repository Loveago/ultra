import { Router } from "express";
import { authenticate } from "../../common/middleware/authenticate";
import { authorize } from "../../common/middleware/authorize";
import { validateBody } from "../../common/middleware/validate";
import {
  blockIpController,
  checkIpBlockedController,
  listAuditLogsController,
  listBlockedIpsController,
  listDevicesController,
  listRiskScoresController,
  logAuditController,
  registerDeviceController,
  resolveRiskScoreController,
  trustDeviceController,
  unblockIpController,
} from "./security.controller";
import {
  blockIpSchema,
  logAuditSchema,
  registerDeviceSchema,
} from "./security.schema";

export const securityRoutes = Router();

securityRoutes.use(authenticate);

// Device management (user)
securityRoutes.post("/security/devices", validateBody(registerDeviceSchema), registerDeviceController);
securityRoutes.get("/security/devices", listDevicesController);
securityRoutes.put("/security/devices/:id/trust", trustDeviceController);

// Audit log
securityRoutes.post("/security/audit", validateBody(logAuditSchema), logAuditController);

// Admin — audit logs
securityRoutes.get("/security/audit", authorize(["ADMIN", "SUPER_ADMIN"]), listAuditLogsController);

// Admin — risk scores
securityRoutes.get("/security/risk-scores", authorize(["ADMIN", "SUPER_ADMIN"]), listRiskScoresController);
securityRoutes.put("/security/risk-scores/:id/resolve", authorize(["ADMIN", "SUPER_ADMIN"]), resolveRiskScoreController);

// Admin — IP blocking
securityRoutes.post("/security/blocked-ips", authorize(["ADMIN", "SUPER_ADMIN"]), validateBody(blockIpSchema), blockIpController);
securityRoutes.get("/security/blocked-ips", authorize(["ADMIN", "SUPER_ADMIN"]), listBlockedIpsController);
securityRoutes.delete("/security/blocked-ips/:ipAddress", authorize(["ADMIN", "SUPER_ADMIN"]), unblockIpController);
securityRoutes.get("/security/blocked-ips/:ipAddress/check", authorize(["ADMIN", "SUPER_ADMIN"]), checkIpBlockedController);
