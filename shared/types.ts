export type RoundId = "r16" | "qf" | "sf" | "final";

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

export interface Settings {
  roundSeconds: number;
  suddenDeathSeconds: number;
  chatWeight: number;
  giftWeight: number;
  dedupeChat: boolean;
  tieRule: TieRule;
  autoNextMatch: boolean;
  autoNextTournament: boolean;
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

export interface SessionState {
  status: "idle" | "running" | "paused" | "done";
  settings: Settings;
  queue: QueueEntry[];
  queueIndex: number;
  tournament: Tournament | null;
  matchEndsAt: number | null;
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
  "sim:set": { on: boolean } | undefined;
  "demo:start": { seconds?: number; categories?: string[]; single?: boolean } | undefined;
  "session:reset": undefined;
}
