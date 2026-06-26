# Sprint Change Proposal: Disliked Ingredients Search Filter Regression

Date: 2026-06-26
Mode: Batch
Change Trigger: After login, when the user adds disliked ingredients in Settings and then searches for dishes, the results still include dishes containing those disliked ingredients.

## 1. Issue Summary

The issue affects the personalization contract across Epic 4 and the Epic 2 search loop. The product already defines disliked ingredients as exclusions that should influence suggestion relevance immediately on subsequent searches, but the current authenticated search flow does not enforce that rule.

Concrete evidence in the current codebase:

- `frontend/stores/dataStore.ts` sends recipe-search requests with `x-guest-id: web` and no authenticated preference context, even after login.
- `backend/apps/express-api/src/api/recipes/recipesService.ts` only accepts ingredients, tags, and cookTime, and has no dislike-based exclusion step.
- The preferences model and settings flows already exist (`dislikedIngredients[]` in the shared preference model, plus Story 4.7 and Story 4.8), so the gap is the integration between authenticated preferences and recipe search.

## 2. Impact Analysis

### Checklist Status

- [x] 1.1 Triggering story identified: the regression sits at the integration boundary between Story 4.7 (Settings API), Story 4.8 (Profile/Settings), and the Epic 2 recipe-search path.
- [x] 1.2 Core problem defined: implementation mismatch / missing authenticated personalization wiring.
- [x] 1.3 Evidence gathered: user report, PRD FR-23, authenticated search request path in `dataStore.ts`, and missing dislike filtering in `recipesService.ts`.
- [x] 2.1 Current epic assessed: Epic 4 remains valid but needs a corrective story.
- [x] 2.2 Epic-level change required: add one corrective story under Epic 4.
- [x] 2.3 Remaining epics reviewed: Epic 2 search implementation is touched, but no new epic or PRD scope is needed.
- [x] 2.4 Future epic validity checked: no future epic is invalidated.
- [x] 2.5 Priority/order reviewed: this corrective story should be implemented before additional personalization or search-tuning work.
- [x] 3.1 PRD conflict check: no PRD rewrite needed; the fix restores already-documented behavior.
- [x] 3.2 Architecture conflict check: architecture remains valid; authenticated search integration and cache policy need tightening.
- [x] 3.3 UX conflict check: no UX redesign required.
- [x] 3.4 Secondary artifact impact identified: Epic 4 story inventory, sprint status, search-request routing, cache behavior, and regression tests.
- [x] 4.1 Direct adjustment evaluated: viable.
- [N/A] 4.2 Rollback evaluated: not justified.
- [N/A] 4.3 PRD MVP review evaluated: MVP scope unchanged.
- [x] 4.4 Recommended path selected: Option 1, Direct Adjustment.
- [x] 5.1-5.5 Proposal components prepared.
- [!] 6.3 Explicit user approval still required before implementation.

### Epic Impact

- **Epic 4** is affected because the bug breaks the delivered personalization promise for authenticated users.
- Existing stories remain valid, but a focused corrective story is needed:
  - **Story 4.11: Disliked Ingredients Search Filter Regression Fix**

### Story Impact

- **Story 4.7: Settings API Module**
  - API contract remains valid and already supports `dislikedIngredients[]`.
- **Story 4.8: Profile/Settings Screens**
  - UI remains valid, but its saved dislike preferences are not reflected in search.
- **Epic 2 search path (Stories 2.2-2.4 at integration level)**
  - Search implementation must consume authenticated preference context and enforce exclusion rules.

### Artifact Impact

- **PRD:** No content change required. FR-23 already states disliked ingredients exclude dishes from suggestions and apply immediately to later searches.
- **Architecture:** No structural redesign required. The correction fits the existing authenticated-user, preference, and recipe-search architecture.
- **UX:** No wireframe or flow change required.
- **Implementation artifacts:** Epic inventory, sprint status, and a new ready-for-dev story are required.

### Technical Impact

- Authenticated recipe search must stop behaving like a guest request after login.
- The recipe-search service must apply dislike-based exclusion using authenticated preferences.
- Cache behavior must respect user-specific dislike filters so stale shared results do not bypass personalization.
- Regression tests are required across request routing, filtering, and preference-update flows.

## 3. Recommended Approach

Recommended path: Direct Adjustment.

Rationale:

- The defect is localized to the integration between existing preferences and existing recipe search.
- Product intent, UX, and backend preference schema already exist; the missing piece is enforcement.
- A small corrective story preserves momentum and avoids reopening broader planning artifacts.

Effort estimate: Medium
Risk level: Medium
Timeline impact: One corrective story spanning authenticated search plumbing, backend filtering, and tests.

## 4. Detailed Change Proposals

### Stories

Story: Epic 4  
Section: Story list

OLD:
- Story 4.10 is the last Epic 4 story

NEW:
- Add Story 4.11: Disliked Ingredients Search Filter Regression Fix

Rationale: the current Epic 4 inventory has no dedicated corrective item for authenticated dislike-based search personalization.

Story: 4.11 Disliked Ingredients Search Filter Regression Fix  
Section: Acceptance Criteria

OLD:
- No dedicated story exists requiring authenticated recipe search to exclude dishes matching `dislikedIngredients`

NEW:
- Add a corrective ready-for-dev story that requires:
  - authenticated search requests to carry authenticated context after login
  - backend exclusion of dishes whose ingredients overlap `dislikedIngredients`
  - cache handling that respects user-specific dislike filters
  - regression coverage for updated preferences and guest/no-preference behavior

Rationale: the bug is a missing integration contract, not a missing preference UI or schema.

### PRD

No change proposed.

### Architecture

No architecture document change proposed. The implementation should stay within the existing auth, preference, and recipe-search design.

### UI/UX

No UI/UX change proposed.

### Sprint Status

Story: sprint status  
Section: Epic 4 tracking

OLD:
- `4-10-authenticated-favorites-route-regression-fix: done`

NEW:
- `4-10-authenticated-favorites-route-regression-fix: done`
- `4-11-disliked-ingredients-search-filter-regression-fix: ready-for-dev`

Rationale: the corrective work needs formal sprint tracking and handoff.

## 5. Implementation Handoff

Scope classification: Minor

Route to: Developer agent for direct implementation

Implementation responsibilities:

- Restore authenticated context for recipe search after login.
- Load and apply `dislikedIngredients` during authenticated recipe search.
- Ensure cache behavior cannot re-serve disliked dishes to the wrong authenticated context.
- Add regression tests for authenticated, updated-preference, cached, and guest flows.

Success criteria:

- Logged-in users no longer receive dishes containing their disliked ingredients in search results.
- Updating disliked ingredients affects the next search immediately.
- Guest and empty-preference search behavior remains unchanged.
- Regression tests cover the reported failure mode end to end.

## 6. Approval / Next Step

Proposal prepared and Story 4.11 created. User approval is the remaining gate before implementation.
