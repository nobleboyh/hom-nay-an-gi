# Epic 4: Accounts, Favorites & Personalization — Tài Khoản & Cá Nhân Hóa

**Goal:** Users register/login via email or Google, their data syncs across devices, they save favorite dishes, manage dietary preferences, allergens, measurement units, notifications, theme, and privacy — all with full Guest mode fallback. Meal-time reminder notifications keep users engaged.

**FRs covered:** FR-18 through FR-27 (10 FRs), NFR-14 (Notification Infrastructure)
**Backend:** `api/auth/`, `api/sync/`, `api/favorites/`, `api/settings/`, all Mongoose schemas
**Frontend:** LoginScreen, FavoritesScreen, Profile/Settings screens

## Story 4.1: Auth API Module

As a **user**,
I want to register and log in with email or Google,
So that my favorites and preferences sync across devices.

**Acceptance Criteria:**

- **Given** `POST /api/v1/auth/register`, **When** called with `{ email, password (min 8 chars), displayName }`, **Then** Creates user with bcrypt hashed password (12 rounds), returns `{ user, tokens: { accessToken, refreshToken } }`. Duplicate email returns 409.
- **Given** `POST /api/v1/auth/login`, **When** called with `{ email, password }`, **Then** Verifies bcrypt hash, returns JWT access token (15min expiry) + refresh token (30d expiry). Invalid credentials returns 401 `{ code: "AUTH_INVALID_CREDENTIALS" }`.
- **Given** `POST /api/v1/auth/google`, **When** called with `{ idToken }`, **Then** Verifies Google token server-side, creates user if new, returns JWT tokens. Invalid Google token returns 401.
- **Given** `POST /api/v1/auth/refresh`, **When** called with `{ refreshToken }`, **Then** Issues new access token if refresh token is valid and not revoked. Expired/revoked returns 401.
- **Given** `POST /api/v1/auth/logout`, **When** called with valid auth header, **Then** Adds access token to Redis blocklist (TTL = remaining token lifetime), invalidates refresh token. Returns 200.
- **Given** registration, **When** email already exists, **Then** Returns 409 `{ code: "EMAIL_EXISTS" }`.

**Technical Tasks:**
- [ ] **Google Cloud Console setup**: Create OAuth 2.0 credentials in Google Cloud Console, configure redirect URI for Expo AuthSession (`https://auth.expo.io/@username/hom-nay-an-gi` and native scheme), enable Google Identity Platform API. Document in `backend/README.md` with screenshots.
- [ ] Create `backend/src/api/auth/authRouter.ts` — routes: `POST /register`, `POST /login`, `POST /google`, `POST /refresh`, `POST /logout`
- [ ] Create `backend/src/api/auth/authController.ts` — request parsing, validate middleware, response formatting
- [ ] Create `backend/src/api/auth/authService.ts` — `register()`, `login()`, `googleAuth()`, `refreshToken()`, `logout()`. bcrypt (12 rounds). JWT sign with `jsonwebtoken`. Google token verification.
- [ ] Create `backend/src/api/auth/authValidation.ts` — Zod schemas: `registerSchema`, `loginSchema`, `googleAuthSchema`, `refreshSchema`
- [ ] Implement Redis session management: store refresh tokens, add to blocklist on logout, check blocklist in authenticate middleware
- [ ] Implement rate limiting for auth endpoints: 5 attempts per minute per IP for login
- [ ] Write tests: register success/duplicate, login success/invalid, google auth, token refresh, logout blocklist

---

## Story 4.2: LoginScreen

As a **user**,
I want a clean login screen with email, Google, and guest options,
So that I can choose how to use the app.

**Acceptance Criteria:**

- **Given** the LoginScreen (Cá nhân tab), **When** I open it as a guest, **Then** I see: "Hôm Nay Ăn Gì" branding, BenefitsCard (accent-tinted: sync favorites, smarter suggestions, saved shopping lists), email input, password input (masked), "Đăng nhập" primary button, "Tiếp tục với Google" secondary button, "Tiếp tục mà không đăng nhập" ghost button, "Đăng ký" text link.
- **Given** empty email/password, **When** I tap "Đăng nhập", **Then** Shows inline error "⚠️ Vui lòng nhập email và mật khẩu" with `aria-invalid` on both fields.
- **Given** valid credentials, **When** login succeeds, **Then** Toast "✅ Đăng nhập thành công!", redirect to Home tab after 800ms.
- **Given** invalid credentials, **When** login fails (401), **Then** Persistent inline error "Email hoặc mật khẩu không đúng" with `aria-invalid` (not only toast).
- **Given** Google OAuth button, **When** tapped, **Then** Triggers Expo AuthSession → Google sign-in → same success flow.
- **Given** "Tiếp tục mà không đăng nhập", **When** tapped, **Then** Toast "👋 Tiếp tục với tư cách khách", redirects to Home after 500ms.
- **Given** "Đăng ký" link, **When** tapped, **Then** Toast "📝 Chức năng đăng ký sẽ có trong phiên bản tiếp theo" (deferred).
- **Given** login loading/rate-limited/offline states, **When** those occur, **Then** Spinner + disabled button, rate-limit toast + 5min disable, offline inline message.

**Technical Tasks:**
- [ ] Implement LoginScreen within `frontend/app/(tabs)/profile.tsx` — conditional render based on `authStore.authState`
- [ ] Wire email InputField with non-empty + email format validation
- [ ] Wire password InputField with `secureTextEntry`, min 8 chars validation
- [ ] Wire "Đăng nhập" Button — calls `authStore.login()`, handles loading/error/rate-limit states
- [ ] Wire "Tiếp tục với Google" Button — Expo AuthSession integration
- [ ] Wire "Tiếp tục mà không đăng nhập" ghost button — Toast "👋 Tiếp tục với tư cách khách", redirect after 500ms
- [ ] Wire "Đăng ký" link — route to waitlist/info screen explaining feature timeline (not dead-end toast)
- [ ] Wire BenefitsCard with static login benefits content
- [ ] Implement inline error display with `aria-invalid` on offending fields
- [ ] Implement 5 UX states (explicitly defined in ACs): loading (spinner + disabled button), error (inline error on fields), offline (inline message "Không có kết nối"), rate-limited (toast + button disabled 5 min), success (redirect)
- [ ] **Accessibility**: Skip nav link ("Bỏ qua điều hướng → #main-content"), `h1` for "Hôm Nay Ăn Gì" branding, `role="main"` on content region, `<form>` semantics with `aria-labelledby`, each InputField with proper `accessibilityLabel`, BenefitsCard as `complementary` landmark

---

## Story 4.3: AuthStore + StorageAdapter

As a **developer**,
I want Zustand auth state management with transparent storage routing between guest (SQLite) and authenticated (API),
So that the app seamlessly transitions between modes.

**Acceptance Criteria:**

- **Given** the `authStore`, **When** the app starts, **Then** `authState` is `'loading'` while checking secure storage for tokens, then resolves to `'guest'` (no token) or `'authenticated'` (valid token).
- **Given** `authStore.login({ email, password })`, **When** called, **Then** Calls API → stores tokens in `expo-secure-store` → sets `authState = 'authenticated'` → triggers sync POST → returns user.
- **Given** `authStore.loginWithGoogle()`, **When** called, **Then** Expo AuthSession → Google idToken → API → same token storage + state transition.
- **Given** `authStore.logout()`, **When** called, **Then** Calls logout API → clears secure storage → sets `authState = 'guest'` → `dataStore.clearData()`.
- **Given** `authStore.refreshToken()`, **When** 401 received, **Then** Calls refresh API → updates access token → retries original request. Refresh fails → logout.
- **Given** the `storageAdapter`, **When** `authState` is `'guest'`, **Then** All reads/writes target expo-sqlite. When `'authenticated'`, target `lib/api.ts`.
- **Given** auth state changes from guest → authenticated, **Then** Guest data sent to POST /api/v1/sync for merge → SQLite guest tables wiped after successful merge.

**Technical Tasks:**
- [ ] Finalize `frontend/stores/authStore.ts` — real `login()`, `loginWithGoogle()`, `logout()`, `refreshToken()`. Token lifecycle. Secure storage via `expo-secure-store`. Auth state check on app start.
- [ ] Finalize `frontend/stores/storageAdapter.ts` — Implement all CRUD operations: dishes, favorites, history, preferences, settings. Guest: SQLite. Authed: API via `lib/api.ts`.
- [ ] Create SQLite database initialization with all guest tables and indexes (including `shopping_lists_guest`)
- [ ] Implement data migration: `guestToAuthenticated()` → read guest tables → POST /api/v1/sync → on success, wipe guest tables and switch to API. On failure, keep guest data and retry with exponential backoff (1s, 3s, 9s, max 3 attempts). On total failure, stay in guest-write mode and surface error to user.
- [ ] Implement `authenticatedToGuest()` → clear local caches → fresh SQLite
- [ ] **Sync edge cases**: Handle partial sync failure (network drops mid-merge → rollback to previous state, no data loss), idempotency (duplicate sync requests produce same result), logout-during-sync (abort gracefully, clear pending queue), concurrent device conflict (server-authoritative `updatedAt` timestamp, not client clock — server stamps all records on receipt)
- [ ] Wire `authStore` into `api.ts` for automatic token injection and 401 refresh+retry logic
- [ ] Write tests: guest save→read, login flow state transitions, storageAdapter routing, token refresh cycle, partial sync failure recovery, duplicate sync idempotency

---

## Story 4.4: Favorites API Module

As a **user**,
I want to save dishes to my favorites and access them later,
So that I can quickly find dishes I liked.

**Acceptance Criteria:**

- **Given** `GET /api/v1/favorites?offset=0&limit=20` with valid auth, **When** called, **Then** Returns paginated list of saved dishes with dishId, dishData (name, nameEn, cuisine, cookTimeMinutes, caloriesPerServing, tags, imageDescription), savedAt (newest first).
- **Given** `POST /api/v1/favorites` with `{ dishId, dishData }` and valid auth, **When** called, **Then** Saves the dish. Returns 201. Duplicate dishId returns 409.
- **Given** `DELETE /api/v1/favorites/:favoriteId` with valid auth, **When** called, **Then** Removes the favorite. Returns 204. Non-existent or not-owned returns 404.
- **Given** any favorites endpoint without auth, **When** called, **Then** Returns 401.

**Technical Tasks:**
- [ ] Create `backend/src/api/favorites/favoritesRouter.ts` — routes: `GET /`, `POST /`, `DELETE /:favoriteId`, all with `authenticate` middleware
- [ ] Create `backend/src/api/favorites/favoritesController.ts` — request parsing, response formatting
- [ ] Create `backend/src/api/favorites/favoritesService.ts` — `list()` (paginated, sorted), `save()` (duplicate check), `remove()` (ownership check)
- [ ] Create `backend/src/api/favorites/favoritesValidation.ts` — `saveFavoriteSchema`
- [ ] Write router tests: list with pagination, save new/duplicate, remove own/not-owned, unauthorized

---

## Story 4.5: Sync API Module

As a **user**,
I want my guest data to merge with my account when I log in,
So that nothing I did as a guest is lost.

**Acceptance Criteria:**

- **Given** `POST /api/v1/sync` with `{ deviceId, favorites[], history[], preferences, lastSyncAt }` and valid auth, **When** called for first-time merge, **Then** Guest favorites merged into cloud. **Conflict resolution**: Server-authoritative `updatedAt` timestamps (server stamps its own clock on receipt — never trust client clock). For dishId collisions, compare server `updatedAt` vs the timestamp when the client last synced that record (stored in `lastSyncAt` map per dishId). Guest history imported. Preferences applied if user has none. Returns merged state.
- **Given** `POST /api/v1/sync` with `{ deviceId, lastSyncAt, changes? }` and valid auth, **When** called for incremental sync, **Then** Returns only records changed since `lastSyncAt`. Supports delta for favorites, history, preferences, settings (theme, measurement unit, notification preferences).
- **Given** sync without auth, **When** called by a guest, **Then** Returns 401.
- **Given** a sync payload exceeds 5MB, **When** called, **Then** Returns 413 `{ code: "PAYLOAD_TOO_LARGE" }`. Client should batch large syncs into multiple requests.
- **Given** sync is client-initiated only, **When** changes made on device B, **Then** Device A does not receive them until the user triggers a refresh on Device A. This limitation is documented in the app's sync behavior notice.

**Technical Tasks:**
- [ ] Create `backend/src/api/sync/syncRouter.ts` — route: `POST /`
- [ ] Create `backend/src/api/sync/syncController.ts` — request parsing, response formatting, 413 payload size check (5MB limit)
- [ ] Create `backend/src/api/sync/syncService.ts` — `mergeGuestData()`: detect first vs incremental, merge with server-authoritative conflict resolution (server stamps own clock, compares against per-dishId `lastSyncAt`), return full state. `deltaSync()`: return changes since timestamp for favorites, history, preferences, settings.
- [ ] Create `backend/src/api/sync/syncValidation.ts` — `syncPayloadSchema` with `maxPayloadSize` validation
- [ ] Write tests: first-time merge, incremental delta, conflict resolution (server-authoritative timestamp), empty guest data, unauthorized, 413 on oversized payload

---

## Story 4.6: FavoritesScreen

As a **user**,
I want to browse, search, and manage my saved dishes,
So that I can quickly find and revisit my favorite recipes.

**Acceptance Criteria:**

- **Given** the FavoritesScreen (Tab 3 — Yêu thích), **When** I tap the tab, **Then** I see: search input with 🔍 icon, list of FavoriteItem cards (thumbnail, dish name, cook time, calories, cuisine chips, filled-heart remove). Sorted newest first. Supports infinite scroll via `onEndReached` pagination (offset/limit, 20 per page) — NOT just first-page-only.
- **Given** I type in the search input, **When** text is entered, **Then** The list filters client-side in real time by matching dish name or cuisine. Debounced at 300ms to prevent jank with large lists. For 200+ favorites, filter is applied to the already-loaded dataset.
- **Given** I tap the filled-heart on a favorite, **When** pressed, **Then** Remove animation (scale-down + fade-out, 200ms) → item removed → Toast "Đã xóa khỏi Yêu thích". API call (authed) or SQLite delete (guest).
- **Given** no favorites exist, **When** list is empty, **Then** EmptyState: heart icon, "Chưa có món yêu thích", CTA "Khám phá món ngay" → Discover tab.
- **Given** search yields no results, **When** filter matches nothing, **Then** Distinct empty state: "Không tìm thấy món nào".
- **Given** recipe data has been updated on the server, **When** viewing a saved favorite, **Then** A subtle staleness indicator (small "Đã cập nhật" badge) appears if `dishData.updatedAt` > `savedAt`. User can tap to refresh to latest recipe data.
- **Given** loading/error/offline states, **When** those occur, **Then** Skeleton cards, error toast + retry, offline cached favorites.

**Technical Tasks:**
- [ ] Implement `frontend/app/(tabs)/favorites.tsx` — FavoritesScreen with full layout
- [ ] Wire search InputField — client-side filter by name/cuisine, debounced at 300ms
- [ ] Wire FavoriteItem list — from `dataStore.favorites`, sorted by savedAt descending
- [ ] Wire infinite scroll — FlatList `onEndReached` loads next page (offset/limit, 20 per page) via `dataStore.fetchFavorites({ offset, limit })`
- [ ] Wire filled-heart remove — Animated API scale+fade (200ms), toast, API/SQLite call
- [ ] Wire staleness indicator — compare `dishData.updatedAt` vs `savedAt`, show "Đã cập nhật" badge if server data is newer
- [ ] Implement "no favorites" EmptyState with CTA to Discover tab
- [ ] Implement "no search matches" EmptyState with distinct messaging
- [ ] Wire `dataStore.fetchFavorites()` on screen focus
- [ ] Implement 5 UX states: loading, empty (no favorites), empty (no matches), error, offline, success
- [ ] Add accessibility: list structure, remove button with `accessibilityLabel="Xóa {name} khỏi yêu thích"`

---

## Story 4.7: Settings API Module

As a **user**,
I want to manage my dietary preferences, allergies, and app settings,
So that dish suggestions are personalized to my needs.

**Acceptance Criteria:**

- **Given** `GET /api/v1/settings/preferences` with valid auth, **When** called, **Then** Returns preferences object: dietaryPreferences[], allergies[], dislikedIngredients[], preferredCuisines[], measurementUnit, theme, language, notifications ({ breakfastReminder, lunchReminder, dinnerReminder, dailySuggestion }).
- **Given** `PUT /api/v1/settings/preferences` with partial updates and valid auth, **When** called, **Then** Updates preferences (merge). Returns updated preferences.
- **Given** `DELETE /api/v1/account` with valid auth, **When** called, **Then** Soft-deletes user (sets deletedAt), revokes all tokens (Redis blocklist), returns 204. 30-day grace period before TTL cleanup.
- **Given** preferences endpoints without auth, **When** called, **Then** Returns 401.

**Technical Tasks:**
- [ ] Create `backend/src/api/settings/settingsRouter.ts` — routes: `GET /preferences`, `PUT /preferences`, all with `authenticate`. Account route: `DELETE /api/v1/account` with `authenticate`.
- [ ] Create `backend/src/api/settings/settingsController.ts` — request parsing, response formatting
- [ ] Create `backend/src/api/settings/settingsService.ts` — `getPreferences()`, `updatePreferences()` (partial merge), `deleteAccount()` (soft-delete + token revocation)
- [ ] Create `backend/src/api/settings/settingsValidation.ts` — `updatePreferencesSchema` (all fields optional)
- [ ] Create account deletion controller/service: soft-delete User, cascade revoke tokens, return 204
- [ ] Write router tests: get/update preferences, partial update, unauthorized, delete account

---

## Story 4.8: Profile/Settings Screens

> **⚠️ Sizing Note:** This story covers 8 settings sections with destructive actions — plan as 2-3 sprint items. Suggested split: **(4.8a)** Dietary Preferences + Allergies + Disliked Ingredients + Preferred Cuisines (4 preference sections), **(4.8b)** Measurement Units + Theme + Notifications (3 toggle sections), **(4.8c)** Privacy section (Clear History, Clear Favorites, Delete Account — all destructive actions with double-confirmation dialogs and API calls). Theme toggle is Light mode only for MVP (dark theme deferred per FR-27).

As a **user**,
I want to manage all my preferences in one place,
So that the app is personalized to my dietary needs, language, measurement unit, theme, and notification preferences.

**Acceptance Criteria:**

- **Given** the Profile/Settings screen (authenticated view of Cá nhân tab), **When** I'm logged in, **Then** I see: user greeting with display name, and sections — Dietary Preferences (multi-select chips), Allergies (add/remove chips), Disliked Ingredients (add/remove), Preferred Cuisines (multi-select), Measurement Units (toggle), Theme (light mode — dark theme deferred post-MVP), Notifications (4 toggles), Privacy section (Clear History, Clear Favorites, Delete Account — all with confirmation dialogs).
- **Given** I toggle a preference, **When** changed, **Then** Saved immediately via PUT with debounce (500ms). Chip/toggle shows active state. Preferences sync to server and propagate to other devices on next sync.
- **Given** I toggle measurement to "Imperial", **When** changed, **Then** All quantities reflect imperial units immediately. Setting synced via `PUT /api/v1/settings/preferences`.
- **Given** I toggle theme, **When** changed, **Then** Light mode applies immediately. Dark mode shows toast "Chế độ tối sẽ có trong phiên bản tiếp theo" (deferred per FR-27).
- **Given** I tap "Clear Search History", **When** confirmation accepted, **Then** All history deleted (local + cloud). Toast confirms.
- **Given** I tap "Delete Account", **When** double confirmation accepted, **Then** Calls DELETE /api/v1/account → clears all local data → logs out → toast "Tài khoản đã được xóa" → redirects to guest Home.
- **Given** guest mode, **When** I view Cá nhân tab, **Then** LoginScreen shown instead of settings (Story 4.2).

**Technical Tasks:**
- [ ] Implement authenticated profile view within `frontend/app/(tabs)/profile.tsx` — conditional render based on `authStore.authState`
- [ ] **4.8a — Preference sections**: Create dietary preferences (multi-select chips), allergies (add/remove with InputField + Chip), disliked ingredients (add/remove), preferred cuisines (multi-select). Each saves immediately with 500ms debounce via `PUT /api/v1/settings/preferences`.
- [ ] **4.8b — Toggle sections**: Create measurement units toggle (Metric/Imperial — updates all quantity displays via dataStore), theme toggle (Light mode for MVP, dark mode shows deferred toast), notifications section (4 toggle switches, OS permission prompt via expo-notifications on first enable).
- [ ] **4.8c — Privacy section**: Clear Search History (confirmation Alert → API delete → toast), Clear Favorites (confirmation Alert → API delete → toast), Delete Account (double-confirmation Alert → API delete → clear local data → logout → toast → redirect). All 3 destructive actions with `accessibilityRole="button"`.
- [ ] Wire all settings through `dataStore` → storageAdapter → API (authed) or SQLite (guest preferences)
- [ ] **Settings sync**: Include settings (theme, measurement unit, notification preferences) in sync protocol (Story 4.5) so they propagate across devices
- [ ] Implement scrollable list with section headers
- [ ] Add accessibility: each section as labelled group, toggle switches with `accessibilityLabel` and `accessibilityRole="switch"`, destructive buttons with confirmation flow accessible to screen readers

---

## Story 4.9: Notification Infrastructure

As a **user**,
I want meal-time reminders as local notifications,
So that the app prompts me at configured times without requiring a server push infrastructure.

**Acceptance Criteria:**

- **Given** notification toggles in Settings (Story 4.8), **When** I enable "Nhắc bữa sáng" and set time to 7:00, **Then** A local notification is scheduled daily at 7:00 via `expo-notifications`. OS permission is requested on first enable.
- **Given** a scheduled notification, **When** it fires, **Then** It displays: title "Hôm Nay Ăn Gì", body "Đến giờ ăn sáng! Khám phá món ngon ngay.", tapping opens the app to HomeScreen.
- **Given** I disable a notification toggle, **When** toggled off, **Then** The scheduled notification is cancelled. No more notifications for that meal time.
- **Given** OS notification permissions are denied, **When** I toggle a notification on, **Then** An alert explains how to enable notifications in system settings. Toggle stays off until permissions granted.
- **Given** the daily suggestion notification, **When** enabled, **Then** A single daily notification at a user-chosen time suggests a random dish (Surprise Me style).

**Technical Tasks:**
- [ ] Install `expo-notifications` and configure notification handler in `app/_layout.tsx`
- [ ] Create `frontend/lib/notifications.ts` — `scheduleMealReminder(mealType, time)`, `cancelMealReminder(mealType)`, `scheduleDailySuggestion(time)`, `cancelDailySuggestion()`. Uses `expo-notifications` `scheduleNotificationAsync` with daily trigger.
- [ ] Implement OS permission request flow: `getPermissionsAsync()` → if denied, `requestPermissionsAsync()` → if denied again, show Alert with deep link to system settings (`Linking.openSettings()`)
- [ ] Wire notification functions into Story 4.8's notification toggle section
- [ ] Add `expo-notifications` plugin to `app.json`
- [ ] Write tests: schedule notification, cancel notification, permission denied fallback

---

## Story 4.10: Authenticated Favorites Route Regression Fix

As a **logged-in user**,
I want tapping save on a dish to persist to my account after login,
So that favorites work correctly across devices instead of failing against guest-only routes.

**Acceptance Criteria:**

- **Given** I am authenticated and tap save on a dish from Results or Recipe detail, **When** the favorite mutation is sent, **Then** the client calls `POST /api/v1/favorites` and never `POST /api/v1/favorites_guest`.
- **Given** I am authenticated and remove a saved dish, **When** the unsave mutation is sent, **Then** the client calls `DELETE /api/v1/favorites/:favoriteId` and never a guest-only route.
- **Given** the app has just transitioned from guest to authenticated, **When** I save a new favorite after login succeeds, **Then** route selection is based on current auth state and the authenticated collection mapping.
- **Given** a guest session, **When** I save or remove favorites, **Then** the app continues to use SQLite-backed guest storage without regression.
- **Given** the authenticated favorites API responds with success, **When** the mutation completes, **Then** the UI updates saved state and the Favorites screen reflects the change without requiring app restart.
- **Given** the authenticated favorites API responds with 401/404/409 or network failure, **When** the mutation completes, **Then** the app surfaces an error path, does not silently mark the item saved, and logs enough detail to debug route-selection failures.

**Technical Tasks:**
- [ ] Update `frontend/stores/dataStore.ts` so authenticated favorite save/remove flows use authenticated collection semantics instead of hard-coded `favorites_guest`
- [ ] Update `frontend/stores/storageAdapter.ts` to map logical favorites operations onto SQLite guest tables for guests and `/api/v1/favorites` for authenticated users
- [ ] Ensure `saveFavorite`, `removeFavorite`, and any optimistic UI state logic preserve correct `favoriteId` / `dishId` handling across guest and authenticated modes
- [ ] Add regression coverage proving authenticated mutations never call `/api/v1/favorites_guest` after login and guest mode still uses SQLite/local paths
- [ ] Verify post-login behavior from both Results and Recipe detail entry points
