import type { Category, Item, SessionState } from "../../shared/types.ts";
import { currentMatch as engineCurrentMatch } from "../../engine/tournament.ts";

export function getCategory(state: SessionState | null, id: string | undefined): Category | null {
  if (!state || !id) return null;
  return state.categories.find((c) => c.id === id) ?? null;
}

export function getItem(category: Category | null, id: string | null | undefined): Item | null {
  if (!category || !id) return null;
  return category.items.find((i) => i.id === id) ?? null;
}

export function activeCategory(state: SessionState | null): Category | null {
  return getCategory(state, state?.tournament?.categoryId);
}

export function categoryName(category: Category | null | undefined, lang: "ar" | "en"): string {
  if (!category) return "";
  return lang === "ar" && category.nameAr ? category.nameAr : category.name;
}

const ARABIC_RE = /[\u0600-\u06FF]/;

/**
 * The display name for an item. Item names are stored in Latin, while the
 * Arabic name lives in `aliases` (that's also what viewers type to vote). When
 * Arabic is active we show the Arabic alias so the screen matches the chat.
 */
export function itemName(item: Item | null | undefined, lang: "ar" | "en"): string {
  if (!item) return "";
  if (lang === "ar") {
    const arabic = item.aliases.find((alias) => ARABIC_RE.test(alias));
    if (arabic) return arabic;
  }
  return item.name;
}

export function activeMatch(state: SessionState | null) {
  if (!state?.tournament) return null;
  return engineCurrentMatch(state.tournament);
}

export function activeItems(state: SessionState | null): { a: Item | null; b: Item | null } {
  const category = activeCategory(state);
  const match = activeMatch(state);
  return { a: getItem(category, match?.a), b: getItem(category, match?.b) };
}
