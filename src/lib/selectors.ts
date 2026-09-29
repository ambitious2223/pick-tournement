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

export function activeMatch(state: SessionState | null) {
  if (!state?.tournament) return null;
  return engineCurrentMatch(state.tournament);
}

export function activeItems(state: SessionState | null): { a: Item | null; b: Item | null } {
  const category = activeCategory(state);
  const match = activeMatch(state);
  return { a: getItem(category, match?.a), b: getItem(category, match?.b) };
}
