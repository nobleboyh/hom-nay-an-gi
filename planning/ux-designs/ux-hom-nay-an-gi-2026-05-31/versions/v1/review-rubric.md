# Spine Pair Review — Hôm Nay Ăn Gì

## Overall verdict

Solid first draft. Both spines are internally consistent, cross-reference each other cleanly, and map 1:1 to the PRD's user journeys. The main gaps are missing state coverage for a few surfaces (Discover loading, Recipe offline) and a missing Skeleton component spec in DESIGN.md. For an internal/team stakes project, this is ready for finalize after the low-severity fixes below.

## 1. Flow coverage — strong

All 3 PRD user journeys (UJ-1 → KF-1, UJ-2 → KF-2, UJ-3 → KF-3) have named-protagonist Key Flows with numbered steps, climax beats, and edge cases. No orphaned journeys.

### Findings
- None.

## 2. Token completeness — strong

All DESIGN.md frontmatter tokens are defined with hex values (light + dark pairs for every color). Typography uses platform-native semantic tokens (no custom fonts). `{DESIGN.md.colors.*-dark}` referenced in EXPERIENCE.md resolves correctly.

### Findings
- None.

## 3. Component coverage — adequate

Design.md.Components lists 7 components. EXPERIENCE.md.Component Patterns lists 15 behavioral rows.

### Findings
- **medium** Mismatched component count. DESIGN.md has: Tag Chip, Card (compact), Card (expanded), Surprise Me Button, Primary Button, Input Field, Bottom Tab Bar. EXPERIENCE.md adds: Ingredient input, Cooking time chip, Search button, Recipe timeline, Shopping list sheet, Trending feed, Distance filter, Price filter, Bookmark icon, Favorites list, Settings row — but these have visual specs only in the DESIGN.md prose (Colors table, Layout section) rather than as dedicated Components rows. *Fix:* Add a DESIGN.md Components entry for each behavioral component that has visual properties (e.g., Search button uses Primary Button spec; Recipe timeline needs a timeline visual spec).
- **low** Skeleton card (loading state) has no DESIGN.md component spec. *Fix:* Add Skeleton Card to Components — background `border-hairline`, rounded.md, shimmer animation direction.

## 4. State coverage — adequate

10 states covered across 9 state rows. Covers the core flows.

### Findings
- **low** Discover — no "loading" state for trending/nearby results. *Fix:* Add "Discover loading" row — skeleton cards matching the Discover feed layout.
- **low** Recipe — no "offline" state for when recipe content is uncached. *Fix:* Add "Recipe offline — no cached data" row.

## 5. Visual reference coverage — N/A

No mockups, wireframes, or imports exist yet. Spines stand alone.

### Findings
- None.

## 6. Bloat & overspecification — strong

No source restatement. Prose is lean — tables carry the weight. DESIGN.md carries appropriate editorial voice in Brand & Style. EXPERIENCE.md prose is functional.

### Findings
- None.

## 7. Inheritance discipline — strong

`DESIGN.md` frontmatter tokens referenced as `{DESIGN.md.*}` in EXPERIENCE.md. Component names consistent across both files. UJ names from PRD map to KF names in EXPERIENCE.md. No glossary drift detected.

### Findings
- None.

## 8. Shape fit — strong

DESIGN.md sections in canonical order. EXPERIENCE.md has all required defaults (Foundation, IA, Voice and Tone, Component Patterns, State Patterns, Interaction Primitives, Accessibility Floor, Key Flows). Inspiration & Anti-patterns earned its place (decision log records rejected concepts from brainstorming). Responsive omitted correctly (single form-factor mobile).

### Findings
- None.

## Mechanical notes

- `DESIGN.md` frontmatter: `status` field missing (add `status: draft`).
- PRD source path in EXPERIENCE.md frontmatter resolves correctly to `../../prds/...`.
- No orphaned or dangling component references.
