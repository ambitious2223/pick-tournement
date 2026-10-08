export type RoundId = "r16" | "qf" | "sf" | "final";

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

export interface LiveState {
  connected: boolean;
  url: string;
  game: string;
  keySet: boolean;
  lastEventAt: number | null;
  counts: Record<LiveEventType, number>;
  supporters: Supporter[];
  lastEvents: LiveEvent[];
}

export type ShowPhase =
  | "idle"
  | "category"
  | "round-intro"
  | "bracket-intro"
  | "match"
  | "bracket-outro"
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
  result: ShowResult | null;
  champion: string | null;
}

export interface Gift {
  id: string;
  name: string;
  icon: string;
}

export interface Item {
  id: string;
  name: string;
  aliases: string[];
  image?: string;
  emoji?: string;
  gift?: Gift;
}

export interface Category {
  id: string;
  name: string;
  nameAr?: string;
  items: Item[];
  giftPair?: [Gift, Gift];
  roundSeconds?: number;
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
  music: number;
  sfx: number;
  voice: number;
  musicEnabled: boolean;
  /** Background track: "auto" escalates per round, otherwise a MUSIC_LIBRARY id. */
  musicTrack: string;
  disabledCues: string[];
  trackVolume: Record<string, number>;
}

export interface Settings {
  roundSeconds: number;
  suddenDeathSeconds: number;
  chatWeight: number;
  giftWeight: number;
  dedupeChat: boolean;
  tieRule: TieRule;
  autoNextMatch: boolean;
  autoNextTournament: boolean;
  autoStageView: boolean;
  showVoteHint: boolean;
  categorySeconds: number;
  roundIntroSeconds: number;
  bracketIntroSeconds: number;
  bracketOutroSeconds: number;
  resultSeconds: number;
  showBackground: "transparent" | "dark";
  safeTopPct: number;
  safeBottomPct: number;
  /** Multiplier for match text (header, names, votes, vote bar, vote hint). */
  stageTextScale: number;
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
  queue: QueueEntry[];
  queueIndex: number;
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
  "live:connect": undefined;
  "live:disconnect": undefined;
  "live:update": { url?: string; slug?: string; key?: string };
  "live:inject": LiveEvent;
  "sound:update": Partial<SoundSettings>;
  "cue:emit": { id: string };
  "sim:set": { on: boolean } | undefined;
  "demo:start": { seconds?: number; categories?: string[]; single?: boolean } | undefined;
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
