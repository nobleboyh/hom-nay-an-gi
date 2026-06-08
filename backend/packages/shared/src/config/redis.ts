import { Redis } from "ioredis";
import { logger } from "../common/utils/logger.js";
import { env } from "./env.js";

export const redis = new Redis(env.REDIS_URI, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  retryStrategy: (attempt) => {
    if (attempt > 5) {
      return null;
    }

    return Math.min(attempt * 200, 2_000);
  },
});

redis.on("connect", () => {
  logger.info("Redis connection established");
});

redis.on("ready", () => {
  logger.info("Redis client ready");
});

redis.on("error", (error) => {
  logger.warn({ err: error }, "Redis client error");
});

redis.on("close", () => {
  logger.warn("Redis connection closed");
});

export async function connectRedis(): Promise<boolean> {
  try {
    await redis.connect();
    return true;
  } catch (error) {
    logger.error({ err: error }, "Redis connection failed");
    return false;
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redis.status === "wait") {
    redis.disconnect();
    return;
  }

  if (redis.status !== "end") {
    await redis.quit();
  }
}
