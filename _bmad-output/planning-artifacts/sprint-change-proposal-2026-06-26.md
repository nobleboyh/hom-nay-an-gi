# Sprint Change Proposal: Expo Web Startup Failure

Date: 2026-06-26
Mode: Batch
Change Trigger: `npm run web` fails in the frontend with `Error: Cannot pipe to a closed or destroyed stream` from `expo-server/src/vendor/http.ts:138:19`

## 1. Issue Summary

The current frontend foundation work includes direct `sentry-expo` imports in `frontend/app/_layout.tsx` and `frontend/components/ErrorBoundary.tsx`. The reported change trigger is a web startup failure when running `npm run web`, surfacing as:

```text
Error: Cannot pipe to a closed or destroyed stream
    at pipelineImpl (node:internal/streams/pipeline:264:15)
    at node:stream/promises:31:5
    at pipeline (node:stream/promises:20:10)
    at respond (.../frontend/node_modules/expo-server/src/vendor/http.ts:138:19)
```

This is consistent with the already-open corrective area around Story 1.11: the monitoring integration is coupled to root-layout startup and is a plausible cause of Expo web request handling failure before the shell is safely rendered.

## 2. Impact Analysis

### Checklist Status

- [x] 1.1 Triggering story identified: Story 1.10 introduced monitoring; Story 1.11 is the corrective follow-up.
- [x] 1.2 Core problem defined: Technical limitation discovered during implementation. The vendor-specific monitoring import path is unsafe in the current Expo web runtime.
- [x] 1.3 Evidence gathered: user-reported closed-stream error, current direct imports in `_layout.tsx` and `ErrorBoundary.tsx`, existing corrective story already reopened in sprint status.
- [x] 2.1 Current epic assessed: Epic 1 remains completable with a corrective story update.
- [x] 2.2 Epic-level change required: no new epic; tighten existing Story 1.11.
- [x] 2.3 Remaining epics reviewed: no scope change required for Epics 2-4.
- [x] 2.4 Future epics validity checked: none invalidated.
- [x] 2.5 Priority/order reviewed: Story 1.11 should remain ahead of additional frontend stabilization work.
- [x] 3.1 PRD conflict check: no PRD conflict; error monitoring is an implementation concern, not an MVP requirement change.
- [x] 3.2 Architecture conflict check: architecture still supports Expo SDK 54 + Expo Router; monitoring integration path needs alignment with that stack.
- [x] 3.3 UX conflict check: no UX redesign required.
- [x] 3.4 Secondary artifact impact: tests, app config, package dependencies, and story docs are affected.
- [x] 4.1 Direct adjustment evaluated: viable.
- [N/A] 4.2 Rollback evaluated: not justified.
- [N/A] 4.3 PRD MVP review evaluated: MVP scope unchanged.
- [x] 4.4 Recommended path selected: Option 1, Direct Adjustment.
- [x] 5.1-5.5 Proposal components prepared.
- [!] 6.3 Explicit user approval still required before implementation.
- [N/A] 6.4 Sprint status structure change: no new story ID added; status file can remain structurally unchanged.
- [x] 6.5 Handoff plan defined.

### Epic Impact

- Epic 1 is affected.
- Story 1.10 remains done as the original monitoring integration attempt.
- Story 1.11 remains the correct corrective story, but needed refinement to explicitly cover Expo web startup failure.

### Artifact Impact

- PRD: no changes needed.
- Architecture: no structural change required, but implementation must honor the existing Expo SDK 54 decision.
- UX: no changes needed.
- Implementation artifacts: Story 1.11 updated; sprint change proposal added.

### Technical Impact

- Root-layout startup path must stop importing monitoring code that can fail at module evaluation time.
- Error reporting must move behind a safe adapter or no-op fallback.
- Web startup regression tests must replace the old Story 1.10 assumptions that hard-code `sentry-expo` imports.

## 3. Recommended Approach

Recommended path: Direct Adjustment.

Rationale:

- The issue is localized to frontend monitoring bootstrap and test expectations.
- Existing planning already created Story 1.11, so introducing a second corrective story would duplicate scope and fragment execution.
- A focused update preserves sprint momentum and keeps the fix in the same epic where the regression was introduced.

Effort estimate: Low to Medium
Risk level: Low
Timeline impact: Minimal, limited to one corrective frontend story.

## 4. Detailed Change Proposals

### Stories

Story: 1.11 Error Monitoring Compatibility Fix
Section: Story statement

OLD:
- I want the client error monitoring integration to stop crashing the app shell at startup,
- So that the app can boot reliably while production error reporting remains available through a supported integration path.

NEW:
- I want the client error monitoring integration to stop breaking Expo web startup,
- So that `npm run web` and the shared app shell can boot reliably while production error reporting remains available through a supported integration path.

Rationale: The user-reported failure is specifically on the web target and should be explicit in the story intent.

Story: 1.11 Error Monitoring Compatibility Fix
Section: Acceptance Criteria

OLD:
- Startup criteria referenced only a generic app boot failure and the prior `__extends` crash.

NEW:
- AC now explicitly requires `cd frontend && npm run web` to complete startup without `Cannot pipe to a closed or destroyed stream`, `__extends`, or equivalent monitoring-import failures.
- AC now explicitly calls out Expo Router and React Native Web compatibility.

Rationale: The current corrective story was directionally correct but under-specified for the actual failure mode reported by the user.

Story: 1.11 Error Monitoring Compatibility Fix
Section: Trigger and Evidence / Root Cause Hypothesis / Test Focus

OLD:
- Evidence centered on a prior runtime error.

NEW:
- Added the exact `expo-server` closed-stream error and tied test focus to web request handling safety.

Rationale: The implementation team needs concrete evidence and a precise regression target.

## 5. Implementation Handoff

Scope classification: Minor

Route to: Developer agent for direct implementation

Implementation responsibilities:

- Replace direct `sentry-expo` imports in `frontend/app/_layout.tsx` and `frontend/components/ErrorBoundary.tsx`.
- Introduce a compatibility-safe monitoring adapter with no-op behavior when unsupported.
- Update config/tests to reflect the supported monitoring path.
- Verify `npm run web` startup succeeds after the change.

Success criteria:

- `npm run web` no longer fails with the reported closed-stream error.
- The app shell renders on web without monitoring-related startup crashes.
- ErrorBoundary still reports through the shared adapter or documented fallback.
- Story tests cover the new safe integration path.

## 6. Approval / Next Step

Proposal prepared and story updated. User approval is the remaining gate before implementation.
