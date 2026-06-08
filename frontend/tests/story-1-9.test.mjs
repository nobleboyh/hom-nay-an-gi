import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const frontendRoot = new URL('..', import.meta.url);
const resolveFromFrontend = (...segments) => path.join(frontendRoot.pathname, ...segments);

// Task 2: CI workflows
test('ci-backend.yml exists and contains required steps', () => {
  const workflow = fs.readFileSync(
    resolveFromFrontend('..', '.github/workflows/ci-backend.yml'),
    'utf8',
  );
  assert.match(workflow, /pnpm typecheck/);
  assert.match(workflow, /pnpm lint/);
  assert.match(workflow, /pnpm test/);
  assert.match(workflow, /node-version:\s*22/);
  assert.match(workflow, /pnpm\/action-setup@v4/);
});

test('ci-frontend.yml exists and contains required steps', () => {
  const workflow = fs.readFileSync(
    resolveFromFrontend('..', '.github/workflows/ci-frontend.yml'),
    'utf8',
  );
  assert.match(workflow, /tsc --noEmit/);
  assert.match(workflow, /eslint app components lib types tests/);
  assert.match(workflow, /npm test/);
  assert.match(workflow, /node-version:\s*22/);
});

// Task 3: authStore
test('authStore exists and exports useAuthStore', () => {
  assert.ok(fs.existsSync(resolveFromFrontend('stores/authStore.ts')));
  const source = fs.readFileSync(resolveFromFrontend('stores/authStore.ts'), 'utf8');
  assert.match(source, /export const useAuthStore/);
  assert.ok(source.includes("'guest'") && source.includes("'authenticated'") && source.includes("'loading'"), 'authState includes guest/authenticated/loading');
  assert.match(source, /performTokenRefresh/);
});

test('authStore defines stub login, loginWithGoogle, logout, initialize', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/authStore.ts'), 'utf8');
  assert.match(source, /login.*async/);
  assert.match(source, /loginWithGoogle.*async/);
  assert.match(source, /logout.*async/);
  assert.match(source, /initialize.*async/);
  assert.match(source, /expo-secure-store/);
});

// Task 4: uiStore
test('uiStore exists and exports useUIStore', () => {
  assert.ok(fs.existsSync(resolveFromFrontend('stores/uiStore.ts')));
  const source = fs.readFileSync(resolveFromFrontend('stores/uiStore.ts'), 'utf8');
  assert.match(source, /export const useUIStore/);
  assert.ok(source.includes("'home'") && source.includes("'discover'") && source.includes("'favorites'") && source.includes("'profile'"), 'TabName includes home/discover/favorites/profile');
  assert.match(source, /setActiveTab/);
  assert.match(source, /toggleCard/);
  assert.match(source, /addToast/);
  assert.match(source, /dismissToast/);
  assert.match(source, /setLoading/);
  assert.match(source, /MAX_TOASTS/);
});

test('uiStore limits toast queue to 3', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/uiStore.ts'), 'utf8');
  assert.match(source, /toasts\.length > MAX_TOASTS/);
  assert.ok(
    source.includes('MAX_TOASTS = 3') ||
    source.includes('MAX_TOASTS=3'),
  );
});

// Task 5: dataStore
test('dataStore exists and exports useDataStore with frozen contract', () => {
  assert.ok(fs.existsSync(resolveFromFrontend('stores/dataStore.ts')));
  const source = fs.readFileSync(resolveFromFrontend('stores/dataStore.ts'), 'utf8');
  assert.match(source, /export const useDataStore/);
  assert.match(source, /DataStore Contract \(FROZEN for Epic 2\)/);
  assert.match(source, /fetchDishes/);
  assert.match(source, /fetchRecipeDetail/);
  assert.match(source, /fetchFavorites/);
  assert.match(source, /saveFavorite/);
  assert.match(source, /removeFavorite/);
  assert.match(source, /fetchDiscoverTrending/);
  assert.match(source, /fetchDiscoverNearby/);
  assert.match(source, /searchDishes/);
  assert.match(source, /clearSearchHistory/);
  assert.match(source, /syncPreferences/);
});

test('dataStore routes through storageAdapter, never directly calls api.ts', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/dataStore.ts'), 'utf8');
  assert.match(source, /from.*storageAdapter/);
  assert.doesNotMatch(source, /from.*lib\/api/);
  assert.doesNotMatch(source, /from.*expo-sqlite/);
});

// Task 6: storageAdapter
test('storageAdapter exists and is not a Zustand store', () => {
  assert.ok(fs.existsSync(resolveFromFrontend('stores/storageAdapter.ts')));
  const source = fs.readFileSync(resolveFromFrontend('stores/storageAdapter.ts'), 'utf8');
  assert.doesNotMatch(source, /create\(/);
  assert.doesNotMatch(source, /export const use/);
  assert.match(source, /export const storageAdapter/);
  assert.match(source, /isAuthenticated/);
});

test('storageAdapter has guest SQLite schema with 3 tables', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/storageAdapter.ts'), 'utf8');
  assert.match(source, /CREATE TABLE.*dishes_cache/);
  assert.match(source, /CREATE TABLE.*favorites_guest/);
  assert.match(source, /CREATE TABLE.*search_history_guest/);
});

// Task 7: networkStatus
test('networkStatus.tsx exists and exports NetworkStatusProvider and useNetworkStatus', () => {
  const source = fs.readFileSync(resolveFromFrontend('lib/networkStatus.tsx'), 'utf8');
  assert.match(source, /export function NetworkStatusProvider/);
  assert.match(source, /export function useNetworkStatus/);
  assert.match(source, /@react-native-community\/netinfo/);
  assert.match(source, /Mất kết nối/);
  assert.match(source, /Đã kết nối/);
});

test('networkStatus old stub getNetworkStatus is removed', () => {
  assert.ok(!fs.existsSync(resolveFromFrontend('lib/networkStatus.ts')), 'old .ts stub should be removed');
});

// Task 8: Layout wiring
test('_layout.tsx wraps with NetworkStatusProvider', () => {
  const source = fs.readFileSync(resolveFromFrontend('app/_layout.tsx'), 'utf8');
  assert.match(source, /NetworkStatusProvider/);
  assert.match(source, /SafeAreaProvider/);
  assert.match(source, /ErrorBoundary/);
});

test('tabs/_layout.tsx syncs active tab to uiStore', () => {
  const source = fs.readFileSync(resolveFromFrontend('app/(tabs)/_layout.tsx'), 'utf8');
  assert.match(source, /useUIStore/);
  assert.match(source, /setActiveTab/);
  assert.match(source, /tabNameMap/);
});

// Task 11: .env.template
test('.env.template has API_BASE_URL and GOOGLE_CLIENT_ID', () => {
  const envTemplate = fs.readFileSync(resolveFromFrontend('.env.template'), 'utf8');
  assert.match(envTemplate, /API_BASE_URL=http:\/\/localhost:8080/);
  assert.match(envTemplate, /GOOGLE_CLIENT_ID/);
});

// Regression: verify TabBar component is untouched and accessible
test('TabBar has untouched accessibility support', () => {
  const source = fs.readFileSync(resolveFromFrontend('components/TabBar.tsx'), 'utf8');
  assert.match(source, /accessibilityRole/);
  assert.match(source, /accessibilityState/);
  assert.match(source, /role="navigation"/);
});

// Dependencies
test('zustand is in dependencies', () => {
  const pkg = JSON.parse(fs.readFileSync(resolveFromFrontend('package.json'), 'utf8'));
  assert.ok(pkg.dependencies.zustand, 'zustand should be installed');
  assert.ok(pkg.dependencies['expo-sqlite'], 'expo-sqlite should be installed');
  assert.ok(pkg.dependencies['expo-secure-store'], 'expo-secure-store should be installed');
});

// Test script includes story 1.9
test('test script includes story-1-9.test.mjs', () => {
  const pkg = JSON.parse(fs.readFileSync(resolveFromFrontend('package.json'), 'utf8'));
  assert.match(pkg.scripts.test, /story-1-9\.test\.mjs/);
});
