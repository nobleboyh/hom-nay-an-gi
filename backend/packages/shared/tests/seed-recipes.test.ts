import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  SeedRecipeArraySchema,
  SeedRecipeSchema,
} from "../src/data/seed-recipes.schema.js";

const seedRecipesPath = join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "src",
  "data",
  "seed-recipes.json",
);
const seedRecipes = JSON.parse(
  readFileSync(seedRecipesPath, "utf8"),
) as unknown[];

describe("seed-recipes dataset", () => {
  it("validates the full dataset shape", () => {
    const result = SeedRecipeArraySchema.safeParse(seedRecipes);
    expect(result.success).toBe(true);
  });

  it("contains at least 20 recipes", () => {
    expect(seedRecipes.length).toBeGreaterThanOrEqual(20);
  });

  it("every recipe validates individually against SeedRecipeSchema", () => {
    for (const recipe of seedRecipes) {
      const result = SeedRecipeSchema.safeParse(recipe);
      expect(result.success).toBe(true);
    }
  });

  it("cook times span the UI filter ranges", () => {
    const parsed = SeedRecipeArraySchema.parse(seedRecipes);
    const hasQuick = parsed.some((r) => r.totalCookTimeMinutes <= 15);
    const hasMedium = parsed.some(
      (r) => r.totalCookTimeMinutes > 15 && r.totalCookTimeMinutes <= 30,
    );
    const hasLong = parsed.some(
      (r) => r.totalCookTimeMinutes > 30 && r.totalCookTimeMinutes <= 60,
    );
    const hasVeryLong = parsed.some((r) => r.totalCookTimeMinutes > 60);

    expect(hasQuick).toBe(true);
    expect(hasMedium).toBe(true);
    expect(hasLong).toBe(true);
    expect(hasVeryLong).toBe(true);
  });
});
