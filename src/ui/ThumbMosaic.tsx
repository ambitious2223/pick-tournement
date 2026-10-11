import type { ReactNode } from "react";
import type { Item } from "../../shared/types.ts";
import { ItemVisual } from "../overlay/ItemVisual.tsx";

/**
 * A small 2×2 preview of a category's competitors, so category lists read as
 * visual boards instead of walls of text.
 */
export function ThumbMosaic({
  items,
  className = "",
  tileClass = "h-8 w-8",
}: {
  items: Item[];
  className?: string;
  tileClass?: string;
}): ReactNode {
  const shown = items.slice(0, 4);
  return (
    <div className={`grid shrink-0 grid-cols-2 gap-0.5 ${className}`}>
      {Array.from({ length: 4 }).map((_, i) => {
        const item = shown[i];
        return item ? (
          <ItemVisual key={item.id || i} item={item} className={tileClass} emojiClassName="text-sm" />
        ) : (
          <span key={i} className={`block rounded-xl border border-line/40 bg-ink/40 ${tileClass}`} />
        );
      })}
    </div>
  );
}
