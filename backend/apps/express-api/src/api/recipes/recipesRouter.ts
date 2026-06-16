import {
  authenticate,
  DishIdParamsSchema,
  llmLimiter,
  SearchParamsSchema,
  SurpriseMeSchema,
} from "@hom-nay-an-gi/shared";
import { Router, type Router as RouterType } from "express";
import {
  getDishById,
  getSurpriseDish,
  searchRecipes,
} from "./recipesController.js";
import { validateParams, validateQuery } from "./validateQuery.js";

export const recipesRouter: RouterType = Router();

recipesRouter.use(authenticate);

recipesRouter.get(
  "/search",
  llmLimiter,
  validateQuery(SearchParamsSchema),
  searchRecipes,
);
recipesRouter.get(
  "/surprise",
  validateQuery(SurpriseMeSchema),
  getSurpriseDish,
);
recipesRouter.get("/:dishId", validateParams(DishIdParamsSchema), getDishById);
