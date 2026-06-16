import { createHash } from "node:crypto";
import {
  buildIngredientSearchPrompt,
  cacheGet,
  cacheSet,
  type Dish,
  getRandomSeedRecipe,
  LlmDishResponseSchema,
  NotFoundError,
  recipeSearchKey,
  searchSeedRecipes,
} from "@hom-nay-an-gi/shared";
import { getSeedRecipeById, getSeedRecipes } from "../../data/seedLoader.js";
import { complete } from "../../services/llmClient.js";

let lastSurpriseDishId: string | null = null;

function createRecipeSearchHash(
  ingredients: string[],
  tags?: string[],
  cookTime?: number,
): string {
  const sortedIngredients = [...ingredients].sort().join(",");
  const sortedTags = tags ? [...tags].sort().join(",") : "";
  const cookTimeStr = cookTime?.toString() ?? "";
  return createHash("sha256")
    .update(`${sortedIngredients}|${sortedTags}|${cookTimeStr}`)
    .digest("hex");
}

function paginate<T>(items: T[], offset: number, limit: number): T[] {
  return items.slice(offset, offset + limit);
}

export interface SearchResultData {
  dishes: Dish[];
  total: number;
  offset: number;
  limit: number;
}

export interface SearchMeta {
  degraded?: boolean;
  source: "cache" | "llm" | "seed";
}

export async function searchByIngredients(
  ingredients: string,
  tags: string,
  cookTime: number | undefined,
  offset: number,
  limit: number,
): Promise<SearchResultData & { meta: SearchMeta }> {
  const ingredientList = ingredients
    ? ingredients
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const tagList = tags
    ? tags
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined;
  const tagListForSeed = tagList && tagList.length > 0 ? tagList : undefined;

  if (ingredientList.length === 0) {
    const result = searchSeedRecipes(
      getSeedRecipes(),
      [],
      tagListForSeed,
      cookTime,
      offset,
      limit,
    );
    result.dishes = result.dishes.map((d) => ({ ...d, matchPercentage: 0 }));
    return { ...result, offset, limit, meta: { source: "seed" } };
  }

  const hash = createRecipeSearchHash(ingredientList, tagList, cookTime);
  const cacheKey = recipeSearchKey(hash);
  const cached = await cacheGet<{ dishes: Dish[]; total: number }>(cacheKey);
  if (cached !== null) {
    const paginated = paginate(cached.dishes, offset, limit);
    return {
      dishes: paginated,
      total: cached.total,
      offset,
      limit,
      meta: { source: "cache" },
    };
  }

  const promptInput: { ingredients: string; tags?: string; cookTime?: number } =
    {
      ingredients,
      tags,
    };
  if (cookTime !== undefined) {
    promptInput.cookTime = cookTime;
  }
  const prompt = buildIngredientSearchPrompt(promptInput, "vi");
  const llmResult = await complete(
    prompt.system,
    prompt.user,
    LlmDishResponseSchema,
  );

  if (llmResult.data !== null && llmResult.data !== undefined) {
    const allDishes = llmResult.data.dishes;
    const total = allDishes.length;
    await cacheSet(cacheKey, { dishes: allDishes, total }, 86_400);
    const paginatedDishes = paginate(allDishes, offset, limit);
    return {
      dishes: paginatedDishes,
      total,
      offset,
      limit,
      meta: { degraded: llmResult.meta.degraded, source: "llm" },
    };
  }

  const seedResult = searchSeedRecipes(
    getSeedRecipes(),
    ingredientList,
    tagListForSeed,
    cookTime,
    offset,
    limit,
  );
  return {
    ...seedResult,
    offset,
    limit,
    meta: { degraded: true, source: "seed" },
  };
}

export function getRecipe(dishId: string): Dish {
  const seedRecipe = getSeedRecipeById(dishId);
  if (seedRecipe === undefined) {
    throw new NotFoundError("Recipe");
  }
  return {
    dishId: seedRecipe.dishId,
    name: seedRecipe.name,
    nameEn: seedRecipe.nameEn,
    cuisine: seedRecipe.cuisine,
    matchPercentage: 100,
    cookTimeMinutes: seedRecipe.totalCookTimeMinutes,
    caloriesPerServing: seedRecipe.caloriesPerServing,
    tags: [...seedRecipe.tags],
    imageDescription: seedRecipe.imageDescription,
    ingredients: seedRecipe.ingredients.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      unit: i.unit,
    })),
    steps: seedRecipe.steps.map((s) => ({
      label: s.label,
      durationMinutes: s.durationMinutes,
      parallelGroup: s.parallelGroup,
    })),
    totalCookTimeMinutes: seedRecipe.totalCookTimeMinutes,
  };
}

export function surpriseMe(): Dish {
  const recipes = getSeedRecipes();
  if (recipes.length === 0) {
    throw new NotFoundError("Recipe");
  }

  const excludeIds = lastSurpriseDishId !== null ? [lastSurpriseDishId] : [];
  let dish = getRandomSeedRecipe(recipes, excludeIds);

  if (dish === null) {
    dish = getRandomSeedRecipe(recipes);
    if (dish === null) {
      throw new NotFoundError("Recipe");
    }
  }

  lastSurpriseDishId = dish.dishId;
  return dish;
}

export function resetSurpriseState(): void {
  lastSurpriseDishId = null;
}
