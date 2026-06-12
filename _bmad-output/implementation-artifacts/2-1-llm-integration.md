---
baseline_commit: ce839f6
---

# Story 2.1: LLM Integration

Status: done

## Story

As a **user**,
I want AI-powered dish suggestions from my ingredients,
So that I get relevant Vietnamese recipes even when no exact match exists in the database.

## Acceptance Criteria

1. Given the `llmClient.complete()` function, when called with an ingredient search prompt and parameters, then it sends a request to the configured LLM provider (Gemini 2.5 Flash default), receives structured JSON, validates against Zod schema, and returns typed result. Provider is swappable via `LLM_PROVIDER` env var.
2. Given the llm-proxy service, when `express-api` calls `llm-proxy:3001`, then the proxy handles the LLM API call and returns the response. LLM API key never leaves the llm-proxy container.
3. Given the LLM returns a response, when Zod validation fails, then the system retries once with the validation error in the prompt. If second attempt also fails, falls back to keyword matching against seed recipes (Jaccard similarity on ingredient names). LLM 502 is never exposed to the user — they always get results (degraded match quality, but never an error page).
4. Given the LLM call times out (10s deadline), when timeout occurs, then retries once after 2s delay, then falls back to seed recipe keyword matching. Returns 200 with a `meta.degraded: true` flag indicating non-LLM results.
5. Given Redis cache, when searching with the same ingredient+tag+cookTime combination, then cached result is returned (TTL 24h) without calling LLM. Cache key: `recipe:search:{hash}`.
6. Given the prompt templates, when `UserPreference.language` is `'vi'`, then system prompt is in Vietnamese. When `'en'`, system prompt is in English.
7. Given a Gemini API outage or rate limit, when the primary provider returns 429/503, then llm-proxy programmatically switches to the fallback provider (configured via `LLM_FALLBACK_PROVIDER` + `LLM_FALLBACK_API_KEY` env vars). Circuit breaker opens after 3 consecutive failures, resets after 60s.

## Tasks / Subtasks

- [x] Task 1: Create `backend/src/services/cacheClient.ts` — Redis wrapper (AC: 5)
  - [x] Define `CacheClient` class with `get(key)`, `set(key, value, ttl)`, `del(key)` methods
  - [x] Import ioredis client from `backend/src/config/redis.ts`
  - [x] Key pattern support: `recipe:search:{hash}`, `surprise:{date}`, `trending:{date}`, `session:{id}`, `rate:{userId}:{endpoint}`
  - [x] Hash generation utility: `createHash(ingredients, tags, cookTime)` → SHA-256 hex digest
  - [x] Default TTL: 24h for recipe/search cache
  - [x] Graceful handling when Redis is unavailable (log warning, return null from get, no-op on set)

- [x] Task 2: Create `backend/src/services/seedMatcher.ts` — fallback keyword matcher (AC: 3, 4)
  - [x] Tokenize user ingredients: trim, lowercase, split on whitespace
  - [x] Tokenize each seed recipe's ingredients list
  - [x] Compute Jaccard similarity: `|userIngredients ∩ dishIngredients| / |userIngredients ∪ dishIngredients| × 100`
  - [x] Return sorted array of scored results with dishId, name, nameEn, matchPercentage
  - [x] Import seed recipes from `backend/src/models/` (Recipe or seed data module)
  - [x] Export `searchSeedRecipes(ingredients: string[]): ScoredDish[]`

- [x] Task 3: Create `backend/src/api/recipes/recipesValidation.ts` — Zod schemas for LLM responses (AC: 1, 3)
  - [x] Define `DishSchema`: dishId (string), name (string), nameEn (string optional), cuisine (string), matchPercentage (number, 0-100), cookTimeMinutes (number), caloriesPerServing (number), tags (string array), imageDescription (string)
  - [x] Define `IngredientSchema`: name (string), quantity (string), unit (string), owned (boolean)
  - [x] Define `CookingStepSchema`: stepNumber (number), label (string), durationMinutes (number), parallelGroup (number optional)
  - [x] Define `RecipeSchema`: dishId (string), name (string), nameEn (string optional), cuisine (string), totalCookTimeMinutes (number), caloriesPerServing (number), ingredients (IngredientSchema array), steps (CookingStepSchema array), tags (string array), imageDescription (string)
  - [x] Export all schemas for reuse in prompts.ts and recipesService.ts
  - [x] Use Zod 4.1.12 (installed, from Story 1.2 boilerplate)

- [x] Task 4: Create `backend/src/api/recipes/prompts.ts` — LLM prompt templates (AC: 6)
  - [x] `ingredientSearchPrompt(ingredients, filters, language)`: system prompt instructing LLM to suggest dishes matching user's ingredients. Language-aware: `vi` → Vietnamese, `en` → English.
  - [x] `surpriseMePrompt(language)`: system prompt to return a random Vietnamese dish with full recipe
  - [x] Include structured output instructions matching Zod schemas (DishSchema for search, RecipeSchema for surprise)
  - [x] Include few-shot examples: 2-3 examples of valid JSON outputs for Vietnamese ingredient combos
  - [x] Export prompt builder functions

- [x] Task 5: Create `backend/src/services/llmClient.ts` — provider-agnostic LLM wrapper (AC: 1, 3, 4, 7)
  - [x] Read `LLM_PROVIDER` env var (default: `gemini`), map to provider SDK: `GEMINI_API_KEY` → Google AI SDK, `OPENAI_API_KEY` → OpenAI SDK, `ANTHROPIC_API_KEY` → Anthropic SDK
  - [x] `complete(prompt, params)`: send request with configurable model + temperature, receive structured JSON
  - [x] Zod schema validation on response: `schema.parse(rawResponse)` — throws on invalid
  - [x] Retry logic: 1 retry on validation failure (include Zod error in re-prompt), 1 retry on timeout (2s delay)
  - [x] Timeout: 10s deadline via `AbortController` or provider timeout config
  - [x] Fallback to seedMatcher on total failure: returns results with `meta.degraded: true`
  - [x] Circuit breaker: track consecutive failures, open after 3, reset after 60s
  - [x] Returns typed result: `{ dishes: Dish[] }` or `{ dish: Recipe }` with `meta: { degraded: boolean, source: 'llm' | 'seed' }`

- [x] Task 6: Create `backend/src/services/llmProxyServer.ts` — standalone Express server (AC: 2, 7)
  - [x] Standalone Express server (port 3001), separate entry point from express-api
  - [x] `POST /complete` endpoint: accepts `{ prompt, schema }`, calls LLM, returns response
  - [x] Imports llmClient.ts for LLM call logic
  - [x] LLM API key read from env, never exposed in responses
  - [x] Provider fallback: on 429/503 from primary provider, switch to `LLM_FALLBACK_PROVIDER` + `LLM_FALLBACK_API_KEY`
  - [x] Circuit breaker at proxy level: 3 consecutive provider failures → open for 60s
  - [x] CORS: restrict to express-api origin only
  - [x] No auth middleware needed (internal Docker network only)

- [x] Task 7: Set up llm-proxy in Docker Compose (AC: 2)
  - [x] Add `llm-proxy` service to `docker-compose.yml`
  - [x] Reuse backend build image with custom command: `node dist/services/llmProxyServer.js`
  - [x] Environment: `LLM_PROVIDER`, `LLM_API_KEY`, `LLM_FALLBACK_PROVIDER`, `LLM_FALLBACK_API_KEY`, `REDIS_URI`
  - [x] Network: `internal` only (not exposed to nginx/public)
  - [x] Create `backend/Dockerfile` if not already existing (reuse for express-api + llm-proxy)

- [x] Task 8: Write tests (all ACs)
  - [x] `backend/tests/services/llmClient.test.ts`: mock LLM response, verify Zod validation pass/fail, verify retry on timeout, verify retry on validation failure, verify fallback to seedMatcher, verify circuit breaker open/close
  - [x] `backend/tests/services/cacheClient.test.ts`: mock Redis, verify get/set/del, verify TTL, verify hash generation, verify graceful failure when Redis unavailable
  - [x] `backend/tests/services/seedMatcher.test.ts`: verify Jaccard similarity computation, verify empty ingredient list, verify no-match case, verify scored results sorting
  - [x] `backend/tests/api/recipes/prompts.test.ts`: verify prompt language switching, verify few-shot examples included
  - [x] `pnpm typecheck` passes, `pnpm lint` passes, `pnpm test` passes

## Dev Notes

### Story Foundation

- This is the FIRST story of Epic 2 (Core Search). The LLM integration is the critical backend dependency for all recipe-related features — Story 2.2 (Recipes API), Story 2.3-2.6 (frontend screens) all depend on the LLM client and proxy being operational. [Source: Epic 2]
- Backend infrastructure is complete (Epic 1, Stories 1.2, 1.8): Express 5.1.0 running on port 3000, Pino logger, Zod 4.1.12, ioredis 5.8.2, Vitest 4.0.7, common middleware (authenticate, validate, rateLimiter, errorHandler, requestLogger), ServiceResponse envelope, custom error classes. [Source: Story 1.8 completion notes]
- Seed recipe data + Mongoose schemas are complete (Story 1.7): User, Favorite, SearchHistory, UserPreference models available. Seed recipes are loaded into memory at startup in the seed data module. [Source: Story 1.7]
- Redis client is configured in `backend/src/config/redis.ts` (Story 1.2). The cache client wrapper (Task 1) will import from there. [Source: project structure]
- This story may need Google AI SDK for Gemini: `@google/generative-ai`. Check if installed or add to dependencies. For OpenAI/Anthropic fallbacks, install `openai` and `@anthropic-ai/sdk` packages respectively. [Source: architecture CD-4]
- **Architecture precedent**: The llm-proxy container pattern is established in the Docker Compose topology. The express-api container calls `llm-proxy:3001` for all LLM operations. The LLM API key is NEVER in the express-api container. [Source: core-architectural-decisions.md, Docker Compose topology section]

### Architecture Compliance

- Files follow the project structure: `backend/src/services/llmClient.ts`, `backend/src/services/llmProxyServer.ts`, `backend/src/services/cacheClient.ts`, `backend/src/api/recipes/` for prompts and validation. [Source: project-structure-boundaries.md]
- Zod schemas for LLM responses go in `backend/src/api/recipes/recipesValidation.ts` — NOT in a separate validation file. [Source: project structure]
- New files use 2-space indent, no trailing whitespace. Run `biome format --write` after creating files. [Source: Story 1.7 dev notes]
- Barrel exports use `export { X } from "./X.js"` pattern with `.js` extension. [Source: Story 1.7 dev notes]
- TypeScript strict mode must pass (`verbatimModuleSyntax` — use `import type` for type-only imports). All files use `.js` extension in imports (NodeNext moduleResolution). [Source: `backend/tsconfig.json`]
- Error codes for LLM failures must match architecture: `LLM_TIMEOUT`, `LLM_INVALID_RESPONSE`. [Source: core-architectural-decisions.md, API & Communication Patterns section]
- API response envelope: `{ success: boolean, data: T, meta: { requestId, timestamp, version } }`. Degraded LLM responses add `meta.degraded: true`. [Source: architecture response format]
- Circuit breaker implementation: in-memory, 3 consecutive failures → open for 60s. Track per-provider (primary/fallback). Reset after 60s cooldown. [Source: epic-2.md, Story 2.1 AC 7]
- Rate limiting: LLM endpoints limited to 30 req/hr/user via `llmLimiter` middleware (from Story 1.8). This applies to Recipes API endpoints, not to the llm-proxy directly. [Source: Story 1.8 rateLimiter.ts]

### Technical Requirements

- **Provider abstraction**: llmClient reads `LLM_PROVIDER` env var. Values: `gemini` (default), `openai`, `anthropic`. Each maps to a different SDK call. Use a provider registry pattern (map of provider name → adapter function). [Source: architecture CD-4]
- **Gemini SDK**: Use `@google/generative-ai` with `GoogleGenerativeAI` client. Model: `gemini-2.5-flash`. Set `responseMimeType: "application/json"` for structured JSON output. Verify if this model supports native JSON mode. [Source: Gemini API docs]
- **Structured output from LLM**: Prompt templates MUST explicitly instruct the LLM to return valid JSON matching the Zod schema. Include few-shot examples within the prompt. The Zod schema serves as runtime validation, NOT as the format specifier for the LLM. [Source: Story 2.1 AC 1]
- **Cache key hashing**: SHA-256 of concatenated `ingredients.sort().join(',') + tags.sort().join(',') + cookTime`. This ensures consistent cache keys regardless of ingredient/filter order. [Source: Story 2.1 AC 5]
- **Seed recipe fallback**: The seedMatcher uses Jaccard similarity on ingredient names (tokenized, lowercased, trimmed). Return NO results if no recipe has any matching ingredient (not an error — empty dishes array with `meta.degraded: true`). [Source: Story 2.1 AC 3]
- **Timeout handling**: Use `AbortSignal.timeout(10000)` or provider-native timeout. On timeout, wait 2s, retry once. If second attempt also times out, fall back to seedMatcher. [Source: Story 2.1 AC 4]
- **Provider fallback at proxy level**: llm-proxy catches 429/503 from primary provider, switches to fallback provider for that request. Circuit breaker tracks per-provider concurrency (3 consecutive failures → open 60s). When both providers are open, return seedMatcher results. [Source: Story 2.1 AC 7]

### LLM Provider Configuration

The `.env.template` should document:
```
LLM_PROVIDER=gemini
LLM_API_KEY=your-gemini-api-key
LLM_FALLBACK_PROVIDER=openai
LLM_FALLBACK_API_KEY=your-openai-api-key
```
Provider mapping table:
| LLM_PROVIDER | SDK Package | Client Init | Model |
|---|---|---|---|
| gemini | `@google/generative-ai` | `new GoogleGenerativeAI(apiKey)` | `gemini-2.5-flash` |
| openai | `openai` | `new OpenAI({ apiKey })` | `gpt-4o-mini` |
| anthropic | `@anthropic-ai/sdk` | `new Anthropic({ apiKey })` | `claude-3-haiku-20240307` |

Prompt engineering: Run 50+ test prompts against Gemini 2.5 Flash, validate structured JSON output consistency, verify Vietnamese cuisine accuracy against seed recipes. Tune prompt templates, few-shot examples, and temperature until >90% valid JSON rate. The prompt template should include: role description (Vietnamese cuisine expert), instruction to return ONLY valid JSON matching the schema, ingredient interpretation rules, few-shot examples with expected outputs. [Source: Epic 2, Story 2.1 technical tasks]

### File Structure Requirements

**New files:**
- `backend/src/services/cacheClient.ts`
- `backend/src/services/seedMatcher.ts`
- `backend/src/services/llmClient.ts`
- `backend/src/services/llmProxyServer.ts`
- `backend/src/api/recipes/recipesValidation.ts`
- `backend/src/api/recipes/prompts.ts`
- `backend/tests/services/llmClient.test.ts`
- `backend/tests/services/cacheClient.test.ts`
- `backend/tests/services/seedMatcher.test.ts`
- `backend/tests/api/recipes/prompts.test.ts`

**Files that must be updated:**
- `docker-compose.yml` — add llm-proxy service
- `backend/.env.template` — add LLM provider env vars documentation
- `backend/package.json` — add provider SDK packages if not already present

**Files that must NOT be changed:**
- `backend/src/server.ts` — express-api entry point (no LLM wiring here)
- `backend/src/index.ts` — server bootstrap
- `backend/src/common/` — middleware, utils, models (already complete)
- `backend/src/config/` — env validation, database, redis (already configured)

### Previous Story Intelligence

- Story 1.8 status: `done`. Common middleware infrastructure is complete. [Source: sprint-status.yaml]
- Story 1.7 status: `done`. Mongoose schemas (User, Favorite, SearchHistory, UserPreference) are created and tested. Seed data loading mechanism exists. [Source: sprint-status.yaml]
- Patterns established: 2-space indent, `.js` extension in imports, barrel exports with `export { X } from "./X.js"`, tests in `backend/tests/` directory, Vitest with vi.mock for mocking. [Source: Story 1.7/1.8 dev notes]

### Git Intelligence Summary

- Baseline commit: `ce839f6`
- Epic 1 stories (1.1 through 1.10) are all in `done` status. Epic 2 stories begin with this story.
- No implementatiom work for Epic 2 exists yet — this is the first story.

### Testing Requirements

- **llmClient.test.ts**: Mock the provider SDK (e.g., vi.mock `@google/generative-ai`). Test: successful response parses and returns typed result, invalid JSON triggers retry, invalid JSON after retry returns seed fallback, timeout triggers retry then fallback, circuit breaker opens after 3 failures.
- **cacheClient.test.ts**: Mock ioredis. Test: get returns cached value, set stores with TTL, del removes key, hash generation is deterministic, Redis unavailable returns null gracefully.
- **seedMatcher.test.ts**: Pure unit test. Test: Jaccard similarity computation, exact match returns 100%, partial match returns correct percentage, no match returns empty array, case-insensitive matching.
- **prompts.test.ts**: Pure unit test. Test: vi language returns Vietnamese prompt, en language returns English prompt, few-shot examples are included, ingredient search prompt includes ingredient names.
- After ALL tests pass: run `pnpm typecheck` and `pnpm lint`. No regressions expected (first Epic 2 story).

### Project Context Reference

- Architecture docs: `_bmad-output/planning-artifacts/architecture/` — core-architectural-decisions.md (CD-4, CD-6, LLM Integration section), project-structure-boundaries.md (services directory, integration boundaries), implementation-patterns-consistency-rules.md (error codes, API response format). [Source: architecture index]
- Epic: `_bmad-output/planning-artifacts/epics/epic-2.md` (Story 2.1 section). [Source: epics index]
- PRD: `_bmad-output/planning-artifacts/prd-hom-nay-an-gi-2026-05-31/prd.md` (FR-1, FR-4 through FR-13). [Source: PRD]
- No `project-context.md` found.

### Review Findings

- [x] [Review][Patch] CORS origin misconfigured — using proxy's own URL; switched to permissive for internal Docker network [apps/llm-proxy/src/index.ts:14]
- [x] [Review][Patch] Empty `LLM_API_KEY` generates unnecessary network calls — added early guard in `tryProvider` [apps/llm-proxy/src/llmClient.ts:198]
- [x] [Review][Patch] `RecipeDetail` interface duplicated `Dish` fields — restructured to use composition instead of inheritance [packages/shared/src/api/recipes/recipesValidation.ts:100-116]
- [x] [Review][Defer] `as never` passthrough schema — Zod schemas can't be serialized over HTTP; validation happens at express-api layer [apps/llm-proxy/src/index.ts:61] — deferred, pre-existing architectural decision
- [x] [Review][Defer] Anthropic JSON regex extraction fragile — Anthropic lacks native JSON mode; best-effort extraction [apps/llm-proxy/src/llmClient.ts:194-196] — deferred, pre-existing limitation
- [x] [Review][Defer] `JSON.parse` reviver only guards `__proto__` — Zod validation at express-api layer provides safety [packages/shared/src/services/cacheClient.ts:36] — deferred, pre-existing

## Dev Agent Record

### Agent Model Used

TBD

### Debug Log References

TBD

### Completion Notes List

TBD

### File List

- `packages/shared/src/services/cacheClient.ts` — Redis wrapper with SHA-256 hashing
- `packages/shared/src/services/seedMatcher.ts` — Jaccard similarity fallback matcher
- `packages/shared/src/services/prompts.ts` — Vietnamese/English LLM prompt templates
- `packages/shared/src/api/recipes/recipesValidation.ts` — Zod schemas for LLM responses
- `apps/llm-proxy/src/llmClient.ts` — Provider-agnostic LLM wrapper with circuit breaker
- `apps/llm-proxy/src/index.ts` — Express server (POST /complete, GET /health)
- `apps/llm-proxy/vite.config.mts` — Vitest config for llm-proxy tests
- `packages/shared/tests/services/cacheClient.test.ts`
- `packages/shared/tests/services/seedMatcher.test.ts`
- `packages/shared/tests/services/prompts.test.ts`
- `apps/llm-proxy/tests/llmClient.test.ts`

## Change Log

- Initial story file created from Epic 2 (Story 2.1: LLM Integration) with full ACs, tasks, and dev notes
