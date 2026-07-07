import { logger } from "@hom-nay-an-gi/shared";
import { z } from "zod";

// ============================================================================
// Types & Schemas
// ============================================================================

export interface SearchNearbyParams {
  lat: number;
  lng: number;
  radius: number; // in meters
  cuisine?: string | null;
  price?: string | null;
}

export interface NearbyResult {
  restaurantName: string;
  dishName?: string | null;
  distance: number; // in meters
  rating?: number | null;
  priceRange?: string | null;
  cuisine: string;
  externalUrl?: string | null;
  lat: number;
  lng: number;
}

// HERE Maps API response schemas
const HEREPositionSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

const HERECategorySchema = z.object({
  name: z.string(),
});

const HEREItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  position: HEREPositionSchema,
  distance: z.number().optional(),
  categories: z.array(HERECategorySchema).optional(),
  rating: z.number().optional(),
});

const HEREBrowseResponseSchema = z.object({
  items: z.array(HEREItemSchema),
});

export type HereMapsFailureKind =
  | "configuration"
  | "timeout"
  | "transport"
  | "invalid_response";

export class HereMapsProviderError extends Error {
  provider = "here" as const;
  kind: HereMapsFailureKind;
  statusCode?: number;

  constructor(kind: HereMapsFailureKind, message: string, statusCode?: number) {
    super(message);
    this.name = "HereMapsProviderError";
    this.kind = kind;
    if (statusCode !== undefined) {
      this.statusCode = statusCode;
    }
  }
}

// ============================================================================
// Constants
// ============================================================================

const HERE_API_BASE_URL = "https://discover.search.hereapi.com/v1/discover";
const HERE_TIMEOUT_MS = 5000;
const MAX_RESULTS = 20;
const DEFAULT_CUISINE = "restaurant";

// ============================================================================
// HERE Maps Client
// ============================================================================

export async function hereMapsSearchNearby(
  params: SearchNearbyParams,
  apiKey: string | null,
): Promise<NearbyResult[]> {
  if (!apiKey) {
    logger.warn({
      msg: "HERE Maps API key missing, cannot search",
      context: "hereMapsSearchNearby",
    });
    throw new Error("HERE_API_KEY not configured");
  }

  const { lat, lng, radius, cuisine } = params;

  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    const searchQuery = cuisine ? `${cuisine} restaurant` : DEFAULT_CUISINE;

    const queryParams = new URLSearchParams({
      apiKey,
      q: searchQuery,
      limit: String(MAX_RESULTS),
      in: `circle:${lat},${lng};r=${radius}`,
    });

    timeoutId = setTimeout(() => controller.abort(), HERE_TIMEOUT_MS);

    const response = await fetch(
      `${HERE_API_BASE_URL}?${queryParams.toString()}`,
      {
        method: "GET",
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
      },
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      const isConfigurationFailure =
        response.status === 401 || response.status === 403;

      logger.error({
        msg: isConfigurationFailure
          ? "HERE Maps authorization/configuration failure"
          : "HERE Maps API returned error",
        status: response.status,
        statusText: response.statusText,
        errorBody,
        endpoint: HERE_API_BASE_URL,
        context: "hereMapsSearchNearby",
      });

      if (isConfigurationFailure) {
        throw new HereMapsProviderError(
          "configuration",
          `HERE Maps authorization/configuration error: ${response.status} ${response.statusText}`,
          response.status,
        );
      }

      throw new HereMapsProviderError(
        "transport",
        `HERE Maps API error: ${response.status} ${response.statusText}`,
        response.status,
      );
    }

    const data = await response.json();
    const validatedData = HEREBrowseResponseSchema.parse(data);

    const results: NearbyResult[] = validatedData.items
      .filter((item) => item.distance !== undefined && item.distance <= radius)
      .map((item) => ({
        restaurantName: item.title,
        distance: item.distance ?? 0,
        rating: item.rating ?? null,
        priceRange: null, // HERE doesn't provide price range in Browse API
        cuisine: cuisine ?? "restaurant",
        lat: item.position.lat,
        lng: item.position.lng,
        externalUrl: null,
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, MAX_RESULTS);

    logger.debug({
      msg: "HERE Maps search successful",
      resultCount: results.length,
      context: "hereMapsSearchNearby",
    });

    return results;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof DOMException && error.name === "AbortError") {
      logger.warn({
        msg: "HERE Maps API request timed out",
        timeout_ms: HERE_TIMEOUT_MS,
        context: "hereMapsSearchNearby",
      });
      throw new HereMapsProviderError(
        "timeout",
        "HERE Maps API request timeout",
      );
    }

    if (error instanceof z.ZodError) {
      logger.error({
        msg: "HERE Maps API response validation failed",
        errors: error.issues,
        context: "hereMapsSearchNearby",
      });
      throw new HereMapsProviderError(
        "invalid_response",
        "HERE Maps API response validation failed",
      );
    }

    if (error instanceof HereMapsProviderError) {
      throw error;
    }

    logger.error({
      msg: "HERE Maps search error",
      error: error instanceof Error ? error.message : String(error),
      context: "hereMapsSearchNearby",
    });

    throw new HereMapsProviderError(
      "transport",
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * High-level function exported for direct use.
 * Intended to be called from the circuit breaker in the main searchNearby export.
 */
export async function searchNearbyHERE(
  params: SearchNearbyParams,
  apiKey: string | null,
): Promise<NearbyResult[]> {
  return hereMapsSearchNearby(params, apiKey);
}
