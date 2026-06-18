import { authenticate, validate } from "@hom-nay-an-gi/shared";
import { Router, type Router as RouterType } from "express";
import * as favoritesController from "./favoritesController.js";
import {
  deleteFavoriteParamsSchema,
  listFavoritesQuerySchema,
  saveFavoriteBodySchema,
} from "./favoritesValidation.js";
import { validateParams, validateQuery } from "./validateQuery.js";

export const favoritesRouter: RouterType = Router();

favoritesRouter.use(authenticate);

favoritesRouter.get(
  "/",
  validateQuery(listFavoritesQuerySchema),
  favoritesController.list,
);

favoritesRouter.post(
  "/",
  validate(saveFavoriteBodySchema),
  favoritesController.save,
);

favoritesRouter.delete(
  "/:favoriteId",
  validateParams(deleteFavoriteParamsSchema),
  favoritesController.remove,
);
