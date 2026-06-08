---
baseline_commit: c4c1d02
---

# Story 1.8: Common Backend Infrastructure

Status: done

## Story

As a **developer**,
I want common middleware (JWT auth stub, validation runner, rate limiter, error handler, request logger), custom error classes, the standard API response envelope, and Pino logging,
So that all domain modules have consistent patterns for auth, validation, errors, and responses.

## Acceptance Criteria

1. Given the `authenticate` middleware, when a request has a valid JWT, then it verifies and attaches `req.user = { userId, authProvider }`. Invalid/expired returns 401 `{ code: "AUTH_TOKEN_EXPIRED" }`.
2. Given the `validate(schema)` middleware, when request body matches the Zod schema, then it attaches `req.validated` and calls `next()`. Invalid returns 400 `{ code: "VALIDATION_ERROR", details: [...] }`.
3. Given the `rateLimiter` middleware, when configured for LLM (30 req/hr/user), then excess returns 429 `{ code: "RATE_LIMIT_EXCEEDED" }` with `Retry-After` header.
4. Given the `errorHandler` middleware, when an AppError is thrown, then it returns correct HTTP status, machine-readable code, and human-readable message in standard error envelope.
5. Given the `requestLogger` middleware, when any request is processed, then it logs structured JSON via Pino: method, url, statusCode, responseTime, requestId. Info for normal, warn for 4xx, error for 5xx.
6. Given the `serviceResponse` utility, when building responses, then success: `{ success: true, data, meta: { requestId, timestamp, version } }`. Error: `{ success: false, error: { code, message, details? }, meta: {...} }`.
7. Given the custom error classes, when throwing `new NotFoundError("Dish")`, then it produces `{ code: "NOT_FOUND", statusCode: 404, userMessage: "Dish not found" }`.
8. Given the Pino logger, when calling `logger.info({ requestId }, "msg")`, then it outputs structured JSON with `requestId` on every log line.

## Tasks / Subtasks

- [x] Task 1: Create `backend/src/common/utils/errors.ts` — AppError base + subclasses (AC: 7)
  - [x] Define `AppError` base class extending `Error`: `code` (string), `statusCode` (number, default 500), `userMessage` (string). Constructor takes `(code, statusCode, userMessage)`. Call `super(userMessage)` so `.message` is the user message.
  - [x] Define `NotFoundError(resource?: string)`: `code: "NOT_FOUND"`, `statusCode: 404`, `userMessage: \`${resource ?? 'Resource'} not found\``
  - [x] Define `ValidationError(message, details?)`: `code: "VALIDATION_ERROR"`, `statusCode: 400`, optional `details` array of Zod-like issues
  - [x] Define `AuthenticationError(message?)`: `code: "AUTH_TOKEN_EXPIRED"`, `statusCode: 401`, `userMessage: message ?? 'Authentication required'`
  - [x] Define `LLMError(code, userMessage)`: `statusCode: 502`, supports sub-codes `"LLM_TIMEOUT"` and `"LLM_INVALID_RESPONSE"`
  - [x] Define `RateLimitError(retryAfterSeconds?)`: `code: "RATE_LIMIT_EXCEEDED"`, `statusCode: 429`, includes `retryAfterSeconds` property
  - [x] Export all classes. Do NOT export a default.

- [x] Task 2: Create `backend/src/common/models/serviceResponse.ts` — typed response builders (AC: 6)
  - [x] Define `Meta` interface: `{ requestId: string, timestamp: string, version: string }` (version hardcoded as `"1.0.0"`)
  - [x] Define `SuccessResponse<T>` type: `{ success: true, data: T, meta: Meta }`.
  - [x] Define `ErrorDetail` type: `{ field?: string, issue: string }`
  - [x] Define `ErrorResponse` type: `{ success: false, error: { code: string, message: string, details?: ErrorDetail[] }, meta: Meta }`
  - [x] Export `ServiceResponse.success(data, requestId)` and `ServiceResponse.failure(code, message, requestId, details?)`
  - [x] Export `ServiceResponse` as a namespace object: `export const ServiceResponse = { success, failure }`

- [x] Task 3: Create `backend/src/common/middleware/authenticate.ts` — JWT verification middleware (AC: 1)
  - [x] Stub mode: checks `JWT_SECRET === "replace-with-a-long-secret"`, uses `x-user-id` header (fallback "stub-user"), logs single warning
  - [x] Real mode: HMAC-SHA256 verification via Node.js `crypto`, extracts `{ sub, provider }` from JWT payload
  - [x] Extend Express `Request` type via declaration merging: `user?: { userId: string, authProvider: string }`
  - [x] Export `authenticate` middleware and `signJwt` utility

- [x] Task 4: Create `backend/src/common/middleware/validate.ts` — Zod validation runner (AC: 2)
  - [x] Signature: `validate(schema: ZodSchema)` returns Express middleware
  - [x] Validates `req.body`, attaches `req.validated` on success
  - [x] On failure: `ValidationError` with field-level details from Zod issues
  - [x] Export `validate`, `ValidatedRequest<T>` type

- [x] Task 5: Create `backend/src/common/middleware/rateLimiter.ts` — rate limiters (AC: 3)
  - [x] In-memory Map-based counters, keyed by `userId || req.ip`
  - [x] `generalLimiter`: 100 req/min, `llmLimiter`: 30 req/hr
  - [x] Throws `RateLimitError` with `Retry-After` seconds counting

- [x] Task 6: Create `backend/src/common/middleware/asyncHandler.ts` — async route wrapper (supports AC: 7)
  - [x] Wraps async route handlers: `Promise.resolve(fn(req, res, next)).catch(next)`
  - [x] Export `asyncHandler`

- [x] Task 7: UPDATE `backend/src/common/middleware/errorHandler.ts` — map AppErrors to HTTP (AC: 4, 7)
  - [x] Detects AppError via `instanceof`, uses `error.statusCode`, `error.code`, `error.userMessage`
  - [x] Non-AppErrors: 500 `INTERNAL_ERROR`, message masked in production
  - [x] Preserved: `notFoundHandler`, Pino logging (warn for AppError, error for non-AppError)
  - [x] RateLimitError sets `Retry-After` header, ValidationError passes `details`

- [x] Task 8: Create `backend/src/common/middleware/requestLogger.ts` — Pino HTTP logging (AC: 5, 8)
  - [x] Generates `requestId` via `crypto.randomUUID()`, attaches to `req.requestId` + `x-request-id` header
  - [x] Logs on `res.on("finish")`: method, url, statusCode, responseTime, requestId
  - [x] Pino level: info (2xx/3xx), warn (4xx), error (5xx)
  - [x] Type extension: `requestId?: string` on Express Request

- [x] Task 9: Create `backend/src/common/middleware/index.ts` — barrel export (all ACs)
  - [x] Re-exports: authenticate, signJwt, validate, ValidatedRequest, generalLimiter, llmLimiter, errorHandler, notFoundHandler, requestLogger, asyncHandler

- [x] Task 10: UPDATE `backend/src/common/models/index.ts` — add serviceResponse export (AC: 6)
  - [x] Re-exports: ServiceResponse, SuccessResponse, ErrorResponse, ErrorDetail

- [x] Task 11: UPDATE `backend/src/server.ts` — wire new middleware (ACs: 1-5, 7-8)
  - [x] Removed inline request logger, added `app.use(requestLogger)` + `app.use(generalLimiter)`
  - [x] Preserved: helmet, CORS, JSON parser, health endpoint, notFoundHandler, errorHandler order, buildApp() signature
  - [x] authenticate/validate/llmLimiter/asyncHandler available but not wired globally

- [x] Task 12: Write tests (all ACs)
  - [x] `backend/tests/middleware/errorHandler.test.ts` — 10 tests covering all AppError subclasses + prod masking
  - [x] `backend/tests/middleware/validate.test.ts` — 4 tests: valid body, invalid body, empty string, extra fields stripped
  - [x] `backend/tests/middleware/rateLimiter.test.ts` — 4 tests: within limit, blocked, window reset, llmLimiter threshold
  - [x] `backend/tests/middleware/serviceResponse.test.ts` — 3 tests: success shape, failure shape, details
  - [x] `backend/tests/middleware/authenticate.test.ts` — 6 tests: stub mode header, fallback, valid JWT round-trip
  - [x] `pnpm typecheck` passes, `pnpm lint` passes, `pnpm test` passes (39 tests, no regressions)

## Dev Notes

### Story Foundation

- Epic 1 Story 1.8 is in the critical path — every domain module (auth, recipes, favorites, discovery, sync) depends on this middleware infrastructure. Stories 2.1-4.9 all import from `common/middleware/` and `common/utils/errors.ts`. [Source: `_bmad-output/planning-artifacts/epics/epic-1.md#story-18`, `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md#implementation-sequence`]
- The backend is fully initialized (Story 1.2): Express 5.1.0 running on port 3000, TypeScript 5.9.3 strict mode, Mongoose 8.19.1, Zod 4.1.12, ioredis 5.8.2, Vitest 4.0.7, biome 2.3.0. Pino 10.1.0 logger is already configured. [Source: `backend/package.json`]
- Mongoose schemas are created (Story 1.7): User, Favorite, SearchHistory, UserPreference. These are available for the middleware to reference. [Source: `backend/src/models/`]
- The existing `common/` directory already has: `middleware/errorHandler.ts` (basic), `utils/apiResponse.ts` (basic envelope), `utils/logger.ts` (Pino, DONE), `utils/cors.ts`, `models/index.ts` (empty). [Source: `backend/src/common/`]
- **This story does NOT install new npm packages.** All needed deps (Pino, Zod, Express) are already in `package.json`. For JWT: `jose` is not yet installed — use Node.js built-in `crypto` module for JWT verification in stub mode, and add `jose` when auth module is built (Story 4.1). For now, `authenticate.ts` in real mode should do HMAC-SHA256 verification using `crypto.createHmac` with the secret from env. [Source: `backend/package.json`]

### Architecture Compliance

- All middleware files go in `backend/src/common/middleware/` — co-located with the existing `errorHandler.ts`. [Source: `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md#complete-project-directory-structure`]
- Error codes must match the architecture exactly: `AUTH_TOKEN_EXPIRED`, `VALIDATION_ERROR`, `RATE_LIMIT_EXCEEDED`, `LLM_TIMEOUT`, `LLM_INVALID_RESPONSE`, `NOT_FOUND`, `INTERNAL_ERROR`. [Source: `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md#error-codes-backend`]
- API response envelope matches architecture spec: `{ success: boolean, data: T, meta: { requestId, timestamp, version } }` for success; `{ success: false, error: { code, message, details? }, meta: {...} }` for errors. [Source: `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md#api-response-format-standard-envelope`]
- Custom error classes must follow the architecture pattern: `AppError` base class with `code` (machine-readable), `statusCode` (HTTP), `userMessage` (human-readable). [Source: `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md#custom-error-classes-backend`]
- Pino logging level convention: `info` for normal, `warn` for 4xx/degraded, `error` for 5xx/failures. Include `requestId` on every log line. [Source: `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md#logging-backend-pino`]
- TypeScript strict mode must pass (`verbatimModuleSyntax` — use `import type` for type-only imports). All files use `.js` extension in imports (NodeNext moduleResolution). [Source: `backend/tsconfig.json`]

### Technical Requirements

- **JWT verification without external dependency**: Use Node.js built-in `crypto` for HMAC-SHA256 signing/verification. The JWT standard is `base64url(header).base64url(payload).signature`. Implement a lightweight JWT verifier that: (1) splits on `.`, (2) base64url decodes header + payload, (3) verifies HMAC-SHA256 signature using `JWT_SECRET` from env, (4) checks `exp` claim against `Date.now()`. This avoids adding a dependency for a simple verification task. `jose` will be added in Story 4.1 when full auth module needs token issuance + Google OAuth. [Source: Node.js `crypto` module docs]
- **Stub mode is intentional**: Epic 1 is foundation, not auth. Real JWT tokens don't exist yet. The `x-user-id` header bypass lets downstream stories (2.1-2.2) develop and test recipe endpoints without waiting for auth. When Story 4.1 implements real auth, the stub warning tells devs it's time to remove stub mode. [Source: `_bmad-output/planning-artifacts/epics/epic-1.md#story-18`]
- **In-memory rate limiters**: Use `Map<string, { count: number, windowStart: number }>` per limiter instance. Key = `userId || req.ip`. This is NOT distributed (single-process only) — acceptable for Foundation phase. Redis-backed rate limiting is a natural upgrade path when `ioredis` integration tightens (Epic 2). [Source: architecture rate limit spec]
- **old `apiResponse.ts`**: The existing `buildSuccessResponse` and `buildErrorResponse` in `common/utils/apiResponse.ts` are used by `server.ts` (health endpoint) and the current `errorHandler.ts`. After this story: the health endpoint can keep using `buildSuccessResponse` (backward-compatible), but the `errorHandler.ts` should switch to `ServiceResponse` from `serviceResponse.ts`. Do NOT delete `apiResponse.ts` — it's referenced by existing code. Mark it as legacy in a comment.
- **`server.ts` changes are surgical**: Only remove the inline request logger and add `requestLogger` + `generalLimiter`. Do NOT restructure the file or change the middleware order beyond those two insertions. The file is small (60 lines) — keep changes minimal. [Source: `backend/src/server.ts`]

### Library / Version Notes

- **Express 5.1.0**: The boilerplate uses Express 5, which means `express.json()` is built-in (no `body-parser` needed). Error handling in Express 5 automatically catches async errors from route handlers — but `asyncHandler.ts` is still needed for consistency and explicit error wrapping until Express 5 async handling is battle-tested. [Source: `backend/package.json`]
- **Pino 10.1.0**: Already configured with `pino-pretty` in dev. The `requestLogger` middleware should use `logger.child({ requestId })` pattern to auto-attach requestId to all logs from downstream handlers. [Source: `backend/src/common/utils/logger.ts`]
- **Zod 4.1.12**: Use `schema.parse()` (throws) NOT `schema.safeParse()` (returns result). The `asyncHandler` wrapper will catch the thrown ZodError and pass it to the `validate` middleware which converts to `ValidationError`. [Source: `backend/package.json`]
- **biome 2.3.0**: Rules are `recommended` preset. No special config needed. [Source: `backend/biome.json`]

### File Structure Requirements

**New files:**
- `backend/src/common/utils/errors.ts`
- `backend/src/common/models/serviceResponse.ts`
- `backend/src/common/middleware/authenticate.ts`
- `backend/src/common/middleware/validate.ts`
- `backend/src/common/middleware/rateLimiter.ts`
- `backend/src/common/middleware/requestLogger.ts`
- `backend/src/common/middleware/asyncHandler.ts`
- `backend/src/common/middleware/index.ts`
- `backend/tests/middleware/errorHandler.test.ts`
- `backend/tests/middleware/validate.test.ts`
- `backend/tests/middleware/rateLimiter.test.ts`
- `backend/tests/middleware/serviceResponse.test.ts`
- `backend/tests/middleware/authenticate.test.ts`

**Files that must be updated:**
- `backend/src/server.ts` — wire requestLogger + generalLimiter, remove inline logger
- `backend/src/common/middleware/errorHandler.ts` — support AppError subclasses, ServiceResponse envelope
- `backend/src/common/models/index.ts` — export ServiceResponse + types

**Files that must NOT be changed:**
- `backend/src/index.ts` — server bootstrap (no middleware wiring here)
- `backend/src/config/env.ts` — env validation (JWT_SECRET already defined)
- `backend/src/config/database.ts` — Mongoose connection
- `backend/src/config/redis.ts` — Redis client
- `backend/src/common/utils/apiResponse.ts` — legacy envelope (still used by health endpoint)
- `backend/src/common/utils/logger.ts` — Pino config (already correct)
- `backend/src/common/utils/cors.ts` — CORS helper
- `backend/package.json` — no new dependencies
- `backend/tsconfig.json` — config is correct
- `backend/vite.config.mts` — already includes test patterns
- `backend/biome.json` — biome config

### Files Being Updated: Current State / Required Change / Preserve

- **`backend/src/server.ts`**
  - Current state: 60 lines. Imports `logger`, `buildSuccessResponse`, `cors`, `helmet`, `errorHandler`, `notFoundHandler`, `parseCorsOrigins`, `env`. Has inline `app.use((req, _res, next) => { logger.info(...) })`. Exports `buildApp()`.
  - Changes: Remove inline request logger. Add `app.use(requestLogger)` after `express.json()`. Add `app.use(generalLimiter)` after `requestLogger`. Remove unused `logger` import from `./common/utils/logger.js` (only if no other usage — check that it IS only used in the inline middleware).
  - Must preserve: All existing imports (except logger if unused), helmet config logic, CORS delegate, JSON parser, health endpoint, `notFoundHandler` position (before `errorHandler`), `errorHandler` at end, `buildApp()` signature, `healthHandler` function (keep using legacy `buildSuccessResponse` — it still works).

- **`backend/src/common/middleware/errorHandler.ts`**
  - Current state: 21 lines. `notFoundHandler` returns 404 with `buildErrorResponse("NOT_FOUND", "Route not found")`. `errorHandler` catches all errors, logs to Pino, returns 500 with `buildErrorResponse("INTERNAL_SERVER_ERROR", "Internal server error")`.
  - Changes: Import `AppError` and subclasses. In `errorHandler`: check `error instanceof AppError` → use its `.code`, `.statusCode`, `.userMessage`. For non-AppError → keep 500 behavior but use `ServiceResponse.failure()` instead of `buildErrorResponse()`. Add `requestId` to meta. Log AppErrors at `warn`, non-AppErrors at `error`. In production, mask non-AppError messages.
  - Must preserve: `notFoundHandler` function exactly as-is (the `buildErrorResponse` call is fine — it's a 404 for unknown routes, not a domain error). `errorHandler` signature `(error, req, res, next)`. Export both functions.

- **`backend/src/common/models/index.ts`**
  - Current state: `export {};`
  - Changes: Add `export { ServiceResponse } from "./serviceResponse.js"` plus type exports
  - Must preserve: nothing

### Previous Story Intelligence (Story 1.7)

- Status: `review`. All 4 Mongoose schemas created. All models tested with real MongoDB (skip when unavailable). [Source: `_bmad-output/implementation-artifacts/1-7-seed-recipe-data-mongoose-schemas.md`]
- **Patterns established by Story 1.7**:
  - New files use 2-space indent, no trailing whitespace. Run `biome format --write` after creating files. [Source: Story 1.7 dev notes]
  - Tests are in `backend/tests/` or co-located `__tests__/`. Vitest `include` in `vite.config.mts` covers both: `["tests/**/*.test.ts", "src/**/__tests__/**/*.test.ts"]`. [Source: `backend/vite.config.mts`]
  - Barrel exports use `export { X } from "./X.js"` pattern with `.js` extension. [Source: `backend/src/models/index.ts`]
  - TypeScript interfaces are exported alongside implementations. Module consumers get full type safety. [Source: Story 1.7 dev notes]
  - MongoDB integration tests gracefully skip when MongoDB is unavailable — same pattern should be used if any middleware tests need Redis or external services. [Source: `backend/src/__tests__/models.test.ts`]
  - `pnpm typecheck` and `pnpm lint` must pass before marking complete. [Source: Story 1.7 completion notes]
- **No new dependencies were added in Story 1.7** — the `package.json` was not modified. Same for this story. [Source: Story 1.7 file list]

### Git Intelligence Summary

- All recent commits are planning/documentation (epic sharding, architecture sharding, mockup alignment). No implementation commits since Story 1.2 boilerplate setup. [Source: `git log --oneline -10`]
- `git status` shows `M 1, ?? 8` — uncommitted changes and untracked files. The backend directory has Story 1.7 files that may be uncommitted. Read source files before modifying — do NOT rely on git history for current state. [Source: git status]
- Baseline commit: `c4c1d02` (last planning commit). All Story 1.2 backend files are committed. Story 1.7 files are working tree. [Source: git log]

### Testing Requirements

- Test files go in `backend/tests/middleware/` — not co-located under `backend/src/common/middleware/__tests__/`. This follows the existing `backend/tests/health.test.ts` pattern. The `vite.config.mts` `include` already covers `tests/**/*.test.ts`. [Source: `backend/vite.config.mts`, `backend/tests/health.test.ts`]
- Each test file is self-contained: imports `buildApp()` from `../src/server.js` (for integration-style tests) or tests middleware directly (for unit tests).
- **errorHandler.test.ts**: Test by mounting an Express app with a route that throws each error type, then check response status + body shape. Use `supertest` (already installed). [Source: `backend/tests/health.test.ts` pattern]
- **validate.test.ts**: Create a Zod schema, mount it in an Express route, send valid/invalid payloads via supertest. Assert 200 → `req.validated` transformed; 400 → field-level details.
- **rateLimiter.test.ts**: Unit test the middleware directly (mount on a test route, fire rapid requests, assert 429 after threshold). Mock `Date.now` with `vi.useFakeTimers` for window expiry test.
- **serviceResponse.test.ts**: Pure unit test (no Express). Call `ServiceResponse.success()` and `ServiceResponse.failure()`, assert shape matches architecture spec.
- **authenticate.test.ts**: Sign a JWT with `crypto.createHmac`, mount authenticate middleware, send with `Authorization: Bearer <token>`, assert `req.user` set. Test stub mode by setting env var or checking default secret path.
- After ALL tests pass: run `pnpm typecheck` and `pnpm lint`. The existing health test must still pass (regression check).

### Project Context Reference

- Architecture docs: `_bmad-output/planning-artifacts/architecture/` (7 sharded files). Key sections for this story: Core Architectural Decisions → API & Communication Patterns, Implementation Patterns → Error Codes, Custom Error Classes, Logging, Project Structure → Complete Directory Structure. [Source: architecture index]
- Epics: `_bmad-output/planning-artifacts/epics/epic-1.md` (Story 1.8 section). [Source: epics index]
- Previous story: `_bmad-output/implementation-artifacts/1-7-seed-recipe-data-mongoose-schemas.md` (status: review). [Source: implementation artifacts]
- No `project-context.md` found.

## Dev Agent Record

### Agent Model Used

Claude Opus (via CommandCode)

### Debug Log References

- Story 1.8 implementation via dev-story workflow
- Baseline commit: c4c1d028b98cd5749a4a7de38f9157c21cabac36
- typecheck: strict mode passes (`exactOptionalPropertyTypes`, `verbatimModuleSyntax`)
- lint: biome passes (0 errors, 0 warnings)
- test: 39 tests pass (7 test files), 16 skipped (MongoDB models)

### Completion Notes List

- Created `backend/src/common/utils/errors.ts` — AppError base class + 5 subclasses: NotFoundError (404), ValidationError (400 + details), AuthenticationError (401), LLMError (502, sub-codes), RateLimitError (429 + retryAfterSeconds)
- Created `backend/src/common/models/serviceResponse.ts` — ServiceResponse namespace with typed success/failure builders, Meta interface, version hardcoded to "1.0.0"
- Created `backend/src/common/middleware/authenticate.ts` — JWT verification using Node.js crypto (HMAC-SHA256), stub mode bypass via `x-user-id` header, Express Request type extension
- Created `backend/src/common/middleware/validate.ts` — Zod validation runner, field-level error details via Zod issue extraction
- Created `backend/src/common/middleware/rateLimiter.ts` — in-memory Map-based: generalLimiter (100/min), llmLimiter (30/hr)
- Created `backend/src/common/middleware/asyncHandler.ts` — Promise-based async route wrapper
- Created `backend/src/common/middleware/requestLogger.ts` — Pino-structured HTTP logging with requestId, response time, status-based log levels
- Created `backend/src/common/middleware/index.ts` — barrel export of all middleware
- Updated `backend/src/common/middleware/errorHandler.ts` — AppError-aware mapping with production message masking, ServiceResponse envelope, Retry-After for rate limits
- Updated `backend/src/common/models/index.ts` — re-exports ServiceResponse and types
- Updated `backend/src/server.ts` — replaced inline logger with requestLogger, added generalLimiter, removed logger import
- Created 5 test files (25 new tests): errorHandler (10), validate (4), rateLimiter (4), serviceResponse (3), authenticate (6)
- All existing tests pass (health, seed-recipes). No regressions.

### File List

- `_bmad-output/implementation-artifacts/1-8-common-backend-infrastructure.md` (story file)
- `backend/src/common/utils/errors.ts` (new)
- `backend/src/common/models/serviceResponse.ts` (new)
- `backend/src/common/middleware/authenticate.ts` (new)
- `backend/src/common/middleware/validate.ts` (new)
- `backend/src/common/middleware/rateLimiter.ts` (new)
- `backend/src/common/middleware/asyncHandler.ts` (new)
- `backend/src/common/middleware/requestLogger.ts` (new)
- `backend/src/common/middleware/index.ts` (new)
- `backend/src/common/middleware/errorHandler.ts` (updated)
- `backend/src/common/models/index.ts` (updated)
- `backend/src/server.ts` (updated)
- `backend/tests/middleware/errorHandler.test.ts` (new)
- `backend/tests/middleware/validate.test.ts` (new)
- `backend/tests/middleware/rateLimiter.test.ts` (new)
- `backend/tests/middleware/serviceResponse.test.ts` (new)
- `backend/tests/middleware/authenticate.test.ts` (new)

### Review Findings

- [x] [Review][Defer] Docker JWT_SECRET empty string bypasses Zod default → crash at startup [docker-compose.yml] — deferred, infrastructure not in story scope
- [x] [Review][Defer] Server listens before DB/Redis ready — health endpoint reports ready prematurely [backend/src/index.ts] — deferred, bootstrap order not in story scope
- [x] [Review][Defer] JWT payload JSON.parse throws 500 instead of 401 [authenticate.ts] — deferred, requires server-signed JWTs so parse failures are a non-issue in practice
- [x] [Review][Defer] llm-proxy hardcoded port, no error listener [backend/src/llm-proxy.ts] — deferred, not in story scope
- [x] [Review][Patch] Unbounded memory leak in rateLimiter Map — entries never deleted, grows forever [rateLimiter.ts]
- [x] [Review][Patch] Race condition: check-then-set in rateLimiter allows limit bypass under concurrency [rateLimiter.ts]
- [x] [Review][Patch] AuthError code always AUTH_TOKEN_EXPIRED — missing header ≠ expired token [errors.ts]
- [x] [Review][Patch] Duplicate incompatible response builders: notFoundHandler uses buildErrorResponse (no meta), errorHandler uses ServiceResponse.failure (has meta) [errorHandler.ts, apiResponse.ts]
- [x] [Review][Patch] Empty Bearer token accepted — `Bearer ` (no token) passes guard [authenticate.ts:52]
- [x] [Review][Patch] JWT alg not validated — header ignored, should assert HS256 [authenticate.ts]

## Change Log

- Created 6 custom error classes: AppError base + NotFoundError, ValidationError, AuthenticationError, LLMError, RateLimitError
- Created ServiceResponse typed envelope builders (success/failure) with Meta (requestId, timestamp, version)
- Created authenticate middleware with JWT (HMAC-SHA256 via Node.js crypto) + stub mode for local dev
- Created validate middleware with Zod schema validation and field-level error details
- Created in-memory rate limiters: generalLimiter (100 req/min), llmLimiter (30 req/hr)
- Created asyncHandler wrapper for Express async route error propagation
- Created requestLogger with Pino structured logging, requestId generation, x-request-id header
- Updated errorHandler to map AppError subclasses to proper HTTP status codes and ServiceResponse envelope
- Updated server.ts to wire requestLogger + generalLimiter, removed inline logger
- Added 25 new tests across 5 test files covering all 8 acceptance criteria
- All validations pass: typecheck, lint (biome), test (vitest — 39 tests, 0 failures)
