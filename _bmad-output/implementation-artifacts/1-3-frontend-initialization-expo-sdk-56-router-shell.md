---
baseline_commit: c4c1d028b98cd5749a4a7de38f9157c21cabac36
---

# Story 1.3: Frontend Initialization (Expo SDK 56 + Router Shell)

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want an Expo SDK 56 project initialized with Expo Router file-based navigation and a 4-tab layout shell,
so that all feature epics can populate their screens independently.

## Acceptance Criteria

1. Given the `frontend/` directory, when I run `cd frontend && npm install`, then all dependencies install without errors.
2. Given the frontend is running, when I run `npx expo start`, then the Expo dev server starts and is accessible via Expo Go on a physical device.
3. Given the Expo Router setup, when I open the app, then I see a 4-tab bottom navigation bar with tabs `Trang chủ`, `Khám phá`, `Yêu thích`, and `Cá nhân`. Each tab shows a placeholder screen with its title.
4. Given the routing structure, when I inspect `frontend/app/`, then I see `_layout.tsx`, `(tabs)/_layout.tsx`, `(tabs)/index.tsx`, `(tabs)/discover.tsx`, `(tabs)/favorites.tsx`, `(tabs)/profile.tsx`, `recipe/[id].tsx`, and `shopping-list.tsx`.
5. Given the project config, when I inspect `app.json`, then the app name is `Hôm Nay Ăn Gì`, slug is `hom-nay-an-gi`, and platforms include `ios` and `android`.
6. Given the frontend, when I run `npx tsc --noEmit`, then TypeScript checks pass without errors.

## Tasks / Subtasks

- [x] Scaffold the Expo application in the existing `frontend/` directory without changing the monorepo shape (AC: 1, 2, 5, 6)
  - [x] Replace the `frontend/.gitkeep` placeholder with a real Expo SDK 56 app created from the architecture-selected template.
  - [x] Keep `frontend/` as the app root; do not introduce a second nested app folder such as `frontend/hom-nay-an-gi/`.
  - [x] Preserve `npm` as the frontend package manager because the story AC explicitly verifies `npm install`, even though the backend uses `pnpm`.
  - [x] Ensure `package.json` keeps `main: "expo-router/entry"` so file-based routing works from `app/`.
- [x] Establish the Expo Router shell with the required route map (AC: 2, 3, 4, 6)
  - [x] Create `app/_layout.tsx` as the root layout with `SafeAreaProvider`, `StatusBar`, and a top-level error boundary wrapper.
  - [x] Create `app/(tabs)/_layout.tsx` using Expo Router `Tabs` with four root tabs: `index`, `discover`, `favorites`, `profile`.
  - [x] Add non-tab routes `app/recipe/[id].tsx` and `app/shopping-list.tsx` as placeholder screens reachable through the stack, not the bottom tab bar.
  - [x] Configure tab labels in Vietnamese and attach icon mappings for home, compass, heart, and user.
- [x] Implement placeholder screens and accessibility shell behavior (AC: 3, 4)
  - [x] Create placeholder content for all six visible screens plus the two non-tab routes.
  - [x] Make the first focusable element on every route the visually hidden skip link text `Bỏ qua điều hướng → #main-content`.
  - [x] Give each screen a `role="main"` content region with `id="main-content"` or the closest React Native equivalent strategy documented in code comments.
  - [x] Add the `‹` back-navigation convention to `recipe/[id].tsx` and `shopping-list.tsx` with at least 44x44 tap targets.
  - [x] Keep the login/profile surface inside the tab shell so `Cá nhân` is still the active fourth tab.
- [x] Add the required shell-level support modules and types (AC: 4, 6)
  - [x] Create `frontend/components/ErrorBoundary.tsx` as the route-shell fallback boundary.
  - [x] Create `frontend/lib/tokens.ts`, `api.ts`, `i18n.ts`, `accessibility.ts`, `networkStatus.ts`, `parseIngredients.ts`, and `formatTime.ts` as stubs for later stories.
  - [x] Create `frontend/types/dish.ts`, `user.ts`, and `api.ts` with minimal shared interfaces that later stories can extend.
  - [x] Add `frontend/.env.template` with `API_BASE_URL=http://localhost:8080`.
- [x] Install Expo-managed dependencies the Expo-native way (AC: 1, 2, 6)
  - [x] Use `npx expo install` for Expo-managed libraries instead of raw `npm install` when adding native modules after scaffold creation.
  - [x] Add `react-native-reanimated` and `react-native-worklets` together per current Expo docs.
  - [x] Add `@react-native-community/netinfo` with `npx expo install`.
- [x] Verify the scaffold and prevent regressions against the existing stack (AC: 1, 2, 3, 5, 6)
  - [x] Run `cd frontend && npm install`.
  - [x] Run `cd frontend && npx tsc --noEmit`.
  - [x] Run `cd frontend && npx expo start --offline` or the nearest non-interactive equivalent just far enough to prove the app boots.
  - [x] Confirm the generated app config still names the project `Hôm Nay Ăn Gì` and slug `hom-nay-an-gi`.
  - [x] Confirm the frontend shell does not require any changes to `docker-compose.yml`, nginx, or the already-working backend container contracts.

## Dev Notes

### Story Foundation

- Epic 1 exists to create a full project foundation so later epics can implement screens and modules independently. Story 1.3 is the frontend counterpart to Story 1.2 and is intentionally shell-only, not feature-complete UI work. [Source: `_bmad-output/planning-artifacts/epics/epic-1.md`]
- The architecture explicitly selected the official Expo default template on SDK 56 with Expo Router and TypeScript already configured. [Source: `_bmad-output/planning-artifacts/architecture/starter-template-evaluation.md`]

### Story-Specific Guardrails

- `frontend/` is currently only a placeholder directory containing `.gitkeep`. This story replaces that placeholder with the real Expo app scaffold. [Source: repo inspection]
- Do not create a second nested project folder. The target application root is exactly `frontend/`, because the architecture, monorepo docs, and Story 1.1 README all expect `frontend/app/` directly under the repo root. [Source: `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md`, `README.md`]
- Keep this story limited to shell scaffolding. Do not prematurely implement Zustand stores, token values, actual API integration, business screens, or reusable component library details beyond the minimal stub files explicitly requested here. Those belong to Stories 1.4, 1.5, 1.6, and later.
- The backend and nginx stack already work through `http://localhost:8080/api/v1/health`. The frontend story must not require changes to that routing contract. [Source: `_bmad-output/implementation-artifacts/1-1-monorepo-scaffold-docker-compose.md`, `docker-compose.yml`]

### Technical Requirements

- Frontend stack is Expo SDK 56 + Expo Router + TypeScript with `app/` as the route directory. [Source: `_bmad-output/planning-artifacts/architecture/starter-template-evaluation.md`, `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md`]
- Root routes required by this story:
  - `app/_layout.tsx`
  - `app/(tabs)/_layout.tsx`
  - `app/(tabs)/index.tsx`
  - `app/(tabs)/discover.tsx`
  - `app/(tabs)/favorites.tsx`
  - `app/(tabs)/profile.tsx`
  - `app/recipe/[id].tsx`
  - `app/shopping-list.tsx`
  [Source: `_bmad-output/planning-artifacts/epics/epic-1.md`]
- Required shell support files:
  - `components/ErrorBoundary.tsx`
  - `lib/tokens.ts`
  - `lib/api.ts`
  - `lib/i18n.ts`
  - `lib/accessibility.ts`
  - `lib/networkStatus.ts`
  - `lib/parseIngredients.ts`
  - `lib/formatTime.ts`
  - `types/dish.ts`
  - `types/user.ts`
  - `types/api.ts`
  - `.env.template`
  [Source: `_bmad-output/planning-artifacts/epics/epic-1.md`, `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md`]
- App config must expose the product name `Hôm Nay Ăn Gì`, slug `hom-nay-an-gi`, and `ios` + `android` platforms. [Source: `_bmad-output/planning-artifacts/epics/epic-1.md`]
- Frontend environment must start with `API_BASE_URL=http://localhost:8080` so later API work flows through nginx rather than bypassing the reverse proxy. [Source: `_bmad-output/planning-artifacts/epics/epic-1.md`, `docker-compose.yml`]

### Architecture Compliance

- Follow the frontend naming and structure conventions:
  - components in `PascalCase`
  - route files in Expo Router layout form under `app/`
  - utility files in `camelCase`
  - shared interfaces in `PascalCase`
  [Source: `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md#frontend-expo-react-native-conventions`]
- Keep non-route code outside `app/`. Shared components, utilities, and types belong in `components/`, `lib/`, and `types/`, not under the router tree. [Source: `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md`, official Expo Router file-based routing docs]
- The login/profile surface is a root tab, not a detached auth flow. The tab bar remains present on all root-level screens, including the `Cá nhân` placeholder. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/EXPERIENCE.md`, `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/.decision-log.md`]
- This story should prepare for later Zustand and storage-adapter work, but should not implement those stores yet. The root layout may leave future-provider comments/hooks in place, but avoid fake store code that will be replaced immediately in Story 1.9. [Source: `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md#state-management-zustand-3-stores-storage-adapter`]

### Library / Framework Requirements

- Use `npx create-expo-app@latest --template default@sdk-56 frontend` or the equivalent workflow that produces the same SDK 56 default template in the existing `frontend/` folder. As of the current Expo docs, the `--template default@sdk-56` flag is still necessary during the SDK 56 transition period. [Source: https://docs.expo.dev/more/create-expo/]
- Use Expo Router’s standard `Tabs` layout in `app/(tabs)/_layout.tsx`; all files directly inside the tabs group become tab routes. [Source: https://docs.expo.dev/router/advanced/tabs/, https://docs.expo.dev/develop/file-based-routing]
- Keep `main` set to `expo-router/entry`. That is the documented entry point for Expo Router projects. [Source: https://docs.expo.dev/router/installation/]
- `react-native-safe-area-context` is already part of the Expo Router dependency path and should be used via `SafeAreaProvider` at the root layout. [Source: https://docs.expo.dev/versions/latest/sdk/safe-area-context/, https://docs.expo.dev/router/installation/]
- Use `expo-status-bar` for status bar handling in `app/_layout.tsx`. It ships with Expo projects and is the documented status bar integration. [Source: https://docs.expo.dev/versions/latest/sdk/status-bar/]
- Install native Expo-managed dependencies with `npx expo install`, not plain `npm install`, so compatible versions are selected for the current SDK. This matters for `react-native-reanimated`, `react-native-worklets`, and `@react-native-community/netinfo`. [Source: https://docs.expo.dev/versions/latest/sdk/reanimated/, https://docs.expo.dev/versions/latest/sdk/netinfo]
- Error boundaries in React are still class-based unless using a helper library. Since this story explicitly asks for `components/ErrorBoundary.tsx`, implement it as a class component with `getDerivedStateFromError` and `componentDidCatch`, or deliberately wrap a vetted helper library. [Source: https://react.dev/reference/react/Component]

### File Structure Requirements

- Expected new frontend outputs after this story:
  - `frontend/package.json`
  - `frontend/package-lock.json` or the lockfile generated by npm
  - `frontend/app.json`
  - `frontend/tsconfig.json`
  - `frontend/app/_layout.tsx`
  - `frontend/app/(tabs)/_layout.tsx`
  - `frontend/app/(tabs)/index.tsx`
  - `frontend/app/(tabs)/discover.tsx`
  - `frontend/app/(tabs)/favorites.tsx`
  - `frontend/app/(tabs)/profile.tsx`
  - `frontend/app/recipe/[id].tsx`
  - `frontend/app/shopping-list.tsx`
  - `frontend/components/ErrorBoundary.tsx`
  - `frontend/lib/*.ts` stub files listed above
  - `frontend/types/*.ts`
  - `frontend/.env.template`
- Preserve existing root-level infrastructure files untouched unless the scaffold tooling forces a clearly necessary change:
  - `docker-compose.yml`
  - `nginx/nginx.conf`
  - `backend/`
  - root `.env.template`
  [Source: current repo state]

### Files Being Updated: Current State / Required Change / Preserve

- `frontend/.gitkeep`
  - Current state: the only file inside `frontend/`; placeholder scaffold marker from Story 1.1.
  - This story changes: remove or supersede it with the actual Expo project contents.
  - Must preserve: `frontend/` remains the repo’s frontend root.
- `README.md`
  - Current state: documents `frontend/` as part of the monorepo scaffold but does not describe the Expo app internals yet.
  - This story changes: ideally no change required unless a minimal command or note is needed after scaffold creation.
  - Must preserve: Story 1.1 infrastructure guidance and backend/nginx topology notes.
- `docker-compose.yml`
  - Current state: only backend-related services and data stores are defined; frontend is not containerized in local dev.
  - This story changes: no change expected.
  - Must preserve: existing service names, reverse proxy contract, and internal/public network topology.
- `backend/src/server.ts`, `backend/src/config/env.ts`, and `backend/.env.template`
  - Current state: backend scaffolding already assumes CORS is driven by env and that frontend traffic should route through nginx/API base URL conventions.
  - This story changes: no direct edits expected.
  - Must preserve: the frontend should consume the backend via `http://localhost:8080`, not invent a second API path.

### Current Repo Reality

- `frontend/` is effectively empty today, so there are no existing route files to preserve.
- `backend/` is already a real TypeScript app from Story 1.2 and `docker-compose.yml` already points to it successfully.
- There is no `sprint-status.yaml` file in `_bmad-output/implementation-artifacts/`, so this story is being created from the user-specified target rather than backlog auto-discovery.

### UX / Product Constraints That Matter Here

- The app is Vietnamese-first and mobile-first. Placeholder route titles and tab labels should therefore default to Vietnamese copy: `Trang chủ`, `Khám phá`, `Yêu thích`, `Cá nhân`. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/EXPERIENCE.md`]
- The tab bar is fixed with four tabs on every root screen, including the login/profile surface. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/EXPERIENCE.md`, `.decision-log.md`]
- Non-tab routes use a top-bar `‹` back button convention rather than relying on browser history metaphors. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/EXPERIENCE.md`]
- Accessibility constraints already matter in the shell:
  - first focusable element is the skip link
  - active tab exposes current-page state
  - all interactive targets are at least 44x44
  - toasts use polite live-region semantics later
  - focus styles must be deliberate
  [Source: `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/EXPERIENCE.md`, `review-accessibility.md`, `validation-report.md`]
- Keep placeholder screens structurally ready for the five systemic states called out by architecture and UX (`loading`, `empty`, `error`, `offline`, `success`), but do not implement those states deeply in this story. [Source: `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md#loading-states-per-ux-experiencemd`]

### Previous Story Intelligence

- Story 1.2 is already implemented to `review` state and established the backend baseline. The frontend should align with the existing backend local-dev contract rather than bypass it. [Source: `_bmad-output/implementation-artifacts/1-2-backend-initialization-express-typescript-boilerplate.md`]
- Story 1.2 explicitly set the backend up for dynamic Expo development origins via `CORS_ORIGIN`. This frontend story should not hardcode assumptions that only a browser localhost origin will be used. [Source: `_bmad-output/implementation-artifacts/1-2-backend-initialization-express-typescript-boilerplate.md`]
- Story 1.1 deliberately kept `frontend/` empty to avoid pulling Expo initialization forward. Story 1.3 is the clean point to replace that placeholder state entirely.

### Git Intelligence Summary

- Recent commits are still planning-artifact oriented, not frontend implementation:
  - `c4c1d02` shard epics.md into per-epic files
  - `67e49a3` fix epics after multi-agent review
  - `8c0bc9e` shard architecture docs
  - `c4efec3` align mockups
  - `740dc38` finalize UX mockups
- The more relevant implementation references are Story 1.1 and Story 1.2 artifacts plus the current repo state, not prior React Native commits.

### Latest Tech Information

- Expo’s current `create-expo-app` docs still show `npx create-expo-app@latest --template default@sdk-56` and explicitly note that, during the transition period, omitting the template may create an SDK 54 project instead. Use the explicit SDK 56 template to avoid accidental scaffold drift. [Source: https://docs.expo.dev/more/create-expo/]
- Expo Router’s current tabs docs describe the JavaScript tab layout with `Tabs` in `app/(tabs)/_layout.tsx` and treat direct children of the tabs directory as tab routes. That matches this story’s required route map exactly. [Source: https://docs.expo.dev/router/advanced/tabs/, https://docs.expo.dev/develop/file-based-routing]
- Expo Router installation docs still require `main: "expo-router/entry"` and rely on `app/_layout.tsx` as the entry layout. Do not remove or override that when cleaning the template. [Source: https://docs.expo.dev/router/installation/]
- Expo’s Reanimated docs currently instruct installing `react-native-reanimated` together with `react-native-worklets` using `npx expo install`, and note no extra Babel-plugin work is needed because `babel-preset-expo` configures it automatically. [Source: https://docs.expo.dev/versions/latest/sdk/reanimated/]
- Expo’s NetInfo docs currently recommend `npx expo install @react-native-community/netinfo`; use that instead of unconstrained npm semver installs so the version stays compatible with the SDK. [Source: https://docs.expo.dev/versions/latest/sdk/netinfo]
- React Native accessibility docs now document `role` as having precedence over `accessibilityRole`, but the project’s architecture and UX artifacts are written mostly in ARIA terms. The implementation can map those concepts onto React Native accessibility props while keeping intent explicit in code. [Source: https://reactnative.dev/docs/next/accessibility]
- React error boundaries still require class-based components or a wrapper library. A hand-rolled `ErrorBoundary.tsx` is acceptable for this shell story as long as it renders fallback UI instead of a white screen and exposes a logging hook point. [Source: https://react.dev/reference/react/Component]

### Testing Requirements

- Minimum required verification:
  - `cd frontend && npm install`
  - `cd frontend && npx tsc --noEmit`
  - `cd frontend && npx expo start`
- Strongly recommended additional checks:
  - verify each route resolves in Expo Router without missing-layout errors
  - verify the tab labels render in Vietnamese
  - verify non-tab routes can mount with the expected `‹` back UI
  - run the generated lint command if the scaffold includes one
- If any scaffold-generated tests exist, keep them passing or remove them cleanly if they only test deleted template screens.

### Project Context Reference

- No `project-context.md` file was present under the configured glob, so no persistent project-context file facts were loaded.
- Active UX reference is `docs/active-ux-folder.md`, which points to `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/`.
- Relevant artifacts loaded for this story:
  - `_bmad-output/planning-artifacts/epics/epic-1.md`
  - `_bmad-output/implementation-artifacts/1-1-monorepo-scaffold-docker-compose.md`
  - `_bmad-output/implementation-artifacts/1-2-backend-initialization-express-typescript-boilerplate.md`
  - `_bmad-output/planning-artifacts/architecture/starter-template-evaluation.md`
  - `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md`
  - `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md`
  - `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md`
  - `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/EXPERIENCE.md`
  - `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/DESIGN.md`
  - `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/review-accessibility.md`
  - `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/validation-report.md`
  - `_bmad-output/planning-artifacts/prd-hom-nay-an-gi-2026-05-31/prd.md`
  - `docs/active-ux-folder.md`
  - `README.md`
  - `docker-compose.yml`
  - `frontend/.gitkeep`

### References

- `_bmad-output/planning-artifacts/epics/epic-1.md`
- `_bmad-output/implementation-artifacts/1-1-monorepo-scaffold-docker-compose.md`
- `_bmad-output/implementation-artifacts/1-2-backend-initialization-express-typescript-boilerplate.md`
- `_bmad-output/planning-artifacts/architecture/starter-template-evaluation.md`
- `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md`
- `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md`
- `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md`
- `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/EXPERIENCE.md`
- `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/DESIGN.md`
- `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/review-accessibility.md`
- `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/validation-report.md`
- `_bmad-output/planning-artifacts/prd-hom-nay-an-gi-2026-05-31/prd.md`
- `docs/active-ux-folder.md`
- `README.md`
- `docker-compose.yml`
- `frontend/.gitkeep`
- https://docs.expo.dev/more/create-expo/
- https://docs.expo.dev/router/advanced/tabs/
- https://docs.expo.dev/develop/file-based-routing
- https://docs.expo.dev/router/installation/
- https://docs.expo.dev/versions/latest/sdk/safe-area-context/
- https://docs.expo.dev/versions/latest/sdk/status-bar/
- https://docs.expo.dev/versions/latest/sdk/reanimated/
- https://docs.expo.dev/versions/latest/sdk/netinfo
- https://reactnative.dev/docs/next/accessibility
- https://react.dev/reference/react/Component

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Workflow activation completed with resolved workflow: no prepend steps, no append steps, no `project-context.md` files found, config loaded from `_bmad/bmm/config.yaml`.
- No `_bmad-output/implementation-artifacts/sprint-status.yaml` file exists, so this story was created directly from the user-specified story target `1.3`.
- Discovery loaded selective epic context from `epic-1.md`, architecture shards from the `architecture/` folder, active UX artifacts from `ux-hom-nay-an-gi-2026-06-01/`, previous story files `1-1` and `1-2`, current repo frontend placeholder state, and recent git history.
- Latest technical guidance was refreshed from official Expo, React Native, and React documentation for `create-expo-app`, Expo Router tabs, Expo-managed dependency installation, accessibility semantics, and error boundaries.
- Red phase: added `frontend/tests/story-1-3.test.mjs` and confirmed it failed against the raw Expo scaffold because the router tree was under `src/app`, the app identity was still `frontend`, and the story-specific shell files did not exist.
- Scaffold implementation: removed `frontend/.gitkeep`, ran `npx create-expo-app@latest --template default@sdk-56 frontend`, then reshaped the generated template from `src/app` to the required root `app/` route tree.
- Shell implementation: created `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, the four tab screens, `recipe/[id].tsx`, `shopping-list.tsx`, `components/ErrorBoundary.tsx`, `components/PlaceholderScreen.tsx`, required `lib/` stubs, required `types/` stubs, and `frontend/.env.template`.
- Cleanup implementation: removed the default Expo starter route files under `frontend/src/app`, removed the unused starter support files under `frontend/src/**`, removed generated template docs/editor helper files, and removed the obsolete `reset-project` script from `frontend/package.json`.
- Dependency implementation: ran `npx expo install @react-native-community/netinfo`; `react-native-reanimated` and `react-native-worklets` were already present in the SDK 56 scaffold and were retained.
- Linting implementation: first ran `expo lint`, which auto-generated `frontend/eslint.config.js`, then updated the `lint` script to `eslint app components lib types tests` because the default Expo lint glob still assumed the deleted `src` app tree.
- Validation passed:
  - `cd frontend && npm install`
  - `cd frontend && node --test tests/story-1-3.test.mjs`
  - `cd frontend && npx tsc --noEmit`
  - `cd frontend && npm run lint`
  - `cd frontend && CI=1 npx expo start --offline` reached the project startup banner and held the process open until manually interrupted, which served as the CLI smoke test for the dev server bootstrap.
- Verified by inspection that `app.json` now uses `name: "Hôm Nay Ăn Gì"` and `slug: "hom-nay-an-gi"`, and that no changes were required in `docker-compose.yml`, nginx, or the backend stack.

### Completion Notes List

- Scaffolded the frontend in the existing `frontend/` root with Expo SDK 56, npm, and `main: "expo-router/entry"` intact.
- Replaced the default Expo starter route tree with the story-required root `app/` structure: four Vietnamese tab routes plus `recipe/[id]` and `shopping-list`.
- Implemented a root error boundary and a reusable placeholder shell that provides the skip link, `main-content` target, and 44x44 `‹` back button for non-tab routes.
- Added the required shell stub modules in `frontend/lib/` and `frontend/types/`, plus `frontend/.env.template` with `API_BASE_URL=http://localhost:8080`.
- Installed `@react-native-community/netinfo` using `npx expo install` and retained the scaffolded `react-native-reanimated` and `react-native-worklets` dependencies required by the story.
- Cleaned out unused Expo starter boilerplate from `frontend/src/**` and removed generated template helper docs that were no longer relevant after the shell rewrite.
- Added a story-specific regression test at `frontend/tests/story-1-3.test.mjs` and verified it passes together with `npx tsc --noEmit` and `npm run lint`.
- Confirmed the Expo CLI reaches project startup in offline mode and holds the Metro session open, which completed the story’s dev-server smoke check.
- No sprint status file exists in `_bmad-output/implementation-artifacts/`, so status tracking was finalized in the story file only.

### File List

- `_bmad-output/implementation-artifacts/1-3-frontend-initialization-expo-sdk-56-router-shell.md`
- `frontend/.env.template`
- `frontend/.gitignore`
- `frontend/app.json`
- `frontend/app/_layout.tsx`
- `frontend/app/(tabs)/_layout.tsx`
- `frontend/app/(tabs)/index.tsx`
- `frontend/app/(tabs)/discover.tsx`
- `frontend/app/(tabs)/favorites.tsx`
- `frontend/app/(tabs)/profile.tsx`
- `frontend/app/recipe/[id].tsx`
- `frontend/app/shopping-list.tsx`
- `frontend/components/ErrorBoundary.tsx`
- `frontend/components/PlaceholderScreen.tsx`
- `frontend/eslint.config.js`
- `frontend/lib/accessibility.ts`
- `frontend/lib/api.ts`
- `frontend/lib/formatTime.ts`
- `frontend/lib/i18n.ts`
- `frontend/lib/networkStatus.ts`
- `frontend/lib/parseIngredients.ts`
- `frontend/lib/tokens.ts`
- `frontend/package-lock.json`
- `frontend/package.json`
- `frontend/tests/story-1-3.test.mjs`
- `frontend/tsconfig.json`
- `frontend/types/api.ts`
- `frontend/types/dish.ts`
- `frontend/types/user.ts`
- `frontend/src/app/_layout.tsx` (deleted)
- `frontend/src/app/explore.tsx` (deleted)
- `frontend/src/app/index.tsx` (deleted)
- `frontend/src/components/animated-icon.module.css` (deleted)
- `frontend/src/components/animated-icon.tsx` (deleted)
- `frontend/src/components/animated-icon.web.tsx` (deleted)
- `frontend/src/components/app-tabs.tsx` (deleted)
- `frontend/src/components/app-tabs.web.tsx` (deleted)
- `frontend/src/components/external-link.tsx` (deleted)
- `frontend/src/components/hint-row.tsx` (deleted)
- `frontend/src/components/themed-text.tsx` (deleted)
- `frontend/src/components/themed-view.tsx` (deleted)
- `frontend/src/components/ui/collapsible.tsx` (deleted)
- `frontend/src/components/web-badge.tsx` (deleted)
- `frontend/src/constants/theme.ts` (deleted)
- `frontend/src/global.css` (deleted)
- `frontend/src/hooks/use-color-scheme.ts` (deleted)
- `frontend/src/hooks/use-color-scheme.web.ts` (deleted)
- `frontend/src/hooks/use-theme.ts` (deleted)
- `frontend/.claude/settings.json` (deleted)
- `frontend/.vscode/extensions.json` (deleted)
- `frontend/.vscode/settings.json` (deleted)
- `frontend/AGENTS.md` (deleted)
- `frontend/CLAUDE.md` (deleted)
- `frontend/LICENSE` (deleted)
- `frontend/README.md` (deleted)
- `frontend/scripts/reset-project.js` (deleted)

### Change Log

- 2026-06-04: Scaffolded the Expo SDK 56 frontend in `frontend/`, replaced the default starter with the required Router tab shell and placeholder routes, added story-specific shell tests and stubs, installed NetInfo with Expo-managed dependency resolution, and cleaned out unused starter boilerplate.
