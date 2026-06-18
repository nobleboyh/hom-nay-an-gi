# Story 4.8: Profile/Settings Screens

Status: done

## Story

As a **user**,
I want to manage all my preferences in one place,
So that the app is personalized to my dietary needs, language, measurement unit, theme, and notification preferences.

## Acceptance Criteria

1. **Given** the Profile/Settings screen (authenticated view of Cá nhân tab), **When** I'm logged in, **Then** I see: user greeting with display name, and sections — Dietary Preferences (multi-select chips), Allergies (add/remove chips), Disliked Ingredients (add/remove), Preferred Cuisines (multi-select), Measurement Units (toggle), Theme (light mode — dark theme deferred post-MVP via deferred toast), Notifications (4 toggles), Privacy section (Clear History, Clear Favorites, Delete Account — all with confirmation dialogs).
2. **Given** I toggle a preference, **When** changed, **Then** Saved immediately via PUT with debounce (500ms). Chip/toggle shows active state. Preferences sync to server and propagate to other devices on next sync.
3. **Given** I toggle measurement to "Imperial", **When** changed, **Then** All quantities reflect imperial units immediately. Setting synced via `PUT /api/v1/settings/preferences`.
4. **Given** I toggle theme, **When** changed, **Then** Light mode applies immediately. Dark mode shows toast "Chế độ tối sẽ có trong phiên bản tiếp theo" (deferred per FR-27).
5. **Given** I tap "Clear Search History", **When** confirmation accepted, **Then** All history deleted (local + cloud). Toast confirms: "Đã xóa lịch sử tìm kiếm".
6. **Given** I tap "Delete Account", **When** double confirmation accepted, **Then** Calls `DELETE /api/v1/account` → clears all local data → logs out → toast "Tài khoản đã được xóa" → redirects to guest Home.
7. **Given** guest mode, **When** I view Cá nhân tab, **Then** LoginScreen shown instead of settings (Story 4.2).

## Tasks / Subtasks

- [x] Task 1: Implement authenticated profile view (AC: 1)
  - [x] Replace settings placeholder in `frontend/app/(tabs)/profile.tsx` with full authenticated view
  - [x] Conditional render: `authState === 'guest'` → `LoginScreen`, `authState === 'authenticated'` → SettingsScreen
  - [x] SettingsScreen as local component or imported from `components/SettingsScreen.tsx`
  - [x] User greeting: "Xin chào, {displayName}!" with avatar placeholder circle (initials)

- [x] Task 2: Build section components (AC: 1)
  - [x] Section 1: **Dietary Preferences** — multi-select Chip row: ["Chay", "Thuần chay", "Không gluten", "Ít carbs", "Keto", "Cân bằng"]. `Chip` component with `selected` state. Toggle adds/removes from array.
  - [x] Section 2: **Allergies** — InputField to add new allergy + Chip list with × remove. Store as string array.
  - [x] Section 3: **Disliked Ingredients** — same pattern as Allergies. InputField + Chip list with ×.
  - [x] Section 4: **Preferred Cuisines** — multi-select Chip row: ["Việt Nam", "Trung Hoa", "Nhật Bản", "Hàn Quốc", "Ý", "Pháp", "Ấn Độ", "Thái Lan", "Mỹ", "Khác"].
  - [x] Section 5: **Measurement Units** — toggle switch: Metric (gram/ml/°C) ↔ Imperial (oz/fl oz/°F). `Switch` component with label.
  - [x] Section 6: **Theme** — toggle: Light (active) / Dark (shows deferred toast). Single toggle.
  - [x] Section 7: **Notifications** — 4 toggle switches: "Nhắc bữa sáng", "Nhắc bữa trưa", "Nhắc bữa tối", "Gợi ý món mỗi ngày"
  - [x] Section 8: **Privacy** — 3 destructive action rows: "Xóa lịch sử tìm kiếm", "Xóa Yêu thích", "Xóa tài khoản"

- [x] Task 3: Wire preference save with 500ms debounce (AC: 2)
  - [x] On chip toggle or switch change: debounce update to server via `dataStore.syncPreferences()`
  - [x] Debounce: `useRef<setTimeout>` — clear on pending, set new 500ms timeout
  - [x] On debounce fire: call `PUT /api/v1/settings/preferences` with the full current preferences object
  - [x] Show optimistic UI (toggle immediately) — don't wait for server response

- [x] Task 4: Wire measurement unit toggle (AC: 3)
  - [x] Toggle Switch: Metric / Imperial
  - [x] On change: update `dataStore.preferences.measurementUnit` immediately
  - [x] Save via debounced `syncPreferences()`
  - [x] Note: actual quantity display changes across the app are out of scope for this story — this just stores the preference

- [x] Task 5: Wire theme toggle (AC: 4)
  - [x] Toggle: Light (on) / Dark (off, deferred)
  - [x] Tapping Dark: toast "Chế độ tối sẽ có trong phiên bản tiếp theo" → toggle stays on Light
  - [x] Save via `syncPreferences()` (though dark mode save is deferred, the preference field exists for future use)

- [x] Task 6: Wire Privacy section destructive actions (AC: 5-6)
  - [x] **Clear Search History**: Alert confirmation "Xóa lịch sử tìm kiếm?" → "Bạn có chắc chắn muốn xóa toàn bộ lịch sử tìm kiếm?" with "Hủy" and "Xóa" buttons. On confirm: call `dataStore.clearSearchHistory()` → toast "Đã xóa lịch sử tìm kiếm"
  - [x] **Clear Favorites**: Alert confirmation "Xóa tất cả Yêu thích?" → similar flow → `dataStore.clearAllFavorites()` → toast "Đã xóa tất cả Yêu thích"
  - [x] **Delete Account**: Double confirmation. Alert 1: "Xóa tài khoản?" → "Bạn có chắc chắn?". On confirm: Alert 2: "Thao tác này không thể hoàn tác. Tài khoản của bạn sẽ bị xóa vĩnh viễn." with "Hủy" and "Xóa tài khoản" (red). On confirm: call `DELETE /api/v1/account` → clear local data → `authStore.logout()` → toast "Tài khoản đã được xóa" → redirect to guest Home
  - [x] All 3 actions: `accessibilityRole="button"`, confirmation dialogs accessible to screen readers

- [x] Task 7: Wire settings through dataStore → storageAdapter (AC: 2)
  - [x] `dataStore.syncPreferences()` should call `PUT /api/v1/settings/preferences` when authenticated, or write via storageAdapter when guest
  - [x] On screen mount, load preferences from `dataStore.preferences` via `fetchPreferences`

- [x] Task 8: Write tests (frontend static analysis)
  - [x] `tests/story-4-8.test.mjs` with node --test
  - [x] Test profile.tsx conditional render (guest → LoginScreen, authenticated → settings)
  - [x] Test preference sections reference debounced save
  - [x] Test destructive actions reference confirmation alerts
  - [x] Test delete account calls DELETE /api/v1/account

## Dev Notes

### Current State

`profile.tsx` has:
- Auth state check → shows `LoginScreen` when guest, placeholder text when authenticated
- Placeholder: `<Text>Profile settings placeholder — expanded in Story 4.8</Text>`
- This component needs to be significantly expanded

### Component Sizing Warning

This is a large story (8 settings sections). Suggested split:
- **Story 4.8a** (this story): Dietary Preferences + Allergies + Disliked Ingredients + Preferred Cuisines (4 preference sections) + measurement toggle + theme toggle
- **Story 4.8b**: Notifications section + Privacy section (3 destructive actions)

If implementing as one story, focus on getting all UI sections rendered first, then wire data flow.

### Existing Store Methods

`dataStore.ts` has:
- `syncPreferences(prefs: Partial<UserPreference>)` — currently stub/console.log
- `preferences: UserPreference | null` — current state
- `clearSearchHistory()` — exists
- No `clearAllFavorites()` — may need to add

`authStore.ts` has:
- `logout()` — clears auth state, calls logout API, clears data
- After delete account, call `authStore.logout()` to clear local state

### Backend API

- `GET /api/v1/settings/preferences` — get all preferences
- `PUT /api/v1/settings/preferences` — partial update (merge)
- `DELETE /api/v1/account` — delete account (Story 4.7)

### UI Pattern

Use `ScrollView` with sections. Each section is a `View` with:
- Section header: `<Text style={styles.sectionTitle}>{t('settings.dietary')}</Text>`
- Content: chips, toggles, or action rows
- Separator: `<View style={styles.divider} />`

Chip component pattern (see existing `Chip`):
```typescript
<Pressable
  key={option}
  style={[styles.chip, selected && styles.chipSelected]}
  onPress={() => handleToggle(option)}
  accessibilityRole="button"
  accessibilityState={{ selected }}
>
  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option}</Text>
</Pressable>
```

### i18n Keys Needed

Add to `frontend/lib/i18n.ts`:
- `settings.greeting` = "Xin chào, {name}!"
- `settings.dietary` = "Chế độ ăn uống"
- `settings.allergies` = "Dị ứng"
- `settings.disliked` = "Món không thích"
- `settings.cuisines` = "Ẩm thực yêu thích"
- `settings.units` = "Đơn vị đo lường"
- `settings.units.metric` = "Metric"
- `settings.units.imperial` = "Imperial"
- `settings.theme` = "Giao diện"
- `settings.theme.light` = "Sáng"
- `settings.theme.dark` = "Tối"
- `settings.theme.deferred` = "Chế độ tối sẽ có trong phiên bản tiếp theo"
- `settings.notifications` = "Thông báo"
- `settings.privacy` = "Quyền riêng tư"
- `settings.clearHistory` = "Xóa lịch sử tìm kiếm"
- `settings.clearHistory.confirm` = "Bạn có chắc chắn muốn xóa toàn bộ lịch sử tìm kiếm?"
- `settings.clearHistory.done` = "Đã xóa lịch sử tìm kiếm"
- `settings.clearFavorites` = "Xóa tất cả Yêu thích"
- `settings.clearFavorites.done` = "Đã xóa tất cả Yêu thích"
- `settings.deleteAccount` = "Xóa tài khoản"
- `settings.deleteAccount.confirm1` = "Bạn có chắc chắn?"
- `settings.deleteAccount.confirm2` = "Thao tác này không thể hoàn tác. Tài khoản của bạn sẽ bị xóa vĩnh viễn."
- `settings.deleteAccount.done` = "Tài khoản đã được xóa"

### Testing

Static-analysis tests in `frontend/tests/story-4-8.test.mjs`.
Pattern: check source files for key patterns (component structure, API calls, toast usage).

### Project Structure Notes

- Profile screen is already at `frontend/app/(tabs)/profile.tsx` — no new screens
- Settings are accessed within the profile tab (not a separate route)
- Consistency: match styling and patterns from HomeScreen

### References

- [Source: `frontend/app/(tabs)/profile.tsx`] — current placeholder
- [Source: `frontend/stores/dataStore.ts`] — preferences state, syncPreferences stub
- [Source: `frontend/stores/authStore.ts`] — logout() for account deletion
- [Source: `frontend/lib/i18n.ts`] — i18n catalog
- [Source: `frontend/lib/tokens.ts`] — design tokens
- [Source: `frontend/stores/storageAdapter.ts`] — storage routing

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Code Review (2026-06-17)

- 3 review layers run (Blind Hunter, Edge Case Hunter, Acceptance Auditor)
- 18 patch findings all applied, 3 deferred (token refresh pattern, API_BASE port inconsistency, test philosophy), 1 dismissed (imperial conversion out-of-scope)
- Key fixes: optimistic UI (immediate setState + debounced sync), dark mode toggle wired, account deletion loading guard, case-insensitive dedup, max-length guard, search-history cloud deletion, response.ok checks, PUT serialization, oklchToRgba hoisting, 3 new tests
- 44/44 tests pass

### Completion Notes List

- Fully implemented authenticated profile.tsx with 8 settings sections (Dietary, Allergies, Disliked, Cuisines, Units, Theme, Notifications, Privacy)
- 500ms debounced preference save via syncPreferences → PUT /api/v1/settings/preferences
- fetchPreferences + fetchPreferences action in dataStore for on-mount loading
- clearAllFavorites action in dataStore
- 41 static-analysis tests for story 4.8
- Updated story-4-2.test.mjs placeholder check to match new profile.tsx
- 161/161 frontend tests pass

### File List

#### Modified

- `frontend/app/(tabs)/profile.tsx` — full settings screen implementation with greeting card, 8 sections, debounced save, account deletion
- `frontend/stores/dataStore.ts` — fetchPreferences, updated syncPreferences, clearAllFavorites, preferencesStatus
- `frontend/lib/i18n.ts` — 31 new settings-related translation keys (vi + en)
- `frontend/tests/story-4-2.test.mjs` — updated placeholder test to match new profile.tsx

#### Created

- `frontend/tests/story-4-8.test.mjs` — 41 static analysis tests

#### Unchanged

- `frontend/stores/authStore.ts` — logout() already exists, used by account deletion
- `frontend/stores/uiStore.ts` — addToast already exists
- `frontend/components/LoginScreen.tsx` — already rendered by profile.tsx when guest

### Review Findings

- [x] [Review][Patch] Dark mode toggle non-functional / theme value mismatch [frontend/app/(tabs)/profile.tsx:186-195,414]
- [x] [Review][Patch] Debounce race — stale state reads + no optimistic UI [frontend/app/(tabs)/profile.tsx:125-204]
- [x] [Review][Patch] Account deletion lacks loading guard / no catch [frontend/app/(tabs)/profile.tsx:260-278]
- [x] [Review][Patch] Text input cleared before sync completes [frontend/app/(tabs)/profile.tsx:136-142,152-158]
- [x] [Review][Patch] fetchPreferences has no error feedback [frontend/app/(tabs)/profile.tsx:84-88]
- [x] [Review][Patch] oklchToRgba recomputed on every render [frontend/app/(tabs)/profile.tsx:291,397-400,413]
- [x] [Review][Patch] syncPreferences never checks response.ok [frontend/stores/dataStore.ts:416-434]
- [x] [Review][Patch] Concurrent syncPreferences PUTs race [frontend/stores/dataStore.ts:416-434]
- [x] [Review][Patch] Account-deletion toast on unmounting screen [frontend/app/(tabs)/profile.tsx:275]
- [x] [Review][Patch] clearAllFavorites shows success even on API failure [frontend/stores/dataStore.ts:341-358]
- [x] [Review][Patch] Case-insensitive dupes in allergy/disliked [frontend/app/(tabs)/profile.tsx:136-142,152-158]
- [x] [Review][Patch] No max-length guard on allergy/disliked input [frontend/app/(tabs)/profile.tsx:333-339,356-362]
- [x] [Review][Patch] PlaceholderAvatar empty initials for whitespace [frontend/app/(tabs)/profile.tsx:43-55]
- [x] [Review][Patch] Clear Search History missing cloud deletion (AC5) [frontend/stores/dataStore.ts:339-341]
- [x] [Review][Patch] Light mode toggle debounced, not immediate (AC4) [frontend/app/(tabs)/profile.tsx:186-195]
- [x] [Review][Patch] Tests: cloud-deletion gap (AC5) [frontend/tests/story-4-8.test.mjs:98-100]
- [x] [Review][Patch] Tests: double-confirmation gap (AC6) [frontend/tests/story-4-8.test.mjs:106-108]
- [x] [Review][Patch] Tests: redirect path gap (AC6) [frontend/tests/story-4-8.test.mjs:106-108]
- [x] [Review][Defer] No token refresh/re-auth pattern — deferred, pre-existing architecture pattern
- [x] [Review][Defer] EXPO_PUBLIC_API_BASE_URL port inconsistency (8080 vs 3000) — deferred, pre-existing across all stores
- [x] [Review][Defer] Tests verify string presence not behavior — deferred, by design for static-analysis tests
