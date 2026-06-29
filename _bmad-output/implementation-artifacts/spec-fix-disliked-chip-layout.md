---
title: 'Fix disliked ingredient chip layout'
type: 'bugfix'
created: '2026-06-29'
status: 'done'
route: 'one-shot'
context: []
---

# Fix disliked ingredient chip layout

## Intent

**Problem:** The removable chips in the Profile settings sections could stretch into oversized circular bubbles on web, making the "Món không thích" UI look broken and harder to scan.

**Approach:** Keep the change local to the Profile screen by anchoring wrapped chip rows to their intrinsic height so removable chips render as compact inline pills.

## Suggested Review Order

1. [../../frontend/app/(tabs)/profile.tsx](../../frontend/app/(tabs)/profile.tsx) - confirm wrapped chip rows now align children to `flex-start`.
