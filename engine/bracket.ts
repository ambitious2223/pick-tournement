import type { Bracket, Category, Item, Match, RoundId } from "../shared/types.ts";
import { BRACKET_SIZE, ROUND_ORDER, ROUND_SIZES } from "../shared/config.ts";

function emptyMatch(round: RoundId, index: number): Match {
  return {
    id: `${round}:${index}`,
    round,
    index,
    a: null,
    b: null,
    votesA: 0,
    votesB: 0,
    votersA: [],
    votersB: [],
    winner: null,
    status: "pending",
    endsAt: null,
  };
}

export function seedOrder(items: Item[]): Item[] {
  return items.slice(0, BRACKET_SIZE);
}

export function buildBracket(category: Category): Bracket {
  const seeded = seedOrder(category.items);
  const rounds = {} as Record<RoundId, Match[]>;
  for (const round of ROUND_ORDER) {
    rounds[round] = Array.from({ length: ROUND_SIZES[round] }, (_, i) => emptyMatch(round, i));
  }

  const first = rounds.r16;
  for (let i = 0; i < first.length; i++) {
    const match = first[i];
    if (!match) continue;
    match.a = seeded[i * 2]?.id ?? null;
    match.b = seeded[i * 2 + 1]?.id ?? null;
  }
  return { rounds };
}

export function nextRoundId(round: RoundId): RoundId | null {
  const idx = ROUND_ORDER.indexOf(round);
  const next = ROUND_ORDER[idx + 1];
  return next ?? null;
}

export function advanceWinner(bracket: Bracket, match: Match, winnerId: string): void {
  match.winner = winnerId;
  match.status = "done";

  const nextId = nextRoundId(match.round);
  if (!nextId) return;
  const next = bracket.rounds[nextId][Math.floor(match.index / 2)];
  if (!next) return;
  if (match.index % 2 === 0) next.a = winnerId;
  else next.b = winnerId;
}

export function tournamentChampion(bracket: Bracket): string | null {
  return bracket.rounds.final[0]?.winner ?? null;
}

export function isRoundComplete(round: Match[]): boolean {
  return round.every((m) => m.winner !== null);
}
