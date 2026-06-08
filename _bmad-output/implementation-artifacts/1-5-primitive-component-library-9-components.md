---
baseline_commit: c4c1d028b98cd5749a4a7de38f9157c21cabac36
---

# Story 1.5: Primitive Component Library (9 components)

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want 9 reusable primitive UI components built from React Native primitives with baked-in design tokens, 44px touch targets, and accessibility props,
so that all feature screens can compose UI consistently without reinventing basic elements.

## Acceptance Criteria

1. Given the `<Button>` component, when I render it with `variant="primary"`, then it displays with `accentStrong` background, white text, 14px-24px padding, at least 44px height, `Radius.md`, a visible focus treatment, and a loading state using `ActivityIndicator`. It supports `primary`, `secondary`, `ghost`, and `destructive` variants.
2. Given the `<Card>` component, when I render it, then it displays with `surface` background, 1px `border`, `Radius.md`, `Shadows.sm`, 16px default padding, and supports a `padding` override prop.
3. Given the `<Chip>` component, when I render it with `selected={true}`, then it displays the active state with `accentDim` background, `accent` border, `accentStrong` text, pill radius, minimum 44px touch target, supports `tag`, `cuisine`, `time`, and `ingredient` variants, and ingredient mode includes a removable target while exposing `accessibilityState.selected`.
4. Given the `<InputField>` component, when I render it, then it displays with `surface` background, 1px `border`, `Radius.md`, 12px-16px internal spacing, at least 44px height, 16px body text, supports `iconLeft`, `iconRight`, `placeholder`, and `error` props, and exposes invalid state for assistive tech.
5. Given the `<Timeline>` component, when I render it with `steps: [{ label, duration }]`, then it renders a vertical ordered sequence with one item per step, 15px accent dots, connecting border bars, 14px semibold labels, and 12px muted duration text.
6. Given the `<TabBar>` component, when I render it with 4 tabs, then it matches the app shell visual spec: fixed bottom surface, 1px top border, 8px top padding, 20px bottom safe-area padding, max width 430px, active item accent treatment, 24px icons, flexed items, and at least 44px tap targets.
7. Given the `<Badge>` component, when I render it with `value="95%"`, then it displays accent-tinted styling, pill radius, 12px semibold text, and communicates the percentage through text rather than color alone.
8. Given the `<Toast>` component, when it appears, then it renders above the tab area, uses `role="status"` plus `accessibilityLiveRegion="polite"`, auto-dismisses after at least 4 seconds, uses fade-only motion, and respects reduced-motion settings.
9. Given the `<ServingAdjuster>` component, when I render it with `value={2} min={1} max={10}`, then it shows decrement and increment controls around the current value, enforces the bounds, keeps controls at or above 44px targets, and fires `onChange` with the new value.

## Tasks / Subtasks

- [x] Build the 9 primitive components under `frontend/components/` using typed props and token-backed styling (AC: 1, 2, 3, 4, 5, 6, 7, 8, 9)
  - [x] Create `frontend/components/Button.tsx` with `primary | secondary | ghost | destructive`, `fullWidth`, `disabled`, and `loading` states. Use `Pressable`, token styles, and `ActivityIndicator` for loading. (AC: 1)
  - [x] Create `frontend/components/Card.tsx` as a simple surface wrapper with configurable padding and optional `accessibilityRole`. (AC: 2)
  - [x] Create `frontend/components/Chip.tsx` with selected state, 4 variants, and ingredient-mode remove affordance using a dedicated press target instead of an inline glyph-only trap. (AC: 3)
  - [x] Create `frontend/components/InputField.tsx` as a `TextInput` wrapper with icon slots, error text, focus styling hooks, and invalid-state props. (AC: 4)
  - [x] Create `frontend/components/Timeline.tsx` as an ordered step list that maps cleanly to RN native structure and web semantics. (AC: 5)
  - [x] Create `frontend/components/TabBar.tsx` as a reusable primitive that matches the design system without replacing the existing Expo Router tab navigator during this story. (AC: 6)
  - [x] Create `frontend/components/Badge.tsx` for compact percentage/status pills. (AC: 7)
  - [x] Create `frontend/components/Toast.tsx` with fade-only visibility transitions, minimum 4-second dismissal, and reduced-motion handling. (AC: 8)
  - [x] Create `frontend/components/ServingAdjuster.tsx` with bounded decrement/increment behavior and accessible button labels. (AC: 9)
- [x] Add a barrel export and keep the public surface stable for later stories (AC: 1, 2, 3, 4, 5, 6, 7, 8, 9)
  - [x] Create `frontend/components/index.ts` exporting all 9 primitives.
  - [x] Keep prop names aligned with the architecture and epic naming so Story 1.6 can compose them without adapter wrappers.
- [x] Extend supporting utilities only where Story 1.5 genuinely needs them (AC: 1, 3, 4, 6, 8, 9)
  - [x] Reuse `frontend/lib/tokens.ts` and `frontend/lib/accessibility.ts` as the single source of truth for sizes, colors, focus treatment, and reduced motion.
  - [x] If a helper is missing, add it to `frontend/lib/accessibility.ts` or a narrowly-related component-local utility rather than duplicating constants across components.
  - [x] Do not expand into `frontend/lib/api.ts`, `parseIngredients.ts`, or other Story 1.6 utilities unless a real blocker is discovered.
- [x] Add focused verification coverage for the primitive library (AC: 1, 3, 4, 8, 9)
  - [x] Create a new frontend-local test file, following the current Node-based harness pattern already used in `frontend/tests/`.
  - [x] Verify Button variants and loading/disabled behavior.
  - [x] Verify Chip selected state and ingredient remove behavior.
  - [x] Verify InputField error-state wiring.
  - [x] Verify ServingAdjuster bound enforcement and callback behavior.
  - [x] Add at least one static/file-content assertion proving the new component files and barrel export exist.
- [x] Integrate only minimal proof-of-use surfaces if needed, without jumping ahead into composite screen work (AC: 1, 2, 6)
  - [x] If a usage proof is necessary, update a narrow shell surface or local preview-only usage path.
  - [x] Do not replace the current `frontend/app/(tabs)/_layout.tsx` Tabs navigator with the new `TabBar` in this story.
  - [x] Do not implement Result cards, Discover cards, dropdowns, skeletons, or other Story 1.6 composites here.

## Dev Notes

### Story Foundation

- Epic 1 is still establishing the base frontend system. Story 1.5 is the first component-library story and exists to unblock later composite components and actual screen implementation in Stories 1.6+ and subsequent feature epics. [Source: `_bmad-output/planning-artifacts/epics/epic-1.md`]
- Story 1.4 already created the token catalog, i18n catalog, and reduced-motion-aware accessibility helpers. Story 1.5 must consume those outputs directly instead of inventing a second styling system. [Source: `_bmad-output/implementation-artifacts/1-4-design-tokens-i18n-catalog.md`]
- The Epic explicitly warns that Story 1.5 is large enough to plan as 2-3 sprint items (`1.5a`, `1.5b`, `1.5c`). If the dev agent works this story in one pass, it still needs to keep commits and verification logically segmented by component group to control risk. [Source: `_bmad-output/planning-artifacts/epics/epic-1.md`]

### Story-Specific Guardrails

- `frontend/components/` currently contains only `ErrorBoundary.tsx` and `PlaceholderScreen.tsx`. None of the 9 primitive files exist yet, so this story is greenfield inside that folder but brownfield against the current shell. [Source: repo inspection]
- `frontend/app/(tabs)/_layout.tsx` currently uses Expo Router `Tabs` directly for navigation. That means the `TabBar.tsx` primitive should be built as a reusable design-system component, not as a forced rewrite of the current navigation shell in this story. Preserve route stability first. [Source: `frontend/app/(tabs)/_layout.tsx`]
- `PlaceholderScreen.tsx` already consumes tokens and provides skip-link plus back-button behavior. Do not break those accessibility guarantees while proving primitive usability. [Source: `frontend/components/PlaceholderScreen.tsx`]
- `Toast` timing has a spec conflict in the UX docs: the v4 prototype notes 2-second toasts, but the accessibility floor and the epic both require at least 4 seconds. Follow the stricter requirement: minimum 4 seconds, fade only, reduced-motion aware. [Source: `_bmad-output/planning-artifacts/epics/epic-1.md`, `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/EXPERIENCE.md#accessibility-floor`]
- Keep Story 1.5 primitive-only. `ResultCard`, `ChipRow`, `DishCard`, `RestaurantCard`, `CollapsibleSection`, `SortDropdown`, `Skeleton`, `BenefitsCard`, and `TipCard` belong to Story 1.6 even if they look tempting to start now. [Source: `_bmad-output/planning-artifacts/epics/epic-1.md`]

### Technical Requirements

- All primitives must be implemented with React Native primitives and typed props, using `Pressable`, `View`, `Text`, `TextInput`, and `ActivityIndicator` where appropriate. Avoid web-first markup assumptions in component internals. [Source: architecture + React Native docs]
- Every interactive control must maintain at least a 44px touch target, matching the accessibility defaults exported in Story 1.4. [Source: `frontend/lib/tokens.ts`, `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/EXPERIENCE.md#tap-targets`]
- Reuse the Story 1.4 token exports exactly:
  - `Colors`
  - `Typography`
  - `Spacing`
  - `Radius`
  - `Shadows`
  - `ZIndex`
  - `Animation`
  - `accessibilityDefaults`
  [Source: `frontend/lib/tokens.ts`]
- `Button`, `Chip`, `Badge`, `Card`, `InputField`, and `Toast` should convert token colors with `oklchToRgba()` wherever RN style values need resolved color strings. Do not hardcode hex fallbacks into component files. [Source: `frontend/lib/tokens.ts`]
- `InputField` should expose error semantics in a way compatible with RN accessibility props and current web/native dual-targeting. Keep the API simple enough for later form stories to reuse. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/EXPERIENCE.md#accessibility-floor`, `https://reactnative.dev/docs/textinput`]
- `Chip` ingredient removal must use a real press target with `hitSlop` or equivalent touch-expansion rather than relying on a visually small glyph tap area. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/DESIGN.md#ingredient-chip`, `https://reactnative.dev/docs/pressable`]
- `Timeline` should map to an ordered sequence conceptually equivalent to `<ol><li>` on web, while remaining a normal RN component on native. This story owns the primitive only, not the full recipe screen composition. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/EXPERIENCE.md#accessibility-floor`]

### Architecture Compliance

- Preserve the frontend boundaries:
  - routes in `frontend/app/`
  - primitives in `frontend/components/`
  - shared helpers in `frontend/lib/`
  - shared types in `frontend/types/`
  [Source: `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md`]
- This project’s frontend convention is PascalCase component files with typed props and baked-in accessibility. Follow that exactly for all 9 primitives. [Source: `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md#frontend-expo-react-native-conventions`]
- Design tokens remain the single source of truth. Component-local constants are acceptable only for tiny composition details that do not duplicate the system values already defined in `tokens.ts`. [Source: `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md#frontend-expo-react-native-conventions`]
- The architecture’s component inventory names `TabBar` as a primitive, but the current navigation stack still uses Expo Router JavaScript tabs. Implement the primitive in a way that can later support or influence the shell, without forcing the shell migration in this story. [Source: `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md`, `frontend/app/(tabs)/_layout.tsx`]
- Reduced motion must come from React Native accessibility APIs, not CSS media-query assumptions embedded in component logic. [Source: `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md#decision-priority-analysis`, `frontend/lib/accessibility.ts`]

### Library / Framework Requirements

- The frontend currently runs on Expo `~56.0.8`, Expo Router `~56.2.8`, React `19.2.3`, React Native `0.85.3`, and `react-native-reanimated` `4.3.1`. Do not introduce alternate UI libraries for these primitives. Build them directly in the existing stack. [Source: `frontend/package.json`]
- For press interactions and enlarged hit targets, use `Pressable` plus `hitSlop` / `pressRetentionOffset` where needed. The RN docs explicitly support that approach for improving touch accuracy. [Source: `https://reactnative.dev/docs/pressable`]
- For button loading states, use `ActivityIndicator` rather than a custom spinner dependency. [Source: `https://reactnative.dev/docs/activityindicator.html`]
- For reduced motion, continue using `AccessibilityInfo.isReduceMotionEnabled()` and the `reduceMotionChanged` event path already established in `frontend/lib/accessibility.ts`. [Source: `https://reactnative.dev/docs/accessibilityinfo`]
- Expo Router’s current docs distinguish JavaScript tabs from custom tab layouts. Because the app is still on standard `Tabs`, do not assume the new `TabBar` primitive can replace the router shell without additional routing work. [Source: `https://docs.expo.dev/router/advanced/tabs`, `https://docs.expo.dev/router/advanced/custom-tabs`]

### File Structure Requirements

- New files expected in this story:
  - `frontend/components/Button.tsx`
  - `frontend/components/Card.tsx`
  - `frontend/components/Chip.tsx`
  - `frontend/components/InputField.tsx`
  - `frontend/components/Timeline.tsx`
  - `frontend/components/TabBar.tsx`
  - `frontend/components/Badge.tsx`
  - `frontend/components/Toast.tsx`
  - `frontend/components/ServingAdjuster.tsx`
  - `frontend/components/index.ts`
  - `frontend/tests/story-1-5.test.mjs` or equivalent story-local test file
- Existing files that may need narrow updates:
  - `frontend/lib/accessibility.ts`
  - `frontend/package.json` only if the test script needs to include the new story test
  - `frontend/tests/story-1-4.test.mjs` only if shared-test conventions require coordination
- Files that should remain behaviorally stable:
  - `frontend/app/_layout.tsx`
  - `frontend/app/(tabs)/_layout.tsx`
  - `frontend/components/PlaceholderScreen.tsx`
  - `frontend/lib/tokens.ts`
  - `frontend/lib/i18n.ts`

### Files Being Updated: Current State / Required Change / Preserve

- `frontend/components/`
  - Current state: only shell helpers exist; no primitive library files are present.
  - This story changes: add the 9 primitive files plus a barrel export.
  - Must preserve: current shell components keep functioning and imports stay unsurprising.
- `frontend/lib/accessibility.ts`
  - Current state: exports `accessibilityDefaults`, `getAccessibilityProps()`, `useReducedMotion()`, and `getFocusOutline()`.
  - This story changes: may gain narrowly-scoped helpers that multiple primitives genuinely share.
  - Must preserve: Story 1.4 remains the single source of truth for focus and reduced-motion defaults.
- `frontend/app/(tabs)/_layout.tsx`
  - Current state: Expo Router `Tabs` navigator with simple glyph icons and direct styling.
  - This story changes: ideally none; only touch this file if a minimal proof-of-use is absolutely necessary.
  - Must preserve: the existing 4-tab route shell and Vietnamese tab labels.
- `frontend/components/PlaceholderScreen.tsx`
  - Current state: token-backed placeholder surface with skip-link and optional back button.
  - This story changes: likely none, or only minimal proof-of-use if a primitive is showcased there.
  - Must preserve: skip navigation, `main-content` target, and current shell accessibility behavior.
- `frontend/package.json`
  - Current state: `npm` frontend package manager, lint script, and tests for Stories 1.3 and 1.4.
  - This story changes: add the story 1.5 test to the existing `test` command if needed.
  - Must preserve: `main: "expo-router/entry"` and the existing Expo dependency alignment.

### Current Repo Reality

- Story 1.4 is complete enough to provide tokens and i18n, but it is marked `review`, not `done`. Read it for intent and constraints, but do not rely on it as a license to refactor its APIs casually. [Source: `_bmad-output/implementation-artifacts/1-4-design-tokens-i18n-catalog.md`]
- The frontend test approach currently uses Node’s built-in `node --test` harness with TypeScript transpilation in-test via `typescript`, not Jest or React Native Testing Library. Story 1.5 should either reuse that pattern or justify a minimal extension; do not casually introduce a full new test stack. [Source: `frontend/tests/story-1-4.test.mjs`, `frontend/package.json`]
- There is still no `sprint-status.yaml` in `_bmad-output/implementation-artifacts/`, so there is no sprint-state file to update from `backlog` to `ready-for-dev`. [Source: repo inspection]
- The working tree already contains many untracked project files. The dev agent must avoid destructive cleanup and limit edits to the story scope. [Source: `git status --short`]

### UX / Product Constraints That Matter Here

- The brand is warm, Vietnamese-first, and token-driven. Primitive components should reinforce the terracotta accent, soft off-white surfaces, and typography hierarchy from `DESIGN.md` instead of looking like generic Expo starter widgets. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/DESIGN.md`]
- Focus treatment, reduced-motion support, and minimum touch targets are not optional polish items. They are base requirements for every primitive in this story. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/EXPERIENCE.md#accessibility-floor`]
- Active chip states must convey selection through multiple signals, not color only. Badge text must carry the actual meaning numerically. Toasts must be announced politely. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/EXPERIENCE.md#color-independence`]
- `Ghost` buttons are the visual basis for back, mic, and camera triggers later. Implement the primitive carefully now so future screens do not have to create one-off icon-button patterns. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/DESIGN.md#ghost-button`]

### Previous Story Intelligence

- Story 1.3 established the route shell, placeholder screens, and stub utility modules. Story 1.5 should respect that shell and add reusable components underneath it, not replace it wholesale. [Source: `_bmad-output/implementation-artifacts/1-3-frontend-initialization-expo-sdk-56-router-shell.md`]
- Story 1.4 established the actual token values, typography roles, accessibility defaults, language catalog, and reduced-motion helper. Reuse those exports directly. [Source: `_bmad-output/implementation-artifacts/1-4-design-tokens-i18n-catalog.md`, `frontend/lib/tokens.ts`, `frontend/lib/accessibility.ts`]
- The previous story’s strongest anti-pattern warning still applies: do not duplicate constants across `tokens.ts`, `accessibility.ts`, and component files. One source of truth, optionally re-exported. [Source: `_bmad-output/implementation-artifacts/1-4-design-tokens-i18n-catalog.md`]

### Git Intelligence Summary

- Recent commits are still planning/documentation heavy rather than component implementation:
  - `c4c1d02` shard epics into per-epic files
  - `67e49a3` fix epics after multi-agent review
  - `8c0bc9e` shard architecture docs
  - `c4efec3` align mockups
  - `740dc38` finalize UX mockups
- Practical implication: the dev agent should treat the live repo structure and the existing story artifacts as the implementation precedent, not recent git history.

### Latest Tech Information

- React Native’s current `Pressable` docs describe `hitSlop` and `pressRetentionOffset` as the supported way to enlarge press targets without visually enlarging the control, which is directly relevant to `Chip`, `Button`, `ServingAdjuster`, and ingredient-remove affordances. [Source: `https://reactnative.dev/docs/pressable`]
- React Native’s current `ActivityIndicator` docs confirm it is the standard built-in loading indicator for button loading states. [Source: `https://reactnative.dev/docs/activityindicator.html`]
- React Native’s current `TextInput` docs remain the primary reference for input behavior and focus methods; Story 1.5 should stay within those core APIs rather than wrapping platform-specific hacks into the primitive. [Source: `https://reactnative.dev/docs/textinput`]
- Expo’s current Router docs separate JavaScript tabs from custom tabs, which reinforces that a reusable `TabBar` primitive is not the same thing as replacing the active router navigator in one story. [Source: `https://docs.expo.dev/router/advanced/tabs`, `https://docs.expo.dev/router/advanced/custom-tabs`]

### Testing Requirements

- Minimum verification after implementation:
  - `cd frontend && npm run lint`
  - `cd frontend && npx tsc --noEmit`
  - `cd frontend && node --test tests/story-1-3.test.mjs tests/story-1-4.test.mjs tests/story-1-5.test.mjs`
- The story test should focus on deterministic component contracts that can be verified in the current harness:
  - component files exist
  - barrel export exists
  - variant names and prop APIs are present in source
  - serving bounds logic is covered
  - toast timing/reduced-motion hooks are wired
- If the current harness cannot reasonably instantiate RN components, prefer lightweight module/source assertions over adding an entire new test framework just for this story.
- Do not weaken Story 1.3 or 1.4 verification while adding Story 1.5 coverage.

### Project Context Reference

- No `project-context.md` file was present under the configured persistent-facts glob during this workflow run.
- Active UX reference is `docs/active-ux-folder.md`, which points to `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/`.
- Relevant artifacts loaded for this story:
  - `_bmad-output/planning-artifacts/epics/epic-1.md`
  - `_bmad-output/implementation-artifacts/1-4-design-tokens-i18n-catalog.md`
  - `_bmad-output/implementation-artifacts/1-3-frontend-initialization-expo-sdk-56-router-shell.md`
  - `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md`
  - `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md`
  - `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md`
  - `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/DESIGN.md`
  - `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/EXPERIENCE.md`
  - `docs/active-ux-folder.md`
  - `frontend/package.json`
  - `frontend/lib/tokens.ts`
  - `frontend/lib/i18n.ts`
  - `frontend/lib/accessibility.ts`
  - `frontend/components/PlaceholderScreen.tsx`
  - `frontend/app/_layout.tsx`
  - `frontend/app/(tabs)/_layout.tsx`

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Create-story workflow executed from explicit user request for Story `1.5`
- No `sprint-status.yaml` present; story selection derived directly from user input
- Latest framework/library guidance cross-checked against official React Native and Expo documentation

### Completion Notes List

- Implemented the 9 primitive components, the barrel export, and a story-local verification harness for source-level contracts.
- Kept Story 1.5 scoped to primitives only; no shell migration or Story 1.6 composite work was pulled in.
- Verified `npm run lint`, `npx tsc --noEmit`, and `node --test tests/story-1-3.test.mjs tests/story-1-4.test.mjs tests/story-1-5.test.mjs` all pass in `frontend/`.
- Sprint status artifact could not be updated because `_bmad-output/implementation-artifacts/sprint-status.yaml` does not exist in the repo.

## Change Log

- Added `Button`, `Card`, `Chip`, `InputField`, `Timeline`, `TabBar`, `Badge`, `Toast`, and `ServingAdjuster` under `frontend/components/`.
- Added `frontend/components/index.ts` and `frontend/tests/story-1-5.test.mjs`.
- Updated `frontend/package.json` to include the story 1.5 test in the frontend test script.

### File List

- `_bmad-output/implementation-artifacts/1-5-primitive-component-library-9-components.md`
- `frontend/components/Badge.tsx`
- `frontend/components/Button.tsx`
- `frontend/components/Card.tsx`
- `frontend/components/Chip.tsx`
- `frontend/components/InputField.tsx`
- `frontend/components/ServingAdjuster.tsx`
- `frontend/components/TabBar.tsx`
- `frontend/components/Timeline.tsx`
- `frontend/components/Toast.tsx`
- `frontend/components/index.ts`
- `frontend/package.json`
- `frontend/tests/story-1-5.test.mjs`
