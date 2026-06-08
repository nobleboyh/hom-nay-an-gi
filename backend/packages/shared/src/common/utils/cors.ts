export function parseCorsOrigins(rawOrigins: string): string[] {
  return rawOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}
