import { randomUUID } from "node:crypto";
import {
  AppError,
  asyncHandler,
  ServiceResponse,
  type ValidatedRequest,
} from "@hom-nay-an-gi/shared";
import type { Request, Response } from "express";
import * as syncService from "./syncService.js";

const MAX_PAYLOAD_BYTES = 5 * 1024 * 1024;

function getRequestId(req: Request): string {
  const rid = (req as unknown as Record<string, string>).requestId;
  return typeof rid === "string" ? rid : randomUUID();
}

interface SyncValidated {
  deviceId: string;
  favorites?: unknown[];
  history?: unknown[];
  preferences?: Record<string, unknown>;
  lastSyncAt?: string | null;
}

export const sync = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const rawLength = Buffer.byteLength(JSON.stringify(req.body), "utf8");
    if (rawLength > MAX_PAYLOAD_BYTES) {
      throw new AppError(
        "PAYLOAD_TOO_LARGE",
        413,
        "Sync payload exceeds 5MB limit",
      );
    }

    const validated = (
      req as ValidatedRequest<SyncValidated>
    ).validated;
    const userId = (req.user as { userId: string }).userId;

    let result;

    if (validated.lastSyncAt === null || validated.lastSyncAt === undefined) {
      result = await syncService.mergeGuestData(userId, {
        deviceId: validated.deviceId,
        favorites: validated.favorites as SyncValidated["favorites"],
        history: validated.history as SyncValidated["history"],
        preferences:
          validated.preferences as SyncValidated["preferences"],
      });
    } else {
      const lastSyncAt = new Date(validated.lastSyncAt);
      result = await syncService.deltaSync(userId, lastSyncAt);
    }

    res.status(200).json(ServiceResponse.success(result, getRequestId(req)));
  },
);
