import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const frontendRoot = new URL('..', import.meta.url);
const resolveFromFrontend = (...segments) => path.join(frontendRoot.pathname, ...segments);
const requireFromFrontend = createRequire(import.meta.url);

function read(relativePath) {
  return fs.readFileSync(resolveFromFrontend(relativePath), 'utf8');
}

test('shared API env resolver exists and reads Expo config bridge', () => {
  const source = read('lib/env.ts');
  assert.match(source, /expo-constants/i);
  assert.match(source, /extra/);
  assert.match(source, /API_BASE_URL/);
  assert.match(source, /resolveApiBaseUrl/);
});

test('shared resolver defines explicit missing, invalid, and unsafe config messages', () => {
  const source = read('lib/env.ts');
  assert.match(source, /Missing API_BASE_URL Expo config bridge/);
  assert.match(source, /Invalid API_BASE_URL/);
  assert.match(source, /Unsafe API_BASE_URL for Expo runtime/);
});

test('Expo config bridge exposes canonical API_BASE_URL via extra.apiBaseUrl', () => {
  const source = read('app.config.ts');
  assert.match(source, /API_BASE_URL/);
  assert.match(source, /extra/);
  assert.match(source, /apiBaseUrl/);
});

test('public Expo config preserves apiBaseUrl when API_BASE_URL is provided', () => {
  const previousValue = process.env.API_BASE_URL;
  process.env.API_BASE_URL = 'http://172.20.10.2:8080';

  try {
    const { getConfig } = requireFromFrontend('@expo/config');
    const config = getConfig(resolveFromFrontend(), {
      isPublicConfig: true,
      skipSDKVersionRequirement: true,
    });

    assert.equal(config.exp.extra?.apiBaseUrl, 'http://172.20.10.2:8080');
  } finally {
    if (previousValue === undefined) {
      delete process.env.API_BASE_URL;
    } else {
      process.env.API_BASE_URL = previousValue;
    }
  }
});

test('frontend runtime code no longer reads API_BASE_URL env vars directly', () => {
  const files = [
    'app/(tabs)/discover.tsx',
    'stores/storageAdapter.ts',
    'stores/dataStore.ts',
    'stores/authStore.ts',
    'app/(tabs)/profile.tsx',
  ];

  for (const file of files) {
    const source = read(file);
    assert.doesNotMatch(source, /process\.env\.API_BASE_URL/);
    assert.doesNotMatch(source, /process\.env\.EXPO_PUBLIC_API_BASE_URL/);
  }
});

test('shared resolver is used by discover, auth, storage, data, and profile paths', () => {
  const expectations = [
    ['app/(tabs)/discover.tsx', /resolveApiBaseUrl|getApiBaseUrlOrThrow/],
    ['stores/storageAdapter.ts', /resolveApiBaseUrl|getApiBaseUrlOrThrow/],
    ['stores/dataStore.ts', /resolveApiBaseUrl|getApiBaseUrlOrThrow/],
    ['stores/authStore.ts', /resolveApiBaseUrl|getApiBaseUrlOrThrow/],
    ['app/(tabs)/profile.tsx', /resolveApiBaseUrl|getApiBaseUrlOrThrow/],
  ];

  for (const [file, pattern] of expectations) {
    assert.match(read(file), pattern);
  }
});

test('unsafe localhost fallback is not used for Expo Go runtime flows', () => {
  const source = [
    read('app/(tabs)/discover.tsx'),
    read('stores/storageAdapter.ts'),
    read('stores/dataStore.ts'),
    read('stores/authStore.ts'),
    read('app/(tabs)/profile.tsx'),
  ].join('\n');

  assert.doesNotMatch(source, /http:\/\/localhost:8080/);
});

test('resolver includes explicit simulator gating for native localhost exceptions', () => {
  const source = read('lib/env.ts');
  assert.match(source, /Constants\.isDevice/);
  assert.match(source, /Platform\.OS === 'ios'/);
  assert.match(source, /10\.0\.2\.2/);
});

test('frontend env template and README document canonical Expo Go API_BASE_URL contract', () => {
  const envTemplate = read('.env.template');
  const readme = fs.readFileSync(resolveFromFrontend('../README.md'), 'utf8');

  assert.match(envTemplate, /API_BASE_URL=http:\/\/<LAN_IP>:8080/);
  assert.match(readme, /API_BASE_URL=http:\/\/<LAN_IP>:8080/);
  assert.match(readme, /:3000/);
  assert.match(readme, /:8080/);
});
