import {
  AppError,
  Favorite,
  type IFavorite,
  SearchHistory,
  type ISearchHistory,
  UserPreference,
  type IUserPreference,
} from "@hom-nay-an-gi/shared";

interface SyncFavoriteInput {
  dishId: string;
  dishData: Record<string, unknown>;
  savedAt?: string;
}

interface SyncHistoryInput {
  ingredients: string[];
  tags?: string[];
  cookTimeMax?: number;
  resultCount?: number;
  resultDishIds?: string[];
  selectedDishId?: string;
  createdAt?: string;
}

interface SyncPreferencesInput {
  dietaryPreferences?: string[];
  allergies?: string[];
  dislikedIngredients?: string[];
  preferredCuisines?: string[];
  measurementUnit?: "metric" | "imperial";
  theme?: "light" | "dark" | "system";
  language?: "vi" | "en";
  notifications?: {
    breakfastReminder?: boolean;
    lunchReminder?: boolean;
    dinnerReminder?: boolean;
    dailySuggestion?: boolean;
  };
}

interface FirstTimeResult {
  favorites: IFavorite[];
  history: ISearchHistory[];
  preferences: IUserPreference | null;
  syncTimestamp: string;
}

interface DeltaResult {
  favorites: IFavorite[];
  history: ISearchHistory[];
  preferences: IUserPreference | null;
  syncTimestamp: string;
}

export async function mergeGuestData(
  userId: string,
  payload: {
    deviceId: string;
    favorites?: SyncFavoriteInput[];
    history?: SyncHistoryInput[];
    preferences?: SyncPreferencesInput;
  },
): Promise<FirstTimeResult> {
  const [mergedFavorites, mergedHistory, mergedPreferences] =
    await Promise.all([
      mergeFavorites(userId, payload.favorites ?? []),
      mergeHistory(userId, payload.deviceId, payload.history ?? []),
      mergePreferences(userId, payload.preferences),
    ]);

  return {
    favorites: mergedFavorites,
    history: mergedHistory,
    preferences: mergedPreferences,
    syncTimestamp: new Date().toISOString(),
  };
}

export async function deltaSync(
  userId: string,
  lastSyncAt: Date,
): Promise<DeltaResult> {
  const [favorites, history, preferences] = await Promise.all([
    Favorite.find({ userId, updatedAt: { $gt: lastSyncAt } })
      .sort({ updatedAt: -1 })
      .lean() as Promise<IFavorite[]>,
    SearchHistory.find({ userId, createdAt: { $gt: lastSyncAt } })
      .sort({ createdAt: -1 })
      .lean() as Promise<ISearchHistory[]>,
    UserPreference.findOne({ userId, updatedAt: { $gt: lastSyncAt } }).lean() as Promise<IUserPreference | null>,
  ]);

  return {
    favorites,
    history,
    preferences,
    syncTimestamp: new Date().toISOString(),
  };
}

async function mergeFavorites(
  userId: string,
  guestFavorites: SyncFavoriteInput[],
): Promise<IFavorite[]> {
  if (guestFavorites.length === 0) return [];

  const cloudFavorites = await Favorite.find({ userId }).lean();
  const cloudMap = new Map(
    cloudFavorites.map((f) => [f.dishId, f]),
  );

  const results: IFavorite[] = [];
  const writes: Array<Promise<IFavorite>> = [];

  for (const gf of guestFavorites) {
    const existing = cloudMap.get(gf.dishId);
    if (existing === undefined) {
      writes.push(
        Favorite.findOneAndUpdate(
          { userId, dishId: gf.dishId },
          {
            $setOnInsert: {
              dishData: gf.dishData,
              savedAt: gf.savedAt ? new Date(gf.savedAt) : new Date(),
            },
          },
          { upsert: true, new: true },
        ).then((d) => d!.toObject() as IFavorite),
      );
    } else {
      const guestTimestamp = gf.savedAt
        ? new Date(gf.savedAt).getTime()
        : 0;
      const serverTimestamp = existing.updatedAt
        ? new Date(existing.updatedAt).getTime()
        : 0;

      if (guestTimestamp > serverTimestamp) {
        writes.push(
          Favorite.findOneAndUpdate(
            { userId, dishId: gf.dishId },
            {
              $set: {
                dishData: gf.dishData,
                savedAt: gf.savedAt
                  ? new Date(gf.savedAt)
                  : new Date(),
                updatedAt: new Date(),
              },
            },
            { new: true },
          ).then((d) => {
            if (d === null) {
              throw new AppError(
                "FAVORITE_NOT_FOUND",
                404,
                "Favorite was removed during sync",
              );
            }
            return d.toObject() as IFavorite;
          }),
        );
      } else {
        results.push(existing as unknown as IFavorite);
      }
    }
  }

  const created = await Promise.all(writes);
  return [...created, ...results];
}

async function mergeHistory(
  userId: string,
  deviceId: string,
  guestHistory: SyncHistoryInput[],
): Promise<ISearchHistory[]> {
  const existing = await SearchHistory.find({ userId })
    .sort({ createdAt: -1 })
    .lean();
  const existingKeys = new Set(
    existing.map((h) => JSON.stringify(h.ingredients)),
  );

  const newEntries = guestHistory.filter(
    (h) => !existingKeys.has(JSON.stringify(h.ingredients)),
  );

  if (newEntries.length === 0) return existing as unknown as ISearchHistory[];

  const created = await SearchHistory.insertMany(
    newEntries.map((h) => ({
      userId,
      guestDeviceId: deviceId,
      ingredients: h.ingredients,
      tags: h.tags ?? [],
      cookTimeMax: h.cookTimeMax,
      resultCount: h.resultCount,
      resultDishIds: h.resultDishIds ?? [],
      selectedDishId: h.selectedDishId,
      createdAt: h.createdAt ? new Date(h.createdAt) : new Date(),
    })),
  );

  return [...created, ...existing] as unknown as ISearchHistory[];
}

async function mergePreferences(
  userId: string,
  guestPreferences?: SyncPreferencesInput,
): Promise<IUserPreference | null> {
  if (guestPreferences === undefined) return null;

  const existing = await UserPreference.findOne({ userId });
  if (existing !== null) return existing.toObject() as IUserPreference;

  const created = await UserPreference.create({
    userId,
    dietaryPreferences: guestPreferences.dietaryPreferences ?? [],
    allergies: guestPreferences.allergies ?? [],
    dislikedIngredients: guestPreferences.dislikedIngredients ?? [],
    preferredCuisines: guestPreferences.preferredCuisines ?? [],
    measurementUnit: guestPreferences.measurementUnit ?? "metric",
    theme: guestPreferences.theme ?? "light",
    language: guestPreferences.language ?? "vi",
    notifications: {
      breakfastReminder:
        guestPreferences.notifications?.breakfastReminder ?? false,
      lunchReminder: guestPreferences.notifications?.lunchReminder ?? false,
      dinnerReminder: guestPreferences.notifications?.dinnerReminder ?? false,
      dailySuggestion:
        guestPreferences.notifications?.dailySuggestion ?? false,
    },
  });

  return created.toObject() as IUserPreference;
}
