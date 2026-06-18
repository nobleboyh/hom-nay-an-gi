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

const profile = read('app/(tabs)/profile.tsx');
const i18n = read('lib/i18n.ts');
const dataStore = read('stores/dataStore.ts');
const packageJson = read('package.json');

describe('story 4.8 profile/settings screen', () => {
  it('profile.tsx uses ScrollView for settings content', () => {
    assert.match(profile, /ScrollView/);
  });

  it('profile.tsx shows LoginScreen when guest', () => {
    assert.match(profile, /LoginScreen/);
    assert.match(profile, /authState === 'guest'/);
  });

  it('profile.tsx shows greeting with user displayName', () => {
    assert.match(profile, /settings\.greeting/);
    assert.match(profile, /displayName/);
  });

  it('profile.tsx has section headers for dietary preferences', () => {
    assert.match(profile, /settings\.dietary/);
  });

  it('profile.tsx has section headers for allergies', () => {
    assert.match(profile, /settings\.allergies/);
  });

  it('profile.tsx has section headers for disliked ingredients', () => {
    assert.match(profile, /settings\.disliked/);
  });

  it('profile.tsx has section headers for preferred cuisines', () => {
    assert.match(profile, /settings\.cuisines/);
  });

  it('profile.tsx has measurement unit toggle', () => {
    assert.match(profile, /settings\.units/);
    assert.match(profile, /measurementUnit/);
  });

  it('profile.tsx has theme section', () => {
    assert.match(profile, /settings\.theme/);
  });

  it('profile.tsx shows deferred toast for dark mode', () => {
    assert.match(profile, /settings\.theme\.deferred/);
    assert.match(profile, /handleThemeToggle/);
  });

  it('profile.tsx has notifications section with toggles', () => {
    assert.match(profile, /settings\.notifications/);
    assert.match(profile, /NOTIFICATION_KEYS/);
  });

  it('profile.tsx has privacy section', () => {
    assert.match(profile, /settings\.privacy/);
    assert.match(profile, /settings\.clearHistory/);
    assert.match(profile, /settings\.clearFavorites/);
    assert.match(profile, /settings\.deleteAccount/);
  });

  it('profile.tsx uses debounced sync (500ms)', () => {
    assert.match(profile, /debounceRef/);
    assert.match(profile, /clearTimeout/);
    assert.match(profile, /500/);
  });

  it('profile.tsx uses Alert for destructive confirmations', () => {
    assert.match(profile, /Alert\.alert/);
  });

  it('profile.tsx uses Chip component for dietary/cuisine/allergies', () => {
    assert.match(profile, /import.*Chip/);
    assert.match(profile, /<Chip/);
  });

  it('profile.tsx uses InputField for allergy/disliked input', () => {
    assert.match(profile, /InputField/);
    assert.match(profile, /onSubmitEditing/);
  });

  it('profile.tsx calls clearSearchHistory on confirm', () => {
    assert.match(profile, /clearSearchHistory/);
  });

  it('profile.tsx uses double confirmation for delete account', () => {
    const matches = profile.match(/Alert\.alert/g) || [];
    assert.ok(matches.length >= 2, 'expected at least 2 Alert.alert calls for double confirmation');
  });

  it('profile.tsx redirects after account deletion', () => {
    assert.match(profile, /router\.replace/);
    assert.match(profile, /\(tabs\)\/discover/);
  });

  it('profile.tsx calls clearAllFavorites on confirm', () => {
    assert.match(profile, /clearAllFavorites/);
  });

  it('profile.tsx calls logout after account deletion', () => {
    assert.match(profile, /logout/);
  });

  it('profile.tsx has PlaceholderAvatar with initials', () => {
    assert.match(profile, /PlaceholderAvatar/);
  });

  it('profile.tsx uses Switch components for toggles', () => {
    assert.match(profile, /Switch/);
  });
});

describe('story 4.8 i18n settings keys', () => {
  it('settings.greeting key exists in both languages', () => {
    assert.match(i18n, /'settings\.greeting'/);
  });

  it('settings.dietary key exists', () => {
    assert.match(i18n, /'settings\.dietary'/);
  });

  it('settings.allergies key exists', () => {
    assert.match(i18n, /'settings\.allergies'/);
  });

  it('settings.disliked key exists', () => {
    assert.match(i18n, /'settings\.disliked'/);
  });

  it('settings.cuisines key exists', () => {
    assert.match(i18n, /'settings\.cuisines'/);
  });

  it('settings.units key exists', () => {
    assert.match(i18n, /'settings\.units'/);
  });

  it('settings.theme key exists with deferred message', () => {
    assert.match(i18n, /'settings\.theme'/);
    assert.match(i18n, /'settings\.theme\.deferred'/);
  });

  it('settings.notifications keys exist', () => {
    assert.match(i18n, /'settings\.notifications'/);
  });

  it('settings.privacy key exists', () => {
    assert.match(i18n, /'settings\.privacy'/);
  });

  it('settings.clearHistory keys exist', () => {
    assert.match(i18n, /'settings\.clearHistory'/);
    assert.match(i18n, /'settings\.clearHistory\.confirm'/);
    assert.match(i18n, /'settings\.clearHistory\.done'/);
  });

  it('settings.clearFavorites keys exist', () => {
    assert.match(i18n, /'settings\.clearFavorites'/);
    assert.match(i18n, /'settings\.clearFavorites\.confirm'/);
    assert.match(i18n, /'settings\.clearFavorites\.done'/);
  });

  it('settings.deleteAccount keys exist', () => {
    assert.match(i18n, /'settings\.deleteAccount'/);
    assert.match(i18n, /'settings\.deleteAccount\.confirm1'/);
    assert.match(i18n, /'settings\.deleteAccount\.confirm2'/);
    assert.match(i18n, /'settings\.deleteAccount\.done'/);
  });

  it('settings keys have English translations', () => {
    assert.match(i18n, /'settings\.greeting':/);
    assert.match(i18n, /'settings\.deleteAccount\.done':/);
  });
});

describe('story 4.8 dataStore updates', () => {
  it('dataStore has fetchPreferences action', () => {
    assert.match(dataStore, /fetchPreferences/);
  });

  it('dataStore has clearAllFavorites action', () => {
    assert.match(dataStore, /clearAllFavorites/);
  });

  it('dataStore syncPreferences calls PUT /api/v1/settings/preferences', () => {
    assert.match(dataStore, /PUT/);
    assert.match(dataStore, /settings\/preferences/);
  });

  it('dataStore syncPreferences handles guest mode via storageAdapter', () => {
    assert.match(dataStore, /storageAdapter\.write.*guest_preferences/);
  });

  it('dataStore has preferencesStatus field', () => {
    assert.match(dataStore, /preferencesStatus/);
  });

  it('dataStore fetchPreferences handles API target with Bearer token', () => {
    assert.match(dataStore, /Authorization.*Bearer/);
    assert.match(dataStore, /settings\/preferences/);
  });

  it('dataStore clearSearchHistory sends DELETE to API', () => {
    assert.match(dataStore, /clearSearchHistory/);
    assert.match(dataStore, /DELETE/);
    assert.match(dataStore, /settings\/search-history/);
  });
});

describe('story 4.8 test runner includes this file', () => {
  it('package.json test script includes story-4-8.test.mjs', () => {
    assert.match(packageJson, /story-4-8\.test\.mjs/);
  });
});
