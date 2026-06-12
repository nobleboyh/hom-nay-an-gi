import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  logger,
  type SeedRecipe,
  SeedRecipeArraySchema,
} from "@hom-nay-an-gi/shared";

let seedRecipes: SeedRecipe[] = [];
let seedRecipeMap: Map<string, SeedRecipe> = new Map();
let loaded = false;

const SEED_FILE_PATH = join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
  "src",
  "data",
  "seed-recipes.json",
);

export function loadSeedRecipes(): void {
  try {
    const raw = JSON.parse(readFileSync(SEED_FILE_PATH, "utf8")) as unknown[];
    seedRecipes = SeedRecipeArraySchema.parse(raw);
    seedRecipeMap = new Map(seedRecipes.map((r) => [r.dishId, r]));
    loaded = true;
  } catch (error) {
    logger.warn({ err: error }, "Failed to load seed recipes");
    loaded = false;
    seedRecipes = [];
    seedRecipeMap = new Map();
  }
}

export function getSeedRecipes(): SeedRecipe[] {
  return loaded ? seedRecipes : [];
}

export function getSeedRecipeById(dishId: string): SeedRecipe | undefined {
  return loaded ? seedRecipeMap.get(dishId) : undefined;
}

export function isSeedDataLoaded(): boolean {
  return loaded;
}
