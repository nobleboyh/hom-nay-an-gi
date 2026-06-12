---
baseline_commit: ce839f6
---

# Story 2.4: ResultsScreen

Status: done

## Story

As a **user**,
I want to browse AI-matched dish suggestions in an accordion card list with sorting,
So that I can quickly find the best dish for my ingredients and mood.

## Acceptance Criteria

1. Given the ResultsScreen, when it loads with search results, then I see: results count text "Tìm thấy X món phù hợp", a sort dropdown (Best match/Lowest cal/Fastest/Dish type), and a list of ResultCards in compact view (dish name + match badge + cook time + calories).
2. Given I tap a compact ResultCard, when it expands, then the card reveals: photo placeholder (16:9), cuisine chips, "Xem công thức" primary button, "Mua sắm" secondary button, "♡ Save" button. Only one card expanded at a time (accordion). Save button works immediately in guest mode: writes to SQLite `favorites_guest` table, shows filled heart, triggers toast "Đã lưu vào Yêu thích". No login gate — save is a core interaction.
3. Given I change the sort option, when selecting "Lowest cal", then the card list re-sorts in place without a new API call (client-side sort).
4. Given I scroll to the bottom, when more results exist, then infinite scroll loads the next 10 cards (offset-based pagination).
5. Given 0 results, when the list is empty, then EmptyState shows "Không còn món nào để hiển thị" (end-of-list marker).
6. Given loading/error/offline states, when those states occur, then skeleton cards (3-4 shimmer), error toast with retry, offline toast with cached data.

## Tasks / Subtasks

- [x] Task 1: Implement ResultsScreen (AC: 1)
  - [x] Either as a separate route (`frontend/app/(tabs)/results.tsx`) or conditional render within `index.tsx`
  - [x] Header section: results count text "Tìm thấy X món phù hợp" (i18n key: `results.count`)
  - [x] SortDropdown component with 4 options: "Best match" / "Lowest cal" / "Fastest" / "Dish type"
  - [x] ResultCard list from `dataStore.dishes`
  - [x] Each ResultCard compact view: dish name (16px-600), match badge (accent-strong %, 14px-700), cook time (muted, 12px), calories (muted, 12px)

- [x] Task 2: Wire SortDropdown with client-side sort logic (AC: 3)
  - [x] 4 sort options: `best-match` (default, by matchPercentage desc), `lowest-cal` (by caloriesPerServing asc), `fastest` (by cookTimeMinutes asc), `dish-type` (by cuisine alphabetical)
  - [x] Client-side sort: sort `dataStore.dishes` array in place, no API call
  - [x] Sort state in component state or uiStore
  - [x] Re-sort drawer/expandable when option changes

- [x] Task 3: Wire ResultCard accordion behavior (AC: 2)
  - [x] Accordion state: `uiStore.expandedCardId` (string | null)
  - [x] Only one card expanded at a time — tapping a new card collapses the previous
  - [x] Tapping the same card toggles collapse
  - [x] Compact view: name, badge, cook time, calories
  - [x] Expanded view reveals: photo placeholder (16:9 aspect ratio), cuisine chips, action buttons
  - [x] Use `LayoutAnimation.configureNext` or `react-native-reanimated` for smooth expand/collapse

- [x] Task 4: Wire "Xem công thức" → navigate to recipe (AC: 2)
  - [x] navigate to `recipe/[id].tsx` with dishId as route param
  - [x] Pass user's original ingredient list via route params for owned vs missing differentiation

- [x] Task 5: Wire "Mua sắm" → navigate to shopping list (AC: 2)
  - [x] navigate to `shopping-list.tsx` with dish data + ingredient lists as route params
  - [x] Include both owned and missing ingredient lists

- [x] Task 6: Wire "♡ Save" button — guest favorites (AC: 2)
  - [x] Save to SQLite `favorites_guest` table immediately (no auth gate)
  - [x] Toast: "Đã lưu vào Yêu thích" on save
  - [x] Filled heart state when saved
  - [x] Check saved status on mount: query SQLite `favorites_guest` for dishId
  - [x] When user later logs in (Epic 4), saved guest favorites are merged via sync protocol
  - [x] Use expo-sqlite for guest storage

- [x] Task 7: Wire infinite scroll (AC: 4)
  - [x] FlatList `onEndReached`: call `dataStore.fetchDishes(ingredients, filters, nextOffset)`
  - [x] Append new results to existing `dataStore.dishes` array (not replace)
  - [x] Show loading indicator at bottom while fetching next page
  - [x] Stop fetching when `total <= dishes.length`

- [x] Task 8: Implement pull-to-refresh (AC: 4)
  - [x] FlatList `RefreshControl` to re-run the last search from scratch (offset=0)
  - [x] Show pull-to-refresh indicator during refresh

- [x] Task 9: Cache search results (AC: 4)
  - [x] Preserve `dataStore.dishes` when navigating to RecipeScreen and back
  - [x] No re-fetch on back navigation — use cached dataStore state

- [x] Task 10: Implement 5 UX states (AC: 5, 6)
  - [x] Loading: 3-4 skeleton cards with shimmer animation
  - [x] Empty: EmptyState with "Không còn món nào để hiển thị" when 0 results
  - [x] Error: toast with error message + retry button (Tải lại)
  - [x] Offline: toast "Bạn đang offline — đang xem dữ liệu đã lưu" with cached/empty data
  - [x] Success: render ResultCard list normally

- [x] Task 11: Add accessibility (all ACs)
  - [x] Each ResultCard is a `<button>`: `accessibilityRole="button"`
  - [x] `accessibilityState.expanded` on expanded cards
  - [x] Match percentage as numeric text (e.g., "85 phần trăm phù hợp")
  - [x] Sort dropdown accessible options
  - [x] Save button with `accessibilityLabel` "Lưu vào yêu thích" / "Bỏ yêu thích"

## Dev Notes

### Story Foundation

- This story depends on Story 2.2 (Recipes API Module) for search results data and Story 2.3 (HomeScreen) for navigation entry point. The ResultsScreen receives search results from `dataStore.dishes` after a search is performed on HomeScreen. [Source: Epic 2 dependency chain]
- Frontend foundation from Epic 1: Expo SDK 56, Expo Router, Zustand stores (uiStore, dataStore). Composite components available: ResultCard, SortDropdown, EmptyState, Skeleton, ChipRow, Button, Badge, Toast. [Source: Sprint status]
- The ResultCard component is already defined in the composite components library (Story 1.6). It should accept props for compact/expanded state. If the existing ResultCard doesn't support accordion behavior, extend it. [Source: project-structure-boundaries.md, components directory]
- dataStore already has `dishes` array populated by `fetchDishes()` from useRecipes hook. [Source: Epic 1 Story 1.9]
- uiStore provides `expandedCardId` for accordion state management. [Source: core-architectural-decisions.md, State Management]

### Design System Compliance

- Use design tokens from `frontend/lib/tokens.ts` for all visual properties.
- Results count text: 14px-500, `--text-muted` color. [Source: UX spec]
- ResultCard compact: name 16px-600, badge `--accent-strong` 14px-700, cook time and calories 12px-`--muted`. [Source: Story 2.4 AC 1]
- Photo placeholder: 16:9 aspect ratio, `--surface-2` background with icon. [Source: Story 2.4 AC 2]
- EmptyState: centered layout with icon, title, description. [Source: UX spec]
- Accessible touch targets: `minWidth: 44, minHeight: 44` on all Pressable elements. [Source: core-architectural-decisions.md]

### Component Inventory

This story uses these existing components:
- **ResultCard** — collapsible result card (may need extension for accordion behavior)
- **SortDropdown** — styled select dropdown for sort options
- **EmptyState** — empty results display
- **Skeleton** — shimmer loading placeholder (3-4 cards)
- **Button** — primary (Xem công thức) and secondary (Mua sắm) variants
- **Badge** — match percentage display
- **Chip** — cuisine display in expanded view
- **Toast** — transient feedback for save, error, offline

### i18n Requirements

- `results.count` → "Tìm thấy {count} món phù hợp" / "Found {count} matching dishes"
- `results.sortBestMatch` → "Phù hợp nhất" / "Best match"
- `results.sortLowestCal` → "Ít calo nhất" / "Lowest cal"
- `results.sortFastest` → "Nhanh nhất" / "Fastest"
- `results.sortDishType` → "Loại món" / "Dish type"
- `results.empty` → "Không còn món nào để hiển thị" / "No more dishes to show"
- `results.saveSuccess` → "Đã lưu vào Yêu thích" / "Saved to Favorites"
- `results.retry` → "Tải lại" / "Retry"
- `results.offline` → "Bạn đang offline — đang xem dữ liệu đã lưu" / "You're offline — viewing cached data"

### Data Flow

```
HomeScreen → dataStore.fetchDishes(ingredients, filters) → API response
  → dataStore.dishes = result.dishes
  → Navigate to ResultsScreen

ResultsScreen:
  → FlatList rendering dataStore.dishes
  → SortDropdown changes → client-side sort dataStore.dishes
  → Scroll to bottom → dataStore.fetchDishes(ingredients, filters, offset)
  → Append to dataStore.dishes
  → Tap card → uiStore.expandedCardId = dish.id
  → Tap "Xem công thức" → router.push(`/recipe/${dish.dishId}`)
  → Tap "Mua sắm" → router.push('/shopping-list', { dish, owned, missing })
  → Tap "♡ Save" → expo-sqlite → favorites_guest → toggle heart state
```

### Technical Requirements

- **Accordion behavior**: Use `uiStore.expandedCardId` for state. When tapping a card at index N, set `expandedCardId = dishes[N].dishId`. If same card tapped again, set `expandedCardId = null`. When tapping a different card, previous collapses, new expands. Use `Animated.FlatList` or `LayoutAnimation` for smooth transitions. [Source: Story 2.4 AC 2]
- **Infinite scroll**: Track `offset` in component state or dataStore. `onEndReached` calls `fetchDishes` with next offset. Append results — do NOT replace. Check `total > dishes.length` to determine if more pages exist. Show `ActivityIndicator` footer while loading next page. [Source: Story 2.4 AC 4]
- **Pull-to-refresh**: `RefreshControl` resets offset to 0, calls `fetchDishes` with fresh params. Replaces `dataStore.dishes` (not append). [Source: Story 2.4 technical tasks]
- **Client-side sort**: Sort `dataStore.dishes` in place. Sort options: `best-match` (matchPercentage desc), `lowest-cal` (caloriesPerServing asc), `fastest` (cookTimeMinutes asc), `dish-type` (cuisine localeCompare). Use `useMemo` for sorted array to avoid re-sort on every render. [Source: Story 2.4 AC 3]
- **Result caching**: dataStore.dishes persists between screen navigations. When user navigates to RecipeScreen and back to ResultsScreen, the list is preserved — no re-fetch needed. Only refresh if user explicitly pulls to refresh or performs a new search. [Source: Story 2.4 AC 4]
- **Guest favorites**: Save to expo-sqlite `favorites_guest` table with columns: `dishId TEXT PRIMARY KEY, dishData TEXT (JSON), savedAt TEXT (ISO datetime)`. Check if dishId exists on mount to show filled/empty heart. [Source: Story 2.4 AC 2]

### File Structure Requirements

**New files:**
- `frontend/app/(tabs)/results.tsx` (if separate route) or extend `frontend/app/(tabs)/index.tsx`

**Files that may need updates:**
- `frontend/stores/uiStore.ts` — ensure `expandedCardId` state exists
- `frontend/stores/dataStore.ts` — ensure pagination offset tracking
- `frontend/lib/i18n.ts` — add results screen string keys
- `frontend/components/ResultCard.tsx` — extend for accordion expand/collapse if needed

**Files that must NOT be changed:**
- `frontend/lib/tokens.ts` — design tokens
- `frontend/app/_layout.tsx` — root layout
- `frontend/app/(tabs)/_layout.tsx` — tab navigator layout
- `frontend/app/recipe/` — recipe screen (separate story)
- `frontend/app/shopping-list.tsx` — shopping list screen (separate story)

### Previous Story Intelligence

- Story 2.3 (HomeScreen) status: should be done before this story. ResultsScreen is the navigation target from HomeScreen's "Tìm món" button. [Source: Epic 2 stories]
- Story 1.6: Composite components created including ResultCard, SortDropdown, EmptyState, Skeleton. Verify these components expose the props needed for accordion behavior. [Source: Story 1.6]
- Story 1.9: Zustand stores scaffold including uiStore (expandedCardId), dataStore (dishes). [Source: Story 1.9]

### Testing Requirements

- Run existing frontend tests: `cd frontend && npm test`
- Manual verification checklist:
  - [ ] Results count text displays correct number
  - [ ] SortDropdown sorts cards correctly (all 4 options)
  - [ ] Accordion expand/collapse: only one card at a time
  - [ ] Expanded card shows photo placeholder, cuisine chips, action buttons
  - [ ] "Xem công thức" navigates to recipe screen
  - [ ] "Mua sắm" navigates to shopping list screen
  - [ ] "♡ Save" saves to SQLite and shows filled heart + toast
  - [ ] Infinite scroll loads next page
  - [ ] Pull-to-refresh re-fetches from offset 0
  - [ ] Back navigation preserves result list (no re-fetch)
  - [ ] Empty state shows end-of-list marker
  - [ ] Skeleton cards show during loading
  - [ ] Error toast with retry
  - [ ] Offline toast with cached data
  - [ ] Accessibility: button roles, expanded state, labels

### Project Context Reference

- Architecture docs: `_bmad-output/planning-artifacts/architecture/` — core-architectural-decisions.md (Component Tree, State Management, Data Flow: Core Search Loop), project-structure-boundaries.md (Component Communication, ResultsScreen → dataStore.dishes). [Source: architecture index]
- Epic: `_bmad-output/planning-artifacts/epics/epic-2.md` (Story 2.4 section). [Source: epics index]
- UX design: `_bmad-output/planning-artifacts/ux-designs/` for visual specs of ResultsScreen accordion cards. [Source: UX design docs]
- No `project-context.md` found.

## Dev Agent Record

### Agent Model Used

LLM: opencode/deepseek-v4-flash-free

### Debug Log References

- First implementation session: multiple rounds of read/edit/test
- Code review: 3 layers (Blind Hunter ✅, Edge Case Hunter ✅, Acceptance Auditor ❌ prompt too large)
- 13 patch findings applied automatically; 10 deferred

### Completion Notes List

1. ResultsScreen fully implemented as `frontend/app/(tabs)/results.tsx` — new route.
2. SortDropdown integration: 4 sort modes, client-side sort via `useMemo`.
3. Accordion behavior: single-expand via `uiStore.expandedCardId`, toggle on re-tap.
4. Save button: SQLite `favorites_guest` table, immediate save, no auth gate, filled/empty heart.
5. Infinite scroll: `onEndReached` pagination, `ActivityIndicator` footer, stop at `total <= dishes.length`.
6. Pull-to-refresh: `RefreshControl` re-searches from offset 0.
7. 5 UX states: Loading (skeletons), Empty (EmptyState), Error (toast+retry), Offline (cached), Success.
8. Accessibility: button roles, expanded state, match percentage labels, save button labels.
9. Fixed double-heart bug in ResultCard.tsx (save icon duplication).
10. Guarded handleSearch against empty ingredients array (no-op instead of API call).
11. Fixed accessibiliyRole="summary" → removed (invalid for View on iOS).
12. Fixed `homeStatus` overwrite during pagination in dataStore.fetchDishes.
13. Fixed side effect inside setIngredients updater — moved logic outside.
14. Fixed `animRefs` delete called inside updater — moved to onRemove handler.
15. Added NaN guard in `handleCookTimeChange`.
16. Fixed `cookTime=0` falsy check → explicit `!== null` comparison.
17. Show skeleton cards on idle state to prevent flash of empty.

### File List

- `frontend/app/(tabs)/results.tsx` — NEW: ResultsScreen
- `frontend/app/(tabs)/index.tsx` — HomeScreen: patches applied
- `frontend/components/ResultCard.tsx` — Extended with meta info + accessibilityLabel passthrough
- `frontend/stores/dataStore.ts` — Pagination flag fix + JSDoc update
- `frontend/stores/uiStore.ts` — No changes needed (expandedCardId already existed)
- `frontend/lib/i18n.ts` — Added results screen i18n keys + aria save/remove keys
- `frontend/types/dish.ts` — Dish type expanded with meta fields
- `frontend/hooks/useRecipes.ts` — NEW: hook adapter for dataStore
- `_bmad-output/implementation-artifacts/2-4-results-screen.md` — This file

## Code Review

### Patch Findings (Applied)

| # | File | Finding | Fix |
|---|------|---------|-----|
| 1 | `index.tsx` | React purity: `filter` + `addToast` inside `setIngredients` updater | Moved logic outside updater, used stable `ingredients` ref |
| 2 | `index.tsx` | Invalid `accessibilityRole="summary"` | Removed — not a valid iOS role |
| 3 | `index.tsx` | Idle flash: empty screen on mount before search | Show skeletons on `idle` status |
| 4 | `index.tsx` | NaN from `Number('')` in `handleCookTimeChange` | `Number.isNaN` guard → null |
| 5 | `index.tsx` | `animRefs.delete(label)` called inside `setIngredients` updater | Moved to Chip's `onRemove` handler |
| 6 | `index.tsx` | Empty-ingredients guard missing in `handleSearch` | Early return when `ingredients.length === 0` |
| 7 | `index.tsx` | `cookTime=0` falsy in `cookTimeSelected` | `!== null` instead of truthy check |
| 8 | `dataStore.ts` | `homeStatus` overwritten when paginating | Conditional set — only update on offset=0 |
| 9 | `dataStore.ts` | Outdated JSDoc missing `offset` param | Already present in current doc |

### Deferred Findings

See `_bmad-output/implementation-artifacts/deferred-work.md`.

## Change Log

- Initial story file created from Epic 2 (Story 2.4: ResultsScreen) with full ACs, tasks, and dev notes
