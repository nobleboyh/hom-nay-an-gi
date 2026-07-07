import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  vi,
} from "vitest";

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
    cacheGet: vi.fn().mockResolvedValue(null),
    cacheSet: vi.fn().mockResolvedValue(undefined),
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

const LLM_SUCCESS_RESPONSE = {
  ok: true,
  status: 200,
  json: vi.fn().mockResolvedValue({
    success: true,
    data: {
      content: JSON.stringify([
        {
          dishId: "api-1",
          name: "Phở bò",
          nameEn: "Beef Pho",
          cuisine: "Vietnamese",
          priceRange: "45.000đ – 65.000đ",
          trendingRank: 1,
          imageDescription: "Bowl of beef pho with herbs",
        },
        {
          dishId: "api-2",
          name: "Bún chả",
          nameEn: "Grilled Pork Noodles",
          cuisine: "Vietnamese",
          priceRange: "35.000đ – 50.000đ",
          trendingRank: 2,
          imageDescription: "Grilled pork with rice noodles",
        },
        {
          dishId: "api-3",
          name: "Bánh mì thịt",
          nameEn: "Vietnamese Baguette",
          cuisine: "Vietnamese",
          priceRange: "25.000đ – 45.000đ",
          trendingRank: 3,
          imageDescription: "Vietnamese baguette sandwich",
        },
        {
          dishId: "api-4",
          name: "Cà phê sữa đá",
          nameEn: "Iced Coffee",
          cuisine: "Vietnamese",
          priceRange: "15.000đ – 29.000đ",
          trendingRank: 4,
          imageDescription: "Iced Vietnamese coffee",
        },
        {
          dishId: "api-5",
          name: "Cơm tấm",
          nameEn: "Broken Rice",
          cuisine: "Vietnamese",
          priceRange: "30.000đ – 50.000đ",
          trendingRank: 5,
          imageDescription: "Broken rice with grilled pork",
        },
      ]),
    },
  }),
} as unknown as Response;

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

  it("should throw TRENDING_UNAVAILABLE when cache is empty and LLM fails", async () => {
    mockRedis.get.mockResolvedValue(null);

    await expect(getTrending("Vietnamese", undefined, 0, 5)).rejects.toThrow(
      "Trending data is currently unavailable",
    );
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
      limit: 5,
    };

    mockRedis.get.mockResolvedValue(JSON.stringify(cachedData));

    const result = await getTrending(undefined, undefined, 0, 5);

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.dishId).toBe("cached-1");
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
      limit: 5,
    };

    mockRedis.get.mockResolvedValue(JSON.stringify(cachedData));

    await getTrending(undefined, undefined, 0, 5);

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("should use cache key with cuisine and price", async () => {
    mockRedis.get.mockResolvedValue(null);

    await expect(getTrending("Vietnamese", "mid", 0, 5)).rejects.toThrow(
      "Trending data is currently unavailable",
    );

    expect(mockRedis.get).toHaveBeenCalledWith(
      "trending:cuisine:vietnamese:price:mid",
    );
  });

  it("should return data from LLM API when cache is empty", async () => {
    mockRedis.get.mockResolvedValue(null);
    (global.fetch as Mock).mockResolvedValue(LLM_SUCCESS_RESPONSE);

    const result = await getTrending(undefined, undefined, 0, 5);

    expect(result.items).toHaveLength(5);
    expect(result.items[0]?.dishId).toBe("api-1");
    expect(result.total).toBe(5);
  });

  it("should paginate results from LLM API correctly", async () => {
    mockRedis.get.mockResolvedValue(null);
    (global.fetch as Mock).mockResolvedValue(LLM_SUCCESS_RESPONSE);

    const result = await getTrending(undefined, undefined, 0, 3);

    expect(result.items).toHaveLength(3);
    expect(result.offset).toBe(0);
    expect(result.limit).toBe(3);
  });

  it("should throw TRENDING_UNAVAILABLE when LLM call fails", async () => {
    mockRedis.get.mockResolvedValue(null);
    (global.fetch as Mock).mockRejectedValue(new Error("Network error"));

    await expect(getTrending(undefined, undefined, 0, 5)).rejects.toThrow(
      "Trending data is currently unavailable",
    );
  });

  it("should filter by cuisine via LLM API", async () => {
    mockRedis.get.mockResolvedValue(null);
    const mockFilteredResponse = {
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        success: true,
        data: {
          content: JSON.stringify([
            {
              dishId: "api-1",
              name: "Phở bò",
              nameEn: "Beef Pho",
              cuisine: "Vietnamese",
              priceRange: "45.000đ – 65.000đ",
              trendingRank: 1,
            },
          ]),
        },
      }),
    } as unknown as Response;
    (global.fetch as Mock).mockResolvedValue(mockFilteredResponse);

    const result = await getTrending("Vietnamese", undefined, 0, 5);

    expect(
      result.items.every(
        (i: { cuisine: string }) => i.cuisine === "Vietnamese",
      ),
    ).toBe(true);
  });

  it("should throw TRENDING_UNAVAILABLE when cached data is corrupted and LLM fails", async () => {
    mockRedis.get.mockResolvedValue("not-valid-json");

    await expect(getTrending(undefined, undefined, 0, 5)).rejects.toThrow(
      "Trending data is currently unavailable",
    );
  });

  it("should throw TRENDING_UNAVAILABLE when cached JSON shape is invalid and LLM fails", async () => {
    mockRedis.get.mockResolvedValue(JSON.stringify({ invalid: true }));

    await expect(getTrending(undefined, undefined, 0, 5)).rejects.toThrow(
      "Trending data is currently unavailable",
    );
  });

  it("should recover from corrupted cache and return LLM data", async () => {
    mockRedis.get.mockResolvedValue("not-valid-json");
    (global.fetch as Mock).mockResolvedValue(LLM_SUCCESS_RESPONSE);

    const result = await getTrending(undefined, undefined, 0, 5);

    expect(result.items).toHaveLength(5);
    expect(result.items[0]?.dishId).toBe("api-1");
  });

  it("should default limit to 5 for trending", async () => {
    mockRedis.get.mockResolvedValue(null);
    (global.fetch as Mock).mockResolvedValue(LLM_SUCCESS_RESPONSE);

    const result = await getTrending();

    expect(result.items).toHaveLength(5);
    expect(result.limit).toBe(5);
  });
});

describe("getForYou", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(global, "fetch").mockResolvedValue(LLM_SUCCESS_RESPONSE);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should throw AuthenticationError when no userId provided", async () => {
    await expect(getForYou(undefined)).rejects.toThrow(
      mockShared.AuthenticationError,
    );
  });

  it("should return trending data for authenticated user", async () => {
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

  it("should use default offset 0 and limit 5 when not provided", async () => {
    mockRedis.get.mockResolvedValue(null);

    const result = await getForYou("test-user-id");

    expect(result.items.length).toBeLessThanOrEqual(5);
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
