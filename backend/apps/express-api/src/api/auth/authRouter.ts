import { authenticate, validate } from "@hom-nay-an-gi/shared";
import { Router, type Router as RouterType } from "express";
import * as authController from "./authController.js";
import {
  googleAuthSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
} from "./authValidation.js";

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const authLimiterCounters = new Map<string, RateLimitEntry>();

const AUTH_LIMIT_MAX = 5;
const AUTH_LIMIT_WINDOW_MS = 60_000;

const cleanup = setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of authLimiterCounters) {
      if (now - entry.windowStart > AUTH_LIMIT_WINDOW_MS) {
        authLimiterCounters.delete(key);
      }
    }
  },
  Math.max(AUTH_LIMIT_WINDOW_MS, 60_000),
);
cleanup.unref();

export function resetAuthLimiter(): void {
  authLimiterCounters.clear();
}

function checkAuthLimiter(ip: string): boolean {
  const now = Date.now();
  const entry = authLimiterCounters.get(ip);

  if (entry === undefined || now - entry.windowStart > AUTH_LIMIT_WINDOW_MS) {
    authLimiterCounters.set(ip, { count: 1, windowStart: now });
    return true;
  }

  entry.count++;
  return entry.count <= AUTH_LIMIT_MAX;
}

export const authRouter: RouterType = Router();

authRouter.post("/register", validate(registerSchema), authController.register);
authRouter.post(
  "/login",
  (req, res, next) => {
    const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
    if (!checkAuthLimiter(ip)) {
      res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many login attempts. Please try again later.",
        },
      });
      return;
    }
    next();
  },
  validate(loginSchema),
  authController.login,
);
authRouter.post(
  "/google",
  validate(googleAuthSchema),
  authController.googleAuth,
);
authRouter.post("/refresh", validate(refreshSchema), authController.refresh);
authRouter.post("/logout", authenticate, authController.logout);
