import { env, logger } from "@hom-nay-an-gi/shared";
import {
  hereMapsSearchNearby,
  type NearbyResult,
  type SearchNearbyParams,
} from "./hereMapsClient.js";
import { overpassSearchNearby } from "./overpassClient.js";

// Re-export types for convenience
export type { NearbyResult, SearchNearbyParams };

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
  const hereApiKey = env.HERE_API_KEY ?? null;

  // If no HERE API key, skip directly to Overpass
  if (!hereApiKey) {
    logger.warn({
      msg: "HERE_API_KEY not configured, using Overpass API only",
      context: "searchNearby",
    });

    try {
      return await overpassSearchNearby(params);
    } catch (error) {
      logger.error({
        msg: "Overpass API fallback failed (no HERE key available)",
        error: error instanceof Error ? error.message : String(error),
        context: "searchNearby",
      });
      return [];
    }
  }

  // Try HERE Maps first
  try {
    const results = await hereMapsSearchNearby(params, hereApiKey);
    if (results.length > 0) {
      return results;
    }
  } catch (hereError) {
    logger.warn({
      msg: "HERE Maps API failed, trying Overpass fallback",
      error: hereError instanceof Error ? hereError.message : String(hereError),
      context: "searchNearby",
    });
  }

  // Fallback to Overpass
  try {
    return await overpassSearchNearby(params);
  } catch (overpassError) {
    logger.error({
      msg: "Both HERE Maps and Overpass APIs failed",
      hereError: "See previous log messages",
      overpassError:
        overpassError instanceof Error
          ? overpassError.message
          : String(overpassError),
      context: "searchNearby",
    });
    return [];
  }
}

// ============================================================================
// Exports for testing (internal use)
// ============================================================================

export { hereMapsSearchNearby, overpassSearchNearby };
