import type { ReactNode } from "react";
import type { Bracket, Category, Match, RoundId } from "../../shared/types.ts";
import { ROUND_LABELS, ROUND_ORDER } from "../../shared/config.ts";

function nameOf(category: Category | null, id: string | null): string {
  if (!id) return "—";
  return category?.items.find((i) => i.id === id)?.name ?? id;
}

export function BracketBoard({
  bracket,
  category,
  currentRound,
  currentIndex,
}: {
  bracket: Bracket;
  category: Category | null;
  currentRound: RoundId;
  currentIndex: number;
}): ReactNode {
  return (
    <div className="grid grid-cols-4 gap-3">
      {ROUND_ORDER.map((round) => (
        <div key={round} className="flex flex-col gap-2">
          <div className={`chip text-center ${round === currentRound ? "border-brand text-brand" : "text-white/50"}`}>
            {ROUND_LABELS[round]}
          </div>
          {bracket.rounds[round].map((match: Match, i: number) => {
            const active = round === currentRound && i === currentIndex;
            return (
              <div
                key={match.id}
                className={`rounded-lg border px-2 py-1 text-xs ${
                  active ? "border-brand bg-brand/10" : "border-line bg-ink-2/60"
                }`}
              >
                <Row name={nameOf(category, match.a)} winner={match.winner === match.a && match.winner !== null} />
                <Row name={nameOf(category, match.b)} winner={match.winner === match.b && match.winner !== null} />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function Row({ name, winner }: { name: string; winner: boolean }): ReactNode {
  return <div className={`truncate ${winner ? "font-bold text-lime" : "text-white/70"}`}>{name}</div>;
}
