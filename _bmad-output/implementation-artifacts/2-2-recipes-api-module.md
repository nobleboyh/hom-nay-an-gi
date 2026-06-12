---
baseline_commit: ce839f6
---

# Story 2.2: Recipes API Module

Status: done

## Story

As a **frontend developer**,
I want RESTful recipe endpoints (search, surprise, get recipe),
So that the app can search dishes by ingredients, get full recipe details, and support the Surprise Me feature.

## Acceptance Criteria

1. Given `GET /api/v1/recipes/search?ingredients=chicken,broccoli&tags=Vietnamese&cookTime=30&offset=0&limit=10`, when called, then returns `{ success: true, data: { dishes: [...], total, offset, limit } }` where each dish has: dishId, name, nameEn, cuisine, matchPercentage, cookTimeMinutes, caloriesPerServing, tags, imageDescription. matchPercentage formula: For seed results, `|userIngredients ∩ dishIngredients| / |userIngredients ∪ dishIngredients| × 100` (Jaccard similarity). For LLM results, the LLM provides matchPercentage in its structured output. When LLM path is degraded, `meta.degraded: true` is set.
2. Given `GET /api/v1/recipes/surprise`, when called, then returns a random dish. No two consecutive calls return the same dishId.
3. Given `GET /api/v1/recipes/:dishId`, when called with a valid dishId, then returns full recipe: dish metadata + ingredients array + steps array (with label, durationMinutes, parallelGroup) + totalCookTimeMinutes + caloriesPerServing.
4. Given the search endpoint, when called with `offset` and `limit`, then returns paginated results with `total` count. Default limit: 10.
5. Given search with 0 ingredients, when called with only filters, then returns all dishes matching filters (no ingredient constraint).
6. Given search with an unknown ingredient, when called, then returns partial matches with lower match percentages instead of empty results.

## Tasks / Subtasks

- [x] Task 1: Create `packages/shared/src/api/recipes/recipesValidation.ts` — Zod schemas for request params (AC: 1, 3, 4)
  - [x] Define `SearchRecipesSchema`: ingredients (optional string), tags (optional string, comma-delimited), cookTime (optional number), offset (optional number, default 0), limit (optional number, default 10, max 50)
  - [x] Define `SurpriseMeSchema`: no params required (empty schema)
  - [x] Define `DishDetailSchema`: dishId (string, param)
  - [x] Integer coercion for numeric params: `z.coerce.number()` for offset/limit/cookTime
  - [x] Export schemas for use in controller and validation middleware
  - [x] Use Zod 4.1.12 (installed)

- [x] Task 2: Create `backend/apps/express-api/src/api/recipes/recipesService.ts` — business logic (AC: 1, 2, 3, 4, 5, 6)
  - [x] `searchByIngredients(ingredients, filters, options)`: check Redis cache → call llmClient → validate + cache → return. Cache key: `recipe:search:{hash}`. Returns `{ dishes: Dish[], total: number }`
  - [x] `getRecipe(dishId)`: lookup from cache or seed data. If seed recipe, return full Recipe object. If dishId not found, throw `NotFoundError("Recipe")`.
  - [x] `surpriseMe()`: random dish from seed data. Track last returned dishId in memory to avoid consecutive duplicates. Return full Recipe object.
  - [x] Import llmClient, cacheClient, seedMatcher from services/
  - [x] Pagination: slice results array by offset + limit, return total count
  - [x] Degraded mode: when llmClient returns meta.degraded, pass through to response

- [x] Task 3: Create `backend/apps/express-api/src/api/recipes/recipesController.ts` — request handling (AC: 1, 2, 3, 4)
  - [x] `searchRecipes(req, res)`: parse `req.validated` (from validate middleware), call `recipesService.searchByIngredients()`, format response via `ServiceResponse.success()`
  - [x] `getSurpriseDish(req, res)`: call `recipesService.surpriseMe()`, return single dish
  - [x] `getDishById(req, res)`: call `recipesService.getRecipe(req.params.dishId)`, return full recipe
  - [x] Import `asyncHandler` from common middleware for async error wrapping
  - [x] Import `ServiceResponse` for response formatting

- [x] Task 4: Create `backend/apps/express-api/src/api/recipes/recipesRouter.ts` — route definitions (AC: 1, 2, 3)
  - [x] `GET /search` → llmLimiter → validate(SearchRecipesSchema) → controller.searchRecipes
  - [x] `GET /surprise` → validate(SurpriseMeSchema) → controller.getSurpriseDish
  - [x] `GET /:dishId` → validate(DishDetailSchema) → controller.getDishById
  - [x] All routes use `authenticate` middleware as OPTIONAL (guest mode supported). Use `authenticate` stub mode (x-user-id header) from Story 1.8.
  - [x] Export router for mounting in server.ts

- [x] Task 5: Load seed recipes into memory at startup (AC: 2, 3)
  - [x] Create loader module — `apps/express-api/src/data/seedLoader.ts`
  - [x] Read seed recipes from JSON seed file at app startup
  - [x] Store in memory Map: `dishId → Recipe` for O(1) lookup
  - [x] Store ingredients index for seedMatcher fallback (Story 2.1)

- [x] Task 6: UPDATE `backend/apps/express-api/src/server.ts` — mount recipes router (all ACs)
  - [x] Add `import { recipesRouter } from "./api/recipes/recipesRouter.js"`
  - [x] Mount: `app.use("/api/v1/recipes", recipesRouter)`
  - [x] Mount after auth middleware, before errorHandler

- [x] Task 7: Write router tests (all ACs)
  - [x] `backend/apps/express-api/tests/api/recipes/recipesRouter.test.ts`: search with valid params, search with no params (defaults), surprise returns dish, getRecipe valid returns recipe, getRecipe invalid returns 404, pagination offset/limit works, search with 0 ingredients, search with unknown ingredient returns partial matches, degraded LLM path
  - [x] Mock llmClient, cacheClient, seedMatcher in tests
  - [x] Use Supertest to mount app and hit endpoints
  - [x] `pnpm typecheck` passes, `pnpm lint` passes, `pnpm test` passes (12/12 tests)

## Dev Notes

### Story Foundation

- This story depends on Story 2.1 (LLM Integration) — the llmClient, cacheClient, seedMatcher, and prompt templates must be operational. Run Story 2.1 tests first to verify. [Source: dependency-graph]
- Backend infrastructure from Story 1.8 is complete: authenticate middleware (stub mode), validate middleware, ServiceResponse envelope, asyncHandler, rateLimiter. [Source: Story 1.8]
- Seed recipe data from Story 1.7 is available. Recipes are stored in MongoDB with Mongoose schemas. [Source: Story 1.7]
- The `backend/apps/express-api/src/server.ts` already has helmet, CORS, JSON parser, requestLogger, generalLimiter, notFoundHandler, and errorHandler wired. [Source: Story 1.8 completion notes]
- Rate limiting for LLM-dependent endpoints: `llmLimiter` (30 req/hr/user) should be applied to the search endpoint. The surprise endpoint does NOT use LLM (seed data only), so the generalLimiter is sufficient. [Source: Story 1.8 rateLimiter.ts]

### Architecture Compliance

- Route structure follows the API Route Map: `GET /api/v1/recipes/search`, `GET /api/v1/recipes/surprise`, `GET /api/v1/recipes/:dishId`. [Source: core-architectural-decisions.md, API Route Map section]
- Response format: standard envelope `{ success: true, data: { dishes: [...], total, offset, limit }, meta: { requestId, timestamp, version } }`. Degraded responses add `meta.degraded: true`. [Source: architecture API design]
- Error format for invalid dishId: `{ success: false, error: { code: "NOT_FOUND", message: "Recipe not found" }, meta: {...} }`. [Source: architecture error codes]
- Pagination: offset-based `{ offset, limit, total }`. Default limit: 10. Max limit: 50. [Source: Story 2.2 AC 4]
- Recipe data shapes match the component tree specification: Dish (summary for search results) and Recipe (full details with ingredients + steps). [Source: core-architectural-decisions.md, Component Tree section]
- TypeScript strict mode (`verbatimModuleSyntax`, `.js` extension in imports). [Source: backend/apps/express-api/tsconfig.json]

### Data Flow

```
Client GET /api/v1/recipes/search?ingredients=...&tags=...&cookTime=30
  → nginx → express-api → authenticate (stub: x-user-id → req.user)
    → validate(SearchRecipesSchema) → req.validated
      → recipesController.searchRecipes
        → recipesService.searchByIngredients(ingredients, tags, cookTime, offset, limit)
          → cacheClient.get(key) — MISS
            → llmClient.complete(prompt, params) — via llm-proxy:3001
              → Zod validate → cacheClient.set(key, result, 24h)
          → cacheClient.get(key) — HIT → return cached
        → paginate (offset, limit)
        → ServiceResponse.success({ dishes, total, offset, limit })
```

For seeded (degraded) path:
```
→ seedMatcher.searchSeedRecipes(ingredients) — Jaccard similarity
→ ServiceResponse.success({ dishes, total, offset, limit }, requestId) with meta.degraded: true
```

### Technical Requirements

- **Surprise Me**: Use seed recipes only (no LLM call for MVP). Random selection from in-memory Map. Track `lastSurpriseDishId` in module-level variable. If seed recipe dataset is empty, return 404 with `NOT_FOUND` error code. [Source: Story 2.2 AC 2]
- **Seed recipe lookup**: Load all seed recipes into a `Map<dishId, Recipe>` at startup. If dishId not found, throw `NotFoundError` with `{ code: "NOT_FOUND", message: "Recipe not found" }`. [Source: Story 2.2 AC 3]
- **Search with 0 ingredients**: When ingredients string is empty or not provided, return ALL dishes matching filters with `matchPercentage: 0`. No LLM call needed — use seedMatcher with empty ingredients (returns all recipes scored 0). [Source: Story 2.2 AC 5]
- **LLM-degraded path**: When llmClient returns `meta.degraded: true`, the response should include `meta.degraded: true` in the API response. The dishes come from seedMatcher in this case. [Source: Story 2.2 AC 1]
- **Cache-first strategy**: Check Redis cache before calling LLM. Cache key hash based on ingredients + tags + cookTime. When cached result is hit, return immediately without LLM call. [Source: Story 2.1 AC 5]
- **No new npm packages needed** for this story. All dependencies (Express, Zod, Supertest, Vitest) are already installed. [Source: backend/apps/express-api/package.json]

### File Structure Requirements

**New files:**
- `apps/express-api/src/api/recipes/recipesRouter.ts`
- `apps/express-api/src/api/recipes/recipesController.ts`
- `apps/express-api/src/api/recipes/recipesService.ts`
- `packages/shared/src/api/recipes/recipesValidation.ts` (merged with LLM response schemas from Story 2.1)
- `apps/express-api/tests/api/recipes/recipesRouter.test.ts`

**Files that must be updated:**
- `apps/express-api/src/server.ts` — mount recipesRouter at `/api/v1/recipes`

**Files that must NOT be changed:**
- `apps/express-api/src/services/` — llmClient, cacheClient, seedMatcher (created in Story 2.1)
- `packages/shared/src/common/` — middleware and utils (already complete)
- `packages/shared/src/models/` — Mongoose schemas (already complete)
- `apps/express-api/src/config/` — env, database, redis (already configured)

### Previous Story Intelligence

- Story 2.1 status: depends. LLM client, cache client, seed matcher must be implemented before this story's tests can pass. [Source: epic dependency graph]
- Story 1.8 status: `done`. Common middleware (authenticate, validate, ServiceResponse) is available. [Source: sprint-status.yaml]
- Story 1.7 status: `done`. Seed recipe data is loaded into memory at startup. [Source: sprint-status.yaml]

### Git Intelligence Summary

- Baseline commit: `ce839f6`
- No Epic 2 implementation exists yet. This is the second Epic 2 story, depending on Story 2.1.

### Testing Requirements

- **recipesRouter.test.ts**: Mount app with Supertest. Mock llmClient, cacheClient, seedMatcher at service layer.
  - Test 1: search with valid params returns 200 with dishes array
  - Test 2: search with no params uses defaults (limit=10)
  - Test 3: surprise returns a valid dish object
  - Test 4: getRecipe with valid dishId returns full recipe with ingredients + steps
  - Test 5: getRecipe with invalid dishId returns 404 NOT_FOUND
  - Test 6: pagination offset/total are correct in response
  - Test 7: search with empty ingredients returns all dishes
  - Test 8: search with unknown ingredient returns partial matches
  - Test 9: degraded LLM path includes `meta.degraded: true`
- After ALL tests pass: run `pnpm typecheck` and `pnpm lint`. No regressions expected.

### Project Context Reference

- Architecture docs: `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md` (API Route Map, Data Flow: Core Search Loop, API Design). [Source: architecture index]
- Epic: `_bmad-output/planning-artifacts/epics/epic-2.md` (Story 2.2 section). [Source: epics index]
- No `project-context.md` found.

## Dev Agent Record

### Agent Model Used

TBD

### Debug Log References

TBD

### Completion Notes List

TBD

### File List

TBD

## Change Log

- Initial story file created from Epic 2 (Story 2.2: Recipes API Module) with full ACs, tasks, and dev notes
