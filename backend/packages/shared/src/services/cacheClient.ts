import { createHash } from "node:crypto";
import { logger } from "../common/utils/logger.js";
import { redis } from "../config/redis.js";

const REDIS_TIMEOUT_MS = 5_000;

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error("Redis operation timed out")),
        timeoutMs,
      ),
    ),
  ]);
}

function isRedisReady(): boolean {
  return redis.status === "ready";
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!isRedisReady()) return null;
  try {
    const result = await withTimeout<string | null>(
      redis.get(key),
      REDIS_TIMEOUT_MS,
    );
    if (result === null) return null;
    return JSON.parse(result, (_key, value) => {
      if (_key === "__proto__") return undefined;
      return value;
    }) as T;
  } catch (error) {
    logger.warn({ err: error, key }, "Cache get failed");
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds = 86_400,
): Promise<void> {
  if (!isRedisReady()) return;
  try {
    const serialized = JSON.stringify(value);
    await withTimeout(
      redis.set(key, serialized, "EX", ttlSeconds),
      REDIS_TIMEOUT_MS,
    );
  } catch (error) {
    logger.warn({ err: error, key }, "Cache set failed");
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    logger.warn({ err: error, key }, "Cache del failed");
  }
}

export function recipeSearchKey(hash: string): string {
  return `recipe:search:${hash}`;
}

export function surpriseKey(date: string): string {
  return `surprise:${date}`;
}

export function trendingKey(date: string): string {
  return `trending:${date}`;
}

export function sessionKey(id: string): string {
  return `session:${id}`;
}

export function rateLimitKey(userId: string, endpoint: string): string {
  return `rate:${userId}:${endpoint}`;
}

export function createRecipeSearchHash(
  ingredients: string[],
  tags?: string[],
  cookTime?: number,
): string {
  const sortedIngredients = [...ingredients].sort().join(",");
  const sortedTags = tags ? [...tags].sort().join(",") : "";
  const cookTimeStr = cookTime?.toString() ?? "";
  return createHash("sha256")
    .update(`${sortedIngredients}|${sortedTags}|${cookTimeStr}`)
    .digest("hex");
}
