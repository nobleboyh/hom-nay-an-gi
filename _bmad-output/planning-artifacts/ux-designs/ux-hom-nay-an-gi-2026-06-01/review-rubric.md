# Spine Pair Review — Hôm Nay Ăn Gì

## Overall verdict

This is a well-structured, internally consistent UX spine pair ready for architecture and story handoff with targeted remediation. Both files are lean, opinionated, and follow bmad conventions. No critical gaps block downstream consumption, but three high-severity items (line-height omission, missing loading/error/offline state coverage, and 3 defined-but-unused color tokens with no wired behavior) should be patched before story-dev begins.

## 1. Flow coverage — strong

4 KFs verified (KF-1 through KF-4), each mapping to a named UJ from the PRD or an account-creation flow. Every flow has a named protagonist, numbered steps, a clear climax beat, and resolution. Edges are called out explicitly after each flow rather than woven into steps — acceptable pattern; each flow has 2 edges documented.

### Findings
- **low** KF-4 (Registration): Edges cover empty-form validation and password masking, but missing edge for network failure during login attempt. *Fix:* Add a third edge noting current toast-based error and production requirement for retry/offline messaging.
- **low** KF-1, KF-2, KF-3: All edges are forward-looking ("in production should") rather than describing v4 prototype failure handling. Acceptable for a prototype-grounded spine but downstream stories must implement the production behaviors.

## 2. Token completeness — adequate

10 OKLCH color tokens defined in frontmatter; all 10 present in the Colors table with usage descriptions. Typography table has family, size, and weight for 10 roles.

### Findings
- **high** Line-height is absent from every typography role row. This forces downstream implementation to guess or hardcode. *Fix:* Add a `Line-height` column (e.g., `1.2` for display, `1.4` for body, `1.3` for button/chip).
- **high** Three tokens defined but unused in any component spec: `--success`, `--warn`, `--danger`. They appear in the Colors table (match %, warnings, destructive) but no DESIGN.md component wires them. EXPERIENCE.md mentions "missing ingredients in accent color with ⚠️" but does not reference `--warn`. *Fix:* Wire `--warn` to missing-ingredient styling in DESIGN.md Components; wire `--success` to Match Badge background or checkbox checked; wire `--danger` to destructive buttons (currently no destructive button exists — either add one or drop the token).
- **medium** Spacing scale (`xs` 4, `sm` 8, `md` 16, `lg` 24, `xl` 32) is missing 3 values used in Layout & Spacing: `12px` (inter-item gap between result cards, ingredient chip padding horizontal), `20px` (tab bar safe-area bottom padding), and `44px` (timeline item padding-left). *Fix:* Add `2xs: 2px` (none needed) or add `gap: 12px` as a named spacing token. If these remain raw values, downstream devs will hardcode magic numbers.
- **medium** Contrast: accent (`oklch(55% 0.18 35)`) on white/surface is used for Match Badge text (12px, 600 weight) and Tag Chip active text (13px, 500 weight). At these sizes under WCAG AA, small text requires 4.5:1. The actual sRGB luminance requires verification — if below threshold, increase accent lightness or add a `--accent-text` token at higher lightness. *Fix:* Verify with a color-contrast tool; if failing, add a darker `--accent-strong` token or note in Do's & Don'ts to use accent only at ≥14px bold.
- **low** Dark mode: Explicitly deferred per assumption. Acceptable for MVP, but no timeline or trigger for when dark mode will be addressed. *Fix:* Add a target (e.g., "post-MVP v1.1" or "when requested").

## 3. Component coverage — adequate

DESIGN.md lists 15 visual components. EXPERIENCE.md lists 40 behavioral component rows. The 3:1 ratio is expected — EXPERIENCE.md decomposes into finer behavioral atoms (e.g., "Search button", "Surprise Me button", "Save list button" are all Primary Button visually).

### Findings
- **high** Naming mismatch across spines: DESIGN.md "Tag Chip" matches 5 different EXPERIENCE.md entries ("Ingredient chip", "Food type chip row", "Cuisine chip row", "Cooking time chips", "Mood tags") that share identical visual spec but differ behaviorally. This is structurally correct (one visual atom, many behaviors) but the names diverge. *Fix:* In DESIGN.md, relabel "Tag Chip" → "Tag Chip (base)" to signal it is the visual foundation reused by multiple behavioral components.
- **medium** 6 EXPERIENCE.md components lack any visual spec in DESIGN.md: `Sort dropdown`, `Recipe hero`, `Status bar`, `Tip card`, `Benefits card`, `Registration link`. Some are trivially composed of existing primitives (Registration link = text link, Recipe hero = image + heading layout), but Sort dropdown and Status bar are genuinely missing. *Fix:* Add Sort dropdown (select element styling) and Status bar (small fixed bar with monospace time + icons) to DESIGN.md Components.
- **medium** DESIGN.md "Match Badge" has no behavioral row in EXPERIENCE.md. It is mentioned implicitly in Result card behavioral rules but lacks a dedicated row. *Fix:* Add a Match Badge row to EXPERIENCE.md Component Patterns.
- **low** "Dish Card" (DESIGN.md) maps to EXPERIENCE.md "Trending dish grid" and "Favorite item" concept overlap but no single behavioral row covers it cleanly.

## 4. State coverage — thin

The State Patterns table covers 19 interaction-specific states across 7 screens with reasonable depth for toggles, empty, and form states. However, systemic states (loading, error, offline) are almost entirely missing.

### Findings
- **high** No screen covers a cold-load/loading/network-error or offline state. Results has an assumption note that production should add skeleton cards — no other screen even has the assumption. Discover, Recipe, and Shopping List have zero mention of loading or error states. *Fix:* Add rows for each screen's `Loading` (skeleton or spinner), `Network error` (retry prompt), and `Offline` (cached content fallback) states to the State Patterns table.
- **medium** Favorites has a documented overlap: "Favorites empty" and "Favorites search results empty" use the same visual (noted as assumption). Story-dev must differentiate these. *Fix:* Add a separate "Search no results" row with distinct copy ("Không tìm thấy món nào").
- **medium** Discover has no Empty state row. If filters yield zero results or no nearby dishes, there is no defined treatment. *Fix:* Add an empty state for Discover (zero results across all filters).
- **low** Shopping List has no empty state (list with zero items, e.g., from a recipe with no ingredients). *Fix:* Add row.
- **low** Login has no "rate-limited" or "too many attempts" state. *Fix:* Add row.

## 5. Visual reference coverage — strong

All 7 mockup HTML files exist (01 through 07). The frontmatter in DESIGN.md lists all 7 by name. EXPERIENCE.md references them in the yellow callout. The spines-win-on-conflict declaration is explicit ("Spine tables win on any conflict with mockups"). Every IA screen has a corresponding mockup.

### Findings
- None.

## 6. Bloat & overspecification — strong

Both files are lean. DESIGN.md Brand & Style carries acceptable editorial voice (3 paragraphs) that establishes brand feel. No section is gratuitous. The Do's & Don'ts table is compact. EXPERIENCE.md uses tables and brief prose throughout. Anti-patterns section is justifiable as a design-constraint record.

### Findings
- **low** EXPERIENCE.md "Inspiration & Anti-patterns": Anti-pattern items 4 (cold greys) and 5 (modal dialogs) duplicate rules already stated in DESIGN.md Do's & Don'ts. The anti-patterns section would be stronger if it focused solely on UX/interaction patterns (swipe, gamification, social feeds) and removed color/modal redundancies. *Fix:* Drop items 4–5; keep 1–3.
- **low** .decision-log.md is thorough (15 decisions) but notes "Validation skipped per user request" — the reconcile-inputs.md and decision-log are sufficient as supplements but together they create 3 places where downstream readers must look for context. Acceptable for a v4 handoff.

## 7. Inheritance discipline — adequate

Sources frontmatter (10 files) all resolve to existing files. UJ references (UJ-1, UJ-2, UJ-3) appear verbatim in KF headers. Token names (`--accent`, `--accent-dim`, `--surface`, `--border`, `--fg`, `--muted`) are consistent across both files.

### Findings
- **medium** Component name mismatch: DESGIN.md "Card (result card)" vs EXPERIENCE.md "Result card (compact)" / "Result card (expanded)". Both are valid but downstream devs will need to reconcile that these are one visual atom with two behavioral modes. *Fix:* Use consistent base name — e.g., "Result Card" in both spines with variant suffixes.
- **medium** "Ingredient Chip" in DESIGN.md and EXPERIENCE.md is identical; but DESIGN.md's general "Tag Chip" is the visual parent of EXPERIENCE.md's "Food type chip row / Cuisine chip row / Cooking time chips / Mood tags". No cross-reference note exists. *Fix:* Add a comment in DESIGN.md Components: "Tag Chip is the base style reused by Food type, Cuisine, Cooking time, and Mood-tag chips (see EXPERIENCE.md for behavioral differences)."
- **low** Typo: EXPERIENCE.md line 181 "ASSUPMPTION" → "ASSUMPTION".

## 8. Shape fit — strong

DESIGN.md sections in canonical order (Brand & Style → Colors → Typography → Layout & Spacing → Elevation & Depth → Shapes → Components → Do's & Don'ts). EXPERIENCE.md has all required defaults (Foundation, IA, Voice and Tone, Component Patterns, State Patterns, Interaction Primitives, Accessibility Floor, Key Flows) plus both optional sections (Responsive & Platform, Inspiration & Anti-patterns). No invented sections.

### Findings
- **low** "Accessibility Floor" in EXPERIENCE.md has a note "Behavioral. Visual contrast in `DESIGN.md`." — but DESIGN.md does not have an accessibility section. The cross-reference resolves implicitly (contrast is an emergent property of color tokens) but the note suggests a section that doesn't exist. *Fix:* Either add an "Accessibility" subsection under Colors in DESIGN.md with explicit contrast ratio commitments, or remove the cross-reference text.

## Mechanical notes

- All 10 source files listed in EXPERIENCE.md frontmatter verified as existing on disk.
- Both spines have `status: final` — consistent with decision-log finalization entry.
- `.decision-log.md` has 15 decisions, all dated 2026-06-01.
- 5 open questions logged in decision-log; 4 are flagged with ASSUMPTION tags in spines.
- `reconcile-inputs.md` covers 4 versions (v1, v2, v3, v4) — useful provenance.
- **Typo**: EXPERIENCE.md:181 "ASSUPMPTION" → "ASSUMPTION".
- **Typo/syntax**: EXPERIENCE.md line 265: "in production) sees login prompt" — unmatched paren; should be "→ (in production, sees login prompt)" or similar.
- DESIGN.md has no `dark` color tokens in frontmatter — consistent with deferral decision but the Deisgn.md Colors section could note it more prominently.

## Summary

| Section | Verdict | Findings |
|---------|---------|----------|
| 1. Flow coverage | strong | 2 low |
| 2. Token completeness | adequate | 3 high, 2 medium, 1 low |
| 3. Component coverage | adequate | 1 high, 3 medium, 1 low |
| 4. State coverage | thin | 2 high, 2 medium, 2 low |
| 5. Visual reference coverage | strong | 0 |
| 6. Bloat & overspecification | strong | 2 low |
| 7. Inheritance discipline | adequate | 2 medium, 1 low |
| 8. Shape fit | strong | 1 low |

**Severity totals:** 6 high, 7 medium, 8 low. 2 mechanical typos.
