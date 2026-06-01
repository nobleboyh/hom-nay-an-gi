---
name: Hôm Nay Ăn Gì
status: final
sources:
  - ../../prds/prd-hom-nay-an-gi-2026-05-31/prd.md
updated: 2026-05-31
---

# Hôm Nay Ăn Gì — Experience Spine

## Foundation

Cross-platform mobile (iOS + Android), platform-native UI conventions. `DESIGN.md` is the visual identity reference; this spine owns behavioral and interaction decisions. Light mode is default; dark and system-follow are toggleable settings (`{DESIGN.md.colors.*-dark}` tokens).

Primary input modalities: text, voice, barcode scan, object recognition (camera). Text + camera receive equal prominence on the input surface.

## Information Architecture

| Surface | Reached from | Purpose |
|---------|-------------|---------|
| Home — Input | Tab bar (Tab 1) | Ingredient entry + tag filters + search |
| Home — Results | Tab bar (Tab 1), after search | Collapsible Card list of matching dishes |
| Recipe | Home result tap | Visual Cooking Timeline + full details. `mockups/key-recipe.html` |
| Shopping List | Recipe / expanded Card | Missing ingredients bottom sheet |
| Discover | Tab bar (Tab 2) | Trending, nearby, Surprise Me, personalized |
| Dish Detail (Discover) | Discover tap | Dish info + external link to delivery |
| Favorites | Tab bar (Tab 3) | Saved dishes list |
| Settings | Drawer menu | Preferences, notifications, units, privacy, theme |
| Login / Register | Drawer or bookmark prompt | Auth flow (email + Google OAuth) |

Drawer menu accessible from any tab via profile avatar or hamburger icon in the header.

→ Composition reference: `mockups/key-home-input.html`, `mockups/key-results.html`, `mockups/key-discover.html`, `mockups/key-favorites.html`, `mockups/key-settings.html`, `mockups/key-login.html`. Spine wins on conflict.

## Voice and Tone

Microcopy. Brand voice and visual posture live in `DESIGN.md`.

| Do | Don't |
|----|-------|
| "What's in your fridge?" | "Enter ingredients" |
| "Found 5 dishes" | "5 results returned" |
| "Add missing ingredients to your list" | "Shopping list generated" |
| "Surprise me!" | "Random selection" |
| "We couldn't find this dish nearby" | "No results" |
| Short, warm, food-centered language | Corporate or robotic phrasing |
| Use Vietnamese where natural ("phở," "bún," "cơm") | Force English translations for untranslatable dishes |

## Component Patterns

*Behavioral. Visual specs in `DESIGN.md.Components`.*

| Component | Surface | Behavioral rules |
|-----------|---------|-----------------|
| Ingredient input | Home | Text field with mic icon (left) and camera icon (right) in the field. Comma-separated parsing. Max 20 ingredients. |
| Tag chip row | Home — Filter | Horizontal scrollable row below input. Toggleable. AND logic. Mood tags in expandable section below. |
| Cooking time chip | Home — Filter | Preset chips: 15min / 30min / 60min / 90min+. Single-select range. |
| Search button | Home | Full-width primary button below filters. Disabled when 0 ingredients. |
| Card (compact) | Results list | Tap to expand. Shows dish name + relevance % + cuisine. |
| Card (expanded) | Results list | Shows photo, cook time, calories, tags, "View Recipe," "Shopping List," bookmark icon. |
| Recipe timeline | Recipe | Horizontal bar chart. Total cook time top-left. Steps as labeled bars on a time axis. Parallel tasks stacked. |
| Shopping list sheet | Recipe / Card | Bottom sheet. Lists missing ingredients + qty. "Copy list" and "Share list" buttons. |
| Surprise Me button | Discover | Large pill button, centered at top of Discover tab. Triggers instant random dish -> expanded Card. |
| Trending feed | Discover | Vertical scroll list. Each item: photo, name, trending rank, source. Tap -> expanded Card. |
| Distance filter | Discover | Radius selector (1/2/5/10/20km). Requires location permission prompt on first use. |
| Price filter | Discover | 3-segment control: Low / Mid / High. Multi-select. |
| Bookmark icon | Expanded Card / Recipe | Heart icon. Outlined = unsaved, filled = saved. Guest -> login prompt on tap. |
| Favorites list | Favorites tab | Vertical list, sorted by date saved. Tappable -> expanded Card. Empty state with call-to-action. |
| Settings row | Settings | Tap -> toggle or detail screen. Destructive actions have confirmation dialog. |

## State Patterns

| State | Surface | Treatment |
|-------|---------|-----------|
| Cold open | Home — Input | Empty input field, placeholder: "What's in your fridge? (e.g., chicken, broccoli, eggs)" |
| 0 ingredients entered | Home — Input | Search button disabled with tooltip: "Add at least one ingredient" |
| Loading results | Home — Results | Skeleton cards (3-5 ghost cards with shimmer) |
| No matching dishes | Home — Results | "No dishes match your ingredients. Try fewer ingredients or a different filter." |
| Empty favorites | Favorites | "No saved dishes yet. Tap the heart icon on any dish to save it." |
| Offline | Any | Banner at top: "You're offline. Showing cached results." Core features read from cache. |
| Search empty (Favorites) | Favorites search | "No matches in your saved dishes." |
| Location denied | Discover | Prompt: "Enable location to find dishes near you, or enter an area manually." |
| Calorie data missing | Expanded Card | Show "Calories N/A" instead of 0. |
| Guest bookmarks | Expanded Card | Toast: "Log in to save favorites." Tapping toast opens Login. |
| Loading results | Discover | Skeleton cards (3 ghost cards matching trending feed layout) |
| Offline — recipe uncached | Recipe | "This recipe isn't available offline. Connect to the internet to view it." |

## Interaction Primitives

- **Tap** to select, navigate, toggle.
- **Tap to expand/collapse** on Cards (standard list behavior, not accordion animation).
- **Long-press** reserved for system text selection only.
- **Pull-to-refresh** on Home results and Discover feed.
- **Infinite scroll** on result lists (10 items per page).
- **Swipe** uses platform-native back gesture only.
- **Banned:** carousels, hero animations on open, parallax scrolling, custom gesture re-inventions.

## Accessibility Floor

Behavioral. Visual contrast in `DESIGN.md`.

- VoiceOver / TalkBack: every interactive element labeled with role + state.
- Dynamic type honored through `DESIGN.md` typography tokens. UI must remain legible at largest accessibility size.
- Reduce Motion: skip skeleton shimmer animation; show static card placeholders.
- Tap targets ≥ 44pt (iOS) / 48dp (Android) for all interactive elements.
- Focus traversal follows natural reading order (left-to-right, top-to-bottom).
- Color is never the sole indicator of state (tag selected state = filled background + bold text, not just color change).
- Camera permission: explain *why* camera is needed before triggering the OS permission dialog.

## Key Flows

### KF-1. Anh cooks dinner from leftovers (UJ-1 from PRD)

1. Opens app -> Home tab. Input field focused, keyboard up.
2. Types "chicken, broccoli, eggs" (or taps mic and speaks).
3. Taps camera icon as an alternative path -> scans barcode on soy sauce bottle -> "soy sauce" added to list.
4. Adjusts quantities: chicken=200g, broccoli=1 head, eggs=3.
5. Selects tags: "meat-included," "light," "Vietnamese." Selects cooking time: 30min.
6. Taps Search -> results load with skeleton cards.
7. Results appear sorted by relevance. Top card: "Gà xào bông cải" (chicken stir-fry broccoli).
8. **Climax:** Taps card to expand — sees photo, 25 min, 420 kcal, "View Recipe" button.
9. Taps "View Recipe" -> Visual Cooking Timeline: 5min prep, 15min stir-fry, 5min plating.
10. Taps "Shopping List" -> bottom sheet: "soy sauce" missing. Copies list.
11. Resolution: cooks dinner.

### KF-2. Minh finds lunch near his office (UJ-2 from PRD)

1. Opens app -> Discover tab.
2. Location permission dialog: "Allow 'Hôm Nay Ăn Gì' to find dishes near you?" -> Allow.
3. Distance selector shows: automatically set to 2km radius.
4. App shows trending dishes nearby: "Phở gà — 350m — 45k VND."
5. Taps price filter: Mid (30k-80k). Scrolls through results.
6. **Climax:** Taps "Bún thịt nướng" — sees expanded Card with restaurant name, distance, price, rating.
7. Taps "Open in GrabFood" -> system opens GrabFood in browser.
8. Resolution: orders lunch.

### KF-3. Lan saves a dish for later (UJ-3 from PRD)

1. Opens app (Guest mode) -> Home tab.
2. Searches ingredients, finds "Cơm tấm" dish.
3. Taps bookmark (heart) icon on expanded Card.
4. System shows sheet: "Log in to save favorites. Continue with Google or Email?"
5. **Climax:** Taps "Continue with Google" -> OAuth flow -> returns to same Card.
6. Heart fills (saved). Toast: "Saved to Favorites."
7. Later, taps Favorites tab -> "Cơm tấm" appears at top.
8. Resolution: taps to expand and view recipe again.

> **Edge:** If Lan was already authenticated, the bookmark tap immediately saves with haptic feedback and no prompt.

## Inspiration & Anti-patterns

### Inspiration

- **Cooky.vn** — Warm food photography, Vietnamese dish focus, local market feel.
- **GrabFood** — Clean card-based restaurant results, distance + price displayed inline.
- **Paprika (recipe app)** — Excellent recipe view with ingredient list + step-by-step; clean information density.

### Anti-patterns

- **Tinder-style swipe** — Rejected during brainstorming. Users need overview of options, not serial one-at-a-time.
- **Gamification (streaks, badges)** — Not a habit app; users open it when they're hungry, not for a streak.
- **Social feeds (comments, shares, friends)** — Creates noise. Discovery is about food, not about other users.
