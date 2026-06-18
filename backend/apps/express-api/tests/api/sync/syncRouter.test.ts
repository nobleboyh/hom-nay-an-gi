import { errorHandler } from "@hom-nay-an-gi/shared";
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { syncRouter } from "../../../src/api/sync/syncRouter.js";

vi.mock("../../../src/api/sync/syncService.js", () => ({
  mergeGuestData: vi.fn(),
  deltaSync: vi.fn(),
}));

const { mergeGuestData, deltaSync } = await import(
  "../../../src/api/sync/syncService.js"
);

beforeEach(() => {
  vi.clearAllMocks();
});

function createApp(): express.Express {
  const app = express();
  app.use(express.json({ limit: "10mb" }));
  app.use("/api/v1/sync", syncRouter);
  app.use(errorHandler);
  return app;
}

const mockFirstTimeResult = {
  favorites: [
    {
      _id: "507f1f77bcf86cd799439011",
      userId: "507f1f77bcf86cd799439012",
      dishId: "dish-123",
      dishData: { name: "Phở bò", cuisine: "Việt Nam", cookTimeMinutes: 120 },
      savedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  history: [
    {
      _id: "607f1f77bcf86cd799439013",
      userId: "507f1f77bcf86cd799439012",
      ingredients: ["bò", "phở"],
      createdAt: new Date().toISOString(),
    },
  ],
  preferences: {
    _id: "707f1f77bcf86cd799439014",
    userId: "507f1f77bcf86cd799439012",
    measurementUnit: "metric",
    theme: "light",
    language: "vi",
    notifications: {
      breakfastReminder: false,
      lunchReminder: false,
      dinnerReminder: false,
      dailySuggestion: false,
    },
  },
  syncTimestamp: new Date().toISOString(),
};

const validPayload = {
  deviceId: "guest-device-001",
  favorites: [
    {
      dishId: "dish-123",
      dishData: {
        name: "Phở bò",
        cuisine: "Việt Nam",
        cookTimeMinutes: 120,
      },
    },
  ],
  history: [
    {
      ingredients: ["bò", "phở"],
    },
  ],
  preferences: {
    measurementUnit: "metric",
    theme: "light",
    language: "vi",
  },
};

describe("POST /api/v1/sync", () => {
  it("returns 200 with merged state for first-time sync (lastSyncAt null)", async () => {
    vi.mocked(mergeGuestData).mockResolvedValueOnce(mockFirstTimeResult);

    const app = createApp();
    const res = await request(app)
      .post("/api/v1/sync")
      .set("x-user-id", "test-user")
      .send({ ...validPayload, lastSyncAt: null });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.favorites).toHaveLength(1);
    expect(res.body.data.history).toHaveLength(1);
    expect(res.body.data.preferences).not.toBeNull();
    expect(res.body.data.syncTimestamp).toBeDefined();
    expect(mergeGuestData).toHaveBeenCalledOnce();
    expect(deltaSync).not.toHaveBeenCalled();
  });

  it("returns 200 with merged state for first-time sync (lastSyncAt undefined)", async () => {
    vi.mocked(mergeGuestData).mockResolvedValueOnce(mockFirstTimeResult);

    const app = createApp();
    const res = await request(app)
      .post("/api/v1/sync")
      .set("x-user-id", "test-user")
      .send(validPayload);

    expect(res.status).toBe(200);
    expect(mergeGuestData).toHaveBeenCalledOnce();
  });

  it("returns 200 with delta for incremental sync", async () => {
    const lastSync = new Date(Date.now() - 3600000).toISOString();
    vi.mocked(deltaSync).mockResolvedValueOnce({
      favorites: [],
      history: [],
      preferences: null,
      syncTimestamp: new Date().toISOString(),
    });

    const app = createApp();
    const res = await request(app)
      .post("/api/v1/sync")
      .set("x-user-id", "test-user")
      .send({ deviceId: "guest-device-001", lastSyncAt: lastSync });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(deltaSync).toHaveBeenCalledOnce();
    expect(mergeGuestData).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid payload (missing deviceId)", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/v1/sync")
      .set("x-user-id", "test-user")
      .send({ lastSyncAt: null });

    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid lastSyncAt format", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/v1/sync")
      .set("x-user-id", "test-user")
      .send({ deviceId: "test", lastSyncAt: "not-a-date" });

    expect(res.status).toBe(400);
  });

  it("stub mode assigns default userId when x-user-id is missing", async () => {
    vi.mocked(mergeGuestData).mockResolvedValueOnce(mockFirstTimeResult);

    const app = createApp();
    const res = await request(app)
      .post("/api/v1/sync")
      .send({ ...validPayload, lastSyncAt: null });

    expect(res.status).toBe(200);
    expect(mergeGuestData).toHaveBeenCalled();
    const callArgs = vi.mocked(mergeGuestData).mock.calls[0];
    expect(typeof callArgs[0]).toBe("string");
  });

  it("returns 413 for oversized payload", async () => {
    const largeFavorites = Array.from({ length: 50000 }, (_, i) => ({
      dishId: `large-dish-${i}`,
      dishData: {
        name: "A".repeat(100),
        cuisine: "Test",
        cookTimeMinutes: 10,
      },
    }));

    const app = createApp();
    const res = await request(app)
      .post("/api/v1/sync")
      .set("x-user-id", "test-user")
      .send({
        deviceId: "test",
        favorites: largeFavorites,
        lastSyncAt: null,
      });

    expect(res.status).toBe(413);
    expect(res.body.error?.code).toBe("PAYLOAD_TOO_LARGE");
  });

  it("merges empty guest data successfully", async () => {
    vi.mocked(mergeGuestData).mockResolvedValueOnce({
      favorites: [],
      history: [],
      preferences: null,
      syncTimestamp: new Date().toISOString(),
    });

    const app = createApp();
    const res = await request(app)
      .post("/api/v1/sync")
      .set("x-user-id", "test-user")
      .send({
        deviceId: "guest-device-001",
        favorites: [],
        history: [],
        lastSyncAt: null,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.favorites).toHaveLength(0);
    expect(res.body.data.history).toHaveLength(0);
    expect(res.body.data.preferences).toBeNull();
  });
});
