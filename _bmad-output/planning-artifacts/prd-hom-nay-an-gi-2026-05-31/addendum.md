# Addendum — Hôm Nay Ăn Gì PRD

*Supplementary context, options-considered, and technical notes.*

## API Provider Options Considered

| Provider | Pros | Cons |
|----------|------|------|
| **Spoonacular** | Rich recipe DB + nutrition data, well-documented API, supports ingredient parsing | Limited free tier (150 req/day), paid plans start at $25/month |
| **Edamam** | Strong nutrition analysis, good recipe API, supports diet filters | Smaller recipe DB, pricing per API call |
| **USDA FoodData Central** | Free, authoritative nutrition data | No recipes, only nutritional info — must be paired with a recipe source |
| **Custom scraping** | Full control, no per-call costs, can target Vietnamese sites | Maintenance burden, legal compliance needed, no structured data |

## Camera Recognition Approaches

| Approach | Pros | Cons |
|----------|------|------|
| **Barcode scanning** (ML Kit / ZXing) | Fast, reliable, works offline for common databases | Only works for packaged items; no fresh produce |
| **Object recognition** (TensorFlow Lite / CoreML) | Recognizes fresh ingredients, no barcode needed | Slower, less accurate, requires training data for Vietnamese produce |
| **Hybrid** (both) | Covers all ingredient types | More complex implementation; recommended approach |

## Google Places API Cost Notes

- Google Places API (Nearby Search) costs ~$32 per 1000 requests (SKU: Nearby Search).
- For MVP with limited users, cost is manageable.
- If scaling, consider caching restaurant results per area with a TTL.
- Alternative: use GrabFood/ShopeeFood's own APIs if available (not confirmed for MVP).

## Web Scraping Target Ideas

- Cooky.vn
- Monngonmoingay.com
- Bepxua.vn
- General Vietnamese food blogs and recipe sites

*Needs legal verification before implementation.*
