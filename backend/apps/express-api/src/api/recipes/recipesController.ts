import { randomUUID } from "node:crypto";
import {
  asyncHandler,
  env,
  ServiceResponse,
  type ValidatedRequest,
} from "@hom-nay-an-gi/shared";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import {
  getRecipe,
  searchByIngredients,
  surpriseMe,
} from "./recipesService.js";

function getRequestId(req: Request): string {
  const rid = (req as unknown as Record<string, unknown>).requestId;
  return typeof rid === "string" ? rid : randomUUID();
}

function resolveOptionalUserId(req: Request): string | undefined {
  const isStubMode = env.JWT_SECRET === "replace-with-a-long-secret";
  if (isStubMode) {
    return req.headers["x-user-id"] as string | undefined;
  }
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return undefined;
  try {
    const payload = jwt.verify(authHeader.slice(7), env.JWT_SECRET) as {
      sub: string;
    };
    return payload.sub;
  } catch {
    return undefined;
  }
}

export const searchRecipes = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const validated = (
      req as ValidatedRequest<{
        ingredients?: string;
        tags?: string;
        cookTime?: number;
        offset: number;
        limit: number;
      }>
    ).validated;

    const userId = resolveOptionalUserId(req);

    const result = await searchByIngredients(
      validated.ingredients ?? "",
      validated.tags ?? "",
      validated.cookTime,
      validated.offset,
      validated.limit,
      userId,
    );

    const meta: Record<string, unknown> = {
      requestId: getRequestId(req),
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    };

    if (result.meta.degraded) {
      meta.degraded = true;
    }

    res.status(200).json({
      success: true,
      data: {
        dishes: result.dishes,
        total: result.total,
        offset: result.offset,
        limit: result.limit,
      },
      meta,
    });
  },
);

export const getSurpriseDish = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const dish = surpriseMe();
    res.status(200).json(ServiceResponse.success(dish, getRequestId(req)));
  },
);

export const getDishById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const dishId = req.params.dishId as string;
    const dish = getRecipe(dishId);
    res.status(200).json(ServiceResponse.success(dish, getRequestId(req)));
  },
);
