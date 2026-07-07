import { env, logger } from "@hom-nay-an-gi/shared";
import {
  HereMapsProviderError,
  hereMapsSearchNearby,
  type NearbyResult,
  type SearchNearbyParams,
} from "./hereMapsClient.js";
import { overpassSearchNearby } from "./overpassClient.js";

// Re-export types for convenience
export type { NearbyResult, SearchNearbyParams };

export interface NearbySearchOutcome {
  items: NearbyResult[];
  degraded: boolean;
  reason?: "HERE_PROVIDER_FAILURE" | "NEARBY_PROVIDERS_UNAVAILABLE";
  source: "here" | "overpass-fallback" | "overpass-only" | "degraded-empty";
}

// ============================================================================
// Circuit Breaker: Try HERE Maps, fallback to Overpass
// ============================================================================

/**
 * Main search function that implements circuit breaker pattern:
 * 1. Try HERE Maps API (5s timeout)
 * 2. If fails, try Overpass API (10s timeout)
 * 3. If both fail, return empty array and log error
 *
 * Logs a warning if HERE_API_KEY is missing and falls back to Overpass only.
 */
export async function searchNearby(
  params: SearchNearbyParams,
): Promise<NearbyResult[]> {
  const outcome = await searchNearbyDetailed(params);
  return outcome.items;
}

export async function searchNearbyDetailed(
  params: SearchNearbyParams,
): Promise<NearbySearchOutcome> {
  const hereApiKey = env.HERE_API_KEY ?? null;

  // If no HERE API key, skip directly to Overpass
  if (!hereApiKey) {
    logger.warn({
      msg: "HERE_API_KEY not configured, using Overpass API only",
      context: "searchNearby",
    });

    try {
      return {
        items: await overpassSearchNearby(params),
        degraded: false,
        source: "overpass-only",
      };
    } catch (error) {
      logger.error({
        msg: "Overpass API fallback failed (no HERE key available)",
        error: error instanceof Error ? error.message : String(error),
        context: "searchNearby",
      });
      return {
        items: [],
        degraded: true,
        reason: "NEARBY_PROVIDERS_UNAVAILABLE",
        source: "degraded-empty",
      };
    }
  }

  let hereFailure: HereMapsProviderError | null = null;

  // Try HERE Maps first
  try {
    const results = await hereMapsSearchNearby(params, hereApiKey);
    if (results.length > 0) {
      return {
        items: results,
        degraded: false,
        source: "here",
      };
    }
  } catch (error) {
    hereFailure =
      error instanceof HereMapsProviderError
        ? error
        : new HereMapsProviderError(
            "transport",
            error instanceof Error ? error.message : String(error),
          );

    logger.warn({
      msg: "HERE Maps API failed, trying Overpass fallback",
      error: hereFailure.message,
      failureKind: hereFailure.kind,
      statusCode: hereFailure.statusCode,
      context: "searchNearby",
    });
  }

  // Fallback to Overpass
  try {
    const items = await overpassSearchNearby(params);
    return {
      items,
      degraded: hereFailure !== null,
      source: "overpass-fallback",
      ...(hereFailure ? { reason: "HERE_PROVIDER_FAILURE" as const } : {}),
    };
  } catch (overpassError) {
    logger.error({
      msg: "Both nearby providers failed; returning degraded empty result",
      degraded: true,
      reason: "NEARBY_PROVIDERS_UNAVAILABLE",
      hereError: hereFailure?.message ?? "HERE returned no results",
      hereFailureKind: hereFailure?.kind,
      overpassError:
        overpassError instanceof Error
          ? overpassError.message
          : String(overpassError),
      context: "searchNearby",
    });
    return {
      items: [],
      degraded: true,
      reason: "NEARBY_PROVIDERS_UNAVAILABLE",
      source: "degraded-empty",
    };
  }
}

// ============================================================================
// Exports for testing (internal use)
// ============================================================================

export { hereMapsSearchNearby, overpassSearchNearby };
