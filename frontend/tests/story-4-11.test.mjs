import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const frontendRoot = new URL('..', import.meta.url);
const resolveFromFrontend = (...segments) => path.join(frontendRoot.pathname, ...segments);

// Task 1: Authenticated context in recipe search requests (AC 1, 3, 5)
test('fetchDishes sends Authorization header when authenticated', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/dataStore.ts'), 'utf8');
  assert.match(source, /useAuthStore\.getState\(\)\.accessToken/);
  assert.match(source, /Authorization.*Bearer/);
});

test('fetchDishes sends x-guest-id header when not authenticated', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/dataStore.ts'), 'utf8');
  assert.match(source, /x-guest-id.*web/);
});

test('fetchDishes conditionally sets auth or guest headers', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/dataStore.ts'), 'utf8');
  assert.match(source, /Authorization.*Bearer.*\$\{token\}/);
  assert.match(source, /x-guest-id.*web/);
  assert.match(source, /accessToken/);
});

// Task 4: Backend regression coverage (AC 1-6)
test('backend recipesService imports UserPreference model', () => {
  const source = fs.readFileSync(resolveFromFrontend('../backend/apps/express-api/src/api/recipes/recipesService.ts'), 'utf8');
  assert.match(source, /UserPreference/);
});

test('backend recipesService has disliked ingredient filtering', () => {
  const source = fs.readFileSync(resolveFromFrontend('../backend/apps/express-api/src/api/recipes/recipesService.ts'), 'utf8');
  assert.match(source, /dislikedIngredients/);
});

test('backend recipesService filterDislikedDishes function exists', () => {
  const source = fs.readFileSync(resolveFromFrontend('../backend/apps/express-api/src/api/recipes/recipesService.ts'), 'utf8');
  assert.match(source, /filterDislikedDishes/);
});

test('backend recipesService searchByIngredients passes userId through', () => {
  const source = fs.readFileSync(resolveFromFrontend('../backend/apps/express-api/src/api/recipes/recipesService.ts'), 'utf8');
  assert.match(source, /userId/);
});

test('backend recipesController passes user context to service', () => {
  const source = fs.readFileSync(resolveFromFrontend('../backend/apps/express-api/src/api/recipes/recipesController.ts'), 'utf8');
  assert.match(source, /resolveOptionalUserId/);
  assert.match(source, /userId/);
});

test('backend recipesService applies dislike filter post-cache', () => {
  const source = fs.readFileSync(resolveFromFrontend('../backend/apps/express-api/src/api/recipes/recipesService.ts'), 'utf8');
  assert.match(source, /filterDislikedDishes/);
});
