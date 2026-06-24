import { z } from "zod";

export const IngredientSchema = z.object({
  name: z.string().min(1).max(100),
  quantity: z.coerce.number().positive().max(9999),
  unit: z.string().min(1).max(30),
});

export type Ingredient = z.infer<typeof IngredientSchema>;

export const StepSchema = z.object({
  label: z.string().min(1).max(200),
  durationMinutes: z.coerce.number().int().min(1).max(600),
  parallelGroup: z.coerce.string().optional(),
});

export type Step = z.infer<typeof StepSchema>;

export const SeedRecipeSchema = z.object({
  dishId: z.string().uuid(),
  name: z.string().min(1).max(200),
  nameEn: z.string().min(1).max(200),
  cuisine: z.string().min(1).max(100),
  ingredients: z.array(IngredientSchema).min(1).max(30),
  steps: z.array(StepSchema).min(1).max(30),
  totalCookTimeMinutes: z.coerce.number().int().min(1).max(1200),
  caloriesPerServing: z.coerce.number().int().min(1).max(5000),
  tags: z.array(z.string().min(1).max(50)).min(1).max(20),
  imageDescription: z.string().min(1).max(500),
});

export type SeedRecipe = z.infer<typeof SeedRecipeSchema>;

export const SeedRecipeArraySchema = z.array(SeedRecipeSchema).min(20);
