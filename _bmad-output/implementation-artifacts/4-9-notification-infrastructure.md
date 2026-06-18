# Story 4.9: Notification Infrastructure

Status: review

## Story

As a **user**,
I want meal-time reminders as local notifications,
So that the app prompts me at configured times without requiring a server push infrastructure.

## Acceptance Criteria

1. **Given** notification toggles in Settings (Story 4.8), **When** I enable "Nhắc bữa sáng" and set time to 7:00, **Then** A local notification is scheduled daily at 7:00 via `expo-notifications`. OS permission is requested on first enable.
2. **Given** a scheduled notification, **When** it fires, **Then** It displays: title "Hôm Nay Ăn Gì", body "Đến giờ ăn sáng! Khám phá món ngon ngay.", tapping opens the app to HomeScreen.
3. **Given** I disable a notification toggle, **When** toggled off, **Then** The scheduled notification is cancelled. No more notifications for that meal time.
4. **Given** OS notification permissions are denied, **When** I toggle a notification on, **Then** An alert explains how to enable notifications in system settings. Toggle stays off until permissions granted.
5. **Given** the daily suggestion notification, **When** enabled, **Then** A single daily notification at a user-chosen time suggests a random dish (Surprise Me style).

## Tasks / Subtasks

- [x] Task 1: Install and configure `expo-notifications` (AC: 1)
  - [x] Run `npx expo install expo-notifications` to add the package
  - [x] Add `expo-notifications` plugin to `app.json` (`"plugins": ["expo-notifications"]`)
  - [x] Configure notification handler in `frontend/app/_layout.tsx`: `setNotificationHandler()` to show alert, play sound, set badge

- [x] Task 2: Create `frontend/lib/notifications.ts` — notification utility module (AC: 1-5)
  - [x] `scheduleMealReminder(mealType: 'breakfast' | 'lunch' | 'dinner', hour: number, minute: number)`: Schedule daily notification via `expo-notifications.scheduleNotificationAsync()` with `type: 'daily'` trigger. Meal-specific body text.
  - [x] `cancelMealReminder(mealType)`: Cancel all scheduled notifications for this meal type using identifier convention
  - [x] `scheduleDailySuggestion(hour, minute)`: Schedule single daily notification at chosen time with random suggestion prompt
  - [x] `cancelDailySuggestion()`: Cancel the daily suggestion notification
  - [x] `requestNotificationPermissions()`: `getPermissionsAsync()` → if denied, `requestPermissionsAsync()` → if denied again, return `{ granted: false }` (caller shows alert)
  - [x] Notification identifier convention: use string IDs like `"meal-breakfast"`, `"meal-lunch"`, `"meal-dinner"`, `"suggestion-daily"`

- [x] Task 3: Wire notification functions into Settings (from Story 4.8) (AC: 1-5)
  - [x] In `profile.tsx` settings (Story 4.8), when notification toggle changes:
    - [x] If enabled: call `requestNotificationPermissions()` → if granted, call `scheduleMealReminder(type, defaultHour, defaultMinute)` → save preference
    - [x] If enabled but permissions denied: show Alert with message "Vui lòng bật thông báo trong Cài đặt để nhận nhắc nhở" + button to open system settings (`Linking.openSettings()`). Toggle stays off.
    - [x] If disabled: call `cancelMealReminder(type)` → save preference
  - [x] Default times: breakfast 7:00, lunch 11:30, dinner 18:00, daily suggestion 9:00

- [x] Task 4: Set up notification handler in app root (AC: 2)
  - [x] In `frontend/app/_layout.tsx`:
    - [x] `setNotificationHandler({ handleNotification: async () => ({ shouldShowAlert: true, shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) })`
    - [x] Handle notification tap: `addNotificationResponseReceivedListener(response) → router.push('/')` (navigate to HomeScreen)

- [x] Task 5: Write tests (frontend static analysis) (AC: 1-5)
  - [x] `tests/story-4-9.test.mjs` with node --test
  - [x] Test `notifications.ts` exports scheduleMealReminder, cancelMealReminder, scheduleDailySuggestion, cancelDailySuggestion, requestNotificationPermissions
  - [x] Test schedule functions reference `expo-notifications.scheduleNotificationAsync`
  - [x] Test cancel functions reference `cancelScheduledNotificationAsync`
  - [x] Test _layout.tsx references notification handler setup

## Dev Notes

### Frontend Architecture Reference

```
frontend/lib/notifications.ts        # NEW — notification utility functions
frontend/app/_layout.tsx              # Root layout — configure notification handler
frontend/app/(tabs)/profile.tsx       # Settings screen — wire notification toggles (Story 4.8)
```

### expo-notifications API

Key API calls:
- `scheduleNotificationAsync({ content: { title, body, data }, trigger: { type: 'daily', hour, minute } })` → returns string identifier
- `cancelScheduledNotificationAsync(identifier)` — cancel by ID
- `getPermissionsAsync()` / `requestPermissionsAsync()` → `{ granted, status, canAskAgain }`
- `setNotificationHandler({ handleNotification: async () => ({ shouldShowAlert, shouldPlaySound, shouldSetBadge }) })`
- `addNotificationResponseReceivedListener((response) => { ... })` — handle tap

### Notification Content

| Type | Title | Body |
|------|-------|------|
| breakfast | "Hôm Nay Ăn Gì" | "Đến giờ ăn sáng! Khám phá món ngon ngay." |
| lunch | "Hôm Nay Ăn Gì" | "Đến giờ ăn trưa! Khám phá món ngon ngay." |
| dinner | "Hôm Nay Ăn Gì" | "Đến giờ ăn tối! Khám phá món ngon ngay." |
| daily suggestion | "Gợi ý món ngon" | "Hôm nay thử món này nhé! Khám phá món mới." |

### Default Times

- breakfast: 7:00
- lunch: 11:30
- dinner: 18:00
- daily suggestion: 9:00

### Permission Flow

```
Toggle ON → getPermissionsAsync()
  → granted: scheduleNotification()
  → undetermined: requestPermissionsAsync()
    → granted: scheduleNotification()
    → denied: show Alert to enable in Settings
  → denied: show Alert to enable in Settings
```

The Alert message should include a button that calls `Linking.openSettings()` to take user to system Settings.

### Firebase Cloud Messaging (Note)

`expo-notifications` supports both local and push (remote) notifications. For MVP, we only use local notifications. FCM setup is not required. The `expo-notifications` token registration is optional and can be added later for push notification support.

### Root Layout Wiring

In `_layout.tsx`, the notification setup should go in `useEffect` or a dedicated initialization function called during app boot:
```typescript
import { setNotificationHandler, addNotificationResponseReceivedListener } from 'expo-notifications';

// In component or effect:
setNotificationHandler({ handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false }) });

const responseListener = addNotificationResponseReceivedListener((response) => {
  router.push('/'); // Navigate to HomeScreen on tap
});

return () => responseListener.remove();
```

### Testing

Static-analysis tests (`node --test`, `.mjs`) in `frontend/tests/story-4-9.test.mjs`.
Pattern: `fs.readFileSync` + `assert.match()` to check for expected patterns in source files.

### i18n Keys Needed

Add to `frontend/lib/i18n.ts`:
- `notifications.permission.denied` = "Vui lòng bật thông báo trong Cài đặt để nhận nhắc nhở"
- `notifications.permission.open` = "Mở Cài đặt"

### Project Structure Notes

- New file: `frontend/lib/notifications.ts` — follows existing lib/ pattern (tokens.ts, i18n.ts, api.ts)
- Root layout: already at `frontend/app/_layout.tsx`
- Notification toggles are in profile.tsx (Story 4.8) — this story wires the backend functions to those toggles

### References

- [Source: `docs.expo.dev/versions/latest/sdk/notifications/`] — expo-notifications API reference

### Change Log

- 2026-06-17: Implemented notification infrastructure (schedule, cancel, permissions, layout handler, tests). 27 tests, 0 regressions.
- [Source: `frontend/app/_layout.tsx`] — root layout for notification handler
- [Source: `frontend/lib/tokens.ts`] — reference for lib/ file pattern
- [Source: `frontend/lib/i18n.ts`] — i18n catalog for adding notification keys

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Installed expo-notifications (SDK 54 compatible)
- Created frontend/lib/notifications.ts with scheduleMealReminder, cancelMealReminder, scheduleDailySuggestion, cancelDailySuggestion, requestNotificationPermissions
- Wired notification scheduling/cancellation into profile.tsx notification toggles with permission flow
- Configured setNotificationHandler and tap listener in _layout.tsx with cleanup
- Added 2 i18n keys (notifications.permission.denied, notifications.permission.open)
- 27 static-analysis tests for story 4.9 — all passing
- 71 total tests passing (44 from 4.8 + 27 from 4.9), zero regressions

### File List

#### Created

- `frontend/lib/notifications.ts` — notification scheduling, cancellation, permission requests
- `frontend/tests/story-4-9.test.mjs` — static analysis tests

#### Modified

- `frontend/app/_layout.tsx` — configure notification handler, tap listener
- `frontend/app.json` — add `expo-notifications` plugin
- `frontend/lib/i18n.ts` — add notification-related translation keys

#### Installed (dependency)

- `expo-notifications` (via npx expo install)
