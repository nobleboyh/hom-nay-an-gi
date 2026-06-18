import { z } from "zod";

export const listFavoritesQuerySchema = z.object({
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const saveFavoriteBodySchema = z.object({
  dishId: z.string().min(1),
  dishData: z.object({
    name: z.string(),
    nameEn: z.string().optional(),
    cuisine: z.string(),
    cookTimeMinutes: z.number(),
    caloriesPerServing: z.number().optional(),
    tags: z.array(z.string()).optional(),
    imageDescription: z.string().optional(),
  }),
});

export const deleteFavoriteParamsSchema = z.object({
  favoriteId: z
    .string()
    .min(1)
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format"),
});
