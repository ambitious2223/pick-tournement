import { useState, type ReactNode } from "react";
import type { SessionState } from "../../shared/types.ts";
import { activeCategory, activeMatch } from "../lib/selectors.ts";
import { Stage } from "../stage/Stage.tsx";
import { BracketBoard } from "./BracketBoard.tsx";

export function Overlay({ state }: { state: SessionState | null }): ReactNode {
  const [showBracket, setShowBracket] = useState(false);
  if (!state) return null;

  const match = activeMatch(state);
  const category = activeCategory(state);
  const showBracketButton = state.tournament !== null && match !== null && state.tournament.status !== "done";

  return (
    <div className="overlay-root relative min-h-screen p-6">
      <div className="mx-auto flex max-w-[1500px] flex-col items-center gap-5">
        <Stage state={state} variant="overlay" />
        {showBracketButton && match ? (
          <>
            <div className="flex w-full items-center justify-between text-xs text-white/40">
              <span>viewers: type the name or send the gift to vote</span>
              <button
                onClick={() => setShowBracket((v) => !v)}
                className="rounded-lg border border-line px-3 py-1 hover:border-brand"
              >
                {showBracket ? "hide bracket" : "show bracket"}
              </button>
            </div>
            {showBracket ? (
              <div className="w-full">
                <BracketBoard
                  bracket={state.tournament!.bracket}
                  category={category}
                  currentRound={match.round}
                  currentIndex={match.index}
                />
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
