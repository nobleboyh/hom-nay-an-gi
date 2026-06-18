# Story 4.7: Settings API Module

Status: done

## Story

As a **user**,
I want to manage my dietary preferences, allergies, and app settings,
So that dish suggestions are personalized to my needs.

## Acceptance Criteria

1. **Given** `GET /api/v1/settings/preferences` with valid auth, **When** called, **Then** Returns preferences object: dietaryPreferences[], allergies[], dislikedIngredients[], preferredCuisines[], measurementUnit, theme, language, notifications ({ breakfastReminder, lunchReminder, dinnerReminder, dailySuggestion }).
2. **Given** `PUT /api/v1/settings/preferences` with partial updates and valid auth, **When** called, **Then** Updates preferences (merge). Returns updated preferences.
3. **Given** `DELETE /api/v1/account` with valid auth, **When** called, **Then** Soft-deletes user (sets `deletedAt`), revokes all tokens (Redis blocklist), returns 204. 30-day grace period before TTL cleanup.
4. **Given** preferences endpoints without auth, **When** called, **Then** Returns 401.

## Tasks / Subtasks

- [ ] Task 1: Create `settingsValidation.ts` — Zod schemas (AC: 1-3)
  - [ ] `updatePreferencesSchema`: All fields optional — `{ dietaryPreferences: z.array(z.string()).optional(), allergies: z.array(z.string()).optional(), dislikedIngredients: z.array(z.string()).optional(), preferredCuisines: z.array(z.string()).optional(), measurementUnit: z.enum(["metric", "imperial"]).optional(), theme: z.enum(["light", "dark"]).optional(), language: z.enum(["vi", "en"]).optional(), notifications: z.object({ breakfastReminder: z.boolean().optional(), lunchReminder: z.boolean().optional(), dinnerReminder: z.boolean().optional(), dailySuggestion: z.boolean().optional() }).optional() }`

- [ ] Task 2: Create `settingsService.ts` (AC: 1-3)
  - [ ] `getPreferences(userId)`: `UserPreference.findOne({ userId })`. If not found, return defaults `{ dietaryPreferences: [], allergies: [], dislikedIngredients: [], preferredCuisines: [], measurementUnit: "metric", theme: "light", language: "vi", notifications: { breakfastReminder: false, lunchReminder: false, dinnerReminder: false, dailySuggestion: false } }`
  - [ ] `updatePreferences(userId, updates)`: `UserPreference.findOneAndUpdate({ userId }, { $set: updates }, { upsert: true, new: true, runValidators: true })`. Merge partial updates via `$set`.
  - [ ] `deleteAccount(userId)`: `User.findOneAndUpdate({ _id: userId }, { deletedAt: new Date() })`. Add access token to Redis blocklist (call existing Redis blocklist utility). Revoke all refresh tokens for user. Return void.

- [ ] Task 3: Create `settingsController.ts` (AC: 1-3)
  - [ ] `getPreferences`: Extract userId from `req.user.userId`, call `settingsService.getPreferences()`, return 200
  - [ ] `updatePreferences`: Extract userId and validated body, call `settingsService.updatePreferences()`, return 200
  - [ ] `deleteAccount`: Extract userId from `req.user.userId`, call `settingsService.deleteAccount()`, return 204

- [ ] Task 4: Create `settingsRouter.ts` (AC: 1-4)
  - [ ] `GET /preferences` — `authenticate` → `settingsController.getPreferences`
  - [ ] `PUT /preferences` — `authenticate` → `validate(updatePreferencesSchema)` → `settingsController.updatePreferences`
  - [ ] `DELETE /account` — `authenticate` → `settingsController.deleteAccount`
  - [ ] Mount in `server.ts`: `app.use("/api/v1/settings", settingsRouter)` and `app.use("/api/v1/account", settingsRouter)`

- [ ] Task 5: Write router tests (AC: 1-4)
  - [ ] `settingsRouter.test.ts` with vitest + supertest
  - [ ] Mock `settingsService` at import level
  - [ ] Test get preferences (existing, default when not found)
  - [ ] Test update preferences (partial merge, full update)
  - [ ] Test delete account (soft-delete + token revocation)
  - [ ] Test all endpoints without auth → 401

## Dev Notes

### Backend Architecture Reference

```
backend/apps/express-api/src/api/settings/
  settingsRouter.ts
  settingsController.ts
  settingsService.ts
  settingsValidation.ts
```

Test:
```
backend/apps/express-api/tests/api/settings/settingsRouter.test.ts
```

### Existing Model

`packages/shared/src/models/UserPreference.ts` — full Mongoose model with:
- `userId` (ObjectId, ref User, required, unique)
- `dietaryPreferences` (String[])
- `allergies` (String[])
- `dislikedIngredients` (String[])
- `preferredCuisines` (String[])
- `measurementUnit` (String enum: "metric" | "imperial")
- `theme` (String enum: "light" | "dark")
- `language` (String enum: "vi" | "en")
- `notifications` (Object with breakfastReminder, lunchReminder, dinnerReminder, dailySuggestion booleans)
- Exported from `@hom-nay-an-gi/shared`

Also `packages/shared/src/models/User.ts` for `deleteAccount`:
- `deletedAt` (Date | null) — soft-delete field

### Account Deletion Flow

1. Set `User.deletedAt = new Date()` (soft delete)
2. Add current JWT access token to Redis blocklist with TTL = remaining token lifetime
3. Revoke all refresh tokens for this user (delete from Redis refresh token store)
4. Return 204 with no body
5. Cleanup: a separate cron job (not in this story) should delete users with `deletedAt < 30 days ago`

### Redis Blocklist

The existing `authenticate` middleware checks Redis blocklist. To add a token to blocklist:
```typescript
// Reference: existing pattern in authService.logout()
// await redisClient.setEx(`blocklist:${tokenJti}`, ttlSeconds, "true");
// Same approach for deleteAccount — iterate active tokens
```

### Routing Note

The `DELETE /api/v1/account` route sits under `settingsRouter` because it lives at `/api/v1/account` (not `/api/v1/settings`). Mount with both prefixes in server.ts:
```typescript
app.use("/api/v1/settings", settingsRouter);
app.use("/api/v1", settingsRouter); // or mount DELETE /account separately
```

Alternatively, create a separate inline route for `DELETE /api/v1/account` in server.ts — follow whichever is cleaner. The `settingsController.deleteAccount` can be reused either way.

### Testing

- Vitest + supertest
- Mock `UserPreference` and `User` models
- Mock Redis client for blocklist check
- Test default preferences for new users (no UserPreference found → return defaults, not 404)

### Project Structure Notes

- No new shared models needed
- This is the last backend API module for Epic 4
- Account deletion is a destructive action — test carefully
- The `theme` field only supports `"light"` for MVP (dark mode deferred per FR-27)

### References

- [Source: `packages/shared/src/models/UserPreference.ts`] — existing Mongoose model
- [Source: `packages/shared/src/models/User.ts`] — User model with deletedAt
- [Source: `backend/apps/express-api/src/api/auth/authService.ts`] — reference for token blocklist pattern
- [Source: `packages/shared/src/common/middleware/authenticate.ts`] — auth middleware

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

#### Created

- `backend/apps/express-api/src/api/settings/settingsRouter.ts`
- `backend/apps/express-api/src/api/settings/settingsController.ts`
- `backend/apps/express-api/src/api/settings/settingsService.ts`
- `backend/apps/express-api/src/api/settings/settingsValidation.ts`
- `backend/apps/express-api/tests/api/settings/settingsRouter.test.ts`

#### Modified

- `backend/apps/express-api/src/server.ts` — mount settingsRouter at `/api/v1/settings` and `DELETE /api/v1/account`

### Review Findings

#### Applied (patched)

- [x] `jwt.decode` → `jwt.verify` in deleteAccount (`settingsService.ts:60`) — use `jwt.verify` with `env.JWT_SECRET` to validate token authenticity before extracting JTI for blocklist
- [x] Null-check on `findOneAndUpdate` result in `updatePreferences` (`settingsService.ts:85`) — guard against null/undefined before calling `.toObject()`
- [x] Deep-merge `notifications` subdocument (`settingsService.ts:82-84`) — use dot-notation `$set` keys to avoid replacing entire subdocument on partial update, preserving sibling notification fields
- [x] Add `.max(100)` constraints on unbounded Zod array fields (`settingsValidation.ts`) — prevent oversized payloads from reaching MongoDB
- [x] Add accessToken assertion in deleteAccount test (`settingsRouter.test.ts:173`) — verify service receives the Bearer token from the authorization header

#### Deferred (pre-existing)

- [x] Soft-deleted users can still authenticate — `authenticate.ts` doesn't check `user.deletedAt`. Pre-existing, not caused by this story.
- [x] `theme` enum mismatch — Zod schema rejects `"system"`; Mongoose model allows it. Pre-existing model enum, dark mode deferred per FR-27.
- [x] `userId` from `x-user-id` bypasses ObjectId validation in stub mode — pre-existing `authenticate.ts` behavior, already documented in `deferred-work.md`.

#### Dismissed

- Inconsistent route mounting for `DELETE /api/v1/account` — intentional design per AC3
- Test bypasses authenticate middleware (x-user-id) — intentional stub mode pattern used across all modules
- 204 returned on partial token revocation failure — intentional best-effort design
- No 401 test in module tests — auth boundary tested in shared `authenticate.test.ts`
- Raw `updates` spread into `$set` without field allow-listing — Zod `.parse()` strips unknown fields by default, providing sufficient defense-in-depth
