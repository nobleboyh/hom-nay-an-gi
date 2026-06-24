# Sprint Change Proposal

## 1. Issue Summary

Authenticated users cannot add dishes to Favorites after login. The issue was reported on 2026-06-24 with server logs showing:

- `POST /api/v1/favorites_guest HTTP/1.1` returned `404`

This is a regression in the post-login favorites flow. The product intent and existing Epic 4 requirements already expect authenticated favorites to use `/api/v1/favorites`, while guest users use local-only storage.

## 2. Impact Analysis

### Epic Impact

- **Epic 4** is affected.
- Existing completed stories remain valid, but one follow-up remediation story is needed:
  - **New Story 4.10: Authenticated Favorites Route Regression Fix**

### Story Impact

- **Story 4.3: AuthStore + StorageAdapter**
  - Impacted because transport switches correctly on auth state, but routing still uses guest collection names.
- **Story 4.4: Favorites API Module**
  - API contract remains valid and does not need change.
- **Story 4.6: FavoritesScreen**
  - Impacted at integration level because save/remove UI depends on the broken mutation path.

### Artifact Conflicts

- **PRD:** No conflict. PRD already states that guest users get local behavior and registered users sync favorites to cloud.
- **Architecture:** No architectural change required. The issue is an implementation mismatch within the existing storage-adapter design.
- **UX:** No UX redesign required. Existing login and favorites flows remain correct.
- **Implementation artifacts:** Sprint status and implementation story inventory need updates.

### Technical Impact

- Frontend favorites mutations are using guest collection names after login.
- `storageAdapter` derives authenticated API paths from collection names, so `favorites_guest` becomes `/api/v1/favorites_guest`.
- Error handling appears too weak for authenticated favorite mutations because the UI can appear to succeed even when the network path is invalid.

## 3. Recommended Approach

### Selected Path

**Option 1: Direct Adjustment**

### Rationale

- The defect is localized to the frontend storage-routing boundary.
- Requirements, API contract, and UX all remain valid.
- No rollback is justified.
- No MVP scope change is needed.

### Estimate and Risk

- **Effort:** Low
- **Risk:** Low to Medium
- **Timeline impact:** Small follow-up story within the current sprint or immediate next fix window

## 4. Detailed Change Proposals

### Stories

#### Story Inventory

Story: Epic 4  
Section: Story list

OLD:
- Story 4.9 is the last Epic 4 story

NEW:
- Add Story 4.10: Authenticated Favorites Route Regression Fix

Rationale: A production-facing regression was discovered after Epic 4 completion and needs a focused remediation story.

#### New Story 4.10

Story: 4.10 Authenticated Favorites Route Regression Fix  
Section: Acceptance Criteria / Tasks

OLD:
- No dedicated follow-up story exists for this regression

NEW:
- Add a ready-for-dev story that fixes authenticated favorite save/remove routing, preserves guest SQLite behavior, and adds regression coverage for Results and Recipe detail flows

Rationale: The existing stories define the intended behavior but do not provide a tracked remediation item for the discovered regression.

### PRD

No change proposed.

### Architecture

No change proposed.

### UI/UX

No change proposed.

### Sprint Status

Story: sprint status  
Section: Epic 4 status

OLD:
- `epic-4: done`

NEW:
- `epic-4: ready-for-dev`
- `4-10-authenticated-favorites-route-regression-fix: ready-for-dev`

Rationale: Epic 4 needs to be reopened briefly to track this corrective story formally.

## 5. Implementation Handoff

### Scope Classification

Minor

### Handoff Recipients

- **Developer agent**

### Responsibilities

- Implement the route-mapping fix in frontend favorites flows
- Ensure authenticated save/remove calls use `/api/v1/favorites`
- Preserve guest SQLite behavior
- Add regression coverage for logged-in and guest modes
- Verify save flows from both Results and Recipe detail screens

### Success Criteria

- Logged-in users no longer trigger `/api/v1/favorites_guest`
- Logged-in save/remove favorites work end-to-end
- Guest favorites continue to work locally
- Regression tests cover the route-selection bug

## Checklist Status

- [x] 1.1 Triggering story identified: Epic 4 integration boundary between Stories 4.3, 4.4, and 4.6
- [x] 1.2 Core problem defined: implementation mismatch / routing regression
- [x] 1.3 Evidence captured: 404 log for `POST /api/v1/favorites_guest`
- [x] 2.1 Current epic assessed
- [x] 2.2 Epic-level change identified: add one corrective story
- [x] 2.3 Remaining epics reviewed: no broader impact found
- [x] 2.4 No new epic required
- [x] 2.5 No resequencing required beyond reopening Epic 4
- [x] 3.1 PRD conflict check completed
- [x] 3.2 Architecture conflict check completed
- [x] 3.3 UX conflict check completed
- [x] 3.4 Secondary artifact impact identified: sprint status, implementation story inventory, tests
- [x] 4.1 Direct adjustment viable
- [N/A] 4.2 Rollback not viable
- [N/A] 4.3 MVP review not needed
- [x] 4.4 Recommended path selected
- [x] 5.1 Issue summary created
- [x] 5.2 Impact documented
- [x] 5.3 Recommended path documented
- [x] 5.4 MVP impact and action plan defined
- [x] 5.5 Handoff plan established
