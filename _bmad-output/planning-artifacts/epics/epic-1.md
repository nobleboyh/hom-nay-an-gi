# Epic 1: Project Initialization & Foundation

**Goal:** The development team has a fully scaffolded monorepo with Docker infrastructure, design system, component library, seed data, and CI/CD — enabling all feature epics to begin independently.

**FRs covered:** Infrastructure, patterns, CI/CD, error monitoring (enables all NFRs + NFR-12)
**UX-DRs covered:** All design tokens, all primitive + composite components, navigation shell, accessibility infrastructure, network status

## Story 1.1: Monorepo Scaffold + Docker Compose

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

## Story 1.2: Backend Initialization (Express TypeScript Boilerplate)

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

## Story 1.3: Frontend Initialization (Expo SDK 56 + Router Shell)

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

## Story 1.4: Design Tokens & i18n Catalog

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

## Story 1.5: Primitive Component Library (9 components)

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

## Story 1.6: Composite Components & Navigation Shell

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

## Story 1.7: Seed Recipe Data & Mongoose Schemas

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

## Story 1.8: Common Backend Infrastructure

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

## Story 1.9: CI/CD Workflows & Zustand Store Scaffold

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

## Story 1.10: Client Error Monitoring

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

---

## Story 1.11: Error Monitoring Compatibility Fix

As a **developer**,
I want the client error monitoring integration to stop breaking Expo web startup,
So that `npm run web` and the shared app shell can boot reliably while production error reporting remains available through a supported integration path.

**Acceptance Criteria:**

- **Given** a developer runs `cd frontend && npm run web`, **When** Expo serves the web app and evaluates `_layout.tsx`, **Then** startup does not throw `Error: Cannot pipe to a closed or destroyed stream`, `TypeError: Cannot read property '__extends' of undefined`, or any equivalent module-load crash from the error-monitoring import path.
- **Given** client error monitoring is enabled for production builds, **When** the monitoring SDK initializes, **Then** it uses an Expo SDK 54 / Expo Router / React Native Web compatible integration path that does not depend on the failing `sentry-expo` runtime import.
- **Given** development builds and Expo Go, **When** monitoring is unavailable or intentionally disabled, **Then** the app shell still renders and the monitoring setup fails closed without crashing navigation, providers, or notification wiring.
- **Given** the root layout and ErrorBoundary, **When** a render error occurs after boot, **Then** the error is still reported through the selected monitoring adapter or a documented no-op fallback, and the fallback UI still renders.
- **Given** the story is complete, **When** I review tests and configuration, **Then** they verify the incompatible import path was removed or isolated, startup remains safe, and the chosen monitoring integration is documented for future maintenance.

**Technical Tasks:**
- [ ] Replace the direct `sentry-expo` boot-time dependency in `frontend/app/_layout.tsx` with a compatibility-safe monitoring bootstrap (supported SDK or an adapter wrapper)
- [ ] Update `frontend/components/ErrorBoundary.tsx` to report through the same monitoring adapter instead of importing the incompatible runtime directly
- [ ] Review `frontend/app.json`, `frontend/package.json`, and lockfile dependencies so the selected monitoring path matches the current Expo SDK/runtime constraints
- [ ] Add regression coverage proving the root layout no longer imports the incompatible module path directly and that error-monitoring setup cannot crash app startup
- [ ] Document the compatibility decision, including whether monitoring is migrated, downgraded, lazy-loaded, or temporarily stubbed in unsupported environments
