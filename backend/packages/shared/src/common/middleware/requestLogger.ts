import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger.js";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const requestId = randomUUID();
  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  const start = Date.now();

  res.on("finish", () => {
    const responseTime = Date.now() - start;
    const { method, url } = req;
    const statusCode = res.statusCode;

    const logData = { method, url, statusCode, responseTime, requestId };

    if (statusCode >= 500) {
      logger.error(logData, "request completed");
    } else if (statusCode >= 400) {
      logger.warn(logData, "request completed");
    } else {
      logger.info(logData, "request completed");
    }
  });

  next();
}
