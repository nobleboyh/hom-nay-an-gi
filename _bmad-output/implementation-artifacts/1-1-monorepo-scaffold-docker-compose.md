---
baseline_commit: c4c1d028b98cd5749a4a7de38f9157c21cabac36
---

# Story 1.1: Monorepo Scaffold + Docker Compose

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want a containerized monorepo with Docker Compose infrastructure,
so that all backend services (MongoDB, Redis, nginx, express-api, llm-proxy) can be spun up with a single command for local development.

## Acceptance Criteria

1. Given a fresh clone of the repository, when I run `docker compose up -d mongo redis` from the project root, then MongoDB 8.x and Redis 7.x containers start and are healthy within 30 seconds.
2. Given all Docker services are defined, when I run `docker compose up -d` from the project root, then 5 services start: `nginx`, `express-api`, `llm-proxy`, `mongo`, `redis`. `cron-worker` is excluded by default via profiles. `express-api` is attached to both `internal` and `public` networks.
3. Given the Docker Compose file, when I inspect `docker-compose.yml`, then MongoDB port `27017` is not exposed externally. MongoDB and Redis both define health checks.
4. Given the project root, when I run `ls -la`, then I see `.gitignore`, `.env.template`, `docker-compose.yml`, `README.md`, `nginx/nginx.conf`, and `backend/` and `frontend/` scaffold directories.
5. Given the nginx config, when I curl `http://localhost:8080/api/v1/health`, then the request is proxied to `express-api:3000`. Local development uses HTTP on port `8080`; production HTTPS is deferred.
6. Given `.env.template`, when I read it, then all required environment variables are documented with placeholder values: `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `LLM_PROVIDER`, `LLM_API_KEY`, `HERE_API_KEY`, `MONGO_URI`, `REDIS_URI`.

## Tasks / Subtasks

- [x] Create root infrastructure scaffold for Story 1.1 only (AC: 1, 2, 4, 6)
  - [x] Add root `.env.template` with the required variables and local-dev defaults/placeholders.
  - [x] Expand root `.gitignore` without removing the existing tool-directory entries already present in the repo.
  - [x] Create `backend/`, `frontend/`, and `nginx/` directories as the initial monorepo layout.
- [x] Create `docker-compose.yml` with the architecture-defined topology (AC: 1, 2, 3)
  - [x] Define services: `nginx`, `express-api`, `llm-proxy`, `mongo`, `redis`, `cron-worker`.
  - [x] Define named volumes: `mongo-data`, `redis-data`.
  - [x] Define networks: `internal`, `public`.
  - [x] Attach `express-api` to both networks; keep `mongo`, `redis`, and `llm-proxy` on `internal`; keep `nginx` on `public`.
  - [x] Put `cron-worker` behind profile `full` so default `docker compose up -d` excludes it.
  - [x] Add health checks for MongoDB and Redis and use Compose dependency conditions where they materially improve startup order.
- [x] Create local-dev reverse proxy config (AC: 2, 5)
  - [x] Add `nginx/nginx.conf` that listens on `8080` for local development.
  - [x] Proxy `/api/v1/` traffic to `http://express-api:3000`.
  - [x] Set the standard proxy headers explicitly instead of relying on nginx defaults.
- [x] Resolve the story-level scaffold tension without pulling Story 1.2 forward (AC: 2, 4)
  - [x] Keep `backend/` and `frontend/` as scaffold-level directories only; do not initialize the full Express or Expo applications in this story.
  - [x] If Docker build contexts require placeholder files under `backend/`, keep them minimal, infra-only, and clearly temporary so Story 1.2 can replace them cleanly.
- [x] Replace the placeholder root documentation with Story 1.1-ready docs (AC: 4, 6)
  - [x] Rewrite `README.md` with project overview, quick-start commands, env setup, and a simple dual-network topology diagram.
  - [x] Document that MongoDB stays internal-only and that production HTTPS is intentionally out of scope for this story.
- [x] Verify the scaffold from a clean checkout perspective (AC: 1, 2, 3, 5)
  - [x] Run `docker compose config` to validate the compose file.
  - [x] Run `docker compose up -d mongo redis` and verify both health checks pass.
  - [x] Run `docker compose up -d` and verify `nginx`, `express-api`, `llm-proxy`, `mongo`, and `redis` start while `cron-worker` does not.
  - [x] Verify `curl http://localhost:8080/api/v1/health` reaches the backend container path.

## Dev Notes

### Story Foundation

- Epic 1 goal is to create the implementation foundation that unblocks all later epics. Story 1.1 is the infrastructure-first entry point for the full project sequence. [Source: `_bmad-output/planning-artifacts/epics/epic-1.md`]
- Architecture implementation order explicitly starts with Docker Compose scaffold and nginx config before backend initialization. Story 1.2 owns the actual Express boilerplate initialization. [Source: `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md#implementation-sequence-ordered-by-dependency`]

### Key Spec Tension To Resolve

- The epic requires `docker compose up -d` to start `express-api` and `llm-proxy`, but Story 1.2 separately owns full backend initialization.
- The epic also says `backend/` and `frontend/` should appear as scaffold directories in the root listing.
- Recommended interpretation for implementation:
  - Treat "empty directories" as "no application scaffolding yet", not "absolutely no files may exist".
  - Do not clone or build the real Express boilerplate here.
  - If the compose build path cannot work without a minimal backend placeholder, keep it to the smallest infra-only bootstrap needed for container startup and mark it for replacement in Story 1.2.

### Technical Requirements

- Use a monorepo root with `backend/`, `frontend/`, `nginx/`, `docker-compose.yml`, root `.env.template`, and root `README.md`. [Source: `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md#complete-project-directory-structure`]
- Docker service topology must define 6 services total: `nginx`, `express-api`, `llm-proxy`, `mongo`, `redis`, `cron-worker`. [Source: `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md#docker-compose-service-topology`]
- `express-api` must be attached to both `public` and `internal` networks. `mongo` must remain internal-only with no host port publish. [Source: `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md#docker-compose-service-topology`]
- Root environment documentation must include `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `LLM_PROVIDER`, `LLM_API_KEY`, `HERE_API_KEY`, `MONGO_URI`, and `REDIS_URI`. [Source: `_bmad-output/planning-artifacts/epics/epic-1.md`]
- Local development proxy is HTTP on port `8080`; production HTTPS is deferred and should only be documented, not implemented. [Source: `_bmad-output/planning-artifacts/epics/epic-1.md`]

### Architecture Compliance

- Keep MongoDB and Redis as mandatory infrastructure, not optional conveniences. Redis is part of sessions, caching, and rate limiting across later stories. [Source: `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md#database-selection`]
- Preserve the separation between this story and the next two:
  - Story 1.1: infrastructure scaffold
  - Story 1.2: Express TypeScript boilerplate
  - Story 1.3: Expo Router frontend scaffold
- Do not invent alternate service names or alternate topologies. Later stories assume the exact names `express-api`, `llm-proxy`, `mongo`, and `redis`. [Source: `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md#docker-compose-service-topology`]
- Keep observability additions lightweight here. Full OpenTelemetry and structured application logging are architecture decisions, but they are implemented later once the backend exists. [Inference from architecture sequencing and current repo state.]

### Library / Framework Requirements

- Docker Compose is the project-standard local orchestration layer. Use the current Compose Specification style; do not add obsolete `version:` syntax unless a tooling constraint forces it. [Source: Docker Compose file reference: https://docs.docker.com/reference/compose-file/]
- MongoDB must stay on the `mongo` official image family with an 8.x tag, consistent with the epic and architecture. [Source: `_bmad-output/planning-artifacts/epics/epic-1.md`, Docker Hub Mongo official image: https://hub.docker.com/_/mongo]
- Redis must stay on the `redis` official image family with a 7.x Alpine tag, consistent with the epic and architecture. Do not silently upgrade to Redis 8 in this story just because newer tags exist. [Source: `_bmad-output/planning-artifacts/epics/epic-1.md`, Redis official image tags: https://hub.docker.com/_/redis]
- nginx should use the lightweight `nginx:alpine` image as defined in the epic tasks. [Source: `_bmad-output/planning-artifacts/epics/epic-1.md`]

### File Structure Requirements

- Expected root outputs for this story:
  - `.env.template`
  - `docker-compose.yml`
  - `README.md`
  - `nginx/nginx.conf`
  - `backend/`
  - `frontend/`
- Existing project-management folders (`_bmad/`, `.agents/`, `docs/`) are not part of the runtime scaffold and should remain untouched.

### Files Being Updated: Current State / Required Change / Preserve

- `README.md`
  - Current state: placeholder with only `# hom-nay-an-gi`.
  - This story changes: replace it with project overview, quick start, env setup, and topology notes.
  - Must preserve: repository name and the fact that this is the root project readme.
- `.gitignore`
  - Current state: only contains tool-folder entries (`_bmad`, `.agents`, `.opencode`, `.claude`).
  - This story changes: add environment files, dependency folders, build artifacts, mobile folders, and data folders required by the epic.
  - Must preserve: the existing tool-folder ignore entries; do not remove them.

### Current Repo Reality

- The repository is still pre-implementation. No `backend/`, `frontend/`, `nginx/`, or runtime infrastructure files exist yet.
- Because there is no actual backend code yet, any solution that makes `docker compose up -d` work must avoid dragging Story 1.2 implementation into this story.

### UX / Product Constraints That Matter Here

- The app is mobile-first, Vietnamese-first, and accessibility-minded, but Story 1.1 is pure infrastructure. Do not spend time implementing UI artifacts here.
- Still, the README should describe the app accurately as an Expo frontend plus Express backend, with MongoDB, Redis, and nginx in local development. [Source: `_bmad-output/planning-artifacts/architecture/starter-template-evaluation.md`]

### Testing Requirements

- Minimum verification for this story:
  - `docker compose config`
  - `docker compose up -d mongo redis`
  - health status check for both data stores
  - `docker compose up -d`
  - proxy smoke test to `/api/v1/health`
- Prefer checks that prove the topology, networking, and health-check behavior instead of application-level business logic. There is no domain code yet.

### Git Intelligence Summary

- Recent commits are all planning artifacts, not implementation:
  - `c4c1d02` shard epics into per-epic files
  - `67e49a3` fix epics after multi-agent review
  - `8c0bc9e` shard architecture docs
  - `c4efec3` align mockups
  - `740dc38` finalize UX mockups
- Implication: there is no coding pattern from previous implementation commits to mirror yet. The source of truth is the planning stack, not existing app code.

### Latest Tech Information

- Docker Compose supports health-driven startup ordering when `depends_on` uses `condition: service_healthy`; use that where backend services depend on MongoDB or Redis readiness. [Source: https://docs.docker.com/compose/how-tos/startup-order/]
- Compose health checks support `test`, `interval`, `timeout`, `retries`, and `start_period`; keep them explicit rather than relying on image defaults. [Source: https://docs.docker.com/reference/compose-file/services/]
- The official Redis image currently publishes Redis 8 as latest, but still provides supported 7.4.x and `7-alpine` tags. This story should stay pinned to 7.x because the epic and architecture specify Redis 7.x. [Source: https://hub.docker.com/_/redis]
- The official Mongo image documentation reinforces that named volumes are the normal persistence path and that exposing Mongo externally requires extra security hardening; this story avoids that by keeping Mongo on the internal network only. [Source: https://hub.docker.com/_/mongo]
- nginx `proxy_pass` remains the standard reverse-proxy directive, and explicit `proxy_set_header` directives are recommended so the upstream receives the correct `Host` and client context. [Source: https://nginx.org/en/docs/http/ngx_http_proxy_module.html]

### Project Context Reference

- Persistent project fact loaded for this workflow: `docs/active-ux-folder.md` marks `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/` as the active UX source.
- Relevant planning artifacts loaded for this story:
  - `_bmad-output/planning-artifacts/epics/epic-1.md`
  - `_bmad-output/planning-artifacts/architecture/index.md`
  - `_bmad-output/planning-artifacts/architecture/project-context-analysis.md`
  - `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md`
  - `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md`
  - `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md`
  - `_bmad-output/planning-artifacts/architecture/starter-template-evaluation.md`
  - `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/DESIGN.md`
  - `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/EXPERIENCE.md`
  - `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/handoff-to-architecture.md`

### References

- `_bmad-output/planning-artifacts/epics/epic-1.md`
- `_bmad-output/planning-artifacts/architecture/project-context-analysis.md`
- `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md`
- `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md`
- `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md`
- `_bmad-output/planning-artifacts/architecture/starter-template-evaluation.md`
- `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/DESIGN.md`
- `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/EXPERIENCE.md`
- `docs/active-ux-folder.md`
- Docker Compose file reference: https://docs.docker.com/reference/compose-file/
- Docker Compose startup order: https://docs.docker.com/compose/how-tos/startup-order/
- Docker Compose services reference: https://docs.docker.com/reference/compose-file/services/
- Mongo official image: https://hub.docker.com/_/mongo
- Redis official image: https://hub.docker.com/_/redis
- nginx proxy module: https://nginx.org/en/docs/http/ngx_http_proxy_module.html

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Workflow resolver fallback was applied manually because local `python3` is older than 3.11 and could not run `_bmad/scripts/resolve_customization.py`.
- No `_bmad-output/implementation-artifacts/sprint-status.yaml` existed, so this story was created from the user-specified target instead of backlog auto-discovery.
- Initial runtime verification was blocked because the plain shell could not access a working Compose path and Docker daemon socket until Docker Desktop was launched and the verification commands were run outside the sandbox.
- Red phase: `node --test tests/story-1-1.test.mjs` failed with 5 failing tests before implementation.
- Green phase: implemented the scaffold, compose topology, nginx config, placeholder backend services, and root documentation until `node --test tests/story-1-1.test.mjs` passed.
- Additional non-Docker validation passed:
  - `ruby -e "require 'yaml'; YAML.load_file('docker-compose.yml'); puts 'docker-compose.yml: ok'"`
  - `node -e "import('./backend/src/express-api.mjs').then(() => import('./backend/src/llm-proxy.mjs')).then(() => console.log('backend modules: ok'))"`
  - `node -e "JSON.parse(require('node:fs').readFileSync('backend/package.json','utf8')); console.log('backend/package.json: ok')"`
- Docker runtime verification later completed after launching Docker Desktop and accessing the Docker socket outside the sandbox:
  - `docker info`
  - `docker compose config`
  - `docker compose up -d mongo redis`
  - `docker inspect` confirmed MongoDB and Redis were `healthy`
  - `docker compose up -d`
  - `docker ps` confirmed exactly 5 default services were running and `cron-worker` was absent
  - escalated `curl -i http://localhost:8080/api/v1/health` returned HTTP 200 with `{"success":true,"data":{"status":"ok"}}`

### Completion Notes List

- Story context created from Epic 1, architecture shards, active UX artifacts, current repo inspection, recent git history, and official current Docker/Mongo/Redis/nginx documentation.
- No previous story file existed for cross-story implementation learnings because this is Story 1.1.
- Ultimate context engine analysis completed - comprehensive developer guide created.
- Implemented root `.env.template`, `docker-compose.yml`, `nginx/nginx.conf`, and updated root `README.md` and `.gitignore`.
- Added a minimal placeholder backend under `backend/` so Compose can build and expose `/api/v1/health` without pulling Story 1.2's Express boilerplate into scope.
- Added `tests/story-1-1.test.mjs` to validate the scaffold structure, env vars, compose topology, nginx proxy config, and backend health contract.
- Completed Docker-based acceptance verification after Docker Desktop was launched and daemon access was escalated outside the sandbox.
- Verified the default stack runs as expected: `nginx`, `express-api`, `llm-proxy`, `mongo`, and `redis` are up; `cron-worker` is excluded by default.
- Verified the nginx proxy path returns the expected health payload through `http://localhost:8080/api/v1/health`.

### File List

- `.env.template`
- `.gitignore`
- `README.md`
- `_bmad-output/implementation-artifacts/1-1-monorepo-scaffold-docker-compose.md`
- `backend/Dockerfile`
- `backend/package.json`
- `backend/src/cron-worker.mjs`
- `backend/src/express-api.mjs`
- `backend/src/llm-proxy.mjs`
- `docker-compose.yml`
- `frontend/.gitkeep`
- `nginx/nginx.conf`
- `tests/story-1-1.test.mjs`

### Change Log

- 2026-06-04: Implemented the Story 1.1 infrastructure scaffold, placeholder backend runtime, root documentation, and story-specific tests.
- 2026-06-04: Completed Docker-based runtime verification and advanced story status from `in-progress` to `review`.
