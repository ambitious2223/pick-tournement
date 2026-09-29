import type { ReactNode } from "react";
import { useNow } from "../lib/live.ts";

export function RoundTimer({
  endsAt,
  status,
  totalSeconds,
  scale = 1,
}: {
  endsAt: number | null;
  status: string;
  totalSeconds: number;
  scale?: number;
}): ReactNode {
  const now = useNow(status === "running");
  const remaining = endsAt ? Math.max(0, (endsAt - now) / 1000) : totalSeconds;
  const frac = Math.max(0, Math.min(1, totalSeconds > 0 ? remaining / totalSeconds : 0));
  const size = Math.round(140 * scale);
  const radius = Math.round(56 * scale);
  const circ = 2 * Math.PI * radius;
  const urgent = remaining <= 10 && status === "running";

  return (
    <div className="relative grid place-items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#253154" strokeWidth={10 * scale} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={urgent ? "#fb7185" : "#22d3ee"}
          strokeWidth={10 * scale}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - frac)}
          style={{ transition: "stroke-dashoffset 0.2s linear" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className={`shadow-text font-black ${urgent ? "text-hot" : "text-white"}`} style={{ fontSize: 30 * scale }}>
          {Math.ceil(remaining)}
        </div>
        <div className="uppercase tracking-widest text-white/50" style={{ fontSize: 9 * scale }}>
          {status === "paused" ? "paused" : "seconds"}
        </div>
      </div>
    </div>
  );
}
