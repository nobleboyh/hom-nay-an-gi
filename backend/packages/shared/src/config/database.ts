import mongoose from "mongoose";
import { logger } from "../common/utils/logger.js";
import { env } from "./env.js";

const MAX_ATTEMPTS = 5;
const RETRY_DELAY_MS = 2_000;

function wait(delayMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

export async function connectDatabase(): Promise<boolean> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      await mongoose.connect(env.MONGO_URI, {
        serverSelectionTimeoutMS: 5_000,
      });
      logger.info({ attempt }, "MongoDB connection established");
      return true;
    } catch (error) {
      logger.warn({ err: error, attempt }, "MongoDB connection attempt failed");
      if (attempt === MAX_ATTEMPTS) {
        logger.error(
          { attempts: MAX_ATTEMPTS },
          "MongoDB connection retries exhausted",
        );
        return false;
      }
      await wait(RETRY_DELAY_MS);
    }
  }

  return false;
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
