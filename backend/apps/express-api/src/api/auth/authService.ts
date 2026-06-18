import {
  AppError,
  AuthenticationError,
  env,
  generateAccessToken,
  generateRefreshToken,
  logger,
  redis,
  User,
} from "@hom-nay-an-gi/shared";
import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";

const BCRYPT_ROUNDS = 12;

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

interface AuthResult {
  user: {
    id: string;
    email: string;
    displayName: string;
    authProvider: string;
  };
  tokens: { accessToken: string; refreshToken: string };
}

export async function register(
  email: string,
  password: string,
  displayName: string,
): Promise<AuthResult> {
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing !== null) {
    throw new AppError("EMAIL_EXISTS", 409, "Email already registered");
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  let user: typeof User.prototype;
  try {
    user = await User.create({
      email: normalizedEmail,
      passwordHash,
      displayName,
      authProvider: "email",
    });
  } catch (error: unknown) {
    const mongoError = error as { code?: number };
    if (mongoError.code === 11000) {
      throw new AppError("EMAIL_EXISTS", 409, "Email already registered");
    }
    throw error;
  }

  const accessToken = generateAccessToken(user._id.toString(), "email");
  const refreshToken = generateRefreshToken(user._id.toString(), "email");

  await storeRefreshToken(user._id.toString(), refreshToken);

  return {
    user: {
      id: user._id.toString(),
      email: user.email as string,
      displayName: user.displayName,
      authProvider: user.authProvider,
    },
    tokens: { accessToken, refreshToken },
  };
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResult> {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail });
  if (user === null || user.deletedAt !== null) {
    throw new AuthenticationError(
      "AUTH_INVALID_CREDENTIALS",
      401,
      "Email or password is incorrect",
    );
  }

  const passwordHash = user.passwordHash;
  if (passwordHash === null || passwordHash === undefined) {
    throw new AuthenticationError(
      "AUTH_INVALID_CREDENTIALS",
      401,
      "Email or password is incorrect",
    );
  }

  const valid = await bcrypt.compare(password, passwordHash);
  if (!valid) {
    throw new AuthenticationError(
      "AUTH_INVALID_CREDENTIALS",
      401,
      "Email or password is incorrect",
    );
  }

  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = generateAccessToken(user._id.toString(), "email");
  const refreshToken = generateRefreshToken(user._id.toString(), "email");

  await storeRefreshToken(user._id.toString(), refreshToken);

  return {
    user: {
      id: user._id.toString(),
      email: user.email as string,
      displayName: user.displayName,
      authProvider: user.authProvider,
    },
    tokens: { accessToken, refreshToken },
  };
}

export async function googleAuth(idToken: string): Promise<AuthResult> {
  let googleId: string;
  let googleEmail: string | undefined;
  let googleName: string | undefined;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });
    const ticketPayload = ticket.getPayload();
    if (ticketPayload === undefined) {
      throw new AuthenticationError("Invalid Google token");
    }
    googleId = ticketPayload.sub;
    googleEmail = ticketPayload.email;
    googleName = ticketPayload.name;
  } catch {
    throw new AuthenticationError(
      "AUTH_INVALID_CREDENTIALS",
      401,
      "Invalid Google token",
    );
  }

  let user = await User.findOne({ googleId });

  if (user === null) {
    const userData: Record<string, unknown> = {
      googleId,
      displayName: googleName ?? "Google User",
      authProvider: "google",
    };
    if (googleEmail !== undefined) {
      userData.email = googleEmail;
    }
    user = await User.create(userData);
  }

  const accessToken = generateAccessToken(user._id.toString(), "google");
  const refreshToken = generateRefreshToken(user._id.toString(), "google");

  await storeRefreshToken(user._id.toString(), refreshToken);

  return {
    user: {
      id: user._id.toString(),
      email: user.email as string,
      displayName: user.displayName,
      authProvider: user.authProvider,
    },
    tokens: { accessToken, refreshToken },
  };
}

export async function refreshToken(
  refreshTokenStr: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  let payload: { sub: string; jti: string; provider: string };
  try {
    payload = jwt.verify(refreshTokenStr, env.JWT_REFRESH_SECRET) as {
      sub: string;
      jti: string;
      provider: string;
    };
  } catch {
    throw new AuthenticationError(
      "AUTH_INVALID_REFRESH_TOKEN",
      401,
      "Invalid or expired refresh token",
    );
  }

  const user = await User.findById(payload.sub);
  if (user === null || user.deletedAt !== null) {
    throw new AuthenticationError(
      "AUTH_INVALID_REFRESH_TOKEN",
      401,
      "User no longer exists",
    );
  }

  if (redis.status === "ready") {
    const stored = await redis.get(`refresh_token:${payload.jti}`);
    if (stored === null) {
      throw new AuthenticationError(
        "AUTH_INVALID_REFRESH_TOKEN",
        401,
        "Refresh token revoked",
      );
    }

    await redis.del(`refresh_token:${payload.jti}`);
    await redis.srem(`refresh_tokens:${payload.sub}`, payload.jti);
  } else {
    logger.warn("Redis unavailable — skipping refresh token validation");
  }

  const accessToken = generateAccessToken(payload.sub, payload.provider);
  const newRefreshToken = generateRefreshToken(payload.sub, payload.provider);

  await storeRefreshToken(payload.sub, newRefreshToken);

  return { accessToken, refreshToken: newRefreshToken };
}

export async function logout(
  accessToken: string,
  refreshTokenStr?: string,
): Promise<void> {
  const decoded = jwt.decode(accessToken) as {
    sub: string;
    jti: string;
    exp?: number;
  } | null;
  if (decoded === null || typeof decoded.jti !== "string") {
    throw new AuthenticationError("Authentication required");
  }

  if (redis.status === "ready") {
    if (decoded.exp !== undefined && typeof decoded.exp === "number") {
      const ttlSeconds = Math.max(
        1,
        decoded.exp - Math.floor(Date.now() / 1000),
      );
      await redis.set(`blocklist:${decoded.jti}`, "1", "EX", ttlSeconds);
    }

    if (refreshTokenStr !== undefined) {
      const refreshDecoded = jwt.decode(refreshTokenStr) as {
        jti: string;
      } | null;
      if (refreshDecoded !== null && typeof refreshDecoded.jti === "string") {
        await redis.del(`refresh_token:${refreshDecoded.jti}`);
        await redis.srem(`refresh_tokens:${decoded.sub}`, refreshDecoded.jti);
      }
    }
  } else {
    logger.warn("Redis unavailable — skipping token revocation");
  }
}

async function storeRefreshToken(
  userId: string,
  refreshTokenStr: string,
): Promise<void> {
  if (redis.status !== "ready") {
    logger.warn("Redis unavailable — refresh token not stored");
    return;
  }

  const decoded = jwt.decode(refreshTokenStr) as {
    jti: string;
    exp: number;
  } | null;
  if (decoded === null || typeof decoded.jti !== "string") {
    logger.warn("Invalid refresh token — not stored");
    return;
  }

  const ttlSeconds = Math.max(1, decoded.exp - Math.floor(Date.now() / 1000));
  if (!Number.isFinite(ttlSeconds)) {
    logger.warn("Invalid TTL from refresh token — not stored");
    return;
  }

  try {
    await redis.set(`refresh_token:${decoded.jti}`, userId, "EX", ttlSeconds);
    await redis.sadd(`refresh_tokens:${userId}`, decoded.jti);
  } catch (error) {
    logger.error(error, "Failed to store refresh token in Redis");
  }
}
