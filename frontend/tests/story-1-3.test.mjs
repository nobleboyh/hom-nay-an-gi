import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendRoot = fileURLToPath(new URL('..', import.meta.url));
const resolveFromFrontend = (...segments) => path.join(frontendRoot, ...segments);

const requiredRoutes = [
  'app/_layout.tsx',
  'app/(tabs)/_layout.tsx',
  'app/(tabs)/index.tsx',
  'app/(tabs)/discover.tsx',
  'app/(tabs)/favorites.tsx',
  'app/(tabs)/profile.tsx',
  'app/recipe/[id].tsx',
  'app/shopping-list.tsx',
];

test('story 1.3 creates the required Expo Router route tree', () => {
  for (const routeFile of requiredRoutes) {
    assert.ok(fs.existsSync(resolveFromFrontend(routeFile)), `${routeFile} should exist`);
  }
});

test('story 1.3 preserves the Expo Router entrypoint and app identity', () => {
  const packageJson = JSON.parse(fs.readFileSync(resolveFromFrontend('package.json'), 'utf8'));
  const appJson = JSON.parse(fs.readFileSync(resolveFromFrontend('app.json'), 'utf8'));

  assert.equal(packageJson.main, 'expo-router/entry');
  assert.equal(appJson.expo.name, 'Hôm Nay Ăn Gì');
  assert.equal(appJson.expo.slug, 'hom-nay-an-gi');
  assert.ok(appJson.expo.ios, 'ios config should exist');
  assert.ok(appJson.expo.android, 'android config should exist');
});

test('story 1.3 wires Vietnamese tabs, placeholders, and the API base env file', () => {
  const tabsLayout = fs.readFileSync(resolveFromFrontend('app/(tabs)/_layout.tsx'), 'utf8');
  const homeScreen = fs.readFileSync(resolveFromFrontend('app/(tabs)/index.tsx'), 'utf8');
  const profileScreen = fs.readFileSync(resolveFromFrontend('app/(tabs)/profile.tsx'), 'utf8');
  const recipeScreen = fs.readFileSync(resolveFromFrontend('app/recipe/[id].tsx'), 'utf8');
  const placeholderScreen = fs.readFileSync(
    resolveFromFrontend('components/PlaceholderScreen.tsx'),
    'utf8',
  );
  const envTemplate = fs.readFileSync(resolveFromFrontend('.env.template'), 'utf8');

  assert.match(tabsLayout, /Trang chủ/);
  assert.match(tabsLayout, /Khám phá/);
  assert.match(tabsLayout, /Yêu thích/);
  assert.match(tabsLayout, /Cá nhân/);
  assert.match(homeScreen, /Bỏ qua điều hướng/);
  assert.match(homeScreen, /main-content/);
  assert.match(homeScreen, /Platform\.OS === 'web' \? \(/);
  assert.match(homeScreen, /skipLinkHidden/);
  assert.match(homeScreen, /translateY: -16/);
  assert.doesNotMatch(homeScreen, /position: 'relative'/);
  assert.match(profileScreen, /LoginScreen/);
  assert.match(profileScreen, /useAuthStore/);
  assert.match(recipeScreen, /handleBack/);
  assert.match(placeholderScreen, /‹/);
  assert.match(envTemplate, /API_BASE_URL=http:\/\/<LAN_IP>:8080/);
});
