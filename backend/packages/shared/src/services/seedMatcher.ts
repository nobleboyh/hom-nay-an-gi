import type { Dish } from "../api/recipes/recipesValidation.js";
import type { SeedRecipe } from "../data/seed-recipes.schema.js";

const VIETNAMESE_DIACRITICS: Record<string, string> = {
  "à": "a", "á": "a", "ả": "a", "ã": "a", "ạ": "a",
  "ă": "a", "ằ": "a", "ắ": "a", "ẳ": "a", "ẵ": "a", "ặ": "a",
  "â": "a", "ầ": "a", "ấ": "a", "ẩ": "a", "ẫ": "a", "ậ": "a",
  "è": "e", "é": "e", "ẻ": "e", "ẽ": "e", "ẹ": "e",
  "ê": "e", "ề": "e", "ế": "e", "ể": "e", "ễ": "e", "ệ": "e",
  "ì": "i", "í": "i", "ỉ": "i", "ĩ": "i", "ị": "i",
  "ò": "o", "ó": "o", "ỏ": "o", "õ": "o", "ọ": "o",
  "ô": "o", "ồ": "o", "ố": "o", "ổ": "o", "ỗ": "o", "ộ": "o",
  "ơ": "o", "ờ": "o", "ớ": "o", "ở": "o", "ỡ": "o", "ợ": "o",
  "ù": "u", "ú": "u", "ủ": "u", "ũ": "u", "ụ": "u",
  "ư": "u", "ừ": "u", "ứ": "u", "ử": "u", "ữ": "u", "ự": "u",
  "ỳ": "y", "ý": "y", "ỷ": "y", "ỹ": "y", "ỵ": "y",
  "đ": "d",
};

function removeVietnameseDiacritics(text: string): string {
  return text.replace(
    /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/g,
    (ch) => VIETNAMESE_DIACRITICS[ch] ?? ch,
  );
}

function normalizeTag(tag: string): string {
  return removeVietnameseDiacritics(tag.toLowerCase().trim());
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[\s,;]+/)
      .filter((t) => t.length > 0),
  );
}

export function jaccardSimilarity(
  userTokens: Set<string>,
  dishTokens: Set<string>,
): number {
  const intersection = new Set<string>();
  for (const token of userTokens) {
    if (dishTokens.has(token)) {
      intersection.add(token);
    }
  }

  const union = new Set([...userTokens, ...dishTokens]);
  if (union.size === 0) return 0;

  return Math.round((intersection.size / union.size) * 100);
}

export function buildIngredientTokens(
  ingredients: { name: string }[],
): Set<string> {
  const tokens = new Set<string>();
  for (const ingredient of ingredients) {
    for (const token of tokenize(ingredient.name)) {
      tokens.add(token);
    }
  }
  return tokens;
}

function recipeToDish(recipe: SeedRecipe, matchPercentage: number): Dish {
  return {
    dishId: recipe.dishId,
    name: recipe.name,
    nameEn: recipe.nameEn,
    cuisine: recipe.cuisine,
    matchPercentage,
    cookTimeMinutes: recipe.totalCookTimeMinutes,
    caloriesPerServing: recipe.caloriesPerServing,
    tags: [...recipe.tags],
    imageDescription: recipe.imageDescription,
    ingredients: recipe.ingredients.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      unit: i.unit,
    })),
    steps: recipe.steps.map((s) => ({
      label: s.label,
      durationMinutes: s.durationMinutes,
      parallelGroup: s.parallelGroup,
    })),
    totalCookTimeMinutes: recipe.totalCookTimeMinutes,
  };
}

export function searchSeedRecipes(
  seedRecipes: SeedRecipe[],
  userIngredients: string[],
  tags?: string[],
  cookTime?: number,
  offset = 0,
  limit = 10,
): { dishes: Dish[]; total: number } {
  const userTokens = new Set<string>();
  for (const ingredient of userIngredients) {
    for (const token of tokenize(ingredient)) {
      userTokens.add(token);
    }
  }

  const scored = seedRecipes
    .map((recipe) => {
      if (cookTime !== undefined && recipe.totalCookTimeMinutes > cookTime) {
        return null;
      }

      if (tags !== undefined && tags.length > 0) {
        const normalizedRecipeTags = recipe.tags.map(normalizeTag);
        const hasMatchingTag = tags.some((tag) =>
          normalizedRecipeTags.includes(normalizeTag(tag)),
        );
        if (!hasMatchingTag) return null;
      }

      const dishTokens = buildIngredientTokens(recipe.ingredients);
      const matchPercentage =
        userTokens.size > 0 ? jaccardSimilarity(userTokens, dishTokens) : 100;

      return { recipe, matchPercentage };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .filter((entry) => entry.matchPercentage > 0)
    .sort((a, b) => b.matchPercentage - a.matchPercentage);

  const total = scored.length;
  const paginated = scored.slice(offset, offset + limit);

  return {
    dishes: paginated.map(({ recipe, matchPercentage }) =>
      recipeToDish(recipe, matchPercentage),
    ),
    total,
  };
}

export function getRandomSeedRecipe(
  seedRecipes: SeedRecipe[],
  excludeIds: string[] = [],
): Dish | null {
  const available = seedRecipes.filter((r) => !excludeIds.includes(r.dishId));
  if (available.length === 0) return null;

  const index = Math.floor(Math.random() * available.length);
  const recipe = available[index];
  if (recipe === undefined) return null;
  return recipeToDish(recipe, 50);
}
