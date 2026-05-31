# Hôm Nay Ăn Gì — Design Specification

**Version:** 0.1 · **Date:** 2026-05-31 · **Status:** Mockup baseline
**Platform:** Mobile-first responsive web (PWA-ready) · **Languages:** Vietnamese (default), English

---

## 1. Design Philosophy

**Tone.** Warm, editorial, food-first. A bilingual Vietnamese cooking companion that feels like a thoughtfully art-directed cookbook rather than a generic recipe utility. The visual language borrows from modern Vietnamese cafés: clay-toned earthenware, sage herbs, cream paper, hand-set serif headlines.

**Principles.**
1. **Decide, don't browse.** Every screen pushes the user toward an answer ("Surprise Me", top-match highlighted, expanded by default).
2. **Editorial over utilitarian.** Display serif headlines, generous spacing, photographic warmth — not a spreadsheet of recipes.
3. **Bilingual without compromise.** Vietnamese diacritics render in a display face tuned for them (Fraunces). EN/VI toggleable everywhere; neither feels like a translation afterthought.
4. **One-thumb mobile.** Primary actions reachable from the bottom third. Bottom nav is persistent across the four root surfaces.

---

## 2. Brand & Visual Identity

### 2.1 Color tokens (OKLCH)

Defined in `src/styles.css` under `:root`. Always reference via semantic tokens, never raw values in components.

| Token | OKLCH | Role |
|---|---|---|
| `--cream` | `oklch(0.972 0.018 85)` | Base paper warmth |
| `--clay` | `oklch(0.62 0.14 38)` | Primary brand — terracotta, CTAs, active states |
| `--sage` | `oklch(0.58 0.06 145)` | Accent — herbs, tags, success/positive |
| `--ink` | `oklch(0.22 0.02 60)` | Headlines, device chrome, deep text |
| `--background` | `oklch(0.965 0.02 80)` | App canvas |
| `--foreground` | `oklch(0.22 0.02 60)` | Body text |
| `--card` | `oklch(1 0 0)` | Elevated surfaces |
| `--secondary` | `oklch(0.92 0.025 80)` | Inactive chips, subtle fills |
| `--muted` | `oklch(0.94 0.015 80)` | Quiet backgrounds |
| `--muted-foreground` | `oklch(0.5 0.02 60)` | Captions, meta |
| `--border` | `oklch(0.88 0.018 70)` | Hairlines |

**Ambient gradients.** Body wears two soft radial washes (clay 14% top-left, sage 16% bottom-right) on a fixed attachment, giving the app a warm, hand-thrown ceramic feel without competing with content.

### 2.2 Typography

| Family | Use | Weights |
|---|---|---|
| **Fraunces** (`--font-display`) | Headlines, screen titles, brand wordmark, italic emphasis ("Ăn Gì") | 400–800, optical sizing on |
| **Inter** (`--font-sans`) | Body, UI, labels, numerics | 400 / 500 / 600 / 700 |

**Scale (mobile baseline).**

| Role | Size / Leading | Weight |
|---|---|---|
| Display H1 (marketing) | 48–72px / 0.95 | Fraunces 700 |
| Screen title | 22–28px / 1.1 | Fraunces 600 |
| Card title | 16–18px / 1.25 | Fraunces 600 |
| Body | 14px / 1.5 | Inter 400 |
| Label / meta | 11–12px / 1.3 | Inter 500 |
| Micro (status, timestamps) | 9–10px / 1.2 | Inter 500 |

Italic display weights are reserved for the brand mark and editorial pull-phrases — never for body or UI labels.

### 2.3 Radii & elevation

- `--radius: 1.25rem` (20px) base, with `sm/md/lg/xl/2xl/3xl` derived. Cards use `radius-2xl`; phone frame bezel uses `3rem`.
- **Shadow language.** Soft, warm, off-axis: `0 30px 80px -20px rgba(80,40,20,0.35)` for hero containers (phone frame). Cards rely on hairline borders + subtle background contrast rather than heavy shadows.

### 2.4 Iconography

`lucide-react` only. Stroke `1.8` default; `2.5` for active bottom-nav state. Icons sized `w-5 h-5` in nav, `w-4 h-4` inline.

---

## 3. Layout System

### 3.1 Device target
Primary canvas: 320 × 680 (iPhone 13 mini class), rendered inside `PhoneFrame` with status bar and notch. Content area is `pt-8` below the status bar, with bottom nav reserving 64px when present.

### 3.2 Spacing
4-pt grid. Page gutters `px-5` (20px). Card padding `p-4`. Section rhythm `pb-3 / pb-4`. Bottom nav clears with `pb-20` on scrollable surfaces.

### 3.3 Bottom navigation
Four destinations — **Home · Discover · Favorites · Settings** — fixed, blurred backdrop (`bg-card/95 backdrop-blur`), active state colored `clay` with heavier stroke. Present on root surfaces; absent on stack-pushed screens (Ingredient Input, Results, Recipe, Login).

---

## 4. Component Library

| Component | Token usage | Notes |
|---|---|---|
| `Tag` | `bg-clay` active / `bg-secondary` inactive | Pill, 11px medium, used for filters and modes |
| `Chip` | `bg-sage/15` text `sage` | Ingredient chips, dismissible (`X` icon) |
| `Card` | `bg-card` + `border-border` | Recipe cards, list rows |
| `PhoneFrame` | `bg-ink` bezel, `bg-card` inner | Showcase wrapper only |
| `BottomNav` | See §3.3 | Persistent root navigation |

Match-score badges use clay at varying opacity for relevance scoring (e.g., "96% match" on Results).

---

## 5. Screen Inventory

Eight mockups cover the three PRD user journeys.

| # | Screen | Journey | Key UI |
|---|---|---|---|
| 01 | **Home** | UJ-1/2/3 entry | "Surprise Me" hero, quick-mode tiles, trending feed |
| 02 | **Ingredient Input** | UJ-1 | Text + voice + camera, quantity steppers, ingredient chips, cook-time filter |
| 03 | **Results** | UJ-1 | Relevance-sorted cards, top result expanded by default, match % |
| 04 | **Recipe Timeline** | UJ-1 | Parallel task lanes with start/end times, shopping list |
| 05 | **Discover Nearby** | UJ-2 | Map preview, radius + price filters, restaurant list |
| 06 | **Favorites** | UJ-3 | Saved dishes, filter chips, search |
| 07 | **Log in / Sign up** | Account | Email, Google OAuth, guest continue |
| 08 | **Settings** | Account | Diet, allergies, notifications, units, language |

---

## 6. Interaction & Motion (Spec)

Mockups are static; the following motion grammar applies at build time.

- **Surprise Me.** Tap triggers a 600ms shuffle: cards cross-fade with a 12px upward translate, easing `cubic-bezier(0.22, 1, 0.36, 1)`.
- **Result expansion.** Tap on a result row expands inline (200ms height + opacity).
- **Chip add.** New ingredient chips fade + scale from 0.9 → 1 in 160ms.
- **Bottom nav.** Active icon stroke animates 1.8 → 2.5; label color tween 180ms.
- **Reduced motion.** Honor `prefers-reduced-motion`: replace translates/scales with opacity-only.

---

## 7. Accessibility

- Contrast: foreground/background ≥ 7:1; muted-foreground ≥ 4.5:1; clay on cream verified ≥ 4.5:1 for 14px+.
- Hit targets ≥ 44 × 44 px (nav items, chips with X).
- Every icon-only control has `aria-label` (VI + EN as appropriate).
- Bilingual content uses `lang` attributes on switched segments so screen readers pronounce diacritics correctly.

---

## 8. Internationalization

- Vietnamese is the default locale. All copy authored VI-first, then EN.
- Fraunces was selected partly for its high-quality Vietnamese diacritic shaping (stacked tone marks above ô, ă, ơ, ư).
- Layouts assume +20% string growth for EN — chips and CTA buttons never lock to a fixed width.

---

## 9. Implementation Map

| Concern | File |
|---|---|
| Theme tokens, fonts, body gradients | `src/styles.css` |
| Phone showcase wrapper | `src/components/PhoneFrame.tsx` |
| All eight screen compositions | `src/components/screens/screens.tsx` |
| Showcase grid + page chrome | `src/routes/index.tsx` |

**Rule.** No raw color literals in components. Add new tokens to `src/styles.css` and reference via Tailwind utility (`bg-clay`, `text-sage`, etc.).

---

## 10. Open Questions

1. Photography direction — commissioned stills vs. licensed library vs. AI-rendered?
2. Dark mode palette — defer to v0.2, or define alongside light now?
3. Map provider for Discover (UJ-2) — Mapbox vs. Google vs. OSM tile aesthetic?
4. Voice input model and language detection strategy for VI/EN mixed utterances.

---

*Generated from the v0.1 mockup baseline. Treat this document as the source of truth for visual tokens; update it alongside any change to `src/styles.css`.*
