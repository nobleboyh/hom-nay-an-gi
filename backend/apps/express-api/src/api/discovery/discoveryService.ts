import {
  AppError,
  AuthenticationError,
  getLlmConfig,
  LLMError,
  logger,
  redis,
} from "@hom-nay-an-gi/shared";
import {
  type NearbyResult,
  searchNearby as nearbyFromClients,
} from "../../services/index.js";
import type { TrendingDish } from "./discoveryValidation.js";
import {
  LlmTrendingResponseSchema,
  TrendingResponseSchema,
} from "./discoveryValidation.js";
import { TRENDING_PROMPT_EN } from "./prompts.js";

const TRENDING_SEED: TrendingDish[] = [
  {
    dishId: "trend-1",
    name: "Phở bò",
    nameEn: "Beef Pho",
    cuisine: "Vietnamese",
    priceRange: "45.000đ – 65.000đ",
    trendingRank: 1,
    imageDescription: "Bowl of beef pho with herbs",
  },
  {
    dishId: "trend-2",
    name: "Bún chả",
    nameEn: "Grilled Pork Noodles",
    cuisine: "Vietnamese",
    priceRange: "35.000đ – 50.000đ",
    trendingRank: 2,
    imageDescription: "Grilled pork with rice noodles",
  },
  {
    dishId: "trend-3",
    name: "Bánh mì thịt",
    nameEn: "Vietnamese Baguette",
    cuisine: "Vietnamese",
    priceRange: "25.000đ – 45.000đ",
    trendingRank: 3,
    imageDescription: "Vietnamese baguette sandwich",
  },
  {
    dishId: "trend-4",
    name: "Cà phê sữa đá",
    nameEn: "Iced Coffee",
    cuisine: "Vietnamese",
    priceRange: "15.000đ – 29.000đ",
    trendingRank: 4,
    imageDescription: "Iced Vietnamese coffee",
  },
  {
    dishId: "trend-5",
    name: "Cơm tấm",
    nameEn: "Broken Rice",
    cuisine: "Vietnamese",
    priceRange: "30.000đ – 50.000đ",
    trendingRank: 5,
    imageDescription: "Broken rice with grilled pork",
  },
  {
    dishId: "trend-6",
    name: "Bún bò Huế",
    nameEn: "Hue Beef Noodles",
    cuisine: "Vietnamese",
    priceRange: "40.000đ – 60.000đ",
    trendingRank: 6,
    imageDescription: "Spicy beef noodle soup",
  },
  {
    dishId: "trend-7",
    name: "Gỏi cuốn",
    nameEn: "Spring Rolls",
    cuisine: "Vietnamese",
    priceRange: "20.000đ – 35.000đ",
    trendingRank: 7,
    imageDescription: "Fresh spring rolls",
  },
  {
    dishId: "trend-8",
    name: "Chả giò",
    nameEn: "Fried Spring Rolls",
    cuisine: "Vietnamese",
    priceRange: "25.000đ – 40.000đ",
    trendingRank: 8,
    imageDescription: "Crispy fried spring rolls",
  },
];

const NEARBY_SEED: NearbyResult[] = [
  {
    restaurantName: "Phở Hòa Pasteur",
    dishName: "Phở bò tái chín",
    distance: 250,
    rating: 4.5,
    priceRange: "45.000đ – 65.000đ",
    cuisine: "Vietnamese",
    externalUrl: null,
    lat: 10.8215,
    lng: 106.628,
  },
  {
    restaurantName: "Bún Chả Hương Liên",
    dishName: "Bún chả",
    distance: 380,
    rating: 4.3,
    priceRange: "35.000đ – 50.000đ",
    cuisine: "Vietnamese",
    externalUrl: null,
    lat: 10.825,
    lng: 106.631,
  },
  {
    restaurantName: "Bánh Mì Huỳnh Hoa",
    dishName: "Bánh mì đặc biệt",
    distance: 180,
    rating: 4.7,
    priceRange: "25.000đ – 45.000đ",
    cuisine: "Vietnamese",
    externalUrl: null,
    lat: 10.822,
    lng: 106.6285,
  },
  {
    restaurantName: "Cộng Cà Phê",
    dishName: "Cà phê sữa đá",
    distance: 420,
    rating: 4.2,
    priceRange: "15.000đ – 29.000đ",
    cuisine: "Vietnamese",
    externalUrl: null,
    lat: 10.8245,
    lng: 106.626,
  },
  {
    restaurantName: "Cơm Tấm Bụi Sài Gòn",
    dishName: "Cơm tấm sườn bì chả",
    distance: 310,
    rating: 4.4,
    priceRange: "30.000đ – 50.000đ",
    cuisine: "Vietnamese",
    externalUrl: null,
    lat: 10.8235,
    lng: 106.6315,
  },
  {
    restaurantName: "Bún Bò Huế 3A3",
    dishName: "Bún bò Huế",
    distance: 550,
    rating: 4.1,
    priceRange: "40.000đ – 60.000đ",
    cuisine: "Vietnamese",
    externalUrl: null,
    lat: 10.82,
    lng: 106.625,
  },
  {
    restaurantName: "Nha Trang BBQ",
    dishName: "Hải sản nướng",
    distance: 720,
    rating: 4.6,
    priceRange: "100.000đ – 200.000đ",
    cuisine: "Vietnamese",
    externalUrl: null,
    lat: 10.827,
    lng: 106.633,
  },
  {
    restaurantName: "Kichi Kichi Lê Văn Sỹ",
    dishName: "Lẩu băng chuyền",
    distance: 890,
    rating: 4.0,
    priceRange: "100.000đ – 200.000đ",
    cuisine: "Chinese",
    externalUrl: null,
    lat: 10.818,
    lng: 106.622,
  },
  {
    restaurantName: "Sushi KA",
    dishName: "Sushi combo",
    distance: 650,
    rating: 4.5,
    priceRange: "tren-200k",
    cuisine: "Japanese",
    externalUrl: null,
    lat: 10.826,
    lng: 106.63,
  },
  {
    restaurantName: "Hanuri BBQ",
    dishName: "Thịt nướng Hàn Quốc",
    distance: 480,
    rating: 4.3,
    priceRange: "100.000đ – 200.000đ",
    cuisine: "Korean",
    externalUrl: null,
    lat: 10.823,
    lng: 106.634,
  },
  {
    restaurantName: "Pizza Hut Đồng Khởi",
    dishName: "Pizza hải sản",
    distance: 1100,
    rating: 4.1,
    priceRange: "100.000đ – 200.000đ",
    cuisine: "Italian",
    externalUrl: null,
    lat: 10.815,
    lng: 106.624,
  },
  {
    restaurantName: "Phở 2000",
    dishName: "Phở gà",
    distance: 340,
    rating: 4.2,
    priceRange: "45.000đ – 65.000đ",
    cuisine: "Vietnamese",
    externalUrl: null,
    lat: 10.8238,
    lng: 106.6265,
  },
];

const TRENDING_CACHE_TTL = 21600;
const TRENDING_CACHE_PREFIX = "trending";

function buildCacheKey(cuisine?: string, price?: string): string {
  const parts = [TRENDING_CACHE_PREFIX];
  if (cuisine) parts.push(`cuisine:${cuisine.toLowerCase()}`);
  if (price) parts.push(`price:${price.toLowerCase()}`);
  return parts.join(":");
}

function filterSeed(items: TrendingDish[], cuisine?: string): TrendingDish[] {
  if (!cuisine) return items;
  const lower = cuisine.toLowerCase();
  return items.filter((d) => d.cuisine.toLowerCase() === lower);
}

function paginate<T>(items: T[], offset: number, limit: number) {
  const total = items.length;
  const sliced = items.slice(offset, offset + limit);
  return {
    items: sliced,
    total,
    offset,
    limit: Math.min(limit, 50),
  };
}

function fallbackToSeed(
  cuisine?: string,
  price?: string,
  offset = 0,
  limit = 10,
) {
  const items = filterSeed(TRENDING_SEED, cuisine);
  const filtered = price
    ? items.filter((d) =>
        d.priceRange?.toLowerCase().includes(price.toLowerCase()),
      )
    : items;
  logger.warn({ cuisine, price }, "using seed fallback for trending");
  return paginate(filtered, offset, limit);
}

async function callLlmForTrending(
  cuisine?: string,
  price?: string,
): Promise<TrendingDish[]> {
  const llmConfig = getLlmConfig();
  const proxyUrl = llmConfig.proxyUrl;

  const cuisineFilter = cuisine ? ` focusing on ${cuisine} cuisine` : "";
  const priceFilter = price ? ` in the ${price} price range` : "";
  const prompt = `${TRENDING_PROMPT_EN}${cuisineFilter}${priceFilter}.`;

  const schema = {
    type: "array",
    items: {
      type: "object",
      properties: {
        dishId: { type: "string" },
        name: { type: "string" },
        nameEn: { type: "string" },
        cuisine: { type: "string" },
        priceRange: { type: "string" },
        trendingRank: { type: "number" },
        imageDescription: { type: "string" },
      },
      required: ["dishId", "name", "nameEn", "cuisine", "trendingRank"],
    },
  };

  const response = await fetch(`${proxyUrl}/generate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ provider: "gemini", prompt, schema }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    throw new LLMError(
      "LLM_PROVIDER_ERROR",
      `LLM proxy returned ${response.status}`,
    );
  }

  let proxyBody: {
    success: boolean;
    data?: { content: string };
    error?: { code: string; message: string };
  };
  try {
    proxyBody = (await response.json()) as typeof proxyBody;
  } catch {
    throw new LLMError(
      "LLM_INVALID_RESPONSE",
      "LLM proxy returned non-JSON response",
    );
  }

  if (!proxyBody.success || !proxyBody.data?.content) {
    throw new LLMError(
      "LLM_INVALID_RESPONSE",
      proxyBody.error?.message ?? "LLM proxy returned unsuccessful response",
    );
  }

  function parseTrendingContent(rawJson: string): TrendingDish[] {
    const raw = JSON.parse(rawJson);
    return LlmTrendingResponseSchema.parse(raw);
  }

  let parsed: TrendingDish[];
  try {
    parsed = parseTrendingContent(proxyBody.data.content);
  } catch (error) {
    logger.warn(
      { error, contentPreview: proxyBody.data.content.slice(0, 200) },
      "LLM response Zod validation failed, retrying once",
    );
    try {
      const retryResult = await callLlmForTrendingRaw(cuisine, price);
      parsed = retryResult;
    } catch {
      throw new LLMError(
        "LLM_INVALID_RESPONSE",
        `LLM response failed Zod validation: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  return parsed;
}

async function callLlmForTrendingRaw(
  cuisine?: string,
  price?: string,
): Promise<TrendingDish[]> {
  const llmConfig = getLlmConfig();
  const proxyUrl = llmConfig.proxyUrl;

  const cuisineFilter = cuisine ? ` focusing on ${cuisine} cuisine` : "";
  const priceFilter = price ? ` in the ${price} price range` : "";
  const prompt = `${TRENDING_PROMPT_EN}${cuisineFilter}${priceFilter}.`;

  const schema = {
    type: "array" as const,
    items: {
      type: "object" as const,
      properties: {
        dishId: { type: "string" as const },
        name: { type: "string" as const },
        nameEn: { type: "string" as const },
        cuisine: { type: "string" as const },
        priceRange: { type: "string" as const },
        trendingRank: { type: "number" as const },
        imageDescription: { type: "string" as const },
      },
      required: ["dishId", "name", "nameEn", "cuisine", "trendingRank"],
    },
  };

  const response = await fetch(`${proxyUrl}/generate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ provider: "gemini", prompt, schema }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    throw new LLMError(
      "LLM_PROVIDER_ERROR",
      `LLM proxy returned ${response.status}`,
    );
  }

  let proxyBody: {
    success: boolean;
    data?: { content: string };
    error?: { code: string; message: string };
  };
  try {
    proxyBody = (await response.json()) as typeof proxyBody;
  } catch {
    throw new LLMError(
      "LLM_INVALID_RESPONSE",
      "LLM proxy returned non-JSON response",
    );
  }

  if (!proxyBody.success || !proxyBody.data?.content) {
    throw new LLMError(
      "LLM_INVALID_RESPONSE",
      proxyBody.error?.message ?? "LLM proxy returned unsuccessful response",
    );
  }

  const raw = JSON.parse(proxyBody.data.content);
  return LlmTrendingResponseSchema.parse(raw);
}

export async function getTrending(
  cuisine?: string,
  price?: string,
  offset = 0,
  limit = 10,
) {
  const cacheKey = buildCacheKey(cuisine, price);

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const parsed = TrendingResponseSchema.parse(JSON.parse(cached));
      logger.debug({ cacheKey }, "trending cache hit");
      return paginate(parsed.items, offset, limit);
    }
  } catch (error) {
    logger.warn({ error, cacheKey }, "trending cache read failed, using seed");
    return fallbackToSeed(cuisine, price, offset, limit);
  }

  let llmResult: TrendingDish[];
  try {
    llmResult = await callLlmForTrending(cuisine, price);
  } catch (error) {
    logger.error(
      { error },
      "trending LLM generation failed, using seed fallback",
    );
    const seed = fallbackToSeed(cuisine, price, offset, limit);
    if (seed.items.length === 0) {
      throw new AppError(
        "TRENDING_UNAVAILABLE",
        503,
        "Trending data is currently unavailable",
      );
    }
    return seed;
  }

  const validated = {
    items: llmResult,
    total: llmResult.length,
    offset: 0,
    limit,
  };

  try {
    await redis.setex(cacheKey, TRENDING_CACHE_TTL, JSON.stringify(validated));
    logger.debug({ cacheKey }, "trending cache set");
  } catch (error) {
    logger.warn({ error, cacheKey }, "trending cache write failed");
  }

  return paginate(validated.items, offset, limit);
}

function nearbySeedFilter(cuisine?: string, price?: string): NearbyResult[] {
  let items = NEARBY_SEED;
  if (cuisine) {
    const lower = cuisine.toLowerCase();
    items = items.filter((r) => r.cuisine.toLowerCase() === lower);
  }
  if (price) {
    items = items.filter((r) => {
      if (!r.priceRange) return false;
      const p = price.toLowerCase();
      if (p === "low")
        return r.priceRange.includes("25.") || r.priceRange.includes("15.");
      if (p === "mid")
        return r.priceRange.includes("35.") || r.priceRange.includes("45.");
      if (p === "high") return r.priceRange.includes("100.");
      if (p === "premium") return r.priceRange.includes("200");
      return r.priceRange.toLowerCase().includes(p);
    });
  }
  return items
    .map((r) => ({ ...r, distance: Math.round(r.distance) }))
    .sort((a, b) => a.distance - b.distance);
}

export async function getNearby(
  lat: number,
  lng: number,
  radius: number,
  cuisine?: string,
  price?: string,
  limit = 20,
) {
  let results: NearbyResult[];

  try {
    results = await nearbyFromClients({
      lat,
      lng,
      radius,
      cuisine: cuisine ?? null,
      price: price ?? null,
    });
  } catch (error) {
    logger.warn({ error }, "nearby API clients failed, using seed fallback");
    results = [];
  }

  if (results.length === 0) {
    logger.warn({ cuisine, price }, "using seed fallback for nearby");
    results = nearbySeedFilter(cuisine, price);
  }

  const capped = results
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);

  logger.debug(
    { lat, lng, radius, cuisine, limit, count: capped.length },
    "nearby query results",
  );

  return capped;
}

export async function getForYou(
  userId: string | undefined,
  offset = 0,
  limit = 10,
) {
  if (!userId) {
    throw new AuthenticationError("Authentication required");
  }

  const trending = await getTrending(undefined, undefined, offset, limit);

  return {
    items: trending.items,
    total: trending.total,
    source: "trending" as const,
  };
}
