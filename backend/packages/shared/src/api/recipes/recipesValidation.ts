import { z } from "zod";

export const IngredientSchema = z.object({
  name: z.string().min(1).max(100),
  quantity: z.coerce.number().int().min(1).max(9999),
  unit: z.string().min(1).max(30),
});

export type Ingredient = z.infer<typeof IngredientSchema>;

export const CookingStepSchema = z.object({
  label: z.string().min(1).max(200),
  durationMinutes: z.coerce.number().int().min(1).max(600),
  parallelGroup: z.string().optional(),
});

export type CookingStep = z.infer<typeof CookingStepSchema>;

export const DishSchema = z.object({
  dishId: z.string().min(1),
  name: z.string().min(1).max(200),
  nameEn: z.string().min(1).max(200),
  cuisine: z.string().min(1).max(100),
  matchPercentage: z.coerce.number().int().min(0).max(100),
  cookTimeMinutes: z.coerce.number().int().min(1).max(1200),
  caloriesPerServing: z.coerce.number().int().min(1).max(5000),
  tags: z.array(z.string().min(1).max(50)).min(1).max(20),
  imageDescription: z.string().min(1).max(500),
  ingredients: z.array(IngredientSchema).min(1).max(30),
  steps: z.array(CookingStepSchema).min(1).max(30),
  totalCookTimeMinutes: z.coerce.number().int().min(1).max(1200),
});

export type Dish = z.infer<typeof DishSchema>;

export const DishArraySchema = z.array(DishSchema).min(0).max(50);

export const LlmDishResponseSchema = z.object({
  dishes: DishArraySchema,
});

export type LlmDishResponse = z.infer<typeof LlmDishResponseSchema>;

export const SearchParamsSchema = z.object({
  ingredients: z.string().optional().default(""),
  tags: z.string().optional().default(""),
  cookTime: z.coerce.number().int().min(0).optional(),
  offset: z.coerce.number().int().min(0).optional().default(0),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

export type SearchParams = z.infer<typeof SearchParamsSchema>;

export const DishIdParamsSchema = z.object({
  dishId: z.string().min(1),
});

export type DishIdParams = z.infer<typeof DishIdParamsSchema>;

export interface SearchResult {
  dishes: Dish[];
  total: number;
  offset: number;
  limit: number;
}

export interface RecipeDetail {
  dish: Dish;
  dishMetadata: {
    dishId: string;
    name: string;
    nameEn: string;
    cuisine: string;
    cookTimeMinutes: number;
    caloriesPerServing: number;
    tags: string[];
    imageDescription: string;
  };
  ingredients: Ingredient[];
  steps: CookingStep[];
  totalCookTimeMinutes: number;
}

export const SurpriseMeSchema = z.object({});

export type SurpriseMeParams = z.infer<typeof SurpriseMeSchema>;

export interface SearchMeta {
  degraded?: boolean;
  source: "llm" | "seed" | "cache";
}
