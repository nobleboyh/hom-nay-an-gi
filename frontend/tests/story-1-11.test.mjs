import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

import ts from 'typescript';

const frontendRoot = fileURLToPath(new URL('..', import.meta.url));
const resolveFromFrontend = (...segments) => path.join(frontendRoot, ...segments);

function loadMonitoringModule({ platform, env, sentryModule, warnings = [] }) {
  const source = fs.readFileSync(resolveFromFrontend('lib/monitoring.ts'), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;

  const module = { exports: {} };
  const context = {
    module,
    exports: module.exports,
    process: { env: { ...env } },
    console: {
      warn: message => warnings.push(String(message)),
    },
    require: specifier => {
      if (specifier === 'react-native') {
        return { Platform: { OS: platform } };
      }

      if (specifier === 'sentry-expo') {
        return sentryModule;
      }

      throw new Error(`Unexpected require: ${specifier}`);
    },
  };

  vm.runInNewContext(compiled, context, { filename: 'monitoring.js' });
  return module.exports;
}

test('monitoring adapter exists and documents the temporary compatibility decision', () => {
  const source = fs.readFileSync(resolveFromFrontend('lib/monitoring.ts'), 'utf8');
  assert.match(source, /Expo SDK 54/i);
  assert.match(source, /compatib/i);
  assert.match(source, /SENTRY_DSN/);
});

test('monitoring adapter exposes safe init and capture functions', () => {
  const source = fs.readFileSync(resolveFromFrontend('lib/monitoring.ts'), 'utf8');
  assert.match(source, /export function initMonitoring/);
  assert.match(source, /export function captureMonitoringException/);
  assert.match(source, /export function prepareMonitoringException/);
});

test('monitoring adapter fails closed on web even with a configured DSN', () => {
  const sentryModule = {
    init() {
      throw new Error('should not init on web');
    },
  };
  const warnings = [];
  const monitoring = loadMonitoringModule({
    platform: 'web',
    env: { SENTRY_DSN: 'https://example@sentry.io/123', NODE_ENV: 'production' },
    sentryModule,
    warnings,
  });

  const state = monitoring.initMonitoring();

  assert.equal(state.enabled, false);
  assert.match(state.reason, /temporarily disabled/i);
  assert.equal(warnings.length, 1);
});

test('monitoring adapter initializes Sentry on supported platforms with a valid DSN', () => {
  const calls = [];
  const sentryModule = {
    init(config) {
      calls.push(['init', config]);
    },
    Native: {
      captureException(error, context) {
        calls.push(['capture', error, context]);
      },
    },
  };
  const monitoring = loadMonitoringModule({
    platform: 'ios',
    env: { SENTRY_DSN: 'https://example@sentry.io/123', NODE_ENV: 'production' },
    sentryModule,
  });

  const state = monitoring.initMonitoring();
  const error = new Error('boom');
  monitoring.prepareMonitoringException(error);
  monitoring.captureMonitoringException(error, { extra: { screen: 'layout' } });

  assert.equal(state.enabled, true);
  assert.equal(calls[0][0], 'init');
  assert.equal(calls[0][1].dsn, 'https://example@sentry.io/123');
  assert.equal(calls[0][1].enableInExpoDevelopment, false);
  assert.equal(calls[0][1].debug, false);
  assert.equal(calls[0][1].tracesSampleRate, 0.1);
  assert.equal(calls[1][0], 'capture');
  assert.equal(calls[1][2].extra.screen, 'layout');
  assert.equal(calls[1][2].extra.preparedBeforeFallback, true);
});

test('monitoring adapter fails closed outside production even with a configured DSN', () => {
  const calls = [];
  const sentryModule = {
    init() {
      calls.push('init');
    },
  };
  const warnings = [];
  const monitoring = loadMonitoringModule({
    platform: 'ios',
    env: { SENTRY_DSN: 'https://example@sentry.io/123', NODE_ENV: 'development' },
    sentryModule,
    warnings,
  });

  const state = monitoring.initMonitoring();

  assert.equal(state.enabled, false);
  assert.match(state.reason, /outside production builds/i);
  assert.equal(calls.length, 0);
  assert.equal(warnings.length, 1);
});

test('monitoring adapter fails closed when init throws', () => {
  const warnings = [];
  const monitoring = loadMonitoringModule({
    platform: 'ios',
    env: { SENTRY_DSN: 'https://example@sentry.io/123', NODE_ENV: 'production' },
    sentryModule: {
      init() {
        throw new Error('init boom');
      },
      Native: {
        captureException() {},
      },
    },
    warnings,
  });

  const state = monitoring.initMonitoring();

  assert.equal(state.enabled, false);
  assert.match(state.reason, /could not be initialized safely/i);
  assert.equal(warnings.length, 1);
});

test('monitoring adapter fails closed when capture throws', () => {
  const warnings = [];
  const monitoring = loadMonitoringModule({
    platform: 'ios',
    env: { SENTRY_DSN: 'https://example@sentry.io/123', NODE_ENV: 'production' },
    sentryModule: {
      init() {},
      Native: {
        captureException() {
          throw new Error('capture boom');
        },
      },
    },
    warnings,
  });

  monitoring.initMonitoring();
  const error = new Error('boom');
  monitoring.prepareMonitoringException(error);
  assert.doesNotThrow(() =>
    monitoring.captureMonitoringException(error, { extra: { componentStack: 'Stack' } }),
  );
  assert.equal(warnings.length, 1);
});

test('root layout does not import the incompatible monitoring package directly', () => {
  const source = fs.readFileSync(resolveFromFrontend('app/_layout.tsx'), 'utf8');
  assert.doesNotMatch(source, /sentry-expo/);
});

test('ErrorBoundary reports in getDerivedStateFromError before fallback render state is returned', () => {
  const source = fs.readFileSync(resolveFromFrontend('components/ErrorBoundary.tsx'), 'utf8');
  assert.match(source, /static getDerivedStateFromError/);
  const capturePos = source.indexOf('prepareMonitoringException(error)');
  const returnPos = source.indexOf('return { error };');
  assert.ok(capturePos > -1 && capturePos < returnPos);
});

test('ErrorBoundary forwards componentStack through the shared monitoring adapter', () => {
  const source = fs.readFileSync(resolveFromFrontend('components/ErrorBoundary.tsx'), 'utf8');
  assert.match(source, /componentStack: errorInfo\.componentStack/);
});
