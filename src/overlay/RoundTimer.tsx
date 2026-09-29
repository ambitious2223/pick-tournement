import type { ReactNode } from "react";
import { useNow } from "../lib/live.ts";

export function RoundTimer({
  endsAt,
  status,
  totalSeconds,
}: {
  endsAt: number | null;
  status: string;
  totalSeconds: number;
}): ReactNode {
  const now = useNow(status === "running");
  const remaining = endsAt ? Math.max(0, (endsAt - now) / 1000) : totalSeconds;
  const frac = Math.max(0, Math.min(1, totalSeconds > 0 ? remaining / totalSeconds : 0));
  const radius = 56;
  const circ = 2 * Math.PI * radius;
  const urgent = remaining <= 10 && status === "running";

  return (
    <div className="relative grid place-items-center">
      <svg width="140" height="140" className="-rotate-90">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#253154" strokeWidth="10" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={urgent ? "#fb7185" : "#22d3ee"}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - frac)}
          style={{ transition: "stroke-dashoffset 0.2s linear" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className={`text-3xl font-black ${urgent ? "text-hot" : "text-white"}`}>{Math.ceil(remaining)}</div>
        <div className="text-[0.6rem] uppercase tracking-widest text-white/50">
          {status === "paused" ? "paused" : "seconds"}
        </div>
      </div>
    </div>
  );
}
