import { Router } from "express";
import { authenticate } from "../../common/middleware/authenticate";
import { authorize } from "../../common/middleware/authorize";
import { validateBody } from "../../common/middleware/validate";
import {
  createReviewController,
  deleteReviewController,
  getReviewController,
  listReviewsController,
  markHelpfulController,
  moderateReviewController,
  replyReviewController,
  reviewSummaryController,
  updateReviewController,
} from "./review.controller";
import {
  createReviewSchema,
  moderateReviewSchema,
  replyReviewSchema,
  updateReviewSchema,
} from "./review.schema";

export const reviewRoutes = Router();

reviewRoutes.use(authenticate);

// Public (authenticated) routes
reviewRoutes.get("/reviews", listReviewsController);
reviewRoutes.get("/reviews/summary/:targetType/:targetId", reviewSummaryController);
reviewRoutes.get("/reviews/:id", getReviewController);
reviewRoutes.post("/reviews", validateBody(createReviewSchema), createReviewController);
reviewRoutes.put("/reviews/:id", validateBody(updateReviewSchema), updateReviewController);
reviewRoutes.delete("/reviews/:id", deleteReviewController);
reviewRoutes.put("/reviews/:id/helpful", markHelpfulController);
reviewRoutes.put("/reviews/:id/reply", validateBody(replyReviewSchema), replyReviewController);

// Admin moderation
reviewRoutes.put("/reviews/:id/moderate", authorize(["ADMIN", "SUPER_ADMIN"]), validateBody(moderateReviewSchema), moderateReviewController);
