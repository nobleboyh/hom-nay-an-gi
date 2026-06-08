import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const frontendRoot = new URL('..', import.meta.url);
const resolveFromFrontend = (...segments) => path.join(frontendRoot.pathname, ...segments);

// Task 1: sentry-expo dependency
test('sentry-expo is in package.json dependencies', () => {
  const pkg = JSON.parse(fs.readFileSync(resolveFromFrontend('package.json'), 'utf8'));
  assert.ok(pkg.dependencies['sentry-expo'], 'sentry-expo should be installed');
});

// Task 2: sentry-expo plugin in app.json
test('sentry-expo is in app.json plugins array', () => {
  const appJson = JSON.parse(fs.readFileSync(resolveFromFrontend('app.json'), 'utf8'));
  assert.ok(
    appJson.expo.plugins.includes('sentry-expo'),
    'app.json plugins should include sentry-expo',
  );
});

test('app.json preserves existing plugins', () => {
  const appJson = JSON.parse(fs.readFileSync(resolveFromFrontend('app.json'), 'utf8'));
  const plugins = appJson.expo.plugins.map(p => typeof p === 'string' ? p : p[0]);
  assert.ok(plugins.includes('expo-router'), 'expo-router plugin preserved');
  assert.ok(plugins.includes('expo-sqlite'), 'expo-sqlite plugin preserved');
  assert.ok(plugins.includes('expo-secure-store'), 'expo-secure-store plugin preserved');
});

// Task 3: Sentry.init in _layout.tsx
test('_layout.tsx calls Sentry.init at module level', () => {
  const source = fs.readFileSync(resolveFromFrontend('app/_layout.tsx'), 'utf8');
  assert.match(source, /import \* as Sentry from 'sentry-expo'/);
  assert.match(source, /Sentry\.init\(/);
});

test('Sentry.init config has enableInExpoDevelopment: false', () => {
  const source = fs.readFileSync(resolveFromFrontend('app/_layout.tsx'), 'utf8');
  assert.match(source, /enableInExpoDevelopment:\s*false/);
});

test('Sentry.init config has tracesSampleRate: 0.1', () => {
  const source = fs.readFileSync(resolveFromFrontend('app/_layout.tsx'), 'utf8');
  assert.match(source, /tracesSampleRate:\s*0\.1/);
});

test('_layout.tsx preserves existing layout structure', () => {
  const source = fs.readFileSync(resolveFromFrontend('app/_layout.tsx'), 'utf8');
  assert.match(source, /SafeAreaProvider/);
  assert.match(source, /NetworkStatusProvider/);
  assert.match(source, /ErrorBoundary/);
  assert.match(source, /StatusBar/);
  assert.match(source, /Stack/);
});

// Task 4: ErrorBoundary wiring
test('ErrorBoundary imports sentry-expo Browser namespace', () => {
  const source = fs.readFileSync(resolveFromFrontend('components/ErrorBoundary.tsx'), 'utf8');
  assert.match(source, /import.*Browser.*from 'sentry-expo'/);
});

test('ErrorBoundary componentDidCatch calls captureException before console.error', () => {
  const source = fs.readFileSync(resolveFromFrontend('components/ErrorBoundary.tsx'), 'utf8');
  assert.match(source, /captureException/);
  const capturePos = source.indexOf('captureException');
  const consolePos = source.indexOf("console.error('Route shell render failure'");
  assert.ok(capturePos < consolePos, 'captureException should be called BEFORE console.error');
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
