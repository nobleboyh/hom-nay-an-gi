import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const frontendRoot = new URL('..', import.meta.url);
const resolveFromFrontend = (...segments) => path.join(frontendRoot.pathname, ...segments);

// Task 1: Wire authStore.login() to real API
test('authStore login calls fetch, not stub', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/authStore.ts'), 'utf8');
  assert.match(source, /fetch\(/);
  assert.match(source, /api\/v1\/auth\/login/);
  assert.match(source, /LoginError/);
});

test('authStore exports LoginError class with typed error codes', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/authStore.ts'), 'utf8');
  assert.match(source, /export class LoginError/);
  assert.match(source, /AUTH_INVALID_CREDENTIALS/);
  assert.match(source, /RATE_LIMIT_EXCEEDED/);
  assert.match(source, /NETWORK_ERROR/);
  assert.match(source, /LoginErrorCode/);
});

test('authStore handles 401, 429, and network errors', () => {
  const source = fs.readFileSync(resolveFromFrontend('stores/authStore.ts'), 'utf8');
  assert.match(source, /AUTH_INVALID_CREDENTIALS/);
  assert.match(source, /RATE_LIMIT_EXCEEDED/);
  assert.match(source, /NETWORK_ERROR/);
  assert.match(source, /throw new LoginError/);
});

// User type
test('User type has email and authProvider fields', () => {
  const source = fs.readFileSync(resolveFromFrontend('types/user.ts'), 'utf8');
  assert.match(source, /email\??:/);
  assert.match(source, /authProvider\??:/);
});

// Task 2: profile.tsx conditional render
test('profile.tsx conditionally renders LoginScreen for guest', () => {
  const source = fs.readFileSync(resolveFromFrontend('app/(tabs)/profile.tsx'), 'utf8');
  assert.match(source, /LoginScreen/);
  assert.match(source, /authState.*guest/);
  assert.match(source, /authState.*loading/);
  assert.match(source, /initialize/);
});

test('profile.tsx imports LoginScreen from components', () => {
  const source = fs.readFileSync(resolveFromFrontend('app/(tabs)/profile.tsx'), 'utf8');
  assert.match(source, /from.*LoginScreen/);
});

// Task 3: LoginScreen component exists
test('LoginScreen component file exists and exports LoginScreen', () => {
  assert.ok(fs.existsSync(resolveFromFrontend('components/LoginScreen.tsx')));
  const source = fs.readFileSync(resolveFromFrontend('components/LoginScreen.tsx'), 'utf8');
  assert.match(source, /export function LoginScreen/);
});

test('LoginScreen imports required components and hooks', () => {
  const source = fs.readFileSync(resolveFromFrontend('components/LoginScreen.tsx'), 'utf8');
  assert.match(source, /BenefitsCard/);
  assert.match(source, /Button/);
  assert.match(source, /InputField/);
  assert.match(source, /useAuthStore/);
  assert.match(source, /useUIStore/);
  assert.match(source, /useNetworkStatus/);
  assert.match(source, /t\(/);
});

// Task 4-6: Guest / register / error state handlers
test('LoginScreen has guest flow handler', () => {
  const source = fs.readFileSync(resolveFromFrontend('components/LoginScreen.tsx'), 'utf8');
  assert.match(source, /handleGuest/);
  assert.match(source, /guest\.continue/);
  assert.match(source, /router\.replace\(/);
});

test('LoginScreen has register link handler', () => {
  const source = fs.readFileSync(resolveFromFrontend('components/LoginScreen.tsx'), 'utf8');
  assert.match(source, /handleRegister/);
  assert.match(source, /router\.push\(.*register/);
});

test('LoginScreen handles login error states', () => {
  const source = fs.readFileSync(resolveFromFrontend('components/LoginScreen.tsx'), 'utf8');
  assert.match(source, /AUTH_INVALID_CREDENTIALS/);
  assert.match(source, /RATE_LIMIT_EXCEEDED/);
  assert.match(source, /NETWORK_ERROR/);
  assert.match(source, /errorMessage/);
  assert.match(source, /setErrorMessage/);
});

test('LoginScreen has loading and rate-limit states', () => {
  const source = fs.readFileSync(resolveFromFrontend('components/LoginScreen.tsx'), 'utf8');
  assert.match(source, /loading/);
  assert.match(source, /isRateLimited/);
  assert.match(source, /buttonDisabled/);
});

// Task 7: i18n usage
test('LoginScreen uses t() for all user-facing strings', () => {
  const source = fs.readFileSync(resolveFromFrontend('components/LoginScreen.tsx'), 'utf8');
  assert.match(source, /t\('app\.title'\)/);
  assert.match(source, /t\('benefits\.title'\)/);
  assert.match(source, /t\('login\.email'\)/);
  assert.match(source, /t\('login\.password'\)/);
  assert.match(source, /t\('login\.submit'\)/);
  assert.match(source, /t\('login\.continueAsGuest'\)/);
  assert.match(source, /t\('login\.register'\)/);
  assert.match(source, /t\('login\.missingFields'\)/);
  assert.match(source, /t\('login\.invalidCredentials'\)/);
  assert.match(source, /t\('login\.rateLimited'\)/);
  assert.match(source, /t\('login\.offline'\)/);
  assert.match(source, /t\('guest\.continue'\)/);
  assert.match(source, /t\('benefits\.sync'\)/);
  assert.match(source, /t\('benefits\.recommendations'\)/);
  assert.match(source, /t\('benefits\.shoppingLists'\)/);
});

// Task 8: Accessibility
test('LoginScreen has required accessibility roles', () => {
  const source = fs.readFileSync(resolveFromFrontend('components/LoginScreen.tsx'), 'utf8');
  assert.match(source, /accessibilityRole="header"/);
  assert.match(source, /accessibilityLiveRegion="polite"/);
  assert.match(source, /accessibilityRole="link"/);
  assert.doesNotMatch(source, /accessibilityRole="complementary"/);
});

test('LoginScreen input fields have accessibilityLabel', () => {
  const source = fs.readFileSync(resolveFromFrontend('components/LoginScreen.tsx'), 'utf8');
  assert.match(source, /accessibilityLabel=\{t\('login\.email'\)\}/);
  assert.match(source, /accessibilityLabel=\{t\('login\.password'\)\}/);
});



// Profile shows greeting for authenticated state
test('profile.tsx has authenticated state UI with greeting', () => {
  const source = fs.readFileSync(resolveFromFrontend('app/(tabs)/profile.tsx'), 'utf8');
  assert.match(source, /settings\.greeting/);
  assert.match(source, /PlaceholderAvatar/);
});

// Ensure test script registration
test('test script includes story-4-2.test.mjs', () => {
  const pkg = JSON.parse(fs.readFileSync(resolveFromFrontend('package.json'), 'utf8'));
  assert.match(pkg.scripts.test, /story-4-2/);
});
