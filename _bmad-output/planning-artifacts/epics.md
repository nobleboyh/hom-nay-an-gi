---
stepsCompleted: ["step-01-validate-prerequisites", "step-02-design-epics", "step-03-create-stories", "step-04-final-validation"]
inputDocuments:
  - _bmad-output/planning-artifacts/prd-hom-nay-an-gi-2026-05-31/prd.md
  - _bmad-output/planning-artifacts/architecture/index.md
  - _bmad-output/planning-artifacts/architecture/core-architectural-decisions.md
  - _bmad-output/planning-artifacts/architecture/starter-template-evaluation.md
  - _bmad-output/planning-artifacts/architecture/project-structure-boundaries.md
  - _bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md
  - _bmad-output/planning-artifacts/architecture/project-context-analysis.md
  - _bmad-output/planning-artifacts/architecture/architecture-validation-results.md
  - _bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/EXPERIENCE.md
---

# Hôm Nay Ăn Gì - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Hôm Nay Ăn Gì, decomposing the requirements from the PRD, UX Design, and Architecture requirements into implementable stories.

**Total stories: 31** (26 feature stories + 5 cross-cutting quality/infrastructure stories)
**Last reviewed:** 2026-06-01 (Party Mode multi-agent review — John/PM, Winston/Architect, Amelia/Dev, Sally/UX)
**Key review outcomes:** FR-4 deferred, FR-27 (dark mode) deferred, Docker network topology fixed, LLM fallback strategy added, save button wired to guest SQLite, sync protocol hardened, testing coverage expanded, 5 new stories added (1.10, 4.9, Q.1–Q.3).

## Requirements Inventory

### Functional Requirements

**Status Legend:** ✅ Active | ✂️ Cut (MVP) | ⚠️ Deferred

| FR | Title | Status |
|----|-------|--------|
| FR-1 | Text Ingredient Input — Type ingredients via comma-separated text (1-20 items, 500 char max). | ✅ |
| FR-2 | Voice Ingredient Input — Tap mic, speak ingredients, speech-to-text fills input field. | ✂️ |
| FR-3 | Camera Ingredient Input — Barcode scanning (deferred) + object recognition (cut). | ⚠️ |
| FR-4 | Quantity Adjustment — View/modify quantity per ingredient before search (1-99, stepper). | ⚠️ |
| FR-5 | Food Type Tags — Multi-select AND-logic tags: vegetarian, salad, light, meat-included, salty, sour, sweet, dessert, cuisines. | ✅ |
| FR-6 | Mood / Craving Tags — Optional expandable tags: comfort food, refreshing, indulgent, light, spicy. | ✅ |
| FR-7 | Cooking Time Filter — Preset chip selection: 15/30/60/90+ min, single-select range. | ✅ |
| FR-8 | Serving Size Adjustment — Slider 1-10 on Card/Recipe, scales ingredients + calories in real time. | ✅ |
| FR-9 | Collapsible Card List — Compact/expanded Card accordion, 10 per page infinite scroll, 4 sort modes. | ✅ |
| FR-10 | Visual Cooking Timeline — Horizontal/vertical timeline with parallel tasks, total cook time. | ✅ |
| FR-11 | Calorie Estimation — Per-serving calorie display from LLM estimate, scales with serving size. | ✅ |
| FR-12 | Shopping List Generation — Missing ingredients list with copy/share, from expanded Card. | ✅ |
| FR-13 | Surprise Me — One-tap random Dish suggestion, no filters, works in Guest mode. | ✅ |
| FR-14 | Trending Dishes — LLM-generated trending feed with Redis cache, daily refresh. | ✅ |
| FR-15 | Distance-Based Discovery — HERE Maps Places API, radius selector (1/2/5/10/20km), text list. | ✅ |
| FR-16 | Price Filter — 3-segment: Low (<30k), Mid (30k-80k), High (80k+), multi-select. | ✅ |
| FR-17 | Personalized Discovery — "For You" section for Registered Users based on favorites + history + tags. | ✅ |
| FR-18 | Guest Mode — All core features without login, local SQLite storage, persist across restarts. | ✅ |
| FR-19 | User Registration & Login — Email/password + Google OAuth, session persistence. | ✅ |
| FR-20 | Cloud Sync — Three-phase sync protocol: Guest accumulate → Login merge → Incremental delta. | ✅ |
| FR-21 | Save / Unsave Dish — Bookmark toggle on expanded Card/Recipe, heart icon state. | ✅ |
| FR-22 | My Favorites Screen — Dedicated screen with saved dishes, search/filter, empty state. | ✅ |
| FR-23 | Preferences Management — Dietary, allergies, disliked ingredients, preferred cuisines. | ✅ |
| FR-24 | Notification Settings — Meal time toggles (breakfast/lunch/dinner) + daily suggestion toggle. | ✅ |
| FR-25 | Measurement Units — Metric/Imperial toggle, reflects in all quantities. | ✅ |
| FR-26 | Privacy Controls — Clear history, clear favorites, delete account with confirmation. | ✅ |
| FR-27 | Theme Selection — Light mode only for MVP. Dark mode tokens reserved in `tokens.ts` but dark theme implementation deferred post-MVP. System-default light. | ⚠️ |

### NonFunctional Requirements

| NFR | Category | Description |
|-----|----------|-------------|
| NFR-1 | Platform | Cross-platform mobile via Expo SDK 56: iOS + Android (Web optional). |
| NFR-2 | Language | Bilingual UI: Vietnamese-primary, English-secondary. i18n flat key-value catalog. |
| NFR-3 | Accessibility | WCAG 2.1 AA compliance: ARIA→RN mapping, 44px touch targets, screen reader, focus indicators, skip navigation, prefers-reduced-motion. |
| NFR-4 | Performance | Search response: p95 < 3s cached, p95 < 8s uncached/LLM-path. Error budget: 5%. |
| NFR-5 | Offline | Guest mode with SQLite local storage, offline UX states on all screens. |
| NFR-6 | Security | OAuth 2.0 (Google), bcrypt (12 rounds), JWT (access: 15min, refresh: 30d) + Redis blocklist, Helmet, CORS, internal Docker network for DB. |
| NFR-7 | Privacy | Guest data isolation, account deletion cascade (30-day grace + TTL), 90-day history TTL, soft-delete. |
| NFR-8 | Observability | OpenTelemetry auto-instrumentation on express-api + llm-proxy, Pino structured JSON logs with requestId, trace context propagation. |
| NFR-9 | Rate Limiting | 30 req/hr/user (LLM endpoints), 100 req/min (general API). |
| NFR-10 | Reliability | LLM: 1 retry after 2s on timeout/502. Network: 2 retries with exponential backoff (1s, 3s). Auth: 1 refresh attempt on 401. |
| NFR-11 | Code Quality | Backend: biome lint/format + vitest. Frontend: eslint + tsc + expo test. GitHub Actions CI. |
| NFR-12 | Error Tracking | Client-side crash/error reporting via Sentry or equivalent. Backend errors tracked via OpenTelemetry. |
| NFR-13 | Network Resilience | Reachability detection on all screens via `@react-native-community/netinfo`. Offline state triggers cached fallback with user-visible indicator. |
| NFR-14 | Notification Infrastructure | Local notification scheduling via expo-notifications for meal time reminders. OS permission prompt on first enable. |

### Additional Requirements (from Architecture)

**Starter Template (CRITICAL — Epic 1 Story 1):**
- **Frontend:** `npx create-expo-app@latest --template default@sdk-56 hom-nay-an-gi`
- **Backend:** `edwinhern/express-typescript` boilerplate (Express 5.x, TypeScript strict, Zod, Pino, Vitest, pnpm)

**Infrastructure:**
- Docker Compose with 6 services: nginx, express-api, llm-proxy, mongo, redis, cron-worker (profile: full)
- MongoDB 8.x + Mongoose for authenticated user data
- SQLite (expo-sqlite) for on-device guest storage
- Redis 7.x for session store, LLM cache, rate-limit counters
- Internal Docker network for DBs (port 27017 not exposed)

**External APIs:**
- LLM: Gemini 2.5 Flash primary (1,500 req/day free), provider abstraction via `LLM_PROVIDER` env var
- Location: HERE Maps Places API (250K free req/month) + Overpass API fallback
- Barcode: Open Food Facts (deferred post-MVP)

**State Management (Frontend):**
- 3 Zustand stores: `uiStore` (ephemeral), `dataStore` (persistent), `authStore` (token lifecycle)
- `storageAdapter.ts` — routes reads/writes between expo-sqlite (guest) and API (authenticated)

**Component Architecture:**
- 18 custom RN components: 9 primitives + 9 composites
- Primitives: Card, Chip, Button, Timeline, TabBar, Badge, Toast, InputField, ServingAdjuster
- Composites: ChipRow, ResultCard, SortDropdown, EmptyState, Skeleton, DishCard, RestaurantCard, CollapsibleSection, BenefitsCard, TipCard

**Design System:**
- `tokens.ts` — single source of truth: OKLCH→RGBA colors, typography stacks, spacing, radii, shadows, z-index, animation configs, accessibility prop defaults

**Data & Schemas:**
- 4 Mongoose schemas: User, Favorite, SearchHistory, UserPreference
- Seed recipe data: `backend/src/data/seed-recipes.json` with Zod validation, minimum 20 Vietnamese recipes (gates recipe endpoint)
- Sync protocol: Three-phase client-initiated (Guest → Login Merge → Incremental Delta)

**API Design:**
- RESTful, URL-versioned (`/api/v1/...`), OpenAPI 3.1 from Zod schemas
- Standard envelope: `{ success, data, meta }` with typed error codes
- 6 Backend domain modules: auth, recipes, discovery, favorites, settings, sync

**Naming Conventions:**
- Backend: camelCase files/dirs/ functions, PascalCase models/interfaces, UPPER_SNAKE_CASE constants
- Frontend: PascalCase components, kebab-case routes, `use`-prefixed hooks, camelCase stores+utils
- API: kebab-case plural nouns endpoints, camelCase query/path params and JSON keys

**CI/CD:**
- GitHub Actions: lint (biome/eslint), type-check (tsc), test (vitest/expo test)
- `.env.template` committed, `.env` gitignored

**Pre-Implementation Prerequisites (block implementation start):**
1. Seed recipe schema + 20 sample recipes (`backend/src/data/seed-recipes.json`)
2. SLO definition confirmed (p95 < 3s cached, p95 < 8s uncached)

### UX Design Requirements

**Design Token Work:**
- UX-DR1: Implement `tokens.ts` — OKLCH color system (11 semantic tokens: bg, surface, fg, muted, border, accent, accent-dim, accent-strong, success, warn, danger), typography stacks (display/body/mono with 10 size roles), spacing scale (11 steps 2px–44px), border radius scale (5 steps + full), shadow tokens (3 levels), z-index scale (5 levels), animation tokens (3 durations + 3 easings).
- UX-DR2: Light mode as default; dark mode tokens reserved but implementation deferred.

**Typography Implementation:**
- UX-DR3: Font loading — Display font: Söhne → Avenir Next → system-ui. Body font: SF Pro Text → system-ui. Mono font: JetBrains Mono → ui-monospace. Vietnamese diacritic support as primary concern.
- UX-DR4: Responsive type scale using `clamp()` or `rem` for OS-level text scaling. UI must remain legible at largest accessibility text size.

**Component Library (18 components — ship primitives first):**
- UX-DR5: Build 9 primitive components with baked-in 44px touch targets and accessibility props: Card, Chip, Button (Primary/Secondary/Ghost/Destructive), Timeline, TabBar, Badge, Toast, InputField, ServingAdjuster.
- UX-DR6: Build 9 composite components: ChipRow, ResultCard (accordion: one expanded at a time), SortDropdown, EmptyState, Skeleton (shimmer animation), DishCard (discover grid), RestaurantCard (nearby list), CollapsibleSection, BenefitsCard, TipCard.
- UX-DR7: Match Badge — percentage as numeric text (not color alone), background `--accent-dim`, text `--accent-strong`, `--radius-full`.

**Screen Implementations (7 screens):**
- UX-DR8: HomeScreen — Ingredient input with placeholder, comma-parsed ingredient chips (removable, 44px ✕ target), food type chip row (AND logic, multi-select), cuisine chip row (default: Việt Nam active), mood tags collapsible section (hidden by default), cook time chips (single-select, default: 30 phút), Tìm món + Bất ngờ! buttons.
- UX-DR9: ResultsScreen — Sort dropdown, accordion ResultCard list (one expanded at a time), infinite scroll, empty end-of-list marker. 5 states: loading (3-4 skeleton cards), empty, error (toast + retry), offline (cached data), success.
- UX-DR10: RecipeScreen — 16:9 hero image placeholder, dish name, cook time, calorie display, cuisine chips, save button, ServingAdjuster (1-10, default 2), owned vs missing ingredient list, vertical dot-and-bar Timeline `<ol>`, shopping list + copy buttons. 5 states.
- UX-DR11: DiscoverScreen — Location display card with district name + "Thay đổi" button, tab selector chip row (Tất cả/Trending/Nearby/New/Highly rated), 2-column DishCard grid (trending), vertical RestaurantCard list (nearby), cuisine + price filter chip rows. 5 states + zero results empty state with "Xoá bộ lọc" CTA.
- UX-DR12: FavoritesScreen — Real-time client-side search input, horizontal FavoriteItem cards (thumbnail, name, cook time, calories, cuisine chips, filled-heart remove), remove animation (scale-down + fade-out 200ms + toast). 5 states + distinct "no search matches" vs "no favorites" empty states.
- UX-DR13: ShoppingListScreen — Recipe reference card header, owned items (checked checkboxes, "Bạn đã có"), missing items (unchecked, accent + ⚠️, "Cần mua thêm 🛒"), TipCard (accent-tinted savings suggestion), Save list + Copy list buttons, toast on save. 5 states.
- UX-DR14: LoginScreen — Email + password inputs, "Đăng nhập" primary button, "Tiếp tục mà không đăng nhập" secondary button, BenefitsCard (accent-tinted: sync, smarter suggestions, saved lists), "Đăng ký" placeholder link. 5 states + rate-limited state + inline error (not just toast), guest redirect flow.

**Accessibility (WCAG 2.1 AA):**
- UX-DR15: ARIA→React Native mapping — `accessibilityRole`, `accessibilityState.expanded/selected`, `accessibilityLabel`, `accessibilityLiveRegion`, `importantForAccessibility`, `accessibilityViewIsModal`.
- UX-DR16: Keyboard/screen reader — All interactive elements as native `<button>`/`<input>` or explicit `role="button"` + Enter/Space `onkeydown`. No keyboard-inaccessible elements.
- UX-DR17: Skip navigation link — visually-hidden "Bỏ qua điều hướng → #main-content" as first focusable element on every screen.
- UX-DR18: Focus indicators — `outline: 2px solid --accent; outline-offset: 2px` on all interactive elements via `:focus-visible`.
- UX-DR19: Landmarks & headings — `role="banner"` (top bar), `role="navigation"` (tab bar), `main` / `id="main-content"` on content, logical `h1`→`h2`→`h3` hierarchy.
- UX-DR20: Semantic components — Toast: `role="status"` + `aria-live="polite"`, EmptyState: `role="status"`, Timeline: `<ol>` + `<li>`, Checkboxes: `<input type="checkbox">` + `<label>`, Tab bar: `aria-current="page"`, Skeleton: `aria-busy="true"`.
- UX-DR21: Color independence — Tag selected state uses fill + bold + border (not color alone), checkbox uses background + line-through + color, match badge includes numeric text.
- UX-DR22: Dynamic type — System fonts, `clamp()`/`rem` sizing, legible at largest accessibility text size.

**Interaction Patterns:**
- UX-DR23: Toast system — Fixed bottom 100px, dark bg, centered, `aria-live="polite"`, auto-dismiss 4s minimum, fade-only animation, respects `prefers-reduced-motion`.
- UX-DR24: Accordion behavior — Result cards: tap to expand, only one open at a time. Expand/collapse via `<button>` element.
- UX-DR25: Animation — react-native-reanimated integration, `prefers-reduced-motion` via `AccessibilityInfo.isReduceMotionEnabled()`, opacity-only transitions when reduced.
- UX-DR26: Back navigation — "‹" character in top bar, platform-native where possible in production.
- UX-DR27: Infinite scroll — Implement for non-trivial result sets (prototype limitation).
- UX-DR28: Pull-to-refresh — Add on Results and Discover screens (prototype limitation).

**Responsive & Platform:**
- UX-DR29: Mobile-first — 390×844 canvas, max-width 430px centered, safe area handling (20px bottom padding for iOS home indicator).
- UX-DR30: No tablet/desktop layout for MVP — responsive scaling with centered max-width container if viewed larger.

**Banned Interactions (per UX spec):**
- UX-DR31: No carousels, no hero animations on open, no parallax scrolling, no custom swipe gestures, no drag-to-reorder, no long-press (except system text selection). **Enforcement:** All component and screen stories must reference this constraint in technical tasks. CI lint rule or code review checklist should flag violations.

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR-1 | Epic 2 | Text Ingredient Input |
| FR-4 | ✂️ Deferred | Quantity Adjustment — deferred post-MVP (ServingAdjuster FR-8 covers serving-level scaling) |
| FR-5 | Epic 2 | Food Type Tags |
| FR-6 | Epic 2 | Mood/Craving Tags |
| FR-7 | Epic 2 | Cooking Time Filter |
| FR-8 | Epic 2 | Serving Size Adjustment |
| FR-9 | Epic 2 | Collapsible Card List |
| FR-10 | Epic 2 | Visual Cooking Timeline |
| FR-11 | Epic 2 | Calorie Estimation |
| FR-12 | Epic 2 | Shopping List Generation |
| FR-13 | Epic 2 | Surprise Me |
| FR-14 | Epic 3 | Trending Dishes |
| FR-15 | Epic 3 | Distance-Based Discovery (HERE Maps) |
| FR-16 | Epic 3 | Price Filter |
| FR-17 | Epic 3 | Personalized Discovery |
| FR-18 | Epic 4 | Guest Mode |
| FR-19 | Epic 4 | User Registration & Login |
| FR-20 | Epic 4 | Cloud Sync |
| FR-21 | Epic 4 | Save/Unsave Dish |
| FR-22 | Epic 4 | My Favorites Screen |
| FR-23 | Epic 4 | Preferences Management |
| FR-24 | Epic 4 | Notification Settings |
| FR-25 | Epic 4 | Measurement Units |
| FR-26 | Epic 4 | Privacy Controls |
| FR-27 | ⚠️ Deferred | Theme Selection — light mode only for MVP; dark theme deferred post-MVP |

## Epic List

### Dependency Graph (Epic Level)

```
Epic 1: Project Initialization & Foundation
           │
    ┌──────┼──────┐
    ▼      ▼      ▼
 Epic 2  Epic 3  Epic 4
(Core   (Discover) (Accounts,
Search)             Favorites
                    & Personalization)
```

**Epic 2, 3, and 4 are predominantly independent of each other. They only depend on Epic 1.**

**Soft dependencies (manageable, non-blocking):**
- Epic 3 (For You) → Epic 4 (User Preferences): `GET /api/v1/discovery/for-you` requires auth + preferences. Falls back to trending for guests. Treat "For You" as a post-Epic-4 integration milestone.
- Epic 4 (FavoritesScreen) → Epic 2 (RecipeScreen): FavoritesScreen navigates to `recipe/[id].tsx`. Epic 1 provides the route shell; Epic 2 fills it with content. Stub acceptable if Epic 4 ships first.
- Save button: Epic 2 wires to guest SQLite immediately. Epic 4 adds authenticated sync. No dependency — Epic 2 save works on day one.

**Quality Stories (Q.1–Q.3):** Run after all feature epics (2, 3, 4) are complete. Validate accessibility, performance, and end-to-end flows.

**New stories added per review findings:**
- Story 1.10: Client Error Monitoring (Sentry)
- Story 4.9: Notification Infrastructure (local notifications)
- Story Q.1: Accessibility Audit (WCAG 2.1 AA)
- Story Q.2: Performance Validation (SLO verification)
- Story Q.3: E2E Smoke Tests (5 core user journeys)

### Epic 1: Project Initialization & Foundation

**Goal:** The development team has a fully scaffolded monorepo with Docker infrastructure, design system, component library, seed data, and CI/CD — enabling all feature epics to begin independently.

**FRs covered:** Infrastructure, patterns, CI/CD, error monitoring (enables all NFRs + NFR-12)
**UX-DRs covered:** All design tokens, all primitive + composite components, navigation shell, accessibility infrastructure, network status

### Story 1.1: Monorepo Scaffold + Docker Compose

As a **developer**,
I want a containerized monorepo with Docker Compose infrastructure,
So that all backend services (MongoDB, Redis, nginx, express-api, llm-proxy) can be spun up with a single command for local development.

**Acceptance Criteria:**

- **Given** a fresh clone of the repository, **When** I run `docker compose up -d mongo redis` from the project root, **Then** MongoDB 8.x and Redis 7.x containers start and are healthy within 30 seconds (health checks pass).
- **Given** all Docker services are defined, **When** I run `docker compose up -d` from the project root, **Then** 5 services start: nginx, express-api, llm-proxy, mongo, redis (cron-worker excluded by default via profiles). express-api is attached to BOTH `internal` and `public` networks.
- **Given** the Docker Compose file, **When** I inspect `docker-compose.yml`, **Then** MongoDB port 27017 is NOT exposed externally (internal Docker network only). MongoDB and Redis have `healthcheck` directives defined.
- **Given** the project root, **When** I run `ls -la`, **Then** I see `.gitignore`, `.env.template`, `docker-compose.yml`, `README.md`, `nginx/nginx.conf`, and empty `backend/` and `frontend/` directories.
- **Given** the nginx config, **When** I curl `http://localhost:8080/api/v1/health`, **Then** the request is proxied to `express-api:3000`. Local dev uses HTTP on port 8080 (not HTTPS 443). Production HTTPS is configured separately.
- **Given** `.env.template`, **When** I read it, **Then** All required env vars are documented with placeholder values: `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `LLM_PROVIDER`, `LLM_API_KEY`, `HERE_API_KEY`, `MONGO_URI`, `REDIS_URI`.

**Technical Tasks:**
- [ ] Create `docker-compose.yml` with 6 services: nginx (alpine), express-api (build: ./backend), llm-proxy (build: ./backend, custom command), mongo (8.x), redis (7-alpine), cron-worker (profile: full)
- [ ] Define Docker networks: `internal` (bridge, for mongo/redis/llm-proxy) and `public` (bridge, for nginx). express-api attached to BOTH networks so it can reach databases AND receive proxied requests.
- [ ] Define Docker volumes: `mongo-data`, `redis-data`
- [ ] Add `healthcheck` directives for mongo (mongosh ping) and redis (redis-cli ping) with appropriate intervals and retries
- [ ] Create `nginx/nginx.conf` — reverse proxy `http://localhost:8080/api/v1/*` → `express-api:3000`. Use HTTP for local dev (no TLS certs needed). Document production HTTPS config separately.
- [ ] Create `.env.template` with all env vars documented
- [ ] Create `.gitignore` covering: `.env`, `node_modules/`, `dist/`, `.expo/`, `ios/`, `android/`, `mongo-data/`, `redis-data/`, `backups/`
- [ ] Create root `README.md` with: project overview, quick start commands, architecture diagram (showing dual-network topology), env setup instructions

---

### Story 1.2: Backend Initialization (Express TypeScript Boilerplate)

As a **developer**,
I want the Express TypeScript boilerplate initialized in the `backend/` directory,
So that I have a working API server with TypeScript, Zod validation, Pino logging, Vitest testing, and the established module pattern ready for domain modules.

**Acceptance Criteria:**

- **Given** the backend directory, **When** I run `cd backend && pnpm install`, **Then** all dependencies install without errors.
- **Given** the backend is running, **When** I run `cd backend && pnpm dev`, **Then** the server starts on port 3000 with live reload via `tsx --watch`.
- **Given** the backend directory structure, **When** I inspect `backend/src/`, **Then** I see: `index.ts` (bootstrap), `server.ts` (app assembly), `config/` (env.ts, database.ts, redis.ts, llm.ts), `common/` (middleware/, models/, utils/), `api/` (empty, ready for domain modules), `api-docs/`, `models/` (empty), `services/` (empty).
- **Given** a GET request to `/api/v1/health`, **When** the server is running, **Then** it returns `{ "success": true, "data": { "status": "ok" } }` with the standard envelope.
- **Given** the boilerplate setup, **When** I run `pnpm typecheck`, **Then** TypeScript strict mode checks pass.
- **Given** the boilerplate setup, **When** I run `pnpm test`, **Then** Vitest runs and the existing health check test passes.
- **Given** the backend, **When** I inspect `package.json`, **Then** Package manager is `pnpm`, and scripts include: `dev`, `build`, `start:prod`, `typecheck`, `lint`, `format`, `test`.

**Technical Tasks:**
- [ ] Clone `edwinhern/express-typescript` boilerplate into `backend/`
- [ ] **Restructure boilerplate**: Remove example modules (`api/healthCheck/`, `api/user/`), create target directory structure: `config/`, `common/middleware/`, `common/models/`, `common/utils/`, `api/` (empty), `services/`, `models/`. Fix all import paths in `server.ts` and `index.ts`.
- [ ] Customize `package.json`: rename to `hom-nay-an-gi-backend`, configure pnpm scripts, add llm-proxy entrypoint script
- [ ] Set up `backend/src/config/env.ts` — Zod-validated env schema: `NODE_ENV`, `PORT`, `MONGO_URI`, `REDIS_URI`, `LLM_PROXY_URL`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `HERE_API_KEY`, `CORS_ORIGIN`
- [ ] Set up `backend/src/config/database.ts` — Mongoose connection with retry logic (exponential backoff, max 5 attempts)
- [ ] Set up `backend/src/config/redis.ts` — ioredis client with connection handling
- [ ] Set up `backend/src/config/llm.ts` — reads `LLM_PROVIDER` env, exports provider config
- [ ] Create `backend/src/server.ts` — Express app assembly: helmet, CORS (configure for dynamic Expo dev origins: use `CORS_ORIGIN` env var with localhost + LAN IP + tunnel URL allowlist), JSON body parser, request logger, route mounting points, error handler
- [ ] Create `backend/src/index.ts` — server bootstrap: imports app, connects DB/Redis, calls listen()
- [ ] Create `backend/.env.template` with all backend-specific env vars and placeholder values
- [ ] Create `backend/Dockerfile` — multi-stage: build with pnpm, run with node:22-alpine
- [ ] Set up `biome.json` — extend boilerplate config for project conventions
- [ ] Verify: `pnpm typecheck` passes, `pnpm test` passes, `pnpm dev` starts server

---

### Story 1.3: Frontend Initialization (Expo SDK 56 + Router Shell)

As a **developer**,
I want an Expo SDK 56 project initialized with Expo Router file-based navigation and a 4-tab layout shell,
So that all feature epics can populate their screens independently.

**Acceptance Criteria:**

- **Given** the frontend directory, **When** I run `cd frontend && npm install`, **Then** all dependencies install without errors.
- **Given** the frontend is running, **When** I run `npx expo start`, **Then** the Expo dev server starts and is accessible via Expo Go on a physical device.
- **Given** the Expo Router setup, **When** I open the app, **Then** I see a 4-tab bottom navigation bar with tabs: Trang chủ (Home), Khám phá (Discover), Yêu thích (Favorites), Cá nhân (Profile). Each tab shows a placeholder screen with its title.
- **Given** the routing structure, **When** I inspect `frontend/app/`, **Then** I see: `_layout.tsx` (root layout with providers), `(tabs)/_layout.tsx` (tab navigator), `(tabs)/index.tsx` (Home placeholder), `(tabs)/discover.tsx` (Discover placeholder), `(tabs)/favorites.tsx` (Favorites placeholder), `(tabs)/profile.tsx` (Profile/Login placeholder), `recipe/[id].tsx` (Recipe detail route placeholder), `shopping-list.tsx` (Shopping list route placeholder).
- **Given** the project config, **When** I inspect `app.json`, **Then** The app name is "Hôm Nay Ăn Gì", slug is `hom-nay-an-gi`, platforms include `ios` and `android`.
- **Given** the frontend, **When** I run `npx tsc --noEmit`, **Then** TypeScript checks pass without errors.

**Technical Tasks:**
- [ ] Run `npx create-expo-app@latest --template default@sdk-56 frontend` to scaffold
- [ ] Clean up default template: remove boilerplate screens, keep Expo Router setup
- [ ] Create `frontend/app/_layout.tsx` — root layout with SafeAreaProvider, StatusBar, ErrorBoundary (catches uncaught render errors, shows fallback UI instead of white screen), future providers (Zustand, auth context)
- [ ] Create `frontend/components/ErrorBoundary.tsx` — React error boundary with fallback UI, error logging hook
- [ ] Create `frontend/app/(tabs)/_layout.tsx` — 4-tab navigator with icons (home, compass, heart, user), Vietnamese tab labels. Include visually-hidden skip navigation link ("Bỏ qua điều hướng → #main-content") as first focusable element on every route. Configure back navigation header with "‹" character convention (UX-DR26).
- [ ] Create placeholder screens for all 8 routes: each showing screen title text and `role="main"` content region with `id="main-content"` (skip nav target). Include "‹" back button in top bar for non-tab routes (recipe detail, shopping list).
- [ ] Create `frontend/lib/` directory scaffold: `tokens.ts` (empty), `api.ts` (stub), `i18n.ts` (stub), `accessibility.ts` (stub), `networkStatus.ts` (stub), `parseIngredients.ts` (stub), `formatTime.ts` (stub)
- [ ] Create `frontend/types/` directory: `dish.ts`, `user.ts`, `api.ts` — define core TypeScript interfaces
- [ ] Create `frontend/.env.template` — `API_BASE_URL=http://localhost:8080`
- [ ] Install `react-native-reanimated`, `@react-native-community/netinfo` for future animation and network detection needs
- [ ] Verify: `npx tsc --noEmit` passes, `npx expo start` launches dev server

---

### Story 1.4: Design Tokens & i18n Catalog

As a **developer**,
I want a single source of truth for all design tokens (colors, typography, spacing, radii, shadows, z-index, animation) and a bilingual Vietnamese-English string catalog,
So that all components and screens reference consistent values and support both languages from day one.

**Acceptance Criteria:**

- **Given** `tokens.ts`, **When** I import it in any component, **Then** I can access all 11 semantic color tokens as OKLCH values with RGBA fallback: `bg`, `surface`, `fg`, `muted`, `border`, `accent`, `accentDim`, `accentStrong`, `success`, `warn`, `danger`.
- **Given** `tokens.ts`, **When** I inspect typography definitions, **Then** I see 3 font stacks (display, body, mono) and 10 size roles with correct size, weight, and line-height values per DESIGN.md.
- **Given** `tokens.ts`, **When** I inspect spacing definitions, **Then** I see 11 spacing step values from 2px to 44px.
- **Given** `tokens.ts`, **When** I inspect border radius definitions, **Then** I see 5 radius values: xs(6px), sm(8px), md(12px), lg(18px), full(9999px).
- **Given** `tokens.ts`, **When** I inspect shadow definitions, **Then** I see 3 shadow levels: sm, md, lg with correct values.
- **Given** `tokens.ts`, **When** I inspect z-index definitions, **Then** I see 5 levels: base(1), dropdown(50), tabBar(100), toast(200), modal(300).
- **Given** `tokens.ts`, **When** I inspect animation definitions, **Then** I see 3 duration tokens (fast:150ms, normal:200ms, slow:300ms) and 3 easing tokens (default, enter, exit).
- **Given** `i18n.ts`, **When** I look up the key `home.searchButton`, **Then** I get `"Tìm món"` in Vietnamese and `"Find dishes"` in English.
- **Given** `i18n.ts`, **When** I call `getLanguage()`, **Then** It returns `'vi'` by default (Vietnamese-first).
- **Given** `i18n.ts`, **When** I call `setLanguage('en')`, **Then** All subsequent `t()` calls return English strings.
- **Given** `i18n.ts`, **When** I inspect the catalog, **Then** It covers all microcopy strings listed in EXPERIENCE.md Voice and Tone table (40+ key-value pairs).
- **Given** the i18n catalog, **When** I run `pnpm test -- i18n`, **Then** A test verifies every key in `vi` map exists in `en` map and vice versa (no missing translations).

**Technical Tasks:**
- [ ] Create `frontend/lib/tokens.ts` — export `Colors` (11 semantic OKLCH tokens + `oklchToRgba()` conversion helper), `Typography` (3 families + 10 size roles), `Spacing` (11 steps), `Radius` (5 steps + full), `Shadows` (3 levels), `ZIndex` (5 levels), `Animation` (durations + easings + `useReducedMotion()` hook integration)
- [ ] Implement `oklchToRgba()` utility function for converting OKLCH color strings to RGBA at runtime (React Native doesn't support OKLCH natively)
- [ ] Export `accessibilityDefaults` — 44px minimum touch target, focus outline config
- [ ] Create `frontend/lib/i18n.ts` — flat key-value catalog with `vi` and `en` maps, `t(key)` lookup function, `getLanguage()`/`setLanguage()` with AsyncStorage persistence
- [ ] Populate all microcopy strings from EXPERIENCE.md (40+ key-value pairs covering all screens)
- [ ] Add `<span lang="en">` wrapping utility for English phrases within Vietnamese context
- [ ] Verify: import tokens in a test component, render each semantic color, toggle language and verify string changes

---

### Story 1.5: Primitive Component Library (9 components)

> **⚠️ Sizing Note:** This story covers 9 components — plan as 2-3 sprint items. Suggested split: **(1.5a)** Button + Chip + InputField + Badge (4 components), **(1.5b)** Card + TabBar + ServingAdjuster + Toast (4 components), **(1.5c)** Timeline (1 complex component with dot-and-bar rendering). Each sub-story includes its own test file.

As a **developer**,
I want 9 reusable primitive UI components built from React Native primitives with baked-in design tokens, 44px touch targets, and accessibility props,
So that all feature screens can compose UI consistently without reinventing basic elements.

**Acceptance Criteria:**

- **Given** the `<Button>` component, **When** I render it with `variant="primary"`, **Then** It displays with `--accent-strong` background, white text, 14px-24px padding (min 44px height), `--radius-md` (12px). Supports 4 variants: primary, secondary, ghost, destructive. Focus shows outline ring. Loading state shows ActivityIndicator.
- **Given** the `<Card>` component, **When** I render it, **Then** It displays with `--surface` background, 1px `--border` border, `--radius-md` (12px), `--shadow-sm`, 16px padding. Supports `padding` prop override.
- **Given** the `<Chip>` component, **When** I render it with `selected={true}`, **Then** It displays active state: `--accent-dim` background, `--accent` border, `--accent-strong` text, `--radius-full`, 13px-14px padding (min 44px height). Supports `variant` prop: tag, cuisine, time, ingredient. Ingredient variant shows ✕ remove target (44px tap area). Toggles `accessibilityState.selected`.
- **Given** the `<InputField>` component, **When** I render it, **Then** It displays with `--surface` background, 1px `--border` border, `--radius-md` (12px), 12px-16px padding (min 44px height), 16px font. Supports `iconLeft`, `iconRight`, `placeholder`, `error` props. Focus shows border + outline accent.
- **Given** the `<Timeline>` component, **When** I render it with steps array `[{label, duration}]`, **Then** It renders as a vertical dot-and-bar `<ol>` with `<li>` per step. Dots: 15px circle, `--accent` fill, 3px white border. Connecting bar: 3px wide, `--border`. Label: 14px-600, Duration: 12px-`--muted`.
- **Given** the `<TabBar>` component, **When** I render it with 4 tabs, **Then** It displays fixed at bottom, `--surface` bg, 1px top `--border`, 8px top + 20px bottom padding (safe area), max-width 430px. Active tab: `--accent` + `aria-current="page"`. Icons 24x24px. Items flex-1, ≥44px tap target.
- **Given** the `<Badge>` component, **When** I render it with `value="95%"`, **Then** It displays `--accent-dim` background, `--accent-strong` text (numeric — not color alone), `--radius-full`, 2px-10px padding, 12px-600 font.
- **Given** the `<Toast>` component, **When** it appears, **Then** It is fixed at bottom 100px, centered, `--fg` background, `--surface` text, `--radius-md`, 12px-24px padding, z-index 200. Container has `role="status"` and `accessibilityLiveRegion="polite"`. Auto-dismisses after 4s minimum. Fade animation only. Respects `prefers-reduced-motion`.
- **Given** the `<ServingAdjuster>` component, **When** I render it with `value={2} min={1} max={10}`, **Then** It shows − and + buttons flanking the numeric value. Range 1-10, default 2. Buttons are 44px touch targets. `onChange` callback fires with new value.

**Technical Tasks:**
- [ ] Create `frontend/components/Button.tsx` — 4 variants (primary/secondary/ghost/destructive), fullWidth, disabled, loading states, `accessibilityRole="button"`, 44px min-height
- [ ] Create `frontend/components/Card.tsx` — surface card with shadow/border, configurable padding, configurable accessibilityRole
- [ ] Create `frontend/components/Chip.tsx` — toggleable with 4 variants, selected/unselected states, ingredient variant with remove button (44x44px hitSlop), `accessibilityState.selected`, `accessibilityRole="button"`
- [ ] Create `frontend/components/InputField.tsx` — TextInput wrapper with icon slots, error state (`accessibilityInvalid`), focus ring, 44px min-height
- [ ] Create `frontend/components/Timeline.tsx` — steps mapped to `<ol>` with `<li>` items, dot+bar rendering, `accessibilityLabel` per step
- [ ] Create `frontend/components/TabBar.tsx` — 4-tab layout with Expo Router Link integration, icon mapping, active detection, `aria-current="page"`
- [ ] Create `frontend/components/Badge.tsx` — match percentage display, numeric text, color as decorative reinforcement only
- [ ] Create `frontend/components/Toast.tsx` — animated with auto-dismiss (4s), fade transition, `prefers-reduced-motion` detection, `accessibilityLiveRegion="polite"`, `role="status"`
- [ ] Create `frontend/components/ServingAdjuster.tsx` — −/+ stepper, min/max bounds, 44px button targets
- [ ] Create `frontend/components/index.ts` barrel export
- [ ] Write tests for: Button variants, Chip toggle/remove, InputField error state, ServingAdjuster bounds

---

### Story 1.6: Composite Components & Navigation Shell

> **⚠️ Sizing Note:** This story covers 10 composite components plus 4 utility modules — plan as 2-3 sprint items. Suggested split: **(1.6a)** ChipRow + ResultCard + SortDropdown (3 components), **(1.6b)** EmptyState + Skeleton + DishCard + RestaurantCard (4 components), **(1.6c)** CollapsibleSection + BenefitsCard + TipCard + utility modules (api.ts, accessibility.ts, parseIngredients.ts, formatTime.ts).

As a **developer**,
I want composite components that combine primitives for common UI patterns plus the shared API client and accessibility helpers,
So that screen implementations can use higher-level building blocks consistently.

**Acceptance Criteria:**

- **Given** the `<ChipRow>` component, **When** I render it with an array of chip items, **Then** It renders a horizontally scrollable container (no scrollbar) with 8px gap. Supports multiSelect (AND logic) and singleSelect modes.
- **Given** the `<ResultCard>` component, **When** I render it with dish data, **Then** It shows compact header (name + match badge) and collapsible body (photo placeholder, cuisine chips, action buttons). Accordion: only one expanded at a time. Expand via `<button>` with `accessibilityState.expanded`.
- **Given** the `<SortDropdown>` component, **When** I render it, **Then** It shows a styled picker with options: Best match, Lowest cal, Fastest, Dish type.
- **Given** the `<EmptyState>` component, **When** I render it, **Then** It shows centered layout: 64px icon circle, title (17px-600), description (14px-`--muted`, max 280px), optional CTA. Container has `role="status"`.
- **Given** the `<Skeleton>` component, **When** I render it, **Then** It shows shimmer-animated placeholder with `aria-busy="true"`. Supports variants: card, text, circle.
- **Given** the `<DishCard>` component, **When** I render it for discover grid, **Then** It shows 4:3 image area, name, restaurant, rating, price. Hover: translateY(-2px).
- **Given** the `<RestaurantCard>` component, **When** I render it, **Then** It shows horizontal layout: thumbnail, name, distance, rating, price.
- **Given** `<CollapsibleSection>`, **When** I render it, **Then** Header shows chevron (rotates on toggle). Body hidden by default.
- **Given** the `<BenefitsCard>` component, **When** I render it, **Then** It shows accent-tinted card listing login benefits.
- **Given** the `<TipCard>` component, **When** I render it, **Then** It shows accent-tinted card with savings suggestion content.
- **Given** `lib/api.ts`, **When** making a fetch request, **Then** It: (1) reads JWT from secure storage, (2) sets Auth header, (3) parses `{success, data, meta}` envelope, (4) on 401 triggers token refresh → retries once, (5) wraps with timeout (20s LLM, 10s otherwise).
- **Given** `lib/accessibility.ts`, **When** used, **Then** It exports helpers mapping ARIA concepts to React Native accessibility props.

**Technical Tasks:**
- [ ] Create `frontend/components/ChipRow.tsx` — horizontal ScrollView, 8px gap, multiSelect/singleSelect modes
- [ ] Create `frontend/components/ResultCard.tsx` — accordion with animated expand, `accessibilityState.expanded`, button elements
- [ ] Create `frontend/components/SortDropdown.tsx` — native picker with sort options, onChange callback
- [ ] Create `frontend/components/EmptyState.tsx` — centered layout, icon circle, title, description, optional CTA, `role="status"`
- [ ] Create `frontend/components/Skeleton.tsx` — shimmer animation (Animated API), text/card/circle variants, `aria-busy`
- [ ] Create `frontend/components/DishCard.tsx` — discover grid card, 4:3 image area, name/rating/price, hover animation
- [ ] Create `frontend/components/RestaurantCard.tsx` — horizontal list item, thumbnail, name, distance (formatted), rating, price
- [ ] Create `frontend/components/CollapsibleSection.tsx` — animated expand/collapse with LayoutAnimation or Reanimated, chevron rotation
- [ ] Create `frontend/components/BenefitsCard.tsx` — accent-tinted info card with icon + text rows
- [ ] Create `frontend/components/TipCard.tsx` — accent-tinted suggestion card
- [ ] Update `frontend/components/index.ts` barrel export with all composites
- [ ] Create `frontend/lib/api.ts` — centralized fetch wrapper: auth header injection, envelope parsing, 401 retry, timeouts
- [ ] Create `frontend/lib/accessibility.ts` — ARIA→RN mapping helpers: `getAccessibilityProps()`, `getFocusOutline()`, `isReducedMotion()`
- [ ] Create `frontend/lib/parseIngredients.ts` — comma-delimited → array with trim, dedupe, 1-20 range validation
- [ ] Create `frontend/lib/formatTime.ts` — minutes → "X phút" / "X min" with i18n integration
- [ ] Write tests for: ChipRow multi-select, ResultCard accordion, api.ts envelope parsing, parseIngredients edge cases

---

### Story 1.7: Seed Recipe Data & Mongoose Schemas

As a **developer**,
I want a validated seed dataset of at least 20 Vietnamese recipes and all 4 Mongoose schemas defined,
So that the LLM recipe search endpoint has a quality baseline and the database layer is ready for domain module integration.

**Acceptance Criteria:**

- **Given** `backend/src/data/seed-recipes.json`, **When** I validate it against the Zod schema, **Then** All 20+ recipes pass validation with no errors.
- **Given** a seed recipe entry, **When** I inspect it, **Then** It includes: `dishId` (UUID), `name` (Vietnamese), `nameEn` (English), `cuisine`, `ingredients` array ({name, quantity, unit}), `steps` array ({label, durationMinutes, parallelGroup?}), `totalCookTimeMinutes`, `caloriesPerServing`, `tags` array, `imageDescription`.
- **Given** the seed recipes, **When** I review them, **Then** At least 15 of 20 are Vietnamese dishes covering diverse cuisines and cook times.
- **Given** the 4 Mongoose schemas, **When** I inspect `backend/src/models/`, **Then** All schemas (User, Favorite, SearchHistory, UserPreference) match the Architecture data model specifications with correct indexes and types.

**Technical Tasks:**
- [ ] Create `backend/src/data/seed-recipes.schema.ts` — Zod validation schema for seed recipe format
- [ ] Create `backend/src/data/seed-recipes.json` — 20 Vietnamese recipes with complete data (ingredients, steps with parallel groups, realistic cook times and calories)
- [ ] Create validation test: reads JSON, validates each entry against Zod schema, asserts 20+ valid entries
- [ ] Create `backend/src/models/User.ts` — Mongoose schema with indexes, pre-save hooks (email unique sparse, googleId unique sparse, deletedAt TTL)
- [ ] Create `backend/src/models/Favorite.ts` — compound unique index {userId, dishId}, sort index {userId, savedAt: -1}
- [ ] Create `backend/src/models/SearchHistory.ts` — TTL index on expiresAt (createdAt + 90 days)
- [ ] Create `backend/src/models/UserPreference.ts` — unique userId index
- [ ] Create `backend/src/models/index.ts` — barrel export
- [ ] Add MongoDB connection test: connects to mongo container, writes/reads a test document
- [ ] Write schema validation tests for all 4 models: required fields, unique constraints, TTL behavior, pre-save hooks

---

### Story 1.8: Common Backend Infrastructure

As a **developer**,
I want common middleware (JWT auth stub, validation runner, rate limiter, error handler, request logger), custom error classes, the standard API response envelope, and Pino logging,
So that all domain modules have consistent patterns for auth, validation, errors, and responses.

**Acceptance Criteria:**

- **Given** the `authenticate` middleware, **When** a request has a valid JWT, **Then** It verifies and attaches `req.user = { userId, authProvider }`. Invalid/expired returns 401 `{ code: "AUTH_TOKEN_EXPIRED" }`.
- **Given** the `validate(schema)` middleware, **When** request body matches the Zod schema, **Then** It attaches `req.validated` and calls `next()`. Invalid returns 400 `{ code: "VALIDATION_ERROR", details: [...] }`.
- **Given** the `rateLimiter` middleware, **When** configured for LLM (30 req/hr/user), **Then** Excess returns 429 `{ code: "RATE_LIMIT_EXCEEDED" }` with `Retry-After` header.
- **Given** the `errorHandler` middleware, **When** an AppError is thrown, **Then** It returns correct HTTP status, machine-readable code, and human-readable message in standard error envelope.
- **Given** the `requestLogger` middleware, **When** any request is processed, **Then** It logs structured JSON via Pino: method, url, statusCode, responseTime, requestId. Info for normal, warn for 4xx, error for 5xx.
- **Given** the `serviceResponse` utility, **When** building responses, **Then** Success: `{ success: true, data, meta: { requestId, timestamp, version } }`. Error: `{ success: false, error: { code, message, details? }, meta: {...} }`.
- **Given** the custom error classes, **When** throwing `new NotFoundError("Dish")`, **Then** It produces `{ code: "NOT_FOUND", statusCode: 404, userMessage: "Dish not found" }`.
- **Given** the Pino logger, **When** calling `logger.info({ requestId }, "msg")`, **Then** It outputs structured JSON with `requestId` on every log line.

**Technical Tasks:**
- [ ] Create `backend/src/common/utils/errors.ts` — `AppError` base + `NotFoundError`, `ValidationError`, `AuthenticationError`, `LLMError`, `RateLimitError` subclasses
- [ ] Create `backend/src/common/utils/logger.ts` — Pino instance, `pino-pretty` in dev, JSON in prod
- [ ] Create `backend/src/common/models/serviceResponse.ts` — `ServiceResponse.success(data, meta)` and `ServiceResponse.failure(error, meta)` typed builders
- [ ] Create `backend/src/common/middleware/authenticate.ts` — JWT verification, extracts userId + authProvider, stub mode configurable
- [ ] Create `backend/src/common/middleware/validate.ts` — Zod schema validation runner for body/query/params
- [ ] Create `backend/src/common/middleware/rateLimiter.ts` — `generalLimiter` (100/min), `llmLimiter` (30/hr/user)
- [ ] Create `backend/src/common/middleware/errorHandler.ts` — centralized handler: maps AppError subclasses to HTTP, never leaks stack traces in prod
- [ ] Create `backend/src/common/middleware/requestLogger.ts` — Pino HTTP logging with requestId generation, response time
- [ ] Create `backend/src/common/middleware/asyncHandler.ts` — try/catch wrapper for async route handlers
- [ ] Create `backend/src/common/middleware/index.ts` — barrel export
- [ ] Wire middleware in `server.ts`: requestLogger → rateLimiter → routes → errorHandler
- [ ] Write tests for: authenticate (valid/invalid/expired), validate (valid/invalid), errorHandler (each AppError subclass), serviceResponse format, rateLimiter (time-domain counter increment/decrement)

---

### Story 1.9: CI/CD Workflows & Zustand Store Scaffold

As a **developer**,
I want GitHub Actions CI workflows for both backend and frontend, and Zustand store scaffolding with the StorageAdapter pattern,
So that every push is validated and all screens have state management infrastructure ready for feature epics.

**Acceptance Criteria:**

- **Given** a push to any branch, **When** CI runs `ci-backend.yml`, **Then** It executes: `pnpm typecheck`, `pnpm lint` (biome), `pnpm test` (vitest). Fails on any error.
- **Given** a push to any branch, **When** CI runs `ci-frontend.yml`, **Then** It executes: `npx tsc --noEmit`, `npx eslint .`, `npx expo test`. Fails on any error.
- **Given** the `uiStore`, **When** used, **Then** It provides: `activeTab`, `expandedCardId`, `activeFilters`, `toasts[]`, `isLoading`. Actions: `setActiveTab`, `toggleCard`, `setFilters`, `addToast`/`dismissToast`, `setLoading`.
- **Given** the `dataStore`, **When** in guest mode, **Then** Reads/writes via StorageAdapter to expo-sqlite. In authenticated mode, routes to API. Interface (method signatures, return types) is formally documented and frozen before Epic 2 begins — interface changes require a coordinated update across all consuming screens.
- **Given** the `authStore` (stub), **When** app starts, **Then** `authState` defaults to `'guest'`. Actions: `login` (stub), `loginWithGoogle` (stub), `logout` (sets guest), `refreshToken` (stub).
- **Given** the `storageAdapter`, **When** `authState` is `'guest'`, **Then** Operations target expo-sqlite. When `'authenticated'`, target API via `lib/api.ts`.
- **Given** stores are integrated, **When** navigating tabs, **Then** `uiStore.activeTab` updates and TabBar shows `aria-current="page"` on active tab.
- **Given** `lib/networkStatus.ts`, **When** network connectivity changes, **Then** A `NetworkStatus` provider exposes `{ isOnline, networkType }` via React Context. All screens can read this to trigger offline UI states.

**Technical Tasks:**
- [ ] Create `.github/workflows/ci-backend.yml` — trigger on push/PR to main, Node 22 + pnpm, `pnpm install` in backend/, run typecheck + lint + test
- [ ] Create `.github/workflows/ci-frontend.yml` — trigger on push/PR to main, Node 22 + npm, `npm install` in frontend/, run tsc + eslint + test
- [ ] Create `frontend/lib/networkStatus.ts` — NetworkStatusProvider using `@react-native-community/netinfo`, exposes `{ isOnline, networkType }` via React Context, fires network change events for toast/show/hide
- [ ] Create `frontend/stores/uiStore.ts` — Zustand: `activeTab`, `expandedCardId`, `activeFilters` ({foodTypes, cuisines, cookTime}), `toasts[]`, `isLoading` Record, actions
- [ ] Create `frontend/stores/dataStore.ts` — Zustand: `dishes[]`, `favorites[]`, `searchHistory[]`, `preferences`, per-screen status states, stub actions routing through storageAdapter. **Document and freeze the dataStore interface** (method signatures + return types) so Epic 2 screens can build against stable contracts.
- [ ] Create `frontend/stores/authStore.ts` — Zustand: `authState`, `user`, `accessToken`, `refreshToken`. Stub actions. Token storage via `expo-secure-store`.
- [ ] Create `frontend/stores/storageAdapter.ts` — reads authStore state, routes reads/writes: guest → expo-sqlite, authenticated → api.ts
- [ ] Install `expo-sqlite` and set up guest database schema (tables: `dishes_cache`, `favorites_guest`, `search_history_guest`, `shopping_lists_guest`)
- [ ] Verify `expo-sqlite` and `expo-secure-store` compatibility with Expo SDK 56 (check peer dependency versions, test on both iOS and Android simulators)
- [ ] Wire stores into `app/_layout.tsx` via Zustand provider + NetworkStatusProvider
- [ ] Wire `uiStore.setActiveTab` into TabBar navigation
- [ ] Verify: tab navigation updates store, guest mode writes to SQLite and survives app restart, network status changes trigger UI updates

---

### Story 1.10: Client Error Monitoring

As a **developer**,
I want client-side crash and error reporting integrated from day one,
So that production errors are captured, grouped, and actionable before users report them.

**Acceptance Criteria:**

- **Given** the app is running, **When** an uncaught JavaScript error occurs, **Then** The error is captured and sent to Sentry (or equivalent service) with: stack trace, device info (OS version, Expo SDK version, app version), and breadcrumb trail.
- **Given** the ErrorBoundary (Story 1.3), **When** a render error is caught, **Then** The error is reported to Sentry before showing the fallback UI.
- **Given** the Sentry configuration, **When** running in dev mode, **Then** Error reporting is disabled (no dev noise). Enabled only in production builds.
- **Given** the `.env.template`, **When** I read it, **Then** `SENTRY_DSN` is documented with setup instructions.

**Technical Tasks:**
- [ ] Install `sentry-expo` and configure in `app/_layout.tsx` — initialize with DSN from env, set `enableInExpoDevelopment: false`
- [ ] Wire ErrorBoundary (Story 1.3) to call `Sentry.captureException()` before rendering fallback UI
- [ ] Add `SENTRY_DSN` to `frontend/.env.template` with documentation link
- [ ] Add `sentry-expo` to `app.json` plugins (Expo plugin for native crash reporting on iOS/Android)
- [ ] Verify: throw a test error in dev → not reported; build production → error appears in Sentry dashboard

### Epic 2: Core Search — Từ Nguyên Liệu Đến Món Ăn

**Goal:** A Guest user opens the app, enters ingredients (text), applies filters, browses AI-powered dish suggestions, views recipes with visual timelines, adjusts servings, and generates shopping lists. Plus one-tap "Surprise Me."

**FRs covered:** FR-1, FR-4 through FR-13 (11 FRs)
**Backend:** `api/recipes/`, `services/llmClient`, `services/llmProxyServer`
**Frontend:** HomeScreen, ResultsScreen, RecipeScreen, ShoppingListScreen

### Story 2.1: LLM Integration

As a **user**,
I want AI-powered dish suggestions from my ingredients,
So that I get relevant Vietnamese recipes even when no exact match exists in the database.

**Acceptance Criteria:**

- **Given** the `llmClient.complete()` function, **When** called with an ingredient search prompt and parameters, **Then** It sends a request to the configured LLM provider (Gemini 2.5 Flash default), receives structured JSON, validates against Zod schema, and returns typed result. Provider is swappable via `LLM_PROVIDER` env var.
- **Given** the llm-proxy service, **When** `express-api` calls `llm-proxy:3001`, **Then** The proxy handles the LLM API call and returns the response. LLM API key never leaves the llm-proxy container.
- **Given** the LLM returns a response, **When** Zod validation fails, **Then** The system retries once with the validation error in the prompt. If second attempt also fails, falls back to keyword matching against seed recipes (Jaccard similarity on ingredient names). LLM 502 is never exposed to the user — they always get results (degraded match quality, but never an error page).
- **Given** the LLM call times out (10s deadline), **When** timeout occurs, **Then** Retries once after 2s delay, then falls back to seed recipe keyword matching. Returns 200 with a `meta.degraded: true` flag indicating non-LLM results.
- **Given** Redis cache, **When** searching with the same ingredient+tag+cookTime combination, **Then** Cached result is returned (TTL 24h) without calling LLM. Cache key: `recipe:search:{hash}`.
- **Given** the prompt templates, **When** `UserPreference.language` is `'vi'`, **Then** System prompt is in Vietnamese. When `'en'`, system prompt is in English.
- **Given** a Gemini API outage or rate limit, **When** the primary provider returns 429/503, **Then** llm-proxy programmatically switches to the fallback provider (configured via `LLM_FALLBACK_PROVIDER` + `LLM_FALLBACK_API_KEY` env vars). Circuit breaker opens after 3 consecutive failures, resets after 60s.

**Technical Tasks:**
- [ ] Create `backend/src/services/llmClient.ts` — provider-agnostic wrapper: reads `LLM_PROVIDER` env, maps to Gemini/OpenAI/Anthropic SDK calls, configurable model + temperature, Zod schema validation on response, retry logic (1 retry on validation failure, 1 retry on timeout), **seed-recipe fallback** on total failure (Jaccard similarity keyword matching), circuit breaker (3 consecutive failures → open for 60s), `meta.degraded` flag on fallback responses
- [ ] Create `backend/src/services/llmProxyServer.ts` — standalone Express server (port 3001) that owns the LLM API key, exposes `POST /complete` endpoint, called internally by express-api. Implements provider fallback: primary → fallback provider on 429/503. Circuit breaker at proxy level so failing upstream doesn't cascade retries in express-api.
- [ ] Create `backend/src/services/cacheClient.ts` — Redis wrapper: `get(key)`, `set(key, value, ttl)`, `del(key)`, key pattern: `recipe:search:{hash}`, `surprise:{date}`, `trending:{date}`, `session:{id}`, `rate:{userId}:{endpoint}`
- [ ] Create `backend/src/api/recipes/prompts.ts` — ingredient search prompt (vi/en), surprise me prompt (vi/en), with structured output instructions matching Zod schema. Include few-shot examples with valid JSON outputs.
- [ ] Create `backend/src/services/seedMatcher.ts` — fallback keyword matcher: tokenizes ingredients, computes Jaccard similarity against seed recipes, returns scored results. Used when LLM path fails entirely.
- [ ] **Prompt engineering iteration:** Run 50+ test prompts against Gemini 2.5 Flash, validate structured JSON output consistency, verify Vietnamese cuisine accuracy against seed recipes. Tune prompt templates, few-shot examples, and temperature until >90% valid JSON rate and culturally accurate responses.
- [ ] Define Zod schemas for LLM responses: `DishSchema`, `RecipeSchema`, `IngredientSchema`, `CookingStepSchema` in `backend/src/api/recipes/recipesValidation.ts`
- [ ] Set up `llm-proxy` Dockerfile/service entry in docker-compose (reuse backend build with custom command: `node dist/services/llmProxyServer.js`)
- [ ] Write tests: mock LLM response, verify Zod validation pass/fail, verify retry on failure, verify fallback to seedMatcher, verify cache hit/miss, verify circuit breaker open/close

---

### Story 2.2: Recipes API Module

As a **frontend developer**,
I want RESTful recipe endpoints (search, surprise, get recipe),
So that the app can search dishes by ingredients, get full recipe details, and support the Surprise Me feature.

**Acceptance Criteria:**

- **Given** `GET /api/v1/recipes/search?ingredients=chicken,broccoli&tags=Vietnamese&cookTime=30&offset=0&limit=10`, **When** called, **Then** Returns `{ success: true, data: { dishes: [...], total, offset, limit } }` where each dish has: dishId, name, nameEn, cuisine, matchPercentage, cookTimeMinutes, caloriesPerServing, tags, imageDescription. **matchPercentage formula**: For seed results, `|userIngredients ∩ dishIngredients| / |userIngredients ∪ dishIngredients| × 100` (Jaccard similarity). For LLM results, the LLM provides matchPercentage in its structured output. When LLM path is degraded, `meta.degraded: true` is set.
- **Given** `GET /api/v1/recipes/surprise`, **When** called, **Then** Returns a random dish. No two consecutive calls return the same dishId.
- **Given** `GET /api/v1/recipes/:dishId`, **When** called with a valid dishId, **Then** Returns full recipe: dish metadata + ingredients array + steps array (with label, durationMinutes, parallelGroup) + totalCookTimeMinutes + caloriesPerServing.
- **Given** the search endpoint, **When** called with `offset` and `limit`, **Then** Returns paginated results with `total` count. Default limit: 10.
- **Given** search with 0 ingredients, **When** called with only filters, **Then** Returns all dishes matching filters (no ingredient constraint).
- **Given** search with an unknown ingredient, **When** called, **Then** Returns partial matches with lower match percentages instead of empty results.

**Technical Tasks:**
- [ ] Create `backend/src/api/recipes/recipesRouter.ts` — route definitions: `GET /search`, `GET /surprise`, `GET /:dishId`, all with `authenticate` (optional) middleware
- [ ] Create `backend/src/api/recipes/recipesController.ts` — request parsing, `req.validated` from validate middleware, response formatting via serviceResponse
- [ ] Create `backend/src/api/recipes/recipesService.ts` — `searchByIngredients()`: check Redis cache → call llmClient → validate + cache → return. `getRecipe()`: lookup from cache or seed data. `surpriseMe()`: random dish from seed data or LLM.
- [ ] Create `backend/src/api/recipes/recipesValidation.ts` — Zod schemas for search, surprise, and dish detail parameters
- [ ] Load seed recipes into memory at startup for recipe lookup and Surprise Me random selection
- [ ] Write router tests (Supertest): search with valid params, search with no params, surprise returns dish, getRecipe valid/invalid, pagination

---

### Story 2.3: HomeScreen

As a **user**,
I want to enter my available ingredients and apply filters on a clean home screen,
So that I can quickly discover what dishes I can cook with what I have.

**Acceptance Criteria:**

- **Given** the HomeScreen, **When** I open the app, **Then** I see: app title "Hôm Nay Ăn Gì" (28px-700 display font), an ingredient input field with placeholder "Gõ nguyên liệu, ví dụ: thịt gà, bông cải, trứng", food type chip row (vegetarian, salad, light, meat-included, salty, sour, sweet, dessert), cuisine chip row (Vietnamese default active), mood tags collapsible section (hidden by default, header "Cảm giác thèm" with chevron), cook time chips (15/30/60/90+ phút, 30 active), "Tìm món" primary full-width button, "Bất ngờ!" secondary button.
- **Given** I type "thịt gà, bông cải", **When** I press Enter or tap comma, **Then** Two ingredient chips appear: "Thịt gà ✕" and "Bông cải ✕" with removable behavior.
- **Given** ingredient chips are shown, **When** I tap the ✕ on a chip, **Then** The chip is removed with a 150ms fade animation.
- **Given** I tap a food type chip, **When** it toggles selection, **Then** Active chips show filled state. Multiple chips can be active (AND logic).
- **Given** I tap "Cảm giác thèm" header, **When** the section expands, **Then** Mood tag chips appear. Chevron rotates 180°.
- **Given** I tap a cook time chip, **When** it's selected, **Then** Only one cook time active at a time (single-select range).
- **Given** I tap "Tìm món", **When** pressed with ≥0 ingredients, **Then** `dataStore.fetchDishes(ingredients, filters)` is called, `uiStore.setLoading('search', true)`, navigates to ResultsScreen.
- **Given** I tap "Bất ngờ!", **When** pressed, **Then** `dataStore.fetchSurpriseMe()` is called, navigates directly to RecipeScreen with the random dish.
- **Given** HomeScreen loading/error/offline states, **When** those states occur, **Then** Respective UX states display: skeleton, error toast with retry, offline toast with cached fallback. Default/baseline state shows empty input field with placeholder text and default filter selections (cuisine: Việt Nam active, cook time: 30 phút active).

**Technical Tasks:**
- [ ] Implement `frontend/app/(tabs)/index.tsx` — HomeScreen with full component composition and conditional render (Home vs Results based on state)
- [ ] Wire InputField with `parseIngredients.ts` — comma-delimited parsing, max 20 ingredients validation
- [ ] Wire ChipRow (food type) — AND logic multi-select with tags from PRD §4.2
- [ ] Wire ChipRow (cuisine) — default Việt Nam active, multi-select
- [ ] Wire CollapsibleSection (mood tags) — hidden by default, animated expand/collapse
- [ ] Wire ChipRow (cook time) — single-select, default 30 phút, preset values
- [ ] Wire "Tìm món" Button — calls `dataStore.fetchDishes`, navigates on success
- [ ] Wire "Bất ngờ!" Button — calls `dataStore.fetchSurpriseMe`, navigates to recipe
- [ ] Implement 5 UX states: loading skeleton, error toast, offline toast, success (navigate)
- [ ] Add accessibility: skip navigation link, `h1` title, logical heading hierarchy, `role="main"`
- [ ] Add `useReducedMotion` hook integration for all animations

---

### Story 2.4: ResultsScreen

As a **user**,
I want to browse AI-matched dish suggestions in an accordion card list with sorting,
So that I can quickly find the best dish for my ingredients and mood.

**Acceptance Criteria:**

- **Given** the ResultsScreen, **When** it loads with search results, **Then** I see: results count text "Tìm thấy X món phù hợp", a sort dropdown (Best match/Lowest cal/Fastest/Dish type), and a list of ResultCards in compact view (dish name + match badge + cook time + calories).
- **Given** I tap a compact ResultCard, **When** it expands, **Then** The card reveals: photo placeholder (16:9), cuisine chips, "Xem công thức" primary button, "Mua sắm" secondary button, "♡ Save" button. Only one card expanded at a time (accordion). Save button works immediately in guest mode: writes to SQLite `favorites_guest` table, shows filled heart, triggers toast "Đã lưu vào Yêu thích". No login gate — save is a core interaction.
- **Given** I change the sort option, **When** selecting "Lowest cal", **Then** The card list re-sorts in place without a new API call (client-side sort).
- **Given** I scroll to the bottom, **When** more results exist, **Then** Infinite scroll loads the next 10 cards (offset-based pagination).
- **Given** 0 results, **When** the list is empty, **Then** EmptyState shows "Không còn món nào để hiển thị" (end-of-list marker).
- **Given** loading/error/offline states, **When** those states occur, **Then** Skeleton cards (3-4 shimmer), error toast with retry, offline toast with cached data.

**Technical Tasks:**
- [ ] Implement ResultsScreen — either as a separate route or conditional render within `index.tsx` based on `dataStore` search state
- [ ] Wire SortDropdown component with 4 options, client-side sort logic
- [ ] Wire ResultCard list from `dataStore.dishes` — accordion state in `uiStore.expandedCardId`
- [ ] Wire infinite scroll (FlatList `onEndReached` → `dataStore.fetchDishes` with next offset)
- [ ] Implement pull-to-refresh (`RefreshControl`) to re-run the last search
- [ ] Cache search results in `dataStore` so navigating to RecipeScreen and back preserves the result list (no re-fetch)
- [ ] Wire "Xem công thức" → navigate to `recipe/[id].tsx`
- [ ] Wire "Mua sắm" → navigate to `shopping-list.tsx` with dish data
- [ ] Wire "♡ Save" button — saves to guest SQLite `favorites_guest` immediately (no auth gate). Toast "Đã lưu vào Yêu thích". When user later logs in (Epic 4), saved guest favorites are merged via sync protocol.
- [ ] Implement 5 UX states: loading (3-4 skeleton cards), empty, error (toast + retry), offline (cached/empty), success
- [ ] Add accessibility: each ResultCard is a `<button>`, `accessibilityState.expanded`, match percentage as numeric text

---

### Story 2.5: RecipeScreen

As a **user**,
I want to see a full recipe with cooking timeline, ingredient list (owned vs missing), and adjustable serving size,
So that I know exactly how to cook the dish and what extra ingredients I need.

**Acceptance Criteria:**

- **Given** the RecipeScreen, **When** I navigate from a ResultCard, **Then** I see: 16:9 hero image placeholder, dish name (24px-700 display), total cook time, calorie estimate with "Estimated" label, cuisine chips, ♡ save button (no-op stub).
- **Given** the ServingAdjuster, **When** I tap + from default 2 to 3 servings, **Then** Ingredient quantities and calorie count update in real time (<500ms). Range: 1-10. − disabled at 1, + disabled at 10.
- **Given** the ingredient list, **When** I view it, **Then** Owned ingredients show in default color. Missing ingredients show in `--accent-strong` with ⚠️ indicator.
- **Given** the Timeline, **When** I view recipe steps, **Then** It renders as vertical dot-and-bar `<ol>`. Each step: dot (15px, `--accent`), label (14px-600), duration (12px-`--muted`). Parallel tasks stacked vertically. Connecting bar: 3px `--border`.
- **Given** action buttons, **When** I scroll down, **Then** "Danh sách mua sắm" primary button and "Sao chép" secondary button. Shopping list → navigates to ShoppingListScreen. Copy → toast "📋 Đã sao chép công thức".
- **Given** loading/error/offline states, **When** those occur, **Then** Skeleton (hero + timeline bars + ingredient bars), error toast with back, offline with cached recipe.

**Technical Tasks:**
- [ ] Implement `frontend/app/recipe/[id].tsx` — RecipeScreen with full layout
- [ ] Wire hero image placeholder (ImagePlaceholder, 16:9 aspect ratio)
- [ ] Wire ServingAdjuster — `useState` for servings, recalculate quantities + calories with `useMemo`
- [ ] **Ingredient data flow**: Accept user's original ingredient list via route params (from ResultsScreen) or read from `dataStore.searchIngredients`. Split displayed ingredients into "owned" (user entered) vs "missing" (recipe requires but user didn't enter). Visual differentiation with accent color + ⚠️.
- [ ] Wire Timeline component with recipe steps data from API
- [ ] Wire "Danh sách mua sắm" → navigate to `shopping-list.tsx` with dish + ingredient data as route params (both owned + missing lists)
- [ ] Wire "Sao chép" → Clipboard API, toast feedback
- [ ] Wire "♡ Save" button — saves to guest SQLite `favorites_guest` immediately (same pattern as ResultCard). See Story 2.4 for save behavior contract.
- [ ] Implement 5 UX states: loading (skeleton), error (toast + back), offline (cached recipe), empty (invalid dishId), success
- [ ] Add accessibility: Timeline as `<ol>`, ServingAdjuster buttons with `accessibilityLabel`, logical heading structure

---

### Story 2.6: ShoppingListScreen

As a **user**,
I want a checkable shopping list of ingredients I need to buy,
So that I can go shopping efficiently without forgetting anything.

**Acceptance Criteria:**

- **Given** the ShoppingListScreen, **When** I navigate from RecipeScreen, **Then** I see: recipe reference card header (thumbnail, dish name, servings, cook time), "Bạn đã có" section with owned ingredients (pre-checked checkboxes), "Cần mua thêm 🛒" section with missing ingredients (unchecked, accent + ⚠️), TipCard, "Lưu danh sách" primary button, "Chia sẻ" secondary button (native Share Sheet), "Sao chép" ghost button in top bar.
- **Given** I tap a checkbox on a missing item, **When** it toggles to checked, **Then** The item shows line-through + `--muted` color. Visual change is not color-alone. Checkbox state persists in session — navigating away and back preserves checked state via `dataStore` or route params.
- **Given** I tap "Sao chép", **When** pressed, **Then** Shopping list copied as plain text with toast "📋 Đã sao chép danh sách".
- **Given** I tap "Chia sẻ", **When** pressed, **Then** Native Share Sheet opens with the shopping list as plain text (Expo `Share.share()` API).
- **Given** I tap "Lưu danh sách", **When** pressed, **Then** List saved to SQLite `shopping_lists_guest` table (guest) or API (authenticated). Toast "✅ Đã lưu danh sách mua sắm".
- **Given** all items are checked, **When** both sections fully toggled, **Then** All items show crossed-through. A completion banner appears: "🎉 Mua sắm hoàn tất!" with confetti-like feedback or a subtle celebration state.
- **Given** loading/error/empty states, **When** those occur, **Then** Skeleton (header + 4-5 item bars), error toast with back, "Không có nguyên liệu nào" EmptyState.

**Technical Tasks:**
- [ ] Implement `frontend/app/shopping-list.tsx` — ShoppingListScreen with full layout
- [ ] Wire recipe reference card — dish thumbnail, name, servings, cook time from route params
- [ ] Wire owned items section — pre-checked checkboxes, `<input type="checkbox">` with `<label>`, "Bạn đã có" heading
- [ ] Wire missing items section — unchecked checkboxes, accent color + ⚠️, "Cần mua thêm 🛒" heading
- [ ] Wire checkbox toggle with session persistence — store checked state in component state or `dataStore`, survive back-navigation
- [ ] Wire TipCard — provide actual savings suggestion content (not placeholder text; reference UX spec or write Vietnamese content)
- [ ] Wire "Lưu danh sách" — save to SQLite `shopping_lists_guest` table (guest) or API (authenticated, Epic 4), toast feedback
- [ ] Wire "Chia sẻ" — Expo `Share.share()` for native Share Sheet
- [ ] Wire "Sao chép" — Clipboard API, toast feedback
- [ ] Wire post-completion state — when all items checked, show completion banner
- [ ] Implement 5 UX states: loading, error, offline, empty, success (all checked state)
- [ ] Add accessibility: checkboxes with proper `<label>` association, list structure

### Epic 3: Discovery — Khám Phá

**Goal:** A user taps the Discover tab, sees trending dishes, browses nearby restaurants with distance/rating/price, filters by cuisine and price range, and gets personalized suggestions.

**FRs covered:** FR-14, FR-15, FR-16, FR-17 (4 FRs)
**Backend:** `api/discovery/`, `services/hereMapsClient`
**Frontend:** DiscoverScreen

### Story 3.1: HERE Maps Client

As a **developer**,
I want a HERE Maps Places API client with Overpass API fallback,
So that the app can find nearby restaurants and their dishes without depending on Google Places API costs.

**Acceptance Criteria:**

- **Given** the `hereMapsClient.searchNearby({ lat, lng, radius, cuisine, price })` function, **When** called with valid coordinates, **Then** It queries HERE Maps Places API and returns restaurants with: name, location (lat/lng), distance (meters), cuisine types, price range, rating. Results capped at 20 per query.
- **Given** the HERE Maps API returns an error or is unavailable, **When** the primary call fails, **Then** The Overpass API fallback is attempted for the same query parameters. Overpass results are mapped to the same response format.
- **Given** a search with radius 5000 (5km), **When** called, **Then** Only results within the specified radius are returned, sorted by distance ascending.
- **Given** a search with cuisine filter "Vietnamese", **When** called, **Then** Only restaurants/dish types matching the cuisine are returned.
- **Given** the API key is missing, **When** the client initializes, **Then** It logs a warning and defaults to Overpass API only.

**Technical Tasks:**
- [ ] Create `backend/src/services/hereMapsClient.ts` — HERE Maps Places API wrapper: `searchNearby(params)` using Browse endpoint, `lookupById(placeId)`, configurable radius 1000-20000m, API key from env
- [ ] Create `backend/src/services/overpassClient.ts` — Overpass API fallback: `searchNearby(params)` using Overpass QL queries for restaurants near lat/lng, result mapping to common format
- [ ] Implement circuit breaker pattern: try HERE Maps first (5s timeout) → fallback to Overpass (10s timeout) → return empty if both fail
- [ ] Create shared response type: `NearbyResult { restaurantName, dishName?, distance, rating?, priceRange?, cuisine, externalUrl? }`
- [ ] Add `.env.template` entries: `HERE_API_KEY=your_key_here` with documentation of 250K free req/month
- [ ] Write tests: mock HERE API response, verify result mapping, verify fallback triggers on error

---

### Story 3.2: Discovery API Module

As a **frontend developer**,
I want RESTful discovery endpoints for trending dishes and nearby restaurants,
So that the Discover tab can show relevant content.

**Acceptance Criteria:**

- **Given** `GET /api/v1/discovery/trending?cuisine=Vietnamese&price=mid&offset=0&limit=10`, **When** called, **Then** Returns LLM-generated trending dishes with: dishId, name, nameEn, cuisine, priceRange, trendingRank, imageDescription. Cached in Redis (TTL 6h).
- **Given** `GET /api/v1/discovery/nearby?lat=10.7626&lng=106.6601&radius=5000&cuisine=Vietnamese&price=mid`, **When** called, **Then** Returns restaurants with dishes from HERE Maps: restaurantName, dishName, distance, rating, priceRange, externalUrl.
- **Given** `GET /api/v1/discovery/for-you` with valid auth header, **When** called, **Then** Returns personalized suggestions based on user's favorites, search history, and preferred tags. Falls back to trending if user has no history. **Note:** This endpoint has a soft dependency on Epic 4 (User model, auth middleware, UserPreference schema). For You is an Epic 4 integration milestone — implement as stub returning trending until Epic 4 auth module is complete.
- **Given** `GET /api/v1/discovery/for-you` without auth (guest), **When** called, **Then** Returns 401 `{ code: "AUTH_TOKEN_EXPIRED" }`.
- **Given** the trending endpoint, **When** Redis cache is cold, **Then** LLM generates trending dishes using the trending prompt template, validated against Zod schema.

**Technical Tasks:**
- [ ] Create `backend/src/api/discovery/discoveryRouter.ts` — route definitions: `GET /trending`, `GET /nearby`, `GET /for-you` (authenticate required)
- [ ] Create `backend/src/api/discovery/discoveryController.ts` — request parsing, validate middleware, serviceResponse formatting
- [ ] Create `backend/src/api/discovery/discoveryService.ts` — `getTrending()`: check cache → LLM generate → cache → return. `getNearby()`: call hereMapsClient → map to response. `getForYou(userId)`: lookup favorites + history → LLM personalize → return.
- [ ] Create `backend/src/api/discovery/discoveryValidation.ts` — Zod schemas: `trendingSchema`, `nearbySchema`, `forYouSchema`
- [ ] Create `backend/src/api/discovery/prompts.ts` — trending prompt (vi/en), personalized "for you" prompt (vi/en)
- [ ] Define Zod schemas for discovery LLM responses: `TrendingDishSchema`, `NearbyResultSchema`
- [ ] Write router tests: trending returns paginated results, nearby returns restaurants, for-you requires auth

---

### Story 3.3: DiscoverScreen

As a **user**,
I want to browse trending and nearby dishes on the Discover tab with location awareness,
So that I can discover new food near me without entering ingredients.

**Acceptance Criteria:**

- **Given** the DiscoverScreen, **When** I navigate to Tab 2 (Khám phá), **Then** I see: location display card (district + "Thay đổi" button), tab selector chip row (Tất cả / Đang thịnh hành / Gần tôi / Món mới / Đánh giá cao — single-select), trending 2-column DishCard grid, nearby RestaurantCard vertical list, cuisine filter chip row, price filter chip row (Under 50k / 50k-100k / 100k-200k / Over 200k — multi-select). Pull-to-refresh supported on both trending and nearby sections.
- **Given** the location display, **When** location is available, **Then** Shows district name (e.g., "Quận 1, TP. Hồ Chí Minh"). When unavailable, shows "Đang cập nhật vị trí..." with prompt to enable.
- **Given** I tap "Thay đổi", **When** pressed, **Then** Triggers location update or shows manual district input.
- **Given** the tab selector chips, **When** I select "Gần tôi", **Then** The nearby RestaurantCard list is shown. When I select "Đang thịnh hành", the trending DishCard grid is shown.
- **Given** I tap a DishCard, **When** pressed, **Then** Navigates to RecipeScreen (trending dish) or external link (restaurant dish to delivery partner).
- **Given** I change a filter chip, **When** cuisine or price filter changes, **Then** Results re-fetch with new filter params (debounce 500ms).
- **Given** 0 results after filtering, **When** no dishes match, **Then** EmptyState: "Không có món nào phù hợp" with "Xoá bộ lọc" CTA button.
- **Given** loading/error/offline states, **When** those occur, **Then** Skeleton grid (4-6 card placeholders), error toast with retry, offline with cached trending data.

**Technical Tasks:**
- [ ] Implement `frontend/app/(tabs)/discover.tsx` — DiscoverScreen with full layout
- [ ] Wire location display card — uses `expo-location` to get current position, reverse geocode to district name, manual district input fallback
- [ ] Add iOS/Android location permission strings: `NSLocationWhenInUseUsageDescription` in `app.json` (iOS) and `ACCESS_FINE_LOCATION` in `AndroidManifest.xml` (Android). Vietnamese + English description text.
- [ ] Wire tab selector ChipRow — single-select, controls visible section
- [ ] Wire trending DishCard 2-column grid — FlatList with numColumns=2, data from `GET /api/v1/discovery/trending`
- [ ] Wire nearby RestaurantCard vertical list — FlatList, data from `GET /api/v1/discovery/nearby`
- [ ] Wire cuisine filter ChipRow — multi-select, triggers re-fetch with debounce (500ms)
- [ ] Wire price filter ChipRow — multi-select, triggers re-fetch with debounce (500ms)
- [ ] Wire DishCard tap → navigate to RecipeScreen (trending) or external URL (restaurant, `Linking.openURL()`)
- [ ] Implement pull-to-refresh on both trending and nearby sections (`RefreshControl`)
- [ ] Implement 5 UX states + zero-results empty state with "Xoá bộ lọc" CTA
- [ ] Add skeleton GPS loading spinner while location resolves
- [ ] Add accessibility: location card as `region` landmark, grid as list with `accessibilityLabel` per card
- [ ] Reference UX-DR31 (banned interactions) — no carousels, no hero animations, no parallax on this screen

### Epic 4: Accounts, Favorites & Personalization — Tài Khoản & Cá Nhân Hóa

**Goal:** Users register/login via email or Google, their data syncs across devices, they save favorite dishes, manage dietary preferences, allergens, measurement units, notifications, theme, and privacy — all with full Guest mode fallback. Meal-time reminder notifications keep users engaged.

**FRs covered:** FR-18 through FR-27 (10 FRs), NFR-14 (Notification Infrastructure)
**Backend:** `api/auth/`, `api/sync/`, `api/favorites/`, `api/settings/`, all Mongoose schemas
**Frontend:** LoginScreen, FavoritesScreen, Profile/Settings screens

### Story 4.1: Auth API Module

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

### Story 4.2: LoginScreen

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

### Story 4.3: AuthStore + StorageAdapter

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

### Story 4.4: Favorites API Module

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

### Story 4.5: Sync API Module

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

### Story 4.6: FavoritesScreen

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

### Story 4.7: Settings API Module

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

### Story 4.8: Profile/Settings Screens

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

### Story 4.9: Notification Infrastructure

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

### Cross-Epic Quality Stories

These stories validate the system end-to-end and run after all feature epics (2, 3, 4) are complete.

---

### Story Q.1: Accessibility Audit (WCAG 2.1 AA)

As a **product owner**,
I want automated and manual accessibility validation across all screens,
So that WCAG 2.1 AA compliance is verified before release.

**Acceptance Criteria:**

- **Given** all screens are implemented, **When** an automated accessibility scan runs, **Then** All interactive elements have `accessibilityRole`, all images have `accessibilityLabel`, all form fields have proper labeling, heading hierarchy is logical on every screen.
- **Given** a manual keyboard/screen reader audit, **When** navigating with TalkBack (Android) and VoiceOver (iOS), **Then** All content is reachable, all actions are operable, skip navigation works, focus order is logical.
- **Given** color contrast testing, **When** measuring against WCAG AA thresholds (4.5:1 normal text, 3:1 large text), **Then** All text/background combinations pass.
- **Given** reduced motion preference, **When** system "Reduce Motion" is enabled, **Then** All animations are disabled or replaced with opacity-only transitions.

**Technical Tasks:**
- [ ] Run automated scan with `@axe-core/react` or equivalent on each screen in CI
- [ ] Create accessibility audit checklist: 22 UX-DR items mapped to WCAG success criteria
- [ ] Manual screen reader testing on iOS (VoiceOver) and Android (TalkBack) for all 7 screens
- [ ] Color contrast measurement tool run on all semantic color token pairs
- [ ] Reduced motion testing on both platforms
- [ ] Document findings, file bugs for any failures

---

### Story Q.2: Performance Validation

As a **developer**,
I want performance benchmarks against defined SLOs,
So that we ship with confidence that search and recipe loading meet the p95 targets.

**Acceptance Criteria:**

- **Given** the Recipe Search API, **When** I run 100 cached search requests, **Then** p95 response time is < 3 seconds.
- **Given** the Recipe Search API, **When** I run 100 uncached (LLM-path) search requests, **Then** p95 response time is < 8 seconds. Error rate (502/503) is < 5%.
- **Given** the RecipeScreen, **When** loading a recipe, **Then** Time to Interactive (TTI) is < 1.5s on a mid-range device (iPhone 12 / Pixel 6 equivalent).
- **Given** the app launch (cold start), **When** measured, **Then** App becomes interactive within 2 seconds.

**Technical Tasks:**
- [ ] Create `backend/tests/performance/search.bench.ts` — Artillery or k6 script: 100 cached searches, measure p50/p95/p99
- [ ] Create `backend/tests/performance/search-uncached.bench.ts` — 100 uncached searches with mock LLM latency (500ms-5s range)
- [ ] Run RecipeScreen TTI measurement using React Native profiling tools or Flipper
- [ ] Run cold-start performance measurement on physical iOS and Android devices
- [ ] Record results in `docs/performance-baseline.md`, compare against NFR-4 SLOs

---

### Story Q.3: E2E Smoke Tests

As a **developer**,
I want end-to-end tests covering the core user journeys,
So that regressions in the ingredient-to-recipe flow are caught before reaching users.

**Acceptance Criteria:**

- **Given** the E2E test suite, **When** run in CI, **Then** The following journeys pass:
  1. Guest types ingredients → searches → views results → expands a card → views recipe → adjusts servings → generates shopping list
  2. Guest taps "Bất ngờ!" → views random recipe → saves to favorites → views favorites list
  3. Guest opens Discover tab → scrolls trending → taps a dish → views recipe
  4. User registers (email) → logs in → favorites persist → logs out → returns to guest mode
  5. Network offline → app shows cached data → toast indicates offline status
- **Given** E2E tests, **When** any journey fails, **Then** CI build is marked as failed with a clear screenshot of the failure point.

**Technical Tasks:**
- [ ] Set up Detox or Maestro for React Native E2E testing
- [ ] Write E2E test: guest-search-flow.test.ts (journey 1)
- [ ] Write E2E test: surprise-and-favorites.test.ts (journey 2)
- [ ] Write E2E test: discover-flow.test.ts (journey 3)
- [ ] Write E2E test: auth-flow.test.ts (journey 4)
- [ ] Write E2E test: offline-flow.test.ts (journey 5)
- [ ] Add E2E job to CI workflow (`.github/workflows/ci-e2e.yml`)
- [ ] Configure test device simulator in CI (iOS simulator or Android emulator)

### Cross-Epic Touchpoints

| Touchpoint | Handled By | How |
|-----------|-----------|-----|
| ♡ Save button on RecipeScreen/ResultCard | Epic 2 wires to guest SQLite immediately | Epic 2 renders save button that writes to `favorites_guest` table immediately — no auth gate. Toast confirms. When user later logs in (Epic 4), guest favorites are merged via sync protocol. No no-op stubs — save works on day one. |
| Recipe detail link from Favorites | Epic 1 builds `recipe/[id].tsx` route shell, Epic 2 fills content | FavoritesScreen navigates to route populated by Epic 2. Stub acceptable if Epic 4 ships first. |
| Discover dish → recipe detail | Epic 1 builds route shell, Epic 2 fills content | Same pattern as Favorites. |
| Personalized Discovery (FR-17) | Epic 3 shows "For You" section, Epic 4 provides user prefs via API | Epic 3's DiscoveryService reads UserPreference if auth header present. Falls back to trending for guests. For You is an Epic 4 integration milestone — stub until auth module is complete. |
| Tab bar navigation | Epic 1 builds TabBar with all 4 tabs | Each epic fills its tab's content independently. |
| Network status (all screens) | Epic 1 builds NetworkStatusProvider | All downstream screens import `useNetworkStatus()` from `lib/networkStatus.ts` to trigger offline UI states. |
| Skip navigation link (all screens) | Epic 1 builds link in Tab layout shell | Every route inherits "Bỏ qua điều hướng → #main-content" as first focusable element via `(tabs)/_layout.tsx`. |
