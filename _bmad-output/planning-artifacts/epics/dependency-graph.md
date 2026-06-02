# Dependency Graph (Epic Level)

```
Epic 1: Project Initialization & Foundation
           │
    ┌──────┼──────┐
    ▼      ▼      ▼
 Epic 2  Epic 3  Epic 4
(Core   (Discover) (Accounts,
Search)             Favorites
                    & Personalization)
```

**Epic 2, 3, and 4 are predominantly independent of each other. They only depend on Epic 1.**

**Soft dependencies (manageable, non-blocking):**
- Epic 3 (For You) → Epic 4 (User Preferences): `GET /api/v1/discovery/for-you` requires auth + preferences. Falls back to trending for guests. Treat "For You" as a post-Epic-4 integration milestone.
- Epic 4 (FavoritesScreen) → Epic 2 (RecipeScreen): FavoritesScreen navigates to `recipe/[id].tsx`. Epic 1 provides the route shell; Epic 2 fills it with content. Stub acceptable if Epic 4 ships first.
- Save button: Epic 2 wires to guest SQLite immediately. Epic 4 adds authenticated sync. No dependency — Epic 2 save works on day one.

**Quality Stories (Q.1–Q.3):** Run after all feature epics (2, 3, 4) are complete. Validate accessibility, performance, and end-to-end flows.

**New stories added per review findings:**
- Story 1.10: Client Error Monitoring (Sentry)
- Story 4.9: Notification Infrastructure (local notifications)
- Story Q.1: Accessibility Audit (WCAG 2.1 AA)
- Story Q.2: Performance Validation (SLO verification)
- Story Q.3: E2E Smoke Tests (5 core user journeys)
