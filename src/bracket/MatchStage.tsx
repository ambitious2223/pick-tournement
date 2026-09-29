import type { ReactNode } from "react";
import type { SessionState } from "../../shared/types.ts";
import { activeCategory, activeMatch } from "../lib/selectors.ts";
import { Stage } from "../stage/Stage.tsx";
import { BracketBoard } from "./BracketBoard.tsx";

/**
 * The tournament "stage": the animated bracket is the base layer, and the live
 * round (photos, names, timer, votes) floats above it on a blurred card.
 */
export function MatchStage({ state, variant }: { state: SessionState; variant: "control" | "overlay" }): ReactNode {
  const match = activeMatch(state);
  const category = activeCategory(state);
  const showBracket = state.tournament !== null && state.tournament.status !== "done" && match !== null;

  const height = variant === "overlay" ? "min-h-screen" : "min-h-[460px]";
  const cardWidth = variant === "overlay" ? "max-w-5xl" : "max-w-4xl";

  return (
    <div className={`relative w-full ${height}`}>
      {showBracket && state.tournament ? (
        <div className={`absolute inset-0 overflow-hidden ${variant === "overlay" ? "p-6 opacity-40" : "p-2 opacity-55"}`}>
          <BracketBoard
            bracket={state.tournament.bracket}
            category={category}
            currentRound={match!.round}
            currentIndex={match!.index}
            compact
          />
        </div>
      ) : null}

      <div className="absolute inset-0 grid place-items-center p-3">
        <div className={`w-full ${cardWidth} rounded-2xl border border-line bg-ink/75 p-4 shadow-2xl backdrop-blur-md`}>
          <Stage state={state} variant={variant === "overlay" ? "overlay" : "control"} />
        </div>
      </div>
    </div>
  );
}
