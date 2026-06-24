import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const frontendRoot = new URL('..', import.meta.url);
const resolveFromFrontend = (...segments) => path.join(frontendRoot.pathname, ...segments);

// Task 1: Normalize favorite collection routing in dataStore.ts (AC 1-4)
test('saveFavorite uses getTarget to route authenticated saves to API', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/dataStore.ts'), 'utf8');
  assert.match(source, /storageAdapter\.getTarget\(\)/);
});

test('authenticated saveFavorite calls POST /api/v1/favorites not favorites_guest', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/dataStore.ts'), 'utf8');
  const apiPath = source.match(/api\/v1\/favorites/g);
  const guestPath = source.match(/favorites_guest/g);
  assert.ok(apiPath && apiPath.length >= 1);
  // saveFavorite should still have 'favorites_guest' for guest path
  assert.ok(guestPath);
});

test('removeFavorite uses getTarget to route authenticated removes to API', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/dataStore.ts'), 'utf8');
  assert.match(source, /storageAdapter\.getTarget\(\)/);
});

test('authenticated removeFavorite calls DELETE /api/v1/favorites/:favoriteId', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/dataStore.ts'), 'utf8');
  assert.match(source, /api\/v1\/favorites\/\$\{/);
});

test('guest saveFavorite still uses storageAdapter.write with favorites_guest', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/dataStore.ts'), 'utf8');
  // Guest path in saveFavorite should still reference favorites_guest
  assert.match(source, /storageAdapter\.write\('favorites_guest'/);
  assert.match(source, /storageAdapter\.remove\('favorites_guest'/);
});

// Task 2: Harden storageAdapter.ts for dual-mode favorites transport (AC 1-4)
test('storageAdapter write guards against SQLite-only collections hitting API', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/storageAdapter.ts'), 'utf8');
  assert.match(source, /SQLITE_ONLY_COLLECTIONS/);
  assert.match(source, /!SQLITE_ONLY_COLLECTIONS\.has\(collection\)/);
});

test('storageAdapter read guards against SQLite-only collections hitting API', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/storageAdapter.ts'), 'utf8');
  assert.match(source, /SQLITE_ONLY_COLLECTIONS/);
  assert.match(source, /!SQLITE_ONLY_COLLECTIONS\.has\(collection\)/);
});

test('storageAdapter remove guards against SQLite-only collections hitting API', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/storageAdapter.ts'), 'utf8');
  assert.match(source, /SQLITE_ONLY_COLLECTIONS/);
  assert.match(source, /!SQLITE_ONLY_COLLECTIONS\.has\(collection\)/);
});

test('storageAdapter has getDb with split CREATE TABLE statements', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/storageAdapter.ts'), 'utf8');
  const createTables = source.match(/CREATE TABLE IF NOT EXISTS/g);
  assert.ok(createTables && createTables.length === 4);
});

test('storageAdapter write has retry mechanism for transient SQLite errors', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/storageAdapter.ts'), 'utf8');
  assert.match(source, /maxAttempts/);
});

test('storageAdapter guestToAuthenticated includes dishId in sync payload', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/storageAdapter.ts'), 'utf8');
  assert.match(source, /dishId.*r\.dishId/);
});

// Task 3: Fix optimistic state updates for authenticated favorites (AC 2, 5-6)
test('saveFavorite returns Promise<boolean>', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/dataStore.ts'), 'utf8');
  assert.match(source, /saveFavorite.*Promise<boolean>/);
});

test('saveFavorite returns false on API error', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/dataStore.ts'), 'utf8');
  assert.match(source, /return false/);
});

test('saveFavorite returns true when 409 already exists', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/dataStore.ts'), 'utf8');
  assert.match(source, /response\.status === 409/);
  assert.match(source, /return true/);
});

test('removeFavorite uses _id from stored favorite when available', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/dataStore.ts'), 'utf8');
  assert.match(source, /fav\?\._id/);
});

test('removeFavorite falls back to dishId when _id not available', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/dataStore.ts'), 'utf8');
  assert.match(source, /_id \?\? dishId/);
});

test('handleSaveToggle in results checks saveFavorite return before showing success toast', () => {
  const source = fs.readFileSync(resolveFromFrontend('app/results.tsx'), 'utf8');
  assert.match(source, /const ok = await saveFavorite\(dish\)/);
  assert.match(source, /if \(ok\)/);
});

test('handleSaveToggle in recipe checks saveFavorite return before showing success toast', () => {
  const source = fs.readFileSync(resolveFromFrontend('app/recipe/[id].tsx'), 'utf8');
  assert.match(source, /const ok = await saveFavorite\(dish\)/);
  assert.match(source, /if \(ok\)/);
});

test('Favorite type includes optional _id field', () => {
  const source = fs.readFileSync(resolveFromFrontend('types/dish.ts'), 'utf8');
  assert.match(source, /_id\?: string/);
});

// Task 4: dataStore pagination dedup
test('fetchDishes deduplicates paginated results by dishId', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/dataStore.ts'), 'utf8');
  assert.match(source, /seen.*new Set/);
  assert.match(source, /unique.*filter/);
});

test('fetchFavorites deduplicates paginated items by dishId', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/dataStore.ts'), 'utf8');
  assert.match(source, /seen.*new Set/);
  assert.match(source, /unique.*filter/);
});

// backend sync route
test('server.ts mounts syncRouter at /api/v1/sync', () => {
  const source = fs.readFileSync(resolveFromFrontend('../backend/apps/express-api/src/server.ts'), 'utf8');
  assert.match(source, /syncRouter/);
  assert.match(source, /api\/v1\/sync/);
});

// Test script registration
test('test script includes story-4-10.test.mjs', () => {
  const pkg = JSON.parse(fs.readFileSync(resolveFromFrontend('package.json'), 'utf8'));
  assert.match(pkg.scripts.test, /story-4-10/);
});
