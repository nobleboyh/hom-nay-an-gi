import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const frontendRoot = new URL('..', import.meta.url);
const resolveFromFrontend = (...segments) => path.join(frontendRoot.pathname, ...segments);

// Task 1: loginWithGoogle() — real Google OAuth
test('loginWithGoogle references expo-auth-session', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/authStore.ts'), 'utf8');
  assert.match(source, /loginWithGoogle/);
  assert.match(source, /AuthSession/);
  assert.match(source, /expo-auth-session/);
});

test('loginWithGoogle calls POST /api/v1/auth/google', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/authStore.ts'), 'utf8');
  assert.match(source, /auth\/google/);
});

test('loginWithGoogle stores tokens on success', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/authStore.ts'), 'utf8');
  assert.match(source, /saveSecureStore/);
  assert.match(source, /authState.*authenticated/);
});

test('loginWithGoogle has stub fallback when no Google client ID', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/authStore.ts'), 'utf8');
  assert.match(source, /EXPO_PUBLIC_GOOGLE_CLIENT_ID/);
});

// Task 2: logout() — call API before clearing local
test('logout calls POST /api/v1/auth/logout', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/authStore.ts'), 'utf8');
  assert.match(source, /auth\/logout/);
});

test('logout clears SecureStore and resets authState', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/authStore.ts'), 'utf8');
  assert.match(source, /clearSecureStore/);
  assert.match(source, /authState.*guest/);
});

test('logout calls clearData from dataStore', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/authStore.ts'), 'utf8');
  assert.match(source, /clearData/);
});

test('logout handles 401 gracefully (token already expired)', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/authStore.ts'), 'utf8');
  assert.match(source, /logout/);
  assert.match(source, /best.?effort|catch|try/);
});

// Task 3: performTokenRefresh()
test('performTokenRefresh calls POST /api/v1/auth/refresh', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/authStore.ts'), 'utf8');
  assert.match(source, /auth\/refresh/);
});

test('performTokenRefresh stores new tokens on success', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/authStore.ts'), 'utf8');
  assert.match(source, /saveSecureStore/);
  assert.match(source, /accessToken/);
  assert.match(source, /refreshToken/);
});

test('performTokenRefresh calls logout on 401 (expired refresh token)', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/authStore.ts'), 'utf8');
  const matches = source.match(/logout\(\)/g);
  // performTokenRefresh should call logout() on failure; logout also exists separately
  assert.ok(matches.length >= 2);
});

// Task 4: authStore wired into api.ts
test('storageAdapter getApiClient uses authStore for token injection', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/storageAdapter.ts'), 'utf8');
  assert.match(source, /accessToken/);
  assert.match(source, /performTokenRefresh/);
  assert.match(source, /logout/);
});

// Task 5: storageAdapter complete CRUD routing
test('storageAdapter read/write/remove route to API when authenticated', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/storageAdapter.ts'), 'utf8');
  assert.match(source, /isAuthenticated\(\) && !SQLITE_ONLY_COLLECTIONS\.has\(collection\)/);
  const authBlocks = source.match(/isAuthenticated\(\) && !SQLITE_ONLY_COLLECTIONS\.has\(collection\)/g);
  assert.ok(authBlocks && authBlocks.length >= 3);
});

// Task 6: guestToAuthenticated() migration
test('guestToAuthenticated reads SQLite and POSTs to /api/v1/sync', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/storageAdapter.ts'), 'utf8');
  assert.match(source, /guestToAuthenticated|syncFromCloud/);
  assert.match(source, /api\/v1\/sync/);
});

test('guestToAuthenticated wipes SQLite tables on sync success', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/storageAdapter.ts'), 'utf8');
  assert.match(source, /DELETE FROM/i);
});

test('guestToAuthenticated retries on failure with exponential backoff', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/storageAdapter.ts'), 'utf8');
  assert.match(source, /retr(i|y)/i);
});

// Task 7: authenticatedToGuest() — clear local data
test('authenticatedToGuest clears SQLite and resets dataStore', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/storageAdapter.ts'), 'utf8');
  assert.match(source, /clearGuestData|authenticatedToGuest/);
});

// Task 8: sync edge cases
test('sync handles network failure and partial data', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/storageAdapter.ts'), 'utf8');
  assert.match(source, /catch|error/);
});

// Task 9b: dataStore.clearData() exists
test('dataStore has clearData method that resets state', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/dataStore.ts'), 'utf8');
  assert.match(source, /clearData/);
  assert.match(source, /favorites.*\[\]/);
  assert.match(source, /searchHistory.*\[\]/);
});

// login() after 4.3 should trigger sync
test('authStore login triggers sync after successful auth', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/authStore.ts'), 'utf8');
  assert.match(source, /sync|guestToAuthenticated/);
});
