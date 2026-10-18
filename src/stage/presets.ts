import type { Category, Gift, Item } from "../../shared/types.ts";

export type StageVariant = "overlay" | "control";

export interface Preset {
  visual: string;
  emoji: string;
  namePx: number;
  votePx: number;
  bar: string;
  gap: string;
  barMax: string;
}

export const PRESETS: Record<StageVariant, Preset> = {
  overlay: {
    visual: "aspect-square w-full max-w-[calc(43vw*var(--stage-scale,1))] min-w-[160px]",
    emoji: "text-[calc(10vh*var(--stage-scale,1))]",
    namePx: 60,
    votePx: 96,
    bar: "h-16",
    gap: "gap-6",
    barMax: "",
  },
  control: {
    visual: "h-[clamp(9rem,16vw,14rem)] w-[clamp(9rem,16vw,14rem)]",
    emoji: "text-[clamp(2.75rem,5.5vw,4.25rem)]",
    namePx: 24,
    votePx: 36,
    bar: "h-9",
    gap: "gap-6",
    barMax: "max-w-4xl",
  },
};

export function clampScale(value: number | undefined): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(3, Math.max(0.6, value as number));
}

/** The gift shown on a card: the item's own, else the category's side pair. */
export function giftFor(item: Item | null, category: Category | null, side: "a" | "b"): Gift | null {
  if (item?.gift) return item.gift;
  return category?.giftPair?.[side === "a" ? 0 : 1] ?? null;
}
