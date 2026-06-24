import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  logger,
  type SeedRecipe,
  SeedRecipeArraySchema,
} from "@hom-nay-an-gi/shared";

let seedRecipes: SeedRecipe[] = [];
let seedRecipeMap: Map<string, SeedRecipe> = new Map();
let loaded = false;

function resolveSeedFilePath(): string {
  const sourcePath = join(
    import.meta.dirname,
    "..",
    "..",
    "..",
    "..",
    "src",
    "data",
    "seed-recipes.json",
  );
  const compiledPath = join(
    import.meta.dirname,
    "..",
    "..",
    "..",
    "..",
    "..",
    "src",
    "data",
    "seed-recipes.json",
  );
  const candidates = [
    // Source runtime: backend/apps/express-api/src/data -> backend/src/data
    sourcePath,
    // Compiled runtime: /app/apps/express-api/dist/src/data -> /app/src/data
    compiledPath,
  ];

  const found = candidates.find((candidate) => existsSync(candidate));
  return found ?? sourcePath;
}

export function loadSeedRecipes(): void {
  try {
    const raw = JSON.parse(
      readFileSync(resolveSeedFilePath(), "utf8"),
    ) as unknown[];
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
