import { describe, expect, it } from "vitest";
import type { SeedRecipe } from "../../src/data/seed-recipes.schema.js";
import {
  buildIngredientTokens,
  jaccardSimilarity,
  searchSeedRecipes,
} from "../../src/services/seedMatcher.js";

const mockRecipes: SeedRecipe[] = [
  {
    dishId: "550e8400-e29b-41d4-a716-446655440001",
    name: "Phở Bò",
    nameEn: "Beef Pho",
    cuisine: "Miền Bắc",
    ingredients: [
      { name: "bánh phở", quantity: 200, unit: "g" },
      { name: "thịt bò", quantity: 150, unit: "g" },
      { name: "hành lá", quantity: 10, unit: "g" },
      { name: "rau thơm", quantity: 20, unit: "g" },
    ],
    steps: [
      { label: "Nấu nước dùng", durationMinutes: 60 },
      { label: "Trụng bánh phở", durationMinutes: 5 },
      { label: "Thái thịt bò", durationMinutes: 5 },
    ],
    totalCookTimeMinutes: 70,
    caloriesPerServing: 450,
    tags: ["súp", "món chính", "bò"],
    imageDescription: "Bát phở bò với nước dùng trong",
  },
  {
    dishId: "550e8400-e29b-41d4-a716-446655440002",
    name: "Cơm Tấm",
    nameEn: "Broken Rice",
    cuisine: "Miền Nam",
    ingredients: [
      { name: "gạo tấm", quantity: 200, unit: "g" },
      { name: "sườn heo", quantity: 100, unit: "g" },
      { name: "trứng", quantity: 1, unit: "quả" },
    ],
    steps: [
      { label: "Nấu cơm", durationMinutes: 20 },
      { label: "Nướng sườn", durationMinutes: 15 },
    ],
    totalCookTimeMinutes: 35,
    caloriesPerServing: 600,
    tags: ["món chính", "heo", "cơm"],
    imageDescription: "Đĩa cơm tấm sườn trứng",
  },
  {
    dishId: "550e8400-e29b-41d4-a716-446655440003",
    name: "Canh Chua Cá",
    nameEn: "Sour Fish Soup",
    cuisine: "Miền Nam",
    ingredients: [
      { name: "cá lóc", quantity: 200, unit: "g" },
      { name: "me", quantity: 30, unit: "g" },
      { name: "cà chua", quantity: 2, unit: "trái" },
      { name: "rau thơm", quantity: 10, unit: "g" },
    ],
    steps: [
      { label: "Sơ chế cá", durationMinutes: 10 },
      { label: "Nấu canh", durationMinutes: 20 },
    ],
    totalCookTimeMinutes: 30,
    caloriesPerServing: 300,
    tags: ["canh", "cá", "món chính"],
    imageDescription: "Tô canh chua cá lóc",
  },
];

describe("seedMatcher", () => {
  describe("jaccardSimilarity", () => {
    it("returns 100 for identical sets", () => {
      const tokens = new Set(["a", "b", "c"]);
      expect(jaccardSimilarity(tokens, tokens)).toBe(100);
    });

    it("returns 0 for disjoint sets", () => {
      const a = new Set(["a", "b"]);
      const b = new Set(["c", "d"]);
      expect(jaccardSimilarity(a, b)).toBe(0);
    });

    it("returns correct percentage for partial overlap", () => {
      const a = new Set(["a", "b", "c"]);
      const b = new Set(["b", "c", "d"]);
      // intersection = {b, c} = 2, union = {a, b, c, d} = 4
      // 2/4 = 50
      expect(jaccardSimilarity(a, b)).toBe(50);
    });

    it("returns 0 when both sets are empty", () => {
      expect(jaccardSimilarity(new Set(), new Set())).toBe(0);
    });

    it("rounds to integer", () => {
      const a = new Set(["a", "b", "c"]);
      const b = new Set(["b", "d", "e", "f"]);
      // intersection = {b} = 1, union = {a, b, c, d, e, f} = 6
      // 1/6 = 16.666... → 17
      expect(jaccardSimilarity(a, b)).toBe(17);
    });
  });

  describe("buildIngredientTokens", () => {
    it("tokenizes ingredient names", () => {
      const tokens = buildIngredientTokens([
        { name: "thịt bò" },
        { name: "hành lá" },
      ]);
      expect(tokens.has("thịt")).toBe(true);
      expect(tokens.has("bò")).toBe(true);
      expect(tokens.has("hành")).toBe(true);
      expect(tokens.has("lá")).toBe(true);
    });

    it("lowercases tokens", () => {
      const tokens = buildIngredientTokens([{ name: "Thịt Bò" }]);
      expect(tokens.has("thịt")).toBe(true);
      expect(tokens.has("bò")).toBe(true);
    });

    it("handles empty ingredient list", () => {
      const tokens = buildIngredientTokens([]);
      expect(tokens.size).toBe(0);
    });
  });

  describe("searchSeedRecipes", () => {
    it("returns scored results sorted by match", () => {
      const result = searchSeedRecipes(mockRecipes, [
        "thịt bò",
        "bánh phở",
        "rau thơm",
      ]);

      expect(result.total).toBeGreaterThan(0);
      expect(result.dishes.length).toBeGreaterThan(0);

      // First result should be the best match
      expect(result.dishes[0]?.name).toBe("Phở Bò");
    });

    it("filters by cookTime", () => {
      const result = searchSeedRecipes(mockRecipes, ["thịt bò"], undefined, 40);

      // Phở Bò has 70 min cook time, should be excluded
      const pho = result.dishes.find((d) => d.name === "Phở Bò");
      expect(pho).toBeUndefined();
    });

    it("filters by tags", () => {
      const result = searchSeedRecipes(mockRecipes, ["thịt bò"], ["canh"]);

      expect(result.dishes.every((d) => d.tags.includes("canh"))).toBe(true);
    });

    it("returns empty array when no match", () => {
      const result = searchSeedRecipes(mockRecipes, ["mì ý", "phô mai"]);

      expect(result.dishes).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it("returns 100 for all when no user ingredients provided", () => {
      const result = searchSeedRecipes(mockRecipes, []);

      expect(result.dishes.length).toBe(mockRecipes.length);
      for (const dish of result.dishes) {
        expect(dish.matchPercentage).toBe(100);
      }
    });

    it("respects pagination", () => {
      const result = searchSeedRecipes(
        mockRecipes,
        ["thịt bò"],
        undefined,
        undefined,
        0,
        1,
      );

      expect(result.dishes).toHaveLength(1);
      expect(result.total).toBeGreaterThan(0);
    });
  });
});
