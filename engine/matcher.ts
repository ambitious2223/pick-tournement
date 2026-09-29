import type { Item } from "../shared/types.ts";

export function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function keysFor(item: Item): string[] {
  const keys = [normalize(item.name), ...item.aliases.map(normalize)];
  return keys.filter((k) => k.length > 0);
}

export function matchItem(text: string, items: (Item | null)[]): string | null {
  const msg = normalize(text);
  if (!msg) return null;

  let best: { id: string; len: number } | null = null;
  for (const item of items) {
    if (!item) continue;
    for (const key of keysFor(item)) {
      if (key === msg || msg.startsWith(`${key} `) || msg.endsWith(` ${key}`) || msg.includes(` ${key} `)) {
        if (!best || key.length > best.len) best = { id: item.id, len: key.length };
        break;
      }
    }
  }
  return best?.id ?? null;
}
