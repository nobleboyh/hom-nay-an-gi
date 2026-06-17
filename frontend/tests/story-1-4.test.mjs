import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const frontendRoot = fileURLToPath(new URL('..', import.meta.url));
const resolveFromFrontend = (...segments) => path.join(frontendRoot, ...segments);

function loadTypeScriptModule(relativePath, stubs = {}) {
  const filePath = resolveFromFrontend(relativePath);
  const source = fs.readFileSync(filePath, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: filePath,
  });

  const module = { exports: {} };
  const sandbox = {
    exports: module.exports,
    module,
    require: (specifier) => {
      if (specifier in stubs) {
        return stubs[specifier];
      }

      throw new Error(`Unsupported import in test harness: ${specifier}`);
    },
    __dirname: path.dirname(filePath),
    __filename: filePath,
    console,
    process,
    setTimeout,
    clearTimeout,
  };

  vm.runInNewContext(transpiled.outputText, sandbox, { filename: filePath });
  return module.exports;
}

test('story 1.4 package setup includes AsyncStorage support and a test script', () => {
  const packageJson = JSON.parse(fs.readFileSync(resolveFromFrontend('package.json'), 'utf8'));

  assert.ok(
    packageJson.dependencies['@react-native-async-storage/async-storage'],
    'AsyncStorage dependency should be present',
  );
  assert.equal(packageJson.main, 'expo-router/entry');
  assert.match(packageJson.scripts.test ?? '', /node --test/);
});

test('story 1.4 exports the required token groups and core semantic values', () => {
  const tokensModule = loadTypeScriptModule('lib/tokens.ts');

  assert.ok(tokensModule.Colors, 'Colors export should exist');
  assert.ok(tokensModule.Typography, 'Typography export should exist');
  assert.ok(tokensModule.Spacing, 'Spacing export should exist');
  assert.ok(tokensModule.Radius, 'Radius export should exist');
  assert.ok(tokensModule.Shadows, 'Shadows export should exist');
  assert.ok(tokensModule.ZIndex, 'ZIndex export should exist');
  assert.ok(tokensModule.Animation, 'Animation export should exist');
  assert.ok(tokensModule.accessibilityDefaults, 'accessibilityDefaults export should exist');
  assert.equal(tokensModule.Colors.accent, 'oklch(55% 0.18 35)');
  assert.equal(tokensModule.Colors.accentDim, 'oklch(55% 0.18 35 / 0.15)');
  assert.equal(tokensModule.Radius.full, 9999);
  assert.equal(tokensModule.ZIndex.toast, 200);
  assert.equal(tokensModule.Animation.duration.fast, 150);
  assert.equal(tokensModule.accessibilityDefaults.minimumTouchTarget, 44);
  assert.equal(typeof tokensModule.oklchToRgba, 'function');
});

test('story 1.4 translations stay in sync and home.searchButton resolves in both languages', async () => {
  const store = new Map();
  const asyncStorageStub = {
    async getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    async setItem(key, value) {
      store.set(key, value);
    },
  };

  const i18nModule = loadTypeScriptModule('lib/i18n.ts', {
    '@react-native-async-storage/async-storage': asyncStorageStub,
  });

  assert.ok(i18nModule.catalog.vi, 'Vietnamese catalog should exist');
  assert.ok(i18nModule.catalog.en, 'English catalog should exist');

  const viKeys = Object.keys(i18nModule.catalog.vi).sort();
  const enKeys = Object.keys(i18nModule.catalog.en).sort();

  assert.deepEqual(viKeys, enKeys, 'vi/en catalogs must have matching keys');
  assert.equal(i18nModule.getLanguage(), 'vi');
  assert.equal(i18nModule.t('home.searchButton'), 'Tìm món');

  await i18nModule.setLanguage('en');
  assert.equal(i18nModule.getLanguage(), 'en');
  assert.equal(i18nModule.t('home.searchButton'), 'Find dishes');
  assert.equal(store.get(i18nModule.LANGUAGE_STORAGE_KEY), 'en');
});

test('story 1.4 shell placeholder consumes design tokens instead of hardcoded shell colors', () => {
  const placeholderScreen = fs.readFileSync(
    resolveFromFrontend('components/PlaceholderScreen.tsx'),
    'utf8',
  );

  assert.match(placeholderScreen, /from '\.\.\/lib\/tokens'/);
  assert.doesNotMatch(placeholderScreen, /#F7F3EE/);
  assert.doesNotMatch(placeholderScreen, /#18212A/);
  assert.doesNotMatch(placeholderScreen, /#A8461F/);
});
