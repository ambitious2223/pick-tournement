import { useState, type ReactNode } from "react";
import type { Item } from "../../shared/types.ts";
import { useI18n } from "../i18n/index.tsx";

const TILE_COLORS = ["#22d3ee", "#a855f7", "#fb7185", "#a3e635", "#f59e0b", "#38bdf8"];

function colorFor(seed: string): string {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  return TILE_COLORS[hash % TILE_COLORS.length] ?? TILE_COLORS[0]!;
}

export function ItemVisual({
  item,
  className = "",
  emojiClassName = "text-6xl",
}: {
  item: Item | null;
  className?: string;
  emojiClassName?: string;
}): ReactNode {
  const { t } = useI18n();
  const [broken, setBroken] = useState(false);

  if (!item) {
    return (
      <div className={`grid place-items-center rounded-xl border border-dashed border-line text-white/30 ${className}`}>
        {t("common.tbd")}
      </div>
    );
  }

  if (item.image && !broken) {
    return (
      <img
        src={item.image}
        alt={item.name}
        className={`rounded-xl object-cover ${className}`}
        loading="lazy"
        onError={() => setBroken(true)}
      />
    );
  }

  const label = item.emoji ?? item.name.slice(0, 1).toUpperCase();
  return (
    <div
      style={{ background: `color-mix(in srgb, ${colorFor(item.id)} 22%, #0d1226)` }}
      className={`grid place-items-center rounded-xl border border-line font-black leading-none ${emojiClassName} ${className}`}
    >
      {label}
    </div>
  );
}
