---
baseline_commit: 03880dd40f2c822ebbaa5e3103a5df5f9654ddb4
---

# Story 1.11: Error Monitoring Compatibility Fix

Status: ready-for-dev

## Story

As a **developer**,
I want the client error monitoring integration to stop breaking Expo web startup,
So that `npm run web` and the shared app shell can boot reliably while production error reporting remains available through a supported integration path.

## Acceptance Criteria

1. Given a developer runs `cd frontend && npm run web`, when Expo serves the web app and evaluates `frontend/app/_layout.tsx`, then the startup path completes without throwing `Error: Cannot pipe to a closed or destroyed stream`, `TypeError: Cannot read property '__extends' of undefined`, or any equivalent monitoring-import startup failure.
2. Given the current Expo frontend stack, when client monitoring is configured, then the chosen integration path is compatible with Expo SDK 54 / Expo Router / React Native Web and does not require a root-layout import that can crash app startup.
3. Given development builds, Expo Go, or unsupported monitoring environments, when monitoring cannot initialize safely, then the app fails closed: navigation, providers, notifications, and screen rendering still work without a fatal exception.
4. Given a post-boot render error, when `ErrorBoundary` catches it, then the error is routed through the same monitoring adapter or a documented no-op fallback before the fallback UI renders.
5. Given the story changes are complete, when I inspect tests and configuration, then they verify web startup safety, the incompatible import path is removed or isolated, and the supported monitoring decision is documented.

## Tasks / Subtasks

- [ ] Task 1: Isolate monitoring behind a compatibility-safe adapter (AC: 1-4)
  - [ ] Create a small monitoring module, such as `frontend/lib/monitoring.ts`, that owns init and capture behavior
  - [ ] Remove direct `sentry-expo` imports from `frontend/app/_layout.tsx`
  - [ ] Remove direct `sentry-expo` imports from `frontend/components/ErrorBoundary.tsx`
  - [ ] Ensure the adapter exposes safe no-op behavior when monitoring is unavailable or intentionally disabled

- [ ] Task 2: Replace the incompatible runtime path with a supported integration choice (AC: 1-3, 5)
  - [ ] Audit the current dependency/config path (`frontend/package.json`, `frontend/app.json`, lockfile) and select the supported monitoring SDK/plugin combination for the current Expo stack
  - [ ] If the current package is unsupported, migrate to the supported package or temporarily stub production monitoring behind the adapter until the supported package is installed
  - [ ] Preserve `SENTRY_DSN` or equivalent env-based configuration semantics where possible

- [ ] Task 3: Keep root layout behavior intact (AC: 1, 3)
  - [ ] Preserve `SafeAreaProvider`, `NetworkStatusProvider`, `ErrorBoundary`, `StatusBar`, `Stack`, and notification listener setup in `frontend/app/_layout.tsx`
  - [ ] Ensure monitoring bootstrap cannot block route rendering even when env vars are missing or the monitoring SDK is unavailable

- [ ] Task 4: Add regression coverage and update story tests (AC: 1-5)
  - [ ] Replace Story 1.10 structural assertions that require `import * as Sentry from 'sentry-expo'`
  - [ ] Add tests proving `_layout.tsx` does not depend on the incompatible module path directly
  - [ ] Add tests proving `ErrorBoundary` reports through the shared monitoring adapter
  - [ ] Add tests or documentation checks for the chosen compatibility approach

## Dev Notes

### Trigger and Evidence

- Reported runtime failure:
  - `Error: Cannot pipe to a closed or destroyed stream`
  - Stack excerpt: `respond (.../frontend/node_modules/expo-server/src/vendor/http.ts:138:19)`
  - Prior related failure already captured in corrective work: `TypeError: Cannot read property '__extends' of undefined`
- Crash location:
  - `npm run web` during Expo web startup / request handling
  - `frontend/app/_layout.tsx`
  - Import line: `import * as Sentry from 'sentry-expo';`
- Related code path:
  - `frontend/components/ErrorBoundary.tsx` also imports from `sentry-expo`

### Root Cause Hypothesis

The current monitoring package/runtime path is incompatible with the active Expo frontend stack, including the web target. Because `_layout.tsx` imports the package at module scope, the incompatibility can crash the app before React can render the shell and can surface in Expo's web response pipeline as a closed-stream error. The issue is not the requirement for error monitoring; it is the boot-time integration strategy.

### Scope

- **In scope:** frontend monitoring bootstrap, ErrorBoundary reporting path, app/config dependency alignment, regression tests, story documentation
- **Out of scope:** backend observability changes, PRD changes, UX redesign, unrelated shell refactors

### Files Likely Touched

- `frontend/app/_layout.tsx`
- `frontend/components/ErrorBoundary.tsx`
- `frontend/lib/monitoring.ts` or equivalent
- `frontend/package.json`
- `frontend/package-lock.json`
- `frontend/app.json`
- `frontend/tests/story-1-10.test.mjs`
- `frontend/tests/story-1-11.test.mjs`

### Implementation Guidance

- Prefer a single monitoring adapter so shell code is not coupled to a vendor-specific runtime import.
- Treat app startup as the highest-priority path: if monitoring is misconfigured, unsupported, or absent, the app must still boot.
- Keep the existing product intent from Story 1.10: production errors should still be capturable once a compatible path is in place.
- If the final implementation requires temporarily disabling monitoring in unsupported environments, document that clearly and keep the adapter contract stable for later re-enablement.

### Test Focus

1. Root layout does not import the incompatible runtime directly.
2. Monitoring initialization cannot throw during app boot or Expo web request handling.
3. ErrorBoundary uses the shared adapter instead of the incompatible package import.
4. Existing layout providers and notification setup remain present.
5. The compatibility decision is reflected in configuration and tests.

## Change Classification

Minor

## Handoff

Route to Developer agent for direct implementation.
