# Sprint Change Proposal: Discover Nearby Location Relevance Regression

Date: 2026-06-26
Mode: Batch
Change Trigger: In Discover, changing location to places like Cầu Giấy, Hà Nội still shows Hồ Chí Minh restaurants such as Bánh Mì Huỳnh Hoa, and other nearby-location selections also behave incorrectly.

## 1. Issue Summary

The issue affects the core trust model of Epic 3 Discover nearby results. The product contract says nearby discovery must reflect the user's chosen coordinates and radius, whether the location comes from GPS or manual district selection. The current implementation breaks that promise by returning a static Hồ Chí Minh fallback dataset when live nearby providers fail or return no matches.

Concrete evidence in the current codebase:

- `backend/apps/express-api/src/api/discovery/discoveryService.ts` contains a hardcoded `NEARBY_SEED` with Hồ Chí Minh restaurants including `Bánh Mì Huỳnh Hoa`.
- `getNearby()` falls back to that seed whenever HERE Maps / Overpass fail or return zero results.
- `frontend/app/(tabs)/discover.tsx` does update selected coordinates from GPS or the location picker, but it renders whatever the API returns, so cross-city fallback data appears as if it were truly nearby.

## 2. Impact Analysis

### Checklist Status

- [x] 1.1 Triggering story identified: the regression sits at the integration boundary between Story 3.1 (HERE Maps client), Story 3.2 (Discovery API), and Story 3.3 (DiscoverScreen).
- [x] 1.2 Core problem defined: implementation mismatch / incorrect fallback strategy for location-based discovery.
- [x] 1.3 Evidence gathered: user report, PRD FR-15, current `getNearby()` seed fallback behavior, and manual location switching flow in DiscoverScreen.
- [x] 2.1 Current epic assessed: Epic 3 remains valid but needs a corrective story.
- [x] 2.2 Epic-level change required: add one corrective story under Epic 3.
- [x] 2.3 Remaining epics reviewed: no new epic or PRD scope change is required.
- [x] 2.4 Future epic validity checked: no future epic is invalidated.
- [x] 2.5 Priority/order reviewed: this corrective story should be implemented before further Discover tuning.
- [x] 3.1 PRD conflict check: no PRD rewrite needed; the fix restores already-documented distance-based behavior.
- [x] 3.2 Architecture conflict check: architecture remains valid; nearby fallback and validation logic need tightening.
- [x] 3.3 UX conflict check: no redesign required, but empty/error states must be honored instead of false nearby cards.
- [x] 3.4 Secondary artifact impact identified: Epic 3 story inventory, sprint status, nearby fallback semantics, and regression tests.
- [x] 4.1 Direct adjustment evaluated: viable.
- [N/A] 4.2 Rollback evaluated: not justified.
- [N/A] 4.3 PRD MVP review evaluated: MVP scope unchanged.
- [x] 4.4 Recommended path selected: Option 1, Direct Adjustment.
- [x] 5.1-5.5 Proposal components prepared.
- [!] 6.3 Explicit user approval still required before implementation.

### Epic Impact

- **Epic 3** is affected because the bug breaks the nearby-discovery promise for both GPS and manual location selection.
- Existing stories remain valid, but a focused corrective story is needed:
  - **Story 3.4: Discover Nearby Location Relevance Regression Fix**

### Story Impact

- **Story 3.1: HERE Maps Client**
  - Client remains valid, but provider-returned results need stricter trust/validation at integration points.
- **Story 3.2: Discovery API Module**
  - Main impact area. `getNearby()` currently substitutes a static HCMC seed, which violates requested location semantics.
- **Story 3.3: DiscoverScreen**
  - UI remains structurally valid, but it must not preserve stale nearby results or present unrelated fallback cards for a newly selected city.

### Artifact Impact

- **PRD:** No content change required. FR-15 already defines location-aware, radius-based nearby discovery.
- **Architecture:** No structural redesign required. The fix stays within the existing HERE Maps + Overpass + Discover screen design.
- **UX:** No wireframe change required, but the already-defined empty/error state should be used when nearby truth is unavailable.
- **Implementation artifacts:** Epic inventory, sprint status, and a new ready-for-dev story are required.

### Technical Impact

- Nearby discovery must stop using a fixed-city seed fallback for unrelated coordinates.
- Backend nearby responses need location/radius consistency validation before being returned.
- DiscoverScreen should replace stale nearby data when location changes rather than visually carrying forward the last city's list.
- Regression tests are required across provider failure, empty-provider response, and location-switch flows.

## 3. Recommended Approach

Recommended path: Direct Adjustment.

Rationale:

- The defect is localized to the nearby-discovery fallback and integration behavior.
- PRD intent, UX flow, and architecture are already correct; the implementation violates them.
- A focused corrective story restores trust without reopening broader planning.

Effort estimate: Medium
Risk level: Medium
Timeline impact: One corrective discovery story spanning backend nearby behavior, frontend stale-state handling, and regression tests.

## 4. Detailed Change Proposals

### Stories

Story: Epic 3  
Section: Story list

OLD:
- Story 3.3 is the last Epic 3 story

NEW:
- Add Story 3.4: Discover Nearby Location Relevance Regression Fix

Rationale: the current Epic 3 inventory has no dedicated corrective item for location-inaccurate nearby results.

Story: 3.4 Discover Nearby Location Relevance Regression Fix  
Section: Acceptance Criteria

OLD:
- No dedicated story exists requiring nearby discovery to reject cross-city fallback results

NEW:
- Add a corrective ready-for-dev story that requires:
  - removing or strictly gating the HCMC-only nearby seed fallback
  - preserving requested location/radius truth in nearby responses
  - replacing stale nearby cards after location changes
  - regression coverage for GPS/manual location switching and provider failure

Rationale: the bug is not missing UI; it is a broken nearby-discovery truth contract.

### PRD

No change proposed.

### Architecture

No architecture document change proposed. The implementation should stay within the existing Discovery API, HERE Maps/Overpass, and Discover screen design.

### UI/UX

No UI/UX change proposed.

### Sprint Status

Story: sprint status  
Section: Epic 3 tracking

OLD:
- `epic-3: done`

NEW:
- `epic-3: ready-for-dev`
- `3-4-discover-nearby-location-relevance-regression-fix: ready-for-dev`

Rationale: the corrective work needs formal sprint tracking and handoff.

## 5. Implementation Handoff

Scope classification: Minor

Route to: Developer agent for direct implementation

Implementation responsibilities:

- Remove false cross-city nearby fallback behavior.
- Validate nearby items against requested coordinates and radius before returning them.
- Ensure Discover location changes replace stale nearby cards.
- Add regression tests for Hà Nội/Cầu Giấy switching, provider failure, and empty nearby states.

Success criteria:

- Changing Discover location to Cầu Giấy, Hà Nội no longer shows Hồ Chí Minh restaurants.
- Provider failure or zero-match cases show truthful empty/degraded nearby behavior instead of fake nearby cards.
- Manual and GPS location changes refresh nearby results consistently.
- Regression tests cover the reported failure mode end to end.

## 6. Approval / Next Step

Proposal prepared and Story 3.4 created. User approval is the remaining gate before implementation.
