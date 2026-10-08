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
  autoStageView: false,
  showVoteHint: true,
  categorySeconds: 20,
  roundIntroSeconds: 4,
  bracketIntroSeconds: 3,
  bracketOutroSeconds: 8,
  resultSeconds: 6,
  showBackground: "transparent",
  safeTopPct: 0,
  safeBottomPct: 0,
  stageTextScale: 1.15,
  sound: {
    muted: false,
    master: 0.8,
    music: 0.35,
    sfx: 0.85,
    voice: 1,
    musicEnabled: true,
    musicTrack: "auto",
    disabledCues: [],
    trackVolume: {},
  },
};

export const SERVER_PORT = 8787;

/** Every sound cue id (kept in sync with src/sound/cues.ts RECIPES). */
export const SOUND_CUE_IDS = [
  "category.start",
  "category.vote",
  "category.winner",
  "round.intro",
  "bracket.intro",
  "bracket.focus",
  "bracket.outro",
  "bracket.winner",
  "match.countdown",
  "match.start",
  "match.tick",
  "match.suddenDeath",
  "match.end",
  "vote.chat",
  "vote.gift.small",
  "vote.gift.medium",
  "vote.gift.large",
  "vote.lead",
  "result.win",
  "result.lose",
  "champion.win",
  "champion.reveal",
  "champion.supporter",
  "live.like",
  "live.follow",
  "live.share",
  "live.subscribe",
  "live.member",
] as const;

/** Every show slot a music bed can be requested for (see src/sound/music.ts SLOT_TRACK). */
export const MUSIC_TRACK_IDS = [
  "music.category",
  "music.match.r16",
  "music.match.qf",
  "music.match.sf",
  "music.match.final",
  "music.champion",
] as const;

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
