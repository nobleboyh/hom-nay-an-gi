import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function read(path) {
  const full = join(root, path);
  if (!existsSync(full)) return '';
  return readFileSync(full, 'utf-8');
}

const notifications = read('lib/notifications.ts');
const layout = read('app/_layout.tsx');
const profile = read('app/(tabs)/profile.tsx');
const appJson = read('app.json');
const i18n = read('lib/i18n.ts');
const packageJson = read('package.json');

describe('story 4.9 notifications utility', () => {
  it('notifications.ts exports scheduleMealReminder', () => {
    assert.match(notifications, /scheduleMealReminder/);
  });

  it('notifications.ts exports cancelMealReminder', () => {
    assert.match(notifications, /cancelMealReminder/);
  });

  it('notifications.ts exports scheduleDailySuggestion', () => {
    assert.match(notifications, /scheduleDailySuggestion/);
  });

  it('notifications.ts exports cancelDailySuggestion', () => {
    assert.match(notifications, /cancelDailySuggestion/);
  });

  it('notifications.ts exports requestNotificationPermissions', () => {
    assert.match(notifications, /requestNotificationPermissions/);
  });

  it('notifications.ts references expo-notifications scheduleNotificationAsync', () => {
    assert.match(notifications, /scheduleNotificationAsync/);
  });

  it('notifications.ts references expo-notifications cancelScheduledNotificationAsync', () => {
    assert.match(notifications, /cancelScheduledNotificationAsync/);
  });

  it('notifications.ts references getPermissionsAsync', () => {
    assert.match(notifications, /getPermissionsAsync/);
  });

  it('notifications.ts references requestPermissionsAsync', () => {
    assert.match(notifications, /requestPermissionsAsync/);
  });

  it('notifications.ts has meal notification content', () => {
    assert.match(notifications, /Đến giờ ăn sáng/);
    assert.match(notifications, /Đến giờ ăn trưa/);
    assert.match(notifications, /Đến giờ ăn tối/);
  });

  it('notifications.ts has suggestion notification content', () => {
    assert.match(notifications, /Gợi ý món ngon/);
  });

  it('notifications.ts uses daily trigger type', () => {
    assert.match(notifications, /daily/);
  });
});

describe('story 4.9 layout notification handler', () => {
  it('_layout.tsx imports setNotificationHandler', () => {
    assert.match(layout, /setNotificationHandler/);
  });

  it('_layout.tsx imports addNotificationResponseReceivedListener', () => {
    assert.match(layout, /addNotificationResponseReceivedListener/);
  });

  it('_layout.tsx configures notification handler in useEffect', () => {
    assert.match(layout, /setNotificationHandler/);
    assert.match(layout, /shouldShowAlert/);
    assert.match(layout, /shouldPlaySound/);
  });

  it('_layout.tsx navigates to home on notification tap', () => {
    assert.match(layout, /addNotificationResponseReceivedListener/);
    assert.match(layout, /router\.push/);
  });

  it('_layout.tsx removes response listener on cleanup', () => {
    assert.match(layout, /.remove/);
  });
});

describe('story 4.9 settings wiring', () => {
  it('profile.tsx imports notification functions', () => {
    assert.match(profile, /scheduleMealReminder/);
    assert.match(profile, /cancelMealReminder/);
    assert.match(profile, /scheduleDailySuggestion/);
    assert.match(profile, /cancelDailySuggestion/);
    assert.match(profile, /requestNotificationPermissions/);
  });

  it('profile.tsx imports Linking', () => {
    assert.match(profile, /Linking/);
  });

  it('profile.tsx calls openSettings from Linking', () => {
    assert.match(profile, /Linking\.openSettings/);
  });

  it('profile.tsx calls schedule on notification enable', () => {
    assert.match(profile, /scheduleMealReminder/);
    assert.match(profile, /scheduleDailySuggestion/);
  });

  it('profile.tsx calls cancel on notification disable', () => {
    assert.match(profile, /cancelMealReminder/);
    assert.match(profile, /cancelDailySuggestion/);
  });

  it('profile.tsx shows permission denied alert', () => {
    assert.match(profile, /notifications\.permission\.denied/);
  });
});

describe('story 4.9 app.json plugin', () => {
  it('app.json includes expo-notifications plugin', () => {
    assert.match(appJson, /expo-notifications/);
  });
});

describe('story 4.9 i18n keys', () => {
  it('notifications.permission.denied key exists', () => {
    assert.match(i18n, /notifications\.permission\.denied/);
  });

  it('notifications.permission.open key exists', () => {
    assert.match(i18n, /notifications\.permission\.open/);
  });
});

describe('story 4.9 test runner includes this file', () => {
  it('package.json test script includes story-4-9.test.mjs', () => {
    assert.match(packageJson, /story-4-9\.test\.mjs/);
  });
});
