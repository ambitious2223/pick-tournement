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

/** 0 for the Round of 16 … 3 for the Grand Final. */
export function roundIndexFor(round: RoundId | undefined): number {
  const idx = round ? ROUND_ORDER.indexOf(round) : 0;
  return idx < 0 ? 0 : idx;
}

/** How much longer/more dramatic a bracket cinematic gets the closer to the Final. */
export function bracketTension(roundIndex: number): number {
  return [1, 1.15, 1.35, 1.6][roundIndex] ?? 1;
}

export const DEFAULT_SETTINGS: Settings = {
  roundSeconds: 30,
  roundSecondsByRound: { r16: 30, qf: 40, sf: 50, final: 60 },
  suddenDeathSeconds: 5,
  chatWeight: 1,
  giftWeight: 10,
  dedupeChat: true,
  allowVoteChange: true,
  tieRule: "sudden-death",
  autoNextMatch: true,
  autoNextTournament: false,
  autoStageView: false,
  showVoteHint: false,
  categorySeconds: 20,
  roundIntroSeconds: 4,
  bracketIntroSeconds: 3,
  bracketOutroSeconds: 8,
  roundRecapSeconds: 6,
  resultSeconds: 6,
  showBracketIntro: true,
  showBracketOutro: true,
  showRoundRecap: true,
  showBackground: "#070a14",
  bracketPace: 1,
  bracketZoom: 3,
  controlCinematic: false,
  stageTextScale: 1.15,
  stageScale: 1,
  simVotesPerTick: 3,
  simIntervalMs: 700,
  simGiftChance: 0.12,
  sound: {
    muted: false,
    master: 0.8,
    sfx: 0.85,
    voice: 1,
    disabledCues: [],
  },
};

/** One row of the estimated show schedule for a single 16-item tournament. */
export interface ShowPhaseEstimate {
  key: "category" | "roundIntro" | "bracketIntro" | "match" | "bracketOutro" | "roundRecap" | "result" | "champion";
  count: number;
  /** Total seconds this phase contributes across the tournament. */
  seconds: number;
}

/**
 * Estimates the phases a full 16-item tournament will play and how long each
 * takes, honouring the bracket-cinematic toggles. Pure, so Control can show a
 * live runtime estimate while the host tunes pace, timings and toggles.
 */
export function estimateShowSchedule(s: Settings): { phases: ShowPhaseEstimate[]; totalSeconds: number } {
  const pace = s.bracketPace ?? 1;
  let roundIntro = 0;
  let bracketIntro = 0;
  let bracketOutro = 0;
  let roundRecap = 0;
  let match = 0;
  let results = 0;
  let matches = 0;

  ROUND_ORDER.forEach((round, i) => {
    const size = ROUND_SIZES[round] ?? 0;
    const tension = bracketTension(i);
    matches += size;
    match += size * (s.roundSecondsByRound?.[round] ?? s.roundSeconds);
    results += size * s.resultSeconds;
    roundIntro += s.roundIntroSeconds;
    if (s.showBracketIntro) bracketIntro += size * s.bracketIntroSeconds * tension * pace;
    if (s.showBracketOutro) bracketOutro += size * s.bracketOutroSeconds * tension * pace;
    // The final has no "next round", so no recap after it.
    if (s.showRoundRecap && round !== "final") roundRecap += s.roundRecapSeconds * tension * pace;
  });

  const phases: ShowPhaseEstimate[] = [
    { key: "category", count: 1, seconds: s.categorySeconds },
    { key: "roundIntro", count: ROUND_ORDER.length, seconds: roundIntro },
    { key: "bracketIntro", count: s.showBracketIntro ? matches : 0, seconds: bracketIntro },
    { key: "match", count: matches, seconds: match },
    { key: "bracketOutro", count: s.showBracketOutro ? matches : 0, seconds: bracketOutro },
    { key: "roundRecap", count: s.showRoundRecap ? ROUND_ORDER.length - 1 : 0, seconds: roundRecap },
    { key: "result", count: matches, seconds: results },
    { key: "champion", count: 1, seconds: s.resultSeconds },
  ];
  const totalSeconds = phases.reduce((sum, phase) => sum + phase.seconds, 0);
  return { phases, totalSeconds };
}

export const SERVER_PORT = 8787;

/**
 * Effect keys the session implements. The manifest declares exactly these; a
 * test asserts the two lists match, so an effect can never be advertised and
 * unimplemented (or implemented and forgotten).
 */
export const HANDLED_EFFECT_KEYS = [
  "add_vote",
  "boost_side",
  "steal_votes",
  "block_side",
  "add_time",
  "rush_timer",
  "freeze_timer",
  "set_side_gift",
  "swap_sides",
  "category_vote",
] as const;

export type HandledEffectKey = (typeof HANDLED_EFFECT_KEYS)[number];

export function isHandledEffect(key: string): key is HandledEffectKey {
  return (HANDLED_EFFECT_KEYS as readonly string[]).includes(key);
}
