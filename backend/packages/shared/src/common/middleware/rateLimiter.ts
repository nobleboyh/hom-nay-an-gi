import type { NextFunction, Request, Response } from "express";
import { RateLimitError } from "../utils/errors.js";

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

type Cb = (req: Request, _res: Response, next: NextFunction) => void;

function createLimiter(max: number, windowMs: number): Cb {
  const counters = new Map<string, RateLimitEntry>();

  const _cleanup = setInterval(
    () => {
      const now = Date.now();
      for (const [key, entry] of counters) {
        if (now - entry.windowStart > windowMs) {
          counters.delete(key);
        }
      }
    },
    Math.max(windowMs, 60_000),
  ).unref();

  return (req: Request, _res: Response, next: NextFunction): void => {
    const key = req.user?.userId ?? req.ip ?? "unknown";
    const now = Date.now();
    const entry = counters.get(key);

    if (!entry || now - entry.windowStart > windowMs) {
      counters.set(key, { count: 1, windowStart: now });
      next();
      return;
    }

    entry.count++;

    if (entry.count > max) {
      const retryAfterSeconds = Math.ceil(
        (entry.windowStart + windowMs - now) / 1000,
      );
      const error = new RateLimitError(retryAfterSeconds);
      next(error);
      return;
    }

    next();
  };
}

export const generalLimiter = createLimiter(100, 60_000);
export const llmLimiter = createLimiter(30, 3_600_000);
