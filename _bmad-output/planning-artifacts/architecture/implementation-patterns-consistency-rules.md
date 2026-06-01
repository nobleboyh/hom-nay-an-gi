# Implementation Patterns & Consistency Rules

## Pattern Categories Defined

**16 potential conflict points** identified across two codebases where AI agents could make incompatible choices if patterns are not explicitly defined.

## Naming Patterns

### Backend (Express TypeScript Boilerplate Conventions)

| Scope | Convention | Example | Rationale |
|-------|-----------|---------|-----------|
| Files | camelCase | `userService.ts`, `healthCheckRouter.ts`, `envConfig.ts` | Express boilerplate default |
| Directories | camelCase | `healthCheck/`, `apiDocs/` | Express boilerplate default |
| Functions | camelCase | `getUserById()`, `validateRequest()` | TypeScript/JS standard |
| Classes/Interfaces | PascalCase | `ServiceResponse`, `UserModel` | TypeScript standard |
| Constants | UPPER_SNAKE_CASE | `MAX_INGREDIENTS`, `DEFAULT_CACHE_TTL` | Global constants only |
| Variables | camelCase | `userId`, `searchResults` | TypeScript standard |
| Mongoose models | PascalCase | `User`, `Favorite`, `SearchHistory`, `UserPreference` | Mongoose convention |
| MongoDB collections | camelCase plural | `users`, `favorites`, `searchHistories`, `userPreferences` | Mongoose auto-pluralize |
| Zod schemas | camelCase + `Schema` suffix | `searchRecipeSchema`, `loginSchema` | Boilerplate pattern |
| Test files | camelCase + `.test.ts` | `userService.test.ts`, `authRouter.test.ts` | Vitest convention |

### Frontend (Expo / React Native Conventions)

| Scope | Convention | Example | Rationale |
|-------|-----------|---------|-----------|
| Components | PascalCase | `ResultCard.tsx`, `IngredientChip.tsx`, `HomeScreen.tsx` | React community standard |
| Expo Router routes | kebab-case | `index.tsx`, `recipe/[id].tsx` | Expo Router file-based routing |
| Hooks | camelCase + `use` prefix | `useAuth.ts`, `useRecipes.ts` | React hooks convention |
| Stores (Zustand) | camelCase + `Store` suffix | `uiStore.ts`, `dataStore.ts` | Zustand convention |
| Utilities | camelCase | `formatTime.ts`, `parseIngredients.ts` | JS standard |
| Types/interfaces | PascalCase | `Dish`, `UserPreference`, `Toast` | TypeScript standard |
| Design tokens file | `tokens.ts` | Single source of truth for OKLCH, fonts, spacing, animations | Project convention |

### API Naming

| Scope | Convention | Example |
|-------|-----------|---------|
| Endpoints | kebab-case plural nouns | `/api/v1/recipes/search`, `/api/v1/favorites/:favoriteId` |
| Query params | camelCase | `?cookTime=30&foodTypes=Vietnamese` |
| Path params | camelCase | `:dishId`, `:favoriteId` |
| JSON keys | camelCase | `{ "dishId": "...", "cookTimeMinutes": 25 }` |
| Headers | Standard HTTP | `Authorization: Bearer <token>`, `Content-Type: application/json` |

## Structure Patterns

### Monorepo Layout

```
hom-nay-an-gi/
├── backend/                    # Express TypeScript application
│   ├── src/
│   │   ├── api/                # Domain modules (auth, recipes, discovery, favorites, settings, sync)
│   │   ├── api-docs/           # OpenAPI/Swagger auto-generation
│   │   ├── common/             # Shared middleware, models, utils
│   │   ├── models/             # Mongoose schemas (User, Favorite, SearchHistory, UserPreference)
│   │   ├── services/           # External clients (llmClient, cacheClient, hereMapsClient)
│   │   ├── index.ts            # Server bootstrap
│   │   └── server.ts           # Express app assembly
│   ├── .env.template
│   ├── biome.json
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.mts
├── frontend/                   # Expo application
│   ├── app/                    # Expo Router file-based routes
│   │   ├── (tabs)/             # Tab layout group
│   │   │   ├── index.tsx       # Home screen
│   │   │   ├── discover.tsx    # Discover screen
│   │   │   ├── favorites.tsx   # Favorites screen
│   │   │   └── profile.tsx     # Login/Profile screen
│   │   ├── recipe/[id].tsx     # Recipe detail
│   │   └── shopping-list.tsx   # Shopping list
│   ├── components/             # Custom RN components
│   │   ├── Card.tsx
│   │   ├── Chip.tsx
│   │   ├── Button.tsx
│   │   ├── Timeline.tsx
│   │   ├── TabBar.tsx
│   │   ├── Badge.tsx
│   │   ├── Toast.tsx
│   │   ├── InputField.tsx
│   │   └── ServingAdjuster.tsx
│   ├── stores/                 # Zustand stores
│   │   ├── uiStore.ts
│   │   ├── dataStore.ts
│   │   └── storageAdapter.ts
│   ├── lib/                    # Utilities, API client, tokens
│   │   ├── tokens.ts           # OKLCH→RGBA, fonts, spacing, animation, accessibility configs
│   │   ├── api.ts              # Centralized fetch wrapper (auth headers, error envelope parsing)
│   │   ├── i18n.ts             # Flat key-value string catalog (vi/en)
│   │   └── accessibility.ts    # ARIA→RN mapping helpers
│   ├── assets/                 # Static assets
│   │   ├── fonts/
│   │   └── images/
│   └── .env.template
├── docker-compose.yml
├── nginx/
│   └── nginx.conf
└── .gitignore
```

### Module Structure (Backend)

Each domain module follows the boilerplate pattern:

```
src/api/{module}/
├── {module}Router.ts        # Route definitions
├── {module}Controller.ts    # Request parsing, response formatting
├── {module}Service.ts       # Business logic
├── {module}Validation.ts    # Zod request schemas
├── {module}Model.ts         # Mongoose schema (if module owns a collection)
└── __tests__/
    ├── {module}Router.test.ts
    └── {module}Service.test.ts
```

### Component Structure (Frontend)

Each custom component exports typed props and baked-in accessibility:

```typescript
// components/Chip.tsx
export interface ChipProps {
  label: string;
  selected: boolean;
  onToggle: () => void;
  variant?: 'tag' | 'cuisine' | 'time' | 'ingredient';
}
export function Chip({ label, selected, onToggle, variant = 'tag' }: ChipProps) { ... }
```

## Format Patterns

### API Response Format (Standard Envelope)

```json
// Success
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-06-01T12:00:00.000Z",
    "version": "1.0.0"
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Ingredients must be 1-20 items",
    "details": [{ "field": "ingredients", "issue": "Array must contain at least 1 item" }]
  },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-06-01T12:00:00.000Z"
  }
}
```

### Error Codes (Backend)

| Code | HTTP | Meaning |
|------|------|---------|
| `VALIDATION_ERROR` | 400 | Zod validation failed |
| `AUTH_INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `AUTH_TOKEN_EXPIRED` | 401 | JWT expired, refresh needed |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource does not exist |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `LLM_TIMEOUT` | 502 | LLM call exceeded deadline |
| `LLM_INVALID_RESPONSE` | 502 | LLM output failed Zod validation after retries |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

### Date/Time Format

| Context | Format | Example |
|---------|--------|---------|
| API JSON | ISO 8601 UTC string | `"2026-06-01T12:00:00.000Z"` |
| UI display (vi) | `DD/MM/YYYY` | `01/06/2026` |
| UI display (en) | `MMM D, YYYY` | `Jun 1, 2026` |
| Cook time | Minutes (number) | `25` (rendered as "25 phút" / "25 min") |
| Expiry/cleanup | Date math from `createdAt` | `expiresAt: createdAt + 90 days` |

## Communication Patterns

### Zustand → API Communication

```
User Action → dataStore action
  → storageAdapter.getTarget(authStore.authState)
    → 'guest':  expo-sqlite read/write
    → 'authenticated': apiClient.get|post|put|delete(/api/v1/...) → parse envelope → return data
      → on error: uiStore.addToast({type: 'error', message})
  → uiStore.setLoading(key, false)
```

`authStore` actions (login, logout, refreshToken) bypass the storage adapter — they directly call `apiClient` for auth endpoints and manage tokens via secure storage.

### Zustand Actions — Naming Convention

| Pattern | Example |
|---------|---------|
| Fetch | `fetchDishes(ingredients, filters)` |
| Mutate | `saveFavorite(dishId, dishData)`, `removeFavorite(favoriteId)` |
| Toggle UI | `toggleCard(dishId)`, `selectChip(chipId)` |
| Reset | `clearFilters()`, `clearSearchHistory()` |

### API Client (Frontend `lib/api.ts`)

All API calls go through a single `apiClient` that:
1. Reads JWT from secure storage (if authenticated)
2. Sets `Authorization: Bearer <token>` header automatically
3. Parses `{success, data, meta}` envelope — throws on `success: false`
4. On 401 → triggers token refresh → retries once → on failure logs out
5. Wraps fetch with timeout (20s for LLM endpoints, 10s otherwise)

## Process Patterns

### Error Handling — Three-Tier

| Tier | Where | What |
|------|-------|------|
| **Global** | `errorHandler.ts` (Express) / `ErrorBoundary` (React Native) | Catch-all for unhandled errors |
| **Module** | Service layer | Business logic errors → custom error classes → mapped HTTP codes |
| **User-facing** | Controller (API) / Toast (UI) | Transient feedback: "Không thể tìm món. Thử lại?" |

### Custom Error Classes (Backend)

```typescript
class AppError extends Error {
  code: string;        // machine-readable: "LLM_TIMEOUT"
  statusCode: number;  // HTTP: 502
  userMessage: string; // human-readable: "Không thể tạo gợi ý món ăn lúc này"
}
class NotFoundError extends AppError {}
class ValidationError extends AppError {}
class AuthenticationError extends AppError {}
class LLMError extends AppError {}
```

### Loading States — Per UX EXPERIENCE.md

Every screen supports these 5 states. Components implement them consistently:

| State | Pattern | Example |
|-------|---------|---------|
| **Loading** | Skeleton placeholder + `aria-busy="true"` | 3-4 shimmer cards on Results |
| **Empty** | Centered icon + title + description + CTA | "Chưa có món yêu thích" + "Khám phá món ngay" |
| **Error** | Toast + retry button | "⚠️ Không thể tìm món" + "Thử lại" |
| **Offline** | Toast + cached data if available | "🌐 Mất kết nối" + stale results |
| **Success** | Normal content | Results list |

```typescript
// Zustand pattern per screen
interface ResultsState {
  status: 'loading' | 'empty' | 'error' | 'offline' | 'success';
  data: Dish[];
  error?: AppError;
}
```

### Retry Strategy

| Context | Strategy |
|---------|----------|
| LLM call failed (timeout/502) | 1 retry after 2s, then show error |
| Network error (fetch failed) | 2 retries with exponential backoff (1s, 3s) |
| Auth token expired (401) | 1 refresh attempt, then redirect to login |
| Rate limited (429) | Show "Too many requests" toast, respect Retry-After header |

### Logging (Backend — Pino)

| Level | Usage |
|-------|-------|
| `info` | Normal operations: request received, cache hit/miss, sync completed |
| `warn` | Degraded operations: LLM retry triggered, rate limit approaching, stale cache served |
| `error` | Failures: LLM exhausted retries, MongoDB connection lost, validation failure |

Format: structured JSON (Pino default). Include `requestId` in every log line.

## Enforcement Guidelines

**All AI Agents MUST:**

1. Use the monorepo structure defined above — no ad-hoc directories
2. Follow the Express boilerplate module pattern for every new backend domain module
3. Export typed props interfaces for every custom frontend component
4. Use the shared `apiClient` (`lib/api.ts`) for all network calls — never raw `fetch`
5. Wrap API responses in the standard envelope `{success, data, meta}`
6. Implement all 5 UX states (loading/empty/error/offline/success) for every screen
7. Add Zod validation schemas for every new API endpoint
8. Bake in accessibility props on every interactive component (min 44px touch target, `accessibilityRole`, `accessibilityLabel`)
9. Reference `tokens.ts` values — never hardcode colors, spacing, or animation durations
10. Write tests co-located in `__tests__/` directories following the `*.test.ts` naming pattern

**Pattern Verification Commands:**

> **Linting tool note:** Backend uses `biome`, frontend uses `eslint` — this is intentional. They target different ecosystems (Node.js vs React Native). Do not attempt to unify them.

```bash
# Backend
pnpm typecheck        # TypeScript strict
pnpm lint             # biome lint
pnpm format           # biome format
pnpm test             # vitest --run

# Frontend — use the test runner shipped by create-expo-app (verify: jest or vitest)
npx tsc --noEmit      # TypeScript check
npx eslint .          # Lint
npx expo test         # Test (Expo's configured test runner)
```
