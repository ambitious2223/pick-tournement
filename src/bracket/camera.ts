import type { RoundId } from "../../shared/types.ts";

/** Bracket geometry, shared by the renderer and the cinematic camera. */
export const CARD_W = 13;
export const HALF = CARD_W / 2;
export const ROUND_MATCHES: Record<string, number> = { r16: 8, qf: 4, sf: 2, final: 1 };
export const X_LEFT = [7, 21, 35];
export const X_RIGHT = [93, 79, 65];

export interface Slot {
  x: number;
  y: number;
}

/** Percentage slot (center) for a match in the mirrored bracket. */
export function slot(round: RoundId, index: number): Slot | null {
  const depth = ["r16", "qf", "sf", "final"].indexOf(round);
  if (depth < 0 || index < 0) return null;
  const count = ROUND_MATCHES[round] ?? 1;
  if (round === "final") return { x: 50, y: 50 };
  if (index >= count) return null;
  const half = count / 2;
  const left = index < half;
  const local = left ? index : index - half;
  const x = (left ? X_LEFT[depth] : X_RIGHT[depth]) ?? 50;
  const y = ((local + 0.5) / half) * 100;
  return { x, y };
}

export interface CameraShot {
  scale: number;
  tx: number;
  ty: number;
}

/**
 * The transform that puts `focus` dead-centre and enlarges it by `scale`.
 *
 * The bracket transform-origin is the centre, and CSS applies
 * `scale(s) translate(t)` as `s * (p + t)`, so centring a point `f` needs
 * `t = 50 - f` (in percent). This is the correct version of the old camera,
 * whose undershooting translate kept the whole bracket in frame.
 */
export function focusTransform(focus: Slot, scale: number): CameraShot {
  return { scale, tx: 50 - focus.x, ty: 50 - focus.y };
}

/** A CSS `transform` string for a camera shot (or the wide default). */
export function shotTransform(focus: Slot | null, scale: number): string {
  if (!focus) return "scale(1) translate(0%, 0%)";
  const { scale: s, tx, ty } = focusTransform(focus, scale);
  return `scale(${s.toFixed(2)}) translate(${tx.toFixed(2)}%, ${ty.toFixed(2)}%)`;
}
