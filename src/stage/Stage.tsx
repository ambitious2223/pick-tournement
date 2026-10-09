import type { ReactNode } from "react";
import type { Category, Gift, Item, SessionState, SideEffect } from "../../shared/types.ts";
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
  namePx: number;
  votePx: number;
  vs: string;
  bar: string;
  gap: string;
  barMax: string;
}

const PRESETS: Record<Variant, Preset> = {
  overlay: {
    visual: "aspect-square w-full max-w-[480px] min-w-[120px]",
    emoji: "text-[8vh]",
    namePx: 48,
    votePx: 72,
    vs: "text-7xl",
    bar: "h-12",
    gap: "gap-12",
    barMax: "max-w-6xl",
  },
  control: {
    visual: "h-[clamp(9rem,16vw,14rem)] w-[clamp(9rem,16vw,14rem)]",
    emoji: "text-[clamp(2.75rem,5.5vw,4.25rem)]",
    namePx: 24,
    votePx: 36,
    vs: "text-3xl",
    bar: "h-9",
    gap: "gap-6",
    barMax: "max-w-4xl",
  },
};

function clampScale(value: number | undefined): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(3, Math.max(0.6, value as number));
}

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
  const effectFor = (side: "a" | "b"): SideEffect | null =>
    state.sideEffects.find((e) => e.side === side && e.until > Date.now()) ?? null;

  const stateFor = (itemId: string | null, leading: boolean): "normal" | "leading" | "winner" | "losing" => {
    if (done && match.winner) return match.winner === itemId ? "winner" : "losing";
    if (itemId && leading) return "leading";
    return "normal";
  };

  const seconds = totalSeconds ?? state.settings.roundSeconds;

  const big = variant === "overlay";
  const userScale = clampScale(state.settings.stageTextScale);
  /** Scale a control base size (px) by the variant and the host's text-size setting. */
  const fs = (controlPx: number, overlayPx = controlPx): { fontSize: number } => ({
    fontSize: (big ? overlayPx : controlPx) * userScale,
  });
  const headerChipStyle = fs(12, 13);
  const instrTitleStyle = fs(16, 44);
  const instrTextStyle = fs(14, 32);
  const instrChipStyle = fs(14, 40);
  const titleClass = big
    ? "font-black uppercase tracking-widest text-brand shadow-text"
    : "font-black uppercase tracking-widest text-brand text-sm";
  const freeClass = big
    ? "rounded-full bg-brand px-5 py-2 font-black uppercase tracking-wide text-ink shadow-lg"
    : "chip text-xs text-brand";
  const giftClass = big
    ? "rounded-full bg-lime px-5 py-2 font-black uppercase tracking-wide text-ink shadow-lg"
    : "chip text-xs text-brand-2";
  const ruleClass = big ? "max-w-[46ch] font-bold leading-snug text-white shadow-text" : "max-w-3xl leading-relaxed text-white/60 text-xs";
  const vsClass = big ? "font-black text-white/60" : "font-black text-white/30";
  const sideAClass = big
    ? "rounded-full border-2 border-brand bg-brand/15 px-4 py-1.5 font-black text-brand shadow-text"
    : "chip text-xs border-brand/60 text-brand";
  const sideBClass = big
    ? "rounded-full border-2 border-brand-2 bg-brand-2/15 px-4 py-1.5 font-black text-brand-2 shadow-text"
    : "chip text-xs border-brand-2/60 text-brand-2";
  const barPctPx = 14 * userScale;
  const barLabelPx = 12 * userScale;

  return (
    <div className="flex h-full w-full flex-col items-center justify-between gap-4">
      {showHeader ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="chip text-brand" style={headerChipStyle}>{round(match.round)}</span>
          <span className="chip text-white/60" style={headerChipStyle}>{t("stage.matchOf", { n: match.index + 1, total: roundMatches.length })}</span>
          <span className="chip text-white/60" style={headerChipStyle}>{categoryName(category, lang)}</span>
        </div>
      ) : null}

      <div className="flex w-full flex-1 flex-col items-center justify-center gap-4">
        <div className={`grid w-full grid-cols-[1fr_auto_1fr] items-center ${p.gap}`}>
          <div className="flex justify-center">
            <ItemCard
              key={match.a ?? "a"}
              item={a}
              votes={match.votesA}
              gift={giftFor(a, category, "a")}
              side="a"
              state={stateFor(match.a, leadingA)}
              size={p.visual}
              emojiClass={p.emoji}
              namePx={p.namePx * userScale}
              votePx={p.votePx * userScale}
              effect={effectFor("a")}
            />
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className={`font-black text-white/30 ${p.vs}`}>VS</div>
                <RoundTimer
                  endsAt={match.endsAt}
                  status={state.status}
                  totalSeconds={seconds}
                  hold={state.matchHold}
                  scale={big ? 1.25 : 1}
                />
          </div>
          <div className="flex justify-center">
            <ItemCard
              key={match.b ?? "b"}
              item={b}
              votes={match.votesB}
              gift={giftFor(b, category, "b")}
              side="b"
              state={stateFor(match.b, leadingB)}
              size={p.visual}
              emojiClass={p.emoji}
              namePx={p.namePx * userScale}
              votePx={p.votePx * userScale}
              effect={effectFor("b")}
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
            pctPx={barPctPx}
            labelPx={barLabelPx}
          />
        </div>
      </div>

      {state.settings.showVoteHint && !done ? (
        <section
          className={`flex flex-col items-center text-center ${
            big
              ? "mx-auto w-fit max-w-full gap-4 rounded-3xl border-[3px] border-brand bg-ink px-8 py-6 shadow-[0_0_0_3px_#070a14,0_0_0_7px_rgba(34,211,238,0.6),0_0_80px_-12px_rgba(34,211,238,1)]"
              : "gap-2 rounded-2xl border border-brand/40 bg-brand/5 px-5 py-4 shadow-[0_0_50px_-24px_rgba(34,211,238,0.9)]"
          }`}
        >
          <span className={titleClass} style={instrTitleStyle}>{t("vote.howTo")}</span>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className={freeClass} style={instrChipStyle}>{t("vote.freeChip", { weight: state.settings.chatWeight })}</span>
            <span className={giftClass} style={instrChipStyle}>{t("vote.giftChip", { weight: state.settings.giftWeight })}</span>
          </div>
          <p className={ruleClass} style={instrTextStyle}>{t("vote.instruction")}</p>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-3">
            <span className={sideAClass} style={instrChipStyle}>
              {a?.gift ? (
                a.gift.img ? (
                  <img src={a.gift.img} alt="" className="me-1 inline-block h-[1.3em] w-[1.3em] rounded-full object-contain align-[-0.2em]" />
                ) : (
                  <span className="me-1">{a.gift.icon}</span>
                )
              ) : null}
              {itemName(a, lang) || "—"}
            </span>
            <span className={vsClass} style={instrChipStyle}>VS</span>
            <span className={sideBClass} style={instrChipStyle}>
              {b?.gift ? (
                b.gift.img ? (
                  <img src={b.gift.img} alt="" className="me-1 inline-block h-[1.3em] w-[1.3em] rounded-full object-contain align-[-0.2em]" />
                ) : (
                  <span className="me-1">{b.gift.icon}</span>
                )
              ) : null}
              {itemName(b, lang) || "—"}
            </span>
          </div>
        </section>
      ) : null}
    </div>
  );
}
