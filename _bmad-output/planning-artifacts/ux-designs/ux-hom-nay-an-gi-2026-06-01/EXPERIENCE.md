---
name: Hôm Nay Ăn Gì
status: final
sources:
  - imports/v4-open-design/index.html
  - imports/v4-open-design/css/system.css
  - imports/v4-open-design/js/screens.js
  - imports/v4-open-design/screens/01-home.html
  - imports/v4-open-design/screens/02-results.html
  - imports/v4-open-design/screens/03-recipe.html
  - imports/v4-open-design/screens/04-discover.html
  - imports/v4-open-design/screens/05-favorites.html
  - imports/v4-open-design/screens/06-shopping-list.html
  - imports/v4-open-design/screens/07-login.html
updated: 2026-06-01
---

> **Key-screen HTML mocks:** See `mockups/01-home.html` through `mockups/07-login.html`. These are 1:1 behavioral and visual references implementing the design system defined in `DESIGN.md`. Spine tables win on any conflict with mockups.

# Hôm Nay Ăn Gì — Experience Spine

## Foundation

**Form-factor:** Mobile-first web application, phone-frame canvas (390×844 aspect ratio), single-surface mobile (iOS/Android). `DESIGN.md` is the visual identity reference; this spine owns behavioral and interaction decisions.

**UI system:** Custom CSS design system defined in `system.css` with OKLCH tokens. No framework dependency — lightweight, CSS-driven components with vanilla JS for interactivity.

**Primary input modalities:** Text (keyboard), voice (microphone), camera (barcode + object recognition). Text is the default; voice and camera are supplementary triggers in the input field.

**Navigation:** Fixed 4-tab bottom bar — **Trang chủ** (Home), **Khám phá** (Discover), **Yêu thích** (Favorites), **Cá nhân** (Profile/Login). Tab bar is present on root-level screens; absent during login flow (single-purpose screen).

## Information Architecture

| # | Surface | Tab / Flow | Purpose |
|---|---------|------------|---------|
| 01 | Home — Input | Tab 1 — Trang chủ | Ingredient entry + food-type chips + cuisine filter + cook time + Surprise Me |
| 02 | Results | Tab 1 → after search | Collapsible Card list of matching dishes, sorted by relevance |
| 03 | Recipe | Results tap → Recipe | Full recipe with visual timeline, serving adjuster, ingredient list, shopping list link |
| 04 | Discover | Tab 2 — Khám phá | Location-aware trending + nearby dishes, cuisine + price filters |
| 05 | Favorites | Tab 3 — Yêu thích | Saved dishes list with search and remove |
| 06 | Shopping List | Recipe → Shopping List | Checkable list of owned vs missing ingredients, save/copy |
| 07 | Login | Tab 4 — Cá nhân | Email/password login, guest mode skip, benefits card |

Screen flow:
```
Home → Results → Recipe → Shopping List
  ↓
Discover → Recipe (external link for restaurant dishes)
  ↓
Favorites → Recipe
  ↓
Login (profile tab, or prompted at bookmark)
```

## Voice and Tone

**Microcopy.** Brand voice lives in `DESIGN.md.Brand & Style`.

| Context | Vietnamese | English equivalent |
|---------|------------|--------------------|
| App title | Hôm Nay Ăn Gì | What to Eat Today |
| Ingredient prompt | Nhập nguyên liệu bạn có — để tôi gợi ý món ngon | Enter what you've got — I'll suggest a dish |
| Input placeholder | Gõ nguyên liệu, ví dụ: thịt gà, bông cải, trứng | e.g., chicken, broccoli, eggs |
| Search CTA | Tìm món | Find dishes |
| Surprise Me | Bất ngờ! | Surprise Me! |
| Results count | Tìm thấy X món phù hợp | Found X matching dishes |
| Sort options | Phù hợp nhất / Ít calo nhất / Nấu nhanh nhất | Best match / Lowest cal / Fastest |
| Recipe actions | Xem công thức / Mua sắm | View recipe / Shopping |
| Save feedback | Đã lưu vào Yêu thích | Saved to Favorites |
| Shopping list header | Danh sách mua sắm | Shopping List |
| Owned items | Bạn đã có | You have |
| Missing items | Cần mua thêm | Need to buy |
| Guest mode | Đăng nhập để lưu món yêu thích và đồng bộ dữ liệu của bạn | Log in to save favorites and sync your data |
| Guest CTA | Tiếp tục mà không đăng nhập | Continue without logging in |
| Tips label | Mẹo tiết kiệm | Savings tip |
| Copy action | Sao chép | Copy |
| Empty favorites | Chưa có món yêu thích | No saved dishes yet |
| Empty CTA | Khám phá món ngay | Discover dishes now |

**Tone principles:**
- Warm, casual, food-centered — not corporate or robotic
- Vietnamese as primary language; English as secondary toggle
- Short, actionable microcopy — never explanatory paragraphs
- Use emoji sparingly and with purpose (📸 for image placeholders, 🛒 for shopping, 🔥 for trending)

## Component Patterns

*Behavioral. Visual specs in `DESIGN.md.Components`.*

| Component | Surface(s) | Behavioral rules |
|-----------|------------|-----------------|
| Ingredient input | Home | Text field with mic icon (left) and camera icon (right) inset. Comma-separated parsing. Max 20 ingredients. Entered ingredients render as removable chips below the field. |
| Ingredient chip | Home | Appears below input as user types/completes ingredients. Each chip has a ✕ remove button. Clicking ✕ removes the chip from the list. |
| Food type chip row | Home | Horizontal scrollable row. Toggleable (tap to select/deselect). Multiple simultaneous (AND logic). Active: `--accent-dim` background. Always-visible. |
| Cuisine chip row | Home | Below food type. Same toggle behavior. Default: Việt Nam active. |
| Mood tags | Home | Expandable collapsible section ("Cảm giác thèm"). Hidden by default. Tap the header to expand/collapse. Chevron indicator rotates on toggle. |
| Cooking time chips | Home | Preset chips: 15 / 30 / 60 / 90+ phút. Single-select (range). Default: 30 phút active. |
| Search button | Home | Full-width primary button. Disabled when 0 ingredients. Tap navigates to Results. |
| Surprise Me button | Home | Secondary button next to Search. Tap navigates to Results with a random dish query. |
| Result card (compact) | Results | Tap to expand in place. Shows dish name + match badge + cook time + calories. Only one card expanded at a time (accordion behavior). |
| Result card (expanded) | Results | Reveals photo placeholder, cuisine chips, action buttons (View Recipe, Shopping, Save). Tap again or tap another card to collapse. |
| Sort dropdown | Results | Inline select element. Options: Best match (default), Lowest cal, Fastest, Dish type. Re-sorts list in place. |
| Recipe hero | Recipe | Full-width 16:9 image placeholder, dish name, cook time, calorie display, cuisine chips, save button. |
| Serving adjuster | Recipe | − / + buttons flanking a numeric display. Range: 1–10. Default: 2. Scales ingredient quantities and calorie count in real time. |
| Ingredient list | Recipe | Two sections visually separated by color: owned ingredients (default text color), missing ingredients (accent color with ⚠️ indicator). |
| Timeline | Recipe | Vertical dot-and-bar timeline. Each step: dot, label, duration text. Visual bar connects steps. |
| Shopping list CTA | Recipe | Two buttons: "Danh sách mua sắm" (primary, navigates to shopping page), "Sao chép" (secondary, copies recipe text). |
| Trending dish grid | Discover | 2-column grid of dish cards. Each card: image placeholder, dish name, restaurant name, rating, price range. |
| Nearby list | Discover | Vertical list of restaurant cards. Each: thumbnail, name, distance, rating, price. |
| Cuisine filter (Discover) | Discover | Scrollable chip row. Active: filled. Multi-select. |
| Price filter (Discover) | Discover | Chip row. Active: filled. Multi-select. Options: Under 50k / 50k–100k / 100k–200k / Over 200k. |
| Location display | Discover | Card-style row showing current district. "Thay đổi" (Change) button triggers location update. |
| Tab selector (Discover) | Discover | Chip row: Tất cả / Đang thịnh hành / Gần tôi / Món mới / Đánh giá cao. Single-select. |
| Favorite item | Favorites | Horizontal card with thumbnail, name, cook time, calories, cuisine chips, filled-heart remove button. |
| Favorites search | Favorites | Input field with 🔍 icon. Filters list client-side by matching text content. Real-time as user types. |
| Favorite remove | Favorites | Tap the filled-heart button. Triggers scale-down + fade-out animation (200ms), then removes the DOM element and shows a toast. |
| Empty favorites | Favorites | Shown when all items removed or none exist. Large heart icon, title, description, CTA button to Discover. |
| Shopping list header | Shopping List | Recipe reference card: thumbnail, name, servings, cook time. |
| Owned items section | Shopping List | "Bạn đã có" — items with checked checkboxes. Pre-filled from ingredient input. |
| Missing items section | Shopping List | "Cần mua thêm 🛒" — items with unchecked checkboxes. Tap to toggle checked state. |
| Tip card | Shopping List | Accent-tinted card with savings suggestion. Static content — not contextual yet. |
| Save list button | Shopping List | "Lưu danh sách" primary full-width button. Shows toast on save. |
| Copy list button | Shopping List | "Sao chép" ghost button in top bar. Copies list to clipboard. |
| Login form | Login | Email + password input fields. "Đăng nhập" primary button. |
| Guest mode | Login | "Tiếp tục mà không đăng nhập" secondary button. Sets localStorage flag, navigates to Home. |
| Benefits card | Login | Accent-tinted card listing login benefits (sync, smarter suggestions, saved shopping lists). |
| Registration link | Login | "Đăng ký" text link below form. Currently shows toast: coming soon. |
| Tab bar | All root screens | 4 fixed tabs. Active tab uses `--accent` color. Tap navigates to the corresponding screen. |
| Back button | Results, Recipe, Shopping List, Login | "‹" character in top bar. Navigates to previous screen. |
| Status bar | All screens | Simulated iOS status bar: time left, signal/battery icons right. Fixed at top. Styling only (no interaction). |
| Toast | All screens | Transient feedback for save, copy, login, guest, voice, camera actions. Auto-dismiss after 2 seconds. Fade in/out. |

## State Patterns

| State | Surface | Treatment |
|-------|---------|-----------|
| Cold open | Home | Empty input field. Placeholder: "Gõ nguyên liệu, ví dụ: thịt gà, bông cải, trứng". No ingredient chips. Default filters active. Search button enabled. |
| 0 ingredients entered | Home | Search button enabled (can search with just filters). Search with 0 ingredients returns all dishes matching filters. |
| Partial input | Home | Ingredient chips appear below field as entered. Chip shows ingredient name with ✕ remove. |
| Mood tags collapsed | Home | "Cảm giác thèm" section header with downward chevron. Body hidden. Tap expands. |
| Results loading | Results | No skeleton/loading state in v4 prototype. [ASSUMPTION: Production should show skeleton cards.] |
| Results empty | Results | "Không còn món nào để hiển thị" text at bottom of list. (End-of-list marker, not empty state.) |
| Card expanded | Results | Shows photo placeholder, cuisine chips, action buttons. Header shows bottom border. |
| Card collapsed | Results | Header only. Body hidden. No bottom border on header. |
| Recipe serving adjust | Recipe | −/+, min 1, max 10. Calorie display + ingredient quantities update in real time. Default 2. |
| Missing ingredients | Recipe | Items in accent color with ⚠️ icon. Visually distinct from owned items. |
| Location available | Discover | Shows current district. Trending + nearby sections populated. |
| Location unavailable | Discover | Shows "Đang cập nhật vị trí..." toast on "Thay đổi" tap. [ASSUMPTION: Production should prompt for location permission or manual entry.] |
| Favorites populated | Favorites | List of saved items shown. Search bar visible. |
| Favorites empty | Favorites | "Chưa có món yêu thích" empty state with CTA to Discover. |
| Favorites search results empty | Favorites | No matching items hidden. Empty state shown with "Chưa có món yêu thích" (same as full empty state). [ASSUMPTION: Production should differentiate "no favorites" vs "no search matches".] |
| Shopping list fully checked | Shopping List | All items (owned + missing) toggled checked. Missing items section shows all items as cross-through. |
| Shopping list partial | Shopping List | Owned items pre-checked. Missing items unchecked. |
| Guest mode | Login | "Tiếp tục mà không đăng nhập" option visible. Benefits card shown. |
| Login form empty | Login | Both fields empty. Tap Đăng nhập → toast "⚠️ Vui lòng nhập email và mật khẩu". |
| Login success | Login | Toast "✅ Đăng nhập thành công!", then redirect to Home after 800ms. |
| Guest navigation | Login | Toast "👋 Tiếp tục với tư cách khách", sets localStorage, redirects to Home after 500ms. |
| Registration | Login | "Đăng ký" link shows toast "📝 Chức năng đăng ký sẽ có trong phiên bản tiếp theo". |
| Bookmark save (authenticated) | Recipe / Results | Toast "✅ Đã lưu vào Yêu thích". |
| Bookmark unsave | Favorites | Remove animation + toast "Đã xóa khỏi Yêu thích". |
| Voice input | Home | Toast "🎤 Đang nghe..." |
| Camera input | Home | Toast "📷 Mở camera" |
| Shopping list save | Shopping List | Toast "✅ Đã lưu danh sách mua sắm" |
| Recipe copy | Recipe | Toast "📋 Đã sao chép công thức" |
| Shopping list copy | Shopping List | Toast "📋 Đã sao chép danh sách" |

## Interaction Primitives

- **Tap** to select, navigate, toggle, expand.
- **Tap to expand/collapse** on result cards (accordion: one open at a time).
- **Tap to toggle** on tag chips, list item checkboxes, collapsible sections.
- **Global click delegation** (`document.addEventListener('click', ...)`) handles:
  - Result card expand/collapse
  - Collapsible section toggle
  - List item checkbox toggle
  - Chip active state toggle
- **Toast** for all transient feedback: saves, copies, errors, confirmations.
- **Back navigation** via "‹" button in top bar (prevents browser back confusion in-workspace).
- **Tab navigation** via direct `window.location.href` assignment (prototype uses page loads; production should use client-side routing).
- **No infinite scroll** in v4 prototype. [ASSUPMPTION: Production should implement infinite scroll or pagination for non-trivial result sets.]
- **No pull-to-refresh** in v4 prototype. [ASSUMPTION: Production should add pull-to-refresh on Results and Discover.]

### Banned interactions
- Carousels (all content shown in grid or list)
- Hero animations on open
- Parallax scrolling
- Custom swipe gestures
- Drag-to-reorder
- Long-press for anything except system text selection

## Accessibility Floor

Behavioral. Visual contrast in `DESIGN.md`.

- **Screen readers:** All interactive elements should have `aria-label` where icon-only. Vietnamese content uses `lang="vi"`. System fonts respect dynamic type settings.
- **Tap targets:** Minimum 44×44pt for all interactive elements (tab items, chips, buttons, checkboxes). Ingredient chip remove (✕) is at least 16px with ample surrounding padding.
- **Focus indicators:** Input fields use border-color `--accent` on focus. Tab items have visible active state. Buttons have hover states.
- **Color independence:** Tag selected state = filled background + bold text + border change (not color alone). Checkbox checked = background fill + line-through + color change.
- **Reduce Motion:** Card expansion, chip add, toast, and favorite remove animations should respect `prefers-reduced-motion`. Replace scale/translate with opacity-only.
- **Camera permission:** Explain why camera is needed before triggering OS permission dialog (handled via toast and fallback-to-text behavior in v4 prototype).
- **VoiceOver / TalkBack:** Every button labeled. Input has placeholder. Results announce match percentage and dish name.
- **Dynamic type:** System fonts used throughout. UI must remain legible at largest accessibility text size.

## Key Flows

### KF-1. Anh cooks dinner from leftovers (UJ-1 from PRD)

**Persona:** Anh, 28, living alone in HCMC. Has chicken, broccoli, and eggs in the fridge.

1. Opens app → Home tab. Logo + input field in focus.
2. Types "thịt gà, bông cải, trứng" into the input field.
3. Ingredient chips appear below: "Thịt gà ✕", "Bông cải ✕", "Trứng ✕".
4. Taps food-type chip "Có thịt" (active, pre-selected).
5. Verifies cuisine filter is "Việt Nam" (default active).
6. Cook time: "30 phút" already active (default).
7. Taps **Tìm món** → navigates to Results.
8. Results show 4+ dishes sorted by match %. Top: "Gà xào bông cải — 95%".
9. **Climax:** Taps the card → it expands, showing photo placeholder, "Việt Nam" and "Có thịt" chips, "Xem công thức" button.
10. Taps "Xem công thức" → Recipe view. Sees hero image, 25 min cook time, 380 kcal.
11. Adjusts servings from 2→3 using + button. Calories update to 570 kcal. Ingredient quantities scale.
12. Notes missing ingredients highlighted in accent color (soy sauce, garlic, oil).
13. **Resolution:** Taps "Danh sách mua sắm" → sees checked owned items + unchecked missing items. Taps "Lưu danh sách" → toast confirms save.

> **Edge:** If Anh enters 0 ingredients and taps Search, all dishes matching filters appear. If she enters an ingredient that doesn't exist in the DB, the chip still appears but results will be partial matches.
> **Edge:** If only 1 ingredient entered, match percentages are lower but results still appear.

### KF-2. Minh discovers lunch near his office (UJ-2 from PRD)

**Persona:** Minh, 32, District 1 HCMC, on lunch break. Wants something new nearby.

1. Opens app → taps **Khám phá** tab.
2. Location card shows "Quận 1, TP. Hồ Chí Minh" with a "Thay đổi" button.
3. Below: trending tab selector — "Tất cả" active.
4. Trending grid shows 4 dishes: Phở bò, Bún chả, Bánh mì thịt, Cà phê sữa đá.
5. Each card: image placeholder, restaurant name, star rating, price range in VND.
6. Scrolls down to "Gần tôi" section: 3 restaurant cards with name, distance, rating, price.
7. **Climax:** Taps "Bún bò Huế — 0.8km" → navigates to Recipe view.
8. (In v4 prototype, Discover cards link to Recipe; in production this should show restaurant detail with external link to delivery partner.)
9. **Resolution:** Returns to Discover, adjusts cuisine filter to "🇮🇹 Ý" to explore non-Vietnamese options.

> **Edge:** If location is unavailable, "Thay đổi" triggers a toast rather than a permission prompt. Production should request GPS permission with explanation.
> **Edge:** Tapping a dish card in Discover navigates to Recipe — the same recipe screen used for ingredient-based dishes. If the dish is from a restaurant, a different detail surface with external ordering link should be shown in production.

### KF-3. Lan saves a dish for later (UJ-3 from PRD)

**Persona:** Lan, 25, browsing at home. Not logged in.

1. Opens app → Home tab. Searches for ingredients, gets results.
2. Finds "Gà xào bông cải", expands the card, taps ♡ (save/bookmark).
3. Toast: "✅ Đã lưu vào Yêu thích" — but Lan is guest, so this is stored in-memory only (in v4 prototype, save works regardless of auth state with no prompt).
4. **Climax:** Taps **Yêu thích** tab → sees saved dish in the list with filled heart.
5. Taps the filled heart on the saved item → remove animation plays, item disappears, toast: "Đã xóa khỏi Yêu thích".
6. **Resolution:** After removing all items, empty state appears: "Chưa có món yêu thích" with CTA "Khám phá món ngay".

> **EDGE - Auth enforcement:** The v4 prototype does not enforce login for bookmarks. Per PRD UJ-3, guest users who bookmark should see a login prompt. The login enforcement should be added in production — guest bookmark triggers the Login screen or a prompt sheet.
> **Edge:** Favorites search filters the list in real-time. If search yields no results, the empty state shows (same visual as "no favorites" — should differentiate in production with "Không tìm thấy món nào" messaging).

### KF-4. First-time user registers (Account creation)

**Persona:** Huy, 30, first time using the app. Wants to sync data across devices.

1. Opens app → taps **Cá nhân** tab → sees Login screen.
2. Reads the benefits card: sync favorites, smarter suggestions, saved shopping lists.
3. Instead of logging in, taps "Tiếp tục mà không đăng nhập" → toast + redirect to Home.
4. Later, taps ♡ on a dish → (in production) sees login prompt → returns to Cá nhân tab.
5. **Climax:** Enters email + password. Taps "Đăng nhập". Form validates → toast "✅ Đăng nhập thành công!" → redirects to Home.
6. **Resolution:** Now authenticated, bookmark actions persist and sync.

> **Edge:** Empty form submission shows a validation toast. Registration ("Đăng ký") is placeholder — shows "coming in next version" toast.
> **Edge:** Password field uses `type="password"` for masked input. No "show password" toggle in v4.

## Responsive & Platform

- **Primary canvas:** 390×844 (iPhone 14 Pro class). App shell max-width 430px, centered.
- **No tablet/desktop layout** in v4 prototype. Production should implement responsive scaling with centered max-width container for larger screens.
- **Safe areas:** Tab bar reserves 20px bottom padding for iOS home indicator. Status bar is simulated (12px top padding).
- **Platform conventions:** iOS-style status bar, back button as ‹ (not a system back). In production, use platform-native navigation where possible.

## Inspiration & Anti-patterns

### Inspiration
- **Cooky.vn** — Vietnamese food focus, warm photography, local market feel.
- **GrabFood** — Clean card-based results, distance + price inline, Vietnamese UI mastery.
- **Paprika** — Excellent recipe view with ingredient list + step-by-step; clean information density.

### Anti-patterns (confirmed from brainstorming)
- **Tinder-style swipe** — Users need overview of options, not serial one-at-a-time.
- **Gamification** — Not a habit app; users open it when hungry, not for a streak.
- **Social feeds** — Discovery is about food, not about other users.
- **Cold greys** — Warm neutrals only; no blue-grey or cool grey in the palette.
- **Modal dialogs for confirmations** — Toast is sufficient for all transient feedback.
