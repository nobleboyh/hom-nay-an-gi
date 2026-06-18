import { z } from "zod";

const notificationSchema = z.object({
  breakfastReminder: z.boolean().optional(),
  lunchReminder: z.boolean().optional(),
  dinnerReminder: z.boolean().optional(),
  dailySuggestion: z.boolean().optional(),
});

export const updatePreferencesSchema = z.object({
  dietaryPreferences: z.array(z.string()).max(100).optional(),
  allergies: z.array(z.string()).max(100).optional(),
  dislikedIngredients: z.array(z.string()).max(100).optional(),
  preferredCuisines: z.array(z.string()).max(100).optional(),
  measurementUnit: z.enum(["metric", "imperial"]).optional(),
  theme: z.enum(["light", "dark"]).optional(),
  language: z.enum(["vi", "en"]).optional(),
  notifications: notificationSchema.optional(),
});
