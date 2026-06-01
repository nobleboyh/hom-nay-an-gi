---
title: Hôm Nay Ăn Gì
created: 2026-05-31
updated: 2026-05-31
status: final
---

# PRD: Hôm Nay Ăn Gì
*Working title — "What to Eat Today." Confirm.*

## 0. Document Purpose

This PRD defines the MVP requirements for **Hôm Nay Ăn Gì**, a cross-platform mobile app that helps users decide what to eat by suggesting dishes based on available ingredients or random discovery. It is written for the development team and downstream UX/architecture work. Vocabulary is Glossary-anchored. Assumptions are tagged inline with `[ASSUMPTION]` and indexed in §9. This PRD builds on the brainstorming session documented in `brainstorming/brainstorming-session-2026-05-31.md`.

## 1. Vision

Deciding what to eat every day is a universal friction point. Hôm Nay Ăn Gì eliminates it by transforming what users already have (ingredients in the fridge) or what they're in the mood for into concrete dish suggestions with recipes, cook times, and calorie estimates. The app also helps users discover new food nearby or trending — bridging the gap between "I don't know what to eat" and "here's exactly what I should make or order." Bilingual (Vietnamese + English), it serves the Vietnamese market while being accessible to a broader audience.

## 2. Target User

### 2.1 Jobs To Be Done

- "I have ingredients at home — tell me what I can cook with them."
- "I don't know what I'm in the mood for — surprise me."
- "I want to try something new and trending near me."
- "I want to save and revisit dishes I liked."
- "I want to know how many calories a dish has and how long it takes to cook."

### 2.2 Non-Users (v1)

- Users looking for in-app food ordering or delivery (external links only).
- Users needing meal delivery subscriptions or scheduled meal kits.
- Professional chefs or commercial kitchen operators.

### 2.3 Key User Journeys

**UJ-1. Anh uses leftover ingredients to find dinner.**
- **Persona + context:** Anh, 28, living alone in HCMC, opens the fridge and sees chicken, broccoli, and eggs. She's authenticated via a previous session.
- **Entry state:** App launches to the home screen.
- **Path:** Taps "Ingredient Input" → types "chicken, broccoli, eggs" (or uses voice) → adjusts quantities → selects tags: "meat-included," "light," "Vietnamese" → taps Search → sees a list of 5 matching dishes sorted by relevance.
- **Climax:** Taps the top dish — the Card expands showing a photo, total cooktime (25 min), calorie estimate (420 kcal), and a "View Recipe" button.
- **Resolution:** Taps "View Recipe" → sees the visual cooking timeline. Taps "Shopping List" → sees "soy sauce" as missing ingredient, copies list to notes.
- **Edge case:** If no dish matches all ingredients, the app shows partial matches + suggests which missing ingredient to buy.

**UJ-2. Minh discovers lunch near his office.**
- **Persona + context:** Minh, 32, working in District 1, is on lunch break and wants something new nearby.
- **Entry state:** Guest mode (not logged in).
- **Path:** Opens app → taps "Discover" → app uses device location to show trending dishes in a 2km radius → filters by price range (mid) and type ("salad," "light") → sorts by rating.
- **Climax:** Sees a phở salad from a nearby restaurant with a 4.5 rating. Taps it.
- **Resolution:** App shows dish details + an external link to the restaurant's GrabFood page. Minh taps to open GrabFood in browser.
- **Edge case:** If location is off, app prompts to enable or enter an area manually.

**UJ-3. Lan saves a dish for later.**
- **Persona + context:** Lan, 25, browsing dishes at home on her couch. Not logged in.
- **Path:** Finds a dish she likes → taps the bookmark icon → app prompts: "Log in to save favorites" → Lan logs in via email → bookmarks the dish.
- **Climax:** Heart icon fills. Dish is saved to "My Favorites."
- **Resolution:** Later, she opens "My Favorites" to find the dish quickly and cook it.
- **Edge case:** Guest users who bookmark see a prompt to log in; bookmarks are stored locally and sync on login.

## 3. Glossary

- **Dish** — A named food item with associated recipe, ingredients list, calorie estimate, cook time, cuisine type, tags, and optional photo.
- **Ingredient** — A food item the user has on hand, entered via text, voice, or camera. Has a name and quantity.
- **Recipe** — Step-by-step instructions to prepare a Dish. Included in the visual cooking timeline format.
- **Card** — The expandable result item showing Dish summary. Compact = title + match %. Expanded = full details (photo, calories, time, tags, recipe link).
- **Tag** — A label applied to filter or categorize Dishes (e.g., "vegetarian," "salty," "comfort food," "Vietnamese"). Tags operate on dish-level output, not input ingredients.
- **Ingredient Mode** — The primary feature where users input ingredients to receive Dish suggestions.
- **Discover Mode** — The secondary feature for random Dish discovery via trending, location, history, or random pick.
- **Fridge-Clearing Mode** — A sub-mode within Ingredient Mode that prioritizes ingredients by expiration date to reduce food waste.
- **Shopping List** — Auto-generated list of missing ingredients needed to prepare a selected Dish.
- **Visual Cooking Timeline** — A horizontal timeline-style recipe display showing task phases, parallel tasks, and total cook time.
- **Guest** — An unauthenticated user. Data stored locally only.
- **Registered User** — An authenticated user. Data synced to cloud, history and preferences preserved across devices.
- **Surprise Me** — A one-tap action that returns a random Dish suggestion with no filters.

## 4. Features

### 4.1 Ingredient Input

**Description:** User enters available ingredients via text, voice, or camera (barcode + object recognition). Quantity is auto-estimated or user-adjusted. Enters Ingredient Mode. Realizes UJ-1.

**Functional Requirements:**

#### FR-1: Text Ingredient Input

User can type ingredient names into a text field. Support comma-separated input (e.g., "chicken, broccoli, eggs"). Minimum 1 ingredient, maximum 20 per query. Realizes UJ-1.

**Consequences (testable):**
- Text field accepts input up to 500 characters.
- Parsing correctly separates comma-delimited items into individual Ingredients.
- Submitting with 0 ingredients shows validation: "Add at least one ingredient."

**Out of Scope:**
- Natural-language parsing ("I have chicken and maybe some broccoli") — comma-delimited only for MVP.

#### FR-2: Voice Ingredient Input

User can tap a mic icon and speak ingredient names. Speech-to-text transcribes into the text field for review and submission. Realizes UJ-1.

**Consequences (testable):**
- Mic icon is visible on the ingredient input screen.
- Transcription appears in the text field within 2 seconds of speech end.
- User can edit the transcribed text before submitting.

#### FR-3: Camera Ingredient Input

[RISK: Object recognition requires ML expertise and training data for Vietnamese produce — see Open Question #4. Barcode scanning is lower risk and should be implemented first.]

User can capture ingredient information via camera. Supports two modes: barcode scanning (packaged items) and object recognition (fresh items). Multiple items detected in a single frame are shown as a list for user confirmation. Realizes UJ-1.

**Consequences (testable):**
- Barcode scan resolves to a product name within 3 seconds on a standard connection.
- Object recognition detects visible food items and returns top-3 confidence labels.
- Detected items are shown as a confirmation list; user can add, remove, or edit before submitting.
- Camera permission prompt shown on first access. [ASSUMPTION: If camera permission is denied, app falls back to text-only input mode.]

**Out of Scope:**
- Quantity estimation from camera images. Quantities default to "1 unit" and are user-adjustable.

#### FR-4: Quantity Adjustment

User can view and modify the quantity of each entered Ingredient before searching. Default = "1 unit" for camera items. Realizes UJ-1.

**Consequences (testable):**
- Each Ingredient in the input list shows a quantity field (integer, 1-99).
- User can tap to edit via numeric input or stepper (+/-).
- Quantity changes trigger no search — only affects result relevance scoring.

### 4.2 Filtering & Tags

**Description:** After entering ingredients, user applies Tags to narrow results. Tags filter on dish-level attributes. Realizes UJ-1.

**Functional Requirements:**

#### FR-5: Food Type Tags

User can select one or more Food Type Tags to filter results. Available tags: vegetarian, salad, light, rich, meat-included, salty, sour, sweet, dessert, and cuisine types (e.g., Vietnamese, Chinese, Italian, Western). Tags are modifiable after results load. Realizes UJ-1.

**Consequences (testable):**
- Tags are displayed as horizontal chip rows below the ingredient input.
- Selecting a tag visually highlights it (filled state).
- Multiple tags can be active simultaneously (AND logic — dish must match all selected).
- Tags remain editable after search results are displayed; changing tags re-filters results without re-searching.

#### FR-6: Mood / Craving Tags (Optional)

User can optionally select Mood Tags: "comfort food," "refreshing," "indulgent," "something light," "spicy craving." Entirely skippable. Realizes UJ-1.

**Consequences (testable):**
- Mood Tags appear as a separate expandable section below Food Type Tags.
- When no Mood Tag is selected, result set is unaffected.

#### FR-7: Cooking Time Filter

User can filter results by maximum cook time using preset buttons: 15 min, 30 min, 60 min, 90 min+. Realizes UJ-1.

**Consequences (testable):**
- Filter buttons are displayed as preset chips (15min / 30min / 60min / 90min+).
- Selecting one filters out dishes exceeding the selected time.
- Multiple time selections behave as range (e.g., 15 + 30 = dishes under 30 min).
- If no Dish fits the time + ingredient combination, app shows a message: "Try a longer cook time or more ingredients."

#### FR-8: Serving Size Adjustment

User can adjust serving size (1-10) via a slider on the expanded Card or Recipe view. Ingredients and calorie estimates scale in real time. Realizes UJ-1.

**Consequences (testable):**
- Slider is visible on expanded Card view and Recipe view.
- Moving the slider updates displayed ingredient quantities and calorie count within 500ms.
- Default serving size is "2" (assumed standard recipe portion).

### 4.3 Results & Recipe Display

**Description:** Filtered Dish results display as a list. Users can tap to expand and view recipe details. Realizes UJ-1.

**Functional Requirements:**

#### FR-9: Collapsible Card List

Search results appear as a collapsible Card list. Compact view = Dish name + match percentage. Expanded view (tap) = photo, total cook time, calorie estimate, Tags, and action buttons. Sorting controls are available. Realizes UJ-1.

**Consequences (testable):**
- Initial result list shows 10 Cards per page with infinite scroll.
- Compact Card shows: Dish name (bold), relevance %, cuisines.
- Expanded Card shows: Dish photo, cook time, calories per serving, Tags, "View Recipe," "Shopping List," "Save" (bookmark) buttons.
- Tapping a Card toggles between compact and expanded.
- Sorting options: by relevance (default), by calories (low-high), by cook time (low-high), by dish type.

#### FR-10: Visual Cooking Timeline

Recipe view displays a horizontal timeline chart. Tasks are shown as parallel bars across a time axis. Total cook time is displayed prominently at the top. Realizes UJ-1.

**Consequences (testable):**
- Recipe screen opens with the total cook time in bold at the top (e.g., "Total: 25 min").
- Timeline shows task blocks (e.g., "Chop veggies — 5 min," "Sauté — 10 min") in sequential order.
- Parallel tasks are stacked vertically (e.g., "Boil water" runs alongside "Chop herbs").
- Ingredient list is shown above or below the timeline.

#### FR-11: Calorie Estimation

Each Dish shows an estimated calorie count per serving. Source is the connected nutrition database. Realizes UJ-1. [ASSUMPTION: Nutrition data sourced from the same API provider as recipes (e.g., Spoonacular/Edamam). If unavailable, display "Calorie data not available."]

**Consequences (testable):**
- Calorie count is displayed on the expanded Card and Recipe view.
- Value updates when serving size changes (FR-8).
- If calorie data is missing for a Dish, show "Calories N/A" instead of 0.

#### FR-12: Shopping List Generation

From the expanded Card, user can generate a Shopping List of ingredients not in their input. A "Copy List" button copies to clipboard. Realizes UJ-1.

**Consequences (testable):**
- "Shopping List" button on expanded Card opens a bottom sheet.
- Sheet lists: ingredient name + quantity for items the user does not already have.
- "Copy List" copies as plain text ("Item1 - qty\nItem2 - qty").
- "Share List" option sends via system share sheet. (iOS/Android native)

### 4.4 Discovery Mode

**Description:** The app's secondary mode for random, trending, or location-based Dish suggestions. No Ingredient input required. Realizes UJ-2.

**Functional Requirements:**

#### FR-13: Surprise Me

A prominent button on the home screen that instantly returns a random Dish suggestion with one tap. No filters, no inputs. Realizes UJ-2.

**Consequences (testable):**
- Button is visually prominent (floating or centered) on the home screen.
- One tap immediately navigates to a random Dish's expanded Card.
- Successive taps return different results (no identical dishes in a row).
- Works in Guest mode.

#### FR-14: Trending Dishes

[RISK: Web scraping is maintenance-heavy — relies on target site structure stability and legal compliance. See Open Questions #6 and #7. Consider API-only fallback if scraping proves unsustainable.]

App displays a feed of trending Dishes sourced from web-scraping (Vietnamese recipe sites) and API data. Sorted by trending score — weighted combination of recipe API popularity score + search frequency across all users in the last 7 days. Realizes UJ-2. [ASSUMPTION: Trending data refreshes daily. Source list of websites/configurable.]

**Consequences (testable):**
- Trending section is available on the home screen.
- Each trending Dish shows: name, photo, source, trending rank.
- Feed refreshes at most once per day to avoid excessive API/scraping calls. See Open Question #7 regarding robots.txt and rate-limiting policy.

#### FR-15: Distance-Based Discovery

[RISK: Google Places API has non-trivial cost at scale (~$32/1k requests). See Open Question #2 for cost assessment. Coverage quality varies by area.]

App uses device location (GPS) and Google Maps/Places API to find restaurants and their dishes within a user-configurable radius (1 km, 2 km, 5 km, 10 km, 20 km). Realizes UJ-2. [ASSUMPTION: Google Places API key required. Restaurant menu data depends on Google's coverage in target area.]

**Consequences (testable):**
- Distance-based results appear after user grants location permission.
- Radius selector allows: 1km, 2km, 5km, 10km, 20km, or entire city.
- Each result shows: restaurant name, Dish name, estimated distance, price indicator.
- Tapping a Dish opens an external link to the restaurant's page or delivery partner (GrabFood, ShopeeFood, etc.).
- If location permission is denied, app prompts manual area input (district/city name).

#### FR-16: Price Filter

In Discover Mode, user can filter results by price range: low (under 30k VND), mid (30k-80k VND), high (80k+ VND). Realizes UJ-2.

**Consequences (testable):**
- Price filter is a 3-segment control (Low / Mid / High).
- Multiple segments can be selected simultaneously.
- Price applies to Dish/restaurant estimate, not to ingredient costs.

#### FR-17: Personalized Discovery (Registered Users)

For Registered Users, Discover Mode can surface suggestions based on saved Favorites, search history, and Tag preferences. Realizes UJ-2. [NOTE FOR ARCHITECTURE: Relevance algorithm for "For You" needs specification — weighting of favorites vs history vs tags vs recency. Beyond PRD scope.]

**Consequences (testable):**
- "For You" section appears in Discover Mode for Registered Users.
- Suggestions are based on the user's 10 most recent saved dishes and frequently used Tags.
- "For You" is absent in Guest mode.

### 4.5 Account & Sync

**Description:** Optional registration. Guest users access core features locally. Registered users get cloud-synced preferences, history, and Favorites. Realizes UJ-3.

**Functional Requirements:**

#### FR-18: Guest Mode

User can use all core features (Ingredient Mode, Discover Mode, Surprise Me) without logging in. Data is stored locally on device. Realizes UJ-1, UJ-2.

**Consequences (testable):**
- All core features are accessible without authentication.
- Guest data persists across app restarts (local storage).
- Guest data is lost on app uninstall.
- "Log in to sync your favorites" prompt appears on bookmark attempt.

#### FR-19: User Registration & Login

User can register and log in via email/password or Google OAuth. Realizes UJ-3. [ASSUMPTION: Only email/password + Google OAuth for MVP. Apple Sign-In added for iOS if required by App Store policy.]

**Consequences (testable):**
- Registration: email, password (min 8 chars), display name.
- Login: email + password or Google OAuth.
- Password reset via email.
- Session persists until explicit logout or 30 days of inactivity.

#### FR-20: Cloud Sync

Registered User data (Favorites, search history, Tag preferences, settings) syncs to cloud backend. Syncs on login and periodically while active. Realizes UJ-3.

**Consequences (testable):**
- On login, local data merges with cloud data (cloud wins on conflict).
- Sync happens within 10 seconds of a Favorite being toggled.
- History is retained for 90 days for Registered Users.
- User can delete their account and all cloud data via Settings.

### 4.6 My Favorites

**Description:** Users can bookmark Dishes for quick access. Registered Users see them across devices. Realizes UJ-3.

**Functional Requirements:**

#### FR-21: Save / Unsave Dish

User can tap the bookmark icon on any expanded Card to save (or unsave) a Dish. Heart/filled state indicates saved status. Realizes UJ-3.

**Consequences (testable):**
- Bookmark icon is visible on expanded Card and Recipe view.
- Tapping toggles between saved (filled) and unsaved (outline).
- Guest users see a login prompt on first save attempt.
- Saved Dishes appear in "My Favorites" section accessible from the main menu.

#### FR-22: My Favorites Screen

A dedicated screen listing all saved Dishes. Sorted by date saved (newest first). Tapping opens the expanded Card. Realizes UJ-3.

**Consequences (testable):**
- "My Favorites" is accessible from the bottom navigation or drawer menu.
- Shows Dish name, photo thumbnail, cook time, and date saved.
- Empty state: "No saved dishes yet. Tap the heart icon on any dish to save it."
- Search/filter within Favorites (by name or Tag).

### 4.7 Settings

**Description:** User-configurable preferences accessible from the main navigation. Realizes cross-cutting personalization.

**Functional Requirements:**

#### FR-23: Preferences Management

User can manage dietary preferences, allergies, disliked ingredients, and preferred cuisines. These influence suggestion relevance.

**Consequences (testable):**
- Dietary preference toggles: vegetarian, vegan, gluten-free, dairy-free, etc.
- Allergy list: user can add/remove allergens (peanuts, shellfish, etc.).
- Disliked ingredients list: user can add ingredients to exclude from suggestions.
- Preferred cuisines: multi-select (Vietnamese, Chinese, Italian, etc.).
- Changes apply immediately to subsequent searches.

#### FR-24: Notification Settings

User can enable/disable meal time reminders and daily suggestions.

**Consequences (testable):**
- Toggle: "Breakfast reminder (7:00 AM)"
- Toggle: "Lunch reminder (12:00 PM)"
- Toggle: "Dinner reminder (7:00 PM)"
- Toggle: "Daily suggestion (10:00 AM)"
- Notification permission prompt on first enable.

#### FR-25: Measurement Units

User can choose between metric (grams, ml) and imperial (cups, ounces). Default = metric.

**Consequences (testable):**
- Toggle in Settings: Metric / Imperial.
- All ingredient quantities in recipes and shopping lists reflect the choice.
- Default for Vietnamese users = metric.

#### FR-26: Privacy Controls

User can view and delete their data. Options: clear search history, clear Favorites, delete account.

**Consequences (testable):**
- "Clear search history" removes all search history (local + cloud).
- "Clear all Favorites" removes all saved dishes.
- "Delete account" removes user account and all associated cloud data.
- All destructive actions show a confirmation dialog.

#### FR-27: Theme Selection

User can choose between light mode, dark mode, or system default.

**Consequences (testable):**
- Three options: Light, Dark, System Default.
- Theme changes apply immediately without restarting the app.

## 5. Non-Goals (Explicit)

- This app will **not** provide in-app food ordering or payment processing.
- This app will **not** integrate with e-receipts, grocery store loyalty accounts, or smart fridge APIs.
- This app will **not** support swipe-based (Tinder-style) dish discovery.
- This app will **not** function as a full nutritional tracker (calorie counting only at dish level).
- This app will **not** provide meal delivery subscriptions or scheduled meal kits.
- This app will **not** have a web/desktop version for MVP.

## 6. MVP Scope

### 6.1 In Scope
- Ingredient input: text, voice, barcode + object recognition camera
- Quantity adjustment for ingredients
- Food Type Tags + optional Mood Tags + Cooking Time Filter
- Collapsible Card list with sorting
- Visual Cooking Timeline with total cooktime
- Calorie estimation per serving
- Shopping List generation
- Surprise Me button
- Trending feed (API + web-scraped)
- Distance-based discovery (Google Maps/Places) with configurable radius
- Price filter
- Guest Mode with local storage
- User Registration (email + Google OAuth)
- Cloud Sync for Registered Users (Favorites + history)
- My Favorites screen
- Settings: preferences, allergies, disliked ingredients, cuisines, notifications, units, privacy, theme
- Serving Size slider (on expanded Card + Recipe)
- Fridge-Clearing Mode (prioritize by expiration)
- Bilingual UI (Vietnamese + English)

### 6.2 Out of Scope for MVP
- Weekly Meal Prep Planner — deferred to v2
- Community/UGC dish submission and moderation — deferred to v2. Requires review system.
- Apple Sign-In — deferred; added if App Store policy requires it.
- Push notification customization (beyond basic meal reminders) — deferred.
- Social features (share dishes with friends, comments, ratings) — deferred.
- Advanced ML-powered ingredient substitution suggestions — deferred.

## 7. Success Metrics

**Primary**
- **SM-1**: Weekly Active Users (WAU) — target: maintain 50% retention after 4 weeks. Validates overall product-market fit.
- **SM-2**: Search-to-Recipe conversion — % of ingredient searches that result in a Recipe view. Target: >40%. Validates FR-1 through FR-10.

**Secondary**
- **SM-3**: Favorites-to-return ratio — % of users who save a Dish and return to it within 7 days. Target: >20%. Validates FR-21, FR-22.
- **SM-4**: Surprise Me engagement — average taps per session on Surprise Me button. Target: >2 taps per session among users who discover the feature. Validates FR-13.

**Counter-metrics (do not optimize)**
- **SM-C1**: Notification opt-out rate — if notification toggles cause >30% of users to disable all notifications, the cadence or value of suggestions needs review. Counterbalances FR-24.

**Proxy (no survey)**
- **SM-5**: Result-to-Recipe speed — % of searches where user taps "View Recipe" within 10 seconds of seeing results. Proxy for "found what they wanted." Target: >50%. Validates FR-1 through FR-10.

## 8. Open Questions

1. **API provider selection** — Spoonacular vs Edamam vs custom scraping for recipe + nutrition data. Decision needed before development begins. (Owner: team)
2. **Google Maps/Places API cost** — Distance-based discovery requires Google Places API, which is not free at scale. Need to estimate usage quotas and cost tolerance. (Owner: team)
3. **Barcode database** — Which barcode/product database to use for camera ingredient lookup? (e.g., Open Food Facts, custom DB). (Owner: team)
4. **Object recognition model** — On-device vs cloud-based ML for food recognition? On-device (TensorFlow Lite / CoreML) is slower but works offline. (Owner: team)
5. **Backend architecture** — BFF + cloud DB (Firebase? Supabase? Custom?) for auth + sync. Decision needed. (Owner: team)
6. **Web-scraping legality / terms** — Scraping Vietnamese recipe sites — need to verify terms of service and legal compliance. (Owner: team)
7. **Web scraping robots.txt and rate-limiting policy** — Whether the scraper must strictly follow robots.txt or use a looser policy. Rate-limit thresholds per site. (Owner: team)
8. **Notification permission timing** — When to prompt for notification permission? On first-launch vs on first Settings visit vs on first meal reminder toggle. (Owner: team/UX)

## 9. Assumptions Index

- **A-1** (§4.1, FR-3): If camera permission is denied, app falls back to text-only input mode.
- **A-2** (§4.3, FR-11): Nutrition data sourced from the same API provider as recipes (e.g., Spoonacular/Edamam). If unavailable, display "Calorie data not available."
- **A-3** (§4.4, FR-14): Trending data refreshes daily. Source list of websites is configurable.
- **A-4** (§4.4, FR-15): Google Places API key required. Restaurant menu data depends on Google's coverage in target area.
- **A-5** (§4.5, FR-19): Only email/password + Google OAuth for MVP. Apple Sign-In added for iOS if required by App Store policy.
