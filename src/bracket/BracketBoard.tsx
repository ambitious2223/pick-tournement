import type { ReactNode } from "react";
import type { Bracket, Category, Match, RoundId } from "../../shared/types.ts";
import { ROUND_LABELS, ROUND_ORDER } from "../../shared/config.ts";

function nameOf(category: Category | null, id: string | null): string {
  if (!id) return "—";
  return category?.items.find((i) => i.id === id)?.name ?? id;
}

function MatchCard({
  match,
  category,
  active,
  compact,
  delay,
}: {
  match: Match;
  category: Category | null;
  active: boolean;
  compact: boolean;
  delay: number;
}): ReactNode {
  const done = match.winner !== null;
  return (
    <div
      key={`${match.id}-${match.winner ?? "pending"}`}
      style={{ animationDelay: `${delay}ms` }}
      className={`animate-rise rounded-lg border px-2 ${compact ? "py-0.5 text-[0.6rem]" : "py-1 text-xs"} ${
        active ? "border-brand bg-brand/10 shadow-[0_0_20px_-6px_rgba(34,211,238,0.8)]" : "border-line bg-ink-2/60"
      } ${done ? "border-lime/40" : ""}`}
    >
      <Row name={nameOf(category, match.a)} winner={done && match.winner === match.a} />
      <Row name={nameOf(category, match.b)} winner={done && match.winner === match.b} />
    </div>
  );
}

function Row({ name, winner }: { name: string; winner: boolean }): ReactNode {
  return (
    <div className={`truncate ${winner ? "font-bold text-lime" : "text-white/70"}`}>
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
  compact = false,
}: {
  bracket: Bracket;
  category: Category | null;
  currentRound: RoundId;
  currentIndex: number;
  compact?: boolean;
}): ReactNode {
  return (
    <div className={`grid grid-cols-4 ${compact ? "gap-2" : "gap-3"}`}>
      {ROUND_ORDER.map((round, col) => (
        <div key={round} className="flex min-w-0 flex-col gap-1.5">
          <div
            className={`chip text-center ${compact ? "text-[0.6rem]" : ""} ${
              round === currentRound ? "border-brand text-brand" : "text-white/50"
            }`}
          >
            {ROUND_LABELS[round]}
          </div>
          {bracket.rounds[round].map((match, i) => (
            <MatchCard
              key={match.id}
              match={match}
              category={category}
              active={round === currentRound && i === currentIndex}
              compact={compact}
              delay={col * 40 + i * 15}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
