# Starter Template Evaluation

## Primary Technology Domain

Full-stack mobile application with two codebases:

| Domain | Technology | Starter |
|--------|-----------|---------|
| Mobile Frontend | Expo (React Native) SDK 56 | Official `create-expo-app` |
| API Backend | ExpressJS 5.x (Node.js ≥18) | `edwinhern/express-typescript` boilerplate |
| Infrastructure | Docker Compose | Custom compose file |

## Selected Starters

### Frontend: Expo Default Template (SDK 56)

**Initialization Command:**

```bash
npx create-expo-app@latest --template default@sdk-56 hom-nay-an-gi
```

**Architectural Decisions Provided:**

| Concern | Decision |
|---------|----------|
| Language | TypeScript (pre-configured) |
| Navigation | Expo Router (file-based routing) |
| Project structure | `app/` directory for routes |
| Build | EAS Build for production |
| Dev experience | Hot reload, Expo Go for device testing |
| Platform | iOS + Android + Web from single codebase |

**Post-init additions needed:**
- Zustand (`uiSlice` + `dataSlice` + storage adapter)
- Custom RN component library: 9 primitives (`<Card>`, `<Chip>`, `<Button>`, `<Timeline>`, `<TabBar>`, `<Badge>`, `<Toast>`, `<InputField>`, `<ServingAdjuster>`) + 9 composites (`<ChipRow>`, `<ResultCard>`, `<SortDropdown>`, `<EmptyState>`, `<Skeleton>`, `<DishCard>`, `<RestaurantCard>`, `<CollapsibleSection>`, `<BenefitsCard>`, `<TipCard>`). Ship primitives first for core loop; composites follow.
- `tokens.ts` (OKLCH→RGBA, typography stacks, animation configs, accessibility prop defaults)
- `expo-sqlite` or `react-native-quick-sqlite` (guest local storage)
- `react-native-reanimated` (animation primitives)
- i18n catalog (vi/en string keys in flat key-value structure)
- HERE Maps client (for Discovery screen)

### Backend: Express TypeScript Boilerplate

**Source:** [`edwinhern/express-typescript`](https://github.com/edwinhern/express-typescript)

**Architectural Decisions Provided:**

| Concern | Decision |
|---------|----------|
| Language | TypeScript (strict mode) |
| Framework | Express 5.x |
| Security | Helmet, CORS, rate limiting (express-rate-limit) |
| Validation | Zod (environment + request) |
| Logging | Pino (structured JSON) |
| API docs | OpenAPI/Swagger auto-generated at `/` |
| Testing | Vitest + Supertest |
| Dev server | `tsx --watch` (live reload) |
| Container | Dockerfile included |
| Package manager | pnpm |
| Code organization | Feature-based modules (`api/healthCheck/`, `api/user/`) |

**Customization for hom-nay-an-gi:**

The boilerplate's `api/healthCheck` and `api/user` modules establish the pattern. We'll replace with our domain modules following the same structure:

```
src/
  api/
    auth/           # Google OAuth + email/password (JWT, bcrypt)
    recipes/        # LLM-powered ingredient search + recipe retrieval
    discovery/      # HERE Maps restaurant search + trending
    favorites/      # CRUD for saved dishes
    settings/       # User preferences CRUD
    sync/           # Guest→Authenticated data merge
  common/
    middleware/      # authenticate (JWT), validate (Zod), rateLimiter, errorHandler
    models/          # serviceResponse envelope
    utils/           # envConfig, httpHandlers
  services/
    llmClient.ts    # OpenAI/Anthropic wrapper with structured output + Zod validation
    cacheClient.ts  # Redis wrapper
    hereMapsClient.ts  # HERE Maps Places API wrapper
  models/           # Mongoose schemas: User, Favorite, SearchHistory, UserPreference
```

**Note:** Project initialization using these commands should be the first implementation story.
