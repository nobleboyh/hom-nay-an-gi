---
name: Hôm Nay Ăn Gì
status: final
description: Cross-platform mobile food suggestion app. Warm Vietnamese food-market aesthetic with platform-native conventions.
colors:
  surface-base: '#FFF8F0'
  surface-raised: '#FFFFFF'
  ink-primary: '#2D1F14'
  ink-secondary: '#7A6A5A'
  ink-disabled: '#B5A99E'
  accent: '#D4562A'
  accent-soft: '#FDF0E9'
  positive: '#2E7D32'
  warning: '#F9A825'
  border-hairline: '#E8DED5'
  surface-base-dark: '#1A1410'
  surface-raised-dark: '#2B221C'
  ink-primary-dark: '#F0EAE4'
  ink-secondary-dark: '#A09182'
  ink-disabled-dark: '#5E5248'
  accent-dark: '#F07A4A'
  accent-soft-dark: '#3D2A1E'
  positive-dark: '#66BB6A'
  warning-dark: '#FFCA28'
  border-hairline-dark: '#3D3229'
typography:
  title:
    note: 'Platform native — iOS Title 1 · Android Headline Small'
  body:
    note: 'Platform native — iOS Body · Android Body Large'
  label:
    note: 'Platform native — iOS Subheadline · Android Label Medium'
  meta:
    note: 'Platform native — iOS Footnote · Android Body Small'
  badge:
    note: 'Platform native — iOS Caption 2 · Android Label Small'
rounded:
  sm: 8px
  md: 16px
  lg: 24px
  full: 9999px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 24px
  '6': 32px
  '7': 48px
---

## Brand & Style

Hôm Nay Ăn Gì takes visual cues from a lively Vietnamese food market: warm terracotta and ochre tones, natural textures, generous whitespace that lets food photography breathe. The accent color (`#D4562A` — a warm chili-orange) appears sparingly — on interactive elements and the app icon — while the overall UI stays neutral and clean. The feeling should be "a food stall you trust," not "a delivery app." [ASSUMPTION: Brand name and logo are TBD. This spine uses the full name. Short form may replace once decided.]

## Colors

### Light mode

| Token | Value | Usage |
|-------|-------|-------|
| `surface-base` | `#FFF8F0` | Main background — warm off-white |
| `surface-raised` | `#FFFFFF` | Cards, sheets, modals |
| `ink-primary` | `#2D1F14` | Headings, body text |
| `ink-secondary` | `#7A6A5A` | Labels, descriptions, timestamps |
| `ink-disabled` | `#B5A99E` | Disabled states |
| `accent` | `#D4562A` | Primary actions, active tab, Surprise Me button |
| `accent-soft` | `#FDF0E9` | Tag chip backgrounds, subtle highlights |
| `positive` | `#2E7D32` | Match percentage, calorie targets |
| `warning` | `#F9A825` | Expiry alerts, missing ingredient warnings |
| `border-hairline` | `#E8DED5` | Card borders, dividers |

### Dark mode

| Token | Value | Usage |
|-------|-------|-------|
| `surface-base-dark` | `#1A1410` | Main background |
| `surface-raised-dark` | `#2B221C` | Cards, sheets, modals |
| `ink-primary-dark` | `#F0EAE4` | Headings, body text |
| `ink-secondary-dark` | `#A09182` | Labels, descriptions |
| `ink-disabled-dark` | `#5E5248` | Disabled states |
| `accent-dark` | `#F07A4A` | Primary actions, active tab |
| `accent-soft-dark` | `#3D2A1E` | Tag chip backgrounds |
| `positive-dark` | `#66BB6A` | Match percentage |
| `warning-dark` | `#FFCA28` | Expiry alerts |
| `border-hairline-dark` | `#3D3229` | Card borders, dividers |

## Typography

Platform-native throughout. No custom fonts — system dynamic type on both platforms.

| Role | iOS | Android |
|------|-----|---------|
| Title | Title 1 (SF Pro) | Headline Small (Roboto/Google Sans) |
| Body | Body (SF Pro) | Body Large |
| Label | Subheadline | Label Medium |
| Meta | Footnote | Body Small |
| Badge | Caption 2 | Label Small |

## Layout & Spacing

- Content max-width: 640pt (iPad) / edge-to-edge on phone.
- Horizontal padding: `spacing.4` (16px) at screen edges.
- Card padding: `spacing.4` (16px) compact, `spacing.5` (24px) expanded.
- Inter-card gap: `spacing.3` (12px).
- Section spacing: `spacing.6` (32px).
- Tab bar height: platform-native (iOS ~83pt, Android ~56dp).

## Elevation & Depth

- Surface-raised cards: subtle shadow (iOS shadow opacity 6%, y-offset 2pt; Android elevation 2dp).
- Bottom sheet (Shopping List): platform-native sheet with grabber.
- Modals: platform-native (iOS modal, Android dialog).
- [ASSUMPTION: No custom elevation beyond platform defaults for MVP.]

## Shapes

- Cards: `rounded.md` (16px).
- Buttons: `rounded.full` (pill-shaped).
- Tag chips: `rounded.full`.
- Input fields: `rounded.sm` (8px).
- Bottom sheet: platform-native rounded top corners.
- App icon: custom mark (e.g., chili pepper or bowl silhouette) with `rounded.lg` corners on iOS.

## Components

*Behavioral specs in EXPERIENCE.md. This section owns visual appearance only.*

### Tag Chip
- Background: `accent-soft` (light) / `accent-soft-dark` (dark)
- Text: `ink-primary`
- Selected state: background `accent`, text white
- Height: 32pt, horizontal padding 12pt, `rounded.full`

### Card (compact)
- Background: `surface-raised`
- Border: `border-hairline`, 1px
- Corner: `rounded.md`
- Shadow: platform-elevation level 1
- Padding: `spacing.4`

### Card (expanded)
- Same as compact + image header (16:9 ratio crop, or full-width food photo)
- Padding: `spacing.5`

### Surprise Me Button
- Background: `accent`, full-bleed pill
- Text: white, `title` weight bold
- Min height: 56pt
- Icon: dice or sparkle, left-aligned

### Primary Button
- Background: `accent`
- Text: white
- Corner: `rounded.full`
- Height: 48pt

### Recipe Timeline
- Background: `surface-raised`
- Time axis: thin line in `border-hairline`, 2px
- Task bars: `accent-soft` fill, `ink-primary` text
- Parallel tasks: stacked vertically, same time column
- Total cook time: `title` typography, `accent` color
- Bar height: 20pt, rounded.sm

### Bookmark Icon
- Size: 24x24pt (icon only, no background container)
- Unselected: outline stroke, `ink-disabled`
- Selected: filled, `accent`
- Animation: instant fill on tap (no scale/bounce)
- Hit target: minimum 44x44pt (invisible padding)

### Filter Bar (Segmented Control)
- Background: `surface-raised`
- Border: `border-hairline`, 1px, `rounded.full`
- Active segment: background `accent`, text white
- Inactive segment: no background, text `ink-secondary`
- Height: 36pt
- Multi-select segments: all active segments share `accent` background

### Input Field
- Background: `surface-raised`
- Border: `border-hairline`, 1px
- Corner: `rounded.sm`
- Height: 44pt (iOS) / 48dp (Android)
- Focus: ring `accent`, 2px

### Bottom Tab Bar
- Platform-native (iOS tab bar, Android bottom navigation)
- Active: `accent`
- Inactive: `ink-disabled`

## Do's and Don'ts

| Do | Don't |
|----|-------|
| Let food photography be the hero | Overlay text on busy food images |
| Use accent sparingly — chili-orange is the seasoning, not the meal | Make every element accent-colored |
| Keep cards clean and generous with whitespace | Crowd the card with too many badges and labels |
| Platform-native navigation gestures | Custom gesture re-inventions (e.g., swipe-to-go-back on iOS) |
| Warm, appetizing neutrals | Cold greys (blue-grey, cool grey) |
