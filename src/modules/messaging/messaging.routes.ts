import { Router } from "express";
import { authenticate } from "../../common/middleware/authenticate";
import { validateBody } from "../../common/middleware/validate";
import {
  createConversationController,
  getConversationController,
  listConversationsController,
  listMessagesController,
  markReadController,
  sendMessageController,
  unreadCountController,
} from "./messaging.controller";
import {
  createConversationSchema,
  sendMessageSchema,
} from "./messaging.schema";

export const messagingRoutes = Router();

messagingRoutes.use(authenticate);

messagingRoutes.get("/messages/unread-count", unreadCountController);
messagingRoutes.get("/messages/conversations", listConversationsController);
messagingRoutes.post("/messages/conversations", validateBody(createConversationSchema), createConversationController);
messagingRoutes.get("/messages/conversations/:id", getConversationController);
messagingRoutes.post("/messages/conversations/:id/messages", validateBody(sendMessageSchema), sendMessageController);
messagingRoutes.put("/messages/conversations/:id/read", markReadController);
messagingRoutes.get("/messages/conversations/:id/messages", listMessagesController);
