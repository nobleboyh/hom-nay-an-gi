# Story 4.1: Auth API Module

Status: done

## Story

As a **user**,
I want to register and log in with email or Google,
So that my favorites and preferences sync across devices.

## Acceptance Criteria

1. **Given** `POST /api/v1/auth/register`, **When** called with `{ email, password (min 8 chars), displayName }`, **Then** Creates user with bcrypt hashed password (12 rounds), returns `{ user, tokens: { accessToken, refreshToken } }`. Duplicate email returns 409 `{ code: "EMAIL_EXISTS" }`.
2. **Given** `POST /api/v1/auth/login`, **When** called with `{ email, password }`, **Then** Verifies bcrypt hash, returns JWT access token (15min expiry) + refresh token (30d expiry). Invalid credentials returns 401 `{ code: "AUTH_INVALID_CREDENTIALS" }`.
3. **Given** `POST /api/v1/auth/google`, **When** called with `{ idToken }`, **Then** Verifies Google token server-side via `google-auth-library`, creates user if new, returns JWT tokens. Invalid Google token returns 401.
4. **Given** `POST /api/v1/auth/refresh`, **When** called with `{ refreshToken }`, **Then** Issues new access token if refresh token is valid and not revoked. Expired/revoked returns 401.
5. **Given** `POST /api/v1/auth/logout`, **When** called with valid auth header, **Then** Adds access token to Redis blocklist (TTL = remaining token lifetime), invalidates refresh token (removes from Redis). Returns 200.
6. **Given** registration, **When** email already exists, **Then** Returns 409 `{ code: "EMAIL_EXISTS" }`.
7. **Given** any auth endpoint without valid auth (for protected operations), **When** called, **Then** Returns 401.

## Tasks / Subtasks

- [x] Task 1: Update shared config and middleware (AC: 1-6)
  - [x] Add env vars to `backend/packages/shared/src/config/env.ts`
  - [x] Update `backend/packages/shared/src/common/middleware/authenticate.ts` — jsonwebtoken, Redis blocklist, stub mode, new exports
  - [x] Add `jsonwebtoken` + `@types/jsonwebtoken` to `backend/packages/shared/package.json` dependencies
  - [x] Update `backend/packages/shared/src/index.ts` exports to include new authenticate utilities

- [x] Task 2: Create `backend/apps/express-api/src/api/auth/authValidation.ts` — Zod schemas (AC: 1-4)

- [x] Task 3: Create `backend/apps/express-api/src/api/auth/authService.ts` — business logic (AC: 1-6)

- [x] Task 4: Create `backend/apps/express-api/src/api/auth/authController.ts` — request parsing (AC: 1-6)

- [x] Task 5: Create `backend/apps/express-api/src/api/auth/authRouter.ts` — routes (AC: 1-6) + rate limiter

- [x] Task 6: Update `backend/apps/express-api/src/server.ts` — mount auth router (AC: 1-6)

- [x] Task 7: Add dependencies (AC: 1-6)

- [x] Task 8: Create auth-specific rate limiter (AC: 7) — included in authRouter.ts

- [x] Task 9: Write tests `backend/apps/express-api/tests/api/auth/authRouter.test.ts` (AC: 1-7)
  - Register success: POST `/api/v1/auth/register` with valid `{ email, password, displayName }` → 201 + `{ success: true, data: { user, tokens } }`
  - Register duplicate email: same email twice → 409 `{ error: { code: "EMAIL_EXISTS" } }`
  - Register invalid: missing password → 400 validation error
  - Login success: POST `/api/v1/auth/login` with valid credentials → 200 + `{ success: true, data: { user, tokens } }`
  - Login invalid credentials: wrong password → 401 `{ error: { code: "AUTH_INVALID_CREDENTIALS" } }`
  - Login non-existent: unknown email → 401
  - Google auth: POST `/api/v1/auth/google` with valid idToken → 200 (mock google-auth-library)
  - Google auth invalid: bogus idToken → 401
  - Token refresh: POST `/api/v1/auth/refresh` with valid refresh token → 200 + new access token
  - Token refresh expired: expired refresh token → 401
  - Logout: POST `/api/v1/auth/logout` with valid auth → 200
  - Logout no auth: no auth header → 401
  - Rate limit: 6 rapid login requests → 429 on 6th

## Dev Notes

### Story Foundation

- This is the **first story of Epic 4**. No previous Epic 4 stories exist. The auth infrastructure must be built from existing Epic 1 foundations.
- Story 4.2 (LoginScreen) and Story 4.3 (AuthStore + StorageAdapter) depend on this story being complete.
- Epic 1 stories completed the following relevant foundations:
  - Story 1.2: Express 5.1.0 boilerplate, Zod 4.1.12, ioredis 5.8.2, Vitest 4.0.7, Mongoose 8.19.1
  - Story 1.7: User, UserPreference, Favorite, SearchHistory Mongoose models with schemas
  - Story 1.8: Common middleware (authenticate, validate, rateLimiter, errorHandler, requestLogger), ServiceResponse envelope, error classes (AppError, AuthenticationError, NotFoundError, etc.), Redis config, env config
  - Story 1.9: Zustand store scaffolds, CI/CD workflows

### Existing Auth Infrastructure (must understand before implementing)

1. **`backend/packages/shared/src/common/middleware/authenticate.ts`**:
   - Has custom HMAC-based JWT implementation (`signJwt`, `verifyJwt`)
   - Has stub mode for dev (checks `x-user-id` header when `JWT_SECRET` is default)
   - Currently does NOT check Redis blocklist
   - **This must be updated**: Add Redis blocklist check; use `jsonwebtoken` library for signing/verifying in real mode; keep stub mode for dev

2. **`backend/packages/shared/src/models/User.ts`**:
   - Fields: `email` (unique+sparse, lowercase), `passwordHash`, `googleId` (unique+sparse), `displayName`, `authProvider` (email|google), `createdAt`, `updatedAt`, `lastLoginAt`, `deletedAt`
   - TTL index on `deletedAt` (30d auto-delete after soft-delete)
   - Email normalization in pre-save hook (lowercase+trim)
   - **No changes needed** — schema already supports all auth flows

3. **`backend/packages/shared/src/config/env.ts`**:
   - Has `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `REDIS_URI`, `MONGO_URI`
   - Must add: `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY`

4. **`backend/packages/shared/src/config/redis.ts`**:
   - ioredis client with lazyConnect, retry strategy
   - Exported as `redis` — importable in authenticate middleware
   - **No changes needed** — but authenticate middleware currently doesn't import it; must add import

5. **`backend/packages/shared/src/common/utils/errors.ts`**:
   - `AuthenticationError` class accepts `(message)` or `(code, statusCode, message)` overloads
   - Can construct as `new AuthenticationError("AUTH_INVALID_CREDENTIALS", 401, "Email or password is incorrect")`
   - **No changes needed**

6. **`backend/packages/shared/src/common/utils/apiResponse.ts`**:
   - `buildSuccessResponse(data)` → `{ success: true, data }`
   - `buildErrorResponse(code, message)` → `{ success: false, error: { code, message } }`
   - **No changes needed**

7. **`backend/packages/shared/src/common/models/serviceResponse.ts`**:
   - `ServiceResponse.success(data, requestId)` — full meta envelope (used in controllers)
   - `ServiceResponse.failure(code, message, requestId, details?)` — error envelope
   - Use in controllers for consistent response format

### Route → Controller → Service Pattern

Follow the established pattern from `backend/apps/express-api/src/api/recipes/`:

```
authRouter.ts      — defines routes, applies middleware (validate, authenticate, rateLimiter)
authController.ts  — extracts request data, calls service, formats response via ServiceResponse
authService.ts     — business logic, throws AppError/AuthenticationError on failure
authValidation.ts  — Zod schemas for request body validation
```

Pattern references:
- Router: `recipesRouter.ts` — uses `Router()`, `authenticate` middleware (JIT), `validate` for body
- Controller: `recipesController.ts` — uses `asyncHandler` wrapper, extracts `validated` from `req`, calls service, returns `ServiceResponse.success()`
- Service: `recipesService.ts` — async functions, throws `NotFoundError` etc. on failure
- Validation: `validateQuery.ts` — Zod schemas (note: auth uses `validate()` for body, not `validateQuery()`)

### Redis Key Patterns for Auth

```
blocklist:{jti}            — SET with TTL = remaining access token lifetime (seconds)
refresh_tokens:{userId}    — SET containing refresh token jtis for this user
refresh_token:{jti}        — STRING with TTL = configured refresh token expiry (30d)
```

On login/register: store refresh token jti in both `refresh_tokens:{userId}` set and `refresh_token:{jti}` key.
On logout: add access token jti to blocklist, delete `refresh_token:{jti}`, remove jti from `refresh_tokens:{userId}`.
On refresh: verify refresh token jti exists in Redis → delete old jti → issue new refresh token.
On authenticate: check if token's `jti` exists in blocklist → reject if found.

### Redis Blocklist in authenticate Middleware

The authenticate middleware at `backend/packages/shared/src/common/middleware/authenticate.ts` must:

1. After verifying JWT signature and expiry, decode token to extract `jti` claim
2. Check Redis with `GET blocklist:{jti}` — if returns a value, throw `AuthenticationError("Token revoked")`
3. If Redis is unavailable, log warning and proceed (degraded behavior — don't block all requests if Redis is down)
4. Keep existing stub mode logic for dev

### Auth Rate Limiter

Create a separate in-memory limiter for auth endpoints:
- 5 requests per minute per IP for login
- Use same pattern as `createLimiter()` in `backend/packages/shared/src/common/middleware/rateLimiter.ts`
- Define in or alongside `authRouter.ts`
- Apply only to `POST /login` endpoint

Important: The auth rate limiter must be per-IP since there's no authenticated user yet during login. The existing `generalLimiter` falls back to `req.ip` when `req.user` is undefined, so it can work for pre-auth. But a stricter limit (5/min vs 100/min) is needed for login.

### Google OAuth Verification

Use `google-auth-library`'s `OAuth2Client.verifyIdToken()`:

```typescript
import { OAuth2Client } from "google-auth-library";
const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

async function verifyGoogleToken(idToken: string) {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  // payload.sub = Google account ID (unique)
  // payload.email = user's email
  // payload.name = user's display name
  return { googleId: payload.sub, email: payload.email, name: payload.name };
}
```

Use the `sub` claim as the unique Google account identifier (not email, since email can change). Store in User.googleId.

### JWT Token Structure

**Access Token (15min):**
```json
{
  "sub": "userId (MongoDB ObjectId)",
  "provider": "email | google",
  "jti": "uuid-v4",
  "iat": 1234567890,
  "exp": 1234568790
}
```

**Refresh Token (30d):**
```json
{
  "sub": "userId (MongoDB ObjectId)",
  "provider": "email | google",
  "jti": "uuid-v4",
  "iat": 1234567890,
  "exp": 1234567890 + 30d
}
```

### Architecture Compliance

- Auth module follows domain-per-module pattern: `backend/apps/express-api/src/api/auth/` with Route → Controller → Service → Validation. [Source: project-structure-boundaries.md]
- Use `jsonwebtoken` library (9.0.3) for JWT operations. [Source: Story 4.1 ACs]
- Error codes match architecture: `EMAIL_EXISTS` (409), `AUTH_INVALID_CREDENTIALS` (401), `AUTH_TOKEN_EXPIRED` (401), `AUTH_TOKEN_REVOKED` (401). [Source: core-architectural-decisions.md, API & Communication Patterns]
- API response envelope: `ServiceResponse.success()` or `ServiceResponse.failure()` with meta. [Source: architecture response format]
- Zod validation at the wall (in router via `validate()` middleware). [Source: architecture validation pattern]
- All new files use 2-space indent, no trailing whitespace. Run `biome format --write` after creating files. [Source: Story 1.7 dev notes]
- TypeScript strict mode: `verbatimModuleSyntax` — use `import type` for type-only imports. All imports use `.js` extension. [Source: `backend/tsconfig.json`]
- Barrel exports in shared: `export { X } from "./X.js"` pattern. [Source: Story 1.7 dev notes]

### Technical Requirements

- **bcrypt**: Use `bcrypt.hash(password, 12)` for registration, `bcrypt.compare(password, hash)` for login. 12 salt rounds as specified.
- **jsonwebtoken**: Use `jwt.sign(payload, secret, { expiresIn })` for generation, `jwt.verify(token, secret)` for verification. `expiresIn` values from env config (`15m`, `30d`).
- **google-auth-library**: Use `OAuth2Client.verifyIdToken()` for server-side Google token verification. Import `OAuth2Client` from `google-auth-library`.
- **Redis blocklist**: Access token blocklist key: `blocklist:{jti}` with TTL set to `tokenExp - now`. Refresh token storage: `refresh_token:{jti}` with TTL = configured refresh expiry.
- **Rate limiting**: Auth-specific limiter: 5 req/min/IP for login. Pattern matches `createLimiter()` from shared. Apply only to `POST /login`.
- **Testing**: Mock `bcrypt`, `jsonwebtoken`, `google-auth-library`, and Redis in tests. Use `supertest` for HTTP-level tests. Follow existing pattern from `recipesRouter.test.ts`.

### File Structure Requirements

**New files:**
- `backend/apps/express-api/src/api/auth/authRouter.ts`
- `backend/apps/express-api/src/api/auth/authController.ts`
- `backend/apps/express-api/src/api/auth/authService.ts`
- `backend/apps/express-api/src/api/auth/authValidation.ts`
- `backend/apps/express-api/tests/api/auth/authRouter.test.ts`

**Files that must be updated:**
- `backend/packages/shared/src/config/env.ts` — add `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY`
- `backend/packages/shared/src/common/middleware/authenticate.ts` — add Redis blocklist check, use jsonwebtoken, export token generation utils
- `backend/packages/shared/src/index.ts` — export new authenticate utilities (generateAccessToken, generateRefreshToken, generateJti)
- `backend/apps/express-api/src/server.ts` — mount authRouter
- `backend/apps/express-api/package.json` — add bcrypt, google-auth-library deps
- `backend/packages/shared/package.json` — add jsonwebtoken, @types/jsonwebtoken deps
- `.env.template` — add `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY`

**Files that must NOT be changed:**
- `backend/packages/shared/src/models/User.ts` — already correct
- `backend/packages/shared/src/config/redis.ts` — already configured
- `backend/packages/shared/src/common/utils/errors.ts` — AuthenticationError already exists
- `backend/packages/shared/src/common/utils/apiResponse.ts` — already correct
- `backend/packages/shared/src/common/models/serviceResponse.ts` — already correct
- `backend/packages/shared/src/common/middleware/rateLimiter.ts` — but DO reference `createLimiter` pattern for auth limiter

### Testing Requirements

- **Test location**: `backend/apps/express-api/tests/api/auth/authRouter.test.ts`
- **Test framework**: Vitest with `vi.mock()` for mocking
- **Test HTTP**: Use `supertest` to make HTTP requests against a test Express app
- **Mock strategy**:
  - Mock `authService.ts` functions (like recipesRouter.test.ts does)
  - Mock `bcrypt` for password hashing/comparison
  - Mock `jsonwebtoken` for token verification
  - Mock `google-auth-library` for Google token verification
  - Mock Redis (import `redis` from shared and mock its methods)
- **Test cases** (minimum):
  - Register: success (201), duplicate email (409), validation error (400)
  - Login: success (200), invalid credentials (401), non-existent user (401)
  - Google auth: success (200), invalid token (401)
  - Token refresh: valid (200), expired (401), revoked (401)
  - Logout: authenticated (200), no auth header (401)
  - Rate limiting: 6 rapid login requests → 429 on 6th
- **Test app pattern**: Follow `createApp()` pattern from `recipesRouter.test.ts`
- After tests pass: run `pnpm typecheck` and `pnpm lint` from backend root

### Google Cloud Console Setup Note

Before this story's endpoints work end-to-end in production, Google Cloud Console must be configured:
- Create OAuth 2.0 credentials (Web application type)
- Authorized redirect URIs: `https://auth.expo.io/@username/hom-nay-an-gi` and native scheme
- Enable Google Identity Platform API
- Set `GOOGLE_CLIENT_ID` in `.env`

This is documented as a separate task in the epic but is a prerequisite for the Google auth endpoint. For testing, mock `google-auth-library`.

### Review Findings (2026-06-16)

**Decision-needed (resolved):**
- [x] Google auth creates user with empty email — → Decision: Allow Google users without email. Fixed: omit email field when undefined.
- [x] Redis-down fallback skips revocation checks — → Decision: Keep fail-open. No code change needed.

**Patches (all applied):**
- [x] Refresh token hardcodes provider "email" — fixed: preserve provider from decoded token
- [x] Redis blocklist async race — fixed: use async/await instead of .then()
- [x] `expiresIn` type cast — fixed: cast as number (jsonwebtoken accepts both)
- [x] jwt.decode null/NaN in logout — fixed: null check + type guard
- [x] No `trust proxy` setting — fixed: added `app.set("trust proxy", 1)`
- [x] Test name/assertion mismatch — fixed: renamed test to match assertion
- [x] TOCTOU race on registration — fixed: try-catch for MongoServerError 11000
- [x] Unhandled Redis failures in storeRefreshToken — fixed: try-catch with error log
- [x] NotBeforeError not mapped — fixed: added NotBeforeError handling to catch block
- [x] refreshToken no user existence check — fixed: added User.findById check
- [x] Logout doesn't invalidate refresh token — fixed: controller passes refreshTokenStr to service
- [x] Refresh token not rotated — fixed: issue new refresh token, store it, return both
- [x] AUTH_INVALID_GOOGLE_TOKEN — fixed: changed to AUTH_INVALID_CREDENTIALS

**Deferred:**
- [x] In-memory rate limiter not shared across processes [authRouter.ts:14] — pre-existing architecture limitation

## Change Log

- Initial implementation. All 5 auth endpoints created, authenticate middleware updated, tests passing.
- Code review completed 2026-06-16: 2 decision-needed resolved, 13 patches applied, 1 deferred, 3 dismissed.

## Dev Agent Record

### Agent Model Used

deepseek-v4-flash-free (opencode/deepseek-v4-flash-free)

### Debug Log References

- authenticate middleware updated to use jsonwebtoken library with Redis blocklist check
- auth rate limiter uses module-level counters with exported resetAuthLimiter() for testing
- Shared package built before express-api tests can resolve

### Completion Notes List

- Implemented all 5 auth endpoints: register, login, googleAuth, refresh, logout
- Updated authenticate middleware: jsonwebtoken library, Redis blocklist, stub mode preserved
- Added env vars: JWT_REFRESH_SECRET, JWT_ACCESS_EXPIRY, JWT_REFRESH_EXPIRY
- Installed deps: bcrypt@6.0.0, google-auth-library, jsonwebtoken@9.0.3, zod@4.1.12 (express-api)
- Tests: 16 integration tests for auth router covering all ACs, passing
- Full regression suite: 102 tests passing, 12 skipped
- Typecheck: clean across all packages
- Lint: clean (biome, no errors)

### File List

- `backend/packages/shared/src/config/env.ts` — added JWT_REFRESH_SECRET, JWT_ACCESS_EXPIRY, JWT_REFRESH_EXPIRY
- `backend/packages/shared/src/common/middleware/authenticate.ts` — rewritten: jsonwebtoken, Redis blocklist, generateAccessToken, generateRefreshToken, generateJti, signJwt (backward compat)
- `backend/packages/shared/src/index.ts` — added exports for new auth utilities
- `backend/packages/shared/package.json` — added jsonwebtoken, @types/jsonwebtoken
- `backend/apps/express-api/src/api/auth/authRouter.ts` — new
- `backend/apps/express-api/src/api/auth/authController.ts` — new
- `backend/apps/express-api/src/api/auth/authService.ts` — new
- `backend/apps/express-api/src/api/auth/authValidation.ts` — new
- `backend/apps/express-api/src/server.ts` — mounted authRouter at /api/v1/auth
- `backend/apps/express-api/package.json` — added bcrypt, google-auth-library, jsonwebtoken, zod, type packages
- `backend/apps/express-api/tests/api/auth/authRouter.test.ts` — new (16 tests)
- `.env.template` — added new env vars
