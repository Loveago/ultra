import { Router } from "express";
import { validateBody } from "../../common/middleware/validate";
import { echoSchema } from "./system.schema";
import { echoController } from "./system.controller";

export const systemRoutes = Router();

systemRoutes.post("/system/echo", validateBody(echoSchema), echoController);
