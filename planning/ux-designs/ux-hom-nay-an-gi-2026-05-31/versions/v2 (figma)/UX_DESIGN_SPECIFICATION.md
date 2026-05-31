# Hôm Nay Ăn Gì - UX Design Specification

## Overview

**Project Name:** Hôm Nay Ăn Gì (What to Eat Today)  
**Platform:** Mobile-first web application  
**Languages:** Vietnamese & English (bilingual)  
**Version:** 1.0.0 (MVP)  
**Created:** May 31, 2026

This document outlines the complete UX design for the Hôm Nay Ăn Gì mobile app - a meal discovery platform that helps users decide what to eat based on available ingredients or random discovery.

---

## Design System

### Color Palette

The design uses a warm, food-focused color scheme inspired by Vietnamese culinary aesthetics:

#### Primary Colors
- **Background:** `#FFF8F0` - Warm cream (main background)
- **Foreground:** `#2D1810` - Deep brown (primary text)
- **Primary:** `#D97036` - Warm orange (main accent, CTAs)
- **Secondary:** `#8B6F47` - Earthy brown (secondary actions)
- **Accent:** `#E8A87C` - Light terracotta (highlights)

#### Functional Colors
- **Card:** `#FFFFFF` - White (card backgrounds)
- **Muted:** `#F5E6D3` - Light beige (muted backgrounds)
- **Muted Foreground:** `#7D6B5A` - Medium brown (secondary text)
- **Destructive:** `#C94A3A` - Warm red (delete, errors)
- **Border:** `rgba(141, 111, 71, 0.15)` - Semi-transparent brown

#### Input Colors
- **Input Background:** `#FFFBF5` - Very light cream
- **Switch Background:** `#D4C4B0` - Tan

### Typography

- **Base Font Size:** 16px
- **Font Weights:**
  - Normal: 400
  - Medium: 500
- **Hierarchy:**
  - H1: 28px (screen titles)
  - H2: 24px (section headers)
  - H3: 18px (card titles)
  - H4: 16px (subsections)
  - Body: 16px
  - Small: 14px
  - Extra Small: 12px

### Spacing & Layout

- **Border Radius:** 12px (0.75rem)
- **Card Radius:** 16px (rounded-2xl)
- **Button Radius:** 12px (rounded-xl)
- **Tag Radius:** 999px (rounded-full)
- **Max Width:** 448px (max-w-md) - optimized for mobile
- **Padding:** 24px (px-6) for screen edges

### Iconography

- **Icon Library:** Lucide React
- **Icon Sizes:**
  - Small: 16px (w-4 h-4)
  - Medium: 20px (w-5 h-5)
  - Large: 24px (w-6 h-6)

---

## Screen Designs

### 1. Home Screen

**Purpose:** Main entry point and navigation hub

#### Layout Structure
```
┌─────────────────────────┐
│ Header                  │
│ - Title (bilingual)     │
│ - Settings icon         │
├─────────────────────────┤
│ Main Content            │
│                         │
│ ┌─────────────────────┐ │
│ │ Surprise Me!        │ │
│ │ (Hero CTA)          │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ Ingredient Search   │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ Discover            │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ Today's Stats       │ │
│ └─────────────────────┘ │
├─────────────────────────┤
│ Bottom Navigation       │
│ Home | Discover | ♥    │
└─────────────────────────┘
```

#### Key Features
- **Bilingual Title:** "Hôm Nay Ăn Gì" with English subtitle "What to Eat Today"
- **Hero CTA:** Large gradient button "Surprise Me!" for instant random dish
- **Navigation Cards:** Icon-based cards for Ingredient Search and Discover
- **Quick Stats:** Display trending dish count (127) and nearby restaurants (45)
- **Bottom Nav:** Persistent navigation bar with Home, Discover, Favorites

#### Visual Hierarchy
1. Surprise Me button (largest, gradient, centered)
2. Navigation cards (equal size, icon + text)
3. Stats (subtle, informational)

---

### 2. Ingredient Input Screen

**Purpose:** Capture user ingredients and preferences for dish matching

#### Layout Structure
```
┌─────────────────────────┐
│ Header                  │
│ ← Ingredient Search     │
├─────────────────────────┤
│ Input Section           │
│ ┌─────────────────────┐ │
│ │ Text Input  [🎤][📷]│ │
│ └─────────────────────┘ │
├─────────────────────────┤
│ Your Ingredients (2)    │
│ ┌─────────────────────┐ │
│ │ Chicken      [-] 2 [+]│ │
│ │ Broccoli     [-] 1 [+]│ │
│ └─────────────────────┘ │
├─────────────────────────┤
│ Food Type Tags          │
│ [Vegetarian] [Light]... │
├─────────────────────────┤
│ Cooking Time            │
│ [15min] [30min] [60min] │
├─────────────────────────┤
│ [Search Dishes Button]  │
└─────────────────────────┘
```

#### Key Features

**Input Methods:**
- Text field with comma-separated input
- Voice input button (microphone icon)
- Camera input button (camera icon)

**Ingredient List:**
- Display current ingredients with names
- Quantity adjusters (+/- buttons)
- Minimum 1, maximum 99 per ingredient

**Filter Tags:**
- **Food Type:** Vegetarian, Light, Rich, Meat, Vietnamese, Chinese, Western
- **Time:** 15 min, 30 min, 60 min, 90+ min
- Multi-select capability
- Active state: filled with primary color
- Inactive state: muted background

**Search Button:**
- Fixed at bottom
- Primary color background
- Includes search icon

#### Interaction Patterns
- Tags toggle on/off with tap
- Quantity changes with +/- buttons
- Voice/camera inputs open respective interfaces
- All filters are optional

---

### 3. Results Screen

**Purpose:** Display matching dishes with relevance scores

#### Layout Structure
```
┌─────────────────────────┐
│ Header                  │
│ ← Results (4 dishes)    │
│ [By Match][Time][Cal]   │
├─────────────────────────┤
│ Dish Cards              │
│ ┌─────────────────────┐ │
│ │🥘 Gà Xào...   95%   │ │
│ │   Chicken Stir-Fry  │ │
│ │   ▼                 │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │🍲 Súp Gà...   90%   │ │
│ │   (Collapsed)       │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

#### Card States

**Compact State:**
- Dish emoji/image (large)
- Vietnamese name
- English name
- Match percentage badge (green background)
- Expand/collapse chevron

**Expanded State:**
```
┌─────────────────────────┐
│ 🥘 Gà Xào Bông Cải  95% │
│    Chicken Stir-Fry      │
│    ▲                     │
├─────────────────────────┤
│ ⏱ 25 min  🔥 420 kcal   │
│ [Light][Meat][Vietnamese]│
│ [View Recipe] [♥ Save]   │
│ [Shopping List]          │
└─────────────────────────┘
```

#### Key Features
- **Sort Options:** By Match (default), By Time, By Calories
- **Match Percentage:** 0-100% based on ingredient coverage
- **Quick Stats:** Cook time and calories always visible when expanded
- **Tag Display:** Show dish categorization
- **Actions:**
  - View Recipe (primary button)
  - Save to Favorites (heart icon)
  - Shopping List (secondary button)

#### Visual Patterns
- Cards expand/collapse with smooth animation
- Match percentage uses color coding (high = primary, lower = muted)
- Only one card expanded at a time for cleaner view

---

### 4. Recipe Detail Screen

**Purpose:** Complete recipe with cooking timeline and ingredients

#### Layout Structure
```
┌─────────────────────────┐
│ ← Header        [♥][↗]  │
├─────────────────────────┤
│        🍜 (large)        │
│     Phở Gà              │
│   Chicken Pho           │
│  ⏱ 45 min  🔥 420 kcal  │
├─────────────────────────┤
│ Servings: [-] 2 [+]     │
├─────────────────────────┤
│ Cooking Timeline        │
│ Total: 45 min           │
│                         │
│ ① Chop vegetables       │
│   5 minutes      0'     │
│   │                     │
│ ② Marinate chicken      │
│   10 minutes     5'     │
│   │                     │
│ ③ Heat & sauté          │
│   8 minutes      15'    │
│   │                     │
│ ④ Add broccoli          │
│   4 minutes      23'    │
│   │                     │
│ ⑤ Season & serve        │
│   2 minutes      27'    │
├─────────────────────────┤
│ Ingredients             │
│ ☑ Chicken breast  400g  │
│ ☑ Broccoli        200g  │
│ ☐ Soy sauce      2 tbsp │
│ ☐ Oyster sauce   1 tbsp │
├─────────────────────────┤
│ [🛒 Shopping List (2)]  │
└─────────────────────────┘
```

#### Key Features

**Hero Section:**
- Large dish emoji/image
- Bilingual name (Vietnamese + English)
- Quick stats (time, calories)
- Action buttons (favorite, share)

**Serving Size Adjuster:**
- Range: 1-10 servings
- Real-time ingredient scaling
- Default: 2 servings

**Visual Cooking Timeline:**
- Step-by-step vertical timeline
- Each step shows:
  - Number indicator (circled)
  - Task description
  - Duration in minutes
  - Start time marker
- Connected dots showing sequence
- Total time at top

**Ingredients List:**
- Checkboxes for completion tracking
- Amount scales with serving size
- Missing ingredients highlighted (unchecked, different color)
- Visual distinction between have/need

**Shopping List Generator:**
- Shows count of missing ingredients
- One-tap to generate list
- Copy to clipboard functionality

---

### 5. Discover Screen

**Purpose:** Browse trending and nearby dishes

#### Layout Structure
```
┌─────────────────────────┐
│ ← Discover              │
├─────────────────────────┤
│ Filters                 │
│ 📍 [1km][2km][5km]...   │
│ 💰 [Low][Mid][High]     │
├─────────────────────────┤
│ 📈 Trending Near You    │
│                         │
│ ┌─────────────────────┐ │
│ │ ① 🥗 Phở Salad      │ │
│ │    Pho Salad     ♥  │ │
│ │    Nhà Hàng SG      │ │
│ │    📍1.2km ⭐4.5 $$ │ │
│ │    [Order GrabFood] │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ ② 🍜 Bún Chả        │ │
│ │    ... (similar)    │ │
│ └─────────────────────┘ │
├─────────────────────────┤
│ 📍 District 1, HCMC     │
│    [Change location]    │
└─────────────────────────┘
```

#### Key Features

**Distance Filter:**
- Options: 1km, 2km, 5km, 10km, 20km
- Single selection
- Uses device GPS or manual location

**Price Filter:**
- Low (< 30k VND) - $
- Mid (30-80k VND) - $$
- High (80k+) - $$$
- Multi-select enabled
- Color-coded (green/orange/red)

**Trending Dish Cards:**
- Trending rank badge (numbered circle)
- Dish emoji/photo
- Bilingual name
- Restaurant name
- Distance from user
- Star rating
- Price indicator
- Favorite heart button
- Order CTA (external link)

**Location Display:**
- Shows current search area
- Change location option
- Permission status indicator

#### Visual Patterns
- Trending badges use primary color
- Star ratings use amber/gold
- Distance uses location pin icon
- Price indicators use semantic colors

---

### 6. Favorites Screen

**Purpose:** Access saved dishes quickly

#### Layout Structure
```
┌─────────────────────────┐
│ ← My Favorites (3)      │
│ [Search favorites...]   │
├─────────────────────────┤
│ Saved Dishes            │
│                         │
│ ┌─────────────────────┐ │
│ │ 🍜 Phở Gà        ♥  │ │
│ │    Chicken Pho       │ │
│ │    ⏱25min 🔥420kcal │ │
│ │    Saved 2 days ago  │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ 🥘 Gà Xào...     ♥  │ │
│ │    ... (similar)     │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

**Empty State:**
```
┌─────────────────────────┐
│ ← My Favorites (0)      │
├─────────────────────────┤
│                         │
│         ❤️              │
│                         │
│  No favorites yet       │
│  Tap the heart icon on  │
│  any dish to save here  │
│                         │
│  [Discover Dishes]      │
│                         │
└─────────────────────────┘
```

#### Key Features
- **Search Bar:** Filter favorites by name
- **Card Display:** Same layout as Results screen (compact)
- **Metadata:** Save date shown
- **Quick Access:** Tap to view full recipe
- **Filled Heart:** Indicates saved status
- **Empty State:** Encourages discovery with CTA

---

### 7. Settings Screen

**Purpose:** Manage preferences and account

#### Layout Structure
```
┌─────────────────────────┐
│ ← Settings              │
├─────────────────────────┤
│ 👤 ACCOUNT              │
│ ┌─────────────────────┐ │
│ │ [👤] Guest User     ▶│ │
│ │      Sign in to sync │ │
│ └─────────────────────┘ │
├─────────────────────────┤
│ 🔔 NOTIFICATIONS        │
│ Breakfast (7AM)    [ON] │
│ Lunch (12PM)       [ON] │
│ Dinner (7PM)      [OFF] │
│ Daily (10AM)       [ON] │
├─────────────────────────┤
│ DIETARY PREFERENCES     │
│ Vegetarian        [OFF] │
│ Vegan             [OFF] │
│ Gluten-free       [OFF] │
│ Dairy-free        [OFF] │
├─────────────────────────┤
│ 🌐 APPEARANCE & LANGUAGE│
│ 🌙 Theme          Light▶│
│ 🌐 Language  Tiếng Việt▶│
│ 📏 Units         Metric▶│
├─────────────────────────┤
│ 🛡 PRIVACY & DATA       │
│ Clear search history    │
│ Clear all favorites     │
│ Delete account (red)    │
├─────────────────────────┤
│ ABOUT                   │
│ 🍜 Hôm Nay Ăn Gì        │
│ Version 1.0.0 (MVP)     │
│ Made with ❤️ for food   │
└─────────────────────────┘
```

#### Settings Categories

**Account:**
- Guest mode indicator
- Sign in CTA
- Profile management (when logged in)

**Notifications:**
- Meal reminders (breakfast, lunch, dinner)
- Daily suggestion
- Toggle switches for each
- Time display for each reminder

**Dietary Preferences:**
- Vegetarian, Vegan, Gluten-free, Dairy-free
- Toggle switches
- Affects dish suggestions

**Appearance & Language:**
- Theme: Light, Dark, System
- Language: Vietnamese, English
- Units: Metric, Imperial
- Chevron indicates submenu

**Privacy & Data:**
- Clear search history
- Clear favorites
- Delete account (destructive, red text)
- Confirmation dialogs for destructive actions

**About:**
- App logo/icon
- Version number
- Attribution

#### Interaction Patterns
- Toggles use custom switch component
- Settings with submenus show chevron
- Destructive actions require confirmation
- Changes save immediately (no submit button)

---

## Component Patterns

### Buttons

**Primary Button:**
- Background: Primary color (#D97036)
- Text: White
- Padding: 16px vertical
- Radius: 12px
- Hover: Slightly darker

**Secondary Button:**
- Background: Secondary color (#8B6F47)
- Text: White
- Same sizing as primary

**Ghost Button:**
- Background: Muted (#F5E6D3)
- Text: Muted foreground
- Hover: Slightly darker background

**Destructive Button:**
- Background: Transparent or destructive/10
- Text: Destructive color (#C94A3A)

### Cards

**Standard Card:**
- Background: White (#FFFFFF)
- Border: 1px solid border color
- Radius: 16px (rounded-2xl)
- Shadow: Subtle (shadow-sm)
- Padding: 16px

**Hover State:**
- Background: Muted/30
- Transition: 200ms ease

### Tags/Chips

**Inactive Tag:**
- Background: Muted (#F5E6D3)
- Text: Muted foreground
- Radius: Full (pill shape)
- Padding: 8px 16px

**Active Tag:**
- Background: Primary or Secondary
- Text: White
- Same sizing

### Form Inputs

**Text Input:**
- Background: Input background (#FFFBF5)
- Border: 1px border color
- Radius: 12px
- Padding: 12px 16px
- Focus: 2px ring primary color

**Toggle Switch:**
- Width: 48px
- Height: 28px
- Background: Switch background (off), Primary (on)
- Handle: 20px white circle
- Transition: Transform 200ms

### Icons

**Usage:**
- Always paired with labels for clarity
- Size: 20px standard, 16px small, 24px large
- Color: Matches text color in context
- Lucide React library

---

## User Flows

### Flow 1: Find Dish from Ingredients (UJ-1)

```
Home → Ingredient Input → Results → Recipe Detail → Shopping List
  ↓         ↓              ↓           ↓               ↓
Start    Add items    Select dish   View steps    Copy list
       Set filters   Save favorite  Adjust serve  
```

**Steps:**
1. User taps "Ingredient Search" on Home
2. Enters ingredients via text/voice/camera
3. Adjusts quantities with +/- buttons
4. Optionally selects food type and time filters
5. Taps "Search Dishes"
6. Views results sorted by match %
7. Expands card to see details
8. Taps "View Recipe"
9. Adjusts serving size
10. Reviews timeline and ingredients
11. Taps "Shopping List" for missing items

### Flow 2: Discover Nearby Food (UJ-2)

```
Home → Discover → Filter → Select Dish → External Order
  ↓        ↓         ↓          ↓              ↓
Start   Browse    Adjust     View details   GrabFood
              Trending   radius/price
```

**Steps:**
1. User taps "Discover" on Home or bottom nav
2. App shows trending dishes near user
3. User adjusts distance filter (1km-20km)
4. User selects price range filter
5. Browses trending list
6. Taps dish card
7. Views recipe details
8. Taps "Order on GrabFood"
9. Redirected to external app/site

### Flow 3: Save and Return to Favorite (UJ-3)

```
Any Dish View → Save → Favorites Screen → Recipe Detail
      ↓          ↓           ↓                 ↓
  View recipe  Tap ♥    Browse saved      Cook again
```

**Steps:**
1. User finds a dish (via search or discover)
2. Taps heart icon to save
3. Heart fills with color confirmation
4. Later, opens Favorites from bottom nav
5. Searches or scrolls to find saved dish
6. Taps card to view recipe
7. Proceeds to cook

---

## Responsive Behavior

### Mobile Portrait (320-448px)
- Primary use case
- Single column layout
- Bottom navigation always visible
- Cards stack vertically
- Tags scroll horizontally if needed

### Mobile Landscape
- Same layout as portrait
- Utilizes more vertical space
- May show more list items

### Tablet (768px+)
- Centered layout with max-width constraint (448px)
- Large margins on sides
- Same component sizing

---

## Accessibility

### Screen Readers
- All buttons have accessible labels
- Icons paired with text labels
- Semantic HTML structure (headings, lists, buttons)

### Touch Targets
- Minimum 44x44px for all interactive elements
- Adequate spacing between buttons
- Swipeable areas clearly defined

### Color Contrast
- Text on background: 4.5:1 minimum
- Primary on white: AA compliant
- Muted text: AAA compliant for large text

### Keyboard Navigation
- Logical tab order
- Focus indicators visible
- Enter/Space activates buttons

---

## Animation & Transitions

### Standard Transitions
- Duration: 200ms
- Easing: ease-in-out
- Properties: background-color, transform, opacity

### Specific Animations
- **Card Expand/Collapse:** Height transition 300ms
- **Tag Selection:** Background color 150ms
- **Toggle Switch:** Transform 200ms
- **Page Transitions:** Slide 300ms

### Loading States
- Skeleton screens for content
- Spinner for actions
- Progress indicators for long operations

---

## Empty States

### No Results
```
🔍
No dishes match your ingredients
Try adding more items or removing filters
[Clear Filters]
```

### No Favorites
```
❤️
No favorites yet
Tap the heart icon on any dish to save it here
[Discover Dishes]
```

### Location Off
```
📍
Location access needed
Enable location to discover dishes nearby
[Enable Location] [Enter Manually]
```

### Network Error
```
🌐
Connection lost
Check your internet and try again
[Retry]
```

---

## Technical Implementation Notes

### State Management
- Screen navigation via useState
- Local state for forms and toggles
- Props drilling for navigation callbacks

### Data Structure

**Dish Object:**
```typescript
{
  id: number
  name: string          // Vietnamese
  nameEn: string        // English
  image: string         // emoji or URL
  cookTime: number      // minutes
  calories: number      // kcal
  cuisine: string
  tags: string[]
  match?: number        // 0-100 percentage
  ingredients?: Ingredient[]
  recipe?: RecipeStep[]
}
```

**Ingredient Object:**
```typescript
{
  name: string
  quantity: number
  unit?: string
  missing?: boolean
}
```

**RecipeStep Object:**
```typescript
{
  task: string
  time: number     // minutes
  start: number    // minutes from beginning
}
```

### Component Architecture
```
App (router)
├── HomeScreen
├── IngredientInputScreen
├── ResultsScreen
├── RecipeDetailScreen
├── DiscoverScreen
├── FavoritesScreen
└── SettingsScreen
```

---

## Future Enhancements (Beyond MVP)

### Phase 2 Features
- Weekly meal planner
- Social features (share dishes)
- User-generated content (submit recipes)
- Advanced ML ingredient substitution
- Nutrition tracking
- Push notification customization
- Apple Sign-In (iOS requirement)

### Design Improvements
- Animated illustrations
- Photo upload for dishes
- Dark mode refinement
- Tablet-optimized layout
- Desktop web version

---

## Design Principles

1. **Bilingual First:** Always show both Vietnamese and English
2. **Mobile Optimized:** Touch-friendly, thumb-zone aware
3. **Food-Focused:** Warm colors, appetite appeal
4. **Quick Discovery:** Minimize steps to find dishes
5. **Progressive Disclosure:** Show details on demand
6. **Forgiving Input:** Multiple ways to enter data
7. **Visual Cooking:** Timeline over text instructions
8. **Local Context:** Vietnamese food culture and habits

---

## Glossary

- **Dish:** A recipe with ingredients, steps, and metadata
- **Match %:** How well a dish fits user's available ingredients
- **Timeline:** Visual step-by-step cooking guide
- **Tag:** Category or filter label (vegetarian, light, etc.)
- **Card:** Expandable UI component showing dish summary
- **Guest Mode:** Using app without account (local storage only)
- **Registered User:** Logged-in user with cloud sync

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-05-31 | Initial UX design specification |

---

**Design Credits:**  
Created with Claude Code for Figma Make  
Based on PRD: `src/imports/prd.md`

---

*End of UX Design Specification*
