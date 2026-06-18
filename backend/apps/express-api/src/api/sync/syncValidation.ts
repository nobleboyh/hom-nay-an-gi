import { z } from "zod";

const syncFavoriteSchema = z.object({
  dishId: z.string().min(1),
  dishData: z.object({
    name: z.string(),
    nameEn: z.string().optional(),
    cuisine: z.string().optional(),
    cookTimeMinutes: z.number().optional(),
    caloriesPerServing: z.number().optional(),
    tags: z.array(z.string()).optional(),
    imageDescription: z.string().optional(),
  }),
  savedAt: z.string().datetime().optional(),
});

const syncHistorySchema = z.object({
  ingredients: z.array(z.string()),
  tags: z.array(z.string()).optional(),
  cookTimeMax: z.number().optional(),
  resultCount: z.number().optional(),
  resultDishIds: z.array(z.string()).optional(),
  selectedDishId: z.string().optional(),
  createdAt: z.string().datetime().optional(),
});

const notificationPreferencesSchema = z.object({
  breakfastReminder: z.boolean().optional(),
  lunchReminder: z.boolean().optional(),
  dinnerReminder: z.boolean().optional(),
  dailySuggestion: z.boolean().optional(),
});

const preferencesSchema = z.object({
  dietaryPreferences: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  dislikedIngredients: z.array(z.string()).optional(),
  preferredCuisines: z.array(z.string()).optional(),
  measurementUnit: z.enum(["metric", "imperial"]).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  language: z.enum(["vi", "en"]).optional(),
  notifications: notificationPreferencesSchema.optional(),
});

export const syncPayloadSchema = z.object({
  deviceId: z.string().min(1),
  favorites: z.array(syncFavoriteSchema).optional(),
  history: z.array(syncHistorySchema).optional(),
  preferences: preferencesSchema.optional(),
  lastSyncAt: z.string().datetime().nullable().optional(),
});
