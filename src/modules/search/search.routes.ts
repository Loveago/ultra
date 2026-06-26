import { Router } from "express";
import { authenticate } from "../../common/middleware/authenticate";
import {
  filtersController,
  globalSearchController,
  productSearchController,
  recommendationsController,
  storeSearchController,
  trendingController,
} from "./search.controller";

export const searchRoutes = Router();

searchRoutes.use(authenticate);

searchRoutes.get("/search", globalSearchController);
searchRoutes.get("/search/products", productSearchController);
searchRoutes.get("/search/stores", storeSearchController);
searchRoutes.get("/search/trending", trendingController);
searchRoutes.get("/search/recommendations", recommendationsController);
searchRoutes.get("/search/filters", filtersController);
