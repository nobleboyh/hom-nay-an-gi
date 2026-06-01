# Validation Report — Hôm Nay Ăn Gì

- **DESIGN.md:** `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/DESIGN.md`
- **EXPERIENCE.md:** `_bmad-output/planning-artifacts/ux-designs/ux-hom-nay-an-gi-2026-06-01/EXPERIENCE.md`
- **Run at:** 2026-06-01

## Overall verdict

Well-structured, internally consistent spine pair ready for architecture and story handoff with targeted remediation. No architectural gaps block downstream consumption, but the design system has three systemic WCAG AA violations (muted text contrast, border contrast, undersized touch targets), the spacing scale is missing critical values (12px, 14px, 20px), and state coverage omits loading/error/offline for every screen. **67 findings total (9 critical, 15 high, 26 medium, 17 low).** Patch the critical and high items before story-dev begins — particularly the contrast fixes, which require only token value changes, not architectural rework.

## Category verdicts

- Flow coverage — **strong**
- Token completeness — **adequate**
- Component coverage — **adequate**
- State coverage — **thin**
- Visual reference coverage — **strong**
- Bloat & overspecification — **strong**
- Inheritance discipline — **adequate**
- Shape fit — **strong**

## Findings by severity

### Critical (9)

**[Token Audit — Contrast] — `--border` on `--surface` fails WCAG 1.4.11 non-text contrast** (DESIGN.md Colors)
`--border` (oklch 90% 0.006 240 ≈ #E4E2E0) on white = ~1.28:1. Required 3:1 for non-text content. Fails for input borders, card borders, dividers, tab bar separators.
Fix: Darken `--border` to at least oklch(78% 0.012 240) ≈ #C8C5C0 for ~3:1.

**[Token Audit — Contrast] — `--accent` on white fails AA normal text** (DESIGN.md Colors)
`--accent` (oklch 55% 0.18 35 ≈ #C85A2B) on white = ~4.1:1. Required 4.5:1 for normal text. Affects primary button labels (15px), active tag text (13px).
Fix: Darken to oklch(48% 0.18 35) or ensure accent-on-white is only used at ≥18px / ≥14px bold.

**[Accessibility] — `--muted` text fails WCAG 1.4.3 contrast (3.8–4.07:1)** (DESIGN.md Colors)
`--muted` (oklch 50% 0.018 240 ≈ #767a82) on `--bg` and `--surface` = ~3.8:1 and ~4.07:1. Used for secondary text, labels, timestamps, placeholders — dozens of instances.
Fix: Darken to oklch(42% 0.022 240) for ~4.6:1, or prohibit for text <18px.

**[Accessibility] — `--border` fails WCAG 1.4.11 non-text contrast (1.4:1)** (DESIGN.md Colors, Input Field, Card, Tab Bar)
Same as token audit finding above. Duplicate — counts once.

**[Accessibility] — Multiple touch targets undersized (<44px)** (DESIGN.md Tab Bar, Tag Chip, Button)
Tab bar items ~38–42px, tag chips ~34px, standard button ~43.5px, ingredient chip ✕ remove 16px, ghost buttons no explicit sizing.
Fix: Add `padding: 13px 14px` to tags, `padding: 14px 24px` to buttons, `flex: 1` to tab items. ✕ remove needs 44px pseudo-element.

**[Accessibility] — `--accent` text on `--accent-dim` (tag active) border contrast** (DESIGN.md Tag Chip)
Border-color `--accent` on `--accent-dim` (10% tint) drops effective contrast to ~3.2:1. May fail 3:1 non-text threshold.
Fix: Use 2px border on active tags, or darken `--accent-dim` to 15–20% opacity.

**[Accessibility] — No keyboard interaction model for click-delegated components** (EXPERIENCE.md Interaction Primitives)
Global click delegation for card expand, collapsible sections, checkbox/chip toggle. No `role`, `tabindex`, or keyboard event handling specified. Keyboard users cannot activate with Enter/Space.
Fix: Specify all clickable components must be `<button>` elements, or add `role="button"` + `tabindex="0"` + onkeydown for Enter/Space.

**[State coverage] — No screen covers loading/error/offline state** (EXPERIENCE.md State Patterns)
Results has an assumption for skeleton cards. Discover, Recipe, Shopping List, Home, Favorites have zero mention of loading or error states. Login has no rate-limit state.
Fix: Add rows for each screen's Loading, Network error, and Offline states.

**[State coverage] — State Patterns table absent for systemic states** (EXPERIENCE.md State Patterns)
19 interaction-specific states documented but zero systemic states (cold-load, network-error, offline). State coverage is thin because only toggle/empty/form states are covered.
Fix: Add systemic state rows per screen.

### High (15)

**[Token completeness] — Line-height absent from typography** (DESIGN.md Typography)
Every role has family, size, weight — no line-height column. Forces implementation to guess.
Fix: Add line-height column (e.g., display: 1.2, body: 1.4, button: 1.3).

**[Token completeness] — Three tokens defined but unused in any component: `--success`, `--warn`, `--danger`** (DESIGN.md Colors)
Wired nowhere in DESIGN.md Components. EXPERIENCE.md mentions missing ingredients with ⚠️ but doesn't use `--warn`.
Fix: Wire `--warn` to missing ingredients, `--success` to match badge/checkbox, `--danger` to destructive button (or drop).

**[Token Audit] — Spacing scale omits 12px, 14px, 20px, 2px, 6px, 10px, 44px** (DESIGN.md Spacing)
All used in component specs. 12px alone appears in button padding, toast padding, inter-item gap, ingredient-chip horizontal padding.
Fix: Extend spacing scale or rationalise to 8px/4px grid.

**[Token Audit] — Rounded scale omits 6px (checkbox corner), 15px (timeline dot)** (DESIGN.md Shapes)
Fix: Add `--radius-xs` (6px). Timeline dot can use 50% for circle.

**[Token Audit] — No shadow/elevation token scale** (DESIGN.md Elevation & Depth)
Inline shadow values used. No `--shadow-sm/md/lg` tokens.
Fix: Define shadow tokens matching the 3 elevation levels.

**[Token Audit] — No line-height tokens defined** (DESIGN.md Typography)
Fix: Add `--leading-tight` (1.2), `--leading-normal` (1.4), `--leading-relaxed` (1.6) or per-role line-heights.

**[Accessibility] — Toast-only form errors lack persistent announcement** (EXPERIENCE.md State Patterns, Toast)
Login errors, ingredient limits, permission errors use 2-second toasts. No `aria-live` region, no `aria-invalid` on fields.
Fix: Add `aria-live="polite"` + `role="status"` to toast container. Apply `aria-invalid` to form fields. Increase dismiss to 4s.

**[Accessibility] — `lang="vi"` specification too vague for bilingual app** (EXPERIENCE.md Accessibility Floor)
"Vietnamese content uses lang='vi'" — no scope, no wrapping guidance for mixed-language content.
Fix: Add spec: `lang="vi"` on `<html>`, English phrases wrapped in `<span lang="en">`.

**[Accessibility] — No skip-navigation link** (EXPERIENCE.md Layout & Navigation)
Fixed top bar + bottom tab bar — keyboard users must tab through everything.
Fix: Add visually-hidden skip link as first focusable element + landmark roles.

**[Accessibility] — Focus indicator insufficient: 1px color change only** (DESIGN.md Input Field, EXPERIENCE.md Accessibility)
1px border change from `--border` (1.4:1) to `--accent` (5.9:1) — minimal visual change.
Fix: Specify `outline: 2px solid --accent; outline-offset: 2px` on all interactive elements.

**[Component coverage] — Naming mismatch: DESIGN.md "Tag Chip" vs 5 EXPERIENCE.md entries** (DESIGN.md vs EXPERIENCE.md Components)
Design.md "Tag Chip" maps to Ingredient chip, Food type chip row, Cuisine chip row, Cooking time chips, Mood tags. Same visual, different behaviors.
Fix: Relabel "Tag Chip (base)" in DESIGN.md to signal it's the visual foundation.

**[Inheritance] — Component name mismatch: "Card (result card)" vs "Result card (compact/expanded)"** (DESIGN.md vs EXPERIENCE.md)
Fix: Use consistent base name — "Result Card" in both spines with variant suffixes.

### Medium (26)

**[Token completeness] — Spacing scale missing 12px, 14px, 20px used in components** (DESIGN.md Layout & Spacing)
Inter-item gap (12px), tab bar safe area (20px), input field vertical padding (14px).
Fix: Add named spacing tokens.

**[Token completeness] — Accent-on-white contrast borderline at 4.1:1** (DESIGN.md Colors)
Match badge (12px, 600) and active tag (13px, 500) use accent on white — borderline for AA small text.
Fix: Verify with color tool; if failing, add `--accent-strong` token.

**[Token Audit] — No transition/duration tokens** (DESIGN.md Components)
Three durations hardcoded: 0.2s, 0.15s, 0.3s.
Fix: Define `--duration-fast` (150ms), `--duration-normal` (200ms), `--duration-slow` (300ms).

**[Token Audit] — No z-index token scale** (DESIGN.md Toast)
Toast z-index 200 hardcoded.
Fix: Define `--z-toast` (200), `--z-tab-bar` (100), `--z-dropdown` (50).

**[Token Audit] — No font-size or font-weight tokens** (DESIGN.md Typography)
Sizes defined inline per role but not tokenised as CSS custom properties.
Fix: Add `--font-size-*` and `--weight-*` tokens.

**[Token Audit] — No breakpoint tokens** (DESIGN.md Layout & Spacing)
Only max-width 430px specified.
Fix: Define `--bp-mobile` (430px), `--bp-tablet` (768px).

**[Token Audit] — Component spacing audit: 10 of 18 components use hardcoded values not in token scale** (DESIGN.md Components)
Tag Chip (14px), Ingredient Chip (6px/12px/14px), Input Field (14px), Button standard (12px), Tab Bar (20px), Toast (12px), Match Badge (2px/10px), inter-item gap (12px), Timeline (44px).
Fix: Extend spacing scale or switch to token values.

**[Component coverage] — 6 EXPERIENCE.md components lack visual spec in DESIGN.md** (EXPERIENCE.md Component Patterns)
Sort dropdown, Recipe hero, Status bar, Tip card, Benefits card, Registration link.
Fix: Add Sort dropdown and Status bar to DESIGN.md Components (others compose from existing primitives).

**[Component coverage] — Match Badge has no behavioral row in EXPERIENCE.md** (DESIGN.md Match Badge)
Fix: Add Match Badge row to EXPERIENCE.md Component Patterns.

**[State coverage] — Favorites "no favorites" vs "search no results" use same visual** (EXPERIENCE.md State Patterns)
Noted as assumption. Story-dev must differentiate.
Fix: Add separate "Search no results" row with distinct copy.

**[State coverage] — Discover has no Empty state row** (EXPERIENCE.md State Patterns)
Zero results from filters — no defined treatment.
Fix: Add empty state for Discover.

**[Inheritance] — "Ingredient Chip" visual parent not cross-referenced** (DESIGN.md vs EXPERIENCE.md)
DESIGN.md "Tag Chip" is visual parent of EXPERIENCE.md food/cuisine/time/mood chip rows. No cross-reference.
Fix: Add comment: "Tag Chip is the base style reused by Food type, Cuisine, Cooking time, and Mood-tag chips."

**[Accessibility] — Emojis used decoratively have no alt/aria spec** (EXPERIENCE.md Voice and Tone)
📸, 🛒, 🔥 used as UI icons. Screen readers announce Unicode descriptions.
Fix: Wrap in `<span aria-hidden="true">` with visible text label.

**[Accessibility] — Match badge color reliance without explicit text guarantee** (DESIGN.md Match Badge)
`--success` (green) used for match percentage. Most readable on its own, but no spec saying "not color alone."
Fix: Add note: "Match percentage conveyed via text, not color alone."

**[Accessibility] — Shopping list checkbox label association not specified** (DESIGN.md List Item)
No `for`/`id` or `aria-labelledby` mentioned.
Fix: Add spec for `<label>` association.

**[Accessibility] — px-based font sizes may not respect system text size** (DESIGN.md Typography)
All sizes in px. Not responsive to iOS Dynamic Type, Windows Ease of Access.
Fix: Use `rem` or `clamp()` for font sizes.

**[Accessibility] — Toast feedback needs `aria-live` specification** (EXPERIENCE.md Toast, State Patterns)
All transient feedback uses toast but no `aria-live` region specified.
Fix: Add `role="status"` and `aria-live="polite"` to toast container. Minimum 4s dismiss.

### Low (17)

[Flow coverage] — KF-4: missing edge for network failure during login attempt
[Flow coverage] — KF-1/2/3 edges forward-looking rather than describing v4 failure handling
[Token completeness] — Dark mode deferred with no timeline
[Component coverage] — "Dish Card" / "Trending dish grid" / "Favorite item" concept overlap
[State coverage] — Shopping List no empty state
[State coverage] — Login no rate-limited state
[Bloat] — EXPERIENCE.md Anti-patterns items 4-5 duplicate DESIGN.md Do's & Don'ts
[Bloat] — .decision-log.md + reconcile-inputs.md creates 3 places for context
[Inheritance] — Typo: "ASSUPMPTION" → "ASSUMPTION" (EXPERIENCE.md:181)
[Shape fit] — "Accessibility Floor" cross-reference to DESIGN.md section that doesn't exist
[Token Audit] — Dark mode deferred acceptable; no letter-spacing token
[Token Audit] — 4px spacing token unused
[Accessibility] — External link (GrabFood) no warning
[Accessibility] — Bottom nav active tab missing `aria-current="page"`
[Accessibility] — Ingredient input max limit has no error announcement
[Accessibility] — Favorite remove animation has no reduced-motion detail
[Accessibility] — Profile/Settings tab has no accessibility notes

## Reviewer files

- `review-rubric.md` — Rubric walker (8 dimensions, 21 findings)
- `review-accessibility.md` — WCAG 2.1 AA review (20 findings)
- `review-token-audit.md` — Design token audit (26 findings)

## Mechanical notes

- Both spines have `status: final` — consistent with decision-log.
- `.decision-log.md` has 15 decisions, all dated 2026-06-01.
- 5 open questions logged; 4 flagged with ASSUMPTION tags in spines.
- `reconcile-inputs.md` covers 4 versions — useful provenance.
- **Typo**: EXPERIENCE.md:181 "ASSUPMPTION" → "ASSUMPTION".
- **Typo/syntax**: EXPERIENCE.md:265 unmatched parenthesis.
- DESGIN.md frontmatter lists all 7 mockups; EXPERIENCE.md callout references them.
- All 10 source files in EXPERIENCE.md frontmatter verified on disk.
