import { errorHandler } from "@hom-nay-an-gi/shared";
import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { recipesRouter } from "../../../src/api/recipes/recipesRouter.js";

function makeDish(
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
    steps: { label: string; durationMinutes: number; parallelGroup?: string }[];
    totalCookTimeMinutes: number;
  }> = {},
) {
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

const mockSearchResult = {
  dishes: [makeDish()],
  total: 1,
  offset: 0,
  limit: 10,
  meta: { degraded: false, source: "cache" as const },
};

const mockRecipeDetail = {
  dishId: "768f269f-e9ba-499a-b26b-acaf74253aca",
  name: "Phở bò",
  nameEn: "Beef Pho",
  cuisine: "Miền Bắc",
  matchPercentage: 100,
  cookTimeMinutes: 75,
  caloriesPerServing: 450,
  tags: ["Việt Nam", "Món nước", "Đậm đà"],
  imageDescription: "Tô phở bò nóng hổi",
  ingredients: [
    { name: "Bánh phở", quantity: 500, unit: "g" },
    { name: "Thịt bò thăn", quantity: 300, unit: "g" },
  ],
  steps: [
    { label: "Nướng hành tây", durationMinutes: 10, parallelGroup: "prep" },
    { label: "Ninh xương bò", durationMinutes: 60 },
  ],
  totalCookTimeMinutes: 75,
};

const mockSurpriseDish = {
  dishId: "71f05f5d-9435-4ae8-a498-5b0ee42f8342",
  name: "Bún chả Hà Nội",
  nameEn: "Hanoi Grilled Pork with Vermicelli",
  cuisine: "Miền Bắc",
  matchPercentage: 50,
  cookTimeMinutes: 48,
  caloriesPerServing: 520,
  tags: ["Việt Nam", "Món nướng"],
  imageDescription: "Đĩa bún chả thơm lừng",
  ingredients: [
    { name: "Thịt ba chỉ", quantity: 300, unit: "g" },
    { name: "Bún", quantity: 500, unit: "g" },
  ],
  steps: [
    { label: "Ướp thịt", durationMinutes: 20, parallelGroup: "marinate" },
    { label: "Nướng thịt", durationMinutes: 15, parallelGroup: "grill" },
  ],
  totalCookTimeMinutes: 48,
};

vi.mock("../../../src/api/recipes/recipesService.js", () => ({
  searchByIngredients: vi.fn(),
  getRecipe: vi.fn(),
  surpriseMe: vi.fn(),
  resetSurpriseState: vi.fn(),
}));

const { searchByIngredients, getRecipe, surpriseMe } = await import(
  "../../../src/api/recipes/recipesService.js"
);

function createApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.use("/api/v1/recipes", recipesRouter);
  app.use(errorHandler);
  return app;
}

describe("GET /api/v1/recipes/search", () => {
  it("returns 200 with dishes array for valid search params", async () => {
    vi.mocked(searchByIngredients).mockResolvedValueOnce(mockSearchResult);

    const app = createApp();
    const res = await request(app)
      .get("/api/v1/recipes/search")
      .query({
        ingredients: "chicken,broccoli",
        tags: "Vietnamese",
        cookTime: 30,
        offset: 0,
        limit: 10,
      })
      .set("x-user-id", "test-user");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.dishes).toHaveLength(1);
    expect(res.body.data.dishes[0].dishId).toBe(
      "768f269f-e9ba-499a-b26b-acaf74253aca",
    );
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.offset).toBe(0);
    expect(res.body.data.limit).toBe(10);
    expect(searchByIngredients).toHaveBeenCalledWith(
      "chicken,broccoli",
      "Vietnamese",
      30,
      0,
      10,
      "test-user",
    );
  });

  it("allows guest search without authentication", async () => {
    vi.mocked(searchByIngredients).mockResolvedValueOnce(mockSearchResult);

    const app = createApp();
    const res = await request(app).get("/api/v1/recipes/search").query({
      tags: "salty,Việt Nam,Miền Bắc",
      cookTime: 30,
      offset: 0,
      limit: 20,
    });

    expect(res.status).toBe(200);
    expect(searchByIngredients).toHaveBeenCalledWith(
      "",
      "salty,Việt Nam,Miền Bắc",
      30,
      0,
      20,
      undefined,
    );
  });

  it("uses defaults when no params provided", async () => {
    vi.mocked(searchByIngredients).mockResolvedValueOnce(mockSearchResult);

    const app = createApp();
    const res = await request(app)
      .get("/api/v1/recipes/search")
      .set("x-user-id", "test-user");

    expect(res.status).toBe(200);
    expect(res.body.data.offset).toBe(0);
    expect(res.body.data.limit).toBe(10);
  });

  it("returns 400 for invalid params", async () => {
    const app = createApp();
    const res = await request(app)
      .get("/api/v1/recipes/search")
      .query({ limit: 999 })
      .set("x-user-id", "test-user");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("search with empty ingredients returns all dishes", async () => {
    const emptyResult = makeDish({ matchPercentage: 0 });
    const resultWithEmptyIngredients = {
      ...mockSearchResult,
      dishes: [emptyResult],
    };
    vi.mocked(searchByIngredients).mockResolvedValueOnce(
      resultWithEmptyIngredients,
    );

    const app = createApp();
    const res = await request(app)
      .get("/api/v1/recipes/search")
      .query({ ingredients: "" })
      .set("x-user-id", "test-user");

    expect(res.status).toBe(200);
    expect(res.body.data.dishes[0].matchPercentage).toBe(0);
  });

  it("search with unknown ingredient returns partial matches", async () => {
    const partialDish = makeDish({ matchPercentage: 15 });
    const partialResult = {
      ...mockSearchResult,
      dishes: [partialDish],
    };
    vi.mocked(searchByIngredients).mockResolvedValueOnce(partialResult);

    const app = createApp();
    const res = await request(app)
      .get("/api/v1/recipes/search")
      .query({ ingredients: "unknownxyz" })
      .set("x-user-id", "test-user");

    expect(res.status).toBe(200);
    expect(res.body.data.dishes[0].matchPercentage).toBeLessThan(50);
  });

  it("includes meta.degraded when LLM path is degraded", async () => {
    const degradedResult = {
      ...mockSearchResult,
      dishes: [makeDish()],
      meta: { degraded: true, source: "seed" as const },
    };
    vi.mocked(searchByIngredients).mockResolvedValueOnce(degradedResult);

    const app = createApp();
    const res = await request(app)
      .get("/api/v1/recipes/search")
      .query({ ingredients: "chicken" })
      .set("x-user-id", "test-user");

    expect(res.status).toBe(200);
    expect(res.body.meta.degraded).toBe(true);
  });

  it("returns correct pagination offset and total", async () => {
    const paginatedResult = {
      ...mockSearchResult,
      dishes: [
        makeDish(),
        makeDish({ dishId: "dish-2", name: "Dish 2", nameEn: "Dish 2" }),
      ],
      total: 15,
      offset: 5,
      limit: 5,
    };
    vi.mocked(searchByIngredients).mockResolvedValueOnce(paginatedResult);

    const app = createApp();
    const res = await request(app)
      .get("/api/v1/recipes/search")
      .query({ offset: 5, limit: 5 })
      .set("x-user-id", "test-user");

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(15);
    expect(res.body.data.offset).toBe(5);
    expect(res.body.data.limit).toBe(5);
    expect(res.body.data.dishes).toHaveLength(2);
  });

  it("passes userId to service when x-user-id header is set (AC 1)", async () => {
    vi.mocked(searchByIngredients).mockResolvedValueOnce(mockSearchResult);

    const app = createApp();
    await request(app)
      .get("/api/v1/recipes/search")
      .query({ ingredients: "chicken", offset: 0, limit: 10 })
      .set("x-user-id", "user-abc");

    expect(searchByIngredients).toHaveBeenCalledWith(
      "chicken",
      "",
      undefined,
      0,
      10,
      "user-abc",
    );
  });

  it("passes undefined userId for guest requests (AC 5)", async () => {
    vi.mocked(searchByIngredients).mockResolvedValueOnce(mockSearchResult);

    const app = createApp();
    await request(app)
      .get("/api/v1/recipes/search")
      .query({ ingredients: "chicken", offset: 0, limit: 10 });

    expect(searchByIngredients).toHaveBeenCalledWith(
      "chicken",
      "",
      undefined,
      0,
      10,
      undefined,
    );
  });

  it("handles pagination with authenticated user context (AC 1 subtask)", async () => {
    const paginatedResult = {
      ...mockSearchResult,
      dishes: [
        makeDish(),
        makeDish({ dishId: "dish-2", name: "Dish 2", nameEn: "Dish 2" }),
      ],
      total: 20,
      offset: 10,
      limit: 10,
    };
    vi.mocked(searchByIngredients).mockResolvedValueOnce(paginatedResult);

    const app = createApp();
    const res = await request(app)
      .get("/api/v1/recipes/search")
      .query({ ingredients: "chicken", offset: 10, limit: 10 })
      .set("x-user-id", "user-123");

    expect(res.status).toBe(200);
    expect(res.body.data.offset).toBe(10);
    expect(res.body.data.limit).toBe(10);
    expect(searchByIngredients).toHaveBeenCalledWith(
      "chicken",
      "",
      undefined,
      10,
      10,
      "user-123",
    );
  });
});

describe("GET /api/v1/recipes/surprise", () => {
  it("returns a valid dish object", async () => {
    vi.mocked(surpriseMe).mockReturnValueOnce(mockSurpriseDish);

    const app = createApp();
    const res = await request(app)
      .get("/api/v1/recipes/surprise")
      .set("x-user-id", "test-user");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.dishId).toBe("71f05f5d-9435-4ae8-a498-5b0ee42f8342");
    expect(res.body.data.name).toBe("Bún chả Hà Nội");
  });
});

describe("GET /api/v1/recipes/:dishId", () => {
  it("returns full recipe for valid dishId", async () => {
    vi.mocked(getRecipe).mockReturnValueOnce(mockRecipeDetail);

    const app = createApp();
    const res = await request(app)
      .get("/api/v1/recipes/768f269f-e9ba-499a-b26b-acaf74253aca")
      .set("x-user-id", "test-user");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ingredients).toHaveLength(2);
    expect(res.body.data.steps).toHaveLength(2);
    expect(res.body.data.totalCookTimeMinutes).toBe(75);
    expect(res.body.data.caloriesPerServing).toBe(450);
  });

  it("returns 404 for invalid dishId", async () => {
    const { NotFoundError } = await import("@hom-nay-an-gi/shared");
    vi.mocked(getRecipe).mockImplementationOnce(() => {
      throw new NotFoundError("Recipe");
    });

    const app = createApp();
    const res = await request(app)
      .get("/api/v1/recipes/non-existent-dish-id")
      .set("x-user-id", "test-user");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});
