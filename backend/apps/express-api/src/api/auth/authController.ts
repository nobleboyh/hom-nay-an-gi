import { randomUUID } from "node:crypto";
import {
  asyncHandler,
  ServiceResponse,
  type ValidatedRequest,
} from "@hom-nay-an-gi/shared";
import type { Request, Response } from "express";
import * as authService from "./authService.js";

function getRequestId(req: Request): string {
  const rid = (req as unknown as Record<string, string>).requestId;
  return typeof rid === "string" ? rid : randomUUID();
}

export const register = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { email, password, displayName } = (
      req as ValidatedRequest<{
        email: string;
        password: string;
        displayName: string;
      }>
    ).validated;

    const result = await authService.register(email, password, displayName);
    res.status(201).json(ServiceResponse.success(result, getRequestId(req)));
  },
);

export const login = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { email, password } = (
      req as ValidatedRequest<{ email: string; password: string }>
    ).validated;

    const result = await authService.login(email, password);
    res.status(200).json(ServiceResponse.success(result, getRequestId(req)));
  },
);

export const googleAuth = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { idToken } = (req as ValidatedRequest<{ idToken: string }>)
      .validated;

    const result = await authService.googleAuth(idToken);
    res.status(200).json(ServiceResponse.success(result, getRequestId(req)));
  },
);

export const refresh = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = (req as ValidatedRequest<{ refreshToken: string }>)
      .validated;

    const result = await authService.refreshToken(refreshToken);
    res.status(200).json(ServiceResponse.success(result, getRequestId(req)));
  },
);

export const logout = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : "";

    const { refreshToken: refreshTokenStr } =
      (req as ValidatedRequest<{ refreshToken?: string }>).validated ?? {};

    await authService.logout(accessToken, refreshTokenStr);
    res
      .status(200)
      .json(
        ServiceResponse.success({ message: "Logged out" }, getRequestId(req)),
      );
  },
);
