---
baseline_commit: c4c1d028b98cd5749a4a7de38f9157c21cabac36
---

# Story 1.4: Design Tokens & i18n Catalog

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want a single source of truth for all design tokens and a bilingual Vietnamese-English string catalog,
so that all components and screens reference consistent values and support both languages from day one.

## Acceptance Criteria

1. Given `frontend/lib/tokens.ts`, when I import it in any component, then I can access all 11 semantic color tokens as OKLCH values with RGBA fallback: `bg`, `surface`, `fg`, `muted`, `border`, `accent`, `accentDim`, `accentStrong`, `success`, `warn`, `danger`.
2. Given `frontend/lib/tokens.ts`, when I inspect typography definitions, then I see 3 font stacks (`display`, `body`, `mono`) and 10 size roles with the correct size, weight, and line-height values from `DESIGN.md`.
3. Given `frontend/lib/tokens.ts`, when I inspect spacing definitions, then I see 11 spacing step values covering 2px through 44px.
4. Given `frontend/lib/tokens.ts`, when I inspect border radius definitions, then I see 5 radius values: `xs` (6px), `sm` (8px), `md` (12px), `lg` (18px), `full` (9999px).
5. Given `frontend/lib/tokens.ts`, when I inspect shadow definitions, then I see 3 shadow levels: `sm`, `md`, `lg` with values aligned to `DESIGN.md`.
6. Given `frontend/lib/tokens.ts`, when I inspect z-index definitions, then I see 5 levels: `base` (1), `dropdown` (50), `tabBar` (100), `toast` (200), `modal` (300).
7. Given `frontend/lib/tokens.ts`, when I inspect animation definitions, then I see 3 duration tokens (`fast`, `normal`, `slow`) and 3 easing tokens (`default`, `enter`, `exit`).
8. Given `frontend/lib/i18n.ts`, when I look up the key `home.searchButton`, then I get `Tìm món` in Vietnamese and `Find dishes` in English.
9. Given `frontend/lib/i18n.ts`, when I call `getLanguage()`, then it returns `'vi'` by default.
10. Given `frontend/lib/i18n.ts`, when I call `setLanguage('en')`, then all subsequent `t()` calls return English strings.
11. Given the i18n catalog, when I inspect the dictionaries, then they cover the microcopy defined in `EXPERIENCE.md` Voice and Tone plus required state copy for the 7 core screens.
12. Given the i18n catalog, when I run the story verification test, then it proves the `vi` and `en` dictionaries contain the same key set and that language persistence works.

## Tasks / Subtasks

- [x] Replace the current token stub with the project source of truth in `frontend/lib/tokens.ts` (AC: 1, 2, 3, 4, 5, 6, 7)
  - [x] Export semantic color tokens using the project naming convention already referenced by architecture: `accentDim` and `accentStrong` in code, while preserving the exact values from `DESIGN.md`.
  - [x] Keep the original OKLCH strings as the canonical token values and add an `oklchToRgba()` helper for runtime fallback where React Native style consumers need RGBA-compatible values.
  - [x] Export 3 font families and 10 typography roles derived from `DESIGN.md`: app title, screen title, section title, card title, card subtitle, button, chip label, meta, badge, micro.
  - [x] Export spacing, radius, shadow, z-index, and animation token groups with typed readonly objects so later component stories can consume them without re-declaring magic numbers.
  - [x] Export `accessibilityDefaults` from the token layer or a tightly-related helper, including the 44px minimum touch target, focus outline values, and reduced-motion-aware defaults expected by later component stories.
- [x] Replace the current i18n stub with a real bilingual catalog in `frontend/lib/i18n.ts` (AC: 8, 9, 10, 11, 12)
  - [x] Define a flat string-key catalog with two dictionaries: `vi` and `en`.
  - [x] Populate the catalog from the UX copy in `EXPERIENCE.md`, including Home, Results, Recipe, Discover, Favorites, Shopping List, Login, toast feedback, and the shared loading/empty/error/offline/success states.
  - [x] Make Vietnamese the default language.
  - [x] Implement `t(key)` lookup with a safe fallback strategy that does not silently hide missing translations during development.
  - [x] Implement `getLanguage()` and `setLanguage()` with AsyncStorage-backed persistence so a language change survives app restarts.
  - [x] Add a small utility for English phrases inside Vietnamese-first UI. On native, prefer nested `Text` with `accessibilityLanguage="en"` where appropriate; on web, preserve the intent of the UX requirement for `lang="en"` spans.
- [x] Add the missing persistence dependency and align package scripts with how this frontend is actually tested (AC: 10, 12)
  - [x] Install `@react-native-async-storage/async-storage` using `npx expo install`, because the current frontend package does not include it.
  - [x] Add a frontend `test` script if needed so story verification can run through the package manager cleanly.
  - [x] Preserve `npm` as the canonical frontend package manager from Story 1.3, even though the epic text used `pnpm` in one acceptance criterion.
- [x] Update existing shell code only where needed to prove real token/i18n consumption without overreaching into later stories (AC: 1, 8, 10)
  - [x] Replace obvious hardcoded placeholder colors or labels in existing shell-level files only if required to demonstrate the new token and i18n modules are usable.
  - [x] Do not turn Story 1.4 into component-library work. Avoid implementing buttons, cards, chip systems, or Zustand stores here.
  - [x] Keep the current route tree, Expo Router entrypoint, and placeholder shell behavior stable.
- [x] Add focused verification coverage for Story 1.4 (AC: 12)
  - [x] Create `frontend/tests/story-1-4.test.mjs` or an equivalent frontend-local test file following the current repo pattern.
  - [x] Assert both language maps contain the same key set.
  - [x] Assert `home.searchButton` resolves to the required Vietnamese and English strings.
  - [x] Assert the persistence layer is invoked by `setLanguage()` and that `getLanguage()` defaults to `'vi'` before persisted state is loaded.
  - [x] Assert `tokens.ts` exports the required token groups and values that later stories depend on.

## Dev Notes

### Story Foundation

- Epic 1 establishes the reusable frontend and backend foundation for all later feature work. Story 1.4 is the first story that turns the frontend shell from generic placeholders into a real design-system and copy source of truth. [Source: `_bmad-output/planning-artifacts/epics/epic-1.md`]
- Story 1.3 already created the route shell and stub utility files. Story 1.4 is explicitly an update-in-place story for those stubs, not a greenfield scaffold. [Source: `_bmad-output/implementation-artifacts/1-3-frontend-initialization-expo-sdk-56-router-shell.md`, repo inspection]

### Story-Specific Guardrails

- `frontend/lib/tokens.ts` is currently only:

  ```ts
  export const tokens = {
    colors: {},
    typography: {},
    spacing: {},
  };
  ```

  This must be replaced entirely with a typed token contract that later component stories can import directly. [Source: `frontend/lib/tokens.ts`]
- `frontend/lib/i18n.ts` is currently a non-persistent stub where `t(key)` just returns the input key. That implementation is incompatible with the persistence and bilingual acceptance criteria, so this story must replace it rather than layering helpers around it. [Source: `frontend/lib/i18n.ts`]
- `frontend/lib/accessibility.ts` already exports minimal defaults. Decide whether to keep accessibility defaults there or consolidate them with tokens, but do not leave duplicated constants across both files. One module may re-export from the other; the values themselves must have one source of truth. [Source: `frontend/lib/accessibility.ts`]
- Do not expand the scope into full theme switching, Zustand integration, secure auth storage, or composite UI components. Those belong to later stories.

### Technical Requirements

- The design token file must export:
  - semantic colors
  - typography families and roles
  - spacing
  - radii
  - shadows
  - z-index
  - animation durations and easing
  - accessibility defaults
  [Source: `_bmad-output/planning-artifacts/epics/epic-1.md`, `_bmad-output/planning-artifacts/architecture/starter-template-evaluation.md`]
- The color values must match the UX system exactly:
  - `bg: oklch(98% 0.004 240)`
  - `surface: oklch(100% 0 0)`
  - `fg: oklch(20% 0.02 240)`
  - `muted: oklch(42% 0.022 240)`
  - `border: oklch(78% 0.012 240)`
  - `accent: oklch(55% 0.18 35)`
  - `accentDim: oklch(55% 0.18 35 / 0.15)`
  - `accentStrong: oklch(48% 0.19 35)`
  - `success: oklch(52% 0.12 145)`
  - `warn: oklch(60% 0.14 85)`
  - `danger: oklch(52% 0.16 30)`
  [Source: `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/DESIGN.md`]
- Typography roles required by this story map to the UX spec’s 10 size roles:
  - app title
  - screen title
  - section title
  - card title
  - card subtitle
  - button
  - chip label
  - meta
  - badge
  - micro
  [Source: `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/DESIGN.md#typography`]
- The i18n catalog must at minimum cover the microcopy table in `EXPERIENCE.md` and the shared screen/system state strings defined later in the same document. The “40+ key-value pairs” line in the epic is directionally correct, but the actual implementation should go past the table itself so later screens do not reintroduce hardcoded Vietnamese strings. [Source: `_bmad-output/planning-artifacts/epics/epic-1.md`, `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/EXPERIENCE.md`]
- The frontend package currently has no AsyncStorage dependency and no `test` script. Both are practical blockers for satisfying the persistence and verification criteria in a maintainable way. [Source: `frontend/package.json`]

### Architecture Compliance

- Preserve the frontend directory boundaries:
  - route files stay under `frontend/app/`
  - shared utilities stay under `frontend/lib/`
  - reusable components stay under `frontend/components/`
  - shared interfaces stay under `frontend/types/`
  [Source: `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md`, `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md`]
- `tokens.ts` is the designated design-system source of truth. Later components must consume it; they must not recreate the same numbers locally. This story is the foundation that enables Story 1.5 and Story 1.6 to avoid hardcoded values. [Source: `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md#frontend-expo-react-native-conventions`]
- Vietnamese is the primary language and the catalog must default to `vi`. [Source: `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md#decision-priority-analysis`, `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/EXPERIENCE.md`]
- Reduced-motion handling should follow the architecture decision to use React Native accessibility APIs rather than web-only CSS assumptions. [Source: `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md`, `https://reactnative.dev/docs/accessibilityinfo`]

### Library / Framework Requirements

- Install AsyncStorage with Expo’s compatibility-aware command:
  - `npx expo install @react-native-async-storage/async-storage`
  The Expo docs list this library as included in Expo Go and document that install path for existing Expo apps. [Source: `https://docs.expo.dev/versions/latest/sdk/async-storage/`]
- For reduced-motion detection, prefer `AccessibilityInfo.isReduceMotionEnabled()` and the `reduceMotionChanged` event rather than inventing a platform-specific abstraction that ignores native accessibility settings. [Source: `https://reactnative.dev/docs/accessibilityinfo`]
- For English phrases within Vietnamese copy, React Native `Text` supports `accessibilityLanguage` on iOS, and nested `Text` is the right implementation shape. On web, preserve the UX intent with a `lang="en"`-equivalent path if the current platform adapter permits it. [Inference from RN docs plus UX requirements.] [Source: `https://reactnative.dev/docs/text`, `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/EXPERIENCE.md`]
- Keep Expo Router and the shell stack untouched. Story 1.4 should not alter `main: "expo-router/entry"` or the route structure created in Story 1.3. [Source: `frontend/package.json`, `_bmad-output/implementation-artifacts/1-3-frontend-initialization-expo-sdk-56-router-shell.md`]

### File Structure Requirements

- Required updates:
  - `frontend/lib/tokens.ts`
  - `frontend/lib/i18n.ts`
  - `frontend/lib/accessibility.ts` or a re-export relationship involving it
  - `frontend/package.json`
  - `frontend/package-lock.json`
  - `frontend/tests/story-1-4.test.mjs`
- Possible narrow-touch files if needed to demonstrate token/i18n usage:
  - `frontend/components/PlaceholderScreen.tsx`
  - `frontend/app/(tabs)/_layout.tsx`
  - route placeholder screens under `frontend/app/`
- Files that should remain structurally stable:
  - `frontend/app/_layout.tsx`
  - route tree under `frontend/app/`
  - `frontend/types/*.ts`
  - backend and root infrastructure files

### Files Being Updated: Current State / Required Change / Preserve

- `frontend/lib/tokens.ts`
  - Current state: empty-object stub.
  - This story changes: replace with the full typed token contract and OKLCH-to-RGBA helper.
  - Must preserve: import simplicity for later stories; this file remains the canonical token source.
- `frontend/lib/i18n.ts`
  - Current state: in-memory language variable with `t(key) => key`.
  - This story changes: replace with real `vi` and `en` dictionaries, persistence, and lookup behavior.
  - Must preserve: simple API surface `getLanguage()`, `setLanguage()`, `t()`.
- `frontend/lib/accessibility.ts`
  - Current state: basic defaults plus a label passthrough helper.
  - This story changes: either enrich it or make it a thin wrapper around the token/accessibility contract.
  - Must preserve: no duplicated accessibility constants.
- `frontend/package.json`
  - Current state: no AsyncStorage dependency, no test script, canonical package manager is npm.
  - This story changes: add missing dependency and a test entrypoint if required.
  - Must preserve: `main: "expo-router/entry"` and current Expo SDK 56 dependency alignment.
- `frontend/components/PlaceholderScreen.tsx`
  - Current state: uses hardcoded colors and copy-oriented props rather than token-driven styling.
  - This story changes: only touch if needed to prove tokens or translated strings are consumable.
  - Must preserve: skip-link behavior, back button behavior, and route-shell placeholder purpose.

### Current Repo Reality

- Story 1.3 is already implemented and left a functioning Expo Router shell with stub utility modules. [Source: `_bmad-output/implementation-artifacts/1-3-frontend-initialization-expo-sdk-56-router-shell.md`]
- The frontend test pattern currently uses Node’s built-in test runner from `frontend/tests/story-1-3.test.mjs`, not Jest or Vitest. Reuse that style unless there is a compelling reason not to. [Source: `frontend/tests/story-1-3.test.mjs`]
- The frontend package currently uses `npm`, not `pnpm`, and only has `start`, platform launchers, and `lint` scripts. [Source: `frontend/package.json`]
- There is still no `sprint-status.yaml` artifact in `_bmad-output/implementation-artifacts/`, so no sprint status update is possible during story creation.

### UX / Product Constraints That Matter Here

- The app is Vietnamese-first, warm, and food-centered. Tokens should preserve the phở-red terracotta accent and soft off-white background identity rather than drifting to generic Expo defaults. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/DESIGN.md`]
- The token layer must support the accessibility floor already set by UX:
  - minimum 44px touch targets
  - deliberate focus outlines
  - reduced-motion support
  - English-language hints inside Vietnamese UI
  [Source: `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/EXPERIENCE.md`]
- The i18n catalog should include not only happy-path CTA copy but also state and feedback copy such as loading, empty, error, offline, save/copy feedback, login validation, and discover/favorites empty states. Otherwise later stories will reintroduce hardcoded strings. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/EXPERIENCE.md`]

### Previous Story Intelligence

- Story 1.3 deliberately created `tokens.ts`, `i18n.ts`, `accessibility.ts`, `networkStatus.ts`, `parseIngredients.ts`, and `formatTime.ts` as stubs for later stories. Story 1.4 should now make `tokens.ts` and `i18n.ts` real while leaving the others within scope only if required for cohesion. [Source: `_bmad-output/implementation-artifacts/1-3-frontend-initialization-expo-sdk-56-router-shell.md`]
- Story 1.3 also preserved the Vietnamese route labels and accessibility shell. Story 1.4 must not regress those shell-level behaviors while refactoring utility modules. [Source: `_bmad-output/implementation-artifacts/1-3-frontend-initialization-expo-sdk-56-router-shell.md`, `frontend/app/(tabs)/_layout.tsx`, `frontend/components/PlaceholderScreen.tsx`]
- Story 1.2 established the backend-side language preference field on `UserPreference.language` and the architecture expects prompts to switch between `vi` and `en`. This story is the frontend side of that bilingual contract. [Source: `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md#data-models-mongodbmongoose`, `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md#llm-integration`]

### Git Intelligence Summary

- Recent commits are still planning and artifact commits, not token-system implementation commits:
  - `c4c1d02` shard epics into per-epic files
  - `67e49a3` fix epics after multi-agent review
  - `8c0bc9e` shard architecture docs
  - `c4efec3` align mockups
  - `740dc38` finalize UX mockups
- The strongest implementation precedent for this story is the current frontend shell itself, especially the existing stub utility files and the Node-based frontend verification test.

### Latest Tech Information

- Expo’s current AsyncStorage page documents `@react-native-async-storage/async-storage` as available for Expo apps and shows `npx expo install @react-native-async-storage/async-storage` as the installation path. [Source: `https://docs.expo.dev/versions/latest/sdk/async-storage/`]
- React Native’s current `AccessibilityInfo` API includes `isReduceMotionEnabled()` and the `reduceMotionChanged` event, which matches the architecture requirement for reduced-motion-aware animation behavior. [Source: `https://reactnative.dev/docs/accessibilityinfo`]
- React Native’s current `Text` docs still document `accessibilityLanguage`, which is relevant to the UX requirement for English phrases inside Vietnamese-first UI. [Source: `https://reactnative.dev/docs/text`]

### Testing Requirements

- Minimum verification after implementation:
  - `cd frontend && npm install`
  - `cd frontend && npm run lint`
  - `cd frontend && npx tsc --noEmit`
  - `cd frontend && node --test tests/story-1-4.test.mjs`
- If a package-level `test` script is added, ensure it supports targeted story verification and does not break the existing Story 1.3 test workflow.
- Verify translation parity mechanically. Do not rely on visual spot checks for matching key sets.
- Verify at least one existing shell surface can import and use the token/i18n modules without TypeScript or runtime errors.

### Project Context Reference

- No `project-context.md` file was present under the configured glob during this workflow run.
- Active UX reference is `docs/active-ux-folder.md`, which points to `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/`.
- Relevant artifacts loaded for this story:
  - `_bmad-output/planning-artifacts/epics/epic-1.md`
  - `_bmad-output/implementation-artifacts/1-3-frontend-initialization-expo-sdk-56-router-shell.md`
  - `_bmad-output/planning-artifacts/architecture/starter-template-evaluation.md`
  - `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md`
  - `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md`
  - `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md`
  - `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/DESIGN.md`
  - `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/EXPERIENCE.md`
  - `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/handoff-to-architecture.md`
  - `docs/active-ux-folder.md`
  - `frontend/package.json`
  - `frontend/lib/tokens.ts`
  - `frontend/lib/i18n.ts`
  - `frontend/lib/accessibility.ts`
  - `frontend/components/PlaceholderScreen.tsx`
  - `frontend/app/_layout.tsx`
  - `frontend/app/(tabs)/_layout.tsx`
  - `frontend/tests/story-1-3.test.mjs`

### References

- `_bmad-output/planning-artifacts/epics/epic-1.md`
- `_bmad-output/implementation-artifacts/1-3-frontend-initialization-expo-sdk-56-router-shell.md`
- `_bmad-output/planning-artifacts/architecture/starter-template-evaluation.md`
- `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md`
- `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md`
- `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md`
- `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/DESIGN.md`
- `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/EXPERIENCE.md`
- `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/handoff-to-architecture.md`
- `docs/active-ux-folder.md`
- `frontend/package.json`
- `frontend/lib/tokens.ts`
- `frontend/lib/i18n.ts`
- `frontend/lib/accessibility.ts`
- `frontend/components/PlaceholderScreen.tsx`
- `frontend/app/_layout.tsx`
- `frontend/app/(tabs)/_layout.tsx`
- `frontend/tests/story-1-3.test.mjs`
- `https://docs.expo.dev/versions/latest/sdk/async-storage/`
- `https://reactnative.dev/docs/accessibilityinfo`
- `https://reactnative.dev/docs/text`

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- No sprint status artifact was present to update.
- `npx expo install @react-native-async-storage/async-storage`
- `node --test tests/story-1-4.test.mjs` (red phase: expected failures before implementation)
- `node --test tests/story-1-4.test.mjs` (green phase: all 4 Story 1.4 tests passed)
- `npm test`
- `npm run lint`
- `npx tsc --noEmit`
- `node --test tests/story-1-1.test.mjs` failed due to a pre-existing reference to removed file `backend/src/express-api.mjs`
- `pnpm test` and `corepack pnpm test` could not be executed because `pnpm` / `corepack` are unavailable on PATH in this environment

### Completion Notes List

- Implemented a typed `frontend/lib/tokens.ts` source of truth covering semantic OKLCH colors, typography families and roles, spacing, radii, shadows, z-index, animation tokens, and accessibility defaults.
- Added `oklchToRgba()` runtime fallback conversion for React Native style consumers and kept OKLCH strings as the canonical design token values.
- Replaced the i18n stub with a bilingual `vi` / `en` flat-key catalog, default-Vietnamese language state, AsyncStorage persistence, hydration support, and inline language attribute helpers.
- Reworked `frontend/lib/accessibility.ts` to re-export shared accessibility defaults and provide reduced-motion and focus-outline helpers.
- Updated `frontend/components/PlaceholderScreen.tsx` to consume the token layer instead of hardcoded shell colors.
- Added `frontend/tests/story-1-4.test.mjs` and a package `test` script; verified Story 1.4 and existing Story 1.3 frontend regressions pass.
- Broader repo checks found unrelated pre-existing issues in the root Story 1.1 test and missing backend-local `pnpm` tooling in this environment; these were observed but not changed as part of Story 1.4.

### Change Log

- 2026-06-04: Implemented Story 1.4 design token system, bilingual i18n catalog, AsyncStorage persistence, token-backed shell usage, and Story 1.4 regression tests.

### File List

- `_bmad-output/implementation-artifacts/1-4-design-tokens-i18n-catalog.md`
- `frontend/components/PlaceholderScreen.tsx`
- `frontend/lib/accessibility.ts`
- `frontend/lib/i18n.ts`
- `frontend/lib/tokens.ts`
- `frontend/package-lock.json`
- `frontend/package.json`
- `frontend/tests/story-1-4.test.mjs`
