import type { ReactNode } from "react";
import type { Category, Gift, Item, SessionState } from "../../shared/types.ts";
import { ROUND_LABELS } from "../../shared/config.ts";
import { activeCategory, activeItems, activeMatch, getItem } from "../lib/selectors.ts";
import { ItemCard } from "../overlay/ItemCard.tsx";
import { VoteBar } from "../overlay/VoteBar.tsx";
import { RoundTimer } from "../overlay/RoundTimer.tsx";
import { WinnerReveal } from "../overlay/WinnerReveal.tsx";

type Variant = "overlay" | "control";

interface Preset {
  visual: string;
  emoji: string;
  name: string;
  vote: string;
  vs: string;
  bar: string;
  gap: string;
  barMax: string;
}

const PRESETS: Record<Variant, Preset> = {
  overlay: {
    visual: "h-[34vh] w-[34vh] min-h-[110px] min-w-[110px] max-h-[400px] max-w-[400px]",
    emoji: "text-[7vh]",
    name: "text-4xl",
    vote: "text-6xl",
    vs: "text-6xl",
    bar: "h-10",
    gap: "gap-10",
    barMax: "max-w-5xl",
  },
  control: {
    visual: "h-[clamp(7.5rem,13vw,12rem)] w-[clamp(7.5rem,13vw,12rem)]",
    emoji: "text-[clamp(2.25rem,4.5vw,3.5rem)]",
    name: "text-xl",
    vote: "text-3xl",
    vs: "text-2xl",
    bar: "h-7",
    gap: "gap-4",
    barMax: "max-w-3xl",
  },
};

function giftFor(item: Item | null, category: Category | null, side: "a" | "b"): Gift | null {
  if (item?.gift) return item.gift;
  return category?.giftPair?.[side === "a" ? 0 : 1] ?? null;
}

export function Stage({
  state,
  variant = "control",
  showHeader = true,
  totalSeconds,
}: {
  state: SessionState;
  variant?: Variant;
  showHeader?: boolean;
  totalSeconds?: number;
}): ReactNode {
  const p = PRESETS[variant];
  const category = activeCategory(state);
  const match = activeMatch(state);
  const { a, b } = activeItems(state);

  if (!state.tournament || !match) {
    return (
      <div className="grid place-items-center py-10 text-center">
        <div>
          <div className="text-sm uppercase tracking-[0.35em] text-brand">Pick League</div>
          <h2 className={variant === "overlay" ? "mt-2 text-4xl font-black" : "mt-1 text-2xl font-black"}>
            Waiting for the next bracket…
          </h2>
          <p className="mt-1 text-sm text-white/50">Pick a category on the left to begin.</p>
        </div>
      </div>
    );
  }

  if (state.tournament.status === "done") {
    return <WinnerReveal item={getItem(category, state.tournament.champion)} categoryName={category?.name ?? ""} />;
  }

  const leadingA = match.votesA > match.votesB;
  const leadingB = match.votesB > match.votesA;
  const done = match.status === "done";
  const roundMatches = state.tournament.bracket.rounds[match.round];

  const stateFor = (itemId: string | null, leading: boolean): "normal" | "leading" | "winner" | "losing" => {
    if (done && match.winner) return match.winner === itemId ? "winner" : "losing";
    if (itemId && leading) return "leading";
    return "normal";
  };

  const seconds = totalSeconds ?? state.settings.roundSeconds;

  return (
    <div className="flex flex-col items-center gap-4">
      {showHeader ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="chip text-brand">{ROUND_LABELS[match.round]}</span>
          <span className="chip text-white/60">
            Match {match.index + 1} / {roundMatches.length}
          </span>
          <span className="chip text-white/60">{category?.name}</span>
        </div>
      ) : null}

      <div className={`grid w-full grid-cols-[1fr_auto_1fr] items-center ${p.gap}`}>
        <div className="flex justify-center">
          <ItemCard
            item={a}
            votes={match.votesA}
            gift={giftFor(a, category, "a")}
            side="a"
            state={stateFor(match.a, leadingA)}
            size={p.visual}
            emojiClass={p.emoji}
            nameClass={p.name}
            voteClass={p.vote}
          />
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className={`font-black text-white/30 ${p.vs}`}>VS</div>
          <RoundTimer endsAt={match.endsAt} status={state.status} totalSeconds={seconds} scale={variant === "overlay" ? 1.25 : 1} />
        </div>
        <div className="flex justify-center">
          <ItemCard
            item={b}
            votes={match.votesB}
            gift={giftFor(b, category, "b")}
            side="b"
            state={stateFor(match.b, leadingB)}
            size={p.visual}
            emojiClass={p.emoji}
            nameClass={p.name}
            voteClass={p.vote}
          />
        </div>
      </div>

      <div className={`w-full ${p.barMax}`}>
        <VoteBar votesA={match.votesA} votesB={match.votesB} heightClass={p.bar} />
      </div>
    </div>
  );
}
