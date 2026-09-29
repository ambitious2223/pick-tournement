import type {
  Category,
  CommandMap,
  Item,
  LogEntry,
  Match,
  QueueEntry,
  SessionState,
} from "../shared/types.ts";
import { DEFAULT_SETTINGS, ROUND_LABELS, ROUND_ORDER } from "../shared/config.ts";
import { matchItem } from "../engine/matcher.ts";
import { castChatVote, castGiftVote, resolveWinner, type Rng } from "../engine/match.ts";
import { completeMatch, createTournament, currentMatch } from "../engine/tournament.ts";
import { fakeViewer, pickSide } from "../engine/simulate.ts";
import { loadCategories, saveCategory, deleteCategory, saveSessionDebounced } from "./store.ts";

export type ServerEvent = { type: "state"; state: SessionState };

type Listener = (event: ServerEvent) => void;

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

export class Session {
  state: SessionState;
  private listeners = new Set<Listener>();
  private matchTimer: NodeJS.Timeout | null = null;
  private simTimer: NodeJS.Timeout | null = null;
  private remainingMs = 0;
  private rng: Rng = Math.random;

  private constructor(state: SessionState) {
    this.state = state;
  }

  static async create(): Promise<Session> {
    const categories = await loadCategories();
    const state: SessionState = {
      status: "idle",
      settings: { ...DEFAULT_SETTINGS },
      queue: [],
      queueIndex: 0,
      tournament: null,
      matchEndsAt: null,
      simulated: false,
      categories,
      log: [],
    };
    return new Session(state);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    for (const listener of this.listeners) listener({ type: "state", state: this.state });
  }

  private log(kind: LogEntry["kind"], message: string): void {
    this.state.log.push({ at: Date.now(), kind, message });
    if (this.state.log.length > 200) this.state.log.shift();
  }

  private persist(): void {
    saveSessionDebounced(this.state);
  }

  private category(id: string): Category | undefined {
    return this.state.categories.find((c) => c.id === id);
  }

  private currentCategory(): Category | undefined {
    const t = this.state.tournament;
    return t ? this.category(t.categoryId) : undefined;
  }

  private item(id: string | null): Item | null {
    if (!id) return null;
    return this.currentCategory()?.items.find((i) => i.id === id) ?? null;
  }

  refreshCategories(): void {
    loadCategories().then((cats) => {
      this.state.categories = cats;
      this.emit();
    });
  }

  // ---- tournament lifecycle -------------------------------------------------

  startTournament(categoryId?: string): void {
    const target = categoryId ?? this.state.queue[this.state.queueIndex]?.categoryId;
    const category = target ? this.category(target) : this.state.categories[0];
    if (!category) {
      this.log("error", "No category available to start.");
      this.emit();
      return;
    }
    this.state.tournament = createTournament(category, nextId("t"));
    this.state.status = "running";
    this.log("info", `Tournament started: ${category.name}`);
    this.startMatch();
  }

  nextTournament(): void {
    if (this.state.tournament) this.stopTimer();
    if (this.state.queueIndex + 1 < this.state.queue.length) {
      this.state.queueIndex += 1;
      this.state.tournament = null;
      this.startTournament();
    } else {
      this.state.status = "done";
      this.state.tournament = null;
      this.state.matchEndsAt = null;
      this.log("info", "Queue finished.");
      this.emit();
    }
  }

  private currentRoundSeconds(): number {
    const entry = this.state.queue[this.state.queueIndex];
    const override = entry?.roundSecondsOverride;
    const categoryOverride = this.currentCategory()?.roundSeconds;
    return override ?? categoryOverride ?? this.state.settings.roundSeconds;
  }

  startMatch(): void {
    const t = this.state.tournament;
    const match = t ? currentMatch(t) : null;
    if (!t || !match) return;

    match.status = "live";
    const seconds = this.currentRoundSeconds();
    this.remainingMs = seconds * 1000;
    this.state.matchEndsAt = Date.now() + this.remainingMs;
    match.endsAt = this.state.matchEndsAt;
    this.schedule(this.remainingMs);
    this.log("round", `${ROUND_LABELS[match.round]} — match ${match.index + 1} live (${seconds}s)`);
    this.emit();
  }

  private schedule(ms: number): void {
    this.stopTimer();
    this.matchTimer = setTimeout(() => this.onMatchTimeout(), ms);
  }

  private stopTimer(): void {
    if (this.matchTimer) clearTimeout(this.matchTimer);
    this.matchTimer = null;
    this.state.matchEndsAt = null;
    const match = this.state.tournament ? currentMatch(this.state.tournament) : null;
    if (match) match.endsAt = null;
  }

  pauseMatch(): void {
    if (this.state.status !== "running") return;
    const endsAt = this.state.matchEndsAt;
    this.remainingMs = endsAt ? Math.max(0, endsAt - Date.now()) : this.remainingMs;
    this.stopTimer();
    this.state.status = "paused";
    this.log("info", "Match paused.");
    this.emit();
  }

  resumeMatch(): void {
    if (this.state.status !== "paused") return;
    this.state.status = "running";
    this.state.matchEndsAt = Date.now() + this.remainingMs;
    const match = this.state.tournament ? currentMatch(this.state.tournament) : null;
    if (match) match.endsAt = this.state.matchEndsAt;
    this.schedule(this.remainingMs);
    this.log("info", "Match resumed.");
    this.emit();
  }

  extendMatch(seconds: number): void {
    if (this.state.status !== "running") return;
    this.remainingMs += seconds * 1000;
    this.state.matchEndsAt = Date.now() + this.remainingMs;
    this.schedule(this.remainingMs);
    this.emit();
  }

  skipMatch(): void {
    this.onMatchTimeout(true);
  }

  private onMatchTimeout(forced = false): void {
    const t = this.state.tournament;
    const match = t ? currentMatch(t) : null;
    if (!t || !match) return;
    this.stopTimer();

    const winner = forced ? (match.votesA >= match.votesB ? match.a : match.b) : resolveWinner(match, this.state.settings, this.rng);

    if (!winner) {
      this.remainingMs = this.state.settings.suddenDeathSeconds * 1000;
      this.state.matchEndsAt = Date.now() + this.remainingMs;
      this.schedule(this.remainingMs);
      this.log("info", "Tie — sudden death!");
      this.emit();
      return;
    }

    const name = this.item(winner)?.name ?? winner;
    const wasTie = match.votesA === match.votesB;
    const progress = completeMatch(t, winner);
    this.log("round", `${name} wins ${match.votesA + (wasTie ? 0 : 0)}-${match.votesB}`);

    if (progress.tournamentComplete) {
      this.state.matchEndsAt = null;
      this.log("info", `Champion: ${this.item(t.champion)?.name ?? t.champion}`);
      if (this.state.settings.autoNextTournament) this.nextTournament();
      else {
        this.state.status = "done";
        this.emit();
      }
      return;
    }

    if (this.state.settings.autoNextMatch) this.startMatch();
    else {
      this.state.status = "paused";
      this.emit();
    }
  }

  jumpTo(round: string, index: number): void {
    const t = this.state.tournament;
    if (!t) return;
    if (ROUND_ORDER.includes(round as never)) t.currentRound = round as Match["round"];
    const roundMatches = t.bracket.rounds[t.currentRound];
    const target = Math.max(0, Math.min(index, roundMatches.length - 1));
    t.currentMatchIndex = target;
    this.stopTimer();
    this.state.status = "running";
    this.startMatch();
  }

  forceWinner(side: "a" | "b"): void {
    const t = this.state.tournament;
    const match = t ? currentMatch(t) : null;
    if (!t || !match) return;
    const winner = side === "a" ? match.a : match.b;
    if (!winner) return;
    this.stopTimer();
    const progress = completeMatch(t, winner);
    this.log("info", `Host forced winner: ${this.item(winner)?.name ?? winner}`);
    if (progress.tournamentComplete) {
      this.state.status = this.state.settings.autoNextTournament ? "running" : "done";
      if (this.state.settings.autoNextTournament) this.nextTournament();
      else this.emit();
      return;
    }
    if (this.state.settings.autoNextMatch) this.startMatch();
    else {
      this.state.status = "paused";
      this.emit();
    }
  }

  // ---- votes ----------------------------------------------------------------

  private currentItems(): (Item | null)[] {
    const t = this.state.tournament;
    const match = t ? currentMatch(t) : null;
    if (!match) return [null, null];
    return [this.item(match.a), this.item(match.b)];
  }

  chatVote(text: string, viewer: string): void {
    const match = this.liveMatch();
    if (!match) return;
    const itemId = matchItem(text, this.currentItems());
    if (!itemId) return;
    const result = castChatVote(match, itemId, viewer, this.state.settings);
    if (result.ok) {
      this.log("vote", `${viewer} voted for ${this.item(itemId)?.name ?? itemId}`);
      this.emit();
    }
  }

  giftVote(giftId: string, viewer: string, count = 1): void {
    const match = this.liveMatch();
    if (!match) return;
    const itemId = this.giftSide(giftId);
    if (!itemId) return;
    const result = castGiftVote(match, itemId, viewer, this.state.settings, count);
    if (result.ok) {
      this.log("vote", `${viewer} gifted → ${this.item(itemId)?.name ?? itemId}`);
      this.emit();
    }
  }

  private giftSide(giftId: string): string | null {
    const category = this.currentCategory();
    const [a, b] = this.currentItems();
    for (const item of [a, b]) {
      if (item?.gift?.id === giftId) return item.id;
    }
    if (category?.giftPair) {
      if (category.giftPair[0].id === giftId) return a?.id ?? null;
      if (category.giftPair[1].id === giftId) return b?.id ?? null;
    }
    return null;
  }

  private liveMatch(): Match | null {
    const t = this.state.tournament;
    const match = t ? currentMatch(t) : null;
    return match && match.status === "live" ? match : null;
  }

  // ---- simulator ------------------------------------------------------------

  setSimulated(on: boolean): void {
    this.state.simulated = on;
    if (this.simTimer) {
      clearInterval(this.simTimer);
      this.simTimer = null;
    }
    if (on) {
      this.simTimer = setInterval(() => this.simTick(), 700);
      this.log("info", "Simulator on.");
    } else {
      this.log("info", "Simulator off.");
    }
    this.emit();
  }

  private simTick(): void {
    const match = this.liveMatch();
    if (!match) return;
    const votes = 1 + Math.floor(this.rng() * 3);
    for (let i = 0; i < votes; i++) {
      if (this.rng() < 0.12) {
        const gift = this.currentItems()[pickSide(this.rng) === "a" ? 0 : 1]?.gift;
        if (gift) {
          this.giftVote(gift.id, fakeViewer(this.rng), 1);
          continue;
        }
      }
      const side = pickSide(this.rng);
      const item = side === "a" ? match.a : match.b;
      if (item) this.chatVote(this.item(item)?.name ?? "", fakeViewer(this.rng));
    }
  }

  // ---- configuration --------------------------------------------------------

  setQueue(queue: QueueEntry[]): void {
    this.state.queue = queue;
    this.persist();
    this.emit();
  }

  addToQueue(categoryId: string): void {
    this.state.queue.push({ categoryId });
    this.persist();
    this.emit();
  }

  removeFromQueue(index: number): void {
    this.state.queue.splice(index, 1);
    this.persist();
    this.emit();
  }

  async saveCategoryAndRefresh(category: Category): Promise<void> {
    await saveCategory(category);
    await this.refreshWait();
  }

  async deleteCategoryAndRefresh(id: string): Promise<void> {
    await deleteCategory(id);
    await this.refreshWait();
  }

  private async refreshWait(): Promise<void> {
    this.state.categories = await loadCategories();
    this.emit();
  }

  updateSettings(patch: Partial<SessionState["settings"]>): void {
    this.state.settings = { ...this.state.settings, ...patch };
    this.persist();
    this.emit();
  }

  startDemo(seconds: number, categories?: string[], single?: boolean): void {
    const byPhotos = this.state.categories
      .toSorted((a, b) => b.items.filter((i) => i.image).length - a.items.filter((i) => i.image).length)
      .map((c) => c.id);
    let ids = categories && categories.length > 0 ? categories : byPhotos;
    if (single) ids = ids.slice(0, 1);
    if (ids.length === 0) {
      this.log("error", "No categories to demo.");
      this.emit();
      return;
    }
    this.stopTimer();
    this.state.settings = {
      ...this.state.settings,
      roundSeconds: seconds,
      autoNextMatch: true,
      autoNextTournament: true,
    };
    this.state.queue = ids.map((categoryId) => ({ categoryId }));
    this.state.queueIndex = 0;
    this.state.tournament = null;
    this.log("info", `Demo: ${ids.length} categories, ${seconds}s rounds`);
    this.setSimulated(true);
    this.startTournament(ids[0]);
  }

  reset(): void {
    this.stopTimer();
    this.setSimulated(false);
    this.state.tournament = null;
    this.state.matchEndsAt = null;
    this.state.status = "idle";
    this.state.log = [];
    this.log("info", "Session reset.");
    this.emit();
  }

  async dispatch<K extends keyof CommandMap>(command: K, payload: CommandMap[K]): Promise<void> {
    switch (command) {
      case "settings:update":
        this.updateSettings(payload as Partial<SessionState["settings"]>);
        break;
      case "queue:set":
        this.setQueue(payload as QueueEntry[]);
        break;
      case "queue:add":
        this.addToQueue(payload as string);
        break;
      case "queue:remove":
        this.removeFromQueue(payload as number);
        break;
      case "category:save":
        await this.saveCategoryAndRefresh(payload as Category);
        break;
      case "category:delete":
        await this.deleteCategoryAndRefresh(payload as string);
        break;
      case "tournament:start": {
        const arg = payload as { categoryId?: string } | undefined;
        this.startTournament(arg?.categoryId);
        break;
      }
      case "tournament:next":
        this.nextTournament();
        break;
      case "match:start":
        if (this.state.tournament) this.startMatch();
        else this.startTournament();
        break;
      case "match:pause":
        this.pauseMatch();
        break;
      case "match:resume":
        this.resumeMatch();
        break;
      case "match:skip":
        this.skipMatch();
        break;
      case "match:extend":
        this.extendMatch((payload as number | undefined) ?? 10);
        break;
      case "match:forceWinner":
        this.forceWinner(payload as "a" | "b");
        break;
      case "match:jump": {
        const arg = (payload as { round?: string; index?: number } | undefined) ?? {};
        const t = this.state.tournament;
        if (t) {
          const round = arg.round ?? t.currentRound;
          const index = arg.index ?? 0;
          this.jumpTo(round, index);
        }
        break;
      }
      case "vote:chat": {
        const arg = payload as { text: string; viewer: string };
        this.chatVote(arg.text, arg.viewer);
        break;
      }
      case "vote:gift": {
        const arg = payload as { giftId: string; viewer: string; count?: number };
        this.giftVote(arg.giftId, arg.viewer, arg.count ?? 1);
        break;
      }
      case "sim:set":
        this.setSimulated((payload as { on: boolean } | undefined)?.on ?? !this.state.simulated);
        break;
      case "demo:start": {
        const arg = payload as { seconds?: number; categories?: string[]; single?: boolean } | undefined;
        this.startDemo(arg?.seconds ?? 2, arg?.categories, arg?.single);
        break;
      }
      case "session:reset":
        this.reset();
        break;
      default:
        this.log("error", `Unknown command: ${String(command)}`);
        this.emit();
    }
  }
}
