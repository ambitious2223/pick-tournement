import type { ReactNode } from "react";
import type { Category, Gift, Item, SessionState } from "../../shared/types.ts";
import { activeCategory, activeItems, activeMatch, categoryName, getItem, itemName } from "../lib/selectors.ts";
import { useI18n } from "../i18n/index.tsx";
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
    visual: "h-[37vh] w-[37vh] min-h-[120px] min-w-[120px] max-h-[480px] max-w-[480px]",
    emoji: "text-[8vh]",
    name: "text-5xl",
    vote: "text-7xl",
    vs: "text-7xl",
    bar: "h-12",
    gap: "gap-12",
    barMax: "max-w-6xl",
  },
  control: {
    visual: "h-[clamp(9rem,16vw,14rem)] w-[clamp(9rem,16vw,14rem)]",
    emoji: "text-[clamp(2.75rem,5.5vw,4.25rem)]",
    name: "text-2xl",
    vote: "text-4xl",
    vs: "text-3xl",
    bar: "h-9",
    gap: "gap-6",
    barMax: "max-w-4xl",
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
  const { t, round, lang } = useI18n();
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
            {t("stage.waitingTitle")}
          </h2>
          <p className="mt-1 text-sm text-white/50">{t("stage.pickCategory")}</p>
        </div>
      </div>
    );
  }

  if (state.tournament.status === "done") {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <WinnerReveal item={getItem(category, state.tournament.champion)} categoryName={categoryName(category, lang)} />
      </div>
    );
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

  const big = variant === "overlay";
  const instrTitle = big ? "text-lg sm:text-2xl" : "text-sm";
  const instrText = big ? "text-sm sm:text-base" : "text-xs";
  const instrChip = big ? "chip chip-lg" : "chip text-xs";

  return (
    <div className="flex h-full w-full flex-col items-center justify-between gap-4">
      {showHeader ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="chip text-brand">{round(match.round)}</span>
          <span className="chip text-white/60">{t("stage.matchOf", { n: match.index + 1, total: roundMatches.length })}</span>
          <span className="chip text-white/60">{categoryName(category, lang)}</span>
        </div>
      ) : null}

      <div className="flex w-full flex-1 flex-col items-center justify-center gap-4">
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
            <RoundTimer endsAt={match.endsAt} status={state.status} totalSeconds={seconds} scale={big ? 1.25 : 1} />
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
          <VoteBar
            votesA={match.votesA}
            votesB={match.votesB}
            votersA={match.votersA.length}
            votersB={match.votersB.length}
            heightClass={p.bar}
          />
        </div>
      </div>

      {state.settings.showVoteHint && !done ? (
        <section className="flex w-full max-w-4xl flex-col items-center gap-2 rounded-2xl border border-brand/40 bg-brand/5 px-5 py-4 text-center shadow-[0_0_50px_-24px_rgba(34,211,238,0.9)]">
          <span className={`font-black uppercase tracking-widest text-brand ${instrTitle}`}>{t("vote.howTo")}</span>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className={`${instrChip} text-brand`}>{t("vote.freeChip", { weight: state.settings.chatWeight })}</span>
            <span className={`${instrChip} text-brand-2`}>{t("vote.giftChip", { weight: state.settings.giftWeight })}</span>
          </div>
          <p className={`max-w-3xl leading-relaxed text-white/60 ${instrText}`}>{t("vote.instruction")}</p>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-3">
            <span className={`${instrChip} border-brand/60 text-brand`}>
              {a?.gift ? `${a.gift.icon} ` : ""}
              {itemName(a, lang) || "—"}
            </span>
            <span className="font-black text-white/30">VS</span>
            <span className={`${instrChip} border-brand-2/60 text-brand-2`}>
              {b?.gift ? `${b.gift.icon} ` : ""}
              {itemName(b, lang) || "—"}
            </span>
          </div>
        </section>
      ) : null}
    </div>
  );
}
