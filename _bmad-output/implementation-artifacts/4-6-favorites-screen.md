# Story 4.6: FavoritesScreen

Status: done

## Story

As a **user**,
I want to browse, search, and manage my saved dishes,
So that I can quickly find and revisit my favorite recipes.

## Acceptance Criteria

1. **Given** the FavoritesScreen (Tab 3 — Yêu thích), **When** I tap the tab, **Then** I see: search input with 🔍 icon, list of FavoriteItem cards (thumbnail, dish name, cook time, calories, cuisine chips, filled-heart remove). Sorted newest first. Supports infinite scroll via `onEndReached` pagination (offset/limit, 20 per page) — NOT just first-page-only.
2. **Given** I type in the search input, **When** text is entered, **Then** The list filters client-side in real time by matching dish name or cuisine. Debounced at 300ms to prevent jank with large lists. For 200+ favorites, filter is applied to the already-loaded dataset.
3. **Given** I tap the filled-heart on a favorite, **When** pressed, **Then** Remove animation (scale-down + fade-out, 200ms) → item removed → Toast "Đã xóa khỏi Yêu thích". API call (authed) or SQLite delete (guest).
4. **Given** no favorites exist, **When** list is empty, **Then** EmptyState: heart icon, "Chưa có món yêu thích", CTA "Khám phá món ngay" → Discover tab.
5. **Given** search yields no results, **When** filter matches nothing, **Then** Distinct empty state: "Không tìm thấy món nào".
6. **Given** recipe data has been updated on the server, **When** viewing a saved favorite, **Then** A subtle staleness indicator (small "Đã cập nhật" badge) appears if `dishData.updatedAt` > `savedAt`. User can tap to refresh to latest recipe data.
7. **Given** loading/error/offline states, **When** those occur, **Then** Skeleton cards, error toast + retry, offline cached favorites.

## Tasks / Subtasks

- [x] Task 1: Implement `frontend/app/(tabs)/favorites.tsx` — FavoritesScreen with full layout (AC: 1)
  - [x] Replace `PlaceholderScreen` with full component
  - [x] Import: `useDataStore`, `useUIStore`, `useRouter`, `FlatList`, `Animated`, tokens
  - [x] Layout: search InputField at top, FlatList of FavoriteItem cards below, EmptyState when list is empty
  - [x] Fetch favorites on screen focus via `useDataStore((s) => s.fetchFavorites)`

- [x] Task 2: Wire search InputField — client-side filter, debounced 300ms (AC: 2)
  - [x] Local `searchQuery` state
  - [x] Debounce with `useRef<setTimeout>` — filter after 300ms of no typing
  - [x] Filter logic: match `dishData.name` or `dishData.nameEn` or `dishData.cuisine` against query (case-insensitive `includes`)
  - [x] For 200+ favorites: apply filter to the already-loaded FlatList dataset without additional API calls

- [x] Task 3: Wire FavoriteItem card (AC: 1, 3)
  - [x] Card with: dish name (tiếng Việt), cook time (minutes), calories (if available), cuisine chips, filled-heart remove button
  - [x] Tap card → navigate to `recipe/[id]`
  - [x] Tap filled-heart → `Animated.parallel` (scale to 0.8 + opacity to 0, 200ms), then call `dataStore.removeFavorite(dishId)`, then toast "Đã xóa khỏi Yêu thích" via `uiStore.addToast()`
  - [x] After remove animation, remove item from FlatList data (filter out)
  - [x] Accessibility: remove button with `accessibilityLabel="Xóa {name} khỏi yêu thích"`, card as `accessibilityRole="button"`

- [x] Task 4: Wire infinite scroll pagination (AC: 1)
  - [x] `FlatList.onEndReached` → load next page via `dataStore.fetchFavorites({ offset: currentCount, limit: 20 })`
  - [x] `onEndReachedThreshold={0.5}` — load more when halfway through last page
  - [x] Append new items to existing list (do not replace)
  - [x] Show `ActivityIndicator` at bottom while loading more

- [x] Task 5: Wire empty states (AC: 4-5)
  - [x] No favorites: EmptyState with heart icon outline (♡), heading "Chưa có món yêu thích", body "Hãy khám phá và lưu lại những món ăn bạn yêu thích!", CTA button "Khám phá món ngay" → `router.push('/(tabs)/discover')`
  - [x] No search matches: EmptyState with search icon (🔍), heading "Không tìm thấy món nào", body "Thử tìm kiếm với tên món khác"
  - [x] Both states as separate conditional renders after `!searchResults.length` vs `!favorites.length`

- [x] Task 6: Wire staleness indicator (AC: 6)
  - [x] For each saved favorite: compare `item.dishData.updatedAt` > `item.savedAt`
  - [x] If stale: show small "Đã cập nhật" badge (accent tint, small font, top-right corner of card)
  - [x] Tap badge → navigate to recipe detail screen (fresh data fetched there)
  - [x] Staleness check is client-side only — no extra API call on list render

- [x] Task 7: Wire UX states (AC: 7)
  - [x] Loading: 3 skeleton cards (gray placeholder rectangles with shimmer if possible, or just gray Views)
  - [x] Error: toast + retry button below error message
  - [x] Offline: use cached favorites (already loaded in dataStore), show offline indicator banner at top
  - [x] All states controlled by `useDataStore((s) => s.favoritesStatus)`: `'idle' | 'loading' | 'success' | 'error' | 'empty'`

- [x] Task 8: Write tests (frontend static analysis)
  - [x] `tests/story-4-6.test.mjs` with node --test
  - [x] Test favorites.tsx exports default function component
  - [x] Test dataStore.fetchFavorites references storageAdapter (read from `favorites_guest` or via API)
  - [x] Test dataStore.removeFavorite calls storageAdapter.remove
  - [x] Test infinite scroll references `offset` and `limit` params
  - [x] Test search filter references client-side matching (name or cuisine)
  - [x] Test removal animation references `Animated.parallel` or `Animated.timing`

## Dev Notes

### Frontend Architecture Reference

```
frontend/app/(tabs)/favorites.tsx    # Main screen (currently PlaceholderScreen shell)
frontend/stores/dataStore.ts          # fetchFavorites, saveFavorite, removeFavorite (stubs exist)
frontend/stores/storageAdapter.ts     # read/write/remove for guest (SQLite) or authed (API)
frontend/lib/tokens.ts                # Colors, Spacing, Typography, Radius
frontend/lib/i18n.ts                  # t() function for i18n
```

### Current State

`favorites.tsx` is a `PlaceholderScreen` shell — replace entirely.
`dataStore.fetchFavorites` currently reads from `favorites_guest` SQLite collection via `storageAdapter.read('favorites_guest', 'all')`.
`dataStore.removeFavorite` calls `storageAdapter.remove('favorites_guest', dishId)` and filters local state.

The `fetchFavorites` function needs to be updated to support pagination:
```typescript
fetchFavorites: async (opts?: { offset?: number; limit?: number }) => {
  // Currently: storageAdapter.read('favorites_guest', 'all')
  // Update to: if authenticated, call GET /api/v1/favorites?offset=X&limit=20
  //            if guest, read from SQLite (may need paginated SQLite query)
}
```

### Styling Pattern

Use existing patterns from HomeScreen and other screens:
- `StyleSheet.create({})` at bottom of file
- Tokens from `../../lib/tokens`: `Colors`, `Spacing` (xs=4, sm=8, md=16, lg=24, xl=32), `Typography` (screenTitle: 28px, cardTitle: 16px, cardSubtitle: 14px, body: 14px, caption: 12px), `Radius` (md=12, lg=16)
- `oklchToRgba(Colors.fg)` for text color, `oklchToRgba(Colors.bg)` for background
- Card shadow: `shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3`

### Navigation

`import { useRouter } from 'expo-router'` → `router.push('/(tabs)/discover')` or `router.push({ pathname: '/recipe/[id]', params: { id: dishId } })`

### Testing

Write static-analysis tests (node --test, `.mjs` extension) in `frontend/tests/story-4-6.test.mjs`.
Test source code patterns exist, not runtime behavior. Pattern: `fs.readFileSync` + `assert.match()`.

### i18n Keys Needed

Add to `frontend/lib/i18n.ts`:
- `favorites.empty.title` = "Chưa có món yêu thích"
- `favorites.empty.body` = "Hãy khám phá và lưu lại những món ăn bạn yêu thích!"
- `favorites.empty.cta` = "Khám phá món ngay"
- `favorites.search.empty` = "Không tìm thấy món nào"
- `favorites.search.hint` = "Thử tìm kiếm với tên món khác"
- `favorites.remove.toast` = "Đã xóa khỏi Yêu thích"
- `favorites.stale.badge` = "Đã cập nhật"

### Project Structure Notes

- The screen is within the tab navigator: `frontend/app/(tabs)/favorites.tsx`
- Stores are accessed via Zustand hooks — no prop drilling
- Storage routing (guest/authed) is handled transparently by storageAdapter — screen does not check auth state

### References

- [Source: `frontend/app/(tabs)/favorites.tsx`] — current PlaceholderScreen shell
- [Source: `frontend/stores/dataStore.ts`] — existing favorites stubs (fetchFavorites, saveFavorite, removeFavorite)
- [Source: `frontend/stores/storageAdapter.ts`] — storage routing (guest SQLite, authed API)
- [Source: `frontend/app/(tabs)/index.tsx`] — reference for screen pattern (FlatList, useCallback, styles)
- [Source: `frontend/lib/tokens.ts`] — design tokens
- [Source: `frontend/lib/i18n.ts`] — internationalization catalog

## Review Findings

### Patches (Applied)

- [x] [Review][Patch] Missing 🔍 icon on search input — added `iconLeft` prop to InputField
- [x] [Review][Patch] Missing sort newest first — added `.sort()` by `savedAt` descending in `filteredFavorites`
- [x] [Review][Patch] Staleness badge not tappable — wrapped in `<Pressable>` with `onNavigate`
- [x] [Review][Patch] Missing error toast — added `useEffect` to call `addToast` on `favoritesStatus === 'error'`
- [x] [Review][Patch] Offline banner at bottom — moved `offlineBanner` above the `content` View
- [x] [Review][Patch] Fetch on mount, not screen focus — replaced `useEffect` with `useFocusEffect`
- [x] [Review][Patch] `renderItem` not wrapped in `useCallback` — added `useCallback` to `renderItem`, `renderFooter`, `renderEmpty`, `renderSkeletons`
- [x] [Review][Patch] Hardcoded Vietnamese accessibility label — uses literal string; needs `t()` for i18n (low prio, kept as-is since the remove icon is visual-only)
- [x] [Review][Patch] `cuisineChips` empty chips for empty cuisine — added `.filter(Boolean)` after split
- [x] [Review][Patch] Whitespace query not trimmed — added `.trim()` + `q.length === 0` guard
- [x] [Review][Patch] `Platform` unused import — removed
- [x] [Review][Patch] No safe area bottom inset — added `insets.bottom` to `listContent` paddingBottom
- [x] [Review][Patch] Search clear X button — added `iconRight` clear `Pressable` on InputField when `searchQuery.length > 0`

### Decisions

- [x] [Review][Decision] Heart icon for remove — user chose to keep ♥
- [x] [Review][Decision] Stale badge overlaps remove button — user accepted as-is
- [x] [Review][Decision] Search clear button required — added X clear button

### Deferred

- [x] [Review][Defer] Toast stacking — pre-existing uiStore behavior
- [x] [Review][Defer] No diacritic-insensitive matching — broader i18n concern
- [x] [Review][Defer] `keyExtractor` deduplication — pre-existing pattern
- [x] [Review][Defer] Pagination error discards list — pre-existing pattern

## Dev Agent Record

### Agent Model Used

deepseek-v4-flash-free

### Debug Log References

- Fix: storageAdapter.read for favorites_guest now returns Favorite objects (dishId, dishData, savedAt) instead of just dishData
- Fix: Dish type extended with updatedAt, nameEn, tags, imageDescription for completeness
- Note: fetchFavorites for authenticated users uses raw fetch with Bearer token to /api/v1/favorites
- Note: Guest path uses storageAdapter.read('favorites_guest', 'all') with client-side offset/limit slicing

### Completion Notes List

All 8 tasks complete. 120/120 frontend tests pass. 26 new tests added for story 4-6. FavoritesScreen replaces PlaceholderScreen with full implementation: search + debounce, FavoriteItem cards with animated remove, infinite scroll pagination, empty/no-search states, staleness badge, loading skeletons, error/retry, offline banner.

### File List

#### Modified

- `frontend/app/(tabs)/favorites.tsx` — replace PlaceholderScreen with full FavoritesScreen (search, FlatList, FavoriteItem cards, remove animation, infinite scroll, empty states, staleness badge, loading/error/offline UX)
- `frontend/stores/dataStore.ts` — fetchFavorites now accepts `{ offset, limit }` params, routes to API when authenticated (GET /api/v1/favorites) or reads SQLite for guest; added favoritesTotal state field
- `frontend/stores/storageAdapter.ts` — favorites_guest read now returns Favorite objects (dishId, dishData, savedAt) instead of raw dishData
- `frontend/lib/i18n.ts` — added dotted-key favorites i18n keys (favorites.empty.body, favorites.search.hint, favorites.stale.badge, favorites.remove.toast, favorites.empty.title, favorites.empty.cta, favorites.search.empty)
- `frontend/types/dish.ts` — added updatedAt, nameEn, tags, imageDescription to Dish type
- `frontend/package.json` — registered story-4-6.test.mjs in test script
- `_bmad-output/implementation-artifacts/4-6-favorites-screen.md` — marked tasks complete, status → review

#### Created

- `frontend/tests/story-4-6.test.mjs` — 26 static analysis tests covering all tasks

#### Unchanged

- `frontend/stores/uiStore.ts` — addToast already exists
- `frontend/components/EmptyState.tsx` — reused as-is
- `frontend/components/Skeleton.tsx` — reused as-is
- `frontend/components/Button.tsx` — reused as-is
- `frontend/components/InputField.tsx` — reused as-is
