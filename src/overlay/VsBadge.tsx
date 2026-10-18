import type { ReactNode } from "react";

/**
 * The stylized "VS" crest that sits on the crown of the round timer.
 * Sits half-overlapping the timer ring's top edge. Plays an impact punch +
 * shockwave when a clash begins (`mode="impact"`), breathes subtly while the
 * match runs, and flash-zooms out when the clash is decided (`mode="out"`).
 */
export function VsBadge({ scale = 1, mode = "idle" }: { scale?: number; mode?: "idle" | "impact" | "out" }): ReactNode {
  const size = Math.round(62 * scale);
  const textPx = Math.round(28 * scale);
  const rootClass = mode === "impact" ? "animate-vs-impact" : mode === "out" ? "animate-vs-out" : "";

  return (
    <div className={rootClass}>
      <div className="animate-vs-breathe relative">
        <div
          className="rotate-[-6deg] overflow-hidden rounded-[0.95rem] bg-gradient-to-br from-brand to-brand-2 p-[3px] shadow-[0_0_0_3px_#070a14,0_0_36px_-4px_rgba(34,211,238,0.95),0_10px_30px_-8px_rgba(0,0,0,0.9)]"
          style={{ width: size, height: size }}
        >
          <div className="grid h-full w-full place-items-center rounded-[0.72rem] bg-gradient-to-b from-white to-slate-200">
            <span
              className="font-black italic tracking-tight text-ink"
              style={{ fontSize: textPx, lineHeight: 1 }}
            >
              VS
            </span>
          </div>
        </div>
        {/* sheen sweep */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[0.95rem]">
          <div className="animate-vs-glint absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-ink/15 to-transparent" />
        </div>
        {/* collision shockwave */}
        {mode === "impact" ? (
          <div className="animate-vs-shockwave pointer-events-none absolute inset-0 rounded-[0.95rem] border-2 border-brand/80" />
        ) : null}
      </div>
    </div>
  );
}
