import type { ReactNode } from "react";
import type { ClockHold } from "../../shared/types.ts";
import { useNow } from "../lib/live.ts";
import { useI18n } from "../i18n/index.tsx";

export function RoundTimer({
  endsAt,
  status,
  totalSeconds,
  hold,
  scale = 1,
}: {
  endsAt: number | null;
  status: string;
  totalSeconds: number;
  hold?: ClockHold | null;
  scale?: number;
}): ReactNode {
  const { t } = useI18n();
  const now = useNow(status === "running");
  const holding = Boolean(hold) && (hold?.until === null || now < (hold?.until ?? 0));
  const frozen = Boolean(holding && hold && hold.until !== null);
  const remaining = holding && hold
    ? hold.remainingMs / 1000
    : endsAt
      ? Math.max(0, (endsAt - now) / 1000)
      : totalSeconds;
  const frac = Math.max(0, Math.min(1, totalSeconds > 0 ? remaining / totalSeconds : 0));
  const size = Math.round(140 * scale);
  const radius = Math.round(56 * scale);
  const circ = 2 * Math.PI * radius;
  const urgent = remaining <= 10 && status === "running" && !frozen;
  const ring = frozen ? "#7dd3fc" : urgent ? "#fb7185" : "#22d3ee";
  const label = frozen ? t("stage.frozen") : status === "paused" ? t("stage.paused") : t("stage.seconds");

  return (
    <div className={`relative grid place-items-center ${frozen ? "animate-freeze" : ""}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#253154" strokeWidth={10 * scale} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={ring}
          strokeWidth={10 * scale}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - frac)}
          style={{ transition: "stroke-dashoffset 0.2s linear" }}
        />
      </svg>
      <div className="absolute text-center">
        <div
          className={`shadow-text font-black ${frozen ? "text-sky-200" : urgent ? "text-hot" : "text-white"}`}
          style={{ fontSize: 30 * scale }}
        >
          {Math.ceil(remaining)}
        </div>
        <div
          className={`uppercase tracking-widest ${frozen ? "text-sky-300/80" : "text-white/50"}`}
          style={{ fontSize: 9 * scale }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}
