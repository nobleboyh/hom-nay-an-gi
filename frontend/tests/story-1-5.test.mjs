import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const frontendRoot = new URL('..', import.meta.url);
const resolveFromFrontend = (...segments) => path.join(frontendRoot.pathname, ...segments);

const componentFiles = [
  'components/Button.tsx',
  'components/Card.tsx',
  'components/Chip.tsx',
  'components/InputField.tsx',
  'components/Timeline.tsx',
  'components/TabBar.tsx',
  'components/Badge.tsx',
  'components/Toast.tsx',
  'components/ServingAdjuster.tsx',
  'components/index.ts',
];

test('story 1.5 creates the primitive component files and barrel export', () => {
  for (const relativePath of componentFiles) {
    assert.ok(fs.existsSync(resolveFromFrontend(relativePath)), `${relativePath} should exist`);
  }
});

test('story 1.5 button and chip source includes the required variants and accessibility state', () => {
  const buttonSource = fs.readFileSync(resolveFromFrontend('components/Button.tsx'), 'utf8');
  const chipSource = fs.readFileSync(resolveFromFrontend('components/Chip.tsx'), 'utf8');
  const cardSource = fs.readFileSync(resolveFromFrontend('components/Card.tsx'), 'utf8');

  for (const variant of ['primary', 'secondary', 'ghost', 'destructive']) {
    assert.match(buttonSource, new RegExp(variant));
  }

  assert.match(buttonSource, /ActivityIndicator/);
  assert.match(buttonSource, /loading/);
  assert.match(buttonSource, /disabled/);
  assert.match(chipSource, /selected/);
  assert.match(chipSource, /ingredient/);
  assert.match(chipSource, /onRemove/);
  assert.match(chipSource, /accessibilityState/);
  assert.match(cardSource, /Shadows\.sm/);
  assert.match(cardSource, /padding/);
});

test('story 1.5 input, timeline, tab bar, badge, toast, and serving adjuster source match the contracts', () => {
  const inputSource = fs.readFileSync(resolveFromFrontend('components/InputField.tsx'), 'utf8');
  const timelineSource = fs.readFileSync(resolveFromFrontend('components/Timeline.tsx'), 'utf8');
  const tabBarSource = fs.readFileSync(resolveFromFrontend('components/TabBar.tsx'), 'utf8');
  const badgeSource = fs.readFileSync(resolveFromFrontend('components/Badge.tsx'), 'utf8');
  const toastSource = fs.readFileSync(resolveFromFrontend('components/Toast.tsx'), 'utf8');
  const servingSource = fs.readFileSync(resolveFromFrontend('components/ServingAdjuster.tsx'), 'utf8');
  const indexSource = fs.readFileSync(resolveFromFrontend('components/index.ts'), 'utf8');
  const packageJson = JSON.parse(fs.readFileSync(resolveFromFrontend('package.json'), 'utf8'));

  assert.match(inputSource, /TextInput/);
  assert.match(inputSource, /error/);
  assert.match(inputSource, /iconLeft/);
  assert.match(inputSource, /iconRight/);
  assert.match(inputSource, /accessibilityState/);
  assert.match(inputSource, /aria-invalid/);

  assert.match(timelineSource, /accessibilityRole="list"/);
  assert.match(timelineSource, /role="listitem"/);
  assert.match(timelineSource, /duration/);

  assert.match(tabBarSource, /Link/);
  assert.match(tabBarSource, /tabButton/);
  assert.match(tabBarSource, /navigation/);

  assert.match(badgeSource, /value/);
  assert.match(badgeSource, /accentDim/);

  assert.match(toastSource, /role="status"/);
  assert.match(toastSource, /accessibilityLiveRegion="polite"/);
  assert.match(toastSource, /Math\.max\(4000/);
  assert.match(toastSource, /useReducedMotion/);

  assert.match(servingSource, /accessibilityRole="adjustable"/);
  assert.match(servingSource, /onChange/);
  assert.match(servingSource, /min/);
  assert.match(servingSource, /max/);

  for (const exportedName of [
    'Badge',
    'Button',
    'Card',
    'Chip',
    'InputField',
    'ServingAdjuster',
    'TabBar',
    'Timeline',
    'Toast',
  ]) {
    assert.match(indexSource, new RegExp(`export \\{ ${exportedName} \\}`));
  }

  assert.match(packageJson.scripts.test, /story-1-5\.test\.mjs/);
});
