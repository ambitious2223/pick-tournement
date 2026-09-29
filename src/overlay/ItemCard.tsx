import type { ReactNode } from "react";
import type { Gift, Item } from "../../shared/types.ts";
import { ItemVisual } from "./ItemVisual.tsx";

export function ItemCard({
  item,
  votes,
  gift,
  side,
  state,
  size,
  emojiClass,
  nameClass = "text-2xl",
  voteClass = "text-4xl",
}: {
  item: Item | null;
  votes: number;
  gift: Gift | null;
  side: "a" | "b";
  state: "normal" | "leading" | "winner" | "losing";
  size: string;
  emojiClass: string;
  nameClass?: string;
  voteClass?: string;
}): ReactNode {
  const isWinner = state === "winner";
  const dim = state === "losing";
  const ring = isWinner ? "ring-lime" : state === "leading" ? (side === "a" ? "ring-brand" : "ring-brand-2") : "ring-line";
  const glow = state === "leading" ? (side === "a" ? "glow-a" : "glow-b") : "";

  return (
    <div className={`animate-rise flex flex-col items-center gap-2 ${dim ? "opacity-40" : ""}`}>
      <div className={`relative shrink-0 ${size}`}>
        <div className={`h-full w-full overflow-hidden rounded-xl ring-2 ${ring} ${glow}`}>
          <ItemVisual item={item} className="h-full w-full" emojiClassName={emojiClass} />
        </div>
        {gift ? (
          <div className="absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-line bg-ink px-2 py-0.5 text-xs">
            <span>{gift.icon}</span>
            <span className="text-white/70">{gift.name}</span>
          </div>
        ) : null}
      </div>
      <div className={`shadow-text mt-2 max-w-[16rem] truncate text-center font-black ${nameClass}`}>{item?.name ?? "TBD"}</div>
      <div className={`shadow-text font-black ${side === "a" ? "text-brand" : "text-brand-2"} ${voteClass}`}>{votes}</div>
    </div>
  );
}
