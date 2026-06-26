# Sprint Change Proposal

## 1. Issue Summary

The mobile app crashes during root layout evaluation with:

- `TypeError: Cannot read property '__extends' of undefined`

The stack trace points to `frontend/app/_layout.tsx` importing `sentry-expo`. Because this import executes at app boot, the failure prevents the shell from rendering at all. The issue was identified on 2026-06-26 while loading the Expo Router root layout.

## 2. Impact Analysis

### Epic Impact

- **Epic 1** is affected.
- Existing foundation work remains broadly valid, but Story **1.10: Client Error Monitoring** needs a corrective follow-up:
  - **New Story 1.11: Error Monitoring Compatibility Fix**

### Story Impact

- **Story 1.10: Client Error Monitoring**
  - Marked done in artifacts, but the current `sentry-expo` runtime path is not safe in the active frontend stack.
- **Story 1.3: Frontend Initialization**
  - Impacted indirectly because `_layout.tsx` is the boot path for the entire Expo Router shell.
- **Story 4.9: Notification Infrastructure**
  - Impacted indirectly because notification wiring also lives in `_layout.tsx` and is blocked by the boot crash.

### Artifact Conflicts

- **PRD:** No conflict. NFR-12 still requires client-side error tracking; only the implementation path is changing.
- **Architecture:** No structural architecture change required. This is a compatibility correction within the frontend boot layer.
- **UX:** No UX redesign required. The visible behavior should stay the same except the app must boot successfully.
- **Implementation artifacts:** Epic inventory, sprint status, and the story backlog need updates.

### Technical Impact

- `frontend/app/_layout.tsx` imports `sentry-expo` at module scope, so any package/runtime incompatibility crashes the app before rendering.
- `frontend/components/ErrorBoundary.tsx` also imports `sentry-expo`, extending the same compatibility risk.
- Existing tests for Story 1.10 currently assert the incompatible import path, so they reinforce the broken implementation rather than the desired behavior.

## 3. Recommended Approach

### Selected Path

**Option 1: Direct Adjustment**

### Rationale

- The defect is localized to the error-monitoring integration path.
- Product requirements still hold; only the implementation choice is wrong for the current runtime.
- No rollback of broader frontend work is justified.
- No MVP scope reduction is needed if monitoring is migrated to a compatible adapter or isolated behind a safe fallback.

### Estimate and Risk

- **Effort:** Low to Medium
- **Risk:** Medium
- **Timeline impact:** One follow-up corrective story in the current sprint / immediate fix window

## 4. Detailed Change Proposals

### Stories

#### Story Inventory

Story: Epic 1  
Section: Story list

OLD:
- Story 1.10 is the last Epic 1 story

NEW:
- Add Story 1.11: Error Monitoring Compatibility Fix

Rationale: the current monitoring integration crashes the app shell at boot and needs a tracked remediation story.

#### New Story 1.11

Story: 1.11 Error Monitoring Compatibility Fix  
Section: Acceptance Criteria / Tasks

OLD:
- No dedicated follow-up story exists for the root-layout crash caused by the monitoring import

NEW:
- Add a ready-for-dev story that removes the startup crash path, preserves app boot, and restores production-safe client error monitoring through a compatible integration

Rationale: Story 1.10 established the intent, but a corrective story is needed to reconcile that intent with the current Expo runtime.

### PRD

No change proposed.

### Architecture

No architecture document change required. The implementation should continue to satisfy NFR-12 using a supported client-monitoring path.

### UI/UX

No change proposed.

### Sprint Status

Story: sprint status  
Section: Epic 1 status

OLD:
- `epic-1: done`
- `1-10-client-error-monitoring: done`

NEW:
- `epic-1: ready-for-dev`
- `1-10-client-error-monitoring: done`
- `1-11-error-monitoring-compatibility-fix: ready-for-dev`

Rationale: Epic 1 needs to reopen briefly to track and implement the corrective story formally.

## 5. Implementation Handoff

### Scope Classification

Minor

### Handoff Recipients

- **Developer agent**

### Responsibilities

- Replace or isolate the incompatible `sentry-expo` runtime path
- Keep `_layout.tsx` boot-safe in unsupported or development environments
- Preserve ErrorBoundary reporting through a shared monitoring adapter or documented no-op
- Update structural tests so they validate startup safety and the new supported integration
- Verify root layout, notification wiring, and navigation shell still load successfully

### Success Criteria

- App boot no longer crashes on the monitoring import in `_layout.tsx`
- Root layout providers and screens render normally
- Production monitoring remains available through a supported path or an explicitly documented temporary fallback
- ErrorBoundary still reports through the shared monitoring abstraction
- Regression tests no longer require the incompatible `sentry-expo` import path

## Checklist Status

- [x] 1.1 Triggering story identified: Story 1.10 Client Error Monitoring
- [x] 1.2 Core problem defined: technical incompatibility in the monitoring runtime import path
- [x] 1.3 Evidence captured: root-layout crash with `TypeError: Cannot read property '__extends' of undefined`
- [x] 2.1 Current epic assessed
- [x] 2.2 Epic-level change identified: add one corrective story
- [x] 2.3 Remaining epics reviewed: no broader product impact found
- [x] 2.4 No new epic required
- [x] 2.5 No resequencing required beyond briefly reopening Epic 1
- [x] 3.1 PRD conflict check completed
- [x] 3.2 Architecture conflict check completed
- [x] 3.3 UX conflict check completed
- [x] 3.4 Secondary artifact impact identified: sprint status, tests, implementation story inventory
- [x] 4.1 Direct adjustment viable
- [N/A] 4.2 Rollback not viable
- [N/A] 4.3 MVP review not needed
- [x] 4.4 Recommended path selected
- [x] 5.1 Issue summary created
- [x] 5.2 Impact documented
- [x] 5.3 Recommended path documented
- [x] 5.4 MVP impact and action plan defined
- [x] 5.5 Handoff plan established
- [x] 6.1 Checklist completion reviewed
- [x] 6.2 Proposal accuracy reviewed
- [ ] 6.3 Explicit user approval pending
