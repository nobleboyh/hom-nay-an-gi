import { errorHandler } from "@hom-nay-an-gi/shared";
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { settingsRouter } from "../../../src/api/settings/settingsRouter.js";

vi.mock("../../../src/api/settings/settingsService.js", () => ({
  getPreferences: vi.fn(),
  updatePreferences: vi.fn(),
  deleteAccount: vi.fn(),
}));

const { getPreferences, updatePreferences, deleteAccount } = await import(
  "../../../src/api/settings/settingsService.js"
);

beforeEach(() => {
  vi.clearAllMocks();
});

function createApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.use("/api/v1/settings", settingsRouter);
  app.use(errorHandler);
  return app;
}

const mockPreferences = {
  dietaryPreferences: ["vegetarian"],
  allergies: ["peanuts"],
  dislikedIngredients: ["cilantro"],
  preferredCuisines: ["Việt Nam"],
  measurementUnit: "metric",
  theme: "light",
  language: "vi",
  notifications: {
    breakfastReminder: false,
    lunchReminder: false,
    dinnerReminder: false,
    dailySuggestion: true,
  },
};

describe("GET /api/v1/settings/preferences", () => {
  it("returns 200 and preferences for existing user", async () => {
    vi.mocked(getPreferences).mockResolvedValueOnce(mockPreferences);

    const app = createApp();
    const res = await request(app)
      .get("/api/v1/settings/preferences")
      .set("x-user-id", "test-user");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.dietaryPreferences).toEqual(["vegetarian"]);
    expect(res.body.data.measurementUnit).toBe("metric");
  });

  it("returns default preferences when user has none", async () => {
    const defaults = {
      dietaryPreferences: [],
      allergies: [],
      dislikedIngredients: [],
      preferredCuisines: [],
      measurementUnit: "metric",
      theme: "light",
      language: "vi",
      notifications: {
        breakfastReminder: false,
        lunchReminder: false,
        dinnerReminder: false,
        dailySuggestion: false,
      },
    };
    vi.mocked(getPreferences).mockResolvedValueOnce(defaults);

    const app = createApp();
    const res = await request(app)
      .get("/api/v1/settings/preferences")
      .set("x-user-id", "new-user");

    expect(res.status).toBe(200);
    expect(res.body.data.dietaryPreferences).toEqual([]);
    expect(res.body.data.theme).toBe("light");
  });
});

describe("PUT /api/v1/settings/preferences", () => {
  it("returns 200 with updated preferences (partial merge)", async () => {
    const updated = { ...mockPreferences, theme: "dark" };
    vi.mocked(updatePreferences).mockResolvedValueOnce(updated);

    const app = createApp();
    const res = await request(app)
      .put("/api/v1/settings/preferences")
      .set("x-user-id", "test-user")
      .send({ theme: "dark" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.theme).toBe("dark");
    expect(vi.mocked(updatePreferences).mock.calls[0][1]).toEqual({
      theme: "dark",
    });
  });

  it("returns 200 with full update", async () => {
    const fullUpdate = {
      dietaryPreferences: ["vegan"],
      allergies: ["soy"],
      dislikedIngredients: ["mushrooms"],
      preferredCuisines: ["Japanese"],
      measurementUnit: "imperial",
      theme: "dark",
      language: "en",
      notifications: {
        breakfastReminder: true,
        lunchReminder: false,
        dinnerReminder: false,
        dailySuggestion: false,
      },
    };
    vi.mocked(updatePreferences).mockResolvedValueOnce(fullUpdate);

    const app = createApp();
    const res = await request(app)
      .put("/api/v1/settings/preferences")
      .set("x-user-id", "test-user")
      .send(fullUpdate);

    expect(res.status).toBe(200);
    expect(res.body.data.measurementUnit).toBe("imperial");
    expect(res.body.data.language).toBe("en");
  });

  it("returns 400 for invalid enum value", async () => {
    const app = createApp();
    const res = await request(app)
      .put("/api/v1/settings/preferences")
      .set("x-user-id", "test-user")
      .send({ measurementUnit: "invalid" });

    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid notification field", async () => {
    const app = createApp();
    const res = await request(app)
      .put("/api/v1/settings/preferences")
      .set("x-user-id", "test-user")
      .send({ notifications: { breakfastReminder: "yes" } });

    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/v1/account", () => {
  it("returns 204 on successful account deletion with token revocation", async () => {
    vi.mocked(deleteAccount).mockResolvedValueOnce(undefined);

    const { buildApp } = await import("../../../src/server.js");
    const app = buildApp();
    const res = await request(app)
      .delete("/api/v1/account")
      .set("authorization", "Bearer test-access-token")
      .set("x-user-id", "test-user");

    expect(res.status).toBe(204);
    expect(vi.mocked(deleteAccount).mock.calls[0][0]).toBe("test-user");
    expect(vi.mocked(deleteAccount).mock.calls[0][1]).toBe("test-access-token");
  });
});
