import type { ReactNode } from "react";

export function VoteBar({ votesA, votesB }: { votesA: number; votesB: number }): ReactNode {
  const total = votesA + votesB;
  const pctA = total === 0 ? 50 : Math.round((votesA / total) * 100);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-8 overflow-hidden rounded-full border border-line bg-ink-2">
        <div
          className="flex items-center justify-start bg-gradient-to-r from-brand to-brand/60 pl-3 text-sm font-black text-ink transition-all duration-300"
          style={{ width: `${pctA}%` }}
        >
          {pctA >= 12 ? `${pctA}%` : ""}
        </div>
        <div
          className="flex items-center justify-end bg-gradient-to-l from-brand-2 to-brand-2/60 pr-3 text-sm font-black text-white transition-all duration-300"
          style={{ width: `${100 - pctA}%` }}
        >
          {100 - pctA >= 12 ? `${100 - pctA}%` : ""}
        </div>
      </div>
      <div className="flex justify-between px-1 text-xs text-white/50">
        <span>{votesA} votes</span>
        <span>{total} total</span>
        <span>{votesB} votes</span>
      </div>
    </div>
  );
}
