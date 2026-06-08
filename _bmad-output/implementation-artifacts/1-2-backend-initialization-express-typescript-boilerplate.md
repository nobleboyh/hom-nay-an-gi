---
baseline_commit: c4c1d028b98cd5749a4a7de38f9157c21cabac36
---

# Story 1.2: Backend Initialization (Express TypeScript Boilerplate)

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want the Express TypeScript boilerplate initialized in the `backend/` directory,
so that I have a working API server with TypeScript, Zod validation, Pino logging, Vitest testing, and the established module pattern ready for domain modules.

## Acceptance Criteria

1. Given the backend directory, when I run `cd backend && pnpm install`, then all dependencies install without errors.
2. Given the backend is running, when I run `cd backend && pnpm dev`, then the server starts on port `3000` with live reload via `tsx --watch`.
3. Given the backend directory structure, when I inspect `backend/src/`, then I see `index.ts`, `server.ts`, `config/` (`env.ts`, `database.ts`, `redis.ts`, `llm.ts`), `common/` (`middleware/`, `models/`, `utils/`), `api/` (empty, ready for domain modules), `api-docs/`, `models/` (empty), and `services/` (empty).
4. Given a GET request to `/api/v1/health`, when the server is running, then it returns `{ "success": true, "data": { "status": "ok" } }` using the standard success envelope.
5. Given the boilerplate setup, when I run `pnpm typecheck`, then TypeScript strict mode checks pass.
6. Given the boilerplate setup, when I run `pnpm test`, then Vitest runs and the health-check test passes.
7. Given the backend, when I inspect `package.json`, then the package manager is `pnpm`, and scripts include `dev`, `build`, `start:prod`, `typecheck`, `lint`, `format`, and `test`.

## Tasks / Subtasks

- [x] Replace the Story 1.1 placeholder backend with the selected Express boilerplate foundation (AC: 1, 2, 3, 7)
  - [x] Snapshot or remove the placeholder-only files `src/express-api.mjs`, `src/llm-proxy.mjs`, and `src/cron-worker.mjs` once the TypeScript replacement entrypoints exist.
  - [x] Bring the `edwinhern/express-typescript` structure into `backend/` using `pnpm` as the package manager and keep strict TypeScript enabled.
  - [x] Preserve `backend/` as the Docker build context so Story 1.1 `docker-compose.yml` does not need a topology rewrite.
- [x] Restructure the boilerplate into the architecture-defined backend shape (AC: 3)
  - [x] Remove the example `api/healthCheck/` and `api/user/` modules after extracting the patterns they establish.
  - [x] Create `src/config/`, `src/common/middleware/`, `src/common/models/`, `src/common/utils/`, `src/api/`, `src/api-docs/`, `src/models/`, and `src/services/`.
  - [x] Keep `src/api/`, `src/models/`, and `src/services/` intentionally empty except for any minimal placeholder file required by TypeScript or lint tooling.
- [x] Implement environment and runtime configuration modules (AC: 2, 3, 5)
  - [x] Create `src/config/env.ts` with a Zod-validated schema for `NODE_ENV`, `PORT`, `MONGO_URI`, `REDIS_URI`, `LLM_PROXY_URL`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `HERE_API_KEY`, and `CORS_ORIGIN`.
  - [x] Create `src/config/database.ts` with Mongoose connection logic and explicit retry handling capped at 5 attempts.
  - [x] Create `src/config/redis.ts` with an `ioredis` client plus connection lifecycle logging/hooks.
  - [x] Create `src/config/llm.ts` to read `LLM_PROVIDER` and expose provider configuration for later services.
- [x] Assemble the Express app and server bootstrap (AC: 2, 4, 5)
  - [x] Create `src/server.ts` that wires `helmet`, dynamic CORS handling, JSON parsing, request logging, `/api/v1/health`, and the centralized error handler.
  - [x] Create `src/index.ts` that loads env config, connects MongoDB and Redis, and starts the HTTP server on port `3000`.
  - [x] Ensure `/api/v1/health` still matches the Story 1.1 nginx proxy expectation and returns the standard envelope shape.
- [x] Restore container and multi-process compatibility for local development (AC: 2, 4, 7)
  - [x] Replace the placeholder `backend/Dockerfile` with a multi-stage Node 22 image that installs dependencies with `pnpm`, builds TypeScript output, and runs the production server.
  - [x] Add a backend-local `.env.template` with backend-specific variables and safe placeholder values.
  - [x] Add or retain an llm-proxy entrypoint script in `package.json` so the `llm-proxy` service can still have a dedicated runtime in later stories without changing the compose service name.
- [x] Align tooling with the selected boilerplate and project conventions (AC: 1, 5, 6, 7)
  - [x] Configure `package.json` name to `hom-nay-an-gi-backend`.
  - [x] Ensure scripts include `dev`, `build`, `start:prod`, `typecheck`, `lint`, `format`, `test`, and a dedicated llm-proxy script if needed for compose/runtime continuity.
  - [x] Add `tsconfig.json`, `biome.json`, `vite.config.mts`, and any other upstream boilerplate files required for strict typecheck and Vitest.
  - [x] Add the `packageManager` field so the repo is explicit about the pnpm version it expects.
- [x] Add minimum backend tests and verification coverage (AC: 4, 5, 6)
  - [x] Create or adapt a Vitest + Supertest health-route test that asserts `GET /api/v1/health` returns `{ success: true, data: { status: "ok" } }`.
  - [x] Verify `pnpm install`, `pnpm typecheck`, and `pnpm test` pass locally.
  - [x] Verify `pnpm dev` starts the server on port `3000`.

## Dev Notes

### Story Foundation

- Epic 1 exists to establish the implementation foundation for every later feature epic. Story 1.2 is the first real backend application story after Story 1.1 created the Docker and proxy scaffold. [Source: `_bmad-output/planning-artifacts/epics/epic-1.md`]
- The architecture explicitly selected `edwinhern/express-typescript` as the backend starter and expects Express 5.x, strict TypeScript, Zod, Pino, Vitest, and pnpm. [Source: `_bmad-output/planning-artifacts/architecture/starter-template-evaluation.md`]

### Story-Specific Guardrails

- This story is not a greenfield backend folder anymore. `backend/` already exists as a Story 1.1 placeholder runtime so Docker Compose can start `express-api`, `llm-proxy`, and `cron-worker`.
- The developer must replace placeholder internals without breaking these already-implemented Story 1.1 contracts:
  - `docker-compose.yml` still builds from `./backend`
  - nginx still proxies `http://localhost:8080/api/v1/health` to `express-api:3000`
  - the default stack still expects service names `express-api`, `llm-proxy`, `mongo`, `redis`, and `cron-worker`
- The story AC says `api/` should be empty and ready for domain modules. That means keep the module pattern scaffolding, but do not prematurely build auth, recipes, discovery, favorites, settings, or sync in this story.

### Technical Requirements

- Backend stack must remain Express 5.x + TypeScript strict mode + Zod + Pino + Vitest + Supertest + pnpm. [Source: `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md`, `_bmad-output/planning-artifacts/architecture/starter-template-evaluation.md`]
- The backend target structure is:
  - `src/index.ts`
  - `src/server.ts`
  - `src/config/{env,database,redis,llm}.ts`
  - `src/common/middleware/`
  - `src/common/models/`
  - `src/common/utils/`
  - `src/api/`
  - `src/api-docs/`
  - `src/models/`
  - `src/services/`
  [Source: `_bmad-output/planning-artifacts/epics/epic-1.md`, `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md`]
- The health route must return the project-standard success envelope, not ad hoc JSON. [Source: `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md#api-design`, `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md#api-response-format-standard-envelope`]
- Redis is mandatory, not optional, because later stories depend on it for sessions, cache, and rate limiting. Story 1.2 only needs the connection scaffold, but it must not be omitted. [Source: `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md#database-selection`]
- `llm-proxy` remains a separate runtime concern in the architecture. Story 1.2 should prepare for it instead of collapsing everything into a single Express-only process design. [Source: `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md#llm-integration`]

### Architecture Compliance

- Preserve the monorepo layout and the boundaries chosen in Story 1.1. Do not move the backend out of `backend/`, rename service folders arbitrarily, or introduce a second backend app root. [Source: `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md#complete-project-directory-structure`]
- Follow the boilerplate naming conventions already chosen by architecture:
  - backend files and directories in `camelCase`
  - classes/interfaces in `PascalCase`
  - Zod schemas with `Schema` suffix
  - test files with `.test.ts`
  [Source: `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md#backend-express-typescript-boilerplate-conventions`]
- Keep the standard envelope and error-code patterns consistent now, even if the full custom error stack lands in Story 1.8. The health route should already use the canonical success envelope. [Source: `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md#api-response-format-standard-envelope`]
- CORS must be configured for the Expo dev workflow called out in the epic: support `CORS_ORIGIN` as the controlling env var and leave room for localhost, LAN IP, and tunnel origins. Do not hardcode a single browser-only origin. [Source: `_bmad-output/planning-artifacts/epics/epic-1.md`]

### Library / Framework Requirements

- Use the selected upstream starter, `edwinhern/express-typescript`, as the baseline pattern source. Its published layout includes `pnpm-lock.yaml`, `tsconfig.json`, `vite.config.mts`, `biome.json`, and feature-based `src/api/*` modules. [Source: https://github.com/edwinhern/express-typescript]
- Express 5 removed several legacy response signatures and APIs. When adapting example code, do not use deprecated patterns like `res.json(obj, status)`, `res.send(status)`, or `req.param()`. [Source: https://expressjs.com/en/guide/migrating-5/]
- Use the official `cors` middleware pattern for dynamic origin configuration rather than hand-rolling CORS headers. [Source: https://expressjs.com/en/resources/middleware/cors.html]
- Use `helmet()` as the default security-header baseline, but avoid blindly enabling production-only HTTPS assumptions that interfere with localhost development. [Inference from architecture plus Helmet docs.] [Source: https://helmetjs.github.io/]
- The backend Docker image should use a Node 22 base because the epic explicitly calls for `node:22-alpine` in the multi-stage Dockerfile, but note that Alpine images use `musl`, not `glibc`, and can expose compatibility issues. Avoid native dependency choices that fight Alpine unless there is a concrete reason to switch base images. [Source: https://github.com/nodejs/docker-node]
- Add the `packageManager` field in `package.json` to make the expected pnpm toolchain explicit for contributors and CI. [Inference from pnpm/project tooling direction.] [Source: https://pnpm.io/]

### File Structure Requirements

- Required backend outputs after this story:
  - `backend/package.json`
  - `backend/pnpm-lock.yaml`
  - `backend/tsconfig.json`
  - `backend/biome.json`
  - `backend/vite.config.mts`
  - `backend/.env.template`
  - `backend/Dockerfile`
  - `backend/src/index.ts`
  - `backend/src/server.ts`
  - `backend/src/config/env.ts`
  - `backend/src/config/database.ts`
  - `backend/src/config/redis.ts`
  - `backend/src/config/llm.ts`
  - `backend/src/common/middleware/`
  - `backend/src/common/models/`
  - `backend/src/common/utils/`
  - `backend/src/api-docs/`
- Keep `frontend/` and root infrastructure files out of scope except where backend contract compatibility requires checking them.

### Files Being Updated: Current State / Required Change / Preserve

- `backend/package.json`
  - Current state: placeholder package named `hom-nay-an-gi-backend-placeholder` with only three Node scripts for the placeholder services.
  - This story changes: replace with a real pnpm-based package definition, backend tooling, and runtime scripts.
  - Must preserve: the ability to run a dedicated llm-proxy command path for Docker/service continuity.
- `backend/Dockerfile`
  - Current state: single-stage placeholder image that copies `package.json` and `src/` only, then runs `src/express-api.mjs`.
  - This story changes: replace with a multi-stage build suitable for TypeScript compilation and production startup.
  - Must preserve: `backend/` as the Docker build context and port `3000` for the main API process.
- `backend/src/express-api.mjs`
  - Current state: placeholder Node HTTP server implementing `GET /api/v1/health` with the required response body.
  - This story changes: supersede it with the real Express/TypeScript bootstrap and health route.
  - Must preserve: route path `/api/v1/health`, success payload shape, and listen port `3000`.
- `backend/src/llm-proxy.mjs`
  - Current state: placeholder Node HTTP server serving `GET /health` on port `3001`.
  - This story changes: likely remove or replace its role with a TypeScript entrypoint strategy.
  - Must preserve: a clear future path for the `llm-proxy` Docker service to run separately from `express-api`.
- `backend/src/cron-worker.mjs`
  - Current state: placeholder heartbeat loop.
  - This story changes: may remain as a temporary placeholder or move behind a TypeScript runtime entrypoint, but should not block Story 1.2 if the story scope is only the API bootstrap.
  - Must preserve: `cron-worker` remains a distinct deferred process in architecture and Docker Compose.
- `docker-compose.yml`
  - Current state: working Story 1.1 compose topology that already starts all required services.
  - This story changes: ideally no structural changes; at most, only adapt commands/envs if strictly required by the new backend runtime.
  - Must preserve: service names, healthcheck intent, networks, and nginx compatibility.

### Previous Story Intelligence

- Story 1.1 is already implemented and marked `review`, not just contexted. This means Story 1.2 is building on a real repo state, not a blank scaffold. [Source: `_bmad-output/implementation-artifacts/1-1-monorepo-scaffold-docker-compose.md`]
- The previous story deliberately kept the backend minimal to avoid pulling Express initialization forward. Story 1.2 is the moment to replace that temporary layer cleanly, not incrementally accrete more placeholder code. [Source: `_bmad-output/implementation-artifacts/1-1-monorepo-scaffold-docker-compose.md`]
- Story 1.1 verification already proved that nginx proxies `/api/v1/health` correctly through Docker. If Story 1.2 breaks that route contract, it creates a regression against accepted infrastructure behavior.
- The prior story’s notes explicitly call out the tension between "services must boot" and "real backend comes later." This story resolves that tension by replacing the placeholder backend entirely.

### Git Intelligence Summary

- Recent history is still mostly planning and artifact curation work:
  - `c4c1d02` shard epics into per-epic files
  - `67e49a3` fix epics after multi-agent review
  - `8c0bc9e` shard architecture docs
  - `c4efec3` align mockups
  - `740dc38` finalize UX mockups
- The implementation precedent that matters more is the existing Story 1.1 artifact and current repo files, not repeated code patterns from multiple app commits.
- The current `HEAD` is `c4c1d028b98cd5749a4a7de38f9157c21cabac36`.

### Latest Tech Information

- The selected upstream boilerplate currently documents `pnpm install`, `pnpm start:dev`, `pnpm build`, and `pnpm start:prod`, and includes the feature-based `src/api/` structure this project plans to adapt. [Source: https://github.com/edwinhern/express-typescript]
- Express 5 migration guidance matters immediately when copying examples or adapting old snippets:
  - use `res.status(...).json(...)` instead of legacy overloaded signatures
  - use `req.params` / `req.body` / `req.query` instead of `req.param()`
  - use `res.sendStatus(...)` instead of `res.send(number)`
  [Source: https://expressjs.com/en/guide/migrating-5/]
- The official Express CORS middleware supports dynamic origin functions and already handles preflight when used application-wide. That matches this story’s requirement to support changing Expo development origins without manual header code. [Source: https://expressjs.com/en/resources/middleware/cors.html]
- Helmet’s default middleware is the recommended secure baseline, but its strict transport security behavior can be undesirable on localhost during development. Keep local-dev behavior deliberate rather than enabling HTTPS assumptions accidentally. [Source: https://helmetjs.github.io/]
- Mongoose’s current connection docs say `serverSelectionTimeoutMS` controls how long initial connection attempts wait, and if you want longer or differently bounded connect retries you should retry `mongoose.connect()` yourself. That aligns with the epic’s explicit requirement for capped retry logic. [Source: https://mongoosejs.com/docs/connections.html]
- ioredis exposes connection lifecycle options such as `lazyConnect`, `enableReadyCheck`, and `retryStrategy`. Story 1.2 should at least centralize Redis client construction so later stories do not scatter connection policy across modules. [Source: https://redis.github.io/ioredis/index.html]
- The Node Docker official image warns that Alpine variants use `musl`, Debian-based images may publish earlier than Alpine after security releases, and Alpine can have compatibility differences. If native packages become painful, the developer should raise that tradeoff instead of silently changing base image assumptions. [Source: https://github.com/nodejs/docker-node]

### UX / Product Constraints That Matter Here

- The product is Vietnamese-first and mobile-first. Backend defaults should avoid anglicized UX assumptions leaking into response shapes or validation messages where user-facing strings are introduced later. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/DESIGN.md`, `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/EXPERIENCE.md`]
- The backend contract will serve an Expo mobile client and must tolerate dynamic local development origins, not just a single web origin. [Source: `_bmad-output/planning-artifacts/epics/epic-1.md`]

### Testing Requirements

- Minimum required verification for this story:
  - `cd backend && pnpm install`
  - `cd backend && pnpm typecheck`
  - `cd backend && pnpm test`
  - `cd backend && pnpm dev`
- Add a health-route automated test early so the placeholder-to-real-backend swap cannot regress the `/api/v1/health` contract.
- If Docker verification is feasible after implementation, also smoke-test `docker compose up -d` plus `curl http://localhost:8080/api/v1/health` to ensure Story 1.1 infrastructure still works end to end. This is strongly recommended even though the explicit ACs focus on backend-local commands.

### Project Context Reference

- No `project-context.md` file was present under the project root during this workflow run, so no persistent project-context file facts were loaded from the configured glob.
- Active UX reference is `docs/active-ux-folder.md`, which points to `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/`.
- Relevant artifacts loaded for this story:
  - `_bmad-output/planning-artifacts/epics/epic-1.md`
  - `_bmad-output/implementation-artifacts/1-1-monorepo-scaffold-docker-compose.md`
  - `_bmad-output/planning-artifacts/architecture/index.md`
  - `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md`
  - `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md`
  - `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md`
  - `_bmad-output/planning-artifacts/architecture/starter-template-evaluation.md`
  - `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/DESIGN.md`
  - `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/EXPERIENCE.md`
  - `docs/active-ux-folder.md`
  - Current runtime files under `backend/`
  - `docker-compose.yml`

### References

- `_bmad-output/planning-artifacts/epics/epic-1.md`
- `_bmad-output/implementation-artifacts/1-1-monorepo-scaffold-docker-compose.md`
- `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md`
- `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md`
- `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md`
- `_bmad-output/planning-artifacts/architecture/starter-template-evaluation.md`
- `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/DESIGN.md`
- `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/EXPERIENCE.md`
- `docs/active-ux-folder.md`
- `backend/package.json`
- `backend/Dockerfile`
- `backend/src/express-api.mjs`
- `backend/src/llm-proxy.mjs`
- `backend/src/cron-worker.mjs`
- `docker-compose.yml`
- https://github.com/edwinhern/express-typescript
- https://expressjs.com/en/guide/migrating-5/
- https://expressjs.com/en/resources/middleware/cors.html
- https://helmetjs.github.io/
- https://mongoosejs.com/docs/connections.html
- https://redis.github.io/ioredis/index.html
- https://github.com/nodejs/docker-node
- https://pnpm.io/

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Workflow resolver fallback was applied manually because local `python3` is older than 3.11 and could not run `_bmad/scripts/resolve_customization.py`.
- No `_bmad-output/implementation-artifacts/sprint-status.yaml` existed, so this story was created from the user-specified target `1.2`.
- No `project-context.md` file was found via the configured persistent-facts glob; the active UX location was taken from `docs/active-ux-folder.md`.
- Artifact discovery used selective load for Epic 1 plus full reads of the relevant architecture shards and active UX design docs.
- Previous story intelligence came from the implemented Story 1.1 artifact and current backend placeholder files.
- Backend dependency installation and lockfile generation were completed with `pnpm` via `npm exec --yes pnpm@10.11.1 install`.
- `pnpm test` and `pnpm dev` required unsandboxed execution because this environment blocks local socket listeners used by Supertest and `tsx --watch`.
- `pnpm typecheck`'s wrapper stalled in this shell, so validation used the underlying script command `tsc --noEmit --project tsconfig.json`, which passed cleanly.

### Completion Notes List

- Replaced the Story 1.1 placeholder backend with a strict TypeScript Express 5 application, multi-runtime entrypoints, and pnpm-based tooling.
- Added Zod-backed environment loading, capped MongoDB retry logic, Redis connection scaffolding, dynamic CORS handling, Helmet, request logging, and the standard `/api/v1/health` success envelope.
- Restored container compatibility with a multi-stage Node 22 Dockerfile, compiled runtime entrypoints for `express-api`, `llm-proxy`, and `cron-worker`, plus compose command updates that preserve the existing service topology.
- Added a Vitest + Supertest health-route test and verified install, typecheck, build, lint, test, and dev-start behavior for the backend.

### File List

- `backend/.env.template`
- `backend/Dockerfile`
- `backend/biome.json`
- `backend/package.json`
- `backend/pnpm-lock.yaml`
- `backend/src/api-docs/index.ts`
- `backend/src/api/index.ts`
- `backend/src/common/middleware/errorHandler.ts`
- `backend/src/common/models/index.ts`
- `backend/src/common/utils/apiResponse.ts`
- `backend/src/common/utils/cors.ts`
- `backend/src/common/utils/logger.ts`
- `backend/src/config/database.ts`
- `backend/src/config/env.ts`
- `backend/src/config/llm.ts`
- `backend/src/config/redis.ts`
- `backend/src/cron-worker.ts`
- `backend/src/index.ts`
- `backend/src/llm-proxy.ts`
- `backend/src/models/index.ts`
- `backend/src/server.ts`
- `backend/src/services/index.ts`
- `backend/tests/health.test.ts`
- `backend/tsconfig.json`
- `backend/vite.config.mts`
- `docker-compose.yml`
- `_bmad-output/implementation-artifacts/1-2-backend-initialization-express-typescript-boilerplate.md`

### Change Log

- 2026-06-04: Created the Story 1.2 implementation context file with epic, architecture, UX, prior-story, current-repo, git-history, and latest-doc guardrails.
- 2026-06-04: Replaced the placeholder backend with the pnpm-based Express TypeScript boilerplate, runtime config modules, health route coverage, and container/runtime compatibility updates; set story status to `review`.
