import { z } from "zod";

export const TrendingDishSchema = z.object({
  dishId: z.string(),
  name: z.string(),
  nameEn: z.string().optional(),
  cuisine: z.string(),
  priceRange: z.string().optional(),
  trendingRank: z.number().int().min(1).max(20),
  imageDescription: z.string().optional(),
});

export type TrendingDish = z.infer<typeof TrendingDishSchema>;

export const TrendingResponseSchema = z.object({
  items: z.array(TrendingDishSchema),
  total: z.number().int().min(0),
  offset: z.number().int().min(0),
  limit: z.number().int().min(1).max(50),
});

export const trendingQuerySchema = z.object({
  cuisine: z.string().optional(),
  price: z.string().optional(),
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const nearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().int().min(1).max(50000).default(5000),
  cuisine: z.string().optional(),
  price: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const NearbyResultSchema = z.object({
  restaurantName: z.string(),
  dishName: z.string().optional(),
  distance: z.number().optional(),
  rating: z.number().optional(),
  priceRange: z.string().optional(),
  cuisine: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  externalUrl: z.string().optional(),
});

export type NearbyResult = z.infer<typeof NearbyResultSchema>;

export const ForYouQuerySchema = z.object({
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const LlmTrendingResponseSchema = z.array(TrendingDishSchema);
