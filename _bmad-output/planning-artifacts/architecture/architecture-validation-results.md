# Architecture Validation Results

## Coherence Validation ✅

**Decision Compatibility:**
All technology choices are mutually compatible. Expo SDK 56 ↔ Express 5.x ↔ MongoDB 8.x ↔ Redis 7.x form a coherent stack with no version conflicts. The Gemini 2.5 Flash provider is wrapped in a configurable `llmClient.ts` abstraction, allowing provider swap without code changes. Zustand + expo-sqlite + React Native work cleanly together via the StorageAdapter pattern. Docker Compose service topology has no circular dependencies.

**Pattern Consistency:**
Backend follows the Express boilerplate conventions (camelCase files, co-located `__tests__/`, Route→Controller→Service layering). Frontend follows React/Expo conventions (PascalCase components, kebab-case routes, `use`-prefixed hooks). API uses consistent RESTful URL-versioned patterns with a standard JSON envelope. No contradictory naming or structural conventions exist between the two codebases.

**Structure Alignment:**
The monorepo layout cleanly separates backend (`/backend`) and frontend (`/frontend`) with independent package managers (pnpm/npm). Each domain module in the backend mirrors the boilerplate pattern. Frontend component tree maps directly to the 7 UX screens. FR-to-module mapping table provides full traceability.

## Requirements Coverage Validation ✅

**Functional Requirements Coverage: 22/22 active FRs covered.**

| Status | Count | FRs |
|--------|-------|-----|
| ✅ Covered | 22 | FR-1,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27 |
| ✂️ Explicitly Cut | 2 | FR-2 (voice), FR-3 (camera object recog) |
| ⚠️ Deferred | 1 | FR-3 barcode (Open Food Facts evaluation post-MVP) |

**Non-Functional Requirements Coverage:**

| NFR | Architectural Support |
|-----|----------------------|
| Bilingual (vi/en) | ✅ `i18n.ts` catalog + LLM prompt language switch + `<span lang>` pattern |
| Cross-platform | ✅ Expo SDK 56 targets iOS + Android + Web |
| Offline capability | ✅ Guest mode with expo-sqlite local storage + offline UX states |
| WCAG 2.1 AA | ✅ ARIA→RN mapping table, `accessibility.ts` helpers, 44px component-level enforcement |
| Performance | ✅ Redis cache (24h TTL), Gemini Flash latency (1-5s), streaming for LLM path |
| Security | ✅ Helmet, CORS, bcrypt (12 rounds), JWT + Redis blocklist, Docker internal network |
| Privacy | ✅ Soft-delete + TTL cleanup, account deletion cascade, guest data isolation |

## Implementation Readiness Validation ✅

**Decision Completeness:**
7 critical decisions documented with versions. 9 important decisions specified. 5 deferred decisions cataloged with rationale. Technology choices verified via Context7 against live documentation.

**Structure Completeness:**
100+ files mapped across backend (6 domain modules + services + models) and frontend (7 screens + 18 components + 4 stores + 6 lib modules + 5 hooks + 3 type files). Docker Compose with 6 services. CI/CD workflow files defined. `.env.template` pattern established.

**Pattern Completeness:**
16 conflict points identified and resolved. Naming conventions for backend (10 scopes), frontend (7 scopes), and API (5 scopes). Structure patterns for monorepo, module, and component levels. Format patterns for API envelope, error codes, and date/time. Communication patterns for Zustand→API flow, action naming, and API client. Process patterns for error handling (3-tier), loading states (5 per screen), retry (4 contexts), and logging (Pino 3-level).

## Gap Analysis Results

**No Critical Gaps.** Architecture is complete enough to begin implementation. 11 gaps logged below (3 Medium, 8 Minor) — none block implementation, all resolvable during development.

| # | Gap | Severity | Recommendation |
|---|-----|----------|---------------|
| G-1 | UX handoff: Discover→external link flow (separate screen vs Recipe variant) | Minor | Resolve during Discover screen implementation |
| G-2 | UX handoff: empty state differentiation (no favorites vs no search results) | Minor | Resolve during Favorites screen implementation |
| G-3 | Vietnamese seed recipe set (100-200 JSON) schema not designed | Medium | Create as first data story — the seed set is the foundation for all LLM-generated recipes; low-quality seed data propagates errors to every generated variation. Schema: `backend/src/data/seed-recipes.json`. Must include a Zod validation schema and at minimum 20 sample recipes before recipe endpoint implementation begins. |
| G-4 | Google Cloud Console OAuth setup steps not documented | Minor | Document in project README, not architecture |
| G-5 | EAS Build profile (`eas.json`) not specified | Minor | Configure when first production build is needed |
| G-6 | No observability beyond Pino logs | Medium | 6 Docker services + external LLM API + sub-3s target demands distributed tracing. Add OpenTelemetry auto-instrumentation to `express-api` and `llm-proxy` (trace context propagation via headers). Export to console in dev, OTLP-collector optional for staging. |
| G-7 | No SLO for the sub-3s search performance target | Medium | "Sub-3s" without a percentile is not verifiable. Define: p95 < 3s for cached searches, p95 < 8s for uncached/LLM-path with streaming fallback. Log every miss as a `warn`-level event. |
| G-8 | MongoDB backup strategy not defined | Medium | Even for MVP, user data needs a backup primitive. Add a one-liner `mongodump` cron to a Docker volume or document the manual backup command. Data loss during development is demoralizing and avoidable. |
| G-9 | Dual-storage query capability divergence | Minor | SQLite (guest) and MongoDB (authenticated) have different query capabilities. Full-text search (FR-22) requires SQLite FTS5 on-device vs MongoDB `$text` indexes. Sorting/pagination diverges. Document in StorageAdapter: "Guest mode queries may be less capable than authenticated; document which queries degrade gracefully." |
| G-10 | Linting tool divergence (backend: biome, frontend: eslint) | Minor | Not a problem (they target different ecosystems), but document in enforcement section so agents don't attempt to unify them. |
| G-11 | OpenAPI generation — verify boilerplate feature | Minor | The `edwinhern/express-typescript` boilerplate may already ship with `zod-to-openapi` or similar. Verify before duplicating effort. The architecture references it as both a boilerplate feature and a custom addition. |

## Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

## Architecture Readiness Assessment

**Overall Status: READY FOR IMPLEMENTATION** ✅

**Confidence Level: High** — all 16 checklist items confirmed, all 22 active FRs covered, all NFRs addressed, all critical decisions documented, no critical gaps.

**Key Strengths:**
- Dual-storage sync protocol is fully specified with conflict resolution and edge cases
- LLM integration is provider-agnostic with Zod validation guardrails and aggressive caching
- WCAG 2.1 AA is baked into component design, not retrofitted
- Complete project tree with 100+ files gives AI agents precise implementation targets
- FR-to-module mapping provides full traceability from requirements to code
- Docker Compose topology isolates LLM reliability from auth/sync availability

**Areas for Future Enhancement:**
- Dark mode (tokens reserved in `tokens.ts`)
- Push notifications (architecture hooks present)
- Apple Sign-In (add if App Store policy requires)
- Password reset email service (SendGrid/Resend integration)
- Vietnamese seed recipe corpus expansion from 20 to 100-200 recipes
- Overture Maps offline bulk data for discovery
- OpenTelemetry export to OTLP-collector (Datadog/Grafana Cloud) for production observability
- Provider swap runbook (documented steps for swapping LLM provider without code changes)

## Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented in this file
- Use implementation patterns consistently — refer to the Enforcement Guidelines (10 rules)
- Respect project structure and module boundaries — no ad-hoc directories
- Every API endpoint gets a Zod validation schema before the controller
- Every screen implements all 5 UX states (loading, empty, error, offline, success)
- Reference `tokens.ts` for all visual constants — never hardcode colors or spacing
- All interactive components: 44px minimum touch target + `accessibilityRole` + `accessibilityLabel`

**Pre-Implementation Prerequisites (before any AI agent touches code):**

1. **Seed recipe schema + 20 sample recipes** — creates `backend/src/data/seed-recipes.json` with Zod validation schema. This gates all LLM-powered recipe generation quality.
2. **SLO definition confirmed** — p95 < 3s cached, p95 < 8s uncached with streaming fallback. Error budget: 5%.
3. **Component count reconciled** — 9 primitives + 9 composites. Ship primitives first.

**First Implementation Priority:**

```bash
# Step 0: Create seed recipe data (gates recipe endpoint)
# Write backend/src/data/seed-recipes.json (20 VN recipes, Zod-validated)

# Step 1: Docker Compose scaffold
docker compose up -d mongo redis

# Step 2: Express TypeScript boilerplate init
git clone https://github.com/edwinhern/express-typescript backend-tmp
cp -r backend-tmp/* backend/ && rm -rf backend-tmp
cd backend && pnpm install

# Step 3: Expo project init
npx create-expo-app@latest --template default@sdk-56 frontend-tmp
cp -r frontend-tmp/* frontend/ && rm -rf frontend-tmp

# Step 4: OpenTelemetry setup (before writing business logic)
# Add auto-instrumentation to express-api and llm-proxy
pnpm add @opentelemetry/api @opentelemetry/auto-instrumentations-node @opentelemetry/sdk-node
```

**Implementation Sequence:** Follow the 15-step sequence documented in Decision Impact Analysis (§Core Architectural Decisions). Steps 9a and 10 can run in parallel (both depend only on LLM + Redis).
