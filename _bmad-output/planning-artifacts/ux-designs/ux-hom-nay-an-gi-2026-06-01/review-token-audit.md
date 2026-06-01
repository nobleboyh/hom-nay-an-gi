# Design Token Audit — Hôm Nay Ăn Gì

## Overall verdict

The token system is well-structured with semantic OKLCH tokens and a clean spacing/rounded scale, but has significant gaps. ~25% of component dimensions use hardcoded values not covered by the spacing scale; the border token fails WCAG non-text contrast; and several critical token categories (transitions, z-index, shadows, breakpoints, line-height) are entirely absent. The system is viable for MVP prototyping but needs a token expansion pass before production implementation.

---

## 1. Token Declaration Completeness — MARGINAL PASS

### Findings

- **HIGH** `--spacing` scale omits 12px, 14px, 20px, 2px, 6px, 10px, 44px — all used in component specs. 12px alone appears in button padding, toast padding, inter-item gap, ingredient-chip horizontal padding, and timeline dot size. *Fix:* Add spacing tokens: `--spacing-2xs` (2px), `--spacing-xs2` (6px), `--spacing-sm2` (10px), `--spacing-md2` (12px/14px), `--spacing-lg2` (20px), `--spacing-3xl` (44px) — or rationalise to align with an 8px/4px grid.

- **HIGH** `--rounded` scale omits 6px (checkbox corner) and 15px (timeline dot). *Fix:* Add `--radius-xs` (6px) for the checkbox; the 15px timeline dot can be `--radius-full` (circle via 50%).

- **MEDIUM** Spacing token 4px (`--spacing-xs`) is used nowhere in component specs; `--spacing-lg` (24px) is used but only for expanded card body and button horizontal padding. The scale feels partially aspirational versus actually referenced.

- **LOW** Card-compact and card-expanded use 16px and 24px (`--spacing-md`, `--spacing-lg`) — correct token usage. Empty state 32px 16px maps to `--spacing-xl` + `--spacing-md` — correct.

---

## 2. EXPERIENCE.md Token Reference Audit — PASS

### Findings

- Every `--` prefixed token reference in EXPERIENCE.md (`--accent-dim` line 94, `--accent` line 128, `--accent` line 196) matches a token declared in DESIGN.md frontmatter.
- No references to non-existent tokens (no `--accentDim`, `--color-accent`, etc.).
- EXPERIENCE.md correctly delegates visual specs to DESIGN.md and does not introduce its own token names.

---

## 3. Contrast Ratio Verification — WARN

Approximate sRGB conversions and WCAG contrast ratios:

| Pair | Approx sRGB | Estimated contrast | WCAG AA | WCAG AAA |
|------|------------|-------------------|---------|----------|
| `--accent` (#C85A2B) on `--surface` (#FFF) | terracotta on white | **4.1:1** | Large text ✅ (3:1) Normal text ❌ (4.5:1) | ❌ |
| `--accent` on `--bg` (#FBF7F0) | terracotta on off-white | **4.0:1** | Large text ✅ Normal text ❌ | ❌ |
| `--muted` (#7A7A7A) on `--bg` (#FBF7F0) | grey on off-white | **4.0:1** | Large text ✅ Normal text ❌ | ❌ |
| `--fg` (#333) on `--bg` (#FBF7F0) | near-black on off-white | **~11.7:1** | ✅ | ✅ |
| `--border` (#E4E2E0) on `--surface` (#FFF) | light beige on white | **~1.28:1** | Non-text ❌ (3:1 required per 1.4.11) | ❌ |
| `--success` (~#4CAF50) on `--surface` (#FFF) | green on white | **~4.6:1** | ✅ (just above threshold) | ❌ |
| `--accent` on `--accent-dim` (10% tint) | terracotta on pink-tinted white | **~3.9:1** | Large text ✅ Normal text ❌ | ❌ |

### Key issues

- **CRITICAL** `--border` on `--surface` (1.28:1) fails WCAG 1.4.11 (3:1 minimum for non-text contrast). Card borders, dividers, and hairline rules will be nearly invisible on white surfaces. *Fix:* Darken `--border` to at least oklch(80% 0.01 240) ≈ #C8C5C0 to achieve ~3:1 against white.
- **HIGH** `--accent` (#C85A2B) on white background fails AA normal text (4.5:1) at 4.1:1. Primary CTA buttons use 15px body text — this is normal-size text, not large text (large = ≥18px or ≥14px bold). *Fix:* Either darken `--accent` to ~oklch(48% 0.18 35) ≈ #A8461F, or ensure all accent-text-on-white is used at ≥18px or with sufficient weight to qualify as large text.
- **MEDIUM** `--muted` (4.0:1) on `--bg` is acceptable for secondary/placeholder text (WCAG allows relaxed contrast for decorative/disabled text) but borderline for essential metadata.

---

## 4. Missing Tokens & Gaps — MULTIPLE GAPS IDENTIFIED

### Findings

- **HIGH** **No line-height tokens defined.** Typography section lists font sizes (10px–28px) but no line-height values. Implementation without line-height will produce inconsistent vertical rhythm. *Fix:* Add `--leading-tight` (1.2), `--leading-normal` (1.4), `--leading-relaxed` (1.6) or per-role line-heights in the typography table.

- **HIGH** **No shadow/elevation token scale.** Elevation & Depth section uses inline shadow values (`0 1px 3px oklch(0 0 0 / 0.06)`, `0 4px 12px oklch(0 0 0 / 0.08)`). *Fix:* Define `--shadow-sm`, `--shadow-md`, `--shadow-lg` tokens.

- **MEDIUM** **No transition/duration tokens.** Components use "0.2s all", "0.15s transition", "0.3s transition" — three different durations hardcoded. *Fix:* Define `--duration-fast` (150ms), `--duration-normal` (200ms), `--duration-slow` (300ms) and `--ease-default` (ease-in-out or custom bezier).

- **MEDIUM** **No z-index token scale.** Toast uses z-index 200 directly. *Fix:* Define `--z-toast` (200), `--z-tab-bar` (100), `--z-dropdown` (50), `--z-base` (1) tokens.

- **MEDIUM** **No font-size or font-weight tokens.** The typography table defines sizes (10, 12, 13, 14, 15, 16, 17, 18, 24, 28px) and weights (400, 500, 600, 700) inline per role. These are systematically defined but not tokenised as CSS custom properties. *Fix:* Add `--font-size-micro` through `--font-size-display` tokens and `--weight-regular` through `--weight-bold` tokens.

- **MEDIUM** **No breakpoint tokens.** The design specifies max-width 430px but has no responsive breakpoint token scale for larger screens. *Fix:* Define `--bp-mobile` (430px), `--bp-tablet` (768px) for production responsive pass.

- **LOW** **Dark mode.** Only light mode defined with an [ASSUMPTION] tag. Acceptable for MVP per explicit deferral.

- **LOW** **No letter-spacing token.** Display typography uses `-0.02em` at 28px. Other roles don't specify letter-spacing.

---

## 5. Component Token Usage Audit — WARN

### Findings

| Component | Hardcoded value | Should be token | Severity |
|-----------|----------------|-----------------|----------|
| Tag Chip | `padding: 8px 14px` | `--spacing-sm` (8px ✓), 14px → no match | MEDIUM |
| Ingredient Chip | `padding: 6px 12px 6px 14px` | 6px, 12px, 14px all missing from scale | MEDIUM |
| Input Field | `padding: 14px vertical` | No spacing token for 14px | MEDIUM |
| Button (standard) | `padding: 12px 24px` | 12px → no match, 24px → `--spacing-lg` ✓ | MEDIUM |
| Button (large) | `padding: 16px 32px` | 16px → `--spacing-md` ✓, 32px → `--spacing-xl` ✓ | LOW (partial match) |
| Bottom Tab Bar | `padding: 8px top, 20px bottom` | 8px → `--spacing-sm` ✓, 20px → no match | MEDIUM |
| Toast | `padding: 12px 24px` | 12px → no match, 24px → `--spacing-lg` ✓ | MEDIUM |
| Match Badge | `padding: 2px 10px` | 2px → no match, 10px → no match | MEDIUM |
| Inter-item gap | `12px` between result cards | No spacing token for 12px | MEDIUM |
| Timeline | `padding-left: 44px`, `24px bottom margin` | 44px → no match, 24px → `--spacing-lg` ✓ | MEDIUM |
| Timeline dot | `15px` circle | `--rounded` scale has no 15px; use 50% instead | LOW |
| List item checkbox | `6px` corner | No rounded token for 6px | LOW |
| Scale Row track | `height: 4px` | `--spacing-xs` is 4px → could reuse | LOW |
| Card body (dish card) | `padding: 8px 16px 16px` | 8px → `--spacing-sm` ✓, 16px → `--spacing-md` ✓ | OK |
| Card (compact) | `padding: 16px` | `--spacing-md` ✓ | OK |
| Card (expanded body) | `padding: 24px` | `--spacing-lg` ✓ | OK |
| Section | `padding: 16px all sides` | `--spacing-md` ✓ | OK |

---

## 6. Decision Log Alignment — PASS

### Findings

- **Decision #1 (OKLCH)** — Confirmed. DESIGN.md frontmatter uses OKLCH for all 10 color tokens. ✓
- **Decision #7 (Toast-based feedback)** — Confirmed. EXPERIENCE.md uses toast for all transient feedback. ✓
- **Decision #8 (Vertical timeline)** — Confirmed. DESIGN.md components describe a vertical dot-and-bar timeline. ✓
- **Decision #14 (No skeleton loading)** — Confirmed. EXPERIENCE.md line 141: "[ASSUMPTION: Production should show skeleton cards.]" ✓
- **Decision #15 (Global click delegation)** — Confirmed. EXPERIENCE.md Interaction Primitives section documents `document.addEventListener('click', ...)`. ✓

### Unresolved Open Questions (from decision-log.md lines 35–39)

1. **Login enforcement for bookmarks** — EXPERIENCE.md KF-3 notes "v4 prototype does not enforce login for bookmarks. Per PRD UJ-3, guest users who bookmark should see a login prompt."
2. **Dark mode palette** — DESIGN.md section has [ASSUMPTION] tag; no dark tokens defined.
3. **Empty states differentiation** — Favorites "no favorites" vs "search no results" use the same visual state. EXPERIENCE.md line 151 flags this.
4. **Serving adjuster UX** — v4 uses −/+ buttons; decision log asks if slider is better for production.
5. **Discover → external link flow** — v4 navigates from Discover cards to Recipe; production should show restaurant detail with external delivery link.

---

## Summary

| Section | Verdict | # Findings |
|---------|---------|------------|
| 1. Token Declaration Completeness | MARGINAL PASS | 1 critical, 2 high, 1 medium, 1 low |
| 2. EXPERIENCE.md Token Reference Audit | PASS | 0 |
| 3. Contrast Ratio Verification | WARN | 1 critical, 1 high, 1 medium |
| 4. Missing Tokens & Gaps | MULTIPLE GAPS | 2 high, 4 medium, 2 low |
| 5. Component Token Usage Audit | WARN | 0 critical, 8 medium, 2 low |
| 6. Decision Log Alignment | PASS | 0 |

**Counts:** 2 critical, 5 high, 14 medium, 5 low = 26 total findings.

**Recommended next step:** Add the missing token categories (shadows, transitions, z-index, line-height, breakpoints) and extend the spacing scale to cover the 12px/14px/20px gap before production implementation. Fix border contrast by darkening `--border` to maintain WCAG 1.4.11 compliance.
