import type { Category, Item } from "../shared/types.ts";

export function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesKey(msg: string, key: string): boolean {
  if (!key) return false;
  return key === msg || msg.startsWith(`${key} `) || msg.endsWith(` ${key}`) || msg.includes(` ${key} `);
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
      if (matchesKey(msg, key)) {
        if (!best || key.length > best.len) best = { id: item.id, len: key.length };
        break;
      }
    }
  }
  return best?.id ?? null;
}

/** Matches a chat message to a category by its name (English or Arabic). */
export function matchCategory(text: string, categories: Category[]): string | null {
  const msg = normalize(text);
  if (!msg) return null;

  let best: { id: string; len: number } | null = null;
  for (const category of categories) {
    const keys = [normalize(category.name), normalize(category.nameAr ?? "")].filter((k) => k.length > 0);
    for (const key of keys) {
      if (matchesKey(msg, key)) {
        if (!best || key.length > best.len) best = { id: category.id, len: key.length };
        break;
      }
    }
  }
  return best?.id ?? null;
}
