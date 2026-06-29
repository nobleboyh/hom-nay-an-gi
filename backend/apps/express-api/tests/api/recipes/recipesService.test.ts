import type { Dish } from "@hom-nay-an-gi/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockComplete, mockGetSeedRecipes, mockCacheGet, mockCacheSet } =
  vi.hoisted(() => ({
    mockComplete: vi.fn(),
    mockGetSeedRecipes: vi.fn(),
    mockCacheGet: vi.fn(),
    mockCacheSet: vi.fn(),
  }));

vi.mock("../../../src/services/llmClient.js", () => ({
  complete: mockComplete,
}));

vi.mock("../../../src/data/seedLoader.js", () => ({
  getSeedRecipes: mockGetSeedRecipes,
  getSeedRecipeById: vi.fn(),
  loadSeedRecipes: vi.fn(),
  isSeedDataLoaded: vi.fn(() => true),
}));

vi.mock("@hom-nay-an-gi/shared", async () => {
  const actual = await vi.importActual<Record<string, unknown>>(
    "@hom-nay-an-gi/shared",
  );
  return {
    ...actual,
    cacheGet: mockCacheGet,
    cacheSet: mockCacheSet,
  };
});

import {
  filterDislikedDishes,
  searchByIngredients,
} from "../../../src/api/recipes/recipesService.js";

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

function makeSeedRecipe(
  overrides: Partial<{
    dishId: string;
    name: string;
    nameEn: string;
    cuisine: string;
    matchPercentage: number;
    cookTimeMinutes: number;
    caloriesPerServing: number;
    tags: string[];
    imageDescription: string;
    ingredients: { name: string; quantity: number; unit: string }[];
  }> = {},
) {
  return {
    dishId: "550e8400-e29b-41d4-a716-446655440001",
    name: "Phở Bò",
    nameEn: "Beef Pho",
    cuisine: "Miền Bắc",
    totalCookTimeMinutes: 70,
    caloriesPerServing: 450,
    tags: ["súp", "món chính", "bò"],
    imageDescription: "Bát phở bò",
    ingredients: [
      { name: "Bánh phở", quantity: 200, unit: "g" },
      { name: "Thịt bò", quantity: 150, unit: "g" },
    ],
    steps: [{ label: "Nấu nước dùng", durationMinutes: 60 }],
    ...overrides,
  };
}

function makeRelevantDish(
  overrides: Partial<{
    dishId: string;
    name: string;
    ingredients: { name: string; quantity: number; unit: string }[];
  }> = {},
) {
  return {
    dishId: "llm-dish-1",
    name: "Phở bò",
    nameEn: "Beef Pho",
    cuisine: "Miền Bắc",
    matchPercentage: 90,
    cookTimeMinutes: 75,
    caloriesPerServing: 450,
    tags: ["Việt Nam", "Món nước"],
    imageDescription: "Tô phở bò",
    ingredients: [
      { name: "Bánh phở", quantity: 500, unit: "g" },
      { name: "Thịt bò", quantity: 200, unit: "g" },
    ],
    steps: [{ label: "Nấu nước dùng", durationMinutes: 60 }],
    totalCookTimeMinutes: 75,
    ...overrides,
  };
}

function makeIrrelevantDish(
  overrides: Partial<{
    dishId: string;
    name: string;
    ingredients: { name: string; quantity: number; unit: string }[];
  }> = {},
) {
  return {
    dishId: "llm-dish-2",
    name: "Cá kho tộ",
    nameEn: "Braised Fish",
    cuisine: "Miền Nam",
    matchPercentage: 85,
    cookTimeMinutes: 45,
    caloriesPerServing: 380,
    tags: ["Việt Nam", "Món kho"],
    imageDescription: "Nồi cá kho",
    ingredients: [
      { name: "Cá lóc", quantity: 300, unit: "g" },
      { name: "Nước mắm", quantity: 30, unit: "ml" },
    ],
    steps: [{ label: "Kho cá", durationMinutes: 40 }],
    totalCookTimeMinutes: 45,
    ...overrides,
  };
}

describe("searchByIngredients (relevance guardrails)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSeedRecipes.mockReturnValue([makeSeedRecipe()]);
    mockCacheGet.mockResolvedValue(null);
  });

  it("filters out zero-overlap LLM dishes and falls back to seed (AC 2, AC 3)", async () => {
    mockComplete.mockResolvedValue({
      data: { dishes: [makeIrrelevantDish()] },
      meta: { degraded: false },
    });

    const result = await searchByIngredients("thịt bò", "", undefined, 0, 10);

    expect(result.meta.source).toBe("seed");
    expect(result.meta.degraded).toBe(true);
  }, 15000);

  it("keeps only relevant dishes from mixed LLM payload (AC 2)", async () => {
    mockComplete.mockResolvedValue({
      data: {
        dishes: [
          makeRelevantDish({
            dishId: "rel-1",
            ingredients: [{ name: "Thịt bò", quantity: 200, unit: "g" }],
          }),
          makeIrrelevantDish({ dishId: "irr-1" }),
          makeRelevantDish({
            dishId: "rel-2",
            ingredients: [{ name: "Bánh phở", quantity: 500, unit: "g" }],
          }),
        ],
      },
      meta: { degraded: false },
    });

    const result = await searchByIngredients(
      "thịt bò, bánh phở",
      "",
      undefined,
      0,
      10,
    );

    const dishIds = result.dishes.map((d) => d.dishId);
    expect(dishIds).not.toContain("irr-1");
    expect(dishIds).toContain("rel-1");
    expect(dishIds).toContain("rel-2");
  }, 15000);

  it("recalculates matchPercentage based on actual ingredient overlap (AC 5)", async () => {
    mockComplete.mockResolvedValue({
      data: {
        dishes: [
          makeRelevantDish({
            dishId: "rel-1",
            matchPercentage: 95,
            ingredients: [{ name: "Thịt bò", quantity: 200, unit: "g" }],
          }),
        ],
      },
      meta: { degraded: false },
    });

    const result = await searchByIngredients(
      "thịt bò, bánh phở, hành lá",
      "",
      undefined,
      0,
      10,
    );

    expect(result.dishes[0]?.matchPercentage).not.toBe(95);
    expect(result.dishes[0]?.matchPercentage).toBeGreaterThan(0);
  }, 15000);

  it("keeps only relevant dishes removes irrelevant from LLM payload (AC 2)", async () => {
    mockComplete.mockResolvedValue({
      data: {
        dishes: [
          makeRelevantDish({
            dishId: "rel-1",
            ingredients: [{ name: "Thịt bò", quantity: 200, unit: "g" }],
          }),
          makeIrrelevantDish({ dishId: "irr-1" }),
        ],
      },
      meta: { degraded: false },
    });

    const result = await searchByIngredients("thịt bò", "", undefined, 0, 10);

    expect(result.dishes).toHaveLength(1);
    expect(result.dishes[0]?.dishId).toBe("rel-1");
  }, 15000);

  it("re-validates cached dishes on read and filters stale irrelevant data (cache path)", async () => {
    const staleIrrelevant = makeIrrelevantDish({ dishId: "stale-irrelevant" });
    const relevant = makeRelevantDish({
      dishId: "rel-1",
      ingredients: [{ name: "Thịt bò", quantity: 200, unit: "g" }],
    });

    mockCacheGet.mockResolvedValue({
      dishes: [staleIrrelevant, relevant],
      total: 2,
    });

    const result = await searchByIngredients("thịt bò", "", undefined, 0, 10);

    expect(result.meta.source).toBe("cache");
    expect(result.dishes).toHaveLength(1);
    expect(result.dishes[0]?.dishId).toBe("rel-1");
    expect(mockComplete).not.toHaveBeenCalled();
  }, 15000);

  it("bypasses cache and falls through to LLM when all cached dishes are stale and filtered out", async () => {
    const staleIrrelevant1 = makeIrrelevantDish({ dishId: "stale-1" });
    const staleIrrelevant2 = makeIrrelevantDish({ dishId: "stale-2" });

    mockCacheGet.mockResolvedValue({
      dishes: [staleIrrelevant1, staleIrrelevant2],
      total: 2,
    });

    mockComplete.mockResolvedValue({
      data: {
        dishes: [
          makeRelevantDish({
            dishId: "rel-1",
            ingredients: [{ name: "Thịt bò", quantity: 200, unit: "g" }],
          }),
        ],
      },
      meta: { degraded: false },
    });

    const result = await searchByIngredients("thịt bò", "", undefined, 0, 10);

    expect(result.meta.source).toBe("llm");
    expect(result.dishes).toHaveLength(1);
    expect(result.dishes[0]?.dishId).toBe("rel-1");
  }, 15000);
});
