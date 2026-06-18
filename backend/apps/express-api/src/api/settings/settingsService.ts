import {
  env,
  logger,
  redis,
  User,
  UserPreference,
} from "@hom-nay-an-gi/shared";
import jwt from "jsonwebtoken";

const DEFAULT_PREFERENCES = {
  dietaryPreferences: [] as string[],
  allergies: [] as string[],
  dislikedIngredients: [] as string[],
  preferredCuisines: [] as string[],
  measurementUnit: "metric" as const,
  theme: "light" as const,
  language: "vi" as const,
  notifications: {
    breakfastReminder: false,
    lunchReminder: false,
    dinnerReminder: false,
    dailySuggestion: false,
  },
};

export async function getPreferences(userId: string) {
  const prefs = await UserPreference.findOne({ userId });
  if (prefs === null) {
    return { ...DEFAULT_PREFERENCES };
  }
  return prefs.toObject();
}

export async function updatePreferences(
  userId: string,
  updates: Record<string, unknown>,
) {
  const existing = await UserPreference.findOne({ userId });

  if (existing === null) {
    const merged = {
      ...DEFAULT_PREFERENCES,
      ...updates,
      userId,
      updatedAt: new Date(),
    };
    if (merged.notifications && typeof merged.notifications === "object") {
      merged.notifications = {
        ...DEFAULT_PREFERENCES.notifications,
        ...(merged.notifications as Record<string, unknown>),
      };
    }
    const doc = await UserPreference.create(merged);
    return doc.toObject();
  }

  const setFields: Record<string, unknown> = { updatedAt: new Date() };
  for (const [key, value] of Object.entries(updates)) {
    if (
      key === "notifications" &&
      typeof value === "object" &&
      value !== null
    ) {
      for (const [nKey, nValue] of Object.entries(
        value as Record<string, unknown>,
      )) {
        setFields[`notifications.${nKey}`] = nValue;
      }
    } else {
      setFields[key] = value;
    }
  }
  const prefs = await UserPreference.findOneAndUpdate(
    { userId },
    { $set: setFields },
    { new: true, runValidators: true },
  );
  if (prefs === null) {
    throw new Error(
      "Failed to update preferences — result was null after upsert",
    );
  }
  return prefs.toObject();
}

export async function deleteAccount(
  userId: string,
  accessToken?: string,
): Promise<void> {
  await User.findOneAndUpdate({ _id: userId }, { deletedAt: new Date() });

  if (accessToken !== undefined && redis.status === "ready") {
    try {
      const decoded = jwt.verify(accessToken, env.JWT_SECRET) as {
        jti?: string;
        exp?: number;
      };
      if (typeof decoded.jti === "string") {
        if (decoded.exp !== undefined && typeof decoded.exp === "number") {
          const ttlSeconds = Math.max(
            1,
            decoded.exp - Math.floor(Date.now() / 1000),
          );
          await redis.set(`blocklist:${decoded.jti}`, "1", "EX", ttlSeconds);
        }

        try {
          const refreshJtis = await redis.smembers(`refresh_tokens:${userId}`);
          if (refreshJtis.length > 0) {
            const pipeline = redis.pipeline();
            for (const jti of refreshJtis) {
              pipeline.del(`refresh_token:${jti}`);
            }
            pipeline.del(`refresh_tokens:${userId}`);
            await pipeline.exec();
          }
        } catch {
          logger.warn(
            "Failed to revoke refresh tokens during account deletion",
          );
        }
      }
    } catch {
      logger.warn("Failed to blocklist access token during account deletion");
    }
  }
}
