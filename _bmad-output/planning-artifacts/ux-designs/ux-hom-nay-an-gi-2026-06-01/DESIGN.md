---
name: Hôm Nay Ăn Gì
status: final
description: Mobile-first Vietnamese food discovery app. Warm, approachable, Vietnamese-first aesthetic with OKLCH-driven color system and display typography.
updated: 2026-06-01
mockups:
  home: mockups/01-home.html
  results: mockups/02-results.html
  recipe: mockups/03-recipe.html
  discover: mockups/04-discover.html
  favorites: mockups/05-favorites.html
  shopping-list: mockups/06-shopping-list.html
  login: mockups/07-login.html
colors:
  bg: oklch(98% 0.004 240)
  surface: oklch(100% 0 0)
  fg: oklch(20% 0.02 240)
  muted: oklch(50% 0.018 240)
  border: oklch(90% 0.006 240)
  accent: oklch(55% 0.18 35)
  accent-dim: oklch(55% 0.18 35 / 0.1)
  success: oklch(52% 0.12 145)
  warn: oklch(60% 0.14 85)
  danger: oklch(52% 0.16 30)
typography:
  display:
    family: 'Söhne', 'Avenir Next', -apple-system, system-ui, sans-serif
    usage: Screen titles, brand wordmark, large headings
  body:
    family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif
    usage: Body text, UI labels, buttons
  mono:
    family: ui-monospace, 'JetBrains Mono', monospace
    usage: Measurement values, timestamps
rounded:
  sm: 8px
  md: 12px
  lg: 18px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
---

## Brand & Style

Hôm Nay Ăn Gì is a warm, human, approachable food companion. The visual language takes inspiration from Vietnamese street-food culture — vibrant but not loud, warm but not hot, familiar but not generic. The accent color lands at a phở-red terracotta (`oklch(55% 0.18 35)`), used sparingly on interactive elements and the app icon. The overall canvas is a soft off-white (`oklch(98% 0.004 240)`) that lets food photography breathe. The feeling is "a food stall you trust," not a delivery utility.

The brand name is Vietnamese-first: "Hôm Nay Ăn Gì" (What to Eat Today). English support exists but typography and layout are tuned for Vietnamese diacritics. [ASSUMPTION: App icon uses a stylized bowl or chopstick motif in accent color; short-form logo TBD.]

## Colors

### Light mode (default)

All values in OKLCH for perceptual uniformity. Reference by semantic token, never raw values.

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `oklch(98% 0.004 240)` | Main app background — soft warm off-white |
| `--surface` | `oklch(100% 0 0)` | Cards, sheets, raised surfaces |
| `--fg` | `oklch(20% 0.02 240)` | Primary text, headings |
| `--muted` | `oklch(50% 0.018 240)` | Secondary text, labels, timestamps |
| `--border` | `oklch(90% 0.006 240)` | Card borders, dividers, hairline rules |
| `--accent` | `oklch(55% 0.18 35)` | Primary CTA, active tab, Surprise Me, links |
| `--accent-dim` | `oklch(55% 0.18 35 / 0.1)` | Tag chip backgrounds, subtle highlights |
| `--success` | `oklch(52% 0.12 145)` | Match percentage, checked items, positive indicators |
| `--warn` | `oklch(60% 0.14 85)` | Missing ingredient warnings, expiry alerts |
| `--danger` | `oklch(52% 0.16 30)` | Destructive actions, errors, delete |

### Dark mode

[ASSUMPTION: Dark mode palette follows the same OKLCH hue angles but lowered lightness. Full dark mode design deferred; light mode is default for MVP.]

## Typography

### Display — `--font-display`
Söhne (preferred) → Avenir Next → system-ui sans-serif. Used for the app wordmark, screen titles (home heading, discover heading, favorites heading), and large hero text. Weight 700, letter-spacing -0.02em at 28px.

### Body — `--font-body`
SF Pro Text (iOS) → system-ui sans-serif. Used for all body text, UI labels, buttons, ingredient names, card content, timeline labels. Weights: 400 (body), 500 (chips/labels), 600 (card titles, buttons).

| Role | Family | Size | Weight |
|------|--------|------|--------|
| App title (home) | Display | 28px | 700 |
| Screen title | Display | 24px | 700 |
| Section title | Body | 17px | 600 |
| Card title | Body | 16px | 600 |
| Card subtitle | Body | 14px | 400 |
| Button | Body | 15px | 600 |
| Chip label | Body | 13px | 500 |
| Meta / timestamps | Body | 12px | 400 |
| Badge | Body | 12px | 600 |
| Micro | Body | 10px | 500 |

## Layout & Spacing

- **App shell**: max-width 430px, centered, min-height 100vh
- **Screen content**: flex-1, overflow-y auto, 80px bottom padding for tab bar
- **Status bar**: 12px font, 12px top padding, 8px bottom padding
- **Top bar**: 8px padding vertical, 16px horizontal, bottom border 1px
- **Section**: 16px padding all sides
- **Tab bar**: fixed bottom, 8px top padding, 20px bottom padding (safe area), max-width 430px
- **Chip rows**: 8px gap, horizontal scroll, no scrollbar
- **Card padding**: 16px (compact), 24px (expanded body)
- **Inter-item gap**: 12px between result cards

## Elevation & Depth

- **Surface cards**: 1px border `--border`, no shadow (lightweight approach)
- **Card-flat**: subtle `0 1px 3px oklch(0 0 0 / 0.06)`
- **Screen hover**: `0 4px 12px oklch(0 0 0 / 0.08)` on screen-card
- **Tab bar**: 1px top border `--border`, white surface background
- **Toast**: fixed at bottom (100px from bottom), centered, dark background
- [ASSUMPTION: No custom elevation beyond these levels for MVP.]

## Shapes

| Element | Radius |
|---------|--------|
| Card | `--radius-md` (12px) |
| Button | `--radius-md` (12px) |
| Pill button (Surprise Me) | `--radius-lg` (18px) |
| Tag chip | `full` (9999px) |
| Input field | `--radius-md` (12px) |
| Ingredient chip | `full` (9999px) |
| Match badge | `full` (9999px) |
| List item checkbox | 6px |
| Dish card image | `--radius-sm` (8px) top, square or 4:3 |
| Toast | `--radius-md` (12px) |
| Empty state icon circle | 50% |
| Timeline dot | 50%, 15px |

## Components

*Behavioral specs in EXPERIENCE.md. This section owns visual appearance only.*

### Tag Chip
- Background: `--surface`, border 1px `--border`, text `--fg`
- Active: background `--accent-dim`, border-color `--accent`, text `--accent`
- Filled variant: background `--accent`, text white, no border
- Height: auto, padding 8px 14px, `--radius-full`
- Font: body, 13px, 500 weight
- Chips in a row scroll horizontally; scrollbar hidden

### Ingredient Chip
- Background: `--accent-dim`, text `--accent`
- Padding: 6px 12px 6px 14px, `--radius-full`
- Includes removable "✕" indicator at 16px, opacity 0.6 → 1 on hover
- Font: 13px, 500 weight

### Input Field
- Background: `--surface`, border 1px `--border`
- Focus: border-color `--accent`
- Corner: `--radius-md` (12px)
- Height: 14px padding vertical, 16px horizontal
- Font: 16px body
- Placeholder: `--muted` color
- Width: 100% (full-width within section)

### Card (result card)
- Background: `--surface`, border 1px `--border`
- Corner: `--radius-md` (12px)
- Cursor: pointer
- Transition: 0.2s all
- Header: flex row, space-between, 16px padding
- Body: 16px padding, hidden by default, shown on `.expanded`
- Expanded header: bottom border 1px `--border`

### Match Badge
- Background: `--accent-dim`, text `--accent`
- Padding: 2px 10px, `--radius-full`
- Font: 12px, 600 weight

### Dish Card (discover grid)
- Background: `--surface`, border 1px `--border`
- Corner: `--radius-md` (12px)
- Cursor: pointer
- Hover: translateY(-2px), 0.15s transition
- Image area: 4:3 aspect ratio, `--border` placeholder background
- Body padding: 8px 16px 16px
- Title: 14px, 600 weight
- Subtitle: 12px, `--muted`

### Primary Button
- Background: `--accent`, text white
- Corner: `--radius-md` (12px)
- Padding: 12px 24px (standard), 16px 32px (large)
- Font: 15px (standard), 17px (large), 600 weight
- Hover: `filter: brightness(1.1)`
- Full-width variant: `width: 100%`

### Secondary Button
- Background: `--surface`, text `--fg`, border 1px `--border`
- Corner: `--radius-md`
- Padding: 12px 24px
- Font: 15px, 600 weight
- Hover: border-color `--muted`

### Ghost Button
- Background: none, text `--muted`
- Hover: text `--fg`
- Used for back navigation, voice/camera icon triggers

### Bottom Tab Bar
- Background: `--surface`, top border 1px `--border`
- Width: 100%, max-width 430px, centered
- Padding: 8px top, 20px bottom (safe area)
- Items: flex column, center, gap 2px
- Active item: color `--accent`
- Inactive item: color `--muted`
- Icon: 24x24px SVG

### Timeline
- Position: relative, 16px padding vertical
- Bar: absolute, left 16px, width 3px, `--border`, `--radius-sm`
- Dot: absolute, left 10px, top 4px, 15px circle, `--accent` fill, 3px `--bg` border
- Item: padding-left 44px, 24px bottom margin
- Label: 14px, 600 weight
- Duration: 12px, `--muted`

### List Item (shopping list)
- Display: flex, center, gap 16px, 8px vertical padding, `--border` bottom border
- Checkbox: 22x22px, 2px `--border`, 6px corner
- Checked: background `--accent`, border `--accent`, label line-through, `--muted`
- Label: font body, 16px

### Empty State
- Flex: column, center, padding 32px 16px
- Icon container: 64px circle, `--border` background, 28px emoji/icon
- Title: 17px, 600 weight
- Description: 14px, `--muted`, max-width 280px

### Scale Row (serving adjuster)
- Flex: row, center, gap 16px
- Label: 14px, `--muted`, min-width 60px
- Value: 18px, 600 weight, min-width 24px, text-align center
- Track: flex 1, height 4px, `--border`, `--radius-sm`
- Thumb: 20px circle, `--accent`, cursor pointer, centered on track

### Toast
- Fixed position, bottom 100px, centered horizontally (translateX -50%)
- Background: `--fg`, text `--surface`
- Padding: 12px 24px, `--radius-md`
- Font: 14px
- Z-index: 200
- Opacity: 0 → 1 on `.show` (0.3s transition)
- Pointer-events: none

## Do's and Don'ts

| Do | Don't |
|----|-------|
| Let food imagery be the hero | Overlay text on busy food photos |
| Use accent sparingly — phở-red is the seasoning, not the meal | Color every interactive element accent |
| Keep cards clean and generous with whitespace | Crowd cards with badges, labels, and metadata |
| Vietnamese-first: let diacritics display with proper spacing | Force English at the expense of natural Vietnamese UX |
| Use system fonts for body for readability | Mix more than 2 type families |
| OKLCH for all new color tokens | Raw hex values in component code |
| Maintain warm neutrals throughout | Introduce cool greys or blue-greys |
| Toast for transient feedback | Modal dialogs for confirmations that should be lightweight |
