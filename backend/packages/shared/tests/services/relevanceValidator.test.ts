import { describe, expect, it } from "vitest";
import {
  buildDishIngredientTokens,
  computeOverlap,
  normalizeIngredientName,
  tokenize,
} from "../../src/services/relevanceValidator.js";

describe("relevanceValidator", () => {
  describe("normalizeIngredientName", () => {
    it("removes Vietnamese diacritics", () => {
      expect(normalizeIngredientName("thịt bò")).toBe("thit bo");
    });

    it("lowercases input", () => {
      expect(normalizeIngredientName("Thịt Gà")).toBe("thit ga");
    });

    it("trims whitespace", () => {
      expect(normalizeIngredientName("  bông cải  ")).toBe("bong cai");
    });

    it("handles đ character", () => {
      expect(normalizeIngredientName("đậu phụ")).toBe("dau phu");
    });
  });

  describe("tokenize", () => {
    it("splits on whitespace", () => {
      const result = tokenize("thit bo bong cai");
      expect([...result]).toEqual(["thit", "bo", "bong", "cai"]);
    });

    it("splits on commas", () => {
      const result = tokenize("thit,bo,ca");
      expect([...result]).toEqual(["thit", "bo", "ca"]);
    });

    it("filters empty tokens", () => {
      const result = tokenize("thit  bo  ");
      expect([...result]).toEqual(["thit", "bo"]);
    });
  });

  describe("buildDishIngredientTokens", () => {
    it("tokenizes dish ingredient names with diacritics removal", () => {
      const tokens = buildDishIngredientTokens([
        { name: "Thịt bò" },
        { name: "Bánh phở" },
      ]);
      expect(tokens.has("thit")).toBe(true);
      expect(tokens.has("bo")).toBe(true);
      expect(tokens.has("banh")).toBe(true);
      expect(tokens.has("pho")).toBe(true);
    });

    it("returns empty set for empty ingredients", () => {
      const tokens = buildDishIngredientTokens([]);
      expect(tokens.size).toBe(0);
    });
  });

  describe("computeOverlap", () => {
    it("returns hasOverlap=true and matchPercentage for matching ingredients", () => {
      const result = computeOverlap(
        ["thịt bò", "bánh phở"],
        [{ name: "Thịt bò" }, { name: "Bánh phở" }],
      );
      expect(result.hasOverlap).toBe(true);
      expect(result.matchPercentage).toBeGreaterThan(0);
    });

    it("returns hasOverlap=false for disjoint ingredients", () => {
      const result = computeOverlap(
        ["thịt gà", "bông cải"],
        [{ name: "Cá lóc" }, { name: "Me" }],
      );
      expect(result.hasOverlap).toBe(false);
      expect(result.matchPercentage).toBe(0);
    });

    it("handles partial overlap correctly", () => {
      const result = computeOverlap(
        ["thịt bò", "bánh phở", "hành lá"],
        [{ name: "Thịt bò" }, { name: "Bánh phở" }, { name: "Rau thơm" }],
      );
      expect(result.hasOverlap).toBe(true);
      expect(result.matchPercentage).toBeGreaterThan(0);
    });

    it("returns hasOverlap=true with 100% when no user ingredients", () => {
      const result = computeOverlap([], [{ name: "Thịt bò" }]);
      expect(result.hasOverlap).toBe(true);
      expect(result.matchPercentage).toBe(100);
    });

    it("matches across Vietnamese diacritics variants", () => {
      const result = computeOverlap(["thịt bó"], [{ name: "Thịt bò" }]);
      expect(result.hasOverlap).toBe(true);
      expect(result.matchPercentage).toBeGreaterThan(0);
    });

    it("matches partial word overlap (ingredient-name containment)", () => {
      const result = computeOverlap(
        ["gà", "bông cải"],
        [{ name: "Thịt gà" }, { name: "Bông cải" }],
      );
      expect(result.hasOverlap).toBe(true);
    });

    it("rejects dish sharing only a generic token like 'thịt' (regression: ingredient-name containment)", () => {
      const result = computeOverlap(
        ["thịt gà", "bông cải"],
        [{ name: "Thịt bò" }, { name: "Khoai tây" }],
      );
      expect(result.hasOverlap).toBe(false);
      expect(result.matchPercentage).toBe(0);
    });

    it("rejects dish with no actually overlapping ingredient (bug: bánh mì vs thịt bò, cá)", () => {
      const result = computeOverlap(
        ["thịt bò", "cá"],
        [
          { name: "Bánh mì" },
          { name: "Thịt nguội" },
          { name: "Chả lụa" },
          { name: "Pate gan" },
          { name: "Dưa leo" },
          { name: "Cà rốt" },
          { name: "Củ cải trắng" },
          { name: "Rau mùi" },
          { name: "Ớt tươi" },
          { name: "Nước tương" },
        ],
      );
      expect(result.hasOverlap).toBe(false);
      expect(result.matchPercentage).toBe(0);
    });

    it("rejects dish that only matches on a word-substring like 'cà' vs 'cá', 'cà rốt' (regression: requires full word)", () => {
      const result = computeOverlap(["cá"], [{ name: "Cà rốt" }]);
      expect(result.hasOverlap).toBe(false);
    });

    it("matches with diacritics-compatible single word (gà vs Thịt gà)", () => {
      const result = computeOverlap(["gà"], [{ name: "Thịt gà" }]);
      expect(result.hasOverlap).toBe(true);
    });
  });
});
