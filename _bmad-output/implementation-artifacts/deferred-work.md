# Deferred Work

## Deferred from: code review of 2-1-llm-integration (2026-06-10)

- **`as never` passthrough schema** — Zod schemas can't be serialized over HTTP; validation happens at express-api layer. Architectural decision, not a bug.
- **Anthropic JSON regex extraction fragile** — Anthropic lacks native JSON mode; current best-effort regex extraction is sufficient for prompted JSON outputs.
- **`JSON.parse` reviver only guards `__proto__`** — Zod validation at express-api layer provides safety. Seed matcher fallback also protects against bad cached data.

## Deferred from: code review of Stories 1.8-1.10 (2026-06-05)

## Deferred from: code review of story 4-3-auth-store-storage-adapter (2026-06-17)

- **useProxy may fail in production builds** [authStore.ts:175] — `makeRedirectUri({ useProxy: true })` requires custom URL scheme for standalone builds. Requires separate configuration.
- **performTokenRefresh does not retry original request** [authStore.ts:255-310] — AC5 retry happens in api.ts `createApiClient`, not in the store. Existing architecture.
- **initialize() never invoked automatically** [authStore.ts:52-68] — AC1 observable behavior works; app code calls `initialize()` in profile.tsx. Explicit call is correct pattern.

- **Docker JWT_SECRET empty string bypasses Zod default → crash at startup** (`docker-compose.yml`): Docker Compose resolves `${JWT_SECRET}` to empty string; Zod `.default()` only fires when key is undefined, not empty string. Fix: add fallback `${JWT_SECRET:-replace-with-a-long-secret}` in docker-compose or preprocess env.
- **Server listens before DB/Redis ready** (`backend/src/index.ts`): `server.listen()` fires before `Promise.allSettled([connectDatabase(), connectRedis()])` resolves. Container healthcheck passes but DB may not be connected. Fix: swap order — await DB connections before listening.
- **JWT payload JSON.parse throws 500 instead of 401** (`backend/src/common/middleware/authenticate.ts`): Malformed JWT payload causes SyntaxError → 500. Should be caught and rethrown as AuthenticationError.
- **parseIngredients silently discards all input when >20 unique** (`frontend/lib/parseIngredients.ts`): Returns empty array instead of truncating or erroring. Users see "no results" with no explanation.
- **i18n hydrateLanguage race condition** (`frontend/lib/i18n.ts`): Language loaded from AsyncStorage after first render. Non-Vietnamese users see Vietnamese strings briefly before flicker.
- **SQLite connection never closed** (`frontend/stores/storageAdapter.ts`): Guest DB connection remains open after logout. Minor mobile concern, expo-sqlite manages lifecycle.
- **formatTime/formatDistance no NaN/Infinity guards** (`frontend/lib/formatTime.ts`): Negative, NaN, or Infinity values render garbage strings like "NaN min".
- **CI skips all model tests when MongoDB unavailable** (`.github/workflows/ci-backend.yml`): ~~All Mongoose model tests skipped silently, CI passes green but data layer has zero coverage.~~ ✅ **Fixed** — added MongoDB 8 service container to CI job with `MONGO_URI` env var.
- **llm-proxy hardcoded port, no error listener** (`backend/src/llm-proxy.ts`): Port 3001 hardcoded, EADDRINUSE crashes unhandled.
- **ErrorBoundary.reset() doesn't remount children** (`frontend/components/ErrorBoundary.tsx`): Reset sets error:null but children retain state. Corrupted child state re-triggers same error → crash loop.

## Deferred from: code review of 2-4-results-screen (2026-06-11)

- **Toast churn during pagination** — In `results.tsx`, `addToast` inside `useEffect` dependency may fire multiple toasts on rapid pagination. Toast component caps at MAX_TOASTS=3, so UX impact is minimal.
- **Stale closure in `handleSearch` — `homeStatus` reference** — `handleSearch` reads `homeStatus` from `useDataStore.getState()` which is always fresh. Not a real bug.
- **`activeFilters` single subscription re-renders on any filter change** — Minor perf issue. Fix: select individual filter properties.
- **`fetchDishes` stub returns cached data, not API** — Architectural decision for MVP. Will be replaced when backend is connected.
- **`fetchSurpriseMe` always falls to `homeStatus: 'empty'`** — Stub returns no data. Will be connected in later epic.
- **`parseIngredients` silently returns `[]` on >20 deduped** — Caller (`handleSubmitEditing`) already checks `rawItems.length > 0` and shows toast. Working as intended.
- **Offline banner shown redundantly — `isConnected` check in `useEffect` + offline detection double-fires** — Minor duplicate UX, no crash.
- **`handleSubmitEditing` shows toast for both empty input AND max-ingredients violation** — Toast message is "Tối đa 20 nguyên liệu" which is correct for the max-ingredients case.
- **No `useCallback` on `renderSortItem` / `renderCardItem` functions in FlatList** — FlatList inline functions create new refs each render. Minor perf — not noticable on expected list sizes (10-30 items).
- **`useFocusEffect` in ResultsScreen may double-fire on navigation transitions** — Callback guard (`mountedRef`) prevents second execution.

## Deferred from: code review of 2-3-home-screen (2026-06-11)

- **Chip uses `×` (U+00D7) instead of `✕` (U+2715)** — Chip component in "must not change" list, pre-existing
- **NetworkStatusProvider hardcodes Vietnamese strings** — Pre-existing issue in networkStatus.tsx, not part of this story
- **`animRefs` Map may leak entries on interrupted animations** — Low impact edge case
- **No keyboard dismissal on search press** — Minor UX polish
- **Nested Pressable in Chip may propagate tap to outer** — Chip in "must not change" list, pre-existing
- **CollapsibleSection uses character swap instead of 180° rotation** — Component in "must not change" list, pre-existing
- **Error toasts lack retry action** — Toast component doesn't support actions
- **Nested ScrollViews (vertical + horizontal) on iOS** — Platform-specific, likely works
- **Toast fade-out animation dead code when onDismiss provided** — Minor, no UX impact
- **`parseIngredients` returns `[]` for both empty and too many** — Caller duplicates logic
- **Input not disabled during async search/surprise** — Minor UX polish
- **`useRecipes` subscriptions (`dishes`, `homeStatus`) unused in HomeScreen** — Minor perf

## Deferred from: code review of 2-2-recipes-api-module (2026-06-11)

- **Module-level mutable state `lastSurpriseDishId`** (`recipesService.ts:189-191`): Not safe under concurrent/multi-instance deployments, but acceptable for MVP.
- **Race condition in `surpriseMe()`** (`recipesService.ts`): Read-modify-write of `lastSurpriseDishId` not atomic under concurrent requests; fine for single-process MVP.
- **`getDishById` reads `req.params` instead of `req.validated`** (`recipesController.ts`): Functionally equivalent, but inconsistent with search/surprise handler pattern.
- ~~**`searchSeedRecipes` filters zero-match dishes** (`seedMatcher.ts:84-85`): Pre-existing behavior in shared code; not modified by this story.~~ ✅ **Won't fix** — intentional: dishes with 0% ingredient match are correctly excluded from results.

## Deferred from: code review of 2-6-shopping-list-screen (2026-06-11)

- **Ingredient names containing commas break comma-separated parsing** (`frontend/app/shopping-list.tsx:91-97`): Upstream contract issue — RecipeScreen serializes ingredients as comma-separated list, but ingredient names may contain commas. Fix requires coordinate change across screens.
- **Skeleton timeout hardcoded to 600ms** (`frontend/app/shopping-list.tsx:160-163`): Intentional for MVP — route params are synchronous so no actual fetch to await.
- **`remove` for `shopping_lists_guest` uses `dishId` column instead of `id`** (`frontend/stores/storageAdapter.ts:240`): Pre-existing pattern in `remove()` function; `remove` not called in this story.
- **`remove` for `search_history_guest` uses non-existent `dishId` column** (`frontend/stores/storageAdapter.ts:240`): Pre-existing bug in `remove()` function; not introduced by this story.

## Deferred from: code review of story 3-2-discovery-api-module (2026-06-10)

- **No rate limiting on `POST /generate`** (`llm-proxy/src/index.ts`): Infrastructure concern, applies to all endpoints, not specific to this story.
- **Thundering herd on cache miss** (`discoveryService.ts:197-229`): Multiple concurrent cache misses could all call LLM simultaneously. Acceptable for MVP; add cache mutex in future optimization.
- **Empty HERE results skip Overpass fallback** (`services/index.ts:50-53`): Design behavior — circuit breaker returns HERE results when non-empty. Acceptable for MVP.
- **Validation error responses lack `requestId`** (`discoveryController.ts`): Pre-existing response shape inconsistency between validation errors (no meta) and error handler (includes meta.requestId).
- **LLM proxy `/generate` no auth** (`llm-proxy/src/index.ts`): Open proxy endpoint, acceptable as internal service behind network boundary.
- **Polar latitude could cause NaN bounding box** (`overpassClient.ts`): Extreme edge case for lat=±90°, irrelevant to SE Asia geography.

## Deferred from: second code review of story 3-2-discovery-api-module (2026-06-10)

- **Dockerfile regression** (`backend/Dockerfile`): Single-stage build replaces multi-stage; removes compilation step. May cause production runtime failures.
- **Real-mode JWT auth test coverage** (`backend/packages/shared/tests/authenticate.test.ts`): Tests removed because env is loaded at import time (can't test real mode). Pre-existing limitation requiring env module refactoring.
- **`tests/` removed from `tsconfig.json` include** (`backend/apps/express-api/tsconfig.json`): Test files no longer type-checked by `tsc`.
- **Hardcoded Gemini provider in `callLlmForTrending`** (`discoveryService.ts`): `provider: "gemini"` is hardcoded; switching provider requires changes in two places. Acceptable for MVP.
- **Cache-set failure leads to repeat LLM calls** (`discoveryService.ts`): When `redis.setex()` fails, the next request sees a cache miss and calls LLM again. Acceptable for MVP.
- **`getNearby` has no caching** (`discoveryService.ts`): Every nearby request goes to HERE Maps regardless of same lat/lng/radius. Add 60s caching later.
- **Seed fallback warning floods logs** (`discoveryService.ts`): Rate-limit warning to first failure, then debug until success.
- **Stub mode accepts any `x-user-id`** (`authenticate.ts`): By design for development; production requires real `JWT_SECRET`.
- **Response format inconsistency (meta field)** (`discoveryController.ts`, `errorHandler.ts`): Controller `buildErrorResponse` lacks `meta` field that error handler's `ServiceResponse.failure` includes. Pre-existing.
- **Seed price filter brittle** (`discoveryService.ts`): Not applicable to current code; seed items all use explicit `priceRange` strings.

## Deferred from: code review of 4-1-auth-api-module (2026-06-16)

- **In-memory rate limiter not shared across processes** (`authRouter.ts:14`): Pre-existing architecture limitation; each process/worker maintains its own counter. Multi-instance deployments can bypass the 5-request-per-minute limit by distributing requests across instances.

## Deferred from: code review of 4-2-login-screen (2026-06-16)

- **Google button text hardcoded** (`frontend/components/LoginScreen.tsx:183`): "Tiếp tục với Google" hardcoded instead of using `t()`. Deferred to Story 4.3 which will wire the real Google OAuth flow.
- **Rate-limit cooldown lost on component remount** (`frontend/components/LoginScreen.tsx:35,77`): `isRateLimited` is local component state. Navigating away and back resets the 5-minute cooldown. The server enforces the real limit, so this is UX sugar only.

## Deferred from: code review of 4-4-favorites-api-module (2026-06-17)

- **Stub-mode userId causes Mongoose CastError** — authenticate.ts stub mode sets userId as x-user-id string value (not valid ObjectId). Pre-existing authenticate behavior, not caused by favorites code.

## Deferred from: code review of 4-5-sync-api-module (2026-06-17)

- **Timestamp injection via client-controlled date** — `lastSyncAt` client value is used in `new Date()`. Pre-existing pattern; client timestamps are accepted by design for conflict comparison.
- **`Buffer.byteLength(JSON.stringify(req.body))` double-serialization** — Pre-existing pattern used in controller; minor memory overhead for oversized payloads.

## Deferred from: code review of 4-7-settings-api-module (2026-06-17)

- **Soft-deleted users can still authenticate** — `authenticate.ts` doesn't check `user.deletedAt`. Pre-existing, not caused by this story.
- **`theme` enum mismatch: Zod rejects "system", Mongoose allows it** — Pre-existing Mongoose model enum; dark mode deferred per FR-27.
- **`userId` from `x-user-id` bypasses ObjectId validation in stub mode** — Pre-existing `authenticate.ts` stub behavior; already documented above under 4-4-favorites-api-module.

## Deferred from: code review of 4-8-profile-settings-screens (2026-06-17)

- **No token refresh/re-auth pattern** — syncPreferences and clearAllFavorites use raw fetch instead of an API client that handles 401/retry. Pre-existing architecture pattern across all stores.
- **EXPO_PUBLIC_API_BASE_URL port inconsistency (8080 vs 3000)** — authStore defaults to 8080, dataStore/profile default to 3000. Pre-existing across all stores.
- **Tests verify string presence not behavior** — Most tests are simple string-match checks. By design for static-analysis tests per the story spec.

## Deferred from: code review of 4-10-authenticated-favorites-route-regression-fix (2026-06-24)

- **storageAdapter.read returns stale data for authenticated SQLite-only collections** — When authenticated and reading `favorites_guest` (a SQLITE_ONLY_COLLECTION), bypasses API and reads SQLite. But favorites were saved via API, not SQLite. Pre-existing design limitation.
- **Race: getTarget says 'api' but token null at request time** — If user logs out between `getTarget()` and token retrieval. Pre-existing race in auth state transitions.
- **Race: getTarget says 'sqlite' but user authenticates before write completes** — SQLite path runs even though user now authenticated. `guestToAuthenticated()` will sync later.
- **No favorites auto-reload after login/logout cycle** — After `logout` → `clearData()` then re-login, `fetchFavorites` never called. Existing gap.
- **fetchPreferences races with clearData during token refresh** — `performTokenRefresh()` failure calls `logout()` → `clearData()` while `fetchPreferences` continues. Pre-existing race.
- **searchDishes Date.now() ID collision risk** — Two searches in same millisecond produce identical `id` values. Pre-existing.
- **storageAdapter.write API path silently swallows all errors** — When authenticated and collection not in SQLITE_ONLY_COLLECTIONS, API write catches all errors and returns `void`. Pre-existing design.
- **Tests only static regex matching, no runtime verification** — All tests assert source code patterns. This is the project's existing test convention.
