---
baseline_commit: df5e50ded4af34b8a0082a64a4afc14d43cfa260
---

# Story 4.11: Disliked Ingredients Search Filter Regression Fix

Status: ready-for-dev

## Story

As a **logged-in user**,
I want dishes that contain my disliked ingredients to be excluded from ingredient-search recommendations after login,
So that my saved dislikes actually affect the dishes recommended to me.

## Acceptance Criteria

1. Given an authenticated user has one or more values in `preferences.dislikedIngredients`, when they perform `GET /api/v1/recipes/search`, then the search flow uses authenticated context and applies those disliked ingredients before returning dishes.
2. Given a candidate dish contains an ingredient whose normalized token overlaps a normalized value from `dislikedIngredients`, when search results are assembled, then that dish is excluded from the response even if it otherwise matches the entered ingredients, tags, or cook-time filter.
3. Given the user updates `dislikedIngredients` from the Settings screen, when the next search runs, then the updated dislikes apply immediately without requiring app restart or a fresh login.
4. Given cached search data exists for the same ingredient-and-filter combination, when the cached payload includes dishes that should be excluded for the authenticated user, then the cache path is bypassed, revalidated, filtered, or versioned so disliked dishes are not returned.
5. Given a guest user or an authenticated user with no disliked ingredients performs a search, when the request completes, then the existing non-personalized search behavior remains unchanged.
6. Given regression tests cover authenticated search behavior, when they run across direct, refreshed, and cached result paths, then they prove disliked ingredients are excluded only for the correct authenticated user context.

## Tasks / Subtasks

- [ ] Task 1: Restore authenticated context in recipe search requests (AC: 1, 3, 5)
  - [ ] Update the frontend search request path so logged-in users send authorization context instead of always behaving like guests
  - [ ] Preserve guest fallback behavior for unauthenticated searches
  - [ ] Verify Results refresh and pagination reuse the same authenticated search path

- [ ] Task 2: Apply disliked-ingredient filtering in the backend search flow (AC: 1-4)
  - [ ] Load authenticated user preferences for recipe search requests when auth context is present
  - [ ] Normalize `dislikedIngredients` and dish ingredient lists with shared matching rules
  - [ ] Exclude dishes whose ingredient lists overlap any disliked ingredient before returning results
  - [ ] Keep empty-dislike and guest flows unchanged

- [ ] Task 3: Prevent cache from re-serving disliked dishes to authenticated users (AC: 4-5)
  - [ ] Revisit cache key design or post-cache filtering so authenticated dislike preferences are respected
  - [ ] Ensure stale generic cache entries cannot bypass personalized filtering
  - [ ] Document whether filtering happens pre-cache, post-cache, or through user-aware cache segmentation

- [ ] Task 4: Add regression coverage for the reported bug (AC: 1-6)
  - [ ] Add frontend/store coverage proving authenticated searches send authenticated context after login
  - [ ] Add backend/service or router coverage proving disliked ingredients exclude matching dishes
  - [ ] Add coverage for updated preferences affecting the next search immediately
  - [ ] Add guest and empty-preference regression coverage to prevent over-filtering

## Dev Notes

### Trigger and Evidence

- Reported bug: after login, if the user enters a disliked food, the search recommendations still include dishes containing that disliked food.
- Product contract already exists:
  - PRD FR-23 says disliked ingredients are used to exclude dishes from suggestions and changes apply immediately to subsequent searches.
  - Epic 4 Story 4.7 defines `dislikedIngredients[]` in the preferences API.
  - Epic 4 Story 4.8 defines disliked ingredients management in Settings.
- Current implementation evidence:
  - `frontend/stores/dataStore.ts` currently sends search requests with only `x-guest-id: web`, so search behaves like a guest request even after login.
  - `backend/apps/express-api/src/api/recipes/recipesService.ts` accepts ingredients, tags, and cookTime only; it does not incorporate authenticated preference-based exclusions.
  - Preferences are fetched and updated in the profile/settings flow, but that preference state is not wired into recipe search.

### Root Cause Hypothesis

The preferences feature and the search feature were implemented on separate tracks, but the authenticated search path never bridged them. Logged-in searches still look anonymous from the recipe-search service, and the backend search layer has no dislike-based exclusion step even when user preferences exist.

### Scope

- **In scope:** authenticated search request context, preference-aware result filtering, cache behavior for personalized search, regression tests, story tracking
- **Out of scope:** redesigning settings UI, adding new preference types, changing guest-mode product behavior, broader recommendation ranking work

### Files Likely Touched

- `frontend/stores/dataStore.ts`
- `frontend/hooks/useRecipes.ts`
- `backend/apps/express-api/src/api/recipes/recipesController.ts`
- `backend/apps/express-api/src/api/recipes/recipesService.ts`
- `backend/packages/shared/src/services/seedMatcher.ts` or a nearby shared ingredient-matching utility
- `backend/packages/shared/src/models/UserPreference.ts`
- `backend/apps/express-api/tests/api/recipes/recipesRouter.test.ts`
- `frontend/**` store tests or equivalent regression coverage for authenticated search requests

### Implementation Guidance

- Do not rely on the client to filter disliked dishes locally; the backend response must already respect authenticated preferences.
- Keep normalization consistent across entered ingredients, disliked ingredients, and recipe ingredient lists so partial-language or diacritic variants do not create false negatives.
- Be explicit about cache behavior. A shared cache key based only on ingredients/tags/cookTime is not sufficient if authenticated dislike preferences change the allowable result set.
- Preserve guest behavior and empty-preference behavior exactly; this is a personalized exclusion fix, not a global search narrowing.

### Test Focus

1. Authenticated search includes auth context after login.
2. Disliked ingredients exclude matching dishes from authenticated results.
3. Updating disliked ingredients affects the next search immediately.
4. Cached responses cannot leak excluded dishes back to the same authenticated user.
5. Guest and empty-preference searches remain unchanged.

## Change Classification

Minor

## Handoff

Route to Developer agent for direct implementation.
