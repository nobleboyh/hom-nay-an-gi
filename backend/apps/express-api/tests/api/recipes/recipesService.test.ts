import type { Dish } from "@hom-nay-an-gi/shared";
import { describe, expect, it } from "vitest";
import { filterDislikedDishes } from "../../../src/api/recipes/recipesService.js";

function makeDish(
  overrides: Partial<{
    dishId: string;
    name: string;
    ingredients: { name: string; quantity: number; unit: string }[];
  }> = {},
): Dish {
  return {
    dishId: "768f269f-e9ba-499a-b26b-acaf74253aca",
    name: "Phở bò",
    nameEn: "Beef Pho",
    cuisine: "Miền Bắc",
    matchPercentage: 80,
    cookTimeMinutes: 75,
    caloriesPerServing: 450,
    tags: ["Việt Nam", "Món nước"],
    imageDescription: "Tô phở bò nóng hổi",
    ingredients: [{ name: "Bánh phở", quantity: 500, unit: "g" }],
    steps: [
      { label: "Nướng hành tây", durationMinutes: 10, parallelGroup: "prep" },
    ],
    totalCookTimeMinutes: 75,
    ...overrides,
  };
}

describe("filterDislikedDishes", () => {
  it("excludes dish whose ingredient name token matches disliked ingredient (AC 2)", () => {
    const dish = makeDish({
      dishId: "dish-1",
      name: "Phở bò",
      ingredients: [{ name: "Bánh phở", quantity: 500, unit: "g" }],
    });
    const result = filterDislikedDishes([dish], ["Bánh phở"]);
    expect(result).toHaveLength(0);
  });

  it("excludes dish when token overlaps with disliked ingredient (AC 2)", () => {
    const dish = makeDish({
      dishId: "dish-1",
      name: "Bún thịt nướng",
      ingredients: [{ name: "Thịt heo", quantity: 200, unit: "g" }],
    });
    const result = filterDislikedDishes([dish], ["thịt heo"]);
    expect(result).toHaveLength(0);
  });

  it("preserves dish with no ingredient overlap", () => {
    const dish = makeDish({
      dishId: "dish-1",
      name: "Rau muống xào",
      ingredients: [{ name: "Rau muống", quantity: 200, unit: "g" }],
    });
    const result = filterDislikedDishes([dish], ["thịt heo"]);
    expect(result).toHaveLength(1);
  });

  it("handles Vietnamese diacritics in disliked ingredients", () => {
    const dish = makeDish({
      dishId: "dish-1",
      ingredients: [{ name: "Thịt bò", quantity: 300, unit: "g" }],
    });
    const result = filterDislikedDishes([dish], ["thịt bó"]);
    expect(result).toHaveLength(0);
  });

  it("returns all dishes for empty disliked list", () => {
    const dishes = [
      makeDish({ dishId: "dish-1" }),
      makeDish({
        dishId: "dish-2",
        name: "Bún chả",
        ingredients: [{ name: "Thịt heo", quantity: 200, unit: "g" }],
      }),
    ];
    const result = filterDislikedDishes(dishes, []);
    expect(result).toHaveLength(2);
  });

  it("returns all dishes when no user (guest behavior, AC 5)", () => {
    const dishes = [
      makeDish({ dishId: "dish-1" }),
      makeDish({ dishId: "dish-2", name: "Chả giò" }),
    ];
    const result = filterDislikedDishes(dishes, []);
    expect(result).toHaveLength(2);
  });

  it("handles multiple disliked ingredients", () => {
    const dish1 = makeDish({
      dishId: "dish-1",
      ingredients: [{ name: "Thịt heo", quantity: 200, unit: "g" }],
    });
    const dish2 = makeDish({
      dishId: "dish-2",
      ingredients: [{ name: "Tôm", quantity: 100, unit: "g" }],
    });
    const dish3 = makeDish({
      dishId: "dish-3",
      ingredients: [{ name: "Rau muống", quantity: 200, unit: "g" }],
    });
    const result = filterDislikedDishes(
      [dish1, dish2, dish3],
      ["thịt heo", "tôm"],
    );
    expect(result).toHaveLength(1);
    expect(result[0].dishId).toBe("dish-3");
  });

  it("filters dish with multiple ingredients when one is disliked", () => {
    const dish = makeDish({
      dishId: "dish-1",
      ingredients: [
        { name: "Bánh phở", quantity: 500, unit: "g" },
        { name: "Thịt bò", quantity: 200, unit: "g" },
        { name: "Hành tây", quantity: 50, unit: "g" },
      ],
    });
    const result = filterDislikedDishes([dish], ["thịt bò"]);
    expect(result).toHaveLength(0);
  });
});
