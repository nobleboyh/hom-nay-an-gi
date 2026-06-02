# Epic 3: Discovery — Khám Phá

**Goal:** A user taps the Discover tab, sees trending dishes, browses nearby restaurants with distance/rating/price, filters by cuisine and price range, and gets personalized suggestions.

**FRs covered:** FR-14, FR-15, FR-16, FR-17 (4 FRs)
**Backend:** `api/discovery/`, `services/hereMapsClient`
**Frontend:** DiscoverScreen

## Story 3.1: HERE Maps Client

As a **developer**,
I want a HERE Maps Places API client with Overpass API fallback,
So that the app can find nearby restaurants and their dishes without depending on Google Places API costs.

**Acceptance Criteria:**

- **Given** the `hereMapsClient.searchNearby({ lat, lng, radius, cuisine, price })` function, **When** called with valid coordinates, **Then** It queries HERE Maps Places API and returns restaurants with: name, location (lat/lng), distance (meters), cuisine types, price range, rating. Results capped at 20 per query.
- **Given** the HERE Maps API returns an error or is unavailable, **When** the primary call fails, **Then** The Overpass API fallback is attempted for the same query parameters. Overpass results are mapped to the same response format.
- **Given** a search with radius 5000 (5km), **When** called, **Then** Only results within the specified radius are returned, sorted by distance ascending.
- **Given** a search with cuisine filter "Vietnamese", **When** called, **Then** Only restaurants/dish types matching the cuisine are returned.
- **Given** the API key is missing, **When** the client initializes, **Then** It logs a warning and defaults to Overpass API only.

**Technical Tasks:**
- [ ] Create `backend/src/services/hereMapsClient.ts` — HERE Maps Places API wrapper: `searchNearby(params)` using Browse endpoint, `lookupById(placeId)`, configurable radius 1000-20000m, API key from env
- [ ] Create `backend/src/services/overpassClient.ts` — Overpass API fallback: `searchNearby(params)` using Overpass QL queries for restaurants near lat/lng, result mapping to common format
- [ ] Implement circuit breaker pattern: try HERE Maps first (5s timeout) → fallback to Overpass (10s timeout) → return empty if both fail
- [ ] Create shared response type: `NearbyResult { restaurantName, dishName?, distance, rating?, priceRange?, cuisine, externalUrl? }`
- [ ] Add `.env.template` entries: `HERE_API_KEY=your_key_here` with documentation of 250K free req/month
- [ ] Write tests: mock HERE API response, verify result mapping, verify fallback triggers on error

---

## Story 3.2: Discovery API Module

As a **frontend developer**,
I want RESTful discovery endpoints for trending dishes and nearby restaurants,
So that the Discover tab can show relevant content.

**Acceptance Criteria:**

- **Given** `GET /api/v1/discovery/trending?cuisine=Vietnamese&price=mid&offset=0&limit=10`, **When** called, **Then** Returns LLM-generated trending dishes with: dishId, name, nameEn, cuisine, priceRange, trendingRank, imageDescription. Cached in Redis (TTL 6h).
- **Given** `GET /api/v1/discovery/nearby?lat=10.7626&lng=106.6601&radius=5000&cuisine=Vietnamese&price=mid`, **When** called, **Then** Returns restaurants with dishes from HERE Maps: restaurantName, dishName, distance, rating, priceRange, externalUrl.
- **Given** `GET /api/v1/discovery/for-you` with valid auth header, **When** called, **Then** Returns personalized suggestions based on user's favorites, search history, and preferred tags. Falls back to trending if user has no history. **Note:** This endpoint has a soft dependency on Epic 4 (User model, auth middleware, UserPreference schema). For You is an Epic 4 integration milestone — implement as stub returning trending until Epic 4 auth module is complete.
- **Given** `GET /api/v1/discovery/for-you` without auth (guest), **When** called, **Then** Returns 401 `{ code: "AUTH_TOKEN_EXPIRED" }`.
- **Given** the trending endpoint, **When** Redis cache is cold, **Then** LLM generates trending dishes using the trending prompt template, validated against Zod schema.

**Technical Tasks:**
- [ ] Create `backend/src/api/discovery/discoveryRouter.ts` — route definitions: `GET /trending`, `GET /nearby`, `GET /for-you` (authenticate required)
- [ ] Create `backend/src/api/discovery/discoveryController.ts` — request parsing, validate middleware, serviceResponse formatting
- [ ] Create `backend/src/api/discovery/discoveryService.ts` — `getTrending()`: check cache → LLM generate → cache → return. `getNearby()`: call hereMapsClient → map to response. `getForYou(userId)`: lookup favorites + history → LLM personalize → return.
- [ ] Create `backend/src/api/discovery/discoveryValidation.ts` — Zod schemas: `trendingSchema`, `nearbySchema`, `forYouSchema`
- [ ] Create `backend/src/api/discovery/prompts.ts` — trending prompt (vi/en), personalized "for you" prompt (vi/en)
- [ ] Define Zod schemas for discovery LLM responses: `TrendingDishSchema`, `NearbyResultSchema`
- [ ] Write router tests: trending returns paginated results, nearby returns restaurants, for-you requires auth

---

## Story 3.3: DiscoverScreen

As a **user**,
I want to browse trending and nearby dishes on the Discover tab with location awareness,
So that I can discover new food near me without entering ingredients.

**Acceptance Criteria:**

- **Given** the DiscoverScreen, **When** I navigate to Tab 2 (Khám phá), **Then** I see: location display card (district + "Thay đổi" button), tab selector chip row (Tất cả / Đang thịnh hành / Gần tôi / Món mới / Đánh giá cao — single-select), trending 2-column DishCard grid, nearby RestaurantCard vertical list, cuisine filter chip row, price filter chip row (Under 50k / 50k-100k / 100k-200k / Over 200k — multi-select). Pull-to-refresh supported on both trending and nearby sections.
- **Given** the location display, **When** location is available, **Then** Shows district name (e.g., "Quận 1, TP. Hồ Chí Minh"). When unavailable, shows "Đang cập nhật vị trí..." with prompt to enable.
- **Given** I tap "Thay đổi", **When** pressed, **Then** Triggers location update or shows manual district input.
- **Given** the tab selector chips, **When** I select "Gần tôi", **Then** The nearby RestaurantCard list is shown. When I select "Đang thịnh hành", the trending DishCard grid is shown.
- **Given** I tap a DishCard, **When** pressed, **Then** Navigates to RecipeScreen (trending dish) or external link (restaurant dish to delivery partner).
- **Given** I change a filter chip, **When** cuisine or price filter changes, **Then** Results re-fetch with new filter params (debounce 500ms).
- **Given** 0 results after filtering, **When** no dishes match, **Then** EmptyState: "Không có món nào phù hợp" with "Xoá bộ lọc" CTA button.
- **Given** loading/error/offline states, **When** those occur, **Then** Skeleton grid (4-6 card placeholders), error toast with retry, offline with cached trending data.

**Technical Tasks:**
- [ ] Implement `frontend/app/(tabs)/discover.tsx` — DiscoverScreen with full layout
- [ ] Wire location display card — uses `expo-location` to get current position, reverse geocode to district name, manual district input fallback
- [ ] Add iOS/Android location permission strings: `NSLocationWhenInUseUsageDescription` in `app.json` (iOS) and `ACCESS_FINE_LOCATION` in `AndroidManifest.xml` (Android). Vietnamese + English description text.
- [ ] Wire tab selector ChipRow — single-select, controls visible section
- [ ] Wire trending DishCard 2-column grid — FlatList with numColumns=2, data from `GET /api/v1/discovery/trending`
- [ ] Wire nearby RestaurantCard vertical list — FlatList, data from `GET /api/v1/discovery/nearby`
- [ ] Wire cuisine filter ChipRow — multi-select, triggers re-fetch with debounce (500ms)
- [ ] Wire price filter ChipRow — multi-select, triggers re-fetch with debounce (500ms)
- [ ] Wire DishCard tap → navigate to RecipeScreen (trending) or external URL (restaurant, `Linking.openURL()`)
- [ ] Implement pull-to-refresh on both trending and nearby sections (`RefreshControl`)
- [ ] Implement 5 UX states + zero-results empty state with "Xoá bộ lọc" CTA
- [ ] Add skeleton GPS loading spinner while location resolves
- [ ] Add accessibility: location card as `region` landmark, grid as list with `accessibilityLabel` per card
- [ ] Reference UX-DR31 (banned interactions) — no carousels, no hero animations, no parallax on this screen
