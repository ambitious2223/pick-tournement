import { useEffect, useRef, useState, type ReactNode } from "react";
import { useI18n } from "../i18n/index.tsx";

export function VoteBar({
  votesA,
  votesB,
  heightClass = "h-8",
  showCounts = true,
  votersA,
  votersB,
}: {
  votesA: number;
  votesB: number;
  heightClass?: string;
  showCounts?: boolean;
  votersA?: number;
  votersB?: number;
}): ReactNode {
  const { t } = useI18n();
  const total = votesA + votesB;
  const pctA = total === 0 ? 50 : Math.round((votesA / total) * 100);
  const leader: "a" | "b" | "tie" = votesA === votesB ? "tie" : votesA > votesB ? "a" : "b";

  const prevLeader = useRef(leader);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (prevLeader.current !== "tie" && leader !== "tie" && prevLeader.current !== leader) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 600);
      prevLeader.current = leader;
      return () => clearTimeout(timer);
    }
    prevLeader.current = leader;
  }, [leader]);

  const voterLine =
    votersA !== undefined && votersB !== undefined
      ? t("stage.totalVoters", { n: total, v: votersA + votersB })
      : t("stage.total", { n: total });

  return (
    <div className="flex w-full flex-col gap-2">
      <div className={`flex overflow-hidden rounded-full border border-line bg-ink-2 ${heightClass} ${pulse ? "animate-pulse-ring" : ""}`}>
        <div
          className="flex items-center justify-start bg-gradient-to-r from-brand to-brand/60 ps-3 text-sm font-black text-ink transition-all duration-300 rtl:bg-gradient-to-l"
          style={{ width: `${pctA}%` }}
        >
          {pctA >= 12 ? `${pctA}%` : ""}
        </div>
        <div
          className="flex items-center justify-end bg-gradient-to-l from-brand-2 to-brand-2/60 pe-3 text-sm font-black text-white transition-all duration-300 rtl:bg-gradient-to-r"
          style={{ width: `${100 - pctA}%` }}
        >
          {100 - pctA >= 12 ? `${100 - pctA}%` : ""}
        </div>
      </div>
      {showCounts ? (
        <div className="flex justify-between px-1 text-xs text-white/50">
          <span>{t("stage.votes", { n: votesA })}</span>
          <span>{voterLine}</span>
          <span>{t("stage.votes", { n: votesB })}</span>
        </div>
      ) : null}
    </div>
  );
}
