# UX → Architecture Handoff

**Project:** Hôm Nay Ăn Gì (v4 — Open Design)
**Date:** 2026-06-01
**Status:** UX spine pair validated and ready for architecture

## Deliverables

| Artifact | Path | Format |
|----------|------|--------|
| Visual Design System | `DESIGN.md` | Markdown spec with OKLCH tokens, typography, components, spacing |
| Behavioral/Experience Spine | `EXPERIENCE.md` | Markdown spec with IA, states, flows, accessibility, interaction primitives |
| HTML Mockups (7 screens) | `mockups-v2/01-home.html` — `mockups-v2/07-login.html` | Static HTML/CSS/JS (1:1 reference with design system tokens) |
| Validation Report | `validation-report.md` | 67 findings resolved; spine pair ready for handoff |
| Decision Log | `.decision-log.md` | 41 closed decisions |
| Individual Reviews | `review-rubric.md`, `review-accessibility.md`, `review-token-audit.md` | Supporting audit evidence |
| Reconcile Inputs | `reconcile-inputs.md` | Evolution tracking from v1–v4 |

## Architecture Constraints from UX

### Screen → Data Dependencies

| Surface | Key Data Required | Notes |
|---------|------------------|-------|
| Home (input + filters) | Ingredient list, food-type taxonomy, cuisine taxonomy, cook-time ranges | Chips are client-side filter state |
| Results | Dish list (filtered by ingredients + filters), match scores | Collapsible cards with percentage badges |
| Recipe | Full recipe: ingredients, steps, nutrition, image | Vertical timeline; serving adjuster recalculates quantities |
| Discover | Location-aware trending/nearby dishes, cuisine+price filters | Proximity-based; external delivery links |
| Favorites | Saved dish list (user-bound), search within favorites | Guest mode: localStorage; logged-in: cloud sync |
| Shopping List | Ingredient list from selected recipe(s), checkable items | Save/load per user |
| Login | Auth endpoints, guest mode flag | 3-field form (email, password), guest skip |

### State Coverage (per EXPERIENCE.md)
All 7 screens must support: **loading**, **empty**, **error**, **offline**, and **success** states.

### Accessibility Minimum (WCAG 2.1 AA)
- All interactive elements ≥44px touch target
- Color contrast ≥4.5:1 body / ≥3:1 large text (OKLCH tokens already calibrated)
- Skip navigation link on every screen
- ARIA attributes: `aria-expanded`, `aria-pressed`, `aria-current`, `aria-label`, `aria-live`, `aria-invalid`, `role` mappings
- Keyboard-operable: all interactive elements reachable and activatable via keyboard
- `lang="vi"` on document root; English phrases wrapped in `<span lang="en">`
- `prefers-reduced-motion: reduce` support

## Open Questions Needing Architecture Input

1. **Login enforcement**: Should guest bookmark/download trigger login prompt? PRD says yes.
2. **Dark mode palette**: Deferred — architecture should flag where dark-mode hooks are needed.
3. **Discover → external link flow**: Production needs restaurant detail page with delivery app deep links.
4. **Serving adjuster UX**: −/+ buttons vs. slider for finer control.
5. **App icon / PWA manifest**: TBD — design needed for home-screen install experience.

## Mockup Reference Notes

- All mockups verified for structural consistency and accessibility (skip-links, ARIA, touch targets, semantic HTML)
- System CSS (`mockups-v2/css/system.css`) uses CSS custom properties matching DESIGN.md tokens
- `screens.js` handles toast, collapsible toggle, chip selection, and checkbox toggle
- Inline styles in mockups are visual overrides only; production should use CSS tokens

## Next Expected Workflow Steps

1. `bmad-create-architecture` — technical architecture, component tree, data flow, API contracts
2. `bmad-create-epics-and-stories` — break into epics and user stories for sprint planning
3. Sprint planning → implementation
