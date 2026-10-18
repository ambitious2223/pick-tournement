import type { Category, Item, Lang, SessionState } from "../../shared/types.ts";
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

/**
 * Display names. Each language library stores its own names, so these simply
 * return the stored name. The `lang` argument is kept for call-site symmetry.
 */
export function categoryName(category: Category | null | undefined, _lang: Lang): string {
  if (!category) return "";
  return category.name;
}

const ARABIC_RE = /[\u0600-\u06FF]/;

/**
 * The display name for an item. In the Arabic library the name is Arabic. As a
 * safety net for not-yet-migrated data, fall back to an Arabic alias or the
 * dedicated `nameAr` when the stored name is still Latin.
 */
export function itemName(item: Item | null | undefined, lang: Lang): string {
  if (!item) return "";
  if (lang === "ar" && !ARABIC_RE.test(item.name)) {
    if (item.nameAr) return item.nameAr;
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

/**
 * The effective match length in seconds, mirroring the server's resolution:
 * queue override → category override → per-round default → global fallback.
 */
export function roundSecondsFor(state: SessionState): number {
  const entry = state.queue[state.queueIndex];
  const override = entry?.roundSecondsOverride;
  const categoryOverride = activeCategory(state)?.roundSeconds;
  const match = activeMatch(state);
  const byRound = match ? state.settings.roundSecondsByRound?.[match.round] : undefined;
  return override ?? categoryOverride ?? byRound ?? state.settings.roundSeconds;
}
