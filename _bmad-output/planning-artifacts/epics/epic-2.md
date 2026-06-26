# Epic 2: Core Search — Từ Nguyên Liệu Đến Món Ăn

**Goal:** A Guest user opens the app, enters ingredients (text), applies filters, browses AI-powered dish suggestions, views recipes with visual timelines, adjusts servings, and generates shopping lists. Plus one-tap "Surprise Me."

**FRs covered:** FR-1, FR-4 through FR-13 (11 FRs)
**Backend:** `api/recipes/`, `services/llmClient`, `services/llmProxyServer`
**Frontend:** HomeScreen, ResultsScreen, RecipeScreen, ShoppingListScreen

## Story 2.1: LLM Integration

As a **user**,
I want AI-powered dish suggestions from my ingredients,
So that I get relevant Vietnamese recipes even when no exact match exists in the database.

**Acceptance Criteria:**

- **Given** the `llmClient.complete()` function, **When** called with an ingredient search prompt and parameters, **Then** It sends a request to the configured LLM provider (Gemini 2.5 Flash default), receives structured JSON, validates against Zod schema, and returns typed result. Provider is swappable via `LLM_PROVIDER` env var.
- **Given** the llm-proxy service, **When** `express-api` calls `llm-proxy:3001`, **Then** The proxy handles the LLM API call and returns the response. LLM API key never leaves the llm-proxy container.
- **Given** the LLM returns a response, **When** Zod validation fails, **Then** The system retries once with the validation error in the prompt. If second attempt also fails, falls back to keyword matching against seed recipes (Jaccard similarity on ingredient names). LLM 502 is never exposed to the user — they always get results (degraded match quality, but never an error page).
- **Given** the LLM call times out (10s deadline), **When** timeout occurs, **Then** Retries once after 2s delay, then falls back to seed recipe keyword matching. Returns 200 with a `meta.degraded: true` flag indicating non-LLM results.
- **Given** Redis cache, **When** searching with the same ingredient+tag+cookTime combination, **Then** Cached result is returned (TTL 24h) without calling LLM. Cache key: `recipe:search:{hash}`.
- **Given** the prompt templates, **When** `UserPreference.language` is `'vi'`, **Then** System prompt is in Vietnamese. When `'en'`, system prompt is in English.
- **Given** a Gemini API outage or rate limit, **When** the primary provider returns 429/503, **Then** llm-proxy programmatically switches to the fallback provider (configured via `LLM_FALLBACK_PROVIDER` + `LLM_FALLBACK_API_KEY` env vars). Circuit breaker opens after 3 consecutive failures, resets after 60s.

**Technical Tasks:**
- [ ] Create `backend/src/services/llmClient.ts` — provider-agnostic wrapper: reads `LLM_PROVIDER` env, maps to Gemini/OpenAI/Anthropic SDK calls, configurable model + temperature, Zod schema validation on response, retry logic (1 retry on validation failure, 1 retry on timeout), seed-recipe fallback on total failure (Jaccard similarity keyword matching), circuit breaker (3 consecutive failures → open for 60s), `meta.degraded` flag on fallback responses
- [ ] Create `backend/src/services/llmProxyServer.ts` — standalone Express server (port 3001) that owns the LLM API key, exposes `POST /complete` endpoint, called internally by express-api. Implements provider fallback: primary → fallback provider on 429/503. Circuit breaker at proxy level so failing upstream doesn't cascade retries in express-api.
- [ ] Create `backend/src/services/cacheClient.ts` — Redis wrapper: `get(key)`, `set(key, value, ttl)`, `del(key)`, key pattern: `recipe:search:{hash}`, `surprise:{date}`, `trending:{date}`, `session:{id}`, `rate:{userId}:{endpoint}`
- [ ] Create `backend/src/api/recipes/prompts.ts` — ingredient search prompt (vi/en), surprise me prompt (vi/en), with structured output instructions matching Zod schema. Include few-shot examples with valid JSON outputs.
- [ ] Create `backend/src/services/seedMatcher.ts` — fallback keyword matcher: tokenizes ingredients, computes Jaccard similarity against seed recipes, returns scored results. Used when LLM path fails entirely.
- [ ] **Prompt engineering iteration:** Run 50+ test prompts against Gemini 2.5 Flash, validate structured JSON output consistency, verify Vietnamese cuisine accuracy against seed recipes. Tune prompt templates, few-shot examples, and temperature until >90% valid JSON rate and culturally accurate responses.
- [ ] Define Zod schemas for LLM responses: `DishSchema`, `RecipeSchema`, `IngredientSchema`, `CookingStepSchema` in `backend/src/api/recipes/recipesValidation.ts`
- [ ] Set up `llm-proxy` Dockerfile/service entry in docker-compose (reuse backend build with custom command: `node dist/services/llmProxyServer.js`)
- [ ] Write tests: mock LLM response, verify Zod validation pass/fail, verify retry on failure, verify fallback to seedMatcher, verify cache hit/miss, verify circuit breaker open/close

---

## Story 2.2: Recipes API Module

As a **frontend developer**,
I want RESTful recipe endpoints (search, surprise, get recipe),
So that the app can search dishes by ingredients, get full recipe details, and support the Surprise Me feature.

**Acceptance Criteria:**

- **Given** `GET /api/v1/recipes/search?ingredients=chicken,broccoli&tags=Vietnamese&cookTime=30&offset=0&limit=10`, **When** called, **Then** Returns `{ success: true, data: { dishes: [...], total, offset, limit } }` where each dish has: dishId, name, nameEn, cuisine, matchPercentage, cookTimeMinutes, caloriesPerServing, tags, imageDescription. **matchPercentage formula**: For seed results, `|userIngredients ∩ dishIngredients| / |userIngredients ∪ dishIngredients| × 100` (Jaccard similarity). For LLM results, the LLM provides matchPercentage in its structured output. When LLM path is degraded, `meta.degraded: true` is set.
- **Given** `GET /api/v1/recipes/surprise`, **When** called, **Then** Returns a random dish. No two consecutive calls return the same dishId.
- **Given** `GET /api/v1/recipes/:dishId`, **When** called with a valid dishId, **Then** Returns full recipe: dish metadata + ingredients array + steps array (with label, durationMinutes, parallelGroup) + totalCookTimeMinutes + caloriesPerServing.
- **Given** the search endpoint, **When** called with `offset` and `limit`, **Then** Returns paginated results with `total` count. Default limit: 10.
- **Given** search with 0 ingredients, **When** called with only filters, **Then** Returns all dishes matching filters (no ingredient constraint).
- **Given** search with an unknown ingredient, **When** called, **Then** Returns partial matches with lower match percentages instead of empty results.

**Technical Tasks:**
- [ ] Create `backend/src/api/recipes/recipesRouter.ts` — route definitions: `GET /search`, `GET /surprise`, `GET /:dishId`, all with `authenticate` (optional) middleware
- [ ] Create `backend/src/api/recipes/recipesController.ts` — request parsing, `req.validated` from validate middleware, response formatting via serviceResponse
- [ ] Create `backend/src/api/recipes/recipesService.ts` — `searchByIngredients()`: check Redis cache → call llmClient → validate + cache → return. `getRecipe()`: lookup from cache or seed data. `surpriseMe()`: random dish from seed data or LLM.
- [ ] Create `backend/src/api/recipes/recipesValidation.ts` — Zod schemas for search, surprise, and dish detail parameters
- [ ] Load seed recipes into memory at startup for recipe lookup and Surprise Me random selection
- [ ] Write router tests (Supertest): search with valid params, search with no params, surprise returns dish, getRecipe valid/invalid, pagination

---

## Story 2.3: HomeScreen

As a **user**,
I want to enter my available ingredients and apply filters on a clean home screen,
So that I can quickly discover what dishes I can cook with what I have.

**Acceptance Criteria:**

- **Given** the HomeScreen, **When** I open the app, **Then** I see: app title "Hôm Nay Ăn Gì" (28px-700 display font), an ingredient input field with placeholder "Gõ nguyên liệu, ví dụ: thịt gà, bông cải, trứng", food type chip row (vegetarian, salad, light, meat-included, salty, sour, sweet, dessert), cuisine chip row (Vietnamese default active), mood tags collapsible section (hidden by default, header "Cảm giác thèm" with chevron), cook time chips (15/30/60/90+ phút, 30 active), "Tìm món" primary full-width button, "Bất ngờ!" secondary button.
- **Given** I type "thịt gà, bông cải", **When** I press Enter or tap comma, **Then** Two ingredient chips appear: "Thịt gà ✕" and "Bông cải ✕" with removable behavior.
- **Given** ingredient chips are shown, **When** I tap the ✕ on a chip, **Then** The chip is removed with a 150ms fade animation.
- **Given** I tap a food type chip, **When** it toggles selection, **Then** Active chips show filled state. Multiple chips can be active (AND logic).
- **Given** I tap "Cảm giác thèm" header, **When** the section expands, **Then** Mood tag chips appear. Chevron rotates 180°.
- **Given** I tap a cook time chip, **When** it's selected, **Then** Only one cook time active at a time (single-select range).
- **Given** I tap "Tìm món", **When** pressed with ≥0 ingredients, **Then** `dataStore.fetchDishes(ingredients, filters)` is called, `uiStore.setLoading('search', true)`, navigates to ResultsScreen.
- **Given** I tap "Bất ngờ!", **When** pressed, **Then** `dataStore.fetchSurpriseMe()` is called, navigates directly to RecipeScreen with the random dish.
- **Given** HomeScreen loading/error/offline states, **When** those states occur, **Then** Respective UX states display: skeleton, error toast with retry, offline toast with cached fallback. Default/baseline state shows empty input field with placeholder text and default filter selections (cuisine: Việt Nam active, cook time: 30 phút active).

**Technical Tasks:**
- [ ] Implement `frontend/app/(tabs)/index.tsx` — HomeScreen with full component composition and conditional render (Home vs Results based on state)
- [ ] Wire InputField with `parseIngredients.ts` — comma-delimited parsing, max 20 ingredients validation
- [ ] Wire ChipRow (food type) — AND logic multi-select with tags from PRD §4.2
- [ ] Wire ChipRow (cuisine) — default Việt Nam active, multi-select
- [ ] Wire CollapsibleSection (mood tags) — hidden by default, animated expand/collapse
- [ ] Wire ChipRow (cook time) — single-select, default 30 phút, preset values
- [ ] Wire "Tìm món" Button — calls `dataStore.fetchDishes`, navigates on success
- [ ] Wire "Bất ngờ!" Button — calls `dataStore.fetchSurpriseMe`, navigates to recipe
- [ ] Implement 5 UX states: loading skeleton, error toast, offline toast, success (navigate)
- [ ] Add accessibility: skip navigation link, `h1` title, logical heading hierarchy, `role="main"`
- [ ] Add `useReducedMotion` hook integration for all animations

---

## Story 2.4: ResultsScreen

As a **user**,
I want to browse AI-matched dish suggestions in an accordion card list with sorting,
So that I can quickly find the best dish for my ingredients and mood.

**Acceptance Criteria:**

- **Given** the ResultsScreen, **When** it loads with search results, **Then** I see: results count text "Tìm thấy X món phù hợp", a sort dropdown (Best match/Lowest cal/Fastest/Dish type), and a list of ResultCards in compact view (dish name + match badge + cook time + calories).
- **Given** I tap a compact ResultCard, **When** it expands, **Then** The card reveals: photo placeholder (16:9), cuisine chips, "Xem công thức" primary button, "Mua sắm" secondary button, "♡ Save" button. Only one card expanded at a time (accordion). Save button works immediately in guest mode: writes to SQLite `favorites_guest` table, shows filled heart, triggers toast "Đã lưu vào Yêu thích". No login gate — save is a core interaction.
- **Given** I change the sort option, **When** selecting "Lowest cal", **Then** The card list re-sorts in place without a new API call (client-side sort).
- **Given** I scroll to the bottom, **When** more results exist, **Then** Infinite scroll loads the next 10 cards (offset-based pagination).
- **Given** 0 results, **When** the list is empty, **Then** EmptyState shows "Không còn món nào để hiển thị" (end-of-list marker).
- **Given** loading/error/offline states, **When** those states occur, **Then** Skeleton cards (3-4 shimmer), error toast with retry, offline toast with cached data.

**Technical Tasks:**
- [ ] Implement ResultsScreen — either as a separate route or conditional render within `index.tsx` based on `dataStore` search state
- [ ] Wire SortDropdown component with 4 options, client-side sort logic
- [ ] Wire ResultCard list from `dataStore.dishes` — accordion state in `uiStore.expandedCardId`
- [ ] Wire infinite scroll (FlatList `onEndReached` → `dataStore.fetchDishes` with next offset)
- [ ] Implement pull-to-refresh (`RefreshControl`) to re-run the last search
- [ ] Cache search results in `dataStore` so navigating to RecipeScreen and back preserves the result list (no re-fetch)
- [ ] Wire "Xem công thức" → navigate to `recipe/[id].tsx`
- [ ] Wire "Mua sắm" → navigate to `shopping-list.tsx` with dish data
- [ ] Wire "♡ Save" button — saves to guest SQLite `favorites_guest` immediately (no auth gate). Toast "Đã lưu vào Yêu thích". When user later logs in (Epic 4), saved guest favorites are merged via sync protocol.
- [ ] Implement 5 UX states: loading (3-4 skeleton cards), empty, error (toast + retry), offline (cached/empty), success
- [ ] Add accessibility: each ResultCard is a `<button>`, `accessibilityState.expanded`, match percentage as numeric text

---

## Story 2.5: RecipeScreen

As a **user**,
I want to see a full recipe with cooking timeline, ingredient list (owned vs missing), and adjustable serving size,
So that I know exactly how to cook the dish and what extra ingredients I need.

**Acceptance Criteria:**

- **Given** the RecipeScreen, **When** I navigate from a ResultCard, **Then** I see: 16:9 hero image placeholder, dish name (24px-700 display), total cook time, calorie estimate with "Estimated" label, cuisine chips, ♡ save button (no-op stub).
- **Given** the ServingAdjuster, **When** I tap + from default 2 to 3 servings, **Then** Ingredient quantities and calorie count update in real time (<500ms). Range: 1-10. − disabled at 1, + disabled at 10.
- **Given** the ingredient list, **When** I view it, **Then** Owned ingredients show in default color. Missing ingredients show in `--accent-strong` with ⚠️ indicator.
- **Given** the Timeline, **When** I view recipe steps, **Then** It renders as vertical dot-and-bar `<ol>`. Each step: dot (15px, `--accent`), label (14px-600), duration (12px-`--muted`). Parallel tasks stacked vertically. Connecting bar: 3px `--border`.
- **Given** action buttons, **When** I scroll down, **Then** "Danh sách mua sắm" primary button and "Sao chép" secondary button. Shopping list → navigates to ShoppingListScreen. Copy → toast "📋 Đã sao chép công thức".
- **Given** loading/error/offline states, **When** those occur, **Then** Skeleton (hero + timeline bars + ingredient bars), error toast with back, offline with cached recipe.

**Technical Tasks:**
- [ ] Implement `frontend/app/recipe/[id].tsx` — RecipeScreen with full layout
- [ ] Wire hero image placeholder (ImagePlaceholder, 16:9 aspect ratio)
- [ ] Wire ServingAdjuster — `useState` for servings, recalculate quantities + calories with `useMemo`
- [ ] **Ingredient data flow**: Accept user's original ingredient list via route params (from ResultsScreen) or read from `dataStore.searchIngredients`. Split displayed ingredients into "owned" (user entered) vs "missing" (recipe requires but user didn't enter). Visual differentiation with accent color + ⚠️.
- [ ] Wire Timeline component with recipe steps data from API
- [ ] Wire "Danh sách mua sắm" → navigate to `shopping-list.tsx` with dish + ingredient data as route params (both owned + missing lists)
- [ ] Wire "Sao chép" → Clipboard API, toast feedback
- [ ] Wire "♡ Save" button — saves to guest SQLite `favorites_guest` immediately (same pattern as ResultCard). See Story 2.4 for save behavior contract.
- [ ] Implement 5 UX states: loading (skeleton), error (toast + back), offline (cached recipe), empty (invalid dishId), success
- [ ] Add accessibility: Timeline as `<ol>`, ServingAdjuster buttons with `accessibilityLabel`, logical heading structure

---

## Story 2.6: ShoppingListScreen

As a **user**,
I want a checkable shopping list of ingredients I need to buy,
So that I can go shopping efficiently without forgetting anything.

**Acceptance Criteria:**

- **Given** the ShoppingListScreen, **When** I navigate from RecipeScreen, **Then** I see: recipe reference card header (thumbnail, dish name, servings, cook time), "Bạn đã có" section with owned ingredients (pre-checked checkboxes), "Cần mua thêm 🛒" section with missing ingredients (unchecked, accent + ⚠️), TipCard, "Lưu danh sách" primary button, "Chia sẻ" secondary button (native Share Sheet), "Sao chép" ghost button in top bar.
- **Given** I tap a checkbox on a missing item, **When** it toggles to checked, **Then** The item shows line-through + `--muted` color. Visual change is not color-alone. Checkbox state persists in session — navigating away and back preserves checked state via `dataStore` or route params.
- **Given** I tap "Sao chép", **When** pressed, **Then** Shopping list copied as plain text with toast "📋 Đã sao chép danh sách".
- **Given** I tap "Chia sẻ", **When** pressed, **Then** Native Share Sheet opens with the shopping list as plain text (Expo `Share.share()` API).
- **Given** I tap "Lưu danh sách", **When** pressed, **Then** List saved to SQLite `shopping_lists_guest` table (guest) or API (authenticated). Toast "✅ Đã lưu danh sách mua sắm".
- **Given** all items are checked, **When** both sections fully toggled, **Then** All items show crossed-through. A completion banner appears: "🎉 Mua sắm hoàn tất!" with confetti-like feedback or a subtle celebration state.
- **Given** loading/error/empty states, **When** those occur, **Then** Skeleton (header + 4-5 item bars), error toast with back, "Không có nguyên liệu nào" EmptyState.

**Technical Tasks:**
- [ ] Implement `frontend/app/shopping-list.tsx` — ShoppingListScreen with full layout
- [ ] Wire recipe reference card — dish thumbnail, name, servings, cook time from route params
- [ ] Wire owned items section — pre-checked checkboxes, `<input type="checkbox">` with `<label>`, "Bạn đã có" heading
- [ ] Wire missing items section — unchecked checkboxes, accent color + ⚠️, "Cần mua thêm 🛒" heading
- [ ] Wire checkbox toggle with session persistence — store checked state in component state or `dataStore`, survive back-navigation
- [ ] Wire TipCard — provide actual savings suggestion content (not placeholder text; reference UX spec or write Vietnamese content)
- [ ] Wire "Lưu danh sách" — save to SQLite `shopping_lists_guest` table (guest) or API (authenticated, Epic 4), toast feedback
- [ ] Wire "Chia sẻ" — Expo `Share.share()` for native Share Sheet
- [ ] Wire "Sao chép" — Clipboard API, toast feedback
- [ ] Wire post-completion state — when all items checked, show completion banner
- [ ] Implement 5 UX states: loading, error, offline, empty, success (all checked state)
- [ ] Add accessibility: checkboxes with proper `<label>` association, list structure

---

## Story 2.7: Search Relevance Guardrails

As a **user**,
I want recipe search results to only show dishes that are actually related to the ingredients I entered,
So that tapping "Tìm món" does not return irrelevant dishes that break trust in the search experience.

**Acceptance Criteria:**

- **Given** I search with one or more ingredients, **When** the backend returns result cards, **Then** every returned dish must share at least one normalized ingredient token with the user input or be explicitly classified as a partial match fallback with a low `matchPercentage`.
- **Given** the LLM returns dishes whose ingredient lists do not overlap the user's normalized ingredients, **When** the search service validates the response, **Then** those dishes are discarded before the API response is sent or cached.
- **Given** the LLM returns no valid overlapping dishes after relevance validation, **When** the service completes the search, **Then** it falls back to the seed matcher / deterministic ingredient-overlap path instead of returning unrelated dishes.
- **Given** a search result is shown in ResultsScreen, **When** the card renders, **Then** the `matchPercentage` is derived from real ingredient overlap rules and stays consistent with the returned ingredient list.
- **Given** cached search data exists for an ingredient+tag+cookTime combination, **When** the cache was generated before the relevance guardrail fix or contains invalid non-overlapping dishes, **Then** the service bypasses or refreshes that cache entry so stale irrelevant dishes are not served.
- **Given** regression tests run for recipe search, **When** they exercise LLM, degraded, and cached result paths, **Then** they verify that non-overlapping dishes are rejected and that partial matches remain available only when relevant.

**Technical Tasks:**
- [ ] Add a shared relevance validator for ingredient search results in `backend/packages/shared/src/services/seedMatcher.ts` or a nearby shared search utility
- [ ] Normalize Vietnamese and English ingredient tokens consistently across user input, seed recipes, and LLM-returned ingredient lists
- [ ] Update `backend/apps/express-api/src/api/recipes/recipesService.ts` to validate LLM dishes before caching or returning them
- [ ] Add a deterministic fallback path when all LLM dishes fail relevance validation
- [ ] Version or invalidate recipe-search cache keys so stale pre-fix results are not reused
- [ ] Tighten `backend/packages/shared/src/services/prompts.ts` so the LLM is instructed to only return dishes with real ingredient overlap and truthful `matchPercentage`
- [ ] Add regression tests for:
  - [ ] LLM result with zero ingredient overlap is dropped
  - [ ] Mixed LLM payload keeps overlapping dishes and discards unrelated dishes
  - [ ] Empty validated LLM payload falls back to seed matching
  - [ ] Cached invalid payload is refreshed or ignored
  - [ ] Unknown ingredient still returns low-score partial matches rather than unrelated dishes
