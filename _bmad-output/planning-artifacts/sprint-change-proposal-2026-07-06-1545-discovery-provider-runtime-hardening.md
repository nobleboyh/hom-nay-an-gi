# Sprint Change Proposal: Discovery Provider Runtime Hardening

Date: 2026-07-06 15:45 ICT
Mode: Batch
Change Trigger: Discover runtime errors show trending failing through the LLM proxy with `404` on the expected generation route, while nearby discovery fails through HERE `403 Forbidden` and then loses its Overpass fallback.

## 1. Issue Summary

The issue is a provider-integration/runtime-drift failure in Epic 3 Discovery. It is not a UX design problem and not a PRD scope change. The backend currently depends on external provider contracts that are not being validated tightly enough against the deployed runtime.

Evidence from the reported logs and current code:

- `GET /api/v1/discovery/trending` fails with `LLM_PROVIDER_ERROR` and user-facing message `LLM proxy returned 404`.
- `backend/apps/express-api/src/api/discovery/discoveryService.ts` directly calls `POST ${proxyUrl}/generate`.
- `backend/apps/llm-proxy/src/index.ts` in the repo does expose `/generate`, so a live `404` implies the running proxy is stale, misrouted, or otherwise not the checked-in runtime contract.
- `GET /api/v1/discovery/nearby` logs HERE `403 Forbidden` from `backend/apps/express-api/src/services/hereMapsClient.ts`, which currently targets `https://places.ls.hereapi.com/places/v1/browse`.
- Overpass fallback then fails with `fetch failed`, after which the backend returns `200` with an empty result set.

## 2. Impact Analysis

### Checklist Status

- [x] 1.1 Triggering story identified: Epic 3 Discovery, mainly Story 3.1 and Story 3.2.
- [x] 1.2 Core problem defined: technical limitation / runtime contract drift discovered during implementation.
- [x] 1.3 Evidence gathered: reported logs, discovery service proxy contract, llm-proxy source contract, HERE client endpoint, and fallback behavior.
- [x] 2.1 Current epic assessed: Epic 3 remains viable but needs a corrective hardening story.
- [x] 2.2 Epic-level change required: add one corrective story under Epic 3.
- [x] 2.3 Remaining epics reviewed: no later epic is invalidated.
- [x] 2.4 Future epic validity checked: no new epic required.
- [x] 2.5 Priority/order reviewed: this should be implemented before more Discover polish work.
- [x] 3.1 PRD conflict check: no PRD rewrite required; this restores existing discovery reliability expectations.
- [x] 3.2 Architecture conflict check: architecture remains valid; provider contract hardening is required within the existing design.
- [x] 3.3 UX conflict check: no UX redesign required; empty/degraded states remain the correct fallback.
- [x] 3.4 Secondary artifact impact identified: Epic 3 story inventory, discovery service implementation, provider smoke checks, and regression tests.
- [x] 4.1 Direct adjustment evaluated: viable.
- [N/A] 4.2 Rollback evaluated: not justified.
- [N/A] 4.3 PRD MVP review evaluated: MVP scope unchanged.
- [x] 4.4 Recommended path selected: Option 1, Direct Adjustment.
- [x] 5.1-5.5 Proposal components prepared.
- [!] 6.3 Explicit user approval still required before implementation.

### Epic Impact

- **Epic 3** is affected because both trending and nearby discovery currently depend on fragile external-provider/runtime assumptions.
- Existing stories remain directionally correct, but a corrective story is needed:
  - **Story 3.5: Discovery Provider Runtime Hardening**

### Story Impact

- **Story 3.1: HERE Maps Client**
  - Main nearby-provider failure point. The HERE integration must be audited against the active credential/endpoint contract and classify provider failures more precisely.
- **Story 3.2: Discovery API Module**
  - Main trending-provider failure point. Discovery maintains its own raw `/generate` proxy contract instead of sharing one internal client path.
- **Story 3.3: DiscoverScreen**
  - No structural change required. The screen should continue honoring degraded/empty nearby behavior.
- **Story 3.4: Discover Nearby Location Relevance Regression Fix**
  - Complementary but separate. That story protects location truth; this new story protects provider/runtime truth.

### Artifact Impact

- **PRD:** No change proposed.
- **Architecture:** No structural redesign required, but provider verification and contract alignment need implementation-level tightening.
- **UX:** No redesign proposed.
- **Implementation artifacts:** new corrective story and sprint change proposal required.

### Technical Impact

- Discovery trending must stop depending on a runtime contract that can drift silently from the deployed `llm-proxy`.
- Discovery nearby must classify HERE authorization/configuration failures separately from transport failures.
- Combined HERE + Overpass failure should remain user-safe while becoming more observable and diagnosable.
- Regression and smoke coverage are needed to catch stale proxy runtimes before they surface as Discover outages.

## 3. Recommended Approach

Recommended path: Direct Adjustment.

Rationale:

- The failures are localized to provider integration and runtime verification, not to product scope.
- Existing PRD, architecture, and UX direction remain correct.
- A focused hardening story restores reliability without reopening broader planning.

Effort estimate: Medium
Risk level: Medium
Timeline impact: One corrective discovery story spanning backend contract alignment, provider classification, and regression/smoke coverage.

## 4. Detailed Change Proposals

### Stories

Story: Epic 3  
Section: Story list

OLD:
- Story 3.4 is the latest corrective Epic 3 story

NEW:
- Add Story 3.5: Discovery Provider Runtime Hardening

Rationale: the current Epic 3 inventory has no dedicated story for runtime/provider contract drift across the LLM proxy and HERE integrations.

Story: 3.5 Discovery Provider Runtime Hardening  
Section: Acceptance Criteria

OLD:
- No dedicated story exists requiring discovery to detect LLM proxy route drift or HERE provider authorization mismatch

NEW:
- Add a corrective ready-for-dev story that requires:
  - unifying the discovery LLM proxy contract
  - detecting `/generate` route/version drift explicitly
  - hardening HERE endpoint/auth usage and failure classification
  - preserving truthful degraded behavior when both nearby providers fail
  - adding regression and smoke coverage for proxy `404`, HERE `403`, and Overpass transport failure

Rationale: the issue is operational/provider hardening, not a missing feature.

### PRD

No change proposed.

### Architecture

No architecture document rewrite proposed. The implementation should stay inside the current Discovery API, llm-proxy, and HERE/Overpass fallback design.

### UI/UX

No UI/UX change proposed.

### Sprint Status

Story: sprint status  
Section: Epic 3 tracking

OLD:
- Epic 3 corrective work only covers location-relevance regression

NEW:
- Epic 3 also tracks `3-5-discovery-provider-runtime-hardening: ready-for-dev`

Rationale: provider/runtime hardening is now a distinct corrective track under Discovery.

## 5. Implementation Handoff

Scope classification: Moderate

Route to: Product Owner / Developer agents

Implementation responsibilities:

- Align discovery with a single internal LLM proxy contract.
- Add explicit detection/logging for stale or misrouted proxy runtimes.
- Audit and fix HERE endpoint/auth integration for the active credential model.
- Preserve safe degraded behavior while improving observability for nearby provider outages.
- Add regression and smoke coverage for the exact failure signatures reported.

Success criteria:

- `GET /api/v1/discovery/trending` no longer fails opaquely when the running proxy lacks `/generate`; the failure is classified and degrades predictably.
- HERE authorization/configuration failures are distinguishable from transport failures in logs and tests.
- Combined HERE + Overpass failure remains truthful and diagnosable.
- Smoke validation can detect a stale `llm-proxy` runtime before Discover traffic hits it.

## 6. Approval / Next Step

Proposal prepared and Story 3.5 created. User approval is the remaining gate before implementation.
