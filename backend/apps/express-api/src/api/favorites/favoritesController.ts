import { randomUUID } from "node:crypto";
import {
  asyncHandler,
  ServiceResponse,
  type ValidatedRequest,
} from "@hom-nay-an-gi/shared";
import type { Request, Response } from "express";
import * as favoritesService from "./favoritesService.js";

function getRequestId(req: Request): string {
  const rid = (req as unknown as Record<string, string>).requestId;
  return typeof rid === "string" ? rid : randomUUID();
}

export const list = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { offset, limit } = (
      req as ValidatedRequest<{ offset: number; limit: number }>
    ).validated;
    const userId = (req.user as { userId: string }).userId;

    const result = await favoritesService.list(userId, offset, limit);
    res.status(200).json(ServiceResponse.success(result, getRequestId(req)));
  },
);

export const save = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { dishId, dishData } = (
      req as ValidatedRequest<{
        dishId: string;
        dishData: Record<string, unknown>;
      }>
    ).validated;
    const userId = (req.user as { userId: string }).userId;

    const result = await favoritesService.save(userId, dishId, dishData);
    res.status(201).json(ServiceResponse.success(result, getRequestId(req)));
  },
);

export const remove = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { favoriteId } = (req as ValidatedRequest<{ favoriteId: string }>)
      .validated;
    const userId = (req.user as { userId: string }).userId;

    await favoritesService.remove(userId, favoriteId);
    res.status(204).send();
  },
);
