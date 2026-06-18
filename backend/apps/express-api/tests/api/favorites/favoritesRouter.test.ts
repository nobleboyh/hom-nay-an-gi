import { errorHandler } from "@hom-nay-an-gi/shared";
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { favoritesRouter } from "../../../src/api/favorites/favoritesRouter.js";

vi.mock("../../../src/api/favorites/favoritesService.js", () => ({
  list: vi.fn(),
  save: vi.fn(),
  remove: vi.fn(),
}));

const { list, save, remove } = await import(
  "../../../src/api/favorites/favoritesService.js"
);

beforeEach(() => {
  vi.clearAllMocks();
});

function createApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.use("/api/v1/favorites", favoritesRouter);
  app.use(errorHandler);
  return app;
}

const mockFavorite = {
  _id: "507f1f77bcf86cd799439011",
  userId: "507f1f77bcf86cd799439012",
  dishId: "dish-123",
  dishData: {
    name: "Phở bò",
    nameEn: "Beef Pho",
    cuisine: "Việt Nam",
    cookTimeMinutes: 120,
    caloriesPerServing: 450,
    tags: ["soup", "beef", "noodles"],
    imageDescription: "A bowl of pho with beef slices",
  },
  savedAt: new Date().toISOString(),
};

const mockListResult = {
  items: [mockFavorite],
  total: 1,
  offset: 0,
  limit: 20,
};

describe("GET /api/v1/favorites", () => {
  it("returns 200 in stub mode even without auth header (stub defaults to stub-user)", async () => {
    vi.mocked(list).mockResolvedValueOnce(mockListResult);

    const app = createApp();
    const res = await request(app).get("/api/v1/favorites");

    expect(res.status).toBe(200);
    expect(vi.mocked(list).mock.calls[0][0]).toBe("stub-user");
  });

  it("returns 200 with paginated favorites and full response shape", async () => {
    vi.mocked(list).mockResolvedValueOnce(mockListResult);

    const app = createApp();
    const res = await request(app)
      .get("/api/v1/favorites?offset=0&limit=20")
      .set("x-user-id", "test-user");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.offset).toBe(0);
    expect(res.body.data.limit).toBe(20);
    const item = res.body.data.items[0];
    expect(item.dishId).toBe("dish-123");
    expect(item.dishData.name).toBe("Phở bò");
    expect(item.dishData.nameEn).toBe("Beef Pho");
    expect(item.dishData.cuisine).toBe("Việt Nam");
    expect(item.dishData.cookTimeMinutes).toBe(120);
    expect(item.dishData.caloriesPerServing).toBe(450);
    expect(item.dishData.tags).toEqual(["soup", "beef", "noodles"]);
    expect(item.dishData.imageDescription).toBe(
      "A bowl of pho with beef slices",
    );
    expect(item.savedAt).toBeDefined();
  });

  it("uses default pagination values", async () => {
    vi.mocked(list).mockResolvedValueOnce(mockListResult);

    const app = createApp();
    const res = await request(app)
      .get("/api/v1/favorites")
      .set("x-user-id", "test-user");

    expect(res.status).toBe(200);
    expect(vi.mocked(list).mock.calls[0][1]).toBe(0);
    expect(vi.mocked(list).mock.calls[0][2]).toBe(20);
  });

  it("returns 400 for invalid offset", async () => {
    const app = createApp();
    const res = await request(app)
      .get("/api/v1/favorites?offset=-1")
      .set("x-user-id", "test-user");

    expect(res.status).toBe(400);
  });

  it("returns 400 for limit over 100", async () => {
    const app = createApp();
    const res = await request(app)
      .get("/api/v1/favorites?limit=200")
      .set("x-user-id", "test-user");

    expect(res.status).toBe(400);
  });
});

describe("POST /api/v1/favorites", () => {
  it("returns 201 with saved favorite", async () => {
    vi.mocked(save).mockResolvedValueOnce(mockFavorite);

    const app = createApp();
    const res = await request(app)
      .post("/api/v1/favorites")
      .set("x-user-id", "test-user")
      .send({
        dishId: "dish-123",
        dishData: {
          name: "Phở bò",
          cuisine: "Việt Nam",
          cookTimeMinutes: 120,
        },
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.dishId).toBe("dish-123");
  });

  it("returns 409 for duplicate favorite", async () => {
    const { AppError } = await import("@hom-nay-an-gi/shared");
    vi.mocked(save).mockRejectedValueOnce(
      new AppError(
        "FAVORITE_ALREADY_EXISTS",
        409,
        "Dish is already in your favorites",
      ),
    );

    const app = createApp();
    const res = await request(app)
      .post("/api/v1/favorites")
      .set("x-user-id", "test-user")
      .send({
        dishId: "dish-123",
        dishData: {
          name: "Phở bò",
          cuisine: "Việt Nam",
          cookTimeMinutes: 120,
        },
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("FAVORITE_ALREADY_EXISTS");
  });

  it("returns 400 for missing required fields", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/v1/favorites")
      .set("x-user-id", "test-user")
      .send({
        dishData: { name: "Phở bò", cuisine: "Việt Nam", cookTimeMinutes: 120 },
      });

    expect(res.status).toBe(400);
  });

  it("returns 400 for empty dishId", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/v1/favorites")
      .set("x-user-id", "test-user")
      .send({
        dishId: "",
        dishData: { name: "Phở bò", cuisine: "Việt Nam", cookTimeMinutes: 120 },
      });

    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/v1/favorites/:favoriteId", () => {
  it("returns 204 on successful removal", async () => {
    vi.mocked(remove).mockResolvedValueOnce(undefined);

    const app = createApp();
    const res = await request(app)
      .delete("/api/v1/favorites/507f1f77bcf86cd799439011")
      .set("x-user-id", "test-user");

    expect(res.status).toBe(204);
  });

  it("returns 404 for non-existent favorite", async () => {
    const { AppError } = await import("@hom-nay-an-gi/shared");
    vi.mocked(remove).mockRejectedValueOnce(
      new AppError("FAVORITE_NOT_FOUND", 404, "Favorite not found"),
    );

    const app = createApp();
    const res = await request(app)
      .delete("/api/v1/favorites/507f1f77bcf86cd799439999")
      .set("x-user-id", "test-user");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("FAVORITE_NOT_FOUND");
  });

  it("returns 404 for favorite owned by another user", async () => {
    const { AppError } = await import("@hom-nay-an-gi/shared");
    vi.mocked(remove).mockRejectedValueOnce(
      new AppError(
        "FAVORITE_NOT_FOUND",
        404,
        "Favorite not found or does not belong to you",
      ),
    );

    const app = createApp();
    const res = await request(app)
      .delete("/api/v1/favorites/507f1f77bcf86cd799439011")
      .set("x-user-id", "other-user");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("FAVORITE_NOT_FOUND");
  });
});
