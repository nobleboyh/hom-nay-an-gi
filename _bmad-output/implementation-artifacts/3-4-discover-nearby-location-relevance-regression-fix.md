---
baseline_commit: df5e50ded4af34b8a0082a64a4afc14d43cfa260
---

# Story 3.4: Discover Nearby Location Relevance Regression Fix

Status: ready-for-dev

## Story

As a **user**,
I want Discover nearby results to match the location I selected,
So that changing to places like Cầu Giấy, Hà Nội does not still show restaurants from Hồ Chí Minh.

## Acceptance Criteria

1. Given the user selects a new Discover location such as Cầu Giấy, Hà Nội, when `GET /api/v1/discovery/nearby` returns results, then every returned restaurant must be geographically consistent with the requested coordinates and radius instead of leaking hardcoded Hồ Chí Minh entries.
2. Given HERE Maps and Overpass both fail or return no nearby matches for the selected coordinates, when the nearby request completes, then the API returns an empty result set or explicit degraded state rather than substituting unrelated cross-city seed data.
3. Given the user switches between GPS, manual district selection, and other picker options, when the next nearby fetch runs, then the Discover screen replaces the current nearby list using the new coordinates and does not keep stale results from the previous location.
4. Given nearby results include item coordinates and computed distance, when the backend assembles the response, then it validates that returned items stay within the requested radius before sending them to the client.
5. Given a selected location or active filter yields zero nearby matches, when Discover renders, then it shows the appropriate empty/error state for that location instead of unrelated restaurant cards.
6. Given regression tests run across backend and Discover flows, when they exercise location changes and provider failure/empty responses, then they prove cross-city leakage and stale-location reuse do not recur.

## Tasks / Subtasks

- [ ] Task 1: Remove incorrect cross-city fallback behavior from nearby discovery (AC: 1-2, 5)
  - [ ] Replace the current HCMC-only `NEARBY_SEED` fallback for nearby discovery with an empty/degraded response path that preserves requested location truth
  - [ ] Keep provider failure visible through logs and user-facing empty/error state rather than fabricated nearby cards
  - [ ] Ensure fallback behavior for trending remains separate from nearby-location behavior

- [ ] Task 2: Harden backend location consistency for nearby results (AC: 1, 2, 4)
  - [ ] Validate provider-returned coordinates against requested lat/lng/radius before returning items
  - [ ] Preserve distance sorting only after validation
  - [ ] Add explicit handling for provider responses that are empty, malformed, or outside the requested radius

- [ ] Task 3: Make DiscoverScreen location switching deterministic (AC: 3, 5)
  - [ ] Confirm picker selection always triggers a fresh nearby fetch with the newly selected coordinates
  - [ ] Clear or replace stale nearby data when location changes instead of visually retaining the previous location's cards
  - [ ] Verify GPS/manual location changes and pull-to-refresh use the same current-location source of truth

- [ ] Task 4: Add regression coverage for the reported failure mode (AC: 1-6)
  - [ ] Add backend coverage proving provider failure/empty responses no longer return HCMC seed data
  - [ ] Add coverage for switching from Hồ Chí Minh to Hà Nội/Cầu Giấy and receiving location-consistent results or empty state
  - [ ] Add frontend/discover coverage for replacing stale nearby results after location change
  - [ ] Add zero-result state coverage for location/filter combinations with no nearby matches

## Dev Notes

### Trigger and Evidence

- Reported bug: changing Discover location to Cầu Giấy, Hà Nội still shows Bánh Mì Huỳnh Hoa, even though it is in Hồ Chí Minh.
- Additional report: other location switches in the nearby flow also behave incorrectly.
- Current implementation evidence:
  - `backend/apps/express-api/src/api/discovery/discoveryService.ts` defines a hardcoded `NEARBY_SEED` containing Hồ Chí Minh restaurants including `Bánh Mì Huỳnh Hoa`.
  - `getNearby()` falls back to that seed whenever provider calls fail or return zero items.
  - `frontend/app/(tabs)/discover.tsx` correctly updates `lat`/`lng` on picker change, but it trusts the API response and therefore surfaces incorrect fallback data for the new city.
  - `frontend/components/LocationPicker.tsx` includes many valid manual locations, so the primary issue is not lack of coordinates; it is broken fallback semantics and stale nearby truth.

### Root Cause Hypothesis

The nearby discovery path treats "no live nearby data" as permission to return a static demo dataset centered on Hồ Chí Minh. That may have been acceptable for scaffolding, but it breaks the location contract once real manual location switching exists. The screen then displays those unrelated fallback results as if they were truly nearby.

### Scope

- **In scope:** backend nearby fallback behavior, radius/location validation, DiscoverScreen stale-result handling, regression tests, sprint tracking
- **Out of scope:** redesigning the Discover layout, changing trending discovery behavior, building a new location provider, adding maps UI

### Files Likely Touched

- `backend/apps/express-api/src/api/discovery/discoveryService.ts`
- `backend/apps/express-api/src/api/discovery/discoveryValidation.ts`
- `backend/apps/express-api/src/services/hereMapsClient.ts`
- `backend/apps/express-api/src/services/overpassClient.ts`
- `backend/apps/express-api/tests/api/discovery/discoveryRouter.test.ts`
- `backend/apps/express-api/tests/api/discovery/discoveryService.test.ts`
- `frontend/app/(tabs)/discover.tsx`
- `frontend/components/LocationPicker.tsx` (only if state handoff needs tightening)

### Implementation Guidance

- Do not fabricate nearby results from a fixed city when the requested coordinates point elsewhere.
- Prefer truthful emptiness over false precision. An empty-state for nearby is better than showing restaurants from the wrong city.
- Keep location truth server-side. The backend should reject or drop out-of-radius items before they reach the UI.
- If the UI currently retains stale cards during location change, clear or replace them deterministically when the new request starts or completes.

### Test Focus

1. Switching to Cầu Giấy, Hà Nội no longer shows Hồ Chí Minh seed restaurants.
2. Provider failure or zero-result responses return empty/degraded nearby results, not HCMC fallback.
3. Manual location changes replace the nearby list for the new coordinates.
4. Zero-match/filter states render empty-state behavior instead of stale or unrelated cards.

## Change Classification

Minor

## Handoff

Route to Developer agent for direct implementation.
