const MAX_INGREDIENTS = 20;

export function parseIngredients(input: string): string[] {
  const rawItems = input
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (rawItems.length === 0) {
    return [];
  }

  const deduped: string[] = [];
  const seen = new Set<string>();

  for (const item of rawItems) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }

  if (deduped.length > MAX_INGREDIENTS) {
    return [];
  }

  return deduped;
}
