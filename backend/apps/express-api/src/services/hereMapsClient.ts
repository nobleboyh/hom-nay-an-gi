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

// ============================================================================
// Constants
// ============================================================================

const HERE_API_BASE_URL = "https://places.ls.hereapi.com/places/v1/browse";
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
      at: `${lat},${lng}`,
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
      logger.error({
        msg: "HERE Maps API returned error",
        status: response.status,
        statusText: response.statusText,
        context: "hereMapsSearchNearby",
      });
      throw new Error(
        `HERE Maps API error: ${response.status} ${response.statusText}`,
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
      throw new Error("HERE Maps API request timeout");
    }

    if (error instanceof z.ZodError) {
      logger.error({
        msg: "HERE Maps API response validation failed",
        errors: error.issues,
        context: "hereMapsSearchNearby",
      });
      throw new Error("HERE Maps API response validation failed");
    }

    logger.error({
      msg: "HERE Maps search error",
      error: error instanceof Error ? error.message : String(error),
      context: "hereMapsSearchNearby",
    });

    throw error;
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
