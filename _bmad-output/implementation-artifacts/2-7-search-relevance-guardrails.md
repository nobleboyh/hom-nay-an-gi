---
baseline_commit: df5e50ded4af34b8a0082a64a4afc14d43cfa260
---

# Story 2.7: Search Relevance Guardrails

Status: ready-for-dev

## Story

As a **user**,
I want recipe search results to only show dishes that are actually related to the ingredients I entered,
So that tapping "Tìm món" does not return irrelevant dishes that make the search engine feel wrong.

## Acceptance Criteria

1. Given a user searches with one or more ingredients, when `GET /api/v1/recipes/search` returns dishes, then every returned dish must have at least one normalized ingredient-token overlap with the user input unless it is a deterministic partial-match fallback with a correspondingly low `matchPercentage`.
2. Given the LLM returns a structured JSON payload, when a dish in that payload has zero normalized overlap between user ingredients and the dish's ingredient list, then the backend discards that dish before caching or returning the response.
3. Given all LLM-returned dishes fail the relevance check, when the search request completes, then the service falls back to the deterministic seed matcher instead of returning unrelated dishes.
4. Given cached search data exists for an ingredient-plus-filter combination, when the cached dishes violate the new relevance rule, then the cache entry is bypassed, invalidated, or refreshed so stale unrelated dishes are not served.
5. Given a search result card is rendered in the frontend, when it displays `matchPercentage`, then that value remains consistent with actual ingredient overlap and does not present unrelated dishes as strong matches.
6. Given regression tests run across LLM, degraded, and cache-assisted search paths, when they evaluate non-overlapping dishes, then those dishes are rejected while legitimate partial matches still remain possible for weak-but-related searches.

## Tasks / Subtasks

- [ ] Task 1: Add server-side relevance validation before recipe search responses are returned or cached (AC: 1-4)
  - [ ] Create a shared helper for normalized ingredient-token comparison across user input and dish ingredient lists
  - [ ] Reuse or extend the existing Vietnamese normalization logic so diacritics, casing, and tokenization are handled consistently
  - [ ] Define the minimum relevance rule for LLM dishes: at least one overlapping normalized ingredient token

- [ ] Task 2: Harden `recipesService.searchByIngredients()` for invalid LLM output (AC: 2-4)
  - [ ] Filter LLM dishes through the new relevance validator before writing to Redis cache
  - [ ] If the validated LLM list becomes empty, execute deterministic seed fallback and return `meta.degraded: true`
  - [ ] Ensure cached payloads are either versioned or revalidated so pre-fix unrelated results are not reused

- [ ] Task 3: Tighten prompt and scoring guidance without trusting prompt compliance alone (AC: 1-3, 5)
  - [ ] Update ingredient-search prompt instructions to require real overlap with user ingredients
  - [ ] Clarify that `matchPercentage` must reflect ingredient overlap rather than a generic cuisine guess
  - [ ] Keep backend validation as the source of truth even if prompt instructions improve

- [ ] Task 4: Add regression coverage for the failure mode reported by the user (AC: 1-6)
  - [ ] Add service-level tests where the LLM returns dishes unrelated to the input ingredients
  - [ ] Add coverage for mixed valid/invalid LLM payloads to prove only valid dishes survive
  - [ ] Add cache-path coverage for stale invalid payloads
  - [ ] Preserve existing behavior for unknown ingredients returning low-score partial matches rather than unrelated dishes

## Dev Notes

### Trigger and Evidence

- Reported bug: after entering available ingredients and tapping "Tìm món", unrelated dishes still appear.
- Current implementation evidence:
  - `backend/apps/express-api/src/api/recipes/recipesService.ts` accepts any Zod-valid LLM dish list and caches it immediately.
  - `backend/packages/shared/src/services/seedMatcher.ts` already filters deterministic results to positive-overlap matches, but that guardrail only applies to the degraded fallback path.
  - `backend/packages/shared/src/services/prompts.ts` asks the model for "matching" dishes but does not enforce overlap at runtime.
- Current test gap:
  - Router tests cover "unknown ingredient returns partial matches" and degraded metadata, but they do not assert that zero-overlap LLM dishes are rejected.

### Root Cause Hypothesis

The main search path trusts the LLM too much. Structured output validation proves shape, not semantic relevance. Because the backend does not validate ingredient overlap on LLM results before caching and returning them, unrelated dishes can appear even though the deterministic seed fallback already has stricter relevance behavior.

### Scope

- **In scope:** backend recipe search validation, prompt tightening, cache invalidation/versioning, regression tests, story tracking
- **Out of scope:** redesigning the search UI, replacing the LLM provider, changing PRD-level product goals, discovery-mode behavior

### Files Likely Touched

- `backend/apps/express-api/src/api/recipes/recipesService.ts`
- `backend/packages/shared/src/services/seedMatcher.ts`
- `backend/packages/shared/src/services/prompts.ts`
- `backend/apps/express-api/tests/api/recipes/recipesRouter.test.ts`
- `backend/packages/shared/tests/services/seedMatcher.test.ts`
- `backend/apps/express-api/tests/services/` or equivalent service-level search tests

### Implementation Guidance

- Do not rely on prompt wording alone. The backend must reject semantically irrelevant dishes even when the JSON is well-formed.
- Prefer one normalization strategy shared across seed matching and LLM-result validation so behavior is consistent between normal and degraded paths.
- Keep support for weak-but-related partial matches; the fix is about excluding unrelated dishes, not forcing exact matches only.
- Treat cache invalidation deliberately. If the cache key format stays unchanged, stale bad results can survive after the code fix.

### Test Focus

1. LLM payload with zero-overlap dishes is filtered out.
2. Mixed payload keeps overlapping dishes and removes unrelated ones.
3. Fully invalidated LLM payload falls back to deterministic seed matching.
4. Cache path cannot keep serving invalid pre-fix results.
5. Unknown ingredients still degrade gracefully into low-score related or empty deterministic results, not random dishes.

## Change Classification

Minor

## Handoff

Route to Developer agent for direct implementation.
