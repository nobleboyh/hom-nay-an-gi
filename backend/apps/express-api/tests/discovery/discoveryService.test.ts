import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockRedis = vi.hoisted(() => ({
  get: vi.fn(),
  setex: vi.fn(),
}));

const mockShared = vi.hoisted(() => {
  class MockAppError extends Error {
    code: string;
    statusCode: number;
    userMessage: string;
    constructor(code: string, statusCode: number, userMessage: string) {
      super(userMessage);
      this.code = code;
      this.statusCode = statusCode;
      this.userMessage = userMessage;
      this.name = "AppError";
    }
  }

  return {
    redis: mockRedis,
    logger: { warn: vi.fn(), error: vi.fn(), debug: vi.fn(), info: vi.fn() },
    env: {
      LLM_PROXY_URL: "http://localhost:3001",
      JWT_SECRET: "replace-with-a-long-secret",
    },
    getLlmConfig: () => ({
      provider: "gemini",
      proxyUrl: "http://localhost:3001",
    }),
    AppError: MockAppError,
    AuthenticationError: class AuthenticationError extends MockAppError {
      constructor(message: string) {
        super("AUTH_TOKEN_EXPIRED", 401, message);
        this.name = "AuthenticationError";
      }
    },
  };
});

vi.mock("@hom-nay-an-gi/shared", () => mockShared);

vi.mock("../../src/services/index.js", () => ({
  searchNearby: vi.fn().mockResolvedValue([]),
}));

import {
  getForYou,
  getNearby,
  getTrending,
} from "../../src/api/discovery/discoveryService.js";

describe("getTrending", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 502,
      json: vi.fn(),
      text: vi.fn(),
    } as unknown as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return seed data when cache is empty and LLM fails", async () => {
    mockRedis.get.mockResolvedValue(null);

    const result = await getTrending("Vietnamese", undefined, 0, 10);

    expect(result.items.length).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThan(0);
    expect(result.items[0]).toHaveProperty("dishId");
    expect(result.items[0]).toHaveProperty("name");
  });

  it("should return cached data when Redis has it", async () => {
    const cachedData = {
      items: [
        {
          dishId: "cached-1",
          name: "Cached Dish",
          nameEn: "Cached Dish EN",
          cuisine: "Vietnamese",
          priceRange: "30.000đ – 50.000đ",
          trendingRank: 1,
          imageDescription: "A cached dish",
        },
      ],
      total: 1,
      offset: 0,
      limit: 10,
    };

    mockRedis.get.mockResolvedValue(JSON.stringify(cachedData));

    const result = await getTrending(undefined, undefined, 0, 10);

    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.dishId).toBe("cached-1");
    expect(mockRedis.get).toHaveBeenCalledWith("trending");
  });

  it("should not call LLM when cache is hot", async () => {
    const cachedData = {
      items: [
        {
          dishId: "cached-1",
          name: "Cached",
          nameEn: "Cached EN",
          cuisine: "Vietnamese",
          trendingRank: 1,
        },
      ],
      total: 1,
      offset: 0,
      limit: 10,
    };

    mockRedis.get.mockResolvedValue(JSON.stringify(cachedData));

    await getTrending(undefined, undefined, 0, 10);

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("should use cache key with cuisine and price", async () => {
    mockRedis.get.mockResolvedValue(null);

    await expect(
      getTrending("Vietnamese", "mid", 0, 10),
    ).rejects.toThrow("Trending data is currently unavailable");

    expect(mockRedis.get).toHaveBeenCalledWith(
      "trending:cuisine:vietnamese:price:mid",
    );
  });

  it("should paginate results correctly", async () => {
    mockRedis.get.mockResolvedValue(null);

    const result = await getTrending(undefined, undefined, 0, 3);

    expect(result.items.length).toBeLessThanOrEqual(3);
    expect(result.offset).toBe(0);
    expect(result.limit).toBe(3);
  });

  it("should fall back to seed data when LLM call fails", async () => {
    mockRedis.get.mockResolvedValue(null);
    (global.fetch as vi.Mock).mockRejectedValue(new Error("Network error"));

    const result = await getTrending(undefined, undefined, 0, 10);

    expect(result.items.length).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThan(0);
  });

  it("should filter by cuisine from seed fallback", async () => {
    mockRedis.get.mockResolvedValue(null);

    const result = await getTrending("Vietnamese", undefined, 0, 10);

    expect(
      result.items.every(
        (i: { cuisine: string }) => i.cuisine === "Vietnamese",
      ),
    ).toBe(true);
  });

  it("should use seed fallback when cached data is corrupted", async () => {
    mockRedis.get.mockResolvedValue("not-valid-json");

    const result = await getTrending(undefined, undefined, 0, 10);

    expect(result.items.length).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThan(0);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("should use seed fallback when cached JSON shape is invalid", async () => {
    mockRedis.get.mockResolvedValue(JSON.stringify({ invalid: true }));

    const result = await getTrending(undefined, undefined, 0, 10);

    expect(result.items.length).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThan(0);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe("getForYou", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 502,
      json: vi.fn(),
      text: vi.fn(),
    } as unknown as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should throw AuthenticationError when no userId provided", async () => {
    await expect(getForYou(undefined)).rejects.toThrow(
      mockShared.AuthenticationError,
    );
  });

  it("should return trending data for authenticated user in stub mode", async () => {
    mockRedis.get.mockResolvedValue(null);

    const result = await getForYou("test-user-id");

    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");
    expect(result.source).toBe("trending");
  });

  it("should pass offset and limit to getTrending", async () => {
    mockRedis.get.mockResolvedValue(null);

    const result = await getForYou("test-user-id", 0, 3);

    expect(result.items.length).toBeLessThanOrEqual(3);
    expect(result.source).toBe("trending");
  });

  it("should use default offset 0 and limit 10 when not provided", async () => {
    mockRedis.get.mockResolvedValue(null);

    const result = await getForYou("test-user-id");

    expect(result.items.length).toBeLessThanOrEqual(10);
    expect(result.source).toBe("trending");
  });
});

describe("getNearby", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should accept lat, lng, radius, cuisine params", async () => {
    const result = await getNearby(10.7626, 106.6601, 5000, "Vietnamese");
    expect(Array.isArray(result)).toBe(true);
  });
});
