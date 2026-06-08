import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';

const frontendRoot = path.resolve(import.meta.dirname, '..');
const resolveFromFrontend = (...segments) => path.join(frontendRoot, ...segments);

// ---------------------------------------------------------------------------
// Component file existence
// ---------------------------------------------------------------------------
const compositeFiles = [
  'components/ChipRow.tsx',
  'components/ResultCard.tsx',
  'components/SortDropdown.tsx',
  'components/EmptyState.tsx',
  'components/Skeleton.tsx',
  'components/DishCard.tsx',
  'components/RestaurantCard.tsx',
  'components/CollapsibleSection.tsx',
  'components/BenefitsCard.tsx',
  'components/TipCard.tsx',
];

test('story 1.6 creates the 10 composite component files', () => {
  for (const relativePath of compositeFiles) {
    assert.ok(fs.existsSync(resolveFromFrontend(relativePath)), `${relativePath} should exist`);
  }
});

// ---------------------------------------------------------------------------
// ChipRow source assertions
// ---------------------------------------------------------------------------
test('story 1.6 ChipRow matches the multi/single-select contract', () => {
  const source = fs.readFileSync(resolveFromFrontend('components/ChipRow.tsx'), 'utf8');

  assert.match(source, /ScrollView/, 'should use ScrollView for horizontal scroll');
  assert.match(source, /multiSelect/, 'should support multiSelect mode');
  assert.match(source, /singleSelect/, 'should support singleSelect mode');
  assert.match(source, /onSelectionChange/, 'should expose onSelectionChange callback');
  assert.match(source, /selectedIds/, 'should accept selectedIds prop');
  assert.match(source, /import.*Chip/, 'should import Chip from primitives');
});

// ---------------------------------------------------------------------------
// ResultCard source assertions
// ---------------------------------------------------------------------------
test('story 1.6 ResultCard matches the accordion contract', () => {
  const source = fs.readFileSync(resolveFromFrontend('components/ResultCard.tsx'), 'utf8');

  assert.match(source, /accessibilityState.*expanded/, 'should expose accessibilityState.expanded');
  assert.match(source, /Pressable/, 'should use Pressable for expand/collapse');
  assert.match(source, /import.*Badge/, 'should compose with Badge');
  assert.match(source, /import.*Button/, 'should compose with Button');
  assert.match(source, /import.*Card/, 'should compose with Card');
  assert.match(source, /expanded/, 'should have expanded prop');
  assert.match(source, /onToggle/, 'should have onToggle callback');
  assert.match(source, /useReducedMotion/, 'should respect reduced motion');
});

// ---------------------------------------------------------------------------
// SortDropdown source assertions
// ---------------------------------------------------------------------------
test('story 1.6 SortDropdown provides Vietnamese sort options', () => {
  const source = fs.readFileSync(resolveFromFrontend('components/SortDropdown.tsx'), 'utf8');

  assert.match(source, /Phù hợp nhất/, 'Vietnamese: Best match');
  assert.match(source, /Ít calo nhất/, 'Vietnamese: Lowest cal');
  assert.match(source, /Nấu nhanh nhất/, 'Vietnamese: Fastest');
  assert.match(source, /Loại món/, 'Vietnamese: Dish type');
  assert.match(source, /onChange/, 'should fire onChange callback');
});

// ---------------------------------------------------------------------------
// EmptyState source assertions
// ---------------------------------------------------------------------------
test('story 1.6 EmptyState matches the centered-layout contract', () => {
  const source = fs.readFileSync(resolveFromFrontend('components/EmptyState.tsx'), 'utf8');

  assert.match(source, /accessibilityRole="alert"/, 'should have accessibilityRole alert for status semantics');
  assert.match(source, /icon/, 'should accept icon prop');
  assert.match(source, /title/, 'should accept title prop');
  assert.match(source, /description/, 'should accept description prop');
  assert.match(source, /ctaLabel/, 'should accept optional ctaLabel');
  assert.match(source, /onCtaPress/, 'should accept optional onCtaPress');
});

// ---------------------------------------------------------------------------
// Skeleton source assertions
// ---------------------------------------------------------------------------
test('story 1.6 Skeleton matches the shimmer contract', () => {
  const source = fs.readFileSync(resolveFromFrontend('components/Skeleton.tsx'), 'utf8');

  assert.match(source, /Animated/, 'should use React Native Animated API');
  assert.match(source, /variant/, 'should support variant prop');
  assert.match(source, /card/, 'should support card variant');
  assert.match(source, /circle/, 'should support circle variant');
  assert.match(source, /useReducedMotion/, 'should respect reduced motion');
  assert.match(source, /Đang tải\.\.\./, 'should have Vietnamese loading label');
});

// ---------------------------------------------------------------------------
// DishCard + RestaurantCard source assertions
// ---------------------------------------------------------------------------
test('story 1.6 DishCard and RestaurantCard match the design contracts', () => {
  const dishSource = fs.readFileSync(resolveFromFrontend('components/DishCard.tsx'), 'utf8');
  const restSource = fs.readFileSync(resolveFromFrontend('components/RestaurantCard.tsx'), 'utf8');

  assert.match(dishSource, /accessibilityRole="button"/, 'DishCard should have button role');
  assert.match(dishSource, /accessibilityLabel/, 'DishCard should have accessibilityLabel');
  assert.match(dishSource, /import.*Card/, 'DishCard should compose Card');
  assert.match(dishSource, /useReducedMotion/, 'DishCard should respect reduced motion');

  assert.match(restSource, /accessibilityRole="button"/, 'RestaurantCard should have button role');
  assert.match(restSource, /import.*Card/, 'RestaurantCard should compose Card');
  assert.match(restSource, /formatDistance/, 'RestaurantCard should use formatDistance');
  assert.match(restSource, /distanceMeters/, 'RestaurantCard should accept distanceMeters');
});

// ---------------------------------------------------------------------------
// CollapsibleSection + BenefitsCard + TipCard source assertions
// ---------------------------------------------------------------------------
test('story 1.6 CollapsibleSection, BenefitsCard, TipCard match contracts', () => {
  const collapsibleSource = fs.readFileSync(resolveFromFrontend('components/CollapsibleSection.tsx'), 'utf8');
  const benefitsSource = fs.readFileSync(resolveFromFrontend('components/BenefitsCard.tsx'), 'utf8');
  const tipSource = fs.readFileSync(resolveFromFrontend('components/TipCard.tsx'), 'utf8');

  assert.match(collapsibleSource, /accessibilityState.*expanded/, 'CollapsibleSection should expose expanded state');
  assert.match(collapsibleSource, /useReducedMotion/, 'CollapsibleSection should respect reduced motion');
  assert.match(collapsibleSource, /defaultExpanded/, 'CollapsibleSection should accept defaultExpanded');

  assert.match(benefitsSource, /import.*Card/, 'BenefitsCard should compose Card');
  assert.match(benefitsSource, /accentDim/, 'BenefitsCard should use accentDim tint');
  assert.match(benefitsSource, /icon/, 'BenefitsCard should have icon field');
  assert.match(benefitsSource, /text:/, 'BenefitsCard should have text field');

  assert.match(tipSource, /import.*Card/, 'TipCard should compose Card');
  assert.match(tipSource, /accentDim/, 'TipCard should use accentDim tint');
  assert.match(tipSource, /Mẹo tiết kiệm/, 'TipCard should have Vietnamese savings tip title');
});

// ---------------------------------------------------------------------------
// Barrel export
// ---------------------------------------------------------------------------
test('story 1.6 barrel export includes all 10 composites', () => {
  const source = fs.readFileSync(resolveFromFrontend('components/index.ts'), 'utf8');

  const expectedExports = [
    'BenefitsCard',
    'ChipRow',
    'CollapsibleSection',
    'DishCard',
    'EmptyState',
    'RestaurantCard',
    'ResultCard',
    'Skeleton',
    'SortDropdown',
    'TipCard',
  ];

  for (const name of expectedExports) {
    assert.match(source, new RegExp(`export \\{ ${name} \\}`), `barrel should export ${name}`);
  }
});

// ---------------------------------------------------------------------------
// API client tests (envelope parsing, 401 retry, timeout)
// ---------------------------------------------------------------------------
test('story 1.6 api.ts creates an ApiClient with envelope parsing', async () => {
  const apiPath = resolveFromFrontend('lib', 'api.ts');
  const source = fs.readFileSync(apiPath, 'utf8');

  assert.match(source, /ApiError/, 'should export ApiError class');
  assert.match(source, /createApiClient/, 'should export createApiClient factory');
  assert.match(source, /getToken/, 'should support getToken injection');
  assert.match(source, /onTokenExpired/, 'should support onTokenExpired injection');
  assert.match(source, /onUnauthenticated/, 'should support onUnauthenticated injection');
  assert.match(source, /success.*true/, 'should parse success envelope');
  assert.match(source, /success.*false/, 'should handle error envelope');
});

test('story 1.6 api.ts has 401 retry and timeout logic', () => {
  const source = fs.readFileSync(resolveFromFrontend('lib', 'api.ts'), 'utf8');

  assert.match(source, /status === 401/, 'should detect 401');
  assert.match(source, /retryOn401/, 'should have retry on 401 logic');
  assert.match(source, /AbortController/, 'should use AbortController for timeout');
  assert.match(source, /20_000/, 'should have 20s LLM timeout');
  assert.match(source, /10_000/, 'should have 10s default timeout');
});

test('story 1.6 api.ts timeouts differ for LLM path prefix', () => {
  const source = fs.readFileSync(resolveFromFrontend('lib', 'api.ts'), 'utf8');

  assert.match(source, /LLM_PATH_PREFIX/, 'should detect LLM path prefix');
  assert.match(source, /\/recipes\//, 'should use /recipes/ as LLM path prefix');
});

// ---------------------------------------------------------------------------
// parseIngredients validation (source-level assertions)
// ---------------------------------------------------------------------------
test('story 1.6 parseIngredients has validation in source', () => {
  const source = fs.readFileSync(resolveFromFrontend('lib', 'parseIngredients.ts'), 'utf8');

  assert.match(source, /toLowerCase/, 'should do case-insensitive deduplication');
  assert.match(source, /MAX_INGREDIENTS|> 20|>20/, 'should have max ingredient check');
  assert.match(source, /filter\(Boolean\)/, 'should filter empty strings');
  assert.match(source, /trim/, 'should trim whitespace');
  assert.match(source, /export function parseIngredients/, 'should export parseIngredients function');
});

// ---------------------------------------------------------------------------
// formatTime i18n-aware (source-level assertions)
// ---------------------------------------------------------------------------
test('story 1.6 formatTime has i18n-aware formatting', () => {
  const source = fs.readFileSync(resolveFromFrontend('lib', 'formatTime.ts'), 'utf8');

  assert.match(source, /import.*getLanguage.*from.*i18n/, 'should import getLanguage from i18n');
  assert.match(source, /phút/, 'should have Vietnamese phút output');
  assert.match(source, /min/, 'should have English min output');
  assert.match(source, /export function formatDistance/, 'should export formatDistance');
  assert.match(source, /meters/, 'should accept meters in formatDistance');
});

// ---------------------------------------------------------------------------
// package.json test script
// ---------------------------------------------------------------------------
test('story 1.6 test is registered in package.json scripts', () => {
  const pkg = JSON.parse(fs.readFileSync(resolveFromFrontend('package.json'), 'utf8'));
  assert.match(pkg.scripts.test, /story-1-6\.test\.mjs/, 'test script should include story-1-6.test.mjs');
});
