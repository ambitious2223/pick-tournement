import { useState, type ReactNode } from "react";
import type { Item } from "../../shared/types.ts";

const TILE_COLORS = ["#22d3ee", "#a855f7", "#fb7185", "#a3e635", "#f59e0b", "#38bdf8"];

function colorFor(seed: string): string {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  return TILE_COLORS[hash % TILE_COLORS.length] ?? TILE_COLORS[0]!;
}

function Tile({ item, size }: { item: Item; size: number }): ReactNode {
  const label = item.emoji ?? item.name.slice(0, 1).toUpperCase();
  return (
    <div
      style={{ width: size, height: size, background: `color-mix(in srgb, ${colorFor(item.id)} 22%, #0d1226)` }}
      className="grid place-items-center rounded-2xl border border-line text-[5rem] font-black leading-none"
    >
      {label}
    </div>
  );
}

export function ItemVisual({ item, size = 220 }: { item: Item | null; size?: number }): ReactNode {
  const [broken, setBroken] = useState(false);

  if (!item) {
    return (
      <div style={{ width: size, height: size }} className="grid place-items-center rounded-2xl border border-dashed border-line text-white/30">
        TBD
      </div>
    );
  }

  if (item.image && !broken) {
    return (
      <img
        src={item.image}
        alt={item.name}
        style={{ width: size, height: size }}
        className="rounded-2xl border border-line object-cover"
        loading="lazy"
        onError={() => setBroken(true)}
      />
    );
  }

  return <Tile item={item} size={size} />;
}
