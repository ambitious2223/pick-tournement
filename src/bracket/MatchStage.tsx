import type { ReactNode } from "react";
import type { SessionState } from "../../shared/types.ts";
import { activeCategory, activeMatch } from "../lib/selectors.ts";
import { useNow } from "../lib/live.ts";
import { Stage } from "../stage/Stage.tsx";
import { BracketBoard } from "./BracketBoard.tsx";

/**
 * The tournament "stage". Two phases, chosen by `state.stageView`:
 * - "match": the live voting screen (photos, names, timer, votes) on its own.
 * - "bracket": the full bracket fills the stage so every name is clearly visible.
 * The outer `key` remounts the phase so the in/out animations replay on every switch.
 */
export function MatchStage({ state, variant }: { state: SessionState; variant: "control" | "overlay" }): ReactNode {
  const match = activeMatch(state);
  const category = activeCategory(state);
  const tourney = state.tournament;
  const live = tourney !== null && tourney.status !== "done" && match !== null;

  const now = useNow(state.status === "running" && state.matchEndsAt !== null);
  const urgent =
    state.status === "running" && state.matchEndsAt !== null && (state.matchEndsAt - now) / 1000 <= 10;

  const height = variant === "overlay" ? "min-h-screen" : "h-full min-h-[420px]";
  const cardWidth = variant === "overlay" ? "max-w-7xl" : "max-w-6xl";
  const bracketPhase = live && tourney && state.stageView === "bracket";

  return (
    <div key={state.stageView} className={`relative w-full ${height}`}>
      {bracketPhase ? (
        <div className="animate-view-in absolute inset-0 grid place-items-center p-4">
          <div className={`w-full ${variant === "overlay" ? "max-w-6xl" : "max-w-5xl"}`}>
            <BracketBoard
              bracket={tourney.bracket}
              category={category}
              currentRound={match!.round}
              currentIndex={match!.index}
              variant="stage"
            />
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 flex p-3">
          <div
            className={`animate-match-in mx-auto flex h-full w-full ${cardWidth} flex-col rounded-2xl border bg-ink/75 p-4 shadow-2xl backdrop-blur-md ${
              urgent ? "animate-pulse-ring border-hot" : "border-line"
            }`}
          >
            <Stage state={state} variant={variant === "overlay" ? "overlay" : "control"} />
          </div>
        </div>
      )}
    </div>
  );
}
