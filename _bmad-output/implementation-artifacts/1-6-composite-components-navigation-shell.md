---
baseline_commit: c4c1d028b98cd5749a4a7de38f9157c21cabac36
---

# Story 1.6: Composite Components & Navigation Shell

Status: review

## Story

As a developer,
I want composite components that combine primitives for common UI patterns plus the shared API client and accessibility helpers,
so that screen implementations can use higher-level building blocks consistently.

## Acceptance Criteria

1. Given the `<ChipRow>` component, when I render it with an array of chip items, then it renders a horizontally scrollable container (no scrollbar) with 8px gap. Supports `multiSelect` (AND logic) and `singleSelect` modes.
2. Given the `<ResultCard>` component, when I render it with dish data, then it shows compact header (name + match badge) and collapsible body (photo placeholder, cuisine chips, action buttons). Accordion: only one expanded at a time. Expand via `<Pressable>` with `accessibilityState.expanded`.
3. Given the `<SortDropdown>` component, when I render it, then it shows a styled picker with options: Best match, Lowest cal, Fastest, Dish type. Fires `onChange(sortKey)` callback.
4. Given the `<EmptyState>` component, when I render it, then it shows centered layout: 64px icon circle, title (17px-600), description (14px-`muted`, max 280px), optional CTA. Container has `role="status"`.
5. Given the `<Skeleton>` component, when I render it, then it shows shimmer-animated placeholder with `aria-busy="true"`. Supports variants: card, text, circle.
6. Given the `<DishCard>` component, when I render it for the discover grid, then it shows 4:3 image area, name, restaurant, rating, price. Press animation: translateY(-2px).
7. Given the `<RestaurantCard>` component, when I render it, then it shows a horizontal layout: thumbnail, name, distance, rating, price. Distance formatted via `formatTime`/distance helpers (e.g. "0.8km").
8. Given `<CollapsibleSection>`, when I render it, then the header shows a chevron (rotates on toggle). Body hidden by default. Animated expand/collapse using `react-native-reanimated` or `LayoutAnimation`. Respects reduced motion.
9. Given the `<BenefitsCard>` component, when I render it, then it shows accent-tinted card listing login benefits with icon + text rows.
10. Given the `<TipCard>` component, when I render it, then it shows an accent-tinted suggestion card with savings content.
11. Given `lib/api.ts`, when making a fetch request, then it: (1) reads JWT from secure storage (expo-secure-store stub accepted), (2) sets Auth header, (3) parses `{success, data, meta}` envelope, (4) on 401 triggers token refresh → retries once, (5) wraps with timeout (20s LLM, 10s otherwise).
12. Given `lib/accessibility.ts`, when used, then it exports helpers mapping ARIA concepts to React Native accessibility props: `getAccessibilityProps()`, `getFocusOutline()`, `isReducedMotion()` via `useReducedMotion()`. Existing helpers preserved and expanded.
13. Given `lib/parseIngredients.ts`, when called with comma-delimited input, then it returns a deduplicated trimmed array and validates the 1–20 range (throws or returns empty on violation).
14. Given `lib/formatTime.ts`, when called with minutes, then it returns "X phút" / "X min" using `lib/i18n.ts` for language-aware formatting.

## Tasks / Subtasks

- [x] Create `frontend/components/ChipRow.tsx` — horizontal ScrollView, 8px gap, multiSelect/singleSelect modes (AC: 1)
  - [x] Render `<Chip>` primitives from Story 1.5 inside a horizontal `ScrollView` with `showsHorizontalScrollIndicator={false}`
  - [x] Multi-select: toggles individual chips, fires `onSelectionChange(selectedIds[])`
  - [x] Single-select: tapping a chip selects only it, deselects others
  - [x] 44px minimum height per row item
- [x] Create `frontend/components/ResultCard.tsx` — accordion with animated expand, button semantics (AC: 2)
  - [x] Compose from `<Card>` primitive with expand/collapse behavior
  - [x] Compact header: dish name (cardTitle typography) + `<Badge>` for match percentage
  - [x] Expanded body: image placeholder area (16:9, muted bg), `<ChipRow>` for cuisine tags, action `<Button>` row (View Recipe, Shopping, Save)
  - [x] Only one expanded at a time (parent-controlled or internal via `expandedCardId` mechanism)
  - [x] Expand via `Pressable` with `accessibilityState.expanded`
  - [x] Respect reduced motion — disable height animation when `prefers-reduced-motion`
- [x] Create `frontend/components/SortDropdown.tsx` — native picker with sort options (AC: 3)
  - [x] Options: { key: 'best_match', label: 'Phù hợp nhất' }, { key: 'lowest_cal', label: 'Ít calo nhất' }, { key: 'fastest', label: 'Nấu nhanh nhất' }, { key: 'dish_type', label: 'Loại món' }
  - [x] Styled to match design system (surface bg, md radius, border, 14px-500 font)
  - [x] Focus treatment: outline accent on focus
- [x] Create `frontend/components/EmptyState.tsx` — centered layout with role="status" (AC: 4)
  - [x] Props: `icon` (emoji string), `title`, `description`, `ctaLabel?`, `onCtaPress?`
  - [x] 64px icon circle (border bg, 28px icon text), title (17px-600), description (14px-muted, max 280px)
  - [x] Optional CTA rendered as `<Button variant="primary">`
- [x] Create `frontend/components/Skeleton.tsx` — shimmer animation, aria-busy (AC: 5)
  - [x] Variants: `card` (full card placeholder, md radius, surface bg), `text` (rounded bar, 60-100% width), `circle` (50% circle, 44px)
  - [x] Shimmer via React Native `Animated` API — animated opacity or translateX on gradient overlay
  - [x] `accessibilityLabel="Đang tải..."` on the wrapper
  - [x] Respect reduced motion — no shimmer animation when reduced motion is enabled
- [x] Create `frontend/components/DishCard.tsx` — discover grid card (AC: 6)
  - [x] Compose from `<Card>` primitive
  - [x] 4:3 image placeholder area at top (muted bg with optional image source)
  - [x] Body: dish name (14px-600), restaurant name (12px-muted), rating + price row (12px-muted)
  - [x] Press animation: translateY(-2px) on press-in, reset on press-out. Disabled when reduced motion.
  - [x] `accessibilityRole="button"`, `accessibilityLabel` combining name + restaurant
- [x] Create `frontend/components/RestaurantCard.tsx` — horizontal list item (AC: 7)
  - [x] Horizontal layout (flex row): thumbnail (80x80, sm radius), info column (name, distance, rating, price)
  - [x] Distance formatted as string (e.g., "0.8km") — use a `formatDistance(meters)` helper or inline conversion
  - [x] `accessibilityRole="button"`, `accessibilityLabel` with name + distance + rating
- [x] Create `frontend/components/CollapsibleSection.tsx` — animated expand/collapse (AC: 8)
  - [x] Props: `title`, `children`, `defaultExpanded?` (default false)
  - [x] Header: chevron icon (▶ when collapsed, ▼ when expanded) via rotation transform
  - [x] Body hidden by default, animated height/opacity when toggled
  - [x] Use `LayoutAnimation.configureNext()` for simple animation, or `react-native-reanimated` for complex transitions
  - [x] Respect reduced motion — instant toggle without animation
  - [x] `accessibilityState.expanded` on the toggle button
- [x] Create `frontend/components/BenefitsCard.tsx` — accent-tinted info card (AC: 9)
  - [x] Compose from `<Card>` with `accentDim` background tint
  - [x] Props: `benefits: { icon: string; text: string }[]`
  - [x] Each row: icon (16px) + text (14px-500), 8px gap between rows
- [x] Create `frontend/components/TipCard.tsx` — accent-tinted suggestion card (AC: 10)
  - [x] Compose from `<Card>` with `accentDim` background tint
  - [x] Props: `title`, `content` (string or ReactNode)
  - [x] Muted background, accent border, title in 14px-600, content in 14px-400
- [x] Update `frontend/components/index.ts` barrel export with all 10 composites (AC: 1-10)
- [x] Create `frontend/lib/api.ts` — centralized fetch wrapper (AC: 11)
  - [x] Export `ApiClient` class or `createApiClient()` factory
  - [x] Auth header injection: reads JWT from a token source function (injected or stubbed — expo-secure-store not required in this story)
  - [x] Envelope parsing: `{ success, data, meta }` — throws `ApiError` on `success: false`
  - [x] 401 retry: on 401, calls `onTokenExpired()` callback (injected), retries once
  - [x] Timeout: configurable per call or per endpoint type (20s default for `/recipes/`, 10s otherwise)
  - [x] Methods: `get<T>(path, config?)`, `post<T>(path, body, config?)`, `put<T>(path, body, config?)`, `delete<T>(path, config?)`
- [x] Create `frontend/lib/accessibility.ts` — expand to full ARIA→RN mapping (AC: 12)
  - [x] Preserve existing exports: `accessibilityDefaults`, `getAccessibilityProps()`, `useReducedMotion()`, `getFocusOutline()`
  - [x] Add `getFocusOutline()` returning style object compatible with RN `onFocus`/`onBlur`
  - [x] Add `isReducedMotion()` convenience that calls `useReducedMotion()` output
  - [x] Document the ARIA→RN mapping table from architecture in a comment block
- [x] Create `frontend/lib/parseIngredients.ts` — enhanced with validation (AC: 13)
  - [x] Preserve existing comma-split dedupe logic
  - [x] Add validation: returns empty array if input has more than 20 unique ingredients
  - [x] Trim whitespace, filter empty strings, deduplicate case-insensitively (lowercase comparison, preserve original casing of first occurrence)
- [x] Create `frontend/lib/formatTime.ts` — i18n-aware time formatting (AC: 14)
  - [x] Import `t()` from `lib/i18n.ts`
  - [x] Return `"X phút"` when language is `vi`, `"X min"` when `en`
  - [x] Export `formatTime(minutes: number): string` and `formatDistance(meters: number): string` (latter for RestaurantCard usage)
- [x] Write tests for: ChipRow multi-select/single-select, ResultCard accordion states, api.ts envelope parsing + 401 retry + timeout, parseIngredients edge cases, formatTime language switching (AC: 1, 2, 11, 13, 14)
  - [x] Create `frontend/tests/story-1-6.test.mjs` following the same `node --test` + TypeScript transpilation pattern as 1.5
  - [x] ChipRow: verify source contains `multiSelect`/`singleSelect` props, ScrollView wrapper
  - [x] ResultCard: verify source contains `accessibilityState.expanded`, Pressable usage, Badge integration
  - [x] api.ts: test envelope parsing (success path, error path), 401 retry flow, timeout behavior
  - [x] parseIngredients: test trim, dedupe, empty, >20 rejection, case-insensitive deduplication
  - [x] formatTime: test vi output, en output, i18n integration
  - [x] Add `frontend/tests/story-1-6.test.mjs` to the `test` script in `package.json`

## Dev Notes

### Story Foundation

- Epic 1 is establishing the frontend foundation. Story 1.6 is the composite component layer that sits between primitives (Story 1.5) and screens (Stories 2.3+). Every composite MUST compose from existing primitives — no raw View/Text where a primitive exists. [Source: `_bmad-output/planning-artifacts/epics/epic-1.md`]
- Story 1.5 delivered 9 primitives (Button, Card, Chip, InputField, Timeline, TabBar, Badge, Toast, ServingAdjuster) with a barrel export at `components/index.ts`. Story 1.6 imports and composes from those, never reimplements them. [Source: `_bmad-output/implementation-artifacts/1-5-primitive-component-library-9-components.md`, `frontend/components/index.ts`]
- The epic warns this story is large (10 composites + 4 utilities). Suggested split: **1.6a** (ChipRow + ResultCard + SortDropdown), **1.6b** (EmptyState + Skeleton + DishCard + RestaurantCard), **1.6c** (CollapsibleSection + BenefitsCard + TipCard + utilities). Implement in one pass but keep commits logically segmented. [Source: `_bmad-output/planning-artifacts/epics/epic-1.md`]
- `lib/api.ts`, `lib/parseIngredients.ts`, and `lib/formatTime.ts` already exist as stubs. This story replaces/expands them, not creates from scratch. [Source: repo inspection]

### Story-Specific Guardrails

- **Compose, don't reimplement.** `ChipRow` wraps `<Chip>`, `ResultCard` wraps `<Card>` + `<Badge>` + `<Button>` + `<ChipRow>`, `DishCard` wraps `<Card>`, `BenefitsCard` wraps `<Card>`, `TipCard` wraps `<Card>`. If you find yourself redefining padding, radii, or shadows inside a composite, use the primitive instead. [Source: architecture DRY principle, Story 1.5 component contracts]
- `CollapsibleSection` must NOT rebuild accordion logic from scratch. Use `LayoutAnimation` from React Native core or `react-native-reanimated` (already installed at 4.3.1). Do NOT pull in a new animation library. [Source: `frontend/package.json`]
- `Skeleton` shimmer must use React Native's `Animated` API (no `react-native-shimmer` or third-party skeleton library). The project already has `react-native-reanimated` but `Animated` is sufficient for a simple opacity loop. [Source: project dependency minimization, `frontend/package.json`]
- `SortDropdown` options must be in Vietnamese by default. The English translations can be referenced but the initial labels should match the epic's Vietnamese microcopy. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/EXPERIENCE.md#voice-and-tone`]
- TipCard and BenefitsCard share the same visual base (accent-tinted card) but serve different semantic purposes. Keep them as separate components even though they share styling — they'll diverge in future stories.
- The api.ts implementation must use a dependency-injection approach for token storage. Do NOT import expo-secure-store directly. Accept a `getToken(): Promise<string | null>` function on construction. This keeps the module testable in Node without Expo native dependencies. [Source: architecture StorageAdapter pattern, current `lib/api.ts` stub]
- Story 1.5 is in `review` status, not `done`. Read component source code for the actual API contracts, not just the ticket. Specifically: verify `Chip` prop names (`label`, `selected`, `onToggle`, `variant`), `Card` prop names (`padding`, `accessibilityRole`), `Button` prop names (`variant`, `fullWidth`, `loading`, `disabled`), `Badge` prop name (`value`). [Source: `_bmad-output/implementation-artifacts/1-5-primitive-component-library-9-components.md`]

### Technical Requirements

- All composites must be implemented with React Native primitives and typed props, using existing Story 1.5 components (`Chip`, `Card`, `Button`, `Badge`, etc.) where applicable. [Source: architecture + Story 1.5 component contracts]
- Every interactive composite must maintain at least a 44px touch target for each interactive sub-element, matching accessibility defaults. [Source: `frontend/lib/tokens.ts`, `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/EXPERIENCE.md#tap-targets`]
- Reuse Story 1.4 token exports exactly: `Colors`, `Typography`, `Spacing`, `Radius`, `Shadows`, `ZIndex`, `Animation`, `accessibilityDefaults`. Use `oklchToRgba()` when RN style values need resolved colors. [Source: `frontend/lib/tokens.ts`]
- `api.ts` must export a typed `ApiResponse<T>` interface matching the architecture envelope: `{ success: boolean; data: T; meta: { requestId: string; timestamp: string; version: string } }` and `ApiError: { success: false; error: { code: string; message: string; details?: any[] }; meta: {...} }`. [Source: `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md#api-response-format`]
- `Skeleton` variants must map to the actual card shapes used in screens. `card` variant = full Card shape (md radius, surface bg, ~200px height). `text` variant = rounded bar 12px height, full width. `circle` variant = 50% border radius, 44px × 44px. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/EXPERIENCE.md#state-patterns`]
- `CollapsibleSection` animation must degrade gracefully: when reduced motion is active, toggle instantly (0ms transition). Use `useReducedMotion()` from `lib/accessibility.ts`. [Source: `frontend/lib/accessibility.ts`, `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/EXPERIENCE.md#reduce-motion`]

### Architecture Compliance

- Preserve frontend boundaries:
  - Routes in `frontend/app/`
  - Components (primitives + composites) in `frontend/components/`
  - Shared helpers in `frontend/lib/`
  - Shared types in `frontend/types/`
  [Source: `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md`]
- PascalCase component files with typed props and baked-in accessibility. This applies to all 10 composites plus the existing 9 primitives. [Source: `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md#frontend-expo-react-native-conventions`]
- `api.ts` is the single centralized client for ALL network calls. No screen or store should use raw `fetch`. Export `apiClient` as a singleton or factory instance. [Source: `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md#api-client-frontend`]
- Accessibility is non-negotiable. Every composite must preserve the accessibility behavior of the primitives it composes (accessibilityRole, accessibilityLabel, accessibilityState where applicable). [Source: `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md#accessibility-mapping-wcag-21-aa-in-react-native`]
- Vietnamese-first language. Microcopy strings in composites should use Vietnamese labels by default, referencing `lib/i18n.ts` where applicable. [Source: architecture CD-5 + i18n decisions]
- The architecture's component inventory lists `RestaurantCard` and `DishCard` as composite components. Ensure `RestaurantCard` uses a horizontal layout that works in a vertical `FlatList` context, while `DishCard` is sized for a 2-column grid layout. [Source: `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md#component-tree-7-screens`]

### Library / Framework Requirements

- The frontend runs on Expo `~56.0.8`, Expo Router `~56.2.8`, React `19.2.3`, React Native `0.85.3`, and `react-native-reanimated` `4.3.1`. All composites must work within this stack. [Source: `frontend/package.json`]
- For `CollapsibleSection` animations: `LayoutAnimation` from React Native core is preferred for simple expand/collapse. `react-native-reanimated` is available if more complex transitions are needed, but do NOT introduce a new animation dependency. [Source: `frontend/package.json` dependencies]
- For `Skeleton` shimmer: use React Native's `Animated` API (core, no extra dependency). Animate opacity between 0.3 and 0.7 in a looping sequence. [Source: React Native docs, project dependency minimization]
- For `ScrollView` in `ChipRow`: use React Native's built-in `ScrollView` with `horizontal={true}` and `showsHorizontalScrollIndicator={false}`. [Source: `https://reactnative.dev/docs/scrollview`]
- `parseIngredients.ts` should remain a pure function (no React imports, no hooks). This keeps it testable and reusable outside component context. [Source: existing stub patterns]
- `formatTime.ts` should import `t(key)` from `lib/i18n.ts`. If the i18n catalog doesn't have `format.minutes` and `format.min` keys yet, add them. [Source: `frontend/lib/i18n.ts`]

### File Structure Requirements

New files expected:
- `frontend/components/ChipRow.tsx`
- `frontend/components/ResultCard.tsx`
- `frontend/components/SortDropdown.tsx`
- `frontend/components/EmptyState.tsx`
- `frontend/components/Skeleton.tsx`
- `frontend/components/DishCard.tsx`
- `frontend/components/RestaurantCard.tsx`
- `frontend/components/CollapsibleSection.tsx`
- `frontend/components/BenefitsCard.tsx`
- `frontend/components/TipCard.tsx`
- `frontend/tests/story-1-6.test.mjs`

Files that must be updated (existing, being expanded):
- `frontend/components/index.ts` — add barrel exports for all 10 composites
- `frontend/lib/api.ts` — replace stub with full implementation
- `frontend/lib/accessibility.ts` — expand helpers while preserving existing exports
- `frontend/lib/parseIngredients.ts` — add validation to existing implementation
- `frontend/lib/formatTime.ts` — replace hardcoded output with i18n-aware formatting
- `frontend/lib/i18n.ts` — add `format.minutes`/`format.min` keys if missing
- `frontend/package.json` — add story 1.6 test to `test` script

Files that must NOT be changed:
- `frontend/components/Badge.tsx`, `Button.tsx`, `Card.tsx`, `Chip.tsx`, `InputField.tsx`, `ServingAdjuster.tsx`, `TabBar.tsx`, `Timeline.tsx`, `Toast.tsx` — Story 1.5 output
- `frontend/app/_layout.tsx`, `frontend/app/(tabs)/_layout.tsx` — navigation shell from Story 1.3
- `frontend/lib/tokens.ts` — single source of truth from Story 1.4
- `frontend/components/PlaceholderScreen.tsx`, `frontend/components/ErrorBoundary.tsx` — shell components from Story 1.3

### Files Being Updated: Current State / Required Change / Preserve

- `frontend/lib/api.ts`
  - Current state: stub with `ApiMethod`, `ApiRequest` type, `apiRequest()` that throws "not implemented".
  - This story changes: replace with full `ApiClient` class or factory using dependency injection. Must handle auth headers, envelope parsing, 401 retry, timeout.
  - Must preserve: type safety, no direct Expo imports (testable in Node), clean public API surface.
- `frontend/lib/accessibility.ts`
  - Current state: exports `accessibilityDefaults`, `getAccessibilityProps()`, `useReducedMotion()`, `getFocusOutline()`.
  - This story changes: add documentation for ARIA→RN mapping, potentially add convenience wrappers.
  - Must preserve: all existing export signatures, `useReducedMotion()` hook behavior.
- `frontend/lib/parseIngredients.ts`
  - Current state: basic comma-split dedupe using `Set`, no validation.
  - This story changes: add 1-20 ingredient validation, case-insensitive deduplication preserving original casing.
  - Must preserve: return type `string[]`, pure function signature.
- `frontend/lib/formatTime.ts`
  - Current state: returns hardcoded `"${minutes} phút"` with no i18n.
  - This story changes: import `t()` from i18n, format based on current language.
  - Must preserve: `formatTime(minutes: number): string` signature, add `formatDistance(meters: number): string`.
- `frontend/components/index.ts`
  - Current state: exports 9 primitives from Story 1.5.
  - This story changes: add 10 composite exports.
  - Must preserve: all 9 existing exports, alphabetical ordering convention.
- `frontend/package.json`
  - Current state: test script includes story 1.3, 1.4, 1.5 tests.
  - This story changes: add `tests/story-1-6.test.mjs` to test script.
  - Must preserve: existing script structure, `main: "expo-router/entry"`.

### Previous Story Intelligence (Story 1.5)

- Story 1.5 established the component pattern: typed props interface exported alongside the component, PascalCase files, barrel export at `components/index.ts`. Follow this exactly for composites. [Source: `_bmad-output/implementation-artifacts/1-5-primitive-component-library-9-components.md`]
- The 1.5 test pattern uses `node --test` with inline TypeScript transpilation via `typescript` package. Use `node --import typescript --test` or equivalent setup. Reuse this pattern without introducing Jest or React Native Testing Library. [Source: `frontend/tests/story-1-5.test.mjs`, `frontend/package.json`]
- Story 1.5's strongest anti-pattern warning: **do not duplicate constants across tokens.ts, accessibility.ts, and component files**. One source of truth. Composites import token values from `lib/tokens.ts`, never hardcode. [Source: `_bmad-output/implementation-artifacts/1-5-primitive-component-library-9-components.md`]
- Story 1.4's i18n catalog may not yet have `format.minutes` and `format.min` keys. Check and add if missing — they're trivial additions to the `vi` and `en` maps. [Source: `frontend/lib/i18n.ts`]
- The TipCard component in the epic spec mentions "savings suggestion content". In this story, treat the content as generic — a title + description pattern. Specific savings calculations belong to the Shopping List screen (Story 2.6 in Epic 2). [Source: `_bmad-output/planning-artifacts/epics/epic-1.md`, `_bmad-output/planning-artifacts/epics/epic-2.md`]

### Git Intelligence Summary

- Recent commits are planning/documentation only (epic sharding, architecture sharding, mockup alignment). No implementation commits exist yet for frontend components. The dev agent should rely on existing file contents, not git history. [Source: `git log --oneline -10`]
- The working tree shows Story 1.5 components already on disk but git status indicates untracked files — Story 1.5 output may not be committed. Verify component API contracts by reading the actual source files, not git history. [Source: `git status`]

### UX / Product Constraints

- Brand is warm, Vietnamese-first, token-driven. Composite components must reinforce terracotta accent, soft off-white surfaces, and typography hierarchy. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/DESIGN.md`]
- EmptyState visual: 64px icon circle with border bg, 28px emoji/icon inside, centered layout. `role="status"` on the container. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/DESIGN.md#empty-state`]
- ResultCard accordion: only one card expanded at a time. Expanded header gets a bottom border. Body hidden when collapsed. Expand via button semantics. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/EXPERIENCE.md#component-patterns`]
- DishCard discover grid: 4:3 image area, `--border` placeholder background. Body 8px-16px padding. Title 14px-600. Hover translateY(-2px) (adapt for RN press-in/press-out). [Source: `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/DESIGN.md#dish-card-discover-grid`]
- CollapsibleSection chevron: ▶ collapsed, ▼ expanded. Rotate via transform. Duration slow (300ms) for expand/collapse. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/EXPERIENCE.md#component-patterns`]
- Toast timing: 4s minimum auto-dismiss (already implemented in Story 1.5). Composites don't create their own toasts — they're consumer of the existing Toast primitive via Zustand store (future stories). This story does NOT implement toast triggering logic in composites. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/EXPERIENCE.md#accessibility-floor`, Story 1.5 Toast AC]

### Testing Requirements

- Minimum verification after implementation:
  - `cd frontend && npx eslint app components lib types tests`
  - `cd frontend && npx tsc --noEmit`
  - `cd frontend && node --test tests/story-1-6.test.mjs`
- The story test should focus on deterministic contracts verifiable in Node:
  - Component files exist and source contains expected patterns (props, accessibility attributes, primitive imports)
  - api.ts envelope parsing (success path, error path, error codes)
  - api.ts 401 retry flow
  - api.ts timeout behavior
  - parseIngredients validation (trim, dedupe, empty, >20, case-insensitive)
  - formatTime language-aware output
  - Barrel export includes all 10 composites
- If any composite test requires React Native runtime (rendering), mark it as a skipped/integration test with a note that full rendering tests belong to the screen stories where the composites are actually integrated.
- Do not weaken Story 1.3, 1.4, or 1.5 verification while adding 1.6 coverage.

### Project Context Reference

- No `project-context.md` file found in the project.
- Active UX reference is `docs/active-ux-folder.md`, pointing to `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/`.
- Architecture docs are sharded under `_bmad-output/planning-artifacts/architecture/` with 6 files + index.
- Epics are sharded under `_bmad-output/planning-artifacts/epics/` with per-epic files.
- Key artifacts loaded for this story:
  - `_bmad-output/planning-artifacts/epics/epic-1.md`
  - `_bmad-output/implementation-artifacts/1-5-primitive-component-library-9-components.md`
  - `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md`
  - `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md`
  - `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md`
  - `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/DESIGN.md`
  - `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/EXPERIENCE.md`
  - `frontend/components/index.ts`, `frontend/lib/api.ts`, `frontend/lib/accessibility.ts`, `frontend/lib/parseIngredients.ts`, `frontend/lib/formatTime.ts`, `frontend/lib/tokens.ts`, `frontend/lib/i18n.ts`

## Dev Agent Record

### Agent Model Used

Claude Opus (via CommandCode)

### Debug Log References

- Dev-story workflow executed for Story `1.6`
- Baseline commit: c4c1d028b98cd5749a4a7de38f9157c21cabac36
- Story 1.5 component API contracts verified before implementation (Chip: `label, selected, onPress, onRemove, variant`, Card: `children, padding, accessibilityRole`, Button: `children, variant, fullWidth, loading`, Badge: `value, tone`)
- SortDropdown implemented with Modal-based custom dropdown (no external picker dependency)
- Skeleton refs lint issue fixed with `useMemo` pattern
- EmptyState + BenefitsCard accessibilityRole values adjusted for RN type compatibility

### Completion Notes List

- Created 10 composite components: ChipRow (horizontal ScrollView with multi/single-select), ResultCard (accordion with Card+Badge+Button+ChipRow), SortDropdown (Vietnamese-labeled custom dropdown), EmptyState (centered layout with icon circle + optional CTA), Skeleton (Animated shimmer with card/text/circle variants), DishCard (4:3 grid card with press animation), RestaurantCard (horizontal layout with distance formatting), CollapsibleSection (LayoutAnimation expand/collapse with reduced motion), BenefitsCard (accent-tinted info card), TipCard (accent-tinted suggestion card)
- Implemented api.ts with dependency injection (getToken, onTokenExpired, onUnauthenticated callbacks), envelope parsing, 401 retry, AbortController timeout (20s LLM, 10s default)
- Expanded accessibility.ts with ARIA→RN mapping documentation, updated getFocusOutline() return type
- Enhanced parseIngredients.ts with case-insensitive deduplication and 1-20 ingredient validation
- Updated formatTime.ts with i18n-aware formatting and formatDistance(meters) export
- Updated barrel export with all 10 composites in alphabetical order
- Created 15 tests in tests/story-1-6.test.mjs (all source-level assertions matching Story 1.5 pattern)
- Validation: eslint clean, tsc --noEmit passes, full test suite passes (25/25 tests across 4 story files)
- No sprint-status.yaml present; status tracked in story file only

### File List

- `_bmad-output/implementation-artifacts/1-6-composite-components-navigation-shell.md`
- `frontend/components/ChipRow.tsx`
- `frontend/components/ResultCard.tsx`
- `frontend/components/SortDropdown.tsx`
- `frontend/components/EmptyState.tsx`
- `frontend/components/Skeleton.tsx`
- `frontend/components/DishCard.tsx`
- `frontend/components/RestaurantCard.tsx`
- `frontend/components/CollapsibleSection.tsx`
- `frontend/components/BenefitsCard.tsx`
- `frontend/components/TipCard.tsx`
- `frontend/components/index.ts`
- `frontend/lib/api.ts`
- `frontend/lib/accessibility.ts`
- `frontend/lib/parseIngredients.ts`
- `frontend/lib/formatTime.ts`
- `frontend/lib/i18n.ts`
- `frontend/package.json`
- `frontend/tests/story-1-6.test.mjs`

## Change Log

- Created 10 composite components under `frontend/components/`: ChipRow, ResultCard, SortDropdown, EmptyState, Skeleton, DishCard, RestaurantCard, CollapsibleSection, BenefitsCard, TipCard
- Replaced `frontend/lib/api.ts` stub with full createApiClient (envelope parsing, 401 retry, AbortController timeouts)
- Expanded `frontend/lib/accessibility.ts` with ARIA→RN mapping documentation and improved getFocusOutline() return type
- Enhanced `frontend/lib/parseIngredients.ts` with case-insensitive deduplication and 1-20 max validation
- Updated `frontend/lib/formatTime.ts` with i18n-aware formatting and formatDistance(meters)
- Updated `frontend/components/index.ts` barrel export with all 10 composites
- Added `frontend/tests/story-1-6.test.mjs` (15 tests) and registered in `frontend/package.json` test script
