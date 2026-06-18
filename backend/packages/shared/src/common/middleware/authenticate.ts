import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../../config/env.js";
import { redis } from "../../config/redis.js";
import { AuthenticationError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; authProvider: string };
    }
  }
}

const STUB_SECRET = "replace-with-a-long-secret";
const isStubMode = env.JWT_SECRET === STUB_SECRET;

let stubWarningLogged = false;

export function generateJti(): string {
  return randomUUID();
}

interface TokenPayload {
  sub: string;
  provider: string;
  jti: string;
}

export function generateAccessToken(userId: string, provider: string): string {
  const payload: TokenPayload = {
    sub: userId,
    provider,
    jti: generateJti(),
  };
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRY as unknown as number,
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function generateRefreshToken(userId: string, provider: string): string {
  const payload: TokenPayload = {
    sub: userId,
    provider,
    jti: generateJti(),
  };
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRY as unknown as number,
  };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
}

export function signJwt(payload: {
  sub: string;
  provider: string;
  exp?: number;
  iat?: number;
}): string {
  const { exp, ...rest } = payload;
  const tokenPayload = { ...rest, jti: generateJti() };
  const options: SignOptions | undefined = exp
    ? { expiresIn: Math.max(0, exp - Math.floor(Date.now() / 1000)) }
    : undefined;
  return jwt.sign(tokenPayload, env.JWT_SECRET, options);
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  if (isStubMode) {
    if (!stubWarningLogged) {
      logger.warn("authenticate middleware running in stub mode");
      stubWarningLogged = true;
    }
    const userId = req.headers["x-user-id"] as string | undefined;
    if (!userId) {
      next(new AuthenticationError("Authentication required"));
      return;
    }
    req.user = { userId, authProvider: "stub" };
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    next(new AuthenticationError("Authentication required"));
    return;
  }

  const token = authHeader.slice(7);
  if (token.length === 0) {
    next(new AuthenticationError("Authentication required"));
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;

    if (redis.status === "ready") {
      try {
        const blocked = await redis.get(`blocklist:${payload.jti}`);
        if (blocked !== null) {
          next(
            new AuthenticationError("AUTH_TOKEN_REVOKED", 401, "Token revoked"),
          );
          return;
        }
      } catch {
        logger.warn("Redis blocklist check failed — proceeding without it");
      }
    } else {
      logger.warn("Redis unavailable — skipping blocklist check");
    }

    req.user = { userId: payload.sub, authProvider: payload.provider };
    next();
  } catch (error) {
    const jwtError = error as { name?: string; message?: string };
    if (jwtError.name === "TokenExpiredError") {
      next(new AuthenticationError("AUTH_TOKEN_EXPIRED", 401, "Token expired"));
    } else if (jwtError.name === "JsonWebTokenError") {
      next(new AuthenticationError("Authentication required"));
    } else if (jwtError.name === "NotBeforeError") {
      next(
        new AuthenticationError(
          "AUTH_TOKEN_NOT_YET_VALID",
          401,
          "Token not yet valid",
        ),
      );
    } else {
      next(error);
    }
  }
}
