import { asyncHandler, authenticate } from "@hom-nay-an-gi/shared";
import { Router, type Router as RouterType } from "express";
import * as controller from "./discoveryController.js";

const discoveryRouter: RouterType = Router();

discoveryRouter.get("/trending", asyncHandler(controller.handleTrending));
discoveryRouter.get("/nearby", asyncHandler(controller.handleNearby));
discoveryRouter.get(
  "/for-you",
  authenticate,
  asyncHandler(controller.handleForYou),
);

export default discoveryRouter;
