import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { ServiceResponse } from "../models/serviceResponse.js";
import { AppError, RateLimitError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

export function notFoundHandler(request: Request, response: Response): void {
  response
    .status(404)
    .json(
      ServiceResponse.failure(
        "NOT_FOUND",
        "Route not found",
        request.requestId ?? randomUUID(),
      ),
    );
}

export function errorHandler(
  error: Error,
  req: Request,
  response: Response,
  _next: NextFunction,
): void {
  const requestId = req.requestId ?? randomUUID();
  const isProd = process.env.NODE_ENV === "production";

  if (error instanceof AppError) {
    logger.warn({ err: error, requestId }, "Application error");

    if (error instanceof RateLimitError) {
      response.set("Retry-After", String(error.retryAfterSeconds));
    }

    const details =
      "details" in error
        ? (error as { details?: { field?: string; issue: string }[] }).details
        : undefined;

    response
      .status(error.statusCode)
      .json(
        ServiceResponse.failure(
          error.code,
          error.userMessage,
          requestId,
          details,
        ),
      );
    return;
  }

  logger.error({ err: error, requestId }, "Unhandled application error");
  response
    .status(500)
    .json(
      ServiceResponse.failure(
        "INTERNAL_ERROR",
        isProd ? "Internal server error" : error.message,
        requestId,
      ),
    );
}
