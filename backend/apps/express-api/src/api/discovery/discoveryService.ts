import {
  AppError,
  AuthenticationError,
  cacheGet,
  cacheSet,
  logger,
  redis,
} from "@hom-nay-an-gi/shared";
import {
  type NearbyResult,
  type NearbySearchOutcome,
  searchNearbyDetailed,
} from "../../services/index.js";
import {
  generateStructured,
  LlmProxyContractError,
} from "../../services/llmClient.js";
import type { TrendingDish } from "./discoveryValidation.js";
import {
  LlmTrendingResponseSchema,
  TrendingResponseSchema,
} from "./discoveryValidation.js";
import { TRENDING_PROMPT_EN } from "./prompts.js";

const TRENDING_CACHE_TTL = 21600;
const TRENDING_CACHE_PREFIX = "trending";
const NEARBY_CACHE_TTL = 3600;
const NEARBY_CACHE_PREFIX = "nearby";
const TRENDING_GENERATION_SCHEMA = {
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
} as const;

function buildCacheKey(cuisine?: string, price?: string): string {
  const parts = [TRENDING_CACHE_PREFIX];
  if (cuisine) parts.push(`cuisine:${cuisine.toLowerCase()}`);
  if (price) parts.push(`price:${price.toLowerCase()}`);
  return parts.join(":");
}

function buildNearbyCacheKey(
  lat: number,
  lng: number,
  radius: number,
  cuisine?: string,
  price?: string,
): string {
  const roundedLat = lat.toFixed(3);
  const roundedLng = lng.toFixed(3);
  const parts = [NEARBY_CACHE_PREFIX, roundedLat, roundedLng, String(radius)];
  if (cuisine) parts.push(`c:${cuisine.toLowerCase()}`);
  if (price) parts.push(`p:${price.toLowerCase()}`);
  return parts.join(":");
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

async function callLlmForTrending(
  cuisine?: string,
  price?: string,
): Promise<TrendingDish[]> {
  const cuisineFilter = cuisine ? ` focusing on ${cuisine} cuisine` : "";
  const priceFilter = price ? ` in the ${price} price range` : "";
  const prompt = `${TRENDING_PROMPT_EN}${cuisineFilter}${priceFilter}.`;

  try {
    return await generateStructured(
      prompt,
      TRENDING_GENERATION_SCHEMA,
      LlmTrendingResponseSchema,
    );
  } catch (error) {
    if (!(error instanceof AppError && error.code === "LLM_INVALID_RESPONSE")) {
      throw error;
    }

    logger.warn({ error }, "LLM response Zod validation failed, retrying once");
    return callLlmForTrendingRaw(cuisine, price);
  }
}

async function callLlmForTrendingRaw(
  cuisine?: string,
  price?: string,
): Promise<TrendingDish[]> {
  const cuisineFilter = cuisine ? ` focusing on ${cuisine} cuisine` : "";
  const priceFilter = price ? ` in the ${price} price range` : "";
  const prompt = `${TRENDING_PROMPT_EN}${cuisineFilter}${priceFilter}.`;

  return generateStructured(
    prompt,
    TRENDING_GENERATION_SCHEMA,
    LlmTrendingResponseSchema,
  );
}

export async function getTrending(
  cuisine?: string,
  price?: string,
  offset = 0,
  limit = 5,
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
    logger.warn(
      { error, cacheKey },
      "trending cache read failed, falling back to API",
    );
  }

  let llmResult: TrendingDish[];
  try {
    llmResult = await callLlmForTrending(cuisine, price);
  } catch (error) {
    if (error instanceof LlmProxyContractError) {
      logger.error(
        {
          error: {
            code: error.code,
            endpoint: error.endpoint,
            statusCode: error.statusCode,
            message: error.message,
          },
        },
        "trending LLM proxy contract mismatch detected",
      );
    } else {
      logger.error({ error }, "trending LLM generation failed");
    }
    throw new AppError(
      "TRENDING_UNAVAILABLE",
      503,
      "Trending data is currently unavailable",
    );
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

export async function getNearby(
  lat: number,
  lng: number,
  radius: number,
  cuisine?: string,
  price?: string,
  limit = 20,
) {
  const cacheKey = buildNearbyCacheKey(lat, lng, radius, cuisine, price);

  const cached = await cacheGet<NearbyResult[]>(cacheKey);
  if (cached) {
    logger.debug({ cacheKey }, "nearby cache hit");
    return cached.sort((a, b) => a.distance - b.distance).slice(0, limit);
  }

  let nearbyOutcome: NearbySearchOutcome;

  try {
    nearbyOutcome = await searchNearbyDetailed({
      lat,
      lng,
      radius,
      cuisine: cuisine ?? null,
      price: price ?? null,
    });
  } catch (error) {
    logger.warn({ error }, "nearby API clients failed");
    nearbyOutcome = {
      items: [],
      degraded: true,
      reason: "NEARBY_PROVIDERS_UNAVAILABLE",
      source: "degraded-empty",
    };
  }

  if (nearbyOutcome.degraded) {
    logger.warn(
      {
        degraded: true,
        reason: nearbyOutcome.reason,
        source: nearbyOutcome.source,
        lat,
        lng,
        radius,
      },
      "nearby discovery degraded after provider failures",
    );
  }

  const results = nearbyOutcome.items;

  const capped = results
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);

  logger.debug(
    { lat, lng, radius, cuisine, limit, count: capped.length },
    "nearby query results",
  );

  if (results.length > 0) {
    await cacheSet(cacheKey, capped, NEARBY_CACHE_TTL);
  }

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
