# Deferred Work

## Deferred from: code review of Stories 1.8-1.10 (2026-06-05)

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
