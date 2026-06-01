# Core Architectural Decisions

## Decision Priority Analysis

**Critical Decisions (Block Implementation):**

| # | Category | Decision | Version |
|---|----------|----------|---------|
| CD-1 | Data | Dual-storage: SQLite (guest) + MongoDB (authenticated) + Redis (cache/sessions) | MongoDB 8.x, Redis 7.x |
| CD-2 | Auth | Google OAuth (Expo AuthSession) + email/password (bcrypt) with JWT + Redis blocklist | Express 5.x |
| CD-3 | API | RESTful, URL-versioned, OpenAPI 3.1 from Zod schemas | — |
| CD-4 | Recipe Engine | LLM API: Gemini 2.5 Flash primary (free 1,500 req/day), configurable provider abstraction via `LLM_PROVIDER` env var | Gemini 2.5 Flash |
| CD-5 | Frontend | Expo SDK 56 with Expo Router, custom RN components, Zustand state management | Expo SDK 56 |
| CD-6 | Infrastructure | Docker Compose with 6 services (nginx, express-api, llm-proxy, mongo, redis, cron-worker) | Docker 27+ |
| CD-7 | Sync | Client-initiated three-phase protocol: guest accumulate → login merge → incremental delta | — |

**Important Decisions (Shape Architecture):**

| # | Category | Decision |
|---|----------|----------|
| ID-1 | Validation | Zod at API boundary + structured LLM output validation |
| ID-2 | Logging | Pino structured JSON (from Express boilerplate) |
| ID-3 | Testing | Vitest + Supertest (from Express boilerplate) |
| ID-4 | Package Manager | pnpm (from Express boilerplate) |
| ID-5 | Animations | react-native-reanimated, `prefers-reduced-motion` via `AccessibilityInfo.isReduceMotionEnabled()` |
| ID-6 | i18n | Vietnamese-first, flat key-value catalog, LLM system prompt language switch |
| ID-7 | Location | HERE Maps Places API (250K free req/month) + Overpass API fallback |
| ID-8 | Frontend Components | 18 custom RN components. **Primitives (9):** `<Card>`, `<Chip>`, `<Button>`, `<Timeline>`, `<TabBar>`, `<Badge>`, `<Toast>`, `<InputField>`, `<ServingAdjuster>`. **Composites (9):** `<ChipRow>`, `<ResultCard>`, `<SortDropdown>`, `<EmptyState>`, `<Skeleton>`, `<DishCard>`, `<RestaurantCard>`, `<CollapsibleSection>`, `<BenefitsCard>`, `<TipCard>`. Ship primitives first for core loop; composites can follow or be deferred. |
| ID-9 | SQLite Library | expo-sqlite (official Expo module) |

**Deferred Decisions (Post-MVP):**

| # | Decision | Rationale |
|---|----------|-----------|
| DD-1 | Password reset email service | Deferred to v2; "contact support" flow for MVP |
| DD-2 | Dark mode | Design tokens reserved in `tokens.ts`, implementation deferred |
| DD-3 | Camera barcode scanning | Evaluate Open Food Facts free API post-MVP |
| DD-4 | Push notifications | Basic meal reminders deferred; architecture hooks kept |
| DD-5 | Apple Sign-In | Add if App Store policy requires it |

## Data Architecture

### Database Selection

| Database | Role | Client Library |
|----------|------|---------------|
| **MongoDB 8.x** | Authenticated user data (users, favorites, history, preferences) | Mongoose |
| **SQLite** | Guest local storage on-device | expo-sqlite (official Expo module) |
| **Redis 7.x** | Session store, LLM response cache, rate-limit counters | ioredis |

**Rationale:** MongoDB handles flexible document schemas for user data. SQLite (expo-sqlite) provides on-device storage for guest mode with zero network dependency. Redis is mandatory for session management, LLM cache, and rate limiting — not optional.

### Data Models (MongoDB/Mongoose)

```
User {
  email: String (unique, sparse), passwordHash: String (bcrypt, null for Google-only),
  googleId: String (unique, sparse), displayName: String,
  authProvider: 'email' | 'google', createdAt: Date, updatedAt: Date,
  lastLoginAt: Date, deletedAt: Date (soft-delete + TTL)
}

Favorite {
  userId: ObjectId (ref: User), dishId: String (UUID from LLM response),
  dishData: { name: String (vi), nameEn: String?, cuisine: String,
    cookTimeMinutes: Number, caloriesPerServing: Number,
    tags: [String], imageDescription: String },
  savedAt: Date, updatedAt: Date
}
Indexes: { userId: 1, savedAt: -1 }, { userId: 1, dishId: 1 } unique

SearchHistory {
  userId: ObjectId? (ref: User), guestDeviceId: String?,
  ingredients: [String], tags: [String], cookTimeMax: Number,
  resultCount: Number, resultDishIds: [String], selectedDishId: String?,
  createdAt: Date, expiresAt: Date (createdAt + 90 days, TTL index)
}

UserPreference {
  userId: ObjectId (ref: User, unique), dietaryPreferences: [String],
  allergies: [String], dislikedIngredients: [String],
  preferredCuisines: [String], measurementUnit: 'metric' | 'imperial',
  theme: 'light' | 'dark' | 'system', language: 'vi' | 'en',
  notifications: { breakfastReminder: Boolean, lunchReminder: Boolean,
    dinnerReminder: Boolean, dailySuggestion: Boolean },
  createdAt: Date, updatedAt: Date
}
```

### Sync Protocol

Three-phase, client-initiated:

1. **Guest Phase**: SQLite accumulates mutations with `sync_status: 'pending'`
2. **Login Merge**: `POST /api/v1/sync` sends local payload → server merges (cloud-wins with pragmatic exception: client wins if `client.updatedAt > server.updatedAt`) → returns full merged state → client wipes SQLite and bulk-inserts server response
3. **Incremental Delta**: Post-login mutations set `sync_status: 'pending'` → background sync (debounced 2s after last mutation) sends `lastSyncAt` → server returns only changed records → client applies

### Caching Strategy

| Cache Key Pattern | TTL | Purpose |
|-------------------|-----|---------|
| `recipe:search:{ingredient_hash}:{tag_hash}:{cookTime}` | 24h | Avoid duplicate LLM calls for repeated ingredient combos |
| `surprise:{date}` | 24h | One random dish per day |
| `trending:{date}` | 6h | Trending results refresh |
| `session:{sessionId}` | 30d (sliding) | JWT session persistence |
| `rate:{userId}:{endpoint}` | 1h window | Rate limit counters |

## Authentication & Security

### Auth Flow

```
Client (Expo)                          Server (Express)
     │                                      │
     ├─ Email/Password ────────────────────►│ POST /api/v1/auth/login
     │  {email, password}                   │ → bcrypt.compare → JWT sign
     │◄────────────────────────────────────┤ {accessToken, refreshToken}
     │                                      │
     ├─ Google OAuth ──────────────────────►│
     │  Expo AuthSession → Google idToken   │ POST /api/v1/auth/google
     │  {idToken}                           │ → verify Google token → JWT sign
     │◄────────────────────────────────────┤ {accessToken, refreshToken}
     │                                      │
     ├─ All subsequent requests ───────────►│ Authorization: Bearer <accessToken>
     │                                      │ → middleware authenticate
     │                                      │ → 401 if expired → client refreshes
```

### Security Decisions

| Concern | Decision |
|---------|----------|
| Password hashing | bcrypt (12 rounds) |
| Token type | JWT (access: 15min, refresh: 30d) |
| Token revocation | Redis blocklist on logout + password change |
| Rate limiting | 30 req/hr/user (LLM endpoints), 100 req/min (general API) |
| HTTP headers | Helmet (from Express boilerplate) |
| CORS | `cors({ origin: env.CORS_ORIGIN, credentials: true })` |
| MongoDB access | Internal Docker network only (port 27017 not exposed) |
| LLM API key | Environment variable in llm-proxy container, never in client |
| Password reset | Deferred to v2; "contact support" for MVP |

### Guest vs Authenticated Matrix

| State | Storage | Auth Token | Data Lifecycle |
|-------|---------|-----------|----------------|
| Guest | SQLite (expo-sqlite) | None | Survives app restart, lost on uninstall |
| Guest → Login | SQLite → sync → MongoDB | JWT issued | Local merged to cloud, SQLite wiped |
| Authenticated | MongoDB + API | JWT (active, refreshed) | Cloud-persisted, synced across devices |
| Logout | SQLite (fresh) + cloud retained | JWT revoked → blocklist | Local cleared, cloud preserved for next login |
| Account Delete | MongoDB soft-delete + TTL cleanup | All tokens revoked | 30-day grace period before permanent deletion |

## API & Communication Patterns

### API Design

| Concern | Decision |
|---------|----------|
| Style | RESTful |
| Versioning | URL-prefix (`/api/v1/...`) |
| Documentation | OpenAPI 3.1 auto-generated from Zod schemas via `zod-to-openapi` |
| Response envelope | `{ success: boolean, data: T, meta: { requestId, timestamp, version } }` |
| Error format | `{ success: false, error: { code: string, message: string, details?: array }, meta: {...} }` |
| Error codes | `AUTH_INVALID_CREDENTIALS`, `AUTH_TOKEN_EXPIRED`, `VALIDATION_ERROR`, `RATE_LIMIT_EXCEEDED`, `LLM_TIMEOUT`, `LLM_INVALID_RESPONSE`, `NOT_FOUND` |
| Pagination | Offset-based: `{ offset, limit, total }` |

### API Route Map

```
/api/v1/auth
  POST /register          # { email, password, displayName } → { user, tokens }
  POST /login             # { email, password } → { user, tokens }
  POST /google            # { idToken } → { user, tokens }
  POST /refresh           # { refreshToken } → { accessToken }
  POST /logout            # Authorization: Bearer <token> → revoke

/api/v1/recipes
  GET  /search            # ?ingredients=chicken,broccoli&tags=Vietnamese&cookTime=30&offset=0&limit=10
  GET  /surprise          # → random dish
  GET  /:dishId           # → full recipe with timeline, ingredients, nutrition

/api/v1/discovery
  GET  /trending          # ?cuisine=Vietnamese&price=mid&offset=0&limit=10
  GET  /nearby            # ?lat=10.7626&lng=106.6601&radius=5000&cuisine=&price=

/api/v1/favorites
  GET  /                  # ?offset=0&limit=20 → user's saved dishes
  POST /                  # { dishId, dishData } → saved favorite
  DELETE /:favoriteId     # → removed

/api/v1/settings
  GET  /preferences       # → user preferences object
  PUT  /preferences       # { preferences } → updated

/api/v1/sync
  POST /                  # { deviceId, favorites, history, preferences, lastSyncAt } → merged state

/api/v1/account
  DELETE /                # Authorization: Bearer <token> → soft-delete account
```

### LLM Integration

| Concern | Decision |
|---------|----------|
| Primary provider | Gemini 2.5 Flash (1,500 req/day free tier) |
| Provider config | `LLM_PROVIDER` + `LLM_API_KEY` env vars; swappable via `src/services/llmClient.ts` abstraction |
| Provider swap guide | `.env.template` documents exact steps per provider — a table mapping `LLM_PROVIDER` values (gemini/openai/anthropic) to required env vars and model names |
| Quality benchmark | ≥80% of generated recipes must pass manual review for ingredient coherence and cultural authenticity. If the threshold is not met across a 20-sample eval set, trigger a provider evaluation. |
| Quality testing | (a) Zod schema validation in automated tests (verifiable), (b) manual eval set of 20 Vietnamese ingredient combos with expected dish names validated by a Vietnamese speaker, (c) cache-hit tests verifying Redis TTL behavior |
| Structured output | Enforced via Zod schema validation; retry once on validation failure, then return 502 |
| Prompt templates | Module-level constants: `modules/recipes/prompts.ts`, `modules/discovery/prompts.ts` |
| Bilingual | System prompt language set from `UserPreference.language` (`vi` → Vietnamese prompts, `en` → English) |
| Docker isolation | `llm-proxy` container owns the LLM client; `express-api` calls `llm-proxy:3001` internally |
| Rate limit | 30 req/hr/user on all LLM-dependent endpoints |

## Frontend Architecture

### State Management (Zustand — 3 Stores + Storage Adapter)

```typescript
// uiStore — screen state, ephemeral (does NOT route through StorageAdapter)
interface UIStore {
  activeTab: 'home' | 'discover' | 'favorites' | 'profile'
  expandedCardId: string | null
  activeFilters: { foodTypes: string[], cuisines: string[], cookTime: number | null }
  toasts: Toast[]
  isLoading: Record<string, boolean>
}

// dataStore — persistent data, routes through StorageAdapter
interface DataStore {
  dishes: Dish[]
  favorites: Favorite[]
  searchHistory: SearchHistoryItem[]
}

// authStore — authentication state + token lifecycle
interface AuthStore {
  authState: 'guest' | 'authenticated' | 'loading'
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  login: (credentials) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
}

// storageAdapter — transparent routing (NOT a store; imported by dataStore actions)
//   guest  → expo-sqlite (read/write local)
//   authed → fetch(/api/v1/...) (read/write remote)
// UI never queries auth state — dataStore actions call storageAdapter, which reads authStore
```

**Store architecture note:** The PRD and UX refer to a "2-slice" pattern (`uiSlice` + `dataSlice`), but the implementation splits into 3 Zustand stores + 1 adapter module. `authStore` is separated from `dataStore` because token lifecycle management (refresh, revocation, secure storage) is conceptually distinct from CRUD data operations. `storageAdapter.ts` is a plain module, not a Zustand store — it's imported by `dataStore` actions to route reads/writes.

### Component Tree (7 Screens)

```
App
├── TabBar (fixed bottom, 4 tabs)
├── HomeScreen
│   ├── InputField (text input, comma-delimited parsing)
│   ├── IngredientChip[] (removable, accent-dim bg)
│   ├── ChipRow (food type, horizontal scroll, multi-select AND)
│   ├── ChipRow (cuisine, default: Việt Nam active)
│   ├── CollapsibleSection (mood tags, hidden by default)
│   ├── ChipRow (cook time: 15/30/60/90+, single-select range)
│   ├── Button (Tìm món, primary, full-width)
│   └── Button (Bất ngờ!, secondary)
├── ResultsScreen
│   ├── SortDropdown (Best match / Lowest cal / Fastest)
│   ├── ResultCard[] (accordion: one expanded at a time)
│   │   ├── MatchBadge (% numeric, accent-strong)
│   │   ├── ChipRow (cuisine, on expanded)
│   │   └── Button[] (Xem công thức, Mua sắm, Save ♡)
│   └── EmptyState (end-of-list marker)
├── RecipeScreen
│   ├── ImagePlaceholder (16:9 hero)
│   ├── ServingAdjuster ( − / + , range 1–10, default 2)
│   ├── IngredientList (owned: default, missing: accent + ⚠️)
│   ├── Timeline (vertical dot-and-bar <ol>)
│   └── Button[] (Danh sách mua sắm, Sao chép)
├── DiscoverScreen
│   ├── LocationDisplay (district name + "Thay đổi" button)
│   ├── ChipRow (Tất cả / Đang thịnh hành / Gần tôi / Món mới / Đánh giá cao)
│   ├── DishCard[][] (2-column grid, trending)
│   └── RestaurantCard[] (vertical list, nearby — name, distance, rating, price)
├── FavoritesScreen
│   ├── InputField (🔍 search within favorites, client-side filter)
│   ├── FavoriteItem[] (thumbnail + name + cook time + remove ♡)
│   └── EmptyState ("Chưa có món yêu thích" → CTA to Discover)
├── ShoppingListScreen
│   ├── RecipeReferenceCard (thumbnail, name, servings, cook time)
│   ├── OwnedItems ("Bạn đã có" — checked checkboxes)
│   ├── MissingItems ("Cần mua thêm 🛒" — unchecked, accent)
│   ├── TipCard (accent-tinted savings suggestion)
│   └── Button[] (Lưu danh sách, Sao chép)
├── LoginScreen
│   ├── BenefitsCard (accent-tinted: sync, smarter suggestions, saved lists)
│   ├── InputField (email)
│   ├── InputField (password, type=password)
│   ├── Button (Đăng nhập, primary)
│   ├── Button (Google OAuth, secondary)
│   ├── Button (Tiếp tục không đăng nhập, ghost)
│   └── Link (Đăng ký — deferred, toast placeholder)
└── Toast (fixed bottom 100px, role="status", aria-live="polite", auto-dismiss 4s)
```

### Accessibility Mapping (WCAG 2.1 AA in React Native)

| Web ARIA | React Native Equivalent |
|----------|------------------------|
| `role="button"` | `accessibilityRole="button"` |
| `aria-expanded` | `accessibilityState.expanded` |
| `aria-pressed` | `accessibilityState.selected` |
| `aria-current="page"` | `accessibilityState.selected` on tab items |
| `aria-label` | `accessibilityLabel` |
| `aria-live="polite"` | `accessibilityLiveRegion="polite"` |
| `aria-hidden` | `importantForAccessibility="no-hide-descendants"` |
| `aria-invalid` | `accessibilityState.invalid` + `aria-describedby` → `accessibilityLabelledBy` |
| Skip navigation | Adapted for mobile: `accessibilityViewIsModal` + `accessibilityElementsHidden` for focus guidance |
| `prefers-reduced-motion` | `AccessibilityInfo.isReduceMotionEnabled()` (React Native core) |
| Focus indicators | `:focus-visible` equivalent via `onFocus` + state-based border/outline |
| Touch targets | Enforced at component level: `minWidth: 44, minHeight: 44` on all Pressable/Touchable elements |

## Infrastructure & Deployment

### Docker Compose Service Topology

```yaml
# docker-compose.yml
services:
  nginx:
    image: nginx:alpine
    ports: ["443:443"]
    volumes: [./nginx/nginx.conf:/etc/nginx/nginx.conf:ro]
    networks: [public]
    depends_on: [express-api]

  express-api:
    build: ./backend
    environment:
      - MONGO_URI=mongodb://mongo:27017/homnayangi
      - REDIS_URI=redis://redis:6379
      - LLM_PROXY_URL=http://llm-proxy:3001
      - JWT_SECRET=${JWT_SECRET}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - HERE_API_KEY=${HERE_API_KEY}
    networks: [public, internal]
    depends_on: [mongo, redis, llm-proxy]

  llm-proxy:
    build: ./backend
    command: ["node", "dist/services/llmProxyServer.js"]
    environment:
      - LLM_PROVIDER=${LLM_PROVIDER:-gemini}
      - LLM_API_KEY=${LLM_API_KEY}
      - REDIS_URI=redis://redis:6379
    networks: [internal]
    depends_on: [redis]

  mongo:
    image: mongo:8
    volumes: [mongo-data:/data/db]
    networks: [internal]
    # Port 27017 NOT exposed — internal network only

  redis:
    image: redis:7-alpine
    volumes: [redis-data:/data]
    networks: [internal]

  cron-worker:
    build: ./backend
    command: ["node", "dist/services/cronWorker.js"]
    environment:
      - LLM_PROXY_URL=http://llm-proxy:3001
      - REDIS_URI=redis://redis:6379
    networks: [internal]
    profiles: [full]  # Not started by default; use --profile full

networks:
  internal:
    driver: bridge
  public:
    driver: bridge

volumes:
  mongo-data:
  redis-data:
```

The `cron-worker` is defined with `profiles: [full]` — it won't start with `docker compose up`, only with `docker compose --profile full up`. Trending data refresh is deferred until MVP validation.

### CI/CD & Environments

| Concern | Decision |
|---------|----------|
| Dev environment | `docker compose up` (local), Expo Go on physical device |
| Staging | Deferred to post-MVP |
| Production | Deferred to post-MVP |
| CI | GitHub Actions: lint (biome), type-check (tsc), test (vitest) — from Express boilerplate |
| CD | Deferred to post-MVP |
| Secrets | `.env` file (gitignored), `.env.template` committed with placeholder values |
| Backup | MongoDB: nightly `mongodump` via cron to `./backups/mongo/` volume (documented in README). Redis: RDB snapshot every 1h (default `redis:7-alpine`). SQLite: on-device only, lost on uninstall (by design for guest mode). |

## Decision Impact Analysis

### Implementation Sequence (ordered by dependency)

| Order | Step | Depends On |
|-------|------|-----------|
| 1 | Docker Compose scaffold + nginx config | Nothing |
| 2 | Express TypeScript boilerplate init + domain module stubs | Docker |
| 3 | MongoDB schemas (User, Favorite, SearchHistory, UserPreference) | Express, MongoDB |
| 4 | Auth module (register, login, Google OAuth, JWT middleware) | MongoDB schemas |
| 5 | LLM integration (llmClient + llm-proxy + prompt templates + Zod schemas) | Redis, Docker |
| 6 | Recipe search endpoint (core loop: `/api/v1/recipes/*`) | LLM, Auth |
| 7 | Sync module (`/api/v1/sync`) | Auth, MongoDB, SQLite |
| 8 | Favorites + Settings CRUD | Auth, MongoDB |
| 9a | Discovery: trending endpoint (LLM only) | LLM, Redis |
| 9b | Discovery: nearby endpoint (HERE Maps) | HERE Maps API key |
| 10 | Expo project init + `tokens.ts` + 9 primitive components | Nothing (parallel with 9a) |
| 10b | 9 composite components (ChipRow, ResultCard, etc.) | 10 (primitives ready) |
| 11 | Zustand stores (3) + StorageAdapter | Expo, SQLite |
| 12 | Screens: Login → Home → Results → Recipe → Shopping List | Zustand, API |
| 13 | Screens: Discover (trending grid) | API (9a), Components |
| 13b | Screens: Discover (nearby list) | API (9b), Components |
| 14 | Screens: Favorites | API, Components |
| 15 | i18n catalog + bilingual wiring | All screens |

### Cross-Component Dependencies

| Module | Depends On | Depended By |
|--------|-----------|-------------|
| Auth | MongoDB (User schema), Redis (sessions) | Recipes, Favorites, Sync, Settings |
| LLM Proxy | Redis (cache), Gemini API key | Recipes, Discovery, Surprise Me |
| Sync | Auth (user identity), MongoDB (target), SQLite adapter (source) | Login flow |
| Discover (trending) | LLM (trending prompts), Redis cache | — |
| Discover (nearby) | HERE Maps client | — |
| Favorites | Auth (state routing), Sync (guest→auth merge) | — |
| StorageAdapter | AuthStore (authState), expo-sqlite, fetch API | All dataStore operations |
| AuthStore | Secure token storage, fetch API | StorageAdapter (via authState), all authenticated dataStore calls |
