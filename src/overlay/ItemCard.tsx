import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Gift, Item, SideEffect } from "../../shared/types.ts";
import { useI18n } from "../i18n/index.tsx";
import { itemName } from "../lib/selectors.ts";
import { useNow } from "../lib/live.ts";
import { ItemVisual } from "./ItemVisual.tsx";

export function ItemCard({
  item,
  votes,
  gift,
  side,
  state,
  size,
  emojiClass,
  namePx,
  votePx,
  effect,
}: {
  item: Item | null;
  votes: number;
  gift: Gift | null;
  side: "a" | "b";
  state: "normal" | "leading" | "winner" | "losing";
  size: string;
  emojiClass: string;
  namePx: number;
  votePx: number;
  effect?: SideEffect | null;
}): ReactNode {
  const { t, lang } = useI18n();
  const isWinner = state === "winner";
  const dim = state === "losing";
  const ring = isWinner ? "ring-lime" : state === "leading" ? (side === "a" ? "ring-brand" : "ring-brand-2") : "ring-line";
  const glow = state === "leading" ? (side === "a" ? "glow-a" : "glow-b") : "";

  // Ticks only while a power-up is running, so the badge counts itself down.
  const now = useNow(Boolean(effect));
  const alive = effect && now < effect.until ? effect : null;
  const secs = alive ? Math.max(1, Math.ceil((alive.until - now) / 1000)) : 0;

  // Floating +N when this side's tally jumps (add votes, steal, boost, reset).
  const prevVotes = useRef(votes);
  const popId = useRef(0);
  const [pop, setPop] = useState<{ id: number; delta: number } | null>(null);
  const giftPx = Math.round(namePx * 0.5);
  useEffect(() => {
    const delta = votes - prevVotes.current;
    prevVotes.current = votes;
    if (delta === 0) return;
    popId.current += 1;
    const id = popId.current;
    setPop({ id, delta });
    const timer = setTimeout(() => setPop((current) => (current && current.id === id ? null : current)), 1400);
    return () => clearTimeout(timer);
  }, [votes]);

  return (
    <div className={`animate-rise relative flex flex-col items-center gap-2 ${dim ? "opacity-40" : ""}`}>
      <div className={`relative shrink-0 ${size}`}>
        <div className={`h-full w-full overflow-hidden rounded-xl ring-2 ${ring} ${glow}`}>
          <ItemVisual item={item} className="h-full w-full" emojiClassName={emojiClass} />
        </div>
        {alive ? (
          <div
            className={`absolute top-2 end-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.7rem] font-black shadow-lg backdrop-blur ${
              alive.kind === "boost" ? "bg-lime/90 text-ink" : "bg-hot/90 text-white"
            }`}
          >
            <span>{alive.kind === "boost" ? `⚡ ×${alive.multiplier ?? 2}` : t("effect.block")}</span>
            <span className="opacity-80">
              · {secs}
              {t("effect.secs")}
            </span>
          </div>
        ) : null}
      </div>
      {gift ? (
        <div
          className="flex max-w-full items-center gap-2 rounded-full border border-line bg-ink/95 px-3 py-1 shadow-lg"
          style={{ fontSize: giftPx }}
        >
          {gift.img ? (
            <img src={gift.img} alt="" className="h-[1.5em] w-[1.5em] shrink-0 rounded-full object-contain" />
          ) : (
            <span className="leading-none">{gift.icon}</span>
          )}
          <span className="min-w-0 truncate font-semibold text-white/85">{gift.name}</span>
        </div>
      ) : null}
      <div className="shadow-text mt-2 max-w-[16rem] truncate text-center font-black" style={{ fontSize: namePx }}>
        {item ? itemName(item, lang) : t("common.tbd")}
      </div>
      <div className="relative">
        <div
          className={`shadow-text font-black ${side === "a" ? "text-brand" : "text-brand-2"}`}
          style={{ fontSize: votePx }}
        >
          {votes}
        </div>
        {pop ? (
          <div
            key={pop.id}
            className={`animate-vote-pop pointer-events-none absolute inset-x-0 -top-1 text-center font-black ${
              pop.delta > 0 ? "text-lime" : "text-hot"
            }`}
            style={{ fontSize: Math.round(votePx * 0.42) }}
          >
            {pop.delta > 0 ? `+${pop.delta}` : pop.delta}
          </div>
        ) : null}
      </div>
    </div>
  );
}
