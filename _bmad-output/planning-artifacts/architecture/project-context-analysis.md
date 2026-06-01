# Project Context Analysis

## Requirements Overview

**Functional Requirements (27 FRs, reconciled with hard constraints):**

| Domain | Active FRs | Cut/Modified |
|--------|-----------|--------------|
| Ingredient Input | FR-1 (text), FR-4 (quantity) | FR-2 (voice) ✂️, FR-3 camera ✂️ |
| Filtering & Tags | FR-5, FR-6, FR-7, FR-8 | All active |
| Results & Recipe | FR-9, FR-10, FR-11, FR-12 | FR-11 calorie = LLM estimate |
| Discovery Mode | FR-13 (Surprise Me), FR-14 (trending), FR-16 (price), FR-17 (personalized) | FR-15 (distance) 🔄 HERE Maps |
| Account & Sync | FR-18, FR-19, FR-20 | FR-19 = Google OAuth + email |
| My Favorites | FR-21, FR-22 | All active |
| Settings | FR-23, FR-24, FR-25, FR-26, FR-27 | All active |

**Non-Functional Requirements:**

- Bilingual UI (Vietnamese-primary, English-secondary)
- Cross-platform mobile (Expo: iOS + Android)
- Offline capability (guest mode with SQLite local storage)
- WCAG 2.1 AA accessibility (React Native accessibility API mapping)
- Performance: sub-3s search response for cached searches (p95), sub-8s for uncached/LLM-path with streaming fallback (p95). Every p95 miss logged at `warn` level with `requestId`. Error budget: 5% of search requests may exceed p95 threshold before triggering investigation.
- Security: OAuth 2.0, bcrypt password hashing, JWT + Redis blocklist
- Privacy: guest data isolation, account deletion cascade, 90-day history TTL

## Scale & Complexity

- **Primary domain:** Full-stack mobile
- **Complexity level:** Medium
- **Estimated architectural components:** 6 Docker services, 7 frontend screens, 2 databases, 2 external APIs (LLM + HERE Maps)
- **Complexity drivers:** Dual-storage sync (SQLite↔MongoDB), LLM-as-database pattern, i18n infrastructure, dual-auth model, dual-storage query divergence (SQLite FTS5 vs MongoDB `$text` indexes, schema migrations)

## Technical Constraints & Dependencies

**Architectural decisions (user-confirmed):**

| Decision | Rationale |
|----------|-----------|
| **LLM-only recipe search** | No free recipe API covers Vietnamese cuisine adequately. Spoonacular (50pts/day), TheMealDB (~5 VN recipes), Edamam (500req/mo) all have negligible VN coverage. LLM + Redis caching + curated seed set provides best VN food experience. |
| **HERE Maps for location discovery** | 250K free transactions/month, best Vietnam POI coverage among free alternatives. Overpass API as zero-cost fallback. Overture Maps bulk dataset considered for future offline pre-load. |
| **Custom RN components (no library)** | OKLCH design tokens, specific border radii, custom chip interactions — no third-party UI library maps well. Build `<Card>`, `<Chip>`, `<Button>`, `<Timeline>`, `<TabBar>`, `<Badge>`, `<Toast>`, `<InputField>`, `<ServingAdjuster>` from RN primitives with baked-in 44px touch targets and accessibility props. |
| **Zustand with storage adapter** | `uiSlice` + `dataSlice`. Data slice routes through a storage adapter that transparently switches between SQLite (guest) and backend API (authenticated). UI never knows auth state. |
| **ExpressJS modular monolith** | Route → Controller → Service → (Model | External Client). Zod validation at the wall. Single error handler. Module-per-domain: auth, recipes, discovery, favorites, settings, sync. |
| **Dual-storage sync** | Client-initiated, three-phase: guest accumulates in SQLite, login triggers full merge POST, post-login incremental sync with `lastSyncAt` timestamps. "Cloud wins" with pragmatic exception for newer client data. |
| **Google OAuth + email/password** | Expo AuthSession for client-side OAuth, Express verifies token server-side. bcrypt for email passwords. JWT access tokens + Redis blocklist for revocation. |

## Cross-Cutting Concerns

| Concern | Resolution |
|---------|-----------|
| Auth state propagation | JWT in `Authorization` header, verified by Express middleware. Zustand adapter switches storage on auth state change. |
| Dual-storage sync protocol | Three-phase client-initiated sync. `POST /api/v1/sync` with deviceId, favorites, history, preferences, lastSyncAt. |
| i18n infrastructure | Vietnamese-first. LLM system prompt language switch. UI strings in a flat key-value catalog. `<span lang="en">` for English phrases. |
| LLM API resilience | Dedicated `llm-proxy` Docker service. Redis response cache with 24h TTL. Zod schema validation on all LLM outputs. Rate limit 30 req/hr/user. |
| Location strategy | HERE Maps Places API (250K free req/month) for restaurant search by radius. No map rendering for MVP — text list with distance + "open in Google Maps" link. |
| API contract design | RESTful, URL-versioned (`/api/v1/...`). OpenAPI 3.1 auto-generated from Zod schemas. Standard envelope: `{success, data, meta}` + typed error codes. |
| Docker service topology | 6 services: nginx (reverse proxy), express-api, llm-proxy, mongo, redis, cron-worker (trending refresh). Internal network for DB, public for API. |
| Observability | OpenTelemetry auto-instrumentation on `express-api` and `llm-proxy` with trace context propagation via HTTP headers. Export to console in dev; OTLP-collector optional for staging. Pino structured JSON logs with `requestId` on every line. |
| State management (Expo) | Zustand with uiSlice + dataSlice. Storage adapter pattern for SQLite/API routing. `tokens.ts` for OKLCH→RGBA constants, animation configs, accessibility defaults. |

## Scope Impact of Architectural Decisions

| PRD Feature | Original | After Architecture |
|-------------|----------|-------------------|
| FR-2 Voice Input | In scope | ✂️ Cut (MVP) |
| FR-3 Camera (object recog) | In scope | ✂️ Cut (MVP) |
| FR-3 Camera (barcode) | In scope | ⚠️ Deferred — evaluate Open Food Facts free API |
| FR-14 Trending via scraping | In scope | 🔄 LLM-generated trending with Redis cache |
| FR-15 Distance-based discovery | In scope (Google Places) | 🔄 HERE Maps + Overpass fallback, text-only list |
| FR-11 Calorie estimation | In scope | ⚠️ LLM-estimated, displayed as "Estimated" |

## Core Loop (Post-Cuts)

**Ingredient input → AI suggests dishes → user picks one → recipe details → (optional) save.**

This is the critical path. If this loop isn't sub-3-second and hallucination-free, nothing else matters. The Discovery feature (FR-15) is a secondary loop that should not block the core loop's quality.
