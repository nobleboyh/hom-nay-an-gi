import {
  AppError,
  buildErrorResponse,
  buildSuccessResponse,
} from "@hom-nay-an-gi/shared";
import type { NextFunction, Request, Response } from "express";
import * as discoveryService from "./discoveryService.js";
import {
  ForYouQuerySchema,
  nearbyQuerySchema,
  trendingQuerySchema,
} from "./discoveryValidation.js";

export async function handleTrending(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const parsed = trendingQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    response
      .status(400)
      .json(
        buildErrorResponse(
          "VALIDATION_ERROR",
          parsed.error.issues
            .map((e: { message: string }) => e.message)
            .join("; "),
        ),
      );
    return;
  }

  try {
    const result = await discoveryService.getTrending(
      parsed.data.cuisine,
      parsed.data.price,
      parsed.data.offset,
      parsed.data.limit,
    );
    response.status(200).json(buildSuccessResponse(result));
  } catch (error) {
    if (error instanceof AppError) {
      response
        .status(error.statusCode)
        .json(buildErrorResponse(error.code, error.userMessage));
      return;
    }
    next(error);
  }
}

export async function handleNearby(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const parsed = nearbyQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    response
      .status(400)
      .json(
        buildErrorResponse(
          "VALIDATION_ERROR",
          parsed.error.issues
            .map((e: { message: string }) => e.message)
            .join("; "),
        ),
      );
    return;
  }

  try {
    const results = await discoveryService.getNearby(
      parsed.data.lat,
      parsed.data.lng,
      parsed.data.radius,
      parsed.data.cuisine,
      parsed.data.price,
      parsed.data.limit,
    );
    response.status(200).json(buildSuccessResponse(results));
  } catch (error) {
    if (error instanceof AppError) {
      response
        .status(error.statusCode)
        .json(buildErrorResponse(error.code, error.userMessage));
      return;
    }
    next(error);
  }
}

export async function handleForYou(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const parsed = ForYouQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    response
      .status(400)
      .json(
        buildErrorResponse(
          "VALIDATION_ERROR",
          parsed.error.issues
            .map((e: { message: string }) => e.message)
            .join("; "),
        ),
      );
    return;
  }

  try {
    const userId = request.user?.userId;
    const result = await discoveryService.getForYou(
      userId,
      parsed.data.offset,
      parsed.data.limit,
    );
    response.status(200).json(buildSuccessResponse(result));
  } catch (error) {
    if (error instanceof AppError) {
      response
        .status(error.statusCode)
        .json(buildErrorResponse(error.code, error.userMessage));
      return;
    }
    next(error);
  }
}
