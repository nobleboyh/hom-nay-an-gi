---
baseline_commit: df5e50ded4af34b8a0082a64a4afc14d43cfa260
---

# Story 3.5: Discovery Provider Runtime Hardening

Status: done

## Story

As a **developer**,
I want discovery provider integrations to stay aligned with the runtime contracts they depend on,
So that trending and nearby discovery degrade truthfully when the LLM proxy deployment or HERE provider setup is wrong.

## Acceptance Criteria

1. Given `GET /api/v1/discovery/trending` depends on the internal LLM proxy, when the running proxy does not expose the expected structured-generation route, then the service detects the route/version mismatch, logs an explicit contract error, and returns the defined degraded fallback behavior instead of an opaque unclassified 503.
2. Given discovery needs structured LLM output, when the backend invokes the proxy, then it uses a single shared client/endpoint contract rather than duplicated raw fetch logic that can drift from the proxy runtime.
3. Given `GET /api/v1/discovery/nearby` calls HERE Maps first, when the configured HERE endpoint or credentials are unauthorized for the active account/product, then the backend classifies the failure as a provider configuration/auth issue, logs actionable details, and falls back without treating the result as a healthy provider response.
4. Given both HERE Maps and Overpass fail for a nearby query, when the request completes, then the backend returns a truthful degraded or empty nearby result path with diagnostic logging instead of a silent false-success pattern that hides the provider outage.
5. Given regression tests simulate LLM proxy `404`, HERE `403`, and Overpass transport failure, when discovery endpoints and services run, then they preserve the intended degraded behavior and observability semantics.
6. Given the runtime environment is deployed through Docker Compose, when service versions drift or stale images are still running, then the documented verification steps and smoke coverage are sufficient to detect the mismatch before users hit Discover failures.

## Tasks / Subtasks

- [x] Task 1: Unify the LLM proxy contract used by discovery (AC: 1-2, 5)
  - [x] Extract or reuse a shared internal client for structured LLM generation instead of duplicating `fetch(${proxyUrl}/generate)` in `discoveryService.ts`
  - [x] Ensure the client emits explicit contract-mismatch errors for `404 Not Found` and similar proxy route/version failures
  - [x] Keep trending fallback behavior deterministic and testable when the proxy contract is unavailable

- [x] Task 2: Harden HERE provider integration and classification (AC: 3, 5)
  - [x] Audit `backend/apps/express-api/src/services/hereMapsClient.ts` against the active HERE product contract and update endpoint/auth usage if needed
  - [x] Distinguish HERE authorization/configuration failures from timeout/transport/data-shape failures in logs and errors
  - [x] Preserve radius/location truth for any successful HERE or fallback result set

- [x] Task 3: Make nearby degradation truthful and observable (AC: 3-5)
  - [x] When HERE fails and Overpass also fails, preserve an empty/degraded nearby outcome with an explicit server-side signal rather than a silent generic success
  - [x] Verify `discoveryService.getNearby()` and router/controller responses preserve user-safe behavior without hiding provider outages from logs/monitoring
  - [x] Keep nearby degraded behavior separate from trending degraded behavior

- [x] Task 4: Add regression and smoke coverage for provider drift (AC: 5-6)
  - [x] Add service/router tests for LLM proxy `404` on `/generate`
  - [x] Add HERE `403 Forbidden` coverage and assert classified logging/fallback behavior
  - [x] Add Overpass transport-failure coverage after HERE failure and assert truthful degraded nearby behavior
  - [x] Add or document a container-level smoke check that verifies the running `llm-proxy` exposes `/generate`

### Review Findings

- [x] [Review][Patch] Discovery still hard-codes `gemini`, overriding the configured proxy provider and breaking DeepSeek-default deployments [backend/apps/express-api/src/api/discovery/discoveryService.ts:88]
- [x] [Review][Patch] The new `/complete` smoke check can report healthy with a placeholder or invalid LLM API key because it only validates request shape, not a real provider-backed completion [docker-compose.yml:53]
- [x] [Review][Patch] Trending retry-on-invalid-response is dead for malformed `200 success` payloads because Zod parse failures bypass the `LLM_INVALID_RESPONSE` retry branch [backend/apps/express-api/src/api/discovery/discoveryService.ts:95]
- [x] [Review][Patch] Story-required router regression coverage for proxy contract drift was not added; only the service-level `404` case is tested [backend/apps/express-api/tests/discovery/discoveryRouter.test.ts:174]
- [x] [Review][Patch] The shared LLM proxy client still duplicates raw `/complete` fetch logic in both `generateStructured()` and `complete()`, leaving the contract split in two code paths [backend/apps/express-api/src/services/llmClient.ts:61]

## Dev Notes

### Trigger and Evidence

- User-reported runtime logs on 2026-07-06 show two distinct discovery failures:
  - `trending LLM generation failed` with `LLM_PROVIDER_ERROR`, `statusCode: 502`, and user-facing message `LLM proxy returned 404`
  - HERE search path logs `HERE Maps API returned error` with `403 Forbidden`, followed by Overpass `fetch failed`
- Current implementation evidence:
  - `backend/apps/express-api/src/api/discovery/discoveryService.ts` calls `POST ${proxyUrl}/generate` directly in two places using ad hoc fetch logic.
  - `backend/apps/express-api/src/services/llmClient.ts` separately calls `POST ${LLM_PROXY_URL}/complete`, proving the codebase already has two different internal proxy contracts.
  - `backend/apps/llm-proxy/src/index.ts` in the repo exposes both `/generate` and `/complete`, so a runtime `404` from `/generate` strongly suggests deployment drift, stale image/runtime, or wrong target URL rather than a provider rejection.
  - `backend/apps/express-api/src/services/hereMapsClient.ts` still calls `https://places.ls.hereapi.com/places/v1/browse`, and the live log shows that request is being rejected with `403 Forbidden`.
  - `backend/apps/express-api/src/services/index.ts` returns `[]` when both HERE and Overpass fail, which protects the user from cross-city fake data but hides provider-health detail behind a normal `200`.

### Root Cause Analysis

This incident has two primary root causes and one observability gap.

1. **LLM proxy runtime contract drift**
   - The discovery service is coupled to `/generate`.
   - The runtime returned `404`, even though the checked-in proxy source includes `/generate`.
   - That means the running proxy was almost certainly not the same contract as the current source: stale container/image, wrong target service, or misrouted `LLM_PROXY_URL`.

2. **HERE provider integration/configuration mismatch**
   - The nearby path uses a hardcoded HERE endpoint and API-key request shape.
   - The live provider rejected the request with `403 Forbidden`, which indicates invalid/unauthorized credentials, wrong product entitlement, or endpoint/auth contract mismatch for the active HERE account.

3. **Weak degraded-path signaling**
   - After HERE `403`, Overpass also failed at the transport layer.
   - The backend then returned `200` with an empty result set, which is user-safe but operationally weak because the outage is only visible in logs and not clearly classified in the response path.

### Scope

- **In scope:** discovery provider runtime contract alignment, HERE client hardening, degraded-path signaling, regression tests, smoke verification
- **Out of scope:** redesigning Discover UI, replacing HERE with a different provider, changing PRD scope, building a map view

### Files Likely Touched

- `backend/apps/express-api/src/api/discovery/discoveryService.ts`
- `backend/apps/express-api/src/api/discovery/discoveryController.ts`
- `backend/apps/express-api/src/api/discovery/discoveryValidation.ts`
- `backend/apps/express-api/src/services/hereMapsClient.ts`
- `backend/apps/express-api/src/services/index.ts`
- `backend/apps/express-api/src/services/llmClient.ts` or a new shared discovery LLM client module
- `backend/apps/express-api/tests/discovery/discoveryService.test.ts`
- `backend/apps/express-api/tests/discovery/discoveryRouter.test.ts`
- `backend/apps/llm-proxy/src/index.ts` only if runtime contract/documentation tightening is needed
- `docker-compose.yml` and setup docs only if verification or health checks need adjustment

### Implementation Guidance

- Eliminate duplicated internal proxy contracts where practical. Discovery should not own a one-off raw fetch path if the platform already has a proxy client abstraction.
- Treat `404` from the proxy as a deployment-contract problem first, not as an upstream LLM provider problem.
- Treat HERE `403` as a configuration/auth class of failure and log enough context to tell whether the key, entitlement, or endpoint is wrong.
- Prefer truthful degraded behavior over fabricated success, but keep the user-facing behavior safe and predictable.
- Add one smoke path that proves the running `llm-proxy` actually serves `/generate` before considering the stack healthy for Discover.

### Test Focus

1. Discovery trending degrades predictably when `/generate` returns `404`.
2. Shared proxy contract changes are covered in one place, not duplicated in discovery.
3. HERE `403` is classified and followed by fallback behavior.
4. HERE failure plus Overpass transport failure returns a truthful nearby degraded outcome.
5. Runtime drift between checked-in source and running containers is detectable by smoke validation.

## Change Classification

Moderate

## Handoff

Route to Product Owner / Developer agents for backlog reorganization plus direct implementation.

## Dev Agent Record

### Implementation Plan

- Write failing regression tests for LLM proxy contract mismatch, HERE `403`, and dual-provider nearby failure before changing runtime code.
- Consolidate discovery structured-generation calls behind a shared LLM proxy client contract and classify route/version drift explicitly.
- Harden HERE and nearby fallback classification so degraded results stay user-safe while emitting actionable diagnostics.
- Add smoke verification guidance for `/generate` runtime availability in Docker Compose deployments.

### Debug Log

- 2026-07-06: Activated `bmad-dev-story` workflow for Story 3.5.
- 2026-07-06: Confirmed runtime drift risk: discovery uses raw `POST /generate` fetches while shared LLM client uses `POST /complete`.
- 2026-07-06: Confirmed HERE client still targets `https://places.ls.hereapi.com/places/v1/browse` and nearby fallback currently returns silent empty arrays when both providers fail.
- 2026-07-06: Added failing regression tests for LLM proxy `404`, HERE `403`, and dual-provider nearby failure before implementation.
- 2026-07-06: Introduced shared `generateStructured()` client plus `LlmProxyContractError` in `src/services/llmClient.ts`.
- 2026-07-06: Switched HERE nearby lookup to `https://discover.search.hereapi.com/v1/discover` and classified configuration vs timeout vs transport vs invalid-response failures with `HereMapsProviderError`.
- 2026-07-06: Added `searchNearbyDetailed()` degraded metadata path and explicit degraded logging in discovery service.
- 2026-07-06: Updated Docker Compose `llm-proxy` healthcheck and README smoke steps to verify `/generate` route presence via expected `400 VALIDATION_ERROR`.
- 2026-07-06: Verification complete: `pnpm exec vitest run tests/discovery/discoveryService.test.ts tests/story-3-1.test.ts`, `pnpm typecheck`, `pnpm lint`, and full `pnpm test` all passed.

### Completion Notes

Story 3.5 is complete and ready for review. Discovery trending now uses the shared express-api LLM proxy client instead of duplicated raw `/generate` fetches, and runtime route drift is classified explicitly through `LlmProxyContractError` so `/generate` `404/405` failures log as contract mismatches before returning the existing user-safe `TRENDING_UNAVAILABLE` degraded path.

Nearby discovery now treats HERE authorization/configuration failures separately from timeout, transport, and response-shape issues, updates the HERE endpoint to the current Search Discover contract, and carries degraded metadata through `searchNearbyDetailed()` so HERE failure plus Overpass failure yields explicit server-side degraded logging instead of a silent empty-success pattern. Docker Compose smoke coverage now probes `/generate` directly, and README verification steps document the expected `400 VALIDATION_ERROR` contract check.

## File List

- `backend/apps/express-api/src/api/discovery/discoveryService.ts` — Replaced duplicated proxy fetches with shared structured-generation client usage; added explicit nearby degraded logging.
- `backend/apps/express-api/src/services/llmClient.ts` — Added `generateStructured()` and `LlmProxyContractError` for shared `/generate` contract handling.
- `backend/apps/express-api/src/services/hereMapsClient.ts` — Updated HERE endpoint and added `HereMapsProviderError` classification for configuration, timeout, transport, and invalid-response failures.
- `backend/apps/express-api/src/services/index.ts` — Added `NearbySearchOutcome`/`searchNearbyDetailed()` degraded metadata flow while preserving `searchNearby()` array API.
- `backend/apps/express-api/tests/discovery/discoveryService.test.ts` — Added regression coverage for proxy `404` classification and degraded nearby logging.
- `backend/apps/express-api/tests/story-3-1.test.ts` — Added regression coverage for HERE `403` classification, degraded nearby fallback logging, and updated endpoint expectation.
- `docker-compose.yml` — Hardened `llm-proxy` healthcheck to verify `/generate` route presence through expected validation failure instead of only `/health`.
- `README.md` — Documented Docker and non-Docker smoke checks that detect `/generate` contract drift before Discover requests fail.

## Change Log

- 2026-07-06: Story moved to `in-progress` and implementation plan recorded.
- 2026-07-06: Unified discovery structured-generation calls behind shared LLM client contract and explicit proxy route-drift classification.
- 2026-07-06: Hardened HERE provider integration and nearby degraded-path observability.
- 2026-07-06: Added regression tests plus `/generate` smoke verification in Docker Compose and README.
