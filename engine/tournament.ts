import type { Category, Match, Tournament } from "../shared/types.ts";
import { advanceWinner, buildBracket, nextRoundId, tournamentChampion } from "./bracket.ts";

export function createTournament(category: Category, id: string): Tournament {
  return {
    id,
    categoryId: category.id,
    bracket: buildBracket(category),
    currentRound: "r16",
    currentMatchIndex: 0,
    status: "idle",
    champion: null,
  };
}

export function currentMatch(tournament: Tournament): Match | null {
  return tournament.bracket.rounds[tournament.currentRound][tournament.currentMatchIndex] ?? null;
}

export function findMatch(tournament: Tournament, round: string, index: number): Match | null {
  const list = tournament.bracket.rounds[round as keyof typeof tournament.bracket.rounds];
  return list?.[index] ?? null;
}

export interface ProgressResult {
  roundComplete: boolean;
  tournamentComplete: boolean;
}

export function completeMatch(tournament: Tournament, winnerId: string | null): ProgressResult {
  const round = tournament.bracket.rounds[tournament.currentRound];
  const match = round[tournament.currentMatchIndex];
  if (match) {
    if (winnerId === null) {
      // Nobody is in this slot: close it out and push nothing forward, so the
      // next round keeps its empty slot and the bye propagates.
      match.status = "done";
      match.winner = "";
    } else {
      advanceWinner(tournament.bracket, match, winnerId);
    }
  }

  const nextIndex = round.findIndex((m) => m.winner === null);
  if (nextIndex !== -1) {
    tournament.currentMatchIndex = nextIndex;
    return { roundComplete: false, tournamentComplete: false };
  }

  const next = nextRoundId(tournament.currentRound);
  if (!next) {
    const champion = tournamentChampion(tournament.bracket) ?? winnerId;
    tournament.status = "done";
    tournament.champion = champion;
    return { roundComplete: true, tournamentComplete: true };
  }

  tournament.currentRound = next;
  tournament.currentMatchIndex = 0;
  return { roundComplete: true, tournamentComplete: false };
}
