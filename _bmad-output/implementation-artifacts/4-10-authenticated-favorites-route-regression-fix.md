# Story 4.10: Authenticated Favorites Route Regression Fix

Status: ready-for-dev

## Story

As a **logged-in user**,
I want tapping save on a dish to persist to my account after login,
So that favorites work correctly across devices instead of failing against guest-only routes.

## Acceptance Criteria

1. **Given** I am authenticated and tap save on a dish from Results or Recipe detail, **When** the favorite mutation is sent, **Then** the client calls `POST /api/v1/favorites` and never `POST /api/v1/favorites_guest`.
2. **Given** I am authenticated and remove a saved dish, **When** the unsave mutation is sent, **Then** the client calls `DELETE /api/v1/favorites/:favoriteId` and never a guest-only route.
3. **Given** the app has just transitioned from guest to authenticated, **When** I save a new favorite after login succeeds, **Then** route selection is based on current auth state and the authenticated collection mapping.
4. **Given** a guest session, **When** I save or remove favorites, **Then** the app continues to use SQLite-backed guest storage without regression.
5. **Given** the authenticated favorites API responds with success, **When** the mutation completes, **Then** the UI updates saved state and the Favorites screen reflects the change without requiring app restart.
6. **Given** the authenticated favorites API responds with 401/404/409 or network failure, **When** the mutation completes, **Then** the app surfaces an error path, does not silently mark the item saved, and logs enough detail to debug route-selection failures.

## Tasks / Subtasks

- [ ] Task 1: Normalize favorite collection routing in `frontend/stores/dataStore.ts` (AC: 1-4)
  - [ ] Replace hard-coded authenticated writes/removes against `favorites_guest`
  - [ ] Use a logical favorites target that resolves to SQLite for guests and API for authenticated users
  - [ ] Keep guest-mode read/write/remove behavior intact

- [ ] Task 2: Harden `frontend/stores/storageAdapter.ts` for dual-mode favorites transport (AC: 1-4)
  - [ ] Add explicit mapping from logical favorites operations to `/api/v1/favorites` when `authState === 'authenticated'`
  - [ ] Preserve `favorites_guest` SQLite table usage only for guest mode
  - [ ] Prevent unknown collection names from turning into invalid API routes

- [ ] Task 3: Fix optimistic state updates for authenticated favorites (AC: 2, 5-6)
  - [ ] Ensure save success only updates local state after authenticated API success or deliberate optimistic flow with rollback
  - [ ] Ensure remove uses the correct identifier for authenticated records
  - [ ] Surface API failures instead of silently swallowing them

- [ ] Task 4: Add regression tests (AC: 1-6)
  - [ ] Add static or runtime coverage for `dataStore.saveFavorite()` authenticated path
  - [ ] Add coverage that authenticated routes do not include `_guest`
  - [ ] Add coverage that guest save/remove still target SQLite guest storage
  - [ ] Add coverage for Results and Recipe detail favorite toggles after login

## Dev Notes

### Trigger and Evidence

- Reported bug: after login succeeds, tapping save favorite does not work.
- Observed log:
  - `POST /api/v1/favorites_guest HTTP/1.1` → `404`
- Current code evidence:
  - `frontend/stores/dataStore.ts` still calls `storageAdapter.write('favorites_guest', dish.id, dish)` inside `saveFavorite()`
  - `frontend/stores/dataStore.ts` still calls `storageAdapter.remove('favorites_guest', dishId)` inside `removeFavorite()`
  - `frontend/stores/storageAdapter.ts` builds authenticated API routes as `/api/v1/${collection}`, which turns `favorites_guest` into `/api/v1/favorites_guest`

### Root Cause Hypothesis

The auth transition to `authenticated` is working, but the favorites mutation API path is derived from a guest collection name. The routing abstraction is mixing storage-table names with domain endpoint names. After login, the adapter switches to API transport, but the collection name remains guest-specific, producing the wrong endpoint and a 404.

### Scope

- **In scope:** frontend route selection, storage adapter mapping, favorites optimistic updates, regression coverage
- **Out of scope:** backend favorites API contract changes, PRD changes, UX redesign

### Files Likely Touched

- `frontend/stores/dataStore.ts`
- `frontend/stores/storageAdapter.ts`
- `frontend/tests/story-4-3.test.mjs`
- `frontend/tests/story-4-6.test.mjs`
- `frontend/app/results.tsx`
- `frontend/app/recipe/[id].tsx`

### Implementation Guidance

- Prefer logical domain collection names for authenticated mode, not physical SQLite table names.
- Keep guest physical table naming isolated inside the adapter.
- Do not silently swallow authenticated API write/remove failures; bubble them so the UI can avoid false saved state.
- Verify that authenticated delete semantics use the identifier returned by the favorites API rather than assuming `dishId` is always the delete key.

### Test Focus

1. Logged-in save from Results calls authenticated favorites route.
2. Logged-in save from Recipe detail calls authenticated favorites route.
3. Logged-in remove does not use guest route names.
4. Guest save/remove still use SQLite guest storage.
5. Failed authenticated save does not leave the UI in a false saved state.

## Change Classification

Minor

## Handoff

Route to Developer agent for direct implementation.
