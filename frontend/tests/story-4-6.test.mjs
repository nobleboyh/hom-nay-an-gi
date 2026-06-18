import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const frontendRoot = new URL('..', import.meta.url);
const resolveFromFrontend = (...segments) => path.join(frontendRoot.pathname, ...segments);

// Task 1: FavoritesScreen exports default function component
test('favorites.tsx exports default function component', () => {
  const source = fs.readFileSync(resolveFromFrontend('app/(tabs)/favorites.tsx'), 'utf8');
  assert.match(source, /export default function FavoritesScreen/);
});

test('favorites.tsx imports required hooks and stores', () => {
  const source = fs.readFileSync(resolveFromFrontend('app/(tabs)/favorites.tsx'), 'utf8');
  assert.match(source, /useDataStore/);
  assert.match(source, /useUIStore/);
  assert.match(source, /useNetworkStatus/);
  assert.match(source, /useRouter/);
});

test('favorites.tsx imports required components', () => {
  const source = fs.readFileSync(resolveFromFrontend('app/(tabs)/favorites.tsx'), 'utf8');
  assert.match(source, /FlatList/);
  assert.match(source, /Animated/);
  assert.match(source, /EmptyState/);
  assert.match(source, /InputField/);
  assert.match(source, /Skeleton/);
  assert.match(source, /Toast/);
});

test('favorites.tsx imports design tokens', () => {
  const source = fs.readFileSync(resolveFromFrontend('app/(tabs)/favorites.tsx'), 'utf8');
  assert.match(source, /from.*tokens/);
  assert.match(source, /Colors/);
  assert.match(source, /Spacing/);
  assert.match(source, /Typography/);
});

// Task 2: Search with debounce
test('favorites.tsx has searchQuery state and debounce', () => {
  const source = fs.readFileSync(resolveFromFrontend('app/(tabs)/favorites.tsx'), 'utf8');
  assert.match(source, /searchQuery/);
  assert.match(source, /debouncedQuery/);
  assert.match(source, /setTimeout/);
  assert.match(source, /clearTimeout/);
  assert.match(source, /300/);
});

test('favorites.tsx filters by name, nameEn, or cuisine', () => {
  const source = fs.readFileSync(resolveFromFrontend('app/(tabs)/favorites.tsx'), 'utf8');
  assert.match(source, /dishData\.name/);
  assert.match(source, /dishData\.nameEn/);
  assert.match(source, /dishData\.cuisine/);
  assert.match(source, /toLowerCase/);
});

// Task 3: FavoriteItem card with remove animation
test('favorites.tsx has remove animation with Animated.parallel', () => {
  const source = fs.readFileSync(resolveFromFrontend('app/(tabs)/favorites.tsx'), 'utf8');
  assert.match(source, /Animated\.parallel/);
  assert.match(source, /Animated\.timing/);
  assert.match(source, /scaleAnim/);
  assert.match(source, /opacityAnim/);
});

test('favorites.tsx remove button has accessibilityLabel', () => {
  const source = fs.readFileSync(resolveFromFrontend('app/(tabs)/favorites.tsx'), 'utf8');
  assert.match(source, /accessibilityLabel/);
  assert.match(source, /khỏi yêu thích/);
});

test('favorites.tsx remove button uses filled heart icon', () => {
  const source = fs.readFileSync(resolveFromFrontend('app/(tabs)/favorites.tsx'), 'utf8');
  assert.match(source, /♥/);
});

// Task 4: Infinite scroll pagination
test('favorites.tsx uses onEndReached for infinite scroll', () => {
  const source = fs.readFileSync(resolveFromFrontend('app/(tabs)/favorites.tsx'), 'utf8');
  assert.match(source, /onEndReached/);
  assert.match(source, /onEndReachedThreshold/);
  assert.match(source, /0\.5/);
});

test('favorites.tsx calls fetchFavorites with offset and limit', () => {
  const source = fs.readFileSync(resolveFromFrontend('app/(tabs)/favorites.tsx'), 'utf8');
  assert.match(source, /fetchFavorites/);
  assert.match(source, /offset/);
  assert.match(source, /limit/);
});

test('favorites.tsx shows ActivityIndicator at bottom while loading more', () => {
  const source = fs.readFileSync(resolveFromFrontend('app/(tabs)/favorites.tsx'), 'utf8');
  assert.match(source, /ActivityIndicator/);
  assert.match(source, /footerLoader/);
  assert.match(source, /ListFooterComponent/);
});

// Task 5: Empty states
test('favorites.tsx has no-favorites empty state', () => {
  const source = fs.readFileSync(resolveFromFrontend('app/(tabs)/favorites.tsx'), 'utf8');
  assert.match(source, /NoFavoritesEmptyState|Chưa có món|favorites\.empty/);
});

test('favorites.tsx has no-search-matches empty state', () => {
  const source = fs.readFileSync(resolveFromFrontend('app/(tabs)/favorites.tsx'), 'utf8');
  assert.match(source, /NoSearchEmptyState|Không tìm thấy|favorites\.search/);
});

test('favorites.tsx empty CTA navigates to discover tab', () => {
  const source = fs.readFileSync(resolveFromFrontend('app/(tabs)/favorites.tsx'), 'utf8');
  assert.match(source, /discover/);
  assert.match(source, /router\.push/);
});

// Task 6: Staleness indicator
test('favorites.tsx checks dishData.updatedAt vs savedAt', () => {
  const source = fs.readFileSync(resolveFromFrontend('app/(tabs)/favorites.tsx'), 'utf8');
  assert.match(source, /dishData\.updatedAt/);
  assert.match(source, /savedAt/);
});

test('favorites.tsx shows stale badge when dishData.updatedAt > savedAt', () => {
  const source = fs.readFileSync(resolveFromFrontend('app/(tabs)/favorites.tsx'), 'utf8');
  assert.match(source, /staleBadge/);
  assert.match(source, /favorites\.stale/);
});

// Task 7: UX states
test('favorites.tsx shows skeleton cards while loading', () => {
  const source = fs.readFileSync(resolveFromFrontend('app/(tabs)/favorites.tsx'), 'utf8');
  assert.match(source, /SkeletonCard/);
  assert.match(source, /Skeleton/);
});

test('favorites.tsx handles error state with retry button', () => {
  const source = fs.readFileSync(resolveFromFrontend('app/(tabs)/favorites.tsx'), 'utf8');
  assert.match(source, /error/);
  assert.match(source, /retry|Thử lại/);
  assert.match(source, /handleRetry/);
});

test('favorites.tsx shows offline banner', () => {
  const source = fs.readFileSync(resolveFromFrontend('app/(tabs)/favorites.tsx'), 'utf8');
  assert.match(source, /isOnline|offlineBanner/);
  assert.match(source, /state\.offline/);
});

// dataStore changes
test('dataStore fetchFavorites accepts offset and limit params', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/dataStore.ts'), 'utf8');
  assert.match(source, /fetchFavorites.*opts/);
  assert.match(source, /offset/);
  assert.match(source, /limit/);
});

test('dataStore fetchFavorites routes to API when authenticated', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/dataStore.ts'), 'utf8');
  assert.match(source, /api\/v1\/favorites/);
  assert.match(source, /Authorization.*Bearer/);
});

test('dataStore has favoritesTotal field', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/dataStore.ts'), 'utf8');
  assert.match(source, /favoritesTotal/);
});

// storageAdapter changes
test('storageAdapter read favorites includes dishId and savedAt', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/storageAdapter.ts'), 'utf8');
  assert.match(source, /dishId.*dishData.*savedAt/);
});

// i18n keys
test('i18n has favorites stale badge key', () => {
  const source = fs.readFileSync(resolveFromFrontend('lib/i18n.ts'), 'utf8');
  assert.match(source, /favorites\.stale\.badge/);
  assert.match(source, /favorites\.empty\.body/);
  assert.match(source, /favorites\.search\.hint/);
});

// Dish type has updatedAt
test('Dish type includes updatedAt field', () => {
  const source = fs.readFileSync(resolveFromFrontend('types/dish.ts'), 'utf8');
  assert.match(source, /updatedAt/);
});

// Test script registration
test('test script includes story-4-6.test.mjs', () => {
  const pkg = JSON.parse(fs.readFileSync(resolveFromFrontend('package.json'), 'utf8'));
  assert.match(pkg.scripts.test, /story-4-6/);
});
