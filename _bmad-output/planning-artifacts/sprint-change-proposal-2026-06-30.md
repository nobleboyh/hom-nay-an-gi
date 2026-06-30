# Sprint Change Proposal: Expo Go Cannot Execute API Requests

Date: 2026-06-30
Project: hom-nay-an-gi
Mode: Batch (assumed; user can switch to Incremental)
Change scope: Moderate

## 1. Issue Summary

### Problem statement

When the mobile application is opened via Expo Go on a physical device, API-backed features can fail across the app because the frontend does not use one canonical backend base URL contract across web and Expo, and Expo runtime access is not explicitly bridged from that canonical config.

### Discovery context

The trigger reported was: "Application open via Expo Go can't execute any API."

### Triggering stories and areas

- Story 1.3: Frontend initialization established the original frontend env template contract.
- Story 2.x: Search and recipe flows depend on API reachability.
- Story 3.3: DiscoverScreen creates its own API client with `process.env.API_BASE_URL`.
- Story 4.2 / 4.3 / 4.8: Auth and settings flows use `EXPO_PUBLIC_API_BASE_URL`, while some other paths use `API_BASE_URL`.

### Evidence

1. `frontend/.env.template` documents `API_BASE_URL=http://localhost:8080`.
2. `README.md` already teaches Expo Go users to set `API_BASE_URL=http://YOUR_LAN_IP:8080`.
3. `frontend/stores/dataStore.ts` and `frontend/stores/authStore.ts` read `process.env.EXPO_PUBLIC_API_BASE_URL`.
4. `frontend/app/(tabs)/discover.tsx` and `frontend/stores/storageAdapter.ts` read `process.env.API_BASE_URL`.
5. Multiple mobile code paths fall back to `http://localhost:8080`, which is invalid from a physical device.
6. `frontend/app.json` currently has no explicit Expo config bridge for reading canonical `API_BASE_URL` from runtime-safe config.

### Checklist progress

- [x] 1.1 Trigger identified
- [x] 1.2 Core problem defined
- [x] 1.3 Evidence gathered

## 2. Impact Analysis

### Epic impact

#### Epic 1: Project Initialization & Foundation

- Impacted because Story 1.3 established `API_BASE_URL` as the canonical project env name, but later frontend work split between `API_BASE_URL` and `EXPO_PUBLIC_API_BASE_URL` without a defined Expo bridge.
- Story 1.3 should be corrected so later stories inherit one canonical env name plus the required Expo config bridge.

#### Epic 2: Core Search

- Search, recipe detail, surprise, favorites-in-results, and shopping-list-adjacent fetches all depend on a reachable API base URL.
- Home, Results, and Recipe flows can appear fully broken on Expo Go even when backend services are healthy.

#### Epic 3: Discovery

- DiscoverScreen is directly affected because it constructs an API client from `process.env.API_BASE_URL`.
- This creates a separate failure mode from the rest of the app and breaks consistency.

#### Epic 4: Accounts, Favorites & Personalization

- AuthStore uses `EXPO_PUBLIC_API_BASE_URL`.
- StorageAdapter uses `API_BASE_URL`.
- Profile delete-account flow uses `EXPO_PUBLIC_API_BASE_URL`.
- This mismatch can make authenticated and guest-synced behavior fail differently depending on screen and action.

### PRD conflict assessment

- No conflict with core PRD goals.
- MVP remains achievable.
- No product-scope reduction is required.
- PRD update is optional, not required for product intent.

### Architecture conflict assessment

- The architecture currently describes Expo Go as a supported development environment but does not define one strict frontend env contract plus an Expo runtime bridge for mobile API access.
- Project structure documentation also contains a port/value inconsistency (`3000` vs `8080`) for frontend setup.

### UX impact assessment

- Existing UX assumes generic loading/error/offline handling.
- Current error handling does not clearly distinguish "backend unreachable because Expo device is targeting localhost or because the canonical API base URL was not bridged into Expo runtime config."
- A small UX copy update is useful for developer/testing builds, but no end-user flow redesign is needed.

### Secondary artifact impact

- README / onboarding docs
- frontend env template
- story implementation notes / regression coverage
- sprint-status sequencing

### Checklist progress

- [x] 2.1 Current epic feasibility assessed
- [x] 2.2 Epic-level changes identified
- [x] 2.3 Remaining epics reviewed
- [x] 2.4 No future epic invalidation; one cross-epic fix story recommended
- [x] 2.5 Priority resequencing recommended
- [x] 3.1 PRD checked
- [x] 3.2 Architecture checked
- [x] 3.3 UX checked
- [x] 3.4 Secondary artifacts checked

## 3. Recommended Approach

### Selected path

Option 1: Direct Adjustment

### Rationale

This is a technical contract regression, not a product-direction problem. The fastest defensible path is to standardize on one canonical `API_BASE_URL` at the project/env level, explicitly bridge that value into Expo runtime configuration, document the LAN-IP requirement correctly, and add regression coverage so no screen can silently revert to `localhost` or a second env name again.

### Options evaluated

- Option 1: Direct Adjustment
  - Viable
  - Effort: Medium
  - Risk: Low to Medium
- Option 2: Potential Rollback
  - Not viable
  - Rolling back completed stories would not simplify the root problem because the issue is a cross-cutting env contract mismatch, not a single bad feature implementation.
- Option 3: PRD MVP Review
  - Not viable
  - MVP scope is still valid; no reduction is needed.

### Timeline impact

- 1 focused regression story plus doc updates
- Should be scheduled before any additional mobile QA passes on Epic 2, 3, or 4 behavior

### Risk assessment

- Main risk is partial fixes that update only one screen or store.
- Secondary risk is keeping inconsistent documentation (`8080` vs `3000`, `API_BASE_URL` vs `EXPO_PUBLIC_API_BASE_URL`) or implementing `API_BASE_URL` in a way Expo runtime still cannot read.
- Tertiary risk is missing physical-device validation and only testing Expo web / simulator localhost flows.

### Checklist progress

- [x] 4.1 Direct Adjustment evaluated
- [x] 4.2 Rollback evaluated
- [x] 4.3 MVP review evaluated
- [x] 4.4 Path selected

## 4. Detailed Change Proposals

### Stories

#### Proposal A: Update Story 1.3 environment contract

Story: 1.3 Frontend Initialization  
Section: Technical Tasks / environment setup

OLD:

- Create `frontend/.env.template` — `API_BASE_URL=http://localhost:8080`

NEW:

- Keep `frontend/.env.template` canonical as `API_BASE_URL=http://localhost:8080`
- Add an Expo runtime bridge (`app.config.ts` / `extra` or equivalent) so Expo code can safely read the same canonical `API_BASE_URL`
- Document physical-device usage explicitly: Expo Go on a phone must use `API_BASE_URL=http://<LAN_IP>:8080`
- Add a shared frontend env helper so all screens/stores read the same resolved API base URL from the canonical source

Rationale: The project wants one env name across web and Expo. Expo runtime still needs an explicit bridge, but that bridge can preserve `API_BASE_URL` as the single source of truth.

#### Proposal B: Add a new cross-epic regression story

Story: Q.4 Expo Go API Connectivity Contract Fix  
Section: Quality Stories & Cross-Epic Touchpoints

NEW:

- As a developer testing on Expo Go, I want every mobile API call path to use one shared API base URL contract derived from the canonical `API_BASE_URL`, so that physical-device testing does not fail because some screens point at `localhost` or a second env variable.

Acceptance Criteria:

- Given a physical device running Expo Go, when canonical `API_BASE_URL` is set to a reachable LAN host, then Home, Discover, Auth, Favorites, Profile, and sync-backed actions all call that host successfully.
- Given any frontend module needs the API base URL, when it resolves the host, then it must use the shared env/helper module instead of reading `process.env` ad hoc.
- Given Expo runtime needs the backend host, when the app boots, then the canonical `API_BASE_URL` is exposed through one explicit Expo config bridge rather than a separate public env contract.
- Given the app starts without a valid canonical `API_BASE_URL`, when a networked screen attempts an API call in development, then it surfaces a clear developer-facing configuration error instead of silently falling back to a broken host.
- Given regression tests or static checks run, when frontend source is scanned, then direct `process.env.API_BASE_URL` and `process.env.EXPO_PUBLIC_API_BASE_URL` usage in runtime modules is rejected in favor of the shared resolver.
- Given onboarding docs are followed, when a developer sets up Docker-backed or local-process backend access, then the frontend instructions use one consistent variable name and port contract.

Technical Tasks:

- Create `frontend/lib/env.ts` or equivalent shared resolver for API base URL
- Add an Expo config bridge (`app.config.ts`, `expo.extra`, or equivalent) so the app can consume canonical `API_BASE_URL` without renaming it to `EXPO_PUBLIC_API_BASE_URL`
- Replace direct `process.env.API_BASE_URL` and duplicated `EXPO_PUBLIC_API_BASE_URL` reads with the shared resolver
- Remove mobile fallbacks to `http://localhost:8080` where they are unsafe for physical-device flows, or gate them to explicit localhost-only dev contexts
- Add regression tests or lint/static checks for forbidden direct env access patterns in Expo runtime code
- Validate with Expo Go on a physical device against a LAN-hosted backend

Rationale: The defect spans Stories 2.x, 3.3, and 4.x. A quality/regression story is clearer than scattering silent backlog edits across unrelated user stories, and it preserves one env name without violating Expo runtime constraints.

#### Proposal C: Update Story 3.3 implementation expectations

Story: 3.3 DiscoverScreen  
Section: Technical Tasks

OLD:

- Implement `frontend/app/(tabs)/discover.tsx`

NEW:

- Implement `frontend/app/(tabs)/discover.tsx` using the shared API client / shared env resolver
- Do not instantiate a screen-local API client from `process.env.API_BASE_URL` or `process.env.EXPO_PUBLIC_API_BASE_URL`

Rationale: DiscoverScreen currently diverges from the rest of the app and can fail independently.

#### Proposal D: Update Story 4.3 implementation expectations

Story: 4.3 AuthStore + StorageAdapter  
Section: Technical Tasks

OLD:

- Finalize `frontend/stores/storageAdapter.ts` — Implement all CRUD operations...

NEW:

- Finalize `frontend/stores/storageAdapter.ts` so authenticated API routing uses the same shared API base URL resolver as authStore and dataStore, with Expo runtime reading through the canonical `API_BASE_URL` bridge
- Add regression coverage that guest, authenticated, and post-login sync paths all resolve the same backend host

Rationale: Authenticated and guest-backed flows must not diverge on host resolution.

### PRD

Proposal: No mandatory PRD text change

- Current issue is implementation-contract and architecture-documentation drift, not a change to user value, feature scope, or MVP promise.
- If desired, add a short implementation note in the PRD baseline section that mobile development must support physical-device Expo Go against a LAN-reachable backend, but this is optional.

### Architecture

#### Proposal E: Update development environment contract

Artifact: `project-structure-boundaries.md`  
Section: Getting Started (Frontend)

OLD:

- `cp .env.template .env    # API_BASE_URL=http://localhost:3000`

NEW:

- `cp .env.template .env    # API_BASE_URL=http://localhost:8080`
- Add a physical-device note: `API_BASE_URL=http://<LAN_IP>:8080` for Expo Go
- Clarify when `3000` is direct express-api and when `8080` is nginx proxy, and choose one recommended frontend contract for local development

Rationale: Current architecture docs contain both variable-name drift and port drift.

#### Proposal F: Update core architectural decision on API host resolution

Artifact: `core-architectural-decisions.md`  
Section: Frontend Architecture / API Communication

NEW:

- Define a single invariant: frontend runtime code must resolve backend host through one shared frontend env module derived from canonical `API_BASE_URL`
- For Expo, require an explicit runtime bridge (for example `app.config.ts` / `expo.extra`) instead of introducing a second public env name
- Prohibit screen-local `process.env` reads for API base URL
- Require physical-device verification as part of regression validation for networked features

Rationale: This prevents recurrence across new stories.

### UI/UX

#### Proposal G: Small UX/error-state refinement

Artifact: UX design guidance for loading/error states

NEW:

- For development/testing builds, add a clearer network configuration error message when the app cannot reach the backend host, especially on Expo Go physical devices.
- Keep production-facing copy generic; this is primarily a developer QA aid.

Rationale: Current generic error/offline states hide configuration mistakes and slow diagnosis.

## 5. Implementation Handoff

### Scope classification

Moderate

Reason: product scope does not change, but the fix crosses multiple completed epics and requires backlog insertion of one regression story plus architecture/doc corrections.

### Handoff recipients

- Product Owner / Developer

### Responsibilities

- Product Owner
  - Add and prioritize `Q.4 Expo Go API Connectivity Contract Fix`
  - Resequence so it runs before broader mobile QA or further regression work
- Developer
  - Implement shared env resolver and API client contract
  - Remove mixed env usage
  - Update docs and regression checks
  - Validate on Expo Go physical device with LAN backend

### Success criteria

- One canonical frontend API base URL contract exists
- No Expo runtime code reads `process.env.API_BASE_URL`
- No mobile network flow silently falls back to invalid `localhost` behavior on a physical device
- README, env template, and architecture docs all describe the same setup path
- Expo Go physical-device smoke test passes for at least:
  - recipe search
  - discover trending or nearby
  - login
  - authenticated or guest-backed persistence path

## 6. Final Workflow Summary

- Issue addressed: Expo Go physical-device builds cannot execute API calls reliably because frontend API host resolution is inconsistent
- Recommended change scope: Moderate
- Artifacts requiring change: Epic 1, Epic 3, Epic 4, Quality stories, architecture docs, README/env template, optional UX guidance
- Recommended route: Product Owner / Developer coordination, then direct implementation

Correct Course workflow complete, MinhNK.
