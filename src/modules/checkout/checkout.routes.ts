import { Router } from "express";
import { authenticate } from "../../common/middleware/authenticate";
import { validateBody } from "../../common/middleware/validate";
import {
  createOrderController,
  deliveryOptionsController,
  initiateCheckoutController,
  validateCheckoutController,
} from "./checkout.controller";
import {
  createOrderSchema,
  initiateCheckoutSchema,
  validateCheckoutSchema,
} from "./checkout.schema";

export const checkoutRoutes = Router();

checkoutRoutes.use(authenticate);

checkoutRoutes.post("/checkout/initiate", validateBody(initiateCheckoutSchema), initiateCheckoutController);
checkoutRoutes.get("/checkout/delivery-options", deliveryOptionsController);
checkoutRoutes.post("/checkout/validate", validateBody(validateCheckoutSchema), validateCheckoutController);
checkoutRoutes.post("/checkout/create", validateBody(createOrderSchema), createOrderController);
