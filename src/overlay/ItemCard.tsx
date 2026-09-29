import type { ReactNode } from "react";
import type { Gift, Item } from "../../shared/types.ts";
import { ItemVisual } from "./ItemVisual.tsx";

export function ItemCard({
  item,
  votes,
  gift,
  side,
  state,
}: {
  item: Item | null;
  votes: number;
  gift: Gift | null;
  side: "a" | "b";
  state: "normal" | "leading" | "winner" | "losing";
}): ReactNode {
  const isWinner = state === "winner";
  const dim = state === "losing";
  const ring = isWinner ? "border-lime" : state === "leading" ? (side === "a" ? "border-brand" : "border-brand-2") : "border-line";
  const glow = state === "leading" ? (side === "a" ? "glow-a" : "glow-b") : "";

  return (
    <div className={`panel animate-rise flex flex-col items-center gap-3 p-4 ${glow} ${dim ? "opacity-45" : ""}`}>
      <div className="relative">
        <div className={`rounded-2xl border-2 ${ring}`}>
          <ItemVisual item={item} />
        </div>
        {gift ? (
          <div className="absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-line bg-ink px-3 py-1 text-sm">
            <span>{gift.icon}</span>
            <span className="text-xs text-white/70">{gift.name}</span>
          </div>
        ) : null}
      </div>
      <div className="mt-2 max-w-[15rem] truncate text-center text-2xl font-black">{item?.name ?? "TBD"}</div>
      <div className={`text-4xl font-black ${side === "a" ? "text-brand" : "text-brand-2"}`}>{votes}</div>
    </div>
  );
}
