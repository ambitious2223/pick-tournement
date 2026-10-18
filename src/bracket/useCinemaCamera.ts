import { useEffect, useMemo, useState } from "react";
import { shotTransform, type Slot } from "./camera.ts";

export type CinemaMode = "intro" | "outro" | "recap";

/** Fraction of the phase at which each shot is taken. The last shot holds. */
const SCHEDULES: Record<CinemaMode, number[]> = {
  intro: [0, 0.3],
  outro: [0, 0.5],
  recap: [0, 0.28, 0.56, 0.84],
};

/**
 * A cinematic camera that tours the mirrored bracket. `intro` zooms in and
 * holds on the active match, `outro` starts on the match then pulls back to the
 * wide shot, and `recap` sweeps the bracket. Each shot is a plain `transform`
 * string (GPU-friendly), and the zoom factor is the host's `bracketZoom`.
 */
export function useCinemaCamera(
  activeKey: string,
  mode: CinemaMode,
  focus: Slot | null,
  durationMs: number,
  zoom: number,
): { transform: string } {
  const shots = useMemo(() => {
    const z = Math.max(1.2, zoom);
    if (mode === "intro") return [shotTransform(null, 1), shotTransform(focus, z)];
    if (mode === "outro") return [shotTransform(focus, z), shotTransform(null, 1)];
    // recap: sweep the left half, then the right half, then settle on the centre.
    return [
      "scale(1) translate(0%, 0%)",
      "scale(1.1) translate(14%, 0%)",
      "scale(1.1) translate(-14%, 0%)",
      "scale(1.04) translate(0%, 0%)",
    ];
  }, [mode, focus, zoom]);

  const [shot, setShot] = useState(0);

  useEffect(() => {
    setShot(0);
    const total = Math.max(700, durationMs);
    const timers = SCHEDULES[mode].map((fraction, i) => window.setTimeout(() => setShot(i), fraction * total));
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [activeKey, mode, durationMs]);

  return { transform: shots[Math.min(shot, shots.length - 1)] ?? "scale(1)" };
}
