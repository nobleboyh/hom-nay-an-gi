# Accessibility Review — Hôm Nay Ăn Gì

## Overall verdict

**Does not meet WCAG 2.1 AA.** The design system has two systemic contrast failures (muted text, borders) and a pervasive undersizing of tap targets. The Accessibility Floor section in EXPERIENCE.md shows awareness of screen reader and reduced-motion concerns, but lacks concrete implementation specifications. Approximately 7 findings block AA compliance; production code will fail automated audits unless color tokens and touch-target sizing are revised before implementation.

## Findings by severity

### critical — `--muted` text fails WCAG 1.4.3 contrast (3.8–4.07:1)
- **Issue:** `--muted` (oklch 50% 0.018 240 ≈ #767a82) on both `--bg` (≈ #f4f5f7) and `--surface` (#fff) achieves ~3.8:1 and ~4.07:1 respectively, below the 4.5:1 required for normal-size text. This token is used for secondary text, labels, timestamps, placeholders, duration text, and card subtitles — dozens of instances across every screen.
- **Location:** DESIGN.md Colors — `--muted` token definition (line 65), Table of typography sizes (lines 86–96)
- **WCAG:** 1.4.3 Contrast (Minimum) — Level AA
- **Fix:** Darken `--muted` to at least oklch(42% 0.022 240) to achieve ~4.6:1 on white. Alternatively keep the visual token at oklch(50%) but prohibit its use for text smaller than 18px / 14px bold (large-text threshold). Update the DESIGN.md token table to require a contrast-validated companion token `--muted-on-bg` / `--muted-on-surface`.

### critical — `--border` fails WCAG 1.4.11 non-text contrast (1.4:1)
- **Issue:** `--border` (oklch 90% 0.006 240 ≈ #e0e2e6) on `--surface` (#fff) achieves ~1.4:1, well below the 3:1 minimum required for non-text content (input borders, card borders, dividers, tab bar separators). Users with low vision will struggle to perceive the boundary between cards and background.
- **Location:** DESIGN.md Colors — `--border` token (line 66), Components — Input Field (line 155), Card (line 164), Bottom Tab Bar (line 208)
- **WCAG:** 1.4.11 Non-text Contrast — Level AA
- **Fix:** Darken `--border` to at least oklch(78% 0.012 240) for 1px borders on white. For card borders specifically, consider replacing the 1px hairline with the existing `card-flat` shadow (0 1px 3px oklch(0 0 0 / 0.06)) which provides contrast through depth rather than color.

### critical — `--accent` text on `--accent-dim` (tag active) border contrast
- **Issue:** Active tag chips use border-color `--accent` on `--accent-dim` (10% opacity of accent). While the border has ~5.9:1 against `--surface`, against the tinted `--accent-dim` background the effective contrast drops to ~3.2:1, which may fail the 3:1 non-text threshold for the thin 1px border on the tinted field.
- **Location:** DESIGN.md — Tag Chip active state (line 142)
- **WCAG:** 1.4.11 Non-text Contrast — Level AA
- **Fix:** Use a 2px border on active tags, or darken `--accent-dim` to at least 15–20% opacity so the border has a 3:1 perceptual contrast gap from the chip fill.

### critical — Multiple touch targets undersized (WCAG 2.5.5 / 2.5.8)
- **Issue:** Three component types are undersized for 44×44pt minimum touch targets:
  1. **Tab bar items** — 24px icon + 2px gap + ~12px label ≈ 38–42px height. No explicit item padding or flex grow to distribute remaining 28px of bar padding into tap targets.
  2. **Tag chips** — 8px + 8px vertical padding + 13px font (≈18px line-height) = 34px. Fails 44px.
  3. **Standard button** — 12px + 12px vertical padding + 15px font (≈19.5px) = 43.5px. Borderline failure.
  4. **Ingredient chip remove (✕)** — Spec says "at least 16px with ample surrounding padding" but 16px is below even the WCAG 2.2 24px minimum (2.5.8). The actual clickable ✕ area is likely just the 16px glyph unless explicitly padded to ≥44px.
  5. **Ghost buttons (back ‹)** — No explicit sizing, inherits inline text height.
- **Location:** DESIGN.md — Tab bar (lines 207–214), Tag Chip (lines 140–146), Button (lines 188–193), Ingredient Chip (lines 149–152), EXPERIENCE.md Accessibility Floor (line 196)
- **WCAG:** 2.5.5 Target Size (44×44 Level AAA 2.1) / 2.5.8 Target Size Minimum (24×24 Level AA 2.2)
- **Fix:** Add explicit `padding: 10px 0` or `flex: 1` to tab items so distributed height ≥44px. Add `padding: 13px 14px` (was 8px) to tag chips for ≥44px height. Add `padding: 14px 24px` to standard button for ≥48px. The ✕ remove target should use `::after` pseudo-element with `min-width: 44px; min-height: 44px` centered on the 16px glyph.

### critical — No keyboard interaction model for click-delegated components
- **Issue:** EXPERIENCE.md specifies global click delegation (`document.addEventListener('click', ...)`) for all interactive patterns: card expand/collapse, collapsible sections, checkbox toggle, chip toggle. Keyboard users cannot activate these with Enter/Space unless the handler listens for keyboard events or uses native `<button>`/`<input>` elements. No `role`, `tabindex`, or keyboard event handling is specified. The tab bar uses `window.location.href = ...` on click, which bypasses client-side routing and loses focus management.
- **Location:** EXPERIENCE.md — Interaction Primitives (lines 172–179), Tab navigation (line 179)
- **WCAG:** 4.1.2 Name, Role, Value — Level AA; 2.1.1 Keyboard — Level AA
- **Fix:** Specify that all clickable components must be `<button>` elements (not `<div>`), or if using delegation, specify `role="button"` + `tabindex="0"` + `onkeydown` handling for Enter/Space. The tab navigation should use a client-side router that manages focus restoration.

### high — Toast-only form errors lack persistent announcement (WCAG 3.3.1)
- **Issue:** Login form errors, ingredient limit errors, and permission errors use transient toasts that auto-dismiss after 2 seconds. No `aria-live="polite"` region is specified for toast container. Screen reader users may miss the error entirely if the toast appears and disappears during page transition. No `aria-invalid` or `aria-describedby` is applied to form fields to associate error messages.
- **Location:** EXPERIENCE.md — State Patterns: Login form empty (line 155), Toast (line 131, 177), Accessibility Floor (lines 191–202)
- **WCAG:** 3.3.1 Error Identification — Level AA; 4.1.3 Status Messages — Level AA
- **Fix:** (1) Add `aria-live="polite"` and `role="status"` to the toast container. (2) For form validation errors, also apply `aria-invalid="true"` to the offending input and use `aria-describedby` to reference a persistent inline error message. (3) Increase toast auto-dismiss to 4–6 seconds, or wait for user interaction.

### high — `lang="vi"` specification is too vague for a bilingual app (WCAG 3.1.2)
- **Issue:** EXPERIENCE.md says "Vietnamese content uses lang='vi'" (line 195) without specifying scope. In a bilingual app where English and Vietnamese appear on the same page (e.g., button labels, toggle-state text), applying `lang="vi"` at the `<html>` level would cause English phrases to be mispronounced by screen readers. The spec gives no guidance on wrapping mixed-language content with `lang="en"` spans, nor does it define whether the app's root language is Vietnamese or English.
- **Location:** EXPERIENCE.md — Accessibility Floor (line 195), Voice and Tone table (lines 59–79, bilingual pairs)
- **WCAG:** 3.1.2 Language of Parts — Level AA
- **Fix:** Add explicit spec: `lang="vi"` on the `<html>` element. All English-only phrases (e.g., "Surprise Me!", "Shopping", "Copy") must be wrapped in `<span lang="en">`. Add a bullet to the Accessibility Floor section requiring a language-switching utility function that handles this wrapping.

### high — No skip-navigation link (WCAG 2.4.1)
- **Issue:** The design defines a fixed top bar and fixed bottom tab bar that sandwich scrollable content. There is no skip-to-content link. Keyboard users must tab through the entire tab bar and possibly the top bar before reaching main content on every screen.
- **Location:** EXPERIENCE.md — Layout & Navigation patterns (lines 100–108, 172–179)
- **WCAG:** 2.4.1 Bypass Blocks — Level AA
- **Fix:** Add `role="banner"` and `role="navigation"` landmarks. Include a visually-hidden skip link as the first focusable element: `Skip to content → #main-content`. Reference target as `main` or `id="main-content"` on screen content containers.

### high — Focus indicator insufficient: 1px color change only (WCAG 2.4.7)
- **Issue:** DESIGN.md specifies focus as `border-color: --accent` (line 156) for inputs — a 1px border change from `--border` (1.4:1 fail) to `--accent` (5.9:1 pass). A 1px color change is a minimal visual change that may not be visible to users with low vision or in bright light. The Focus Appearance criterion (2.4.13 AAA) recommends ≥2px change. No focus styles are specified for tag chips, buttons, icons, or cards.
- **Location:** DESIGN.md — Input Field focus state (line 156), EXPERIENCE.md — Accessibility Floor — Focus indicators (line 197)
- **WCAG:** 2.4.7 Focus Visible — Level AA
- **Fix:** Specify `outline: 2px solid --accent; outline-offset: 2px` on all interactive elements (inputs, buttons, chips, links, tab items). For inputs, also increase the border to 2px on focus. Add a focus ring to the card-component spec.

### medium — Emojis used decoratively have no alt/aria specification (WCAG 1.1.1)
- **Issue:** EXPERIENCE.md says "Use emoji sparingly and with purpose (📸 for image placeholders, 🛒 for shopping, 🔥 for trending)". Screen readers will announce these emoji by their Unicode description ("camera with flash", "shopping trolley", "fire"), which may be confusing or redundant. Emoji-as-icons should be `aria-hidden="true"` with a text label alongside. Emoji as literal meal companions (🍜) are fine.
- **Location:** EXPERIENCE.md — Tone principles (line 84)
- **WCAG:** 1.1.1 Non-text Content — Level AA
- **Fix:** Add spec: emoji used as UI icons must be wrapped in `<span aria-hidden="true">` with a visible text label or `aria-label` on the parent interactive element.

### medium — Match badge color reliance without explicit text guarantee (WCAG 1.4.1)
- **Issue:** The `--success` token (oklch 52% 0.12 145, green) is used for "Match percentage, checked items, positive indicators." While the match badge contains numeric text ("95%"), the success color is also the only indicator for "checked" vs "unchecked" in simulations. Shopping list checked state uses line-through + color change — fine. But no explicit spec says "match percentage must remain readable as a number regardless of color."
- **Location:** DESIGN.md — Colors table — `--success` (line 69), Match Badge (lines 172–175), Checked list item (lines 225–228)
- **WCAG:** 1.4.1 Use of Color — Level AA
- **Fix:** Add note to the match badge spec: "Match percentage is conveyed via text (not color alone). The `--success` color is decorative reinforcement."

### medium — Shopping list checkbox label association not specified (WCAG 1.3.1)
- **Issue:** Shopping list items have a checkbox (22×22px) and a text label. No `for`/`id` attribute linking or `aria-labelledby` is mentioned. Checkboxes without programmatic label association fail SC 1.3.1 (Info and Relationships) and 4.1.2 (Name, Role, Value).
- **Location:** DESIGN.md — List Item (lines 224–228)
- **WCAG:** 1.3.1 Info and Relationships — Level AA; 4.1.2 Name, Role, Value — Level AA
- **Fix:** Add spec: "Each checkbox input must have an associated `<label>` element via `for`/`id`, or the label must wrap the checkbox. Use `<input type="checkbox" id="item-1"> <label for="item-1">..."

### medium — px-based font sizes may not respect system text size (WCAG 1.4.4)
- **Issue:** All font sizes are specified in px (28, 24, 17, 16, 15, 14, 13, 12, 10). On browsers that support Zoom-only (Ctrl+), px works fine. However, users who rely on OS-level "larger text" settings (iOS Dynamic Type, Windows Ease of Access) — px values do NOT respond to these settings. The 10px micro and 12px meta sizes may become illegible for users who need larger base text.
- **Location:** DESIGN.md — Typography table (lines 86–96)
- **WCAG:** 1.4.4 Resize Text — Level AA
- **Fix:** Use `rem` or `clamp()` for font sizes: `clamp(12px, 0.75rem, 16px)` for meta, `clamp(10px, 0.625rem, 14px)` for micro. For body text, a base `font-size: 100%` (maps to 16px by default) with `rem` for all derived sizes ensures scaling with user preferences.

### medium — Toast feedback needs aria-live specification
- **Issue:** All transient feedback (save, copy, error, permission) uses toasts. The Accessibility Floor does not mention `aria-live` regions. Without `aria-live="polite"`, screen readers will not announce toast content when it appears dynamically.
- **Location:** EXPERIENCE.md — Toast (line 131, 177), all state pattern toasts (lines 155–165)
- **WCAG:** 4.1.3 Status Messages — Level AA
- **Fix:** Add to DESIGN.md toast spec: "Toast container has `role="status"` and `aria-live="polite"`. Auto-dismisses after 4 seconds minimum (not 2s)."

### low — External link (GrabFood) has no warning (WCAG 2.4.4, 3.2.5)
- **Issue:** EXPERIENCE.md mentions that in production, Discover dishes should link to GrabFood (external delivery partner). No warning or icon is specified for external links. Users may not realize they're leaving the app.
- **Location:** EXPERIENCE.md — KF-2 (line 238, 242), Inspiration — GrabFood (line 283)
- **WCAG:** 2.4.4 Link Purpose (In Context) — Level AA; 3.2.5 Change on Request — Level AA
- **Fix:** Add a note in the Discover section: "External restaurant links (GrabFood) must include `rel="noopener noreferrer"`, an external-link icon, and `aria-label="Mở GrabFood (liên kết ngoài)"`."

### low — Bottom nav active tab missing aria-current (WCAG 4.1.2)
- **Issue:** Active tab uses `--accent` color but no `aria-current="page"` is specified. Screen reader users have no programmatic way to identify which tab is active.
- **Location:** DESIGN.md — Bottom Tab Bar (lines 207–214), EXPERIENCE.md — Tab bar (line 128)
- **WCAG:** 4.1.2 Name, Role, Value — Level AA
- **Fix:** Add: "Active tab item has `aria-current="page"` in addition to `--accent` color."

### low — Ingredient input max limit has no error state or announcement
- **Issue:** EXPERIENCE.md says "Max 20 ingredients" (line 92) but the design doesn't specify what happens at the limit — does the input disable? Does a toast fire? Is there an aria announcement?
- **Location:** EXPERIENCE.md — Ingredient input (line 92)
- **WCAG:** 3.3.1 Error Identification — Level AA
- **Fix:** Add state: "At 20 ingredients, input field shows `aria-disabled="true"` state, a toast fires with `aria-live="polite"` reading 'Tối đa 20 nguyên liệu', and the input visually disables."

### low — Favorite remove animation has no reduced-motion detail
- **Issue:** EXPERIENCE.md Accessibility Floor says respect `prefers-reduced-motion` and replace scale/translate with opacity-only. But the specific favorite-remove animation (scale-down + fade-out 200ms) doesn't have an opacity-only fallback spec.
- **Location:** EXPERIENCE.md — Favorite remove (line 116), Accessibility Floor — Reduce Motion (line 199)
- **WCAG:** 2.3.3 Animation from Interactions — Level AAA
- **Fix:** Specify: "Under `prefers-reduced-motion: reduce`, the remove animation becomes `opacity: 1 → 0` over 100ms (no scale)."

### low — Profile/Settings tab has no accessibility notes
- **Issue:** The Cá nhân (Profile/Login) tab is a root-level screen but the accessibility floor doesn't address its interactive elements: guest mode toggle, benefits card, registration link. No login-required state announcements.
- **Location:** EXPERIENCE.md — KF-4 (lines 258–270), Login screen component patterns (lines 124–127)
- **WCAG:** 4.1.3 Status Messages — Level AA
- **Fix:** Add: "Login prompt (when guest attempts bookmark) should announce via `aria-live="polite"` that login is required, with focus moved to the login form."

