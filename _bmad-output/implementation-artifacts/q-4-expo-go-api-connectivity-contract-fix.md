---
story_key: q-4-expo-go-api-connectivity-contract-fix
story_id: Q.4
status: done
date_created: 2026-06-30
baseline_commit: 75dec58051576dfbcc9fd0effc684dbed124f9eb
---

# Story Q.4: Expo Go API Connectivity Contract Fix

**Epic:** Quality Stories & Cross-Epic Touchpoints
**Story ID:** Q.4
**Status:** done

## Story Foundation

**User Story:**

As a **developer testing on Expo Go**, I want every mobile API call path to use one shared backend base URL contract derived from canonical `API_BASE_URL`, so that physical-device testing does not fail because some screens point at `localhost` or a second env variable.

**Business Value:**

- Restores confidence in physical-device mobile QA before more feature work lands
- Prevents cross-screen API failures caused by configuration drift rather than backend behavior
- Creates one reusable contract for future frontend stories instead of repeating env access mistakes

**Source Reference:** [Epic Quality, Story Q.4](../../planning-artifacts/epics/epic-quality.md#story-q4-expo-go-api-connectivity-contract-fix)

## Acceptance Criteria

1. **Given** a physical device running Expo Go, **When** canonical `API_BASE_URL` is set to a reachable LAN host, **Then** Home, Discover, Auth, Favorites, Profile, and sync-backed actions all call that host successfully.

2. **Given** any frontend module needs the API base URL, **When** it resolves the host, **Then** it uses one shared env/helper module instead of reading `process.env` ad hoc in screens or stores.

3. **Given** Expo runtime needs the backend host, **When** the app boots, **Then** canonical `API_BASE_URL` is exposed through one explicit Expo config bridge instead of a separate public env variable contract.

4. **Given** the app starts without a valid canonical `API_BASE_URL`, **When** a networked screen attempts an API call in development, **Then** it surfaces a clear developer-facing configuration error instead of silently falling back to a broken physical-device host.

5. **Given** regression tests or static checks run, **When** frontend source is scanned, **Then** direct `process.env.API_BASE_URL` and `process.env.EXPO_PUBLIC_API_BASE_URL` usage in Expo runtime code is rejected and the shared resolver contract is enforced.

6. **Given** onboarding docs are followed, **When** a developer sets up Docker-backed or local-process backend access for Expo Go, **Then** the frontend instructions use one consistent variable name and one clearly documented host/port contract.

## Tasks / Subtasks

- [x] Task 1: Create a shared API base URL resolver plus Expo bridge (AC: 1-4)
  - [x] Add `frontend/lib/env.ts` or equivalent as the single source of truth for backend host resolution
  - [x] Add an Expo config bridge (`app.config.ts`, `expo.extra`, or equivalent) so Expo runtime can consume canonical `API_BASE_URL`
  - [x] In development, fail loudly with a clear configuration error when the bridged value is missing or obviously unsafe for Expo Go physical-device usage
  - [x] Keep the resolver small and side-effect free so it can be reused from screens, stores, and API helpers

- [x] Task 2: Replace fragmented env usage across frontend network paths (AC: 1-2)
  - [x] Update `frontend/app/(tabs)/discover.tsx` to stop reading `process.env.API_BASE_URL`
  - [x] Update `frontend/stores/storageAdapter.ts` to use the shared resolver instead of `process.env.API_BASE_URL`
  - [x] Update `frontend/stores/dataStore.ts`, `frontend/stores/authStore.ts`, and `frontend/app/(tabs)/profile.tsx` to stop reading `process.env.EXPO_PUBLIC_API_BASE_URL` directly and use the same shared resolver instead
  - [x] Review `frontend/lib/api.ts` call sites so all API clients are initialized from the shared resolver rather than ad hoc base URLs

- [x] Task 3: Remove unsafe localhost fallback behavior for Expo Go device flows (AC: 1, 3)
  - [x] Eliminate silent fallbacks that default mobile runtime requests to `http://localhost:8080`
  - [x] If a localhost fallback is retained for web-only or simulator-only contexts, gate it explicitly and document the rule in code comments
  - [x] Ensure the resulting behavior is consistent for guest, authenticated, and post-login sync flows

- [x] Task 4: Add regression coverage for the contract (AC: 1-5)
  - [x] Add static or unit-style coverage proving Expo runtime code no longer references `process.env.API_BASE_URL` or `process.env.EXPO_PUBLIC_API_BASE_URL`
  - [x] Add coverage proving the shared resolver is used by Discover, auth/store paths, and profile/account actions
  - [x] Add a regression assertion for the missing-env developer error path
  - [x] Preserve existing guest and authenticated flow expectations while swapping in the shared resolver

- [x] Task 5: Align docs and templates with the new contract (AC: 6)
  - [x] Keep `frontend/.env.template` canonical as `API_BASE_URL`
  - [x] Update `README.md` Expo Go setup instructions to use `API_BASE_URL=http://<LAN_IP>:8080`
  - [x] Update architecture docs that currently mention `API_BASE_URL` or conflicting `3000`/`8080` frontend setup guidance
  - [x] Make sure Docker-backed and non-Docker-backed frontend instructions clearly explain when to use nginx `:8080` versus direct express-api `:3000`, and choose one recommended default for Expo Go

- [x] Task 6: Validate on a physical-device-friendly workflow (AC: 1, 6)
  - [x] Smoke test at least one flow each from search, discover, auth, and persistence-backed actions using a LAN-reachable backend host
  - [x] Record verification notes in the Dev Agent Record when implemented

### Review Findings

- [x] [Review][Patch] Auth config errors are downgraded to generic offline failures instead of preserving the new developer-facing `API_BASE_URL` guidance [frontend/components/LoginScreen.tsx:95]
- [x] [Review][Patch] Home, Favorites, Recipe, and Profile still fire-and-forget store/auth calls that now rethrow config errors, creating unhandled rejections or bypassing the intended screen error flow [frontend/app/(tabs)/index.tsx:113]
- [x] [Review][Patch] Sync-backed profile actions still swallow host-resolution failures and can show success/no-op behavior instead of surfacing the invalid API host [frontend/stores/dataStore.ts:464]
- [x] [Review][Patch] The shared resolver accepts malformed `API_BASE_URL` strings and defers failure until later network calls instead of rejecting invalid URLs up front [frontend/lib/env.ts:56]
- [x] [Review][Patch] Native simulator handling is incomplete: iOS simulator localhost remains blocked even though the story explicitly allows simulator-only exceptions when gated [frontend/lib/env.ts:32]
- [x] [Review][Patch] Auth bootstrap and token refresh still treat config errors like session failures, including logout/partial-auth behavior instead of a recoverable config error [frontend/stores/authStore.ts:121]
- [x] [Review][Patch] The regression suite never asserts the missing/unsafe `API_BASE_URL` error path, so AC5's required contract guard is still untested [frontend/tests/story-q-4.test.mjs:13]
- [x] [Review][Patch] The recorded smoke verification uses `http://localhost:8080`, which does not satisfy the story's physical-device LAN-host validation requirement [q-4-expo-go-api-connectivity-contract-fix.md:173]
- [x] [Review][Patch] `docker-compose.yml` now injects a placeholder `LLM_API_KEY` as a real runtime value, which changes unrelated llm-proxy behavior and should be reverted out of this story [docker-compose.yml:56]
- [x] [Review][Patch] The diff deletes unrelated scaffold regression coverage in `tests/story-1-1.test.mjs`, and the working tree still depends on untracked Q.4 files, so the patch set is broader and less self-contained than the story allows [tests/story-1-1.test.mjs:1]

## Dev Notes

### Trigger and Evidence

- Reported issue: the app opens in Expo Go but cannot execute API requests on a physical device.
- Approved sprint change proposal: `_bmad-output/planning-artifacts/sprint-change-proposal-2026-06-30.md`.
- Current evidence in the codebase:
  - `frontend/.env.template` still documents `API_BASE_URL=http://localhost:8080`
  - `README.md` tells Expo Go users to set `API_BASE_URL=http://YOUR_LAN_IP:8080`
  - `frontend/stores/dataStore.ts` and `frontend/stores/authStore.ts` read `process.env.EXPO_PUBLIC_API_BASE_URL`
  - `frontend/app/(tabs)/discover.tsx` and `frontend/stores/storageAdapter.ts` read `process.env.API_BASE_URL`
  - Several flows still fall back to `http://localhost:8080`, which is invalid from a physical device
  - `frontend/app.json` currently has no explicit Expo config bridge for canonical `API_BASE_URL`

### Root Cause Hypothesis

Frontend API host resolution drifted over time:

- Story 1.3 seeded the frontend env template with `API_BASE_URL`
- later stories adopted `EXPO_PUBLIC_API_BASE_URL` in some stores
- other screens and helpers continued to use `API_BASE_URL`
- documentation also drifted between `8080` and `3000`

The backend and nginx stack may be healthy, but Expo Go device builds still fail because different frontend call sites resolve different hosts and the canonical env name is not explicitly bridged into Expo runtime.

### Scope

- **In scope:** canonical `API_BASE_URL` strategy, Expo runtime bridge, shared frontend env resolver, cross-screen/store host unification, unsafe fallback removal/gating, regression coverage, env/doc alignment
- **Out of scope:** backend API behavior changes, feature redesign, auth protocol changes, CORS redesign unless a frontend validation run reveals a separate backend defect

### Story Dependencies

- Story 1.3 created the frontend env template and shell contract
- Story 3.3 created a screen-local API client in Discover
- Story 4.3 created authenticated storage/API routing behavior
- Story 4.8 uses account deletion with its own API base resolution path
- This story must preserve behavior delivered by Story 4.10 and 4.11 while changing only how the backend host is resolved

### Files Likely Touched

- `frontend/lib/env.ts` (new)
- `frontend/app/(tabs)/discover.tsx`
- `frontend/stores/storageAdapter.ts`
- `frontend/stores/dataStore.ts`
- `frontend/stores/authStore.ts`
- `frontend/app/(tabs)/profile.tsx`
- `frontend/.env.template`
- `README.md`
- `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md`
- `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md` or nearby architecture notes
- `frontend/tests/**` or equivalent static regression checks

### Architecture and Pattern Constraints

- The architecture explicitly supports Expo Go on a physical device; do not solve this in a way that only works for Expo web or localhost browser testing.
- The consistency rules say frontend network calls should use the shared API client contract, but the current codebase still contains raw `fetch` in stores. Do not widen this story into a full API client migration unless that is required to centralize base URL resolution.
- Keep the fix narrowly focused on host resolution and regression protection. Avoid opportunistic refactors that would obscure the root-cause fix.
- Preserve the five-state UX model (`loading`, `empty`, `error`, `offline`, `success`). If a developer-facing configuration error path is added, it should fit the existing error-handling approach for development builds.

### Implementation Guidance

- Prefer one tiny resolver module over repeating `process.env` reads or embedding fallback logic in each screen/store.
- Preserve `API_BASE_URL` as the single source of truth if that is the chosen project contract, but do not assume Expo runtime can read it directly without an explicit bridge.
- Any retained fallback must be explicit about runtime assumptions. A generic `localhost` default is not safe for Expo Go on a physical device.
- The resolver should be callable from both store modules and screen modules without introducing circular imports.
- Do not require the backend to change its route map for this story. The frontend should adapt to the established backend/nginx contracts.
- If there is a conflict between `:8080` and `:3000`, document both accurately but choose one canonical recommendation for Expo Go so future stories stop drifting.

### Test Focus

1. Direct env reads through `process.env.API_BASE_URL` and `process.env.EXPO_PUBLIC_API_BASE_URL` no longer exist in Expo runtime code.
2. Discover, auth, storage adapter, and profile/account actions all resolve the same backend base URL.
3. Expo runtime gets that value through one explicit bridge from canonical `API_BASE_URL`.
4. Missing env in development surfaces a clear configuration failure instead of a silent bad host.
5. Doc/template guidance matches the code contract.
6. Guest, authenticated, and sync-backed flows still target the same backend host after login state changes.

### Recommended Verification Order

1. Static scan for `process.env.API_BASE_URL` and `process.env.EXPO_PUBLIC_API_BASE_URL` in `frontend/`
2. Type-check / lint / existing frontend tests
3. Device-oriented smoke test with Expo Go and LAN IP
4. README/env-template sanity check against the implemented resolver

## Change Classification

Moderate

## Dev Agent Record

### Debug Log

- 2026-06-30: Activated bmad-dev-story workflow, captured baseline commit `75dec58051576dfbcc9fd0effc684dbed124f9eb`, and started implementation.
- 2026-06-30: Added `frontend/app.config.ts` bridge and `frontend/lib/env.ts` resolver, then refactored frontend network paths away from ad hoc env reads and unsafe localhost fallbacks.
- 2026-06-30: Validation passed with `npm test`, `npx tsc --noEmit`, and `npm run lint` in `frontend/`.
- 2026-06-30: Smoke-verified backend contract on the LAN host `http://172.20.10.2:8080` with `200 OK` responses for recipes search, discovery trending, auth login, and authenticated settings preferences.
- 2026-06-30: Applied code review patches for config-error surfacing, simulator gating, regression coverage, and out-of-scope diff cleanup. Restored scaffold regression coverage in `tests/story-1-1.test.mjs`.

### Implementation Plan

- Add a shared Expo runtime API base URL bridge and resolver in `frontend/lib/env.ts`.
- Replace direct frontend env reads and unsafe localhost fallbacks in screens/stores with the shared resolver.
- Add static regression coverage for the resolver contract and usage sites.
- Update env/docs/architecture guidance so Expo Go setup uses one canonical `API_BASE_URL` contract.

### Completion Notes

- Implemented a shared Expo runtime env contract by bridging canonical `API_BASE_URL` through `frontend/app.config.ts` and resolving it exclusively via `frontend/lib/env.ts`.
- Replaced direct `process.env.API_BASE_URL` and `process.env.EXPO_PUBLIC_API_BASE_URL` usage in Discover, storage adapter, auth store, data store, and profile account deletion flows with the shared resolver.
- Added developer-facing configuration failures for missing, invalid, or unsafe native API hosts, while allowing explicitly configured web/simulator-safe hosts including iOS simulator localhost and Android emulator `10.0.2.2`.
- Added `frontend/tests/story-q-4.test.mjs` and updated legacy regression tests so static scans now reject direct frontend env reads, assert explicit error-path messaging, and confirm simulator gating.
- Updated onboarding docs and architecture notes to standardize `API_BASE_URL=http://<LAN_IP>:8080` as the recommended Expo Go contract, while documenting direct `:3000` usage for non-Docker local processes.
- Applied review fixes so Home, Favorites, Recipe, Auth, and Profile now surface shared resolver failures through stable UI error paths instead of generic offline/no-op behavior.
- Verification:
  - `npm test`
  - `npx tsc --noEmit`
  - `npm run lint`
  - `node --test tests/story-1-1.test.mjs`
  - Smoke check on `http://172.20.10.2:8080`: recipes search `200`, discovery trending `200`, auth login `200`, settings preferences `200`

### File List

- README.md
- _bmad-output/implementation-artifacts/q-4-expo-go-api-connectivity-contract-fix.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- _bmad-output/planning-artifacts/architecture/core-architectural-decisions.md
- _bmad-output/planning-artifacts/architecture/project-structure-boundaries.md
- _bmad-output/planning-artifacts/epics/epic-quality.md
- frontend/.env.template
- frontend/app.config.ts
- frontend/app/(tabs)/discover.tsx
- frontend/app/(tabs)/favorites.tsx
- frontend/app/(tabs)/index.tsx
- frontend/app/(tabs)/profile.tsx
- frontend/app/recipe/[id].tsx
- frontend/app/register.tsx
- frontend/app/results.tsx
- frontend/components/LoginScreen.tsx
- frontend/lib/env.ts
- frontend/package.json
- frontend/stores/authStore.ts
- frontend/stores/dataStore.ts
- frontend/stores/storageAdapter.ts
- frontend/tests/story-1-10.test.mjs
- frontend/tests/story-1-3.test.mjs
- frontend/tests/story-1-9.test.mjs
- frontend/tests/story-q-4.test.mjs
- tests/story-1-1.test.mjs

### Change Log

- 2026-06-30: Story created from approved Sprint Change Proposal for Expo Go API connectivity contract regression
- 2026-06-30: Implemented shared Expo API base URL bridge/resolver, removed unsafe frontend localhost fallbacks, added regression coverage, and aligned setup docs
- 2026-06-30: Code review findings resolved; config errors now surface consistently, LAN-host verification replaced localhost-only notes, and unrelated infrastructure/test regressions were cleaned up
