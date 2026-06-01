# Reconcile — v1 (AI-generated baseline)

**Source:** `versions/v1/`

**Carried forward:**
- Warm Vietnamese market aesthetic (concept reframed with OKLCH palette)
- Platform-native feel (shifted to custom CSS with system fonts — same principle, different execution)
- Text + camera input equal prominence
- Light + dark mode intent (dark mode deferred)

**Dropped:**
- Hex color values (→ OKLCH)
- Platform-native-only typography (→ Söhne/Avenir display + system body)
- 3 tabs + drawer for Settings (→ 4 tabs including Profile/Login)
- Shopping list as bottom sheet (→ full page)

# Reconcile — v2 (Figma spec)

**Source:** `versions/v2 (figma)/`

**Carried forward:**
- Surprise Me button
- Cuisine tags as filter
- Bilingual title pattern
- Card expansion with match %

**Dropped:**
- Surprise Me as hero CTA centerpiece (→ secondary button next to Search)
- Stats section on Home (trending dish count / nearby count)
- Vertical numbered timeline (→ dot-and-bar timeline)
- Fixed typography sizes (→ proportional system)
- Emoji as primary dish image (→ placeholder image with emoji fallback)

# Reconcile — v3 (Loveable/editorial spec)

**Source:** `versions/v3 (loveable)/`

**Carried forward:**
- OKLCH color concept
- 4-tab bottom navigation
- Vietnamese-first copy
- Display + body font separation

**Dropped:**
- Fraunces serif display font (→ Söhne/Avenir Next)
- Inter sans-serif body (→ SF Pro Text/system-ui)
- Ambient clay/sage radial gradients (→ flat colors with border-only depth)
- Editorial cookbook tone (→ warm, straightforward food companion tone)
- `--radius: 1.25rem` base (→ 8/12/18px scale)

# Reconcile — v4 (Open Design)

**Source:** `imports/v4-open-design/`

**This is the primary source.** All v4 decisions form the base of the new spines except where open questions are noted.

**Dropped from v4 (for production consideration):**
- Global click delegation without loading/empty state coverage (production needs skeletons, proper empty states, pull-to-refresh)
- No auth enforcement on bookmark (production should prompt guest login per PRD)
- Discover cards linking directly to Recipe (production needs restaurant detail surface with external delivery link)
- Same empty state for "no favorites" and "no search matches" (production should differentiate)
