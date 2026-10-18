export type RoundId = "r16" | "qf" | "sf" | "final";

/** The app's content/display languages. Each has its own category library. */
export type Lang = "ar" | "en" | "tr";

export type StageView = "match" | "bracket";

export type LiveEventType = "chat" | "gift" | "like" | "follow" | "share" | "member" | "subscribe" | "roomUser";

export interface LiveEvent {
  type: LiveEventType;
  userId: string;
  username: string;
  name: string;
  avatar: string;
  at: number;
  message?: string;
  giftName?: string;
  giftId?: string | number;
  coins?: number;
  count?: number;
  likeCount?: number;
}

export interface Supporter {
  id: string;
  name: string;
  avatar: string;
  points: number;
}

/** A viewer who cast a vote, retaining the display name + avatar for toasts/polls. */
export interface PollVoter {
  id: string;
  name: string;
  avatar: string;
}

/** A short-lived record of one vote, so the overlay can raise a nickname toast. */
export interface VoteToast extends PollVoter {
  side: "a" | "b";
  at: number;
}

export interface LiveState {
  connected: boolean;
  url: string;
  game: string;
  keySet: boolean;
  lastEventAt: number | null;
  counts: Record<LiveEventType, number>;
  supporters: Supporter[];
  lastEvents: LiveEvent[];
  /** Newest-first log of recent match votes (capped), for the overlay toasts. */
  recentVotes: VoteToast[];
}

export type ShowPhase =
  | "idle"
  | "category"
  | "round-intro"
  | "bracket-intro"
  | "match"
  | "bracket-outro"
  | "round-recap"
  | "result"
  | "champion";

export interface ShowResult {
  round: RoundId;
  a: string | null;
  b: string | null;
  winner: string | null;
  votesA: number;
  votesB: number;
  votersA: string[];
  votersB: string[];
}

export interface ShowState {
  active: boolean;
  paused: boolean;
  phase: ShowPhase;
  phaseEndsAt: number | null;
  categoryVotes: Record<string, number>;
  categoryVoters: string[];
  /** The offered categories for the current category vote (empty = all). */
  categoryCandidates: string[];
  /** Voters per category (with name + avatar) so the poll can show profile icons. */
  categoryVoterList: Record<string, PollVoter[]>;
  result: ShowResult | null;
  champion: string | null;
}

export interface Gift {
  id: string;
  name: string;
  icon: string;
  /** Locally cached artwork (`/gifts/...`), resolved from the hub catalogue. */
  img?: string;
}

/** A gift as the Tikora hub reports it in its catalogue. */
export interface HubGift {
  id: number | string;
  name: string;
  coins?: number;
  tier?: string;
  img?: string;
}

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type CropMode = "crop" | "stretch";

export interface Item {
  id: string;
  name: string;
  /** Dedicated Arabic display name (falls back to a matching Arabic alias). */
  nameAr?: string;
  aliases: string[];
  image?: string;
  imageOriginal?: string;
  imageCrop?: CropRect;
  imageCropMode?: CropMode;
  emoji?: string;
  gift?: Gift;
}

export interface Category {
  id: string;
  name: string;
  nameAr?: string;
  /** Which language library this category belongs to. Missing = "ar" (legacy). */
  lang?: Lang;
  items: Item[];
  giftPair?: [Gift, Gift];
  roundSeconds?: number;
  /** Manual ordering; categories without one fall after ordered ones. */
  order?: number;
}

export interface Match {
  id: string;
  round: RoundId;
  index: number;
  a: string | null;
  b: string | null;
  votesA: number;
  votesB: number;
  votersA: string[];
  votersB: string[];
  winner: string | null;
  status: "pending" | "live" | "done";
  endsAt: number | null;
}

export interface Bracket {
  rounds: Record<RoundId, Match[]>;
}

export type TieRule = "sudden-death" | "random" | "higher-seed";

export interface SoundSettings {
  muted: boolean;
  master: number;
  sfx: number;
  voice: number;
  disabledCues: string[];
}

export interface Settings {
  roundSeconds: number;
  /** Default match length per round; the global `roundSeconds` is the fallback. */
  roundSecondsByRound: Record<RoundId, number>;
  suddenDeathSeconds: number;
  chatWeight: number;
  giftWeight: number;
  dedupeChat: boolean;
  /** Let a viewer move their vote to the other side instead of being ignored. */
  allowVoteChange: boolean;
  tieRule: TieRule;
  autoNextMatch: boolean;
  autoNextTournament: boolean;
  autoStageView: boolean;
  showVoteHint: boolean;
  categorySeconds: number;
  roundIntroSeconds: number;
  bracketIntroSeconds: number;
  bracketOutroSeconds: number;
  roundRecapSeconds: number;
  resultSeconds: number;
  /** Play the bracket zoom-in before each match. */
  showBracketIntro: boolean;
  /** Play the bracket zoom-out after each match. */
  showBracketOutro: boolean;
  /** Play the bracket sweep when a round finishes. */
  showRoundRecap: boolean;
  /** Show-window background color (hex). */
  showBackground: string;
  /** Multiplier for the bracket cinematic length (0.6 = quick, 1.8 = slow/dramatic). */
  bracketPace: number;
  /** How far the bracket camera zooms onto the active match (1.2 = near, 5 = tight). */
  bracketZoom: number;
  /** Play the bracket cinematic depth in the Control board too, for rehearsal. */
  controlCinematic: boolean;
  /** Multiplier for match text (header, names, votes, vote bar, vote hint). */
  stageTextScale: number;
  /** Multiplier for the whole overlay stage (photos + text). 1 = default. */
  stageScale: number;
  /** Simulator: max fake votes per tick (1 is the floor). */
  simVotesPerTick: number;
  /** Simulator: how often a tick runs, in milliseconds. */
  simIntervalMs: number;
  /** Simulator: chance a tick fires a gift instead of a chat vote. */
  simGiftChance: number;
  sound: SoundSettings;
}

export interface Tournament {
  id: string;
  categoryId: string;
  bracket: Bracket;
  currentRound: RoundId;
  currentMatchIndex: number;
  status: "idle" | "running" | "between" | "done";
  champion: string | null;
}

export interface QueueEntry {
  categoryId: string;
  roundSecondsOverride?: number;
}

export interface LogEntry {
  at: number;
  kind: "info" | "vote" | "round" | "error";
  message: string;
}

/**
 * A timed power-up applied to one side of the live match: `boost` makes that
 * side's votes count extra, `block` stops it scoring at all. `until` is epoch
 * ms, so the broadcast can count the badge down itself.
 */
export interface SideEffect {
  kind: "boost" | "block";
  side: "a" | "b";
  until: number;
  multiplier?: number;
}

/**
 * The clock is being held instead of counting down — either frozen by a
 * power-up (`until` = epoch ms when it releases) or paused by the host
 * (`until` = null). `remainingMs` is the value to keep showing the whole time.
 */
export interface ClockHold {
  until: number | null;
  remainingMs: number;
}

export interface SessionState {
  status: "idle" | "running" | "paused" | "done";
  settings: Settings;
  /** The active content/display language. Categories and queue are scoped to it. */
  lang: Lang;
  /** Active-language view of the queue (kept in sync with `queues[lang]`). */
  queue: QueueEntry[];
  queueIndex: number;
  /** Per-language queues, so switching language keeps each side's list intact. */
  queues: Record<Lang, QueueEntry[]>;
  queueIndexes: Record<Lang, number>;
  tournament: Tournament | null;
  matchEndsAt: number | null;
  matchHold: ClockHold | null;
  sideEffects: SideEffect[];
  stageView: StageView;
  show: ShowState;
  live: LiveState;
  simulated: boolean;
  categories: Category[];
  log: LogEntry[];
}

export interface CommandMap {
  "settings:update": Partial<Settings>;
  "queue:set": QueueEntry[];
  "queue:add": string;
  "queue:remove": number;
  "category:save": Category;
  "category:delete": string;
  "category:reorder": string[];
  "lang:set": Lang;
  "tournament:start": { categoryId?: string } | undefined;
  "tournament:next": undefined;
  "match:start": undefined;
  "match:pause": undefined;
  "match:resume": undefined;
  "match:skip": undefined;
  "match:extend": number | undefined;
  "match:forceWinner": "a" | "b";
  "match:jump": { round?: RoundId; index?: number };
  "vote:chat": { text: string; viewer: string };
  "vote:gift": { giftId: string; viewer: string; count?: number };
  "view:set": StageView;
  "show:start": undefined;
  "show:stop": undefined;
  "show:pause": undefined;
  "show:resume": undefined;
  "show:skipPhase": undefined;
  "poll:start": undefined;
  "poll:stop": undefined;
  "live:connect": undefined;
  "live:disconnect": undefined;
  "live:update": { url?: string; slug?: string; key?: string };
  "live:inject": LiveEvent;
  "sound:update": Partial<SoundSettings>;
  "cue:emit": { id: string };
  "sim:set": { on: boolean } | undefined;
  "demo:start": { seconds?: number; categories?: string[]; single?: boolean } | undefined;
  "rehearsal:start": { categoryId?: string } | undefined;
  "session:reset": undefined;
}

export interface ManifestParam {
  key: string;
  label?: string;
  type?: string;
}

export interface ManifestEffect {
  key: string;
  label?: string;
  kind?: string;
  params?: ManifestParam[];
}

export interface ManifestEvent {
  key: string;
  label?: string;
}

/** Shape of tikora.manifest.json — the single source of truth for hub effects. */
export interface GameManifest {
  slug: string;
  effects: ManifestEffect[];
  events: ManifestEvent[];
}
