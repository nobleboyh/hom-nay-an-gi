# Sprint Change Proposal: Ingredient Search Relevance Regression

Date: 2026-06-26
Mode: Batch
Change Trigger: After the user enters available ingredients and taps `Tìm món`, unrelated dishes still appear in results, indicating the search engine is not enforcing ingredient relevance correctly.

## 1. Issue Summary

The reported issue affects the core Epic 2 search loop: users add ingredients they have on hand, but the results still include dishes that are not meaningfully related to those ingredients. This conflicts with the PRD promise that ingredient input should lead to relevant dish suggestions, with partial matches shown only when no full match exists.

Evidence from the current implementation points to the main LLM-backed search path:

- `backend/apps/express-api/src/api/recipes/recipesService.ts` accepts any schema-valid LLM dish list and caches it before checking semantic overlap with the user's ingredients.
- `backend/packages/shared/src/services/seedMatcher.ts` already filters deterministic fallback results to positive-overlap matches, so the degraded path is stricter than the primary path.
- `backend/packages/shared/src/services/prompts.ts` encourages matching dishes but does not provide a runtime guarantee.

## 2. Impact Analysis

### Checklist Status

- [x] 1.1 Triggering story identified: Story 2.1 (LLM Integration) and Story 2.2 (Recipes API Module) together own the broken path; corrective work is tracked as new Story 2.7.
- [x] 1.2 Core problem defined: Technical limitation discovered during implementation. Structured LLM output is validated for shape, but not for ingredient relevance.
- [x] 1.3 Evidence gathered: user-reported irrelevant dishes, current `recipesService.ts` cache/return flow, stricter `seedMatcher.ts` fallback behavior, and missing regression coverage.
- [x] 2.1 Current epic assessed: Epic 2 remains valid but needs a corrective story.
- [x] 2.2 Epic-level change required: add one corrective story under Epic 2.
- [x] 2.3 Remaining epics reviewed: Epics 3 and 4 do not need scope changes.
- [x] 2.4 Future epics validity checked: no future epic is invalidated.
- [x] 2.5 Priority/order reviewed: this corrective story should be implemented before further search tuning work.
- [x] 3.1 PRD conflict check: no PRD rewrite needed; the fix restores intended behavior.
- [x] 3.2 Architecture conflict check: architecture remains valid; search-service validation and cache handling need tightening.
- [x] 3.3 UX conflict check: no UX redesign required.
- [x] 3.4 Secondary artifact impact identified: prompt instructions, cache behavior, tests, sprint tracking, and Epic 2 story inventory.
- [x] 4.1 Direct adjustment evaluated: viable.
- [N/A] 4.2 Rollback evaluated: not justified.
- [N/A] 4.3 PRD MVP review evaluated: MVP scope unchanged.
- [x] 4.4 Recommended path selected: Option 1, Direct Adjustment.
- [x] 5.1-5.5 Proposal components prepared.
- [!] 6.3 Explicit user approval still required before implementation.
- [x] 6.4 Sprint status updated for new story tracking.

### Epic Impact

- **Epic 2** is affected.
- Stories **2.1** and **2.2** remain done but need a corrective follow-up because the primary LLM-backed search path lacks a runtime relevance guardrail.
- New corrective story proposed:
  - **Story 2.7: Search Relevance Guardrails**

### Artifact Impact

- **PRD:** No content change required. The current PRD already defines relevance and partial-match behavior correctly.
- **Architecture:** No structural redesign required. The fix stays within search validation, prompt guidance, and cache policy.
- **UX:** No wireframe or flow change required. Results should simply become more trustworthy.
- **Implementation artifacts:** Epic inventory, sprint status, and a new ready-for-dev story are required.

### Technical Impact

- LLM dishes need semantic relevance validation before caching and response emission.
- Search cache behavior must avoid serving stale invalid results created before the guardrail exists.
- Prompt instructions should be strengthened, but backend validation must remain the authoritative gate.
- Regression tests need coverage for LLM payloads that are well-formed but irrelevant.

## 3. Recommended Approach

Recommended path: Direct Adjustment.

Rationale:

- The defect is isolated to the recipe search implementation path and does not require product or UX replanning.
- Deterministic fallback behavior already demonstrates the intended relevance rule; the primary path should be brought up to that same standard.
- A focused corrective story keeps sprint momentum and avoids reopening broader design or architecture work.

Effort estimate: Medium
Risk level: Medium
Timeline impact: One corrective backend-focused story plus regression tests.

## 4. Detailed Change Proposals

### Stories

Story: Epic 2  
Section: Story list

OLD:
- Story 2.6 is the last Epic 2 story

NEW:
- Add Story 2.7: Search Relevance Guardrails

Rationale: the current completed Epic 2 inventory has no dedicated corrective item for semantically irrelevant recipe search results.

Story: 2.7 Search Relevance Guardrails  
Section: Acceptance Criteria

OLD:
- No dedicated story exists requiring server-side rejection of zero-overlap LLM dishes

NEW:
- Add a corrective ready-for-dev story that requires:
  - server-side ingredient overlap validation for LLM dishes
  - deterministic fallback when validated LLM results are empty
  - cache bypass/versioning for stale invalid result sets
  - regression tests covering unrelated-dish payloads

Rationale: the bug is not a UI issue; it is a missing contract in the backend search path.

### PRD

No change proposed.

### Architecture

No architecture document change proposed. The implementation should remain within the existing recipe search module and shared services.

### UI/UX

No UI/UX change proposed.

### Sprint Status

Story: sprint status  
Section: Epic 2 tracking

OLD:
- `2-6-shopping-list-screen: done`

NEW:
- `2-6-shopping-list-screen: done`
- `2-7-search-relevance-guardrails: ready-for-dev`

Rationale: the corrective work needs formal sprint tracking and handoff.

## 5. Implementation Handoff

Scope classification: Minor

Route to: Developer agent for direct implementation

Implementation responsibilities:

- Add a shared ingredient-overlap relevance validator.
- Filter LLM dishes before caching and returning them from `recipesService.searchByIngredients()`.
- Fall back deterministically when the validated LLM list becomes empty.
- Refresh, invalidate, or version cache entries that can contain stale invalid results.
- Add regression tests proving unrelated dishes cannot survive LLM, degraded, or cache-assisted paths.

Success criteria:

- Searching by ingredients no longer returns unrelated dishes.
- Partial matches still work for weak or unknown ingredient combinations, but only when they are actually related.
- Cache no longer serves stale irrelevant results after the fix.
- Regression tests explicitly cover the reported failure mode.

## 6. Approval / Next Step

Proposal prepared and Story 2.7 created. User approval is the remaining gate before implementation.
