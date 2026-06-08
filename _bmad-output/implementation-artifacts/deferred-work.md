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
