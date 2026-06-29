---
title: 'Fix Home Skip Link Load Flash'
type: 'bugfix'
created: '2026-06-29T09:29:18+0700'
status: 'done'
route: 'one-shot'
---

# Fix Home Skip Link Load Flash

## Intent

**Problem:** The home screen web route showed the skip-navigation link immediately during initial page load instead of keeping it hidden until keyboard focus reached it.

**Approach:** Restrict the skip link to web, keep it in an absolute overlay state for both hidden and focused modes, and preserve focus-to-main-content behavior without shifting the page layout.

## Suggested Review Order

- Start at the web-only skip-link branch that now controls render, focus, and target handoff.
  [`index.tsx:141`](../../frontend/app/(tabs)/index.tsx#L141)

- Check the hidden and visible overlay styles that prevent load-time flashing and layout jumps.
  [`index.tsx:284`](../../frontend/app/(tabs)/index.tsx#L284)

- End with the regression guard covering the web gate and non-relative reveal behavior.
  [`story-1-3.test.mjs:49`](../../frontend/tests/story-1-3.test.mjs#L49)
