# Project Structure & Boundaries

## Complete Project Directory Structure

```
hom-nay-an-gi/
├── .gitignore
├── .env.template                         # All env vars documented with placeholders
├── docker-compose.yml
├── README.md
│
├── nginx/
│   └── nginx.conf                        # Reverse proxy: /api/v1/* → express-api:3000
│
├── backend/                              # Express TypeScript (pnpm)
│   ├── package.json
│   ├── pnpm-lock.yaml
│   ├── tsconfig.json
│   ├── biome.json
│   ├── vite.config.mts
│   ├── Dockerfile
│   ├── .env.template
│   ├── .env                              # gitignored
│   │
│   ├── src/
│   │   ├── index.ts                      # Server bootstrap: imports app, calls listen()
│   │   ├── server.ts                     # Express app assembly: middleware, routes, error handler
│   │   │
│   │   ├── config/
│   │   │   ├── env.ts                    # Zod-validated env vars (MONGO_URI, REDIS_URI, etc.)
│   │   │   ├── database.ts              # Mongoose connection
│   │   │   ├── redis.ts                 # ioredis client
│   │   │   └── llm.ts                   # LLM provider config (reads LLM_PROVIDER env)
│   │   │
│   │   ├── common/
│   │   │   ├── middleware/
│   │   │   │   ├── authenticate.ts       # JWT verification middleware
│   │   │   │   ├── validate.ts           # Zod request validation runner
│   │   │   │   ├── rateLimiter.ts        # express-rate-limit config
│   │   │   │   ├── errorHandler.ts       # Centralized error → JSON response
│   │   │   │   ├── requestLogger.ts      # Pino HTTP request logging
│   │   │   │   └── asyncHandler.ts       # try/catch wrapper for async controllers
│   │   │   ├── models/                   # NB: "models" here = response envelope, NOT Mongoose
│   │   │   │   └── serviceResponse.ts    # { success, data, meta } envelope builder
│   │   │   └── utils/
│   │   │       ├── envConfig.ts          # Environment validation (boilerplate)
│   │   │       ├── httpHandlers.ts       # Response helpers (boilerplate)
│   │   │       ├── errors.ts             # Custom error classes (AppError, NotFoundError, etc.)
│   │   │       └── logger.ts             # Pino logger instance
│   │   │
│   │   ├── models/                       # Mongoose schemas (shared across modules)
│   │   │   ├── User.ts
│   │   │   ├── Favorite.ts
│   │   │   ├── SearchHistory.ts
│   │   │   └── UserPreference.ts
│   │   │
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── authRouter.ts
│   │   │   │   ├── authController.ts
│   │   │   │   ├── authService.ts        # register, login, googleAuth, refresh, logout
│   │   │   │   ├── authValidation.ts     # registerSchema, loginSchema, googleAuthSchema
│   │   │   │   └── __tests__/
│   │   │   │       ├── authRouter.test.ts
│   │   │   │       └── authService.test.ts
│   │   │   │
│   │   │   ├── recipes/
│   │   │   │   ├── recipesRouter.ts
│   │   │   │   ├── recipesController.ts
│   │   │   │   ├── recipesService.ts      # searchByIngredients, getRecipe, surpriseMe
│   │   │   │   ├── recipesValidation.ts   # searchRecipeSchema, surpriseMeSchema
│   │   │   │   ├── prompts.ts             # LLM prompt templates (vi/en)
│   │   │   │   └── __tests__/
│   │   │   │       ├── recipesRouter.test.ts
│   │   │   │       └── recipesService.test.ts
│   │   │   │
│   │   │   ├── discovery/
│   │   │   │   ├── discoveryRouter.ts
│   │   │   │   ├── discoveryController.ts
│   │   │   │   ├── discoveryService.ts    # getTrending, getNearby
│   │   │   │   ├── discoveryValidation.ts # trendingSchema, nearbySchema
│   │   │   │   ├── prompts.ts             # Trending/location LLM prompt templates
│   │   │   │   └── __tests__/
│   │   │   │       ├── discoveryRouter.test.ts
│   │   │   │       └── discoveryService.test.ts
│   │   │   │
│   │   │   ├── favorites/
│   │   │   │   ├── favoritesRouter.ts
│   │   │   │   ├── favoritesController.ts
│   │   │   │   ├── favoritesService.ts    # list, save, remove
│   │   │   │   ├── favoritesValidation.ts # saveFavoriteSchema
│   │   │   │   └── __tests__/
│   │   │   │       ├── favoritesRouter.test.ts
│   │   │   │       └── favoritesService.test.ts
│   │   │   │
│   │   │   ├── settings/
│   │   │   │   ├── settingsRouter.ts
│   │   │   │   ├── settingsController.ts
│   │   │   │   ├── settingsService.ts     # getPreferences, updatePreferences
│   │   │   │   ├── settingsValidation.ts  # updatePreferencesSchema
│   │   │   │   └── __tests__/
│   │   │   │       ├── settingsRouter.test.ts
│   │   │   │       └── settingsService.test.ts
│   │   │   │
│   │   │   └── sync/
│   │   │       ├── syncRouter.ts
│   │   │       ├── syncController.ts
│   │   │       ├── syncService.ts         # mergeGuestData, deltaSync
│   │   │       ├── syncValidation.ts      # syncPayloadSchema
│   │   │       └── __tests__/
│   │   │           ├── syncRouter.test.ts
│   │   │           └── syncService.test.ts
│   │   │
│   │   ├── api-docs/
│   │   │   ├── openAPIRouter.ts
│   │   │   ├── openAPIDocumentGenerator.ts
│   │   │   ├── openAPIResponseBuilders.ts
│   │   │   └── __tests__/
│   │   │       └── openAPIRouter.test.ts
│   │   │
│   │   └── services/
│   │       ├── llmClient.ts               # Provider-agnostic LLM wrapper (Gemini default)
│   │       ├── llmProxyServer.ts           # Standalone entry for llm-proxy container
│   │       ├── cacheClient.ts             # Redis cache wrapper (get/set/del/key patterns)
│   │       ├── hereMapsClient.ts          # HERE Maps Places API wrapper
│   │       ├── cronWorker.ts              # Trending data refresh worker (deferred profile)
│   │       └── __tests__/
│   │           ├── llmClient.test.ts
│   │           └── cacheClient.test.ts
│   │
│   └── tests/                             # Integration tests
│       └── setup.ts                       # Test DB/Redis setup helpers
│
├── frontend/                              # Expo (npm)
│   ├── package.json
│   ├── app.json                           # Base Expo config
│   ├── app.config.ts                      # Bridges canonical API_BASE_URL into Expo extra.apiBaseUrl
│   ├── tsconfig.json
│   ├── .env.template
│   ├── .env                               # gitignored
│   │
│   ├── app/                               # Expo Router (file-based routing)
│   │   ├── _layout.tsx                    # Root layout: providers, TabBar
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx                # Tab navigator layout
│   │   │   ├── index.tsx                  # Home screen (ingredient input + filters)
│   │   │   ├── discover.tsx               # Discover screen (trending + nearby)
│   │   │   ├── favorites.tsx              # Favorites screen
│   │   │   └── profile.tsx                # Login/Profile screen
│   │   ├── recipe/
│   │   │   └── [id].tsx                   # Recipe detail screen
│   │   └── shopping-list.tsx              # Shopping list screen
│   │
│   ├── components/                        # Custom RN design-system components
│   │   ├── Card.tsx                       # Surface card with shadow + border
│   │   ├── ResultCard.tsx                 # Collapsible result card (name, badge, actions)
│   │   ├── Chip.tsx                       # Toggleable chip (tag, cuisine, time, ingredient)
│   │   ├── ChipRow.tsx                    # Horizontal scrollable chip container
│   │   ├── Button.tsx                     # Primary/Secondary/Ghost/Destructive variants
│   │   ├── InputField.tsx                 # Text input with icon slots + validation
│   │   ├── Timeline.tsx                   # Vertical dot-and-bar cooking timeline
│   │   ├── TabBar.tsx                     # Fixed bottom 4-tab navigation
│   │   ├── Badge.tsx                      # Match percentage badge
│   │   ├── Toast.tsx                      # Transient feedback (auto-dismiss, aria-live)
│   │   ├── ServingAdjuster.tsx            # −/➕ serving size control
│   │   ├── SortDropdown.tsx               # Styled select dropdown
│   │   ├── EmptyState.tsx                 # Icon + title + description + CTA
│   │   ├── Skeleton.tsx                   # Shimmer loading placeholder
│   │   ├── DishCard.tsx                   # Discover grid card (image + name + rating + price)
│   │   ├── RestaurantCard.tsx             # Nearby list item (thumbnail + distance + rating)
│   │   ├── CollapsibleSection.tsx         # Expandable section with chevron
│   │   ├── BenefitsCard.tsx               # Accent-tinted info card (login benefits)
│   │   └── TipCard.tsx                    # Accent-tinted savings suggestion
│   │
│   ├── stores/                            # Zustand
│   │   ├── uiStore.ts                     # activeTab, expandedCardId, filters, toasts, loading
│   │   ├── dataStore.ts                   # dishes, favorites, preferences, searchHistory
│   │   ├── authStore.ts                   # authState, user, login/logout actions
│   │   └── storageAdapter.ts              # Routes reads/writes between expo-sqlite and API
│   │
│   ├── lib/                               # Utilities
│   │   ├── env.ts                         # Shared API base URL resolver + Expo config guardrails
│   │   ├── tokens.ts                      # OKLCH→RGBA, fonts, spacing, radii, shadows, z-index, animation
│   │   ├── api.ts                         # Centralized fetch wrapper (auth, envelope, retry, timeout)
│   │   ├── i18n.ts                        # Flat key-value string catalog (vi/en)
│   │   ├── accessibility.ts              # ARIA→RN mapping helpers
│   │   ├── parseIngredients.ts            # Comma-delimited input → ingredient array
│   │   └── formatTime.ts                  # Minutes → "25 phút" / "25 min"
│   │
│   ├── hooks/                             # Custom hooks
│   │   ├── useAuth.ts                     # Auth state + login/logout/googleAuth actions
│   │   ├── useRecipes.ts                  # Search + results + cache
│   │   ├── useFavorites.ts               # Save/remove/list favorites
│   │   ├── useDiscovery.ts               # Trending + nearby
│   │   └── useReducedMotion.ts           # AccessibilityInfo.isReduceMotionEnabled()
│   │
│   ├── types/                             # Shared TypeScript types
│   │   ├── dish.ts                        # Dish, Recipe, Ingredient, ShoppingList
│   │   ├── user.ts                        # User, UserPreference, AuthState
│   │   └── api.ts                         # ApiResponse<T>, ApiError, PaginationMeta
│   │
│   ├── assets/
│   │   ├── fonts/                         # Inter or Noto Sans Vietnamese (400/500/600/700)
│   │   └── images/                        # Placeholder images, icons
│   │
│   └── __tests__/
│       ├── components/
│       │   ├── Card.test.tsx
│       │   ├── Chip.test.tsx
│       │   └── Button.test.tsx
│       └── lib/
│           ├── api.test.ts
│           └── parseIngredients.test.ts
│
└── .github/
    └── workflows/
        ├── ci-backend.yml                 # Lint (biome), typecheck (tsc), test (vitest)
        └── ci-frontend.yml               # Lint (eslint), typecheck (tsc), test (jest)
```

## Requirements to Structure Mapping

### FR Category → Module Mapping

| FR Category | Backend Module | Frontend Location |
|-------------|---------------|-------------------|
| FR-1, FR-4 (Text Input + Quantity) | `api/recipes/` (parsing via LLM prompt) | `app/(tabs)/index.tsx` (InputField + IngredientChip) |
| FR-5–8 (Filtering & Tags) | `api/recipes/` (filter params) | `app/(tabs)/index.tsx` (ChipRow components) |
| FR-9–10 (Results & Timeline) | `api/recipes/` (search + detail) | `app/(tabs)/index.tsx` → `app/recipe/[id].tsx` |
| FR-11 (Calorie Estimation) | `api/recipes/` (LLM estimated) | `app/recipe/[id].tsx` (display with "Estimated" label) |
| FR-12 (Shopping List) | Client-side computation | `app/shopping-list.tsx` |
| FR-13 (Surprise Me) | `api/recipes/` (surpriseMe) | `app/(tabs)/index.tsx` (Surprise Me button) |
| FR-14 (Trending) | `api/discovery/` (LLM trending) | `app/(tabs)/discover.tsx` (DishCard grid) |
| FR-15 (Distance-based) | `api/discovery/` (HERE Maps) | `app/(tabs)/discover.tsx` (RestaurantCard list) |
| FR-16–17 (Price + Personalized) | `api/discovery/` | `app/(tabs)/discover.tsx` |
| FR-18 (Guest Mode) | None (client-side only) | `stores/storageAdapter.ts` (expo-sqlite) |
| FR-19 (Registration & Login) | `api/auth/` | `app/(tabs)/profile.tsx` (LoginScreen) |
| FR-20 (Cloud Sync) | `api/sync/` | `stores/storageAdapter.ts` |
| FR-21–22 (Favorites) | `api/favorites/` | `app/(tabs)/favorites.tsx` |
| FR-23–27 (Settings) | `api/settings/` | `app/(tabs)/profile.tsx` (settings section) |

## Integration Boundaries

### API Boundaries

```
┌─────────────────────────────────────────────────────┐
│                   Client (Expo)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ uiStore  │  │dataStore │  │ storageAdapter   │   │
│  └──────────┘  └────┬─────┘  └────────┬─────────┘   │
│                     │                 │              │
│                     │    ┌────────────┘              │
│                     │    │  guest → expo-sqlite      │
│                     │    │  authed → lib/api.ts      │
│                     ▼    ▼                           │
│              ┌──────────────┐                        │
│              │  lib/api.ts  │  ← Centralized client  │
│              └──────┬───────┘                        │
└─────────────────────┼────────────────────────────────┘
                      │ HTTPS
                      ▼
┌─────────────────────────────────────────────────────┐
│                 nginx (reverse proxy)                 │
│              /api/v1/* → express-api:3000             │
└─────────────────────┬───────────────────────────────┘
                      │ Docker internal
                      ▼
┌─────────────────────────────────────────────────────┐
│               express-api (Express 5)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │  Auth    │  │ Recipes  │  │  Discovery       │   │
│  │  Module  │  │  Module  │  │  Module          │   │
│  └────┬─────┘  └────┬─────┘  └────────┬─────────┘   │
│       │             │                │               │
│       ▼             ▼                ▼               │
│  ┌──────────────────────────────────────────────┐    │
│  │              Service Layer                    │    │
│  │  authService  recipesService  discoverySvc   │    │
│  └──────┬──────────────┬────────────────┬───────┘    │
│         │              │                │            │
│         ▼              ▼                ▼            │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ MongoDB  │  │  llm-proxy   │  │ HERE Maps    │   │
│  │(internal)│  │  (internal)  │  │ (external)   │   │
│  └──────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Component Communication (Frontend)

```
Screen ←→ Zustand Stores ←→ StorageAdapter ←→ expo-sqlite | apiClient
  │            │
  │            ├── uiStore: activeTab, expandedCardId, filters, toasts, loading
  │            ├── dataStore: dishes[], favorites[], searchHistory
  │            │     └── storageAdapter routes reads/writes based on authStore.authState
  │            └── authStore: authState, user, accessToken, login(), logout(), refreshToken()
  │
  ├── HomeScreen ←→ useRecipes (dataStore.fetchDishes)
  ├── ResultsScreen ←→ dataStore.dishes, uiStore.expandedCardId
  ├── RecipeScreen ←→ dataStore get dish[id]
  ├── DiscoverScreen ←→ useDiscovery (dataStore)
  ├── FavoritesScreen ←→ useFavorites (dataStore)
  └── ProfileScreen ←→ authStore
```

### Data Flow: Core Search Loop

```
1. User types "thịt gà, bông cải, trứng" → HomeScreen
2. parseIngredients.ts → ["thịt gà", "bông cải", "trứng"]
3. uiStore.setFilters({ foodTypes: ["Có thịt"], cuisines: ["Việt Nam"], cookTime: 30 })
4. dataStore.fetchDishes(ingredients, filters)
5. storageAdapter.isAuthenticated?
   ├─ YES → apiClient.get('/api/v1/recipes/search?ingredients=...&tags=...')
   │         → nginx → express-api → recipesController
   │           → recipesService.searchByIngredients()
   │             → cacheClient.get(key) → MISS
   │               → llmClient.complete(ingredientSearchPrompt, params)
   │                 → llm-proxy → Gemini API → response
   │               → Zod validate → cacheClient.set(key, result, 24h)
   │             → return SearchResponse
   │         ← { success: true, data: { dishes: [...], total: 5 } }
   └─ NO  → expo-sqlite (local search or cached results only)
6. dataStore.dishes = [...]
7. ResultsScreen renders ResultCard[] from dataStore.dishes
8. User taps card → uiStore.expandedCardId = dish.id
9. User taps "Xem công thức" → navigate to /recipe/[id]
10. dataStore fetch dish detail → apiClient.get('/api/v1/recipes/:dishId')
```

## Development Workflow Integration

### Getting Started (First Dev Story)

```bash
# 1. Clone & scaffold
git clone <repo> && cd hom-nay-an-gi

# 2. Backend
cd backend && pnpm install
cp .env.template .env   # fill in JWT_SECRET, LLM_API_KEY, HERE_API_KEY, etc.
pnpm dev                 # tsx --watch on port 3000

# 3. Frontend
cd frontend && npm install
cp .env.template .env    # API_BASE_URL=http://<LAN_IP>:3000 for Expo Go, localhost only for same-machine web
npx expo start           # Expo dev server

# 4. Infrastructure (for local dev, run DBs + Redis)
docker compose up -d mongo redis
```

### Build & Production

```bash
# Backend
cd backend && pnpm build && pnpm start:prod

# Frontend
cd frontend && npx eas build --platform all  # EAS Build for iOS/Android

# Full stack (production simulation)
docker compose --profile full up -d
```
