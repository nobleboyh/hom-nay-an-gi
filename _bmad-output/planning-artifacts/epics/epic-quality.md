# Cross-Epic Quality Stories

These stories validate the system end-to-end and run after all feature epics (2, 3, 4) are complete.

---

## Story Q.1: Accessibility Audit (WCAG 2.1 AA)

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

## Story Q.2: Performance Validation

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

## Story Q.3: E2E Smoke Tests

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

---

# Cross-Epic Touchpoints

| Touchpoint | Handled By | How |
|-----------|-----------|-----|
| ♡ Save button on RecipeScreen/ResultCard | Epic 2 wires to guest SQLite immediately | Epic 2 renders save button that writes to `favorites_guest` table immediately — no auth gate. Toast confirms. When user later logs in (Epic 4), guest favorites are merged via sync protocol. No no-op stubs — save works on day one. |
| Recipe detail link from Favorites | Epic 1 builds `recipe/[id].tsx` route shell, Epic 2 fills content | FavoritesScreen navigates to route populated by Epic 2. Stub acceptable if Epic 4 ships first. |
| Discover dish → recipe detail | Epic 1 builds route shell, Epic 2 fills content | Same pattern as Favorites. |
| Personalized Discovery (FR-17) | Epic 3 shows "For You" section, Epic 4 provides user prefs via API | Epic 3's DiscoveryService reads UserPreference if auth header present. Falls back to trending for guests. For You is an Epic 4 integration milestone — stub until auth module is complete. |
| Tab bar navigation | Epic 1 builds TabBar with all 4 tabs | Each epic fills its tab's content independently. |
| Network status (all screens) | Epic 1 builds NetworkStatusProvider | All downstream screens import `useNetworkStatus()` from `lib/networkStatus.ts` to trigger offline UI states. |
| Skip navigation link (all screens) | Epic 1 builds link in Tab layout shell | Every route inherits "Bỏ qua điều hướng → #main-content" as first focusable element via `(tabs)/_layout.tsx`. |
