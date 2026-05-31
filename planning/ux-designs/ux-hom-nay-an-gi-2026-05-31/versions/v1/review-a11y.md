# Accessibility Review — Hôm Nay Ăn Gì

## Overall verdict

Adequate baseline. EXPERIENCE.md Accessibility Floor covers the essentials (screen readers, dynamic type, Reduce Motion, tap targets, focus order, color independence). DESIGN.md color tokens need contrast verification on a few load-bearing combinations.

## Findings

### High
- **accent on surface-base** (`#D4562A` on `#FFF8F0`) — chili-orange on warm off-white: estimated ratio ~4.0:1. Borderline for WCAG AA normal text (needs 4.5:1). For emphasis (Surprise Me button, active tags) this is acceptable as UI component, but for text labels use `ink-primary`. *Fix:* Keep accent for interactive components only; confirm with a11y tooling in dev.

### Medium
- **ink-secondary on surface-base** (`#7A6A5A` on `#FFF8F0`) — estimated ratio ~4.3:1. Passes AA for large text (18pt+) but thin for small text. *Fix:* Ensure `ink-secondary` is used only for meta/labels (which use `meta` typography role = smaller text). Consider darkening to ~`#5C4F3E` for better readability.

### Low
- **positive (`#2E7D32`) on surface-base (`#FFF8F0`)** — green on warm off-white: estimated ratio ~4.0:1. Adequate for UI indicators (match %, calorie count) but not for body text. *Fix:* Restrict `positive` to UI indicators only.
- **Camera permission explainer** (EXPERIENCE.md §Accessibility) — correctly included. No change needed.
- **Color independence** — tag selected state uses filled background + bold text (not color alone). Correct.
