import { logger } from "@hom-nay-an-gi/shared";
import { z } from "zod";
import type { NearbyResult, SearchNearbyParams } from "./hereMapsClient.js";

// ============================================================================
// Constants
// ============================================================================

const OVERPASS_API_URL = "https://overpass-api.de/api/interpreter";
const OVERPASS_TIMEOUT_MS = 10000;
const MAX_RESULTS = 20;
const EARTH_RADIUS_METERS = 6371000; // meters

// ============================================================================
// Overpass API Response Schema
// ============================================================================

const OverpassNodeSchema = z.object({
  type: z.literal("node"),
  id: z.number(),
  lat: z.number(),
  lon: z.number(),
  tags: z.object({
    name: z.string().optional(),
    amenity: z.string().optional(),
    cuisine: z.string().optional(),
    opening_hours: z.string().optional(),
  }),
});

const OverpassResponseSchema = z.object({
  elements: z.array(OverpassNodeSchema),
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate haversine distance between two lat/lng points in meters
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

/**
 * Convert lat/lng/radius to bounding box for Overpass query
 */
function radiusToBbox(
  lat: number,
  lng: number,
  radius: number,
): { south: number; west: number; north: number; east: number } {
  // Rough approximation: 1 degree latitude ≈ 111 km
  // Adjusted for latitude for longitude
  const latDelta = radius / 111000; // convert meters to degrees
  const lngDelta = radius / (111000 * Math.cos((lat * Math.PI) / 180));

  return {
    south: lat - latDelta,
    west: lng - lngDelta,
    north: lat + latDelta,
    east: lng + lngDelta,
  };
}

/**
 * Build Overpass QL query for restaurants
 */
function buildOverpassQuery(lat: number, lng: number, radius: number): string {
  const bbox = radiusToBbox(lat, lng, radius);
  const bboxStr = `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`;

  // Query for restaurants (amenity=restaurant) within bbox
  return `[out:json];(node[amenity=restaurant](${bboxStr}););out;`;
}

// ============================================================================
// Overpass Client
// ============================================================================

export async function overpassSearchNearby(
  params: SearchNearbyParams,
): Promise<NearbyResult[]> {
  const { lat, lng, radius, cuisine } = params;

  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    const query = buildOverpassQuery(lat, lng, radius);

    timeoutId = setTimeout(() => controller.abort(), OVERPASS_TIMEOUT_MS);

    const response = await fetch(OVERPASS_API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "hom-nay-an-gi/1.0",
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      logger.error({
        msg: "Overpass API returned error",
        status: response.status,
        statusText: response.statusText,
        context: "overpassSearchNearby",
      });
      throw new Error(
        `Overpass API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    const validatedData = OverpassResponseSchema.parse(data);

    const results: NearbyResult[] = validatedData.elements
      .filter((node) => {
        // Verify it's actually within radius (Bbox approximation may be off)
        const distance = calculateDistance(lat, lng, node.lat, node.lon);
        return distance <= radius && node.tags.name;
      })
      .filter((node) => {
        // Filter by cuisine if specified
        if (!cuisine) return true;

        const nodeCuisine = node.tags.cuisine?.toLowerCase() ?? "";
        return (
          nodeCuisine.includes(cuisine.toLowerCase()) ||
          node.tags.name?.toLowerCase().includes(cuisine.toLowerCase())
        );
      })
      .map((node) => ({
        restaurantName: node.tags.name ?? "Unknown Restaurant",
        distance: calculateDistance(lat, lng, node.lat, node.lon),
        rating: null, // Overpass doesn't provide ratings
        priceRange: null, // Overpass doesn't provide price info
        cuisine: node.tags.cuisine ?? cuisine ?? "restaurant",
        lat: node.lat,
        lng: node.lon,
        externalUrl: null,
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, MAX_RESULTS);

    logger.debug({
      msg: "Overpass search successful",
      resultCount: results.length,
      context: "overpassSearchNearby",
    });

    return results;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof DOMException && error.name === "AbortError") {
      logger.warn({
        msg: "Overpass API request timed out",
        timeout_ms: OVERPASS_TIMEOUT_MS,
        context: "overpassSearchNearby",
      });
      throw new Error("Overpass API request timeout");
    }

    if (error instanceof z.ZodError) {
      logger.error({
        msg: "Overpass API response validation failed",
        errors: error.issues,
        context: "overpassSearchNearby",
      });
      throw new Error("Overpass API response validation failed");
    }

    logger.error({
      msg: "Overpass search error",
      error: error instanceof Error ? error.message : String(error),
      context: "overpassSearchNearby",
    });

    throw error;
  }
}

/**
 * High-level function exported for direct use.
 * Intended to be called from the circuit breaker in the main searchNearby export.
 */
export async function searchNearbyOverpass(
  params: SearchNearbyParams,
): Promise<NearbyResult[]> {
  return overpassSearchNearby(params);
}
