import { describe, expect, it } from "vitest";
import {
  buildIngredientSearchPrompt,
  buildSurprisePrompt,
} from "../../src/services/prompts.js";

describe("prompts", () => {
  describe("buildIngredientSearchPrompt", () => {
    it("returns Vietnamese prompt when language is vi", () => {
      const result = buildIngredientSearchPrompt(
        { ingredients: "thịt gà, hành" },
        "vi",
      );

      expect(result.system).toContain("đầu bếp người Việt Nam");
      expect(result.system).toContain("QUY TẮC");
      expect(result.user).toContain("nguyên liệu: thịt gà, hành");
      expect(result.user).toContain("Ví dụ");
    });

    it("returns English prompt when language is en", () => {
      const result = buildIngredientSearchPrompt(
        { ingredients: "chicken, onion" },
        "en",
      );

      expect(result.system).toContain("Vietnamese chef");
      expect(result.system).toContain("RULES");
      expect(result.user).toContain("ingredients: chicken, onion");
      expect(result.user).toContain("Example");
    });

    it("includes tags when provided", () => {
      const result = buildIngredientSearchPrompt(
        { ingredients: "chicken", tags: "dinner" },
        "en",
      );

      expect(result.user).toContain("Meal type");
      expect(result.user).toContain("dinner");
    });

    it("includes cookTime when provided", () => {
      const result = buildIngredientSearchPrompt(
        { ingredients: "chicken", cookTime: 30 },
        "en",
      );

      expect(result.user).toContain("Max cooking time");
      expect(result.user).toContain("30");
    });

    it("omits cookTime when not provided", () => {
      const result = buildIngredientSearchPrompt(
        { ingredients: "chicken" },
        "en",
      );

      expect(result.user).not.toContain("cooking time");
    });

    it("includes few-shot examples", () => {
      const result = buildIngredientSearchPrompt(
        { ingredients: "chicken" },
        "en",
      );

      expect(result.user).toContain("dishId");
      expect(result.user).toContain("matchPercentage");
    });
  });

  describe("buildSurprisePrompt", () => {
    it("returns Vietnamese prompt when language is vi", () => {
      const result = buildSurprisePrompt("vi");

      expect(result.system).toContain("món ăn Việt Nam ngẫu nhiên");
      expect(result.user).toContain("một món duy nhất");
    });

    it("returns English prompt when language is en", () => {
      const result = buildSurprisePrompt("en");

      expect(result.system).toContain("random Vietnamese dish");
      expect(result.user).toContain("single dish");
    });
  });
});
