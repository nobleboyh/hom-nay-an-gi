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
  UserPreference,
} from "@hom-nay-an-gi/shared";
import { getSeedRecipeById, getSeedRecipes } from "../../data/seedLoader.js";
import { complete } from "../../services/llmClient.js";

const VIETNAMESE_DIACRITICS: Record<string, string> = {
  à: "a",
  á: "a",
  ả: "a",
  ã: "a",
  ạ: "a",
  ă: "a",
  ằ: "a",
  ắ: "a",
  ẳ: "a",
  ẵ: "a",
  ặ: "a",
  â: "a",
  ầ: "a",
  ấ: "a",
  ẩ: "a",
  ẫ: "a",
  ậ: "a",
  è: "e",
  é: "e",
  ẻ: "e",
  ẽ: "e",
  ẹ: "e",
  ê: "e",
  ề: "e",
  ế: "e",
  ể: "e",
  ễ: "e",
  ệ: "e",
  ì: "i",
  í: "i",
  ỉ: "i",
  ĩ: "i",
  ị: "i",
  ò: "o",
  ó: "o",
  ỏ: "o",
  õ: "o",
  ọ: "o",
  ô: "o",
  ồ: "o",
  ố: "o",
  ổ: "o",
  ỗ: "o",
  ộ: "o",
  ơ: "o",
  ờ: "o",
  ớ: "o",
  ở: "o",
  ỡ: "o",
  ợ: "o",
  ù: "u",
  ú: "u",
  ủ: "u",
  ũ: "u",
  ụ: "u",
  ư: "u",
  ừ: "u",
  ứ: "u",
  ử: "u",
  ữ: "u",
  ự: "u",
  ỳ: "y",
  ý: "y",
  ỷ: "y",
  ỹ: "y",
  ỵ: "y",
  đ: "d",
};

function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(
      /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/g,
      (ch) => VIETNAMESE_DIACRITICS[ch] ?? ch,
    );
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[\s,;]+/)
      .filter((t) => t.length > 0),
  );
}

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
    const filtered = filterDislikedDishes(cached.dishes, dislikedIngredients);
    const paginated = paginate(filtered, offset, limit);
    return {
      dishes: paginated,
      total: filtered.length,
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
    await cacheSet(
      cacheKey,
      { dishes: allDishes, total: allDishes.length },
      86_400,
    );
    const filtered = filterDislikedDishes(allDishes, dislikedIngredients);
    const paginatedDishes = paginate(filtered, offset, limit);
    return {
      dishes: paginatedDishes,
      total: filtered.length,
      offset,
      limit,
      meta: { degraded: llmResult.meta.degraded, source: "llm" },
    };
  }

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
  return {
    dishes: paginated,
    total: allSeedResult.dishes.length,
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
