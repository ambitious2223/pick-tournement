import type { ReactNode } from "react";
import type { Item } from "../../shared/types.ts";
import { ItemVisual } from "./ItemVisual.tsx";

export function WinnerReveal({ item, categoryName }: { item: Item | null; categoryName: string }): ReactNode {
  return (
    <div className="animate-slam flex flex-col items-center gap-6 text-center">
      <div className="chip border-lime text-lime">Champion · {categoryName}</div>
      <div className="rounded-3xl border-4 border-lime p-2 shadow-[0_0_80px_-10px_rgba(163,230,53,0.8)]">
        <ItemVisual item={item} size={280} />
      </div>
      <h1 className="text-6xl font-black tracking-tight text-lime">{item?.name ?? "TBD"}</h1>
      <p className="text-white/60">wins the tournament 🏆</p>
    </div>
  );
}
