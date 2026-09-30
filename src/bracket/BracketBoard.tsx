import type { ReactNode } from "react";
import type { Bracket, Category, Match, RoundId } from "../../shared/types.ts";
import { ROUND_ORDER } from "../../shared/config.ts";
import { useI18n } from "../i18n/index.tsx";
import { itemName } from "../lib/selectors.ts";

function nameOf(category: Category | null, id: string | null, lang: "ar" | "en"): string {
  if (!id) return "—";
  const item = category?.items.find((i) => i.id === id);
  return item ? itemName(item, lang) : id;
}

function MatchCard({
  match,
  category,
  active,
  variant,
  delay,
  lang,
}: {
  match: Match;
  category: Category | null;
  active: boolean;
  variant: "compact" | "stage";
  delay: number;
  lang: "ar" | "en";
}): ReactNode {
  const done = match.winner !== null;
  const cardClass =
    variant === "compact"
      ? "rounded-lg border px-2 py-0.5 text-[0.6rem]"
      : "rounded-xl border px-3 py-2 text-sm";
  return (
    <div
      key={`${match.id}-${match.winner ?? "pending"}`}
      style={{ animationDelay: `${delay}ms` }}
      className={`${active ? "animate-focus-in" : "animate-rise"} ${cardClass} ${
        active
          ? "z-10 scale-105 border-[color:var(--round)] bg-[color:var(--round-soft)] shadow-[0_0_28px_-6px_var(--round)]"
          : variant === "stage"
            ? "border-line bg-ink-2/50 opacity-45"
            : "border-line bg-ink-2/60"
      } ${done ? "border-lime/40" : ""}`}
    >
      <Row name={nameOf(category, match.a, lang)} winner={done && match.winner === match.a} large={variant === "stage"} />
      <Row name={nameOf(category, match.b, lang)} winner={done && match.winner === match.b} large={variant === "stage"} />
    </div>
  );
}

function Row({ name, winner, large }: { name: string; winner: boolean; large: boolean }): ReactNode {
  return (
    <div className={`truncate ${large ? "py-0.5" : ""} ${winner ? "font-bold text-lime" : "text-white/70"}`}>
      {winner ? "▸ " : ""}
      {name}
    </div>
  );
}

export function BracketBoard({
  bracket,
  category,
  currentRound,
  currentIndex,
  variant = "compact",
  compact = false,
}: {
  bracket: Bracket;
  category: Category | null;
  currentRound: RoundId;
  currentIndex: number;
  variant?: "compact" | "stage";
  compact?: boolean;
}): ReactNode {
  const { round: roundLabel, lang } = useI18n();
  const isStage = variant === "stage";
  return (
    <div className={`grid grid-cols-4 ${isStage ? "gap-4" : compact ? "gap-2" : "gap-3"}`}>
      {ROUND_ORDER.map((round, col) => (
        <div key={round} className={`flex min-w-0 flex-col ${isStage ? "gap-2.5" : "gap-1.5"}`}>
          <div
            className={`chip text-center ${isStage ? "text-sm" : compact ? "text-[0.6rem]" : ""} ${
              round === currentRound ? "border-[color:var(--round)] text-[color:var(--round)]" : "text-white/50"
            }`}
          >
            {roundLabel(round)}
          </div>
          {bracket.rounds[round].map((match, i) => (
            <MatchCard
              key={match.id}
              match={match}
              category={category}
              active={round === currentRound && i === currentIndex}
              variant={isStage ? "stage" : "compact"}
              delay={col * 40 + i * 15}
              lang={lang}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
