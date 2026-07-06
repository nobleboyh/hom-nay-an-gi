# Test Automation Summary

## Generated Tests

### E2E Tests
- [x] tests/e2e/epic-1-smoke.spec.ts — 11 Epic 1 smoke tests
- [x] tests/e2e/epic-2-smoke.spec.ts — 11 Epic 2 smoke tests

## Test Details

### Epic 1 — E2E Smoke Tests

| # | Test | Status |
|---|------|--------|
| 1 | App shell loads with Vietnamese title and skip-link | ✅ |
| 2 | Collapsible section — Cảm giác thèm section toggles | ✅ |
| 3 | Search and surprise buttons are visible | ✅ |
| 4 | Recipe detail route loads | ✅ |
| 5 | Shopping list empty state renders | ✅ |
| 6 | Discover tab route loads Khám phá screen | ✅ |
| 7 | Favorites tab route loads | ✅ |
| 8 | Profile tab route loads | ✅ |
| 9 | Filter chips render (Chay, Việt Nam, 15 phút) | ✅ |
| 10 | Chip click triggers state change | ✅ |
| 11 | Cook time chip row has default selection | ✅ |

### Epic 2 — Core Search Smoke Tests

| # | Test | Story | Status |
|---|------|-------|--------|
| 1 | Tagline and ingredient input render | 2.3 | ✅ |
| 2 | Filter section labels (Loại món, Ẩm thực, etc.) | 2.3 | ✅ |
| 3 | All 8 food type chips render | 2.3 | ✅ |
| 4 | All 4 cuisine chips render | 2.3 | ✅ |
| 5 | All 4 cook time chips with 30 phút default | 2.3 | ✅ |
| 6 | Ingredient comma triggers chip creation | 2.3 | ✅ |
| 7 | Results screen empty state renders | 2.4 | ✅ |
| 8 | Recipe screen not-found empty state renders | 2.5 | ✅ |
| 9 | Recipe screen action buttons (Quay lại) | 2.5 | ✅ |
| 10 | Shopping list loads owned/missing with query params | 2.6 | ✅ |
| 11 | Shopping list action buttons and tip card render | 2.6 | ✅ |

### Coverage

| Epic | Screens | Routes | Tests |
|------|---------|--------|-------|
| Epic 1 | App shell, 4 tabs, recipe, shopping | /, /discover, /favorites, /profile, /recipe/surprise, /shopping-list | 11 |
| Epic 2 | Home, results, recipe, shopping | /, /results, /recipe/[id], /shopping-list | 11 |

### Key Learnings

- Ingredient chips (`variant="ingredient"`) have a × remove button that messes with accessible name — use `getByText()` instead of `getByRole('button', { name })`
- Vietnamese text with diacritics requires `pressSequentially` or `type` with `delay` to avoid IME issues
- Shopping list state can be tested by passing `dishId`, `dishName`, `owned`, `missing` as query params
- Direct route navigation works for all Epic 2 screens without API dependencies

## Next Steps
- Add E2E tests for Epic 3 (auth) and Epic 4 (settings/favorites)
- Consider adding API-level integration tests for `/api/v1/recipes/*` endpoints
- Run tests in CI pipeline
