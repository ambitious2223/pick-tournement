import type { CSSProperties, ReactNode } from "react";
import type { RoundId, SessionState } from "../../shared/types.ts";
import { activeCategory, getItem } from "../lib/selectors.ts";
import { ItemCard } from "./ItemCard.tsx";
import { VsBadge } from "./VsBadge.tsx";
import { PRESETS, clampScale, giftFor } from "../stage/presets.ts";

/** The finished clash, snapshotted by the caller the moment the match ended. */
export interface ClashOutroData {
  round: RoundId;
  a: string | null;
  b: string | null;
  winner: string | null;
  votesA: number;
  votesB: number;
}

const sideClass = (winnerSide: boolean): string =>
  winnerSide
    ? "animate-clash-out-win flex w-full min-w-0 justify-center rounded-2xl shadow-[0_0_70px_-12px_rgba(163,230,53,0.95)]"
    : "animate-clash-out-lose flex w-full min-w-0 justify-center";

const sideState = (id: string | null, winner: string | null): "winner" | "losing" =>
  id !== null && id === winner ? "winner" : "losing";

/**
 * The clash-outro frame: holds the just-decided matchup on screen for a beat
 * while the loser flinches and drops away and the winner flares lime, then
 * fades out right as the caller swaps to the next view. Purely presentational —
 * the caller decides how long to linger.
 */
export function ClashOutro({
  state,
  data,
  variant,
  durationMs,
}: {
  state: SessionState;
  data: ClashOutroData;
  variant: "overlay" | "control";
  durationMs: number;
}): ReactNode {
  const p = PRESETS[variant];
  const category = activeCategory(state);
  const a = getItem(category, data.a);
  const b = getItem(category, data.b);
  const big = variant === "overlay";
  const userScale = clampScale(state.settings.stageTextScale);
  const stageScale = big ? clampScale(state.settings.stageScale ?? 1) : 1;
  const cardShell = big
    ? "flex h-full w-full flex-col rounded-2xl border border-line/60 bg-ink/90 p-3 shadow-2xl backdrop-blur-sm"
    : "mx-auto flex h-full w-full max-w-6xl flex-col rounded-2xl border border-line/60 bg-ink/90 p-4 shadow-2xl backdrop-blur-md";

  return (
    <div
      className="animate-outro-exit flex h-full w-full items-center justify-center p-2"
      style={
        {
          animationDuration: `${durationMs}ms`,
          ...(big ? { "--stage-scale": String(stageScale) } : null),
        } as CSSProperties
      }
    >
      <div className={cardShell}>
        <div className="flex h-full w-full flex-col items-center justify-center gap-4">
          <div className={`grid w-full grid-cols-[1fr_auto_1fr] items-center ${p.gap}`}>
            <div className={sideClass(data.winner !== null && data.winner === data.a)}>
              <ItemCard
                item={a}
                votes={data.votesA}
                gift={giftFor(a, category, "a")}
                side="a"
                state={sideState(data.a, data.winner)}
                size={p.visual}
                emojiClass={p.emoji}
                namePx={p.namePx * userScale * stageScale}
                votePx={p.votePx * userScale * stageScale}
              />
            </div>
            <div className="flex justify-center">
              <VsBadge scale={stageScale} mode="out" />
            </div>
            <div className={sideClass(data.winner !== null && data.winner === data.b)}>
              <ItemCard
                item={b}
                votes={data.votesB}
                gift={giftFor(b, category, "b")}
                side="b"
                state={sideState(data.b, data.winner)}
                size={p.visual}
                emojiClass={p.emoji}
                namePx={p.namePx * userScale * stageScale}
                votePx={p.votePx * userScale * stageScale}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
