---
baseline_commit: c4c1d02
---

# Story 1.10: Client Error Monitoring

Status: done

## Story

As a **developer**,
I want client-side crash and error reporting integrated from day one,
So that production errors are captured, grouped, and actionable before users report them.

## Acceptance Criteria

1. Given the app is running, when an uncaught JavaScript error occurs, then the error is captured and sent to Sentry with: stack trace, device info (OS version, Expo SDK version, app version), and breadcrumb trail.
2. Given the ErrorBoundary (Story 1.3), when a render error is caught, then the error is reported to Sentry before showing the fallback UI.
3. Given the Sentry configuration, when running in dev mode, then error reporting is disabled (no dev noise). Enabled only in production builds.
4. Given the `.env.template`, when I read it, then `SENTRY_DSN` is documented with setup instructions.

## Tasks / Subtasks

- [x] Task 1: Install sentry-expo (AC: 1)
  - [x] Install `sentry-expo` via `npx expo install sentry-expo` (ensures SDK 56 compatible version)
  - [x] Verify no peer dependency conflicts with Expo SDK 56 + React 19.2.3 + React Native 0.85.3
  - [x] Run `npx tsc --noEmit` to confirm no type errors from the new package

- [x] Task 2: Add sentry-expo plugin to app.json (AC: 1)
  - [x] Add `"sentry-expo"` to the `plugins` array in `frontend/app.json`
  - [x] Must preserve all existing plugins: expo-router, expo-splash-screen, expo-sqlite, expo-secure-store

- [x] Task 3: Initialize Sentry in _layout.tsx (AC: 1, 3)
  - [x] Import and call `Sentry.init()` at the top of `frontend/app/_layout.tsx`, BEFORE the RootLayout component
  - [x] Configuration: `dsn` from `process.env.SENTRY_DSN` (fallback to empty string if not set), `enableInExpoDevelopment: false`, `debug: false`, `integrations: []` (no extra integrations needed for Foundation), `tracesSampleRate: 0.1` (10% to stay within free tier limits)
  - [x] The `Sentry.init()` call MUST be before any component code — it must happen at module evaluation time, not inside a component render
  - [x] Must preserve all existing imports and layout structure (SafeAreaProvider, NetworkStatusProvider, ErrorBoundary, StatusBar, Stack)

- [x] Task 4: Wire ErrorBoundary to report errors to Sentry (AC: 2)
  - [x] In `frontend/components/ErrorBoundary.tsx`, import `Sentry` from `sentry-expo`
  - [x] In `componentDidCatch(error, errorInfo)`: call `Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } })` BEFORE the existing `console.error` call
  - [x] Must preserve all existing ErrorBoundary behavior: getDerivedStateFromError, fallback UI with "Đã xảy ra lỗi giao diện", reset button, styles
  - [x] Must preserve the existing `console.error` call — it stays as a fallback/debug aid

- [x] Task 5: Update .env.template (AC: 4)
  - [x] Add `SENTRY_DSN=replace-with-your-sentry-dsn` placeholder
  - [x] Add a comment line with Sentry setup link: `# Get your DSN at https://docs.sentry.io/product/sentry-basics/dsn-explainer/`
  - [x] Must preserve existing entries: API_BASE_URL, GOOGLE_CLIENT_ID

- [x] Task 6: Write tests (AC: 1-4)
  - [x] Create `frontend/tests/story-1-10.test.mjs` — node:test, `.mjs` extension
  - [x] Test: sentry-expo is in package.json dependencies
  - [x] Test: sentry-expo is in app.json plugins array
  - [x] Test: _layout.tsx calls Sentry.init before RootLayout
  - [x] Test: ErrorBoundary componentDidCatch calls Sentry.captureException
  - [x] Test: .env.template has SENTRY_DSN placeholder
  - [x] Test: Sentry config has enableInExpoDevelopment: false
  - [x] Add `tests/story-1-10.test.mjs` to the `test` script in `frontend/package.json`
  - [x] Run `npm test` — ensure all tests pass (existing + new)

## Dev Notes

### Story Foundation

- Epic 1 Story 1.10 is the FINAL story in Epic 1. When complete, the project foundation is fully established: Docker infrastructure, Express backend, Expo frontend, design system, component library, seed data, middleware, CI/CD, state management, and error monitoring. Epic 2 (Core Loop) can then begin. [Source: `_bmad-output/planning-artifacts/epics/epic-1.md#story-110`]
- This story satisfies **NFR-12 (Error Tracking)**: "Client-side crash/error reporting via Sentry or equivalent. Backend errors tracked via OpenTelemetry." Only the client side is in scope — OpenTelemetry for backend is deferred. [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md#NFR-12`]
- The ErrorBoundary exists and functions (Story 1.3, committed). It catches render errors, logs to console, and shows a fallback UI with a "Thử lại" (retry) button. This story adds Sentry reporting to that existing flow. [Source: `frontend/components/ErrorBoundary.tsx`]
- `_layout.tsx` currently wraps with SafeAreaProvider > NetworkStatusProvider > ErrorBoundary > Stack. Sentry.init() must be called at module level BEFORE RootLayout renders. [Source: `frontend/app/_layout.tsx`]

### Architecture Compliance

- **Error handling is three-tier**: Global (ErrorBoundary / errorHandler), Module (service layer), User-facing (Toast / controller). This story operates at the Global tier for the frontend. Sentry is the reporting backend for that tier. [Source: `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md#error-handling-three-tier`]
- **Dev mode disabled**: Sentry MUST be disabled in development (`enableInExpoDevelopment: false`). Dev noise must not pollute production dashboards or consume event quota. [Source: `_bmad-output/planning-artifacts/epics/epic-1.md#story-110-ac-3`]
- **No backend changes**: Sentry is frontend-only for Epic 1. Backend OpenTelemetry is deferred to a future epic. [Source: architecture CI/CD section]
- **Plugin order in app.json**: The sentry-expo plugin should be added to the existing plugins array. The exact position doesn't matter but convention puts it near the top after expo-router. [Source: Expo docs]

### Technical Requirements

- **sentry-expo (SDK 56)**: Use `npx expo install sentry-expo` to get the Expo SDK 56 compatible version. `sentry-expo` wraps the base `@sentry/react-native` SDK and adds Expo-specific device context. [Source: Expo SDK 56 docs]
- **Sentry.init() placement**: Must be at module TOP LEVEL, before any imports of components that might throw. In practice this means before the `export default function RootLayout()` line, but after all import statements. The `Sentry.init()` call is synchronous and lightweight — it queues events if no DSN is configured.
- **ErrorBoundary wiring**: React error boundaries only catch render errors. Uncaught JS errors in event handlers, async code, etc. are caught by Sentry's global error handler (which `Sentry.init()` sets up automatically). The ErrorBoundary wiring is specifically for React render errors that bubble to the boundary.
- **Breadcrumb trail**: Sentry automatically captures navigation breadcrumbs via Expo Router integration when `sentry-expo` plugin is added to `app.json`. No manual breadcrumb code needed.
- **Device context**: `sentry-expo` plugin automatically enriches events with: OS version, device model, Expo SDK version, app version, and release channel. No manual device info collection needed.

### Library / Version Notes

- **sentry-expo**: The Expo-managed wrapper around `@sentry/react-native`. Use `npx expo install` (not `npm install`) to get the correct SDK 56 version. The plugin adds native crash reporting on iOS (via sentry-cocoa) and Android (via sentry-android). [Source: Expo SDK 56 Sentry docs]
- **sentry-expo free tier**: 5,000 errors/month, 30-day retention. For the Foundation phase and MVP, this is more than sufficient. Upgrade considerations are deferred. [Source: Sentry pricing]
- **No additional configuration files needed**: `sentry-expo` does not require a separate `sentry.properties` file for basic usage. Uploading source maps for production builds requires `@sentry/react-native` metro plugin, but that's a build configuration concern deferred to Epic 6 (Deployment). [Source: Sentry Expo docs]
- **Node.js native test runner**: Same as previous stories — `node --test`, `.mjs` extension, `node:assert/strict`. [Source: `frontend/tests/story-1-3.test.mjs`]

### File Structure Requirements

**New files:**
- `frontend/tests/story-1-10.test.mjs`

**Files that must be updated:**
- `frontend/app/_layout.tsx` — add `Sentry.init()` at module level before RootLayout
- `frontend/components/ErrorBoundary.tsx` — import Sentry, call `Sentry.captureException()` in componentDidCatch
- `frontend/app.json` — add `"sentry-expo"` to plugins array
- `frontend/.env.template` — add `SENTRY_DSN` placeholder with documentation link
- `frontend/package.json` — add `sentry-expo` dependency, append `tests/story-1-10.test.mjs` to test script

**Files that must NOT be changed:**
- `backend/src/**` — no backend changes
- `frontend/app/(tabs)/**` — no tab screen changes
- `frontend/components/index.ts` — barrel export unchanged
- `frontend/stores/**` — no store changes
- `frontend/lib/**` — no lib changes (except if the old networkStatus.ts reference is there — already replaced by .tsx)
- `frontend/types/**` — no type changes
- `.github/workflows/**` — no CI changes
- `docker-compose.yml` — no Docker changes

### Files Being Updated: Current State / Required Change / Preserve

- **`frontend/app/_layout.tsx`**
  - Current state: 26 lines. Imports react-native-reanimated, then SafeAreaProvider, NetworkStatusProvider, ErrorBoundary, StatusBar, Stack. Wraps children in SafeAreaProvider > NetworkStatusProvider > ErrorBoundary > StatusBar + Stack. [Source: read at story creation]
  - Changes: Add `import * as Sentry from 'sentry-expo'` at the top. Call `Sentry.init({ dsn: process.env.SENTRY_DSN || '', enableInExpoDevelopment: false, debug: false, tracesSampleRate: 0.1 })` after all imports but before RootLayout export.
  - Must preserve: ALL existing imports, ALL existing layout structure, ALL screen definitions. The Sentry.init must NOT be inside RootLayout — it must be at module scope.

- **`frontend/components/ErrorBoundary.tsx`**
  - Current state: 93 lines. Class component with getDerivedStateFromError, componentDidCatch (console.error only), fallback UI with Vietnamese error message + reset button. Hardcoded colors. [Source: read at story creation]
  - Changes: Add `import * as Sentry from 'sentry-expo'` at top. In componentDidCatch: add `Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } })` BEFORE the existing console.error. That's the only code change.
  - Must preserve: ALL existing behavior — getDerivedStateFromError, componentDidCatch with console.error, reset method, fallback UI ("Đã xảy ra lỗi giao diện", "Thử lại"), all styles.

- **`frontend/app.json`**
  - Current state: 44 lines. Plugins array: expo-router, expo-splash-screen, expo-sqlite, expo-secure-store. [Source: read at story creation]
  - Changes: Add `"sentry-expo"` to the plugins array. Order within plugins: put it after `"expo-router"` but exact position is not critical.
  - Must preserve: ALL existing config — name, slug, version, orientation, icon, scheme, userInterfaceStyle, ios, android, web configs, ALL existing plugins, experiments block.

- **`frontend/.env.template`**
  - Current state: 3 lines. API_BASE_URL and GOOGLE_CLIENT_ID. [Source: read at story creation]
  - Changes: Add 2 lines: comment with documentation link, then `SENTRY_DSN=replace-with-your-sentry-dsn`.
  - Must preserve: API_BASE_URL and GOOGLE_CLIENT_ID lines.

- **`frontend/package.json`**
  - Current state: 51 lines. Scripts include test with 5 test files. Dependencies include expo, react, zustand, etc but NOT sentry-expo. [Source: read at story creation]
  - Changes: Add `sentry-expo` to dependencies (installed via `npx expo install`). Append `tests/story-1-10.test.mjs` to the `test` script.
  - Must preserve: ALL existing scripts, ALL existing dependencies, ALL existing devDependencies. Expo SDK 56 version pins must stay untouched.

### Previous Story Intelligence (Story 1.9)

- Status: `review`. All 11 tasks complete. 43 tests pass. CI/CD workflows, 3 Zustand stores, storageAdapter, NetworkStatusProvider, TabBar wiring all implemented. [Source: `_bmad-output/implementation-artifacts/1-9-cicd-workflows-zustand-store-scaffold.md`]
- **Patterns established by Story 1.9**:
  - New npm packages installed via `npx expo install` for Expo-managed packages, `npm install` for non-Expo packages. sentry-expo is an Expo-managed package → use `npx expo install`.
  - Test files in `frontend/tests/` with `.mjs` extension, ESM imports, `node:test` + `node:assert/strict`.
  - `package.json` test script explicitly lists all test files (not a glob pattern).
  - TypeScript typecheck must pass before marking story complete.
  - Modified files documented with current state / change / preserve pattern.
- **Key learnings**: TabBar did NOT need modification — Expo Router's Tabs component handles `aria-current` internally. This story's ErrorBoundary DOES need modification because Sentry must be called manually from componentDidCatch. `_layout.tsx` DOES need modification for Sentry.init.

### Git Intelligence Summary

- Baseline commit: `c4c1d02`. Frontend Story 1.9 files exist as working tree changes (not yet committed). The ErrorBoundary is committed from Story 1.3. [Source: git status]
- All infrastructure is in place. This is the LAST story in Epic 1 — the final piece before screens get populated in Epic 2.

### Testing Requirements

- Test file: `frontend/tests/story-1-10.test.mjs` — node:test, `.mjs` extension. [Source: existing test pattern]
- Tests are structural (file exists + contains required patterns), not behavioral. sentry-expo requires native runtime for behavioral tests (Expo Go / simulator).
- Each test should assert: file exists, file content matches expected patterns.
- Add `tests/story-1-10.test.mjs` to the test script in `package.json`.
- Run `npm test` to verify all test suites pass (6 total: 1.3, 1.4, 1.5, 1.6, 1.9, 1.10).

### Project Context Reference

- Epics: `_bmad-output/planning-artifacts/epics/epic-1.md` (Story 1.10 section). [Source: epics file]
- Previous story: `_bmad-output/implementation-artifacts/1-9-cicd-workflows-zustand-store-scaffold.md` (status: review). [Source: implementation artifacts]
- Architecture: `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md` — CI/CD & Environments section mentions error monitoring. [Source: architecture]
- ErrorBoundary source: `frontend/components/ErrorBoundary.tsx` (read at story creation).
- Layout source: `frontend/app/_layout.tsx` (read at story creation).

## Dev Agent Record

### Agent Model Used

Claude (via CommandCode)

### Debug Log References

- Story 1.10 implementation via dev-story workflow
- Baseline commit: c4c1d02
- typecheck: frontend passes (tsc --noEmit), backend passes (pnpm typecheck)
- test: 56 frontend tests pass (43 existing + 13 new), 39 backend tests pass (0 regressions)

### Completion Notes List

- Installed sentry-expo via `npx expo install` (SDK 56 compatible v52.x)
- Added sentry-expo plugin to app.json (preserving all existing plugins: expo-router, expo-splash-screen, expo-sqlite, expo-secure-store)
- Added Sentry.init() at module level in _layout.tsx: dsn from env, enableInExpoDevelopment: false, debug: false, tracesSampleRate: 0.1
- Wired ErrorBoundary componentDidCatch: calls BrowserSentry.captureException() BEFORE console.error, using Browser namespace from sentry-expo
- Updated .env.template: added SENTRY_DSN with documentation link to Sentry DSN explainer
- Updated package.json: sentry-expo dependency auto-added by expo install, test script includes story-1-10.test.mjs
- 56 tests total pass (13 new for Story 1.10, 43 existing). 0 regressions.
- Sentry automatically captures breadcrumbs, device context, and global JS errors via sentry-expo plugin. ErrorBoundary specifically captures React render errors.

### File List

- `_bmad-output/implementation-artifacts/1-10-client-error-monitoring.md` (story file, updated)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (updated)
- `frontend/app/_layout.tsx` (updated — added Sentry.init)
- `frontend/components/ErrorBoundary.tsx` (updated — added BrowserSentry.captureException)
- `frontend/app.json` (updated — added sentry-expo plugin)
- `frontend/.env.template` (updated — added SENTRY_DSN)
- `frontend/package.json` (updated — sentry-expo dependency + test script)
- `frontend/package-lock.json` (updated by expo install)
- `frontend/tests/story-1-10.test.mjs` (new — 13 tests)

### Review Findings

- [x] [Review][Defer] ErrorBoundary.reset() doesn't remount children — error loop if corrupted child state persists [ErrorBoundary.tsx] — deferred, requires key-prop remount pattern; existing behavior from Story 1.3
- [x] [Review][Patch] ErrorBoundary imports Browser namespace instead of Sentry main export — spec says `import Sentry from 'sentry-expo'` [ErrorBoundary.tsx:2]
