import { useEffect, useMemo, useState } from "react";

const ROUND_MATCHES: Record<string, number> = { r16: 8, qf: 4, sf: 2, final: 1 };
const ROUND_DEPTH: Record<string, number> = { r16: 26, qf: 14, sf: 6, final: 0 };

export type CinemaMode = "intro" | "outro" | "recap";

function focusFor(activeKey: string): { x: number; y: number } {
  const [round, indexRaw] = activeKey.split(":");
  const count = ROUND_MATCHES[round ?? ""] ?? 1;
  const index = Number(indexRaw) || 0;
  const half = count / 2;
  const left = count <= 1 || index < half;
  const local = count <= 1 ? 0 : left ? index : index - half;
  const rows = count <= 1 ? 1 : half;
  const y = rows <= 1 ? 0 : ((local - (rows - 1) / 2) / (rows - 1)) * 32;
  const x = (left ? -1 : 1) * (ROUND_DEPTH[round ?? ""] ?? 0);
  return { x, y };
}

const SCHEDULES: Record<CinemaMode, number[]> = {
  intro: [0, 0.22, 0.58],
  outro: [0, 0.5, 0.78],
  recap: [0, 0.28, 0.56, 0.84],
};

/**
 * A cinematic camera that tours the mirrored bracket. Each mode is its own
 * choreography and every shot is a plain `transform` string (GPU-friendly),
 * paced to the phase duration and escalated by round so the Final feels tense.
 */
export function useCinemaCamera(
  activeKey: string,
  mode: CinemaMode,
  roundIndex: number,
  durationMs: number,
): { transform: string } {
  const shots = useMemo(() => {
    const { x, y } = focusFor(activeKey);
    const tx = (-x).toFixed(2);
    const ty = (-y).toFixed(2);
    const push = (1.42 + roundIndex * 0.12).toFixed(2);
    const mid = (1.1 + roundIndex * 0.04).toFixed(2);
    if (mode === "intro") {
      return ["scale(1) translate(0%, 0%)", `scale(${mid}) translate(0%, 0%)`, `scale(${push}) translate(${tx}%, ${ty}%)`];
    }
    if (mode === "outro") {
      return [
        `scale(${push}) translate(${tx}%, ${ty}%)`,
        `scale(${(Number(push) + 0.06).toFixed(2)}) translate(${tx}%, ${ty}%)`,
        "scale(1) translate(0%, 0%)",
      ];
    }
    // recap: sweep the left half, then the right half, then settle on the centre.
    return ["scale(1) translate(0%, 0%)", "scale(1.1) translate(14%, 0%)", "scale(1.1) translate(-14%, 0%)", "scale(1.04) translate(0%, 0%)"];
  }, [activeKey, mode, roundIndex]);

  const [shot, setShot] = useState(0);

  useEffect(() => {
    setShot(0);
    const total = Math.max(700, durationMs);
    const schedule = SCHEDULES[mode];
    const timers = schedule.map((fraction, i) => window.setTimeout(() => setShot(i), fraction * total));
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [activeKey, mode, durationMs]);

  return { transform: shots[Math.min(shot, shots.length - 1)] ?? "scale(1)" };
}
