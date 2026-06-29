import { createHash, randomUUID } from "node:crypto";
import {
  buildIngredientSearchPrompt,
  cacheGet,
  cacheSet,
  computeOverlap,
  type Dish,
  getRandomSeedRecipe,
  LlmDishResponseSchema,
  logger,
  NotFoundError,
  normalizeIngredientName,
  recipeSearchKey,
  searchSeedRecipes,
  tokenize,
  UserPreference,
} from "@hom-nay-an-gi/shared";
import { getSeedRecipeById, getSeedRecipes } from "../../data/seedLoader.js";
import { complete, type LlmErrorMeta } from "../../services/llmClient.js";

const llmDishCache = new Map<string, Dish>();

function cacheLlmDish(dish: Dish): void {
  llmDishCache.set(dish.dishId, dish);
}

const CACHE_VERSION = 8;

function dishContainsDislikedIngredient(
  dish: Dish,
  dislikedIngredients: string[],
): boolean {
  if (dislikedIngredients.length === 0) return false;
  const normalizedDisliked = dislikedIngredients.map((d) =>
    normalizeIngredientName(d),
  );
  for (const ingredient of dish.ingredients) {
    const normalizedName = normalizeIngredientName(ingredient.name);
    const nameTokens = tokenize(normalizedName);
    for (const disliked of normalizedDisliked) {
      const dislikedTokens = tokenize(disliked);
      for (const token of dislikedTokens) {
        if (nameTokens.has(token)) return true;
      }
    }
  }
  return false;
}

export function filterDislikedDishes(
  dishes: Dish[],
  dislikedIngredients: string[],
): Dish[] {
  if (dislikedIngredients.length === 0) return dishes;
  return dishes.filter(
    (dish) => !dishContainsDislikedIngredient(dish, dislikedIngredients),
  );
}

async function loadDislikedIngredients(
  userId: string | undefined,
): Promise<string[]> {
  if (!userId) return [];
  try {
    const prefs = await UserPreference.findOne({ userId });
    if (!prefs) return [];
    return prefs.dislikedIngredients ?? [];
  } catch {
    return [];
  }
}

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
    .update(
      `v${CACHE_VERSION}|${sortedIngredients}|${sortedTags}|${cookTimeStr}`,
    )
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
  error?: string;
}

function normalizeLlmOutput(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const obj = raw as Record<string, unknown>;

  let dishes: unknown[] = [];

  if (Array.isArray(obj.dishes)) {
    dishes = obj.dishes;
  } else if (obj.name) {
    dishes = [obj];
  }

  if (dishes.length === 0) return obj;

  obj.dishes = dishes.map((dish: unknown) => {
    if (!dish || typeof dish !== "object") return dish;
    const d = dish as Record<string, unknown>;

    if (!d.dishId) d.dishId = randomUUID();
    if (d.englishName && !d.nameEn) d.nameEn = d.englishName;
    if (!d.cuisine) d.cuisine = "Việt Nam";
    if (!d.tags || !Array.isArray(d.tags)) d.tags = ["Việt Nam"];
    if (!d.imageDescription) d.imageDescription = d.name ? `Món ${d.name}` : "";
    if (typeof d.cookTimeMinutes !== "number") d.cookTimeMinutes = 30;
    if (typeof d.caloriesPerServing !== "number") d.caloriesPerServing = 300;
    if (typeof d.totalCookTimeMinutes !== "number")
      d.totalCookTimeMinutes = d.cookTimeMinutes ?? 30;

    if (Array.isArray(d.ingredients)) {
      d.ingredients = d.ingredients.map((ing: unknown) =>
        typeof ing === "string"
          ? { name: ing, quantity: 1, unit: "phần" }
          : ing,
      );
    }

    if (Array.isArray(d.steps)) {
      d.steps = d.steps.map((s: unknown) => {
        if (!s || typeof s !== "object") return s;
        const step = s as Record<string, unknown>;
        if (step.step && !step.label) step.label = step.step;
        if (step.time !== undefined && step.durationMinutes === undefined)
          step.durationMinutes = Number(step.time);
        return step;
      });
    }

    return d;
  });

  return obj;
}

export async function searchByIngredients(
  ingredients: string,
  tags: string,
  cookTime: number | undefined,
  offset: number,
  limit: number,
  userId?: string,
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

  const dislikedIngredients = await loadDislikedIngredients(userId);

  if (ingredientList.length === 0) {
    const allResult = searchSeedRecipes(
      getSeedRecipes(),
      [],
      tagListForSeed,
      cookTime,
      0,
      Number.MAX_SAFE_INTEGER,
    );
    allResult.dishes = allResult.dishes.map((d) => ({
      ...d,
      matchPercentage: 0,
    }));
    allResult.dishes = filterDislikedDishes(
      allResult.dishes,
      dislikedIngredients,
    );
    const paginated = paginate(allResult.dishes, offset, limit);
    return {
      dishes: paginated,
      total: allResult.dishes.length,
      offset,
      limit,
      meta: { source: "seed" },
    };
  }

  const hash = createRecipeSearchHash(ingredientList, tagList, cookTime);
  const cacheKey = recipeSearchKey(hash);
  const cached = await cacheGet<{ dishes: Dish[]; total: number }>(cacheKey);
  if (cached !== null) {
    const validDishes = cached.dishes.filter((dish) => {
      const overlap = computeOverlap(ingredientList, dish.ingredients);
      if (overlap.hasOverlap) {
        dish.matchPercentage = overlap.matchPercentage;
      }
      return overlap.hasOverlap;
    });
    if (validDishes.length > 0) {
      const timeFiltered =
        cookTime !== undefined
          ? validDishes.filter((d) => d.totalCookTimeMinutes <= cookTime)
          : validDishes;
      const filtered = filterDislikedDishes(timeFiltered, dislikedIngredients);
      const paginated = paginate(filtered, offset, limit);
      return {
        dishes: paginated,
        total: filtered.length,
        offset,
        limit,
        meta: { source: "cache" },
      };
    }
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
  logger.info(
    { cookTime, promptUser: prompt.user.slice(0, 200) },
    "Sending prompt to LLM",
  );
  const llmResult = await complete(prompt.system, prompt.user, {
    parse: (raw: unknown) => {
      const normalized = normalizeLlmOutput(raw);
      return LlmDishResponseSchema.parse(normalized);
    },
  });
  logger.info(
    {
      cookTime,
      hasData: llmResult.data !== null,
      degraded: llmResult.meta.degraded,
      source: llmResult.meta.source,
    },
    "LLM result received",
  );

  if (llmResult.data !== null && llmResult.data !== undefined) {
    logger.info(
      {
        dishCount: llmResult.data.dishes.length,
        dishNames: llmResult.data.dishes.map((d) => d.name),
      },
      "LLM returned dishes",
    );
    const relevantDishes = llmResult.data.dishes.filter((dish) => {
      const overlap = computeOverlap(ingredientList, dish.ingredients);
      if (overlap.hasOverlap) {
        dish.matchPercentage = overlap.matchPercentage;
      }
      return overlap.hasOverlap;
    });

    if (relevantDishes.length > 0) {
      for (const dish of relevantDishes) {
        cacheLlmDish(dish as Dish);
      }
      await cacheSet(
        cacheKey,
        { dishes: relevantDishes, total: relevantDishes.length },
        86_400,
      );
      const timeFiltered =
        cookTime !== undefined
          ? relevantDishes.filter((d) => d.totalCookTimeMinutes <= cookTime)
          : relevantDishes;
      const filtered = filterDislikedDishes(timeFiltered, dislikedIngredients);
      const paginatedDishes = paginate(filtered, offset, limit);
      return {
        dishes: paginatedDishes,
        total: filtered.length,
        offset,
        limit,
        meta: { degraded: llmResult.meta.degraded, source: "llm" },
      };
    }
  }

  const llmError = (llmResult.meta as LlmErrorMeta).error;
  logger.error(
    { ingredients, llmError, llmDegraded: llmResult.meta.degraded },
    "LLM returned no valid dishes, falling back to seed recipes",
  );

  const allSeedResult = searchSeedRecipes(
    getSeedRecipes(),
    ingredientList,
    tagListForSeed,
    cookTime,
    0,
    Number.MAX_SAFE_INTEGER,
  );
  allSeedResult.dishes = filterDislikedDishes(
    allSeedResult.dishes,
    dislikedIngredients,
  );

  const paginated = paginate(allSeedResult.dishes, offset, limit);
  const meta: SearchMeta = {
    degraded: true,
    source: "seed",
  };
  if (allSeedResult.dishes.length === 0 && ingredientList.length > 0) {
    meta.error = llmError
      ? `LLM không phản hồi (${llmError}). Không tìm thấy món ăn nào trong dữ liệu có sẵn với nguyên liệu: ${ingredientList.join(", ")}`
      : `Không tìm thấy món ăn nào trong dữ liệu có sẵn với nguyên liệu: ${ingredientList.join(", ")}`;
  }
  return {
    dishes: paginated,
    total: allSeedResult.dishes.length,
    offset,
    limit,
    meta,
  };
}

export async function getRecipe(dishId: string): Promise<Dish> {
  const seedRecipe = getSeedRecipeById(dishId);
  if (seedRecipe !== undefined) {
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

  const cachedDish = llmDishCache.get(dishId);
  if (cachedDish !== undefined) {
    return cachedDish;
  }

  throw new NotFoundError("Recipe");
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
