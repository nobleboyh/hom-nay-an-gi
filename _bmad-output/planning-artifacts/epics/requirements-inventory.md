# Requirements Inventory

## Functional Requirements

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

## NonFunctional Requirements

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

## Additional Requirements (from Architecture)

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

## UX Design Requirements

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

## FR Coverage Map

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
