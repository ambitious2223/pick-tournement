import { useState, type ReactNode } from "react";
import type { Gift, SessionState } from "../../shared/types.ts";
import { ROUND_LABELS } from "../../shared/config.ts";
import { activeCategory, activeItems, activeMatch, getItem } from "../lib/selectors.ts";
import { ItemCard } from "./ItemCard.tsx";
import { VoteBar } from "./VoteBar.tsx";
import { RoundTimer } from "./RoundTimer.tsx";
import { BracketBoard } from "./BracketBoard.tsx";
import { WinnerReveal } from "./WinnerReveal.tsx";

function giftFor(item: { gift?: Gift } | null, category: ReturnType<typeof activeCategory>, side: "a" | "b"): Gift | null {
  if (item?.gift) return item.gift;
  return category?.giftPair?.[side === "a" ? 0 : 1] ?? null;
}

export function Overlay({ state }: { state: SessionState | null }): ReactNode {
  const [showBracket, setShowBracket] = useState(false);

  if (!state) return null;

  const category = activeCategory(state);
  const match = activeMatch(state);

  if (!state.tournament || !match) {
    return (
      <div className="overlay-root grid min-h-screen place-items-center text-center">
        <div className="panel px-10 py-8">
          <div className="text-sm uppercase tracking-[0.4em] text-brand">Pick League</div>
          <h1 className="mt-2 text-4xl font-black">Waiting for the next bracket…</h1>
          <p className="mt-2 text-white/50">{state.queue[state.queueIndex]?.categoryId ?? "no tournament running"}</p>
        </div>
      </div>
    );
  }

  if (state.tournament.status === "done") {
    const champion = getItem(category, state.tournament.champion);
    return (
      <div className="overlay-root grid min-h-screen place-items-center">
        <WinnerReveal item={champion} categoryName={category?.name ?? ""} />
      </div>
    );
  }

  const { a, b } = activeItems(state);
  const leadingA = match.votesA > match.votesB;
  const leadingB = match.votesB > match.votesA;
  const done = match.status === "done";
  const roundMatches = state.tournament.bracket.rounds[match.round];

  const stateFor = (itemId: string | null, leading: boolean, other: string | null): "normal" | "leading" | "winner" | "losing" => {
    if (done && match.winner) return match.winner === itemId ? "winner" : "losing";
    if (itemId && leading) return "leading";
    void other;
    return "normal";
  };

  return (
    <div className="overlay-root relative min-h-screen p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <div className="flex items-center justify-center gap-4">
          <span className="chip text-brand">{ROUND_LABELS[match.round]}</span>
          <span className="chip text-white/60">
            Match {match.index + 1} / {roundMatches.length}
          </span>
          <span className="chip text-white/60">{category?.name}</span>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6">
          <ItemCard
            item={a}
            votes={match.votesA}
            gift={giftFor(a, category, "a")}
            side="a"
            state={stateFor(match.a, leadingA, match.b)}
          />
          <div className="flex flex-col items-center gap-2">
            <div className="text-4xl font-black text-white/30">VS</div>
            <RoundTimer endsAt={match.endsAt} status={state.status} totalSeconds={state.settings.roundSeconds} />
          </div>
          <ItemCard
            item={b}
            votes={match.votesB}
            gift={giftFor(b, category, "b")}
            side="b"
            state={stateFor(match.b, leadingB, match.a)}
          />
        </div>

        <VoteBar votesA={match.votesA} votesB={match.votesB} />

        <div className="flex items-center justify-between text-xs text-white/40">
          <span>type the name or send the gift to vote</span>
          <button onClick={() => setShowBracket((v) => !v)} className="rounded-lg border border-line px-3 py-1 hover:border-brand">
            {showBracket ? "hide bracket" : "show bracket"}
          </button>
        </div>

        {showBracket ? (
          <BracketBoard
            bracket={state.tournament.bracket}
            category={category}
            currentRound={match.round}
            currentIndex={match.index}
          />
        ) : null}
      </div>
    </div>
  );
}
