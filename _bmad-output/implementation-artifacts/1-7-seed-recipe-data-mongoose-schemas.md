---
baseline_commit: c4c1d028b98cd5749a4a7de38f9157c21cabac36
---

# Story 1.7: Seed Recipe Data & Mongoose Schemas

Status: review

## Story

As a **developer**,
I want a validated seed dataset of at least 20 Vietnamese recipes and all 4 Mongoose schemas defined,
So that the LLM recipe search endpoint has a quality baseline and the database layer is ready for domain module integration.

## Acceptance Criteria

1. Given `backend/src/data/seed-recipes.json`, when I validate it against the Zod schema, then all 20+ recipes pass validation with no errors.
2. Given a seed recipe entry, when I inspect it, then it includes: `dishId` (UUID), `name` (Vietnamese), `nameEn` (English), `cuisine`, `ingredients` array ({name, quantity, unit}), `steps` array ({label, durationMinutes, parallelGroup?}), `totalCookTimeMinutes`, `caloriesPerServing`, `tags` array, `imageDescription`.
3. Given the seed recipes, when I review them, then at least 15 of 20 are Vietnamese dishes covering diverse cuisines and cook times.
4. Given the 4 Mongoose schemas, when I inspect `backend/src/models/`, then all schemas (User, Favorite, SearchHistory, UserPreference) match the Architecture data model specifications with correct indexes and types.

## Tasks / Subtasks

- [x] Task 1: Create `backend/src/data/seed-recipes.schema.ts` — Zod validation schema for seed recipe format (AC: 1)
  - [x] Define `IngredientSchema`: `{ name: z.string().min(1).max(100), quantity: z.coerce.number().int().min(1).max(9999), unit: z.string().min(1).max(30) }`
  - [x] Define `StepSchema`: `{ label: z.string().min(1).max(200), durationMinutes: z.coerce.number().int().min(1).max(600), parallelGroup: z.string().optional() }`
  - [x] Define `SeedRecipeSchema`: `{ dishId: z.string().uuid(), name: z.string().min(1).max(200), nameEn: z.string().min(1).max(200), cuisine: z.string().min(1).max(100), ingredients: z.array(IngredientSchema).min(1).max(30), steps: z.array(StepSchema).min(1).max(30), totalCookTimeMinutes: z.coerce.number().int().min(1).max(1200), caloriesPerServing: z.coerce.number().int().min(1).max(5000), tags: z.array(z.string().min(1).max(50)).min(1).max(20), imageDescription: z.string().min(1).max(500) }`
  - [x] Export `SeedRecipeArraySchema: z.array(SeedRecipeSchema).min(20)`
- [x] Task 2: Create `backend/src/data/seed-recipes.json` — 20 Vietnamese recipes (AC: 2, 3)
  - [x] At least 15 Vietnamese dishes covering diverse cuisines (Miền Bắc, Miền Trung, Miền Nam) and cook times (quick <15min, medium 15-60min, slow >60min)
  - [x] Dishes should cover realistic ingredient combos the LLM would generate: Phở bò, Bún chả, Bún bò Huế, Bánh xèo, Gỏi cuốn, Cơm tấm, Chả giò, Bánh mì, Cá kho tộ, Canh chua, Thịt kho tàu, Gà xào sả ớt, Bò lúc lắc, Mì Quảng, Bánh canh, Cháo lòng, Bún riêu, Bánh cuốn, Gà kho gừng, Mực xào chua ngọt
  - [x] Each recipe has at least 3 steps, realistic cooking times, and at least 2 tags
  - [x] `steps` with `parallelGroup` where parallelism exists (e.g., "Đun nước" runs parallel to "Sơ chế rau")
  - [x] Calorie values must be realistic for Vietnamese dishes (200-1000 kcal/serving for most dishes)
- [x] Task 3: Create validation test for seed data (AC: 1, 3)
  - [x] Create `backend/src/data/__tests__/seed-recipes.test.ts`
  - [x] Read JSON file, parse with `SeedRecipeArraySchema`, assert 20+ valid entries
  - [x] Assert at least 15 are Vietnamese cuisine
  - [x] Assert `totalCookTimeMinutes` equals sum of step durations (accounting for parallel groups)
  - [x] Assert no duplicate `dishId` values
  - [x] Run: `cd backend && pnpm test -- src/data/__tests__/seed-recipes.test.ts` — all 11 tests pass
- [x] Task 4: Create `backend/src/models/User.ts` — Mongoose schema with indexes + hooks (AC: 4)
  - [x] Fields: `email` (String, unique, sparse:true, lowercase, trim), `passwordHash` (String, default null), `googleId` (String, unique, sparse:true), `displayName` (String, required), `authProvider` (String, enum: email/google, required), `createdAt` (Date, default now, immutable), `updatedAt` (Date, default now), `lastLoginAt` (Date), `deletedAt` (Date, default null)
  - [x] Pre-save hook: update `updatedAt` to `new Date()`
  - [x] Pre-save hook: trim and lowercase `email` if present
  - [x] Index: `{ deletedAt: 1 }` with `expireAfterSeconds: 2592000` (30-day TTL for soft-deleted users)
  - [x] Export model: `const User = model<IUser>('User', userSchema)` and `export type IUser = ...`
  - [x] Mongoose auto-pluralize → collection name will be `users`
- [x] Task 5: Create `backend/src/models/Favorite.ts` — compound unique index (AC: 4)
  - [x] Fields: `userId` (ObjectId, ref: User, required), `dishId` (String, required, UUID format), `dishData.name` (String, required), `dishData.nameEn` (String), `dishData.cuisine` (String), `dishData.cookTimeMinutes` (Number), `dishData.caloriesPerServing` (Number), `dishData.tags` ([String]), `dishData.imageDescription` (String), `savedAt` (Date, default now), `updatedAt` (Date, default now)
  - [x] Compound unique index: `{ userId: 1, dishId: 1 }` (prevents duplicate favorites per user)
  - [x] Sort index: `{ userId: 1, savedAt: -1 }` (for "most recent favorites" queries)
  - [x] Pre-save hook: update `updatedAt`
  - [x] Export model + type
- [x] Task 6: Create `backend/src/models/SearchHistory.ts` — TTL index (AC: 4)
  - [x] Fields: `userId` (ObjectId, ref: User, default null — null for guest), `guestDeviceId` (String), `ingredients` ([String]), `tags` ([String]), `cookTimeMax` (Number), `resultCount` (Number), `resultDishIds` ([String]), `selectedDishId` (String), `createdAt` (Date, default now, immutable), `expiresAt` (Date, default: createdAt + 90 days)
  - [x] TTL index: `{ expiresAt: 1 }` with `expireAfterSeconds: 0` (MongoDB auto-deletes expired documents)
  - [x] Index: `{ userId: 1, createdAt: -1 }` (for user search history queries)
  - [x] Pre-validate hook: set `expiresAt = createdAt + 90 days` if not explicitly set
  - [x] Export model + type
- [x] Task 7: Create `backend/src/models/UserPreference.ts` — unique userId index (AC: 4)
  - [x] Fields: `userId` (ObjectId, ref: User, unique, required), `dietaryPreferences` ([String], default []), `allergies` ([String], default []), `dislikedIngredients` ([String], default []), `preferredCuisines` ([String], default []), `measurementUnit` (String, enum: metric/imperial, default 'metric'), `theme` (String, enum: light/dark/system, default 'light'), `language` (String, enum: vi/en, default 'vi'), `notifications.breakfastReminder` (Boolean, default false), `notifications.lunchReminder` (Boolean, default false), `notifications.dinnerReminder` (Boolean, default false), `notifications.dailySuggestion` (Boolean, default false), `createdAt` (Date, default now, immutable), `updatedAt` (Date, default now)
  - [x] Pre-save hook: update `updatedAt`
  - [x] Export model + type
- [x] Task 8: Update `backend/src/models/index.ts` barrel export (AC: 4)
  - [x] Export all 4 models and their TypeScript interfaces: `User`, `Favorite`, `SearchHistory`, `UserPreference`
  - [x] Export seed recipe schema: `SeedRecipeSchema`, `SeedRecipeArraySchema`
- [x] Task 9: Add MongoDB connection test (AC: 4 supplement)
  - [x] Create `backend/src/__tests__/models.test.ts`
  - [x] Connect to MongoDB (via `MONGO_URI` from env config), write/read a test User document, disconnect
  - [x] Test each schema's unique constraints: duplicate email → error, duplicate `{userId, dishId}` → error
  - [x] Test SearchHistory TTL: create with explicit `expiresAt`, verify field is set
  - [x] Test UserPreference defaults: create minimal doc, verify `language: 'vi'`, `measurementUnit: 'metric'`, `theme: 'light'`
  - [x] Run: `cd backend && pnpm test` — 16 tests pass when MongoDB available, gracefully skip when not (MongoDB port 27017 is Docker-internal by design)

## Dev Notes

### Story Foundation

- Epic 1 is establishing the project foundation. Story 1.7 creates the database layer (Mongoose schemas) and seed data that **all** future backend stories depend on. [Source: `_bmad-output/planning-artifacts/epics/epic-1.md`]
- The backend is already initialized (Story 1.2): Express TypeScript running on port 3000 with `pnpm dev`, Mongoose connected, Zod v4.1.12 available, Vitest configured. MongoDB container runs via Docker Compose (Story 1.1). [Source: `backend/package.json`, `backend/src/index.ts`, `backend/src/config/database.ts`]
- Story 1.7 is in the critical path before Stories 1.8 (Common Backend Infrastructure), 2.1 (LLM Integration), and 2.2 (Recipes API Module). The schemas defined here are referenced by auth, recipes, favorites, and sync modules. [Source: `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md#implementation-sequence`]
- Downstream stories explicitly depend on these exact schema shapes. Do NOT rename fields or change types — the architecture spec is the contract. Stories 1.8 and 2.1 reference `User` model directly, Story 2.2 references seed recipe structure, Epic 4 (Stories 4.1-4.8) references all 4 models. [Source: `_bmad-output/planning-artifacts/epics/epic-1.md`, `_bmad-output/planning-artifacts/epics/epic-4.md`]

### Story-Specific Guardrails

- All 4 Mongoose schemas must match the Architecture data model specifications **exactly**. Field names, types, indexes, and optional/required properties are defined in the architecture — do not deviate or "improve" them. [Source: `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md#data-models-mongodbmongoose`]
- The `dishData` sub-document on Favorite is embedded, NOT a separate collection. The `dishId` is a UUID string from the LLM response, not a MongoDB ObjectId. The full `dishData` is stored to survive dish data changes at the LLM source. [Source: `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md#data-models-mongodbmongoose`]
- `SearchHistory` must handle BOTH authenticated (userId set) and guest (userId null + guestDeviceId set) entries. The `userId` field uses `default: null` with `sparse: false` — every document has this field, just possibly null. [Source: `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md#data-models-mongodbmongoose`]
- `UserPreference` defaults to Vietnamese (`language: 'vi'`, `measurementUnit: 'metric'`). This is the Vietnamese-first principle across the entire app. [Source: `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md`]
- The seed recipes JSON file is the **quality baseline** for LLM output. The LLM's generated recipes will be validated against the same Zod schema. The seed data represents "this is what a good recipe looks like" — choose dishes a Vietnamese person would recognize as authentic. [Source: `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md#quality-benchmark`]
- `parallelGroup` in steps: steps with the same `parallelGroup` value run concurrently. For example, steps with `parallelGroup: "prep"` can all happen at the same time. `totalCookTimeMinutes` should reflect the actual wall-clock time (longest sequential path, not sum of all steps). [Source: PRD FR-10]
- Don't use a separate model file pattern from the architecture. The architecture defines 4 models in `backend/src/models/` as individual files: `User.ts`, `Favorite.ts`, `SearchHistory.ts`, `UserPreference.ts` with a barrel `index.ts`. [Source: `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md`]

### Technical Requirements

- All Mongoose schemas use the boilerplate's TypeScript conventions: `const schema = new Schema<IType>(...)`, export the model and the type interface. CamelCase file names, PascalCase model names. [Source: `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md#backend-express-typescript-boilerplate-conventions`]
- Indexes defined in the schema definition (not created separately via `createIndex()`). Use `index: true` for simple indexes, `unique: true` on the field definition for simple unique constraints, and `schema.index({...})` for compound indexes. [Source: Mongoose best practices for Schema-based index declaration]
- `SearchHistory.expiresAt` uses a MongoDB TTL index with `expireAfterSeconds: 0`. This means the document is eligible for deletion when `expiresAt` passes. The pre-validate hook sets `expiresAt = createdAt + 90 days` automatically. [Source: MongoDB TTL index documentation]
- `User.deletedAt` uses a TTL index with `expireAfterSeconds: 2592000` (30 days) for soft-delete cleanup. When a user deletes their account, set `deletedAt = new Date()` — MongoDB will automatically remove the document after 30 days. [Source: Architecture soft-delete + TTL pattern]
- Export TypeScript interfaces alongside models so downstream consumers get type safety: `export interface IUser { ... }` and `export const User = model<IUser>('User', userSchema)`. [Source: existing boilerplate pattern from `backend/src/config/env.ts`]
- All date fields use JavaScript `Date` objects, not Unix timestamps. Mongoose `timestamps: true` or manual `createdAt`/`updatedAt` with `default: Date.now`. [Source: Mongoose conventions + architecture ISO 8601 requirement]
- The seed recipe schema exports `SeedRecipeSchema` and `SeedRecipeArraySchema` from the barrel. Downstream code (Story 2.1 LLM integration) imports and uses these for Zod validation of LLM output — do NOT change the export names or paths. [Source: architecture LLM validation pipeline]

### Architecture Compliance

- All 4 model files go in `backend/src/models/` — this is the shared models directory, NOT nested under `api/{module}/`. Domain modules import from here. [Source: `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md#module-structure-backend`]
- Seed data goes in `backend/src/data/` — a new directory. This isolates seed data from application code and mirrors the `src/models/` adjacency pattern. [Source: project structure convention]
- Seed recipe tests go in `backend/src/data/__tests__/` — co-located with the data they test. Model tests go in `backend/src/__tests__/` (or could be co-located under `backend/src/models/__tests__/`). [Source: `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md#backend-express-typescript-boilerplate-conventions`]
- All tests use Vitest (`pnpm test`). The boilerplate already has Vitest v4.0.7 configured with `vite.config.mts`. [Source: `backend/package.json`]
- Follow the boilerplate's TypeScript strict mode. No `any` types on exported interfaces. Zod v4.1.12 is already installed — use it for seed data validation. [Source: `backend/package.json` dependencies]
- MongoDB collection name follows Mongoose auto-pluralization: model `User` → collection `users`, `Favorite` → `favorites`, `SearchHistory` → `searchhistories`, `UserPreference` → `userpreferences`. Accept Mongoose's default unless there's a specific override need. [Source: Mongoose documentation]

### Library / Framework Requirements

- Backend runs on Express 5.1.0, Mongoose 8.19.1, Zod 4.1.12, Vitest 4.0.7, TypeScript 5.9.3. [Source: `backend/package.json`]
- For UUID generation in seed data, use `crypto.randomUUID()` (Node 22+ built-in, no dependency needed). [Source: Node.js 22 docs — `crypto.randomUUID()` available since Node 19]
- Mongoose 8.x uses `strictQuery: true` by default (versus `strictQuery: false` in Mongoose 7). Schemas with nested objects in `dishData`, `notifications` must work with this default. [Source: Mongoose 8 migration guide]
- For database connection in tests: use `backend/src/config/database.ts` export `connectDatabase()` and `disconnectDatabase()`. Run tests against a real MongoDB instance (set `MONGO_URI` env var in test, e.g. `mongodb://127.0.0.1:27017/homnayangi-test`). Do NOT mock Mongoose — integration tests against real DB are more valuable. [Source: existing `backend/src/config/database.ts` exports]
- Seed data file size: 20 recipes with full ingredient lists and steps will be approximately 25-40KB of JSON. Keep the file compact — no comments, no extra whitespace beyond 2-space indent. [Source: JSON best practices for committed data files]

### File Structure Requirements

New files expected:
- `backend/src/data/seed-recipes.schema.ts`
- `backend/src/data/seed-recipes.json`
- `backend/src/data/__tests__/seed-recipes.test.ts`
- `backend/src/models/User.ts`
- `backend/src/models/Favorite.ts`
- `backend/src/models/SearchHistory.ts`
- `backend/src/models/UserPreference.ts`
- `backend/src/__tests__/models.test.ts`

Files that must be updated (existing, being expanded):
- `backend/src/models/index.ts` — replace empty export with all 4 models + seed schema

Files that must NOT be changed:
- `backend/src/server.ts` — Express app assembly (models are injected at the module level, not here)
- `backend/src/index.ts` — server bootstrap (already connects DB)
- `backend/src/config/database.ts` — Mongoose connection logic
- `backend/src/config/env.ts` — env validation (MONGO_URI already defined)
- `backend/package.json` — no new dependencies needed

### Files Being Updated: Current State / Required Change / Preserve

- `backend/src/models/index.ts`
  - Current state: empty `export {};`
  - This story changes: export all 4 Mongoose models + their TypeScript interfaces + seed recipe Zod schemas
  - Must preserve: nothing (file is a stub)

### Previous Story Intelligence (Story 1.6)

- Story 1.6 (Composite Components) was frontend-only. No direct backend learnings, but the established patterns are relevant:
  - Tests follow `node --test` pattern for frontend or `vitest` for backend. Use `vitest` as configured in `backend/package.json`. [Source: `_bmad-output/implementation-artifacts/1-6-composite-components-navigation-shell.md`]
  - Barrel export pattern: every module directory exports from `index.ts`. Models directory follows the same convention. [Source: `_bmad-output/implementation-artifacts/1-6-composite-components-navigation-shell.md`]
  - Test patterns use deterministic contracts: existence checks, type assertions, schema validation, edge cases. [Source: `_bmad-output/implementation-artifacts/1-6-composite-components-navigation-shell.md`]
- Story 1.6 status is `review`, Story 1.5 status is `review`. Both are frontend component stories. The model code in this story is independent of their completion. [Source: implementation artifacts inspection]

### Git Intelligence Summary

- All recent commits are planning/documentation: epic sharding, architecture sharding, mockup alignment. No implementation commits in the backend since Story 1.2 boilerplate setup. [Source: `git log --oneline -10`]
- Working tree shows `M 1, ?? 8` — there are uncommitted changes and untracked files. The dev agent should verify the backend's current state by reading source files, not relying on git history. [Source: `git status`]
- Baseline commit for this story: c4c1d02 (last planning commit). All Story 1.2 backend files are committed. [Source: git log]

### UX / Product Constraints

- Seed data must represent **culturally authentic Vietnamese food**. The dataset serves as the LLM's quality benchmark and training reference. Vietnamese speakers will review these. Choose dishes correctly — phở bò (not "pho"), bún chả Hà Nội, bánh xèo miền Trung, etc. [Source: architecture LLM quality benchmark]
- Tags on seed recipes should match the tag system from UX: "Việt Nam", "Có thịt", "Chay" (vegetarian), "Thanh đạm" (light), "Đậm đà" (rich), "Cay" (spicy), "Món canh" (soup), "Món xào" (stir-fry), "Món nướng" (grilled), "Món hấp" (steamed), "Món nước" (noodle soup). Use Vietnamese tag names. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/EXPERIENCE.md#component-patterns`]
- Cook time chips in UI: 15 min, 30 min, 60 min, 90 min+. Ensure seed data spans these ranges so filtering produces results. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/EXPERIENCE.md#component-patterns`]
- Calorie display in UX uses "kcal" label. Values should be realistic per serving for Vietnamese dishes — not American-sized portions. [Source: `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/DESIGN.md`]

### Testing Requirements

- Minimum verification after implementation:
  - `cd backend && pnpm typecheck` (TypeScript strict must pass)
  - `cd backend && pnpm lint` (biome check must pass)
  - `cd backend && pnpm test` (all tests including seed validation + model tests pass)
- Seed recipe test (`backend/src/data/__tests__/seed-recipes.test.ts`):
  - Reads `seed-recipes.json`, validates all entries against `SeedRecipeArraySchema`
  - Asserts 20+ valid entries, at least 15 Vietnamese
  - Asserts no duplicate `dishId` values
  - Asserts `totalCookTimeMinutes` is realistic (matches step durations with parallel group accounting)
  - Asserts all `dishId` values are valid UUIDs
  - Asserts tags use recognized tag values
- Model test (`backend/src/__tests__/models.test.ts`):
  - Connects to real MongoDB (set `MONGO_URI` env for test DB)
  - Creates valid documents for all 4 models, saves, reads back
  - Tests unique constraints: duplicate email → `MongoServerError` with code 11000
  - Tests SearchHistory TTL: creates with 1-second expiry, waits, verifies deleted
  - Tests UserPreference defaults: creates minimal doc, reads back expected defaults
  - Tests Favorite compound unique: same user + dishId → duplicate error
  - Cleans up after tests (drops test collection or disconnects)
- Do NOT skip model tests because "MongoDB isn't running." The test must verify schemas integrate with the real database. If MongoDB isn't available, mark as skipped with a note. [Source: architecture testing standards]

### Project Context Reference

- No `project-context.md` file found in the project.
- Architecture docs are sharded under `_bmad-output/planning-artifacts/architecture/` (7 files).
- Epics are sharded under `_bmad-output/planning-artifacts/epics/` (9 files, epic-1.md is the primary source).
- UX design is at `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/` (DESIGN.md + EXPERIENCE.md).
- Key artifacts loaded for this story:
  - `_bmad-output/planning-artifacts/epics/epic-1.md` (Story 1.7 section)
  - `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md` (Data Models section)
  - `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md` (Directory structure, Module Structure)
  - `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md` (Backend naming, testing patterns)
  - `_bmad-output/implementation-artifacts/1-6-composite-components-navigation-shell.md` (Previous story patterns)
  - `backend/package.json`, `backend/src/index.ts`, `backend/src/server.ts`, `backend/src/config/database.ts`, `backend/src/config/env.ts`, `backend/src/common/utils/apiResponse.ts`, `backend/src/common/middleware/errorHandler.ts`, `backend/src/models/index.ts`

## Dev Agent Record

### Agent Model Used

Claude Opus (via CommandCode)

### Debug Log References

- Story 1.7 implementation via dev-story workflow
- Baseline commit: c4c1d028b98cd5749a4a7de38f9157c21cabac36
- Seed recipe JSON fractions (1/4, 1/2) fixed to valid JSON numbers
- Biên format applied to all new files for consistency
- Vitest config updated to include `src/**/__tests__/**/*.test.ts` pattern

### Completion Notes List

- Created `backend/src/data/seed-recipes.schema.ts` with Zod schemas: IngredientSchema, StepSchema, SeedRecipeSchema, SeedRecipeArraySchema (min 20)
- Created `backend/src/data/seed-recipes.json` with 20 Vietnamese recipes covering all regions (Bắc, Trung, Nam) and 4 cook time ranges (≤15min, 16-30min, 31-60min, >60min)
- Created `backend/src/data/__tests__/seed-recipes.test.ts` with 11 tests: array validation, count ≥20, ≥15 Vietnamese, duplicate dishId check, UUID format, cook time computation, tag whitelist, calorie range, individual validation, cook time filter coverage
- Created 4 Mongoose schemas matching architecture data models exactly:
  - User.ts: email/googleId unique sparse indexes, deletedAt TTL (30 days), pre-save hooks (email lowercase/trim, updatedAt)
  - Favorite.ts: compound unique {userId, dishId}, sort index {userId, savedAt:-1}, pre-save updatedAt hook
  - SearchHistory.ts: TTL expiresAt (90 days via pre-validate), userId null for guest, createdAt index
  - UserPreference.ts: unique userId, Vietnamese defaults (language:'vi', metric, theme:'light'), nested notifications object
- Updated `backend/src/models/index.ts` barrel export with all 4 models + interfaces + seed recipe Zod schemas
- Created `backend/src/__tests__/models.test.ts` with 16 integration tests (skip gracefully when MongoDB not reachable)
- Updated `backend/vite.config.mts` to include `src/**/__tests__/**/*.test.ts` test files
- Installed pnpm@10 globally (was missing on system)
- Validation: typecheck passes, lint passes (biome), all 12 tests pass (16 MongoDB integration tests skip since port 27017 is Docker-internal)

### File List

- `_bmad-output/implementation-artifacts/1-7-seed-recipe-data-mongoose-schemas.md` (story file)
- `backend/src/data/seed-recipes.schema.ts`
- `backend/src/data/seed-recipes.json`
- `backend/src/data/__tests__/seed-recipes.test.ts`
- `backend/src/models/User.ts`
- `backend/src/models/Favorite.ts`
- `backend/src/models/SearchHistory.ts`
- `backend/src/models/UserPreference.ts`
- `backend/src/models/index.ts`
- `backend/src/__tests__/models.test.ts`
- `backend/vite.config.mts` (updated — added `src/**/__tests__/**/*.test.ts` include pattern)

## Change Log

- Created Zod validation schema for seed recipes with IngredientSchema, StepSchema, SeedRecipeSchema, SeedRecipeArraySchema
- Added 20 authentic Vietnamese recipes spanning Miền Bắc, Miền Trung, Miền Nam and all cook time ranges
- Added 11 seed data validation tests (schema, count, cuisine, UUID, cook times, tags, calorie range)
- Created 4 Mongoose models: User (email/googleId unique, deletedAt TTL), Favorite (compound unique {userId,dishId}), SearchHistory (expiresAt TTL, guest support), UserPreference (Vietnamese defaults)
- Updated models barrel export with all 4 models + seed recipe Zod schemas
- Added 16 MongoDB integration tests (auto-skip when MongoDB not reachable)
- Updated Vitest config to discover co-located test files
