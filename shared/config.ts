import type { RoundId, Settings } from "./types.ts";

export const BRACKET_SIZE = 16;

export const ROUND_ORDER: RoundId[] = ["r16", "qf", "sf", "final"];

export const ROUND_LABELS: Record<RoundId, string> = {
  r16: "Round of 16",
  qf: "Quarterfinals",
  sf: "Semifinals",
  final: "Grand Final",
};

export const ROUND_SIZES: Record<RoundId, number> = {
  r16: 8,
  qf: 4,
  sf: 2,
  final: 1,
};

export const DEFAULT_SETTINGS: Settings = {
  roundSeconds: 30,
  suddenDeathSeconds: 5,
  chatWeight: 1,
  giftWeight: 10,
  dedupeChat: true,
  tieRule: "sudden-death",
  autoNextMatch: true,
  autoNextTournament: false,
};

export const SERVER_PORT = 8787;
