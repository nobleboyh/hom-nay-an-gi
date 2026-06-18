import { randomUUID } from "node:crypto";
import {
  asyncHandler,
  ServiceResponse,
  type ValidatedRequest,
} from "@hom-nay-an-gi/shared";
import type { Request, Response } from "express";
import * as settingsService from "./settingsService.js";

function getRequestId(req: Request): string {
  const rid = (req as unknown as Record<string, string>).requestId;
  return typeof rid === "string" ? rid : randomUUID();
}

export const getPreferences = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req.user as { userId: string }).userId;
    const result = await settingsService.getPreferences(userId);
    res.status(200).json(ServiceResponse.success(result, getRequestId(req)));
  },
);

export const updatePreferences = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req.user as { userId: string }).userId;
    const updates = (req as ValidatedRequest<Record<string, unknown>>)
      .validated;
    const result = await settingsService.updatePreferences(userId, updates);
    res.status(200).json(ServiceResponse.success(result, getRequestId(req)));
  },
);

export const deleteAccount = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req.user as { userId: string }).userId;
    const authHeader = req.headers.authorization;
    const accessToken =
      typeof authHeader === "string" && authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : undefined;
    await settingsService.deleteAccount(userId, accessToken);
    res.status(204).send();
  },
);
