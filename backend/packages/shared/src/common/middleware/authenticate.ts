import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { env } from "../../config/env.js";
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

function base64urlDecode(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf8");
}

function base64urlEncode(input: string): string {
  return Buffer.from(input).toString("base64url");
}

interface JwtPayload {
  sub: string;
  provider: string;
  exp?: number;
  iat?: number;
}

function signJwt(payload: JwtPayload): string {
  const header = base64urlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64urlEncode(JSON.stringify(payload));
  const signature = createHmac("sha256", env.JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${signature}`;
}

function verifyJwt(token: string): JwtPayload {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new AuthenticationError("Invalid token");
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  let header: { alg: string; typ: string };
  try {
    header = JSON.parse(base64urlDecode(headerB64 as string));
  } catch {
    throw new AuthenticationError("Invalid token");
  }

  if (header.alg !== "HS256" || header.typ !== "JWT") {
    throw new AuthenticationError("Invalid token");
  }

  const expectedSig = createHmac("sha256", env.JWT_SECRET)
    .update(`${headerB64}.${payloadB64}`)
    .digest();

  const actualSig = Buffer.from(
    (signatureB64 as string).replace(/-/g, "+").replace(/_/g, "/"),
    "base64",
  );

  if (
    expectedSig.length !== actualSig.length ||
    !timingSafeEqual(expectedSig, actualSig)
  ) {
    throw new AuthenticationError("Invalid token");
  }

  let payload: JwtPayload;
  try {
    payload = JSON.parse(base64urlDecode(payloadB64 as string)) as JwtPayload;
  } catch {
    throw new AuthenticationError("Invalid token");
  }

  if (payload.exp != null && Date.now() / 1000 > payload.exp) {
    throw new AuthenticationError("Token expired");
  }

  return payload;
}

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
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
    const payload = verifyJwt(token);
    req.user = { userId: payload.sub, authProvider: payload.provider };
    next();
  } catch (error) {
    next(error);
  }
}

export { signJwt };
