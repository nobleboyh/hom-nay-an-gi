# Code Placement Conventions

Use this rule first: place code by ownership, not by type.

- If it is reused by multiple backend services, put it in `backend/packages/shared/`.
- If it belongs to one runtime only, keep it inside that app.
- If it affects the whole repository or delivery pipeline, keep it at the root.
- If it is client-only behavior, keep it in `frontend/`.

## Current Project Shape

The repo is organized into these main areas:

- `backend/apps/express-api/`: main REST API runtime
- `backend/apps/llm-proxy/`: internal LLM-facing runtime
- `backend/apps/cron-worker/`: background job runtime
- `backend/packages/shared/`: reusable backend building blocks
- `frontend/`: Expo client app
- `.github/workflows/`: CI/CD workflows
- `docker-compose.yml` and `nginx/`: local infrastructure wiring
- `_bmad-output/`: planning and implementation artifacts

## Placement Rules

### Put it in `backend/packages/shared/` when

- More than one backend app should import it
- It is a shared contract or shared runtime behavior
- It is backend infrastructure rather than feature-specific app logic

Typical examples:

- error classes
- reusable Express middleware
- response envelope builders
- shared logger utilities
- env/config parsing
- shared Zod schemas
- shared Mongoose models

Good locations:

- `backend/packages/shared/src/common/`
- `backend/packages/shared/src/config/`
- `backend/packages/shared/src/models/`
- `backend/packages/shared/src/data/`

### Put it in `backend/apps/express-api/` when

- It is specific to the public API runtime
- It defines routes, controllers, API-only orchestration, or app bootstrap behavior

Typical examples:

- route registration
- request handlers
- API-specific service composition
- HTTP endpoint tests

### Put it in `backend/apps/llm-proxy/` when

- It is specific to the internal LLM runtime
- It manages provider calls, fallback behavior, circuit breakers, or proxy-only endpoints

Typical examples:

- provider adapters
- prompt execution flow
- retry/fallback logic
- proxy health or completion endpoints

### Put it in `backend/apps/cron-worker/` when

- It is a scheduled or background process
- It should run separately from request/response traffic

Typical examples:

- refresh jobs
- sync jobs
- scheduled maintenance tasks

### Put it in `frontend/` when

- It only affects the client app
- It is UI, client-side state, navigation, or local client utilities

Typical examples:

- screens: `frontend/app/`
- reusable UI: `frontend/components/`
- helpers: `frontend/lib/`
- state: `frontend/stores/`
- shared client types: `frontend/types/`

### Put it at the repository root when

- It is repo-wide infrastructure
- It affects local environment setup, build, or delivery automation

Typical examples:

- GitHub Actions workflows in `.github/workflows/`
- Docker Compose changes in `docker-compose.yml`
- reverse proxy changes in `nginx/`
- top-level onboarding or architecture docs in `README.md` or `docs/`

## Quick Examples

- Add a reusable `NotAuthorizedError`
  Put it in `backend/packages/shared/src/common/utils/errors.ts`

- Add a generic request validation middleware
  Put it in `backend/packages/shared/src/common/middleware/`

- Add a new `/api/v1/recipes/search` endpoint
  Put it in `backend/apps/express-api/src/`

- Add Gemini/OpenAI provider fallback logic
  Put it in `backend/apps/llm-proxy/src/`

- Add a scheduled trending refresh job
  Put it in `backend/apps/cron-worker/src/`

- Add an offline banner or toast
  Put it in `frontend/lib/` and `frontend/components/`

- Add GitHub Actions checks
  Put them in `.github/workflows/`

## Decision Test

Ask these questions in order:

1. Will more than one backend app import this?
2. Is this specific to one runtime?
3. Is this client-only?
4. Is this repo-level infrastructure or automation?

Use the answers like this:

- `yes` to 1: `backend/packages/shared/`
- `yes` to 2: the matching app under `backend/apps/`
- `yes` to 3: `frontend/`
- `yes` to 4: root-level infrastructure folders

## Guardrail

Do not put code into `shared` just because it feels utility-like.

If it only serves one app today and there is no clear second consumer, keep it local to that app. Move it to `shared` only when reuse is real or strongly expected.
