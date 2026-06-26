import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendRoot = fileURLToPath(new URL('..', import.meta.url));
const resolveFromFrontend = (...segments) => path.join(frontendRoot, ...segments);

// Task 1: app config preserves supported plugins and removes the incompatible runtime plugin
test('app.json does not enable the incompatible sentry-expo plugin', () => {
  const appJson = JSON.parse(fs.readFileSync(resolveFromFrontend('app.json'), 'utf8'));
  const plugins = appJson.expo.plugins.map(p => typeof p === 'string' ? p : p[0]);
  assert.ok(!plugins.includes('sentry-expo'), 'app.json should not include sentry-expo');
});

test('app.json preserves existing plugins', () => {
  const appJson = JSON.parse(fs.readFileSync(resolveFromFrontend('app.json'), 'utf8'));
  const plugins = appJson.expo.plugins.map(p => typeof p === 'string' ? p : p[0]);
  assert.ok(plugins.includes('expo-router'), 'expo-router plugin preserved');
  assert.ok(plugins.includes('expo-sqlite'), 'expo-sqlite plugin preserved');
  assert.ok(plugins.includes('expo-secure-store'), 'expo-secure-store plugin preserved');
});

// Task 2: monitoring bootstrap is routed through the shared adapter
test('_layout.tsx uses the shared monitoring adapter instead of sentry-expo', () => {
  const source = fs.readFileSync(resolveFromFrontend('app/_layout.tsx'), 'utf8');
  assert.doesNotMatch(source, /sentry-expo/);
  assert.match(source, /initMonitoring/);
});

test('_layout.tsx keeps SENTRY_DSN-gated bootstrap semantics through the adapter', () => {
  const source = fs.readFileSync(resolveFromFrontend('app/_layout.tsx'), 'utf8');
  assert.match(source, /initMonitoring\(\)/);
});

test('_layout.tsx preserves existing layout structure', () => {
  const source = fs.readFileSync(resolveFromFrontend('app/_layout.tsx'), 'utf8');
  assert.match(source, /SafeAreaProvider/);
  assert.match(source, /NetworkStatusProvider/);
  assert.match(source, /ErrorBoundary/);
  assert.match(source, /StatusBar/);
  assert.match(source, /Stack/);
});

// Task 3: ErrorBoundary wiring
test('ErrorBoundary reports through the monitoring adapter', () => {
  const source = fs.readFileSync(resolveFromFrontend('components/ErrorBoundary.tsx'), 'utf8');
  assert.doesNotMatch(source, /sentry-expo/);
  assert.match(source, /captureMonitoringException/);
  assert.match(source, /prepareMonitoringException/);
});

test('ErrorBoundary captures through the adapter before returning fallback state', () => {
  const source = fs.readFileSync(resolveFromFrontend('components/ErrorBoundary.tsx'), 'utf8');
  const capturePos = source.indexOf('prepareMonitoringException(error)');
  const returnPos = source.indexOf('return { error };');
  assert.ok(capturePos > -1 && capturePos < returnPos, 'capture should happen before fallback state is returned');
});

test('ErrorBoundary preserves fallback UI and reset button', () => {
  const source = fs.readFileSync(resolveFromFrontend('components/ErrorBoundary.tsx'), 'utf8');
  assert.match(source, /Đã xảy ra lỗi giao diện/);
  assert.match(source, /Thử lại/);
  assert.match(source, /getDerivedStateFromError/);
  assert.match(source, /this\.reset/);
});

// Task 5: .env.template
test('.env.template has SENTRY_DSN with documentation link', () => {
  const envTemplate = fs.readFileSync(resolveFromFrontend('.env.template'), 'utf8');
  assert.match(envTemplate, /SENTRY_DSN=replace-with-your-sentry-dsn/);
  assert.match(envTemplate, /sentry\.io/);
});

test('.env.template preserves existing entries', () => {
  const envTemplate = fs.readFileSync(resolveFromFrontend('.env.template'), 'utf8');
  assert.match(envTemplate, /API_BASE_URL=http:\/\/localhost:8080/);
  assert.match(envTemplate, /GOOGLE_CLIENT_ID=replace-with-your-google-client-id/);
});

// Regression
test('test script includes story-1-10.test.mjs', () => {
  const pkg = JSON.parse(fs.readFileSync(resolveFromFrontend('package.json'), 'utf8'));
  assert.match(pkg.scripts.test, /story-1-10\.test\.mjs/);
});

test('test script includes story-1-11.test.mjs', () => {
  const pkg = JSON.parse(fs.readFileSync(resolveFromFrontend('package.json'), 'utf8'));
  assert.match(pkg.scripts.test, /story-1-11\.test\.mjs/);
});
