import type {
  Category,
  CommandMap,
  Item,
  LiveEvent,
  LogEntry,
  Match,
  QueueEntry,
  SessionState,
  Settings,
  SoundSettings,
  StageView,
  Supporter,
} from "../shared/types.ts";
import { DEFAULT_SETTINGS, ROUND_LABELS, ROUND_ORDER } from "../shared/config.ts";
import { matchCategory, matchItem, normalize } from "../engine/matcher.ts";
import { cacheAvatar } from "./avatars.ts";
import { saveLiveConfig, type LiveConfig } from "./liveConfig.ts";
import type { LiveClient } from "./live.ts";
import { castChatVote, castGiftVote, resolveWinner, type Rng } from "../engine/match.ts";
import { completeMatch, createTournament, currentMatch } from "../engine/tournament.ts";
import { fakeViewer, pickSide } from "../engine/simulate.ts";
import { loadCategories, loadSession, saveCategory, deleteCategory, saveSessionDebounced } from "./store.ts";

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
  private showTimer: NodeJS.Timeout | null = null;
  private simTimer: NodeJS.Timeout | null = null;
  private remainingMs = 0;
  private showRemainingMs = 0;
  private rng: Rng = Math.random;
  private live: LiveClient | null = null;
  private liveConfig: LiveConfig | null = null;
  private supporters = new Map<string, Supporter>();
  private showRound: Match["round"] | null = null;
  private showFallbackCategory: string | null = null;

  private constructor(state: SessionState) {
    this.state = state;
  }

  /** Restore saved settings (deep-merging newer fields like `sound`). */
  private static mergeSettings(saved: SessionState | null): Settings {
    const base: Settings = {
      ...DEFAULT_SETTINGS,
      sound: { ...DEFAULT_SETTINGS.sound, trackVolume: { ...DEFAULT_SETTINGS.sound.trackVolume } },
    };
    if (!saved?.settings) return base;
    return {
      ...base,
      ...saved.settings,
      sound: {
        ...base.sound,
        ...saved.settings.sound,
        trackVolume: { ...base.sound.trackVolume, ...saved.settings.sound?.trackVolume },
      },
    };
  }

  static async create(): Promise<Session> {
    const categories = await loadCategories();
    const saved = await loadSession();
    const state: SessionState = {
      status: "idle",
      settings: Session.mergeSettings(saved),
      queue: Array.isArray(saved?.queue) ? saved.queue : [],
      queueIndex: typeof saved?.queueIndex === "number" ? saved.queueIndex : 0,
      tournament: null,
      matchEndsAt: null,
      stageView: "match",
      show: {
        active: false,
        paused: false,
        phase: "idle",
        phaseEndsAt: null,
        categoryVotes: {},
        categoryVoters: [],
        result: null,
        champion: null,
      },
      live: {
        connected: false,
        url: "ws://127.0.0.1:27016/",
        game: "pick-league",
        keySet: false,
        lastEventAt: null,
        counts: { chat: 0, gift: 0, like: 0, follow: 0, share: 0, member: 0, subscribe: 0, roomUser: 0 },
        supporters: [],
        lastEvents: [],
      },
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
    if (this.state.show.active) this.stopShow();
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

  /** Creates a fresh tournament for a category without starting the clock. */
  private prepareTournament(categoryId: string): boolean {
    const category = this.category(categoryId) ?? this.state.categories[0];
    if (!category) return false;
    this.stopTimer();
    this.state.tournament = createTournament(category, nextId("t"));
    this.state.status = "running";
    this.state.matchEndsAt = null;
    this.log("info", `Category selected: ${category.name}`);
    return true;
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

  // ---- show flow (automatic broadcast sequence) ------------------------------

  private clearShowTimer(): void {
    if (this.showTimer) clearTimeout(this.showTimer);
    this.showTimer = null;
  }

  private phaseDurationMs(): number {
    const s = this.state.settings;
    switch (this.state.show.phase) {
      case "category":
        return s.categorySeconds * 1000;
      case "round-intro":
        return s.roundIntroSeconds * 1000;
      case "bracket-intro":
        return s.bracketIntroSeconds * 1000;
      case "bracket-outro":
        return s.bracketOutroSeconds * 1000;
      case "result":
      case "champion":
        return s.resultSeconds * 1000;
      default:
        return s.roundSeconds * 1000;
    }
  }

  private setShowPhaseTimer(ms: number): void {
    this.clearShowTimer();
    const wait = Math.max(0, ms);
    this.state.show.phaseEndsAt = Date.now() + wait;
    this.showTimer = setTimeout(() => this.onShowPhaseTimeout(), wait);
  }

  startShow(): void {
    this.clearShowTimer();
    this.stopTimer();
    this.showRound = null;
    // Remember the category the host already picked so the first category vote
    // falls back to it instead of the alphabetically-first category.
    this.showFallbackCategory =
      this.state.tournament?.categoryId ?? this.state.queue[this.state.queueIndex]?.categoryId ?? null;
    this.state.show.active = true;
    this.state.show.paused = false;
    this.state.show.result = null;
    this.state.show.champion = null;
    this.log("info", "Show started.");
    this.beginCategoryVote();
  }

  stopShow(): void {
    this.clearShowTimer();
    this.stopTimer();
    this.state.show.active = false;
    this.state.show.paused = false;
    this.state.show.phase = "idle";
    this.state.show.phaseEndsAt = null;
    this.state.show.categoryVotes = {};
    this.state.show.categoryVoters = [];
    this.log("info", "Show stopped.");
    this.emit();
  }

  pauseShow(): void {
    if (!this.state.show.active || this.state.show.paused) return;
    this.state.show.paused = true;
    if (this.state.show.phase === "match") {
      this.pauseMatch();
    } else {
      const endsAt = this.state.show.phaseEndsAt;
      this.showRemainingMs = endsAt ? Math.max(0, endsAt - Date.now()) : this.phaseDurationMs();
      this.clearShowTimer();
      this.state.show.phaseEndsAt = null;
      this.state.status = "paused";
    }
    this.log("info", "Show paused.");
    this.emit();
  }

  resumeShow(): void {
    if (!this.state.show.active || !this.state.show.paused) return;
    this.state.show.paused = false;
    if (this.state.show.phase === "match") {
      this.resumeMatch();
    } else {
      this.state.status = "running";
      this.setShowPhaseTimer(this.showRemainingMs || this.phaseDurationMs());
      this.log("info", "Show resumed.");
      this.emit();
    }
  }

  skipShowPhase(): void {
    if (!this.state.show.active) return;
    if (this.state.show.phase === "match") this.onMatchTimeout(true);
    else this.advanceShowPhase();
  }

  private beginCategoryVote(): void {
    this.clearShowTimer();
    this.state.show.phase = "category";
    this.state.show.paused = false;
    this.state.show.categoryVotes = {};
    this.state.show.categoryVoters = [];
    this.state.show.result = null;
    this.state.show.champion = null;
    this.state.tournament = null;
    this.state.matchEndsAt = null;
    this.state.status = "running";
    this.showRound = null;
    this.log("info", "Category vote started.");
    this.setShowPhaseTimer(this.state.settings.categorySeconds * 1000);
    this.emit();
  }

  private resolveCategoryVote(): string | null {
    let best: string | null = null;
    let bestVotes = 0;
    for (const [id, votes] of Object.entries(this.state.show.categoryVotes)) {
      if (votes > bestVotes) {
        bestVotes = votes;
        best = id;
      }
    }
    return best;
  }

  private endCategoryVote(): void {
    const fallback =
      this.showFallbackCategory ??
      this.state.queue[this.state.queueIndex]?.categoryId ??
      this.state.categories[0]?.id;
    const id = this.resolveCategoryVote() ?? fallback ?? null;
    this.showFallbackCategory = null;
    if (!id || !this.prepareTournament(id)) {
      this.stopShow();
      return;
    }
    this.log("info", `Category vote winner: ${this.category(id)?.name ?? id}`);
    this.beginBracketIntro();
  }

  private currentRound(): Match["round"] | null {
    const t = this.state.tournament;
    return t ? currentMatch(t)?.round ?? null : null;
  }

  private beginRoundIntro(): void {
    this.state.show.phase = "round-intro";
    this.log("round", `Round: ${this.currentRound() ?? ""}`);
    this.setShowPhaseTimer(this.state.settings.roundIntroSeconds * 1000);
    this.emit();
  }

  private beginBracketIntro(): void {
    const round = this.currentRound();
    if (round && this.showRound !== round) {
      this.showRound = round;
      this.beginRoundIntro();
      return;
    }
    this.state.show.phase = "bracket-intro";
    this.setShowPhaseTimer(this.state.settings.bracketIntroSeconds * 1000);
    this.emit();
  }

  private endBracketIntro(): void {
    this.clearShowTimer();
    this.state.show.phaseEndsAt = null;
    this.state.show.phase = "match";
    this.startMatch();
  }

  private beginBracketOutro(): void {
    this.state.show.phase = "bracket-outro";
    this.setShowPhaseTimer(this.state.settings.bracketOutroSeconds * 1000);
    this.emit();
  }

  private beginResult(): void {
    this.state.show.phase = "result";
    this.setShowPhaseTimer(this.state.settings.resultSeconds * 1000);
    this.emit();
  }

  private endResult(): void {
    if (this.state.show.champion) {
      this.state.show.phase = "champion";
      this.setShowPhaseTimer(this.state.settings.resultSeconds * 1000);
      this.emit();
      return;
    }
    this.beginBracketIntro();
  }

  private advanceShowPhase(): void {
    switch (this.state.show.phase) {
      case "category":
        this.endCategoryVote();
        break;
      case "round-intro":
        this.beginBracketIntro();
        break;
      case "bracket-intro":
        this.endBracketIntro();
        break;
      case "bracket-outro":
        this.beginResult();
        break;
      case "result":
        this.endResult();
        break;
      case "champion":
        this.beginCategoryVote();
        break;
      default:
        break;
    }
  }

  private onShowPhaseTimeout(): void {
    if (!this.state.show.active || this.state.show.paused) return;
    this.advanceShowPhase();
  }

  /** Records the finished match so the /show result screen can present it. */
  private captureShowResult(match: Match, winner: string): void {
    this.state.show.result = {
      round: match.round,
      a: match.a,
      b: match.b,
      winner,
      votesA: match.votesA,
      votesB: match.votesB,
      votersA: [...match.votersA],
      votersB: [...match.votersB],
    };
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
    if (this.state.settings.autoStageView) this.state.stageView = "match";
    this.log("round", `${ROUND_LABELS[match.round]} — match ${match.index + 1} live (${seconds}s)`);
    this.emit();
  }

  /** Clears the pending timeout only; leaves the announced end time intact. */
  private clearTimer(): void {
    if (this.matchTimer) clearTimeout(this.matchTimer);
    this.matchTimer = null;
  }

  private schedule(ms: number): void {
    this.clearTimer();
    this.matchTimer = setTimeout(() => this.onMatchTimeout(), ms);
  }

  /** Stops the match clock: clears the timeout AND the announced end time. */
  private stopTimer(): void {
    this.clearTimer();
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
    if (this.state.settings.autoStageView) this.state.stageView = "bracket";

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

    if (this.state.show.active) {
      this.captureShowResult(match, winner);
      if (progress.tournamentComplete) {
        this.state.show.champion = winner;
        this.state.matchEndsAt = null;
        this.log("info", `Champion: ${this.item(winner)?.name ?? winner}`);
      }
      this.beginBracketOutro();
      return;
    }

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
    if (this.state.settings.autoStageView) this.state.stageView = "bracket";
    const progress = completeMatch(t, winner);
    this.log("info", `Host forced winner: ${this.item(winner)?.name ?? winner}`);
    if (this.state.show.active) {
      this.captureShowResult(match, winner);
      if (progress.tournamentComplete) {
        this.state.show.champion = winner;
        this.state.matchEndsAt = null;
      }
      this.beginBracketOutro();
      return;
    }
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

  // ---- live connection (Tikora hub) ------------------------------------------

  attachLive(client: LiveClient, config: LiveConfig): void {
    this.live = client;
    this.liveConfig = config;
    this.state.live.url = config.url;
    this.state.live.game = config.slug;
    this.state.live.keySet = Boolean(config.key);
  }

  setLiveStatus(connected: boolean): void {
    this.state.live.connected = connected;
    this.emit();
  }

  handleLiveEvent(event: LiveEvent): void {
    const live = this.state.live;
    live.counts[event.type] = (live.counts[event.type] ?? 0) + 1;
    live.lastEventAt = event.at;
    live.lastEvents = [event, ...live.lastEvents].slice(0, 25);

    if (event.type === "chat") this.liveChat(event);
    else if (event.type === "gift") this.liveGift(event);

    const points = this.supporterPoints(event);
    if (points > 0) this.addSupporter(event, points);

    this.updateSupporters();
    this.cacheEventAvatar(event);
    this.emit();
  }

  private liveChat(event: LiveEvent): void {
    if (!event.message) return;
    const match = this.liveMatch();
    if (match) this.chatVote(event.message, event.userId || event.name);
  }

  private liveGift(event: LiveEvent): void {
    const match = this.liveMatch();
    if (match && event.giftName) {
      const itemId = this.giftSideByName(event.giftName);
      if (itemId) {
        const result = castGiftVote(match, itemId, event.userId || event.name, this.state.settings, event.count ?? 1);
        if (result.ok) this.log("vote", `${event.name} gifted ${event.giftName} → ${this.item(itemId)?.name ?? itemId}`);
      }
    }
  }

  private giftSideByName(giftName: string): string | null {
    const key = normalize(giftName);
    if (!key) return null;
    const category = this.currentCategory();
    const [a, b] = this.currentItems();
    for (const item of [a, b]) {
      if (item?.gift && normalize(item.gift.name) === key) return item.id;
    }
    if (category?.giftPair) {
      if (normalize(category.giftPair[0].name) === key) return a?.id ?? null;
      if (normalize(category.giftPair[1].name) === key) return b?.id ?? null;
    }
    return null;
  }

  private supporterPoints(event: LiveEvent): number {
    switch (event.type) {
      case "chat":
        return Math.max(0, this.state.settings.chatWeight);
      case "gift":
        return Math.max(0, event.coins ?? (event.count ?? 1) * this.state.settings.giftWeight);
      case "like":
        return Math.min(10, Math.max(1, event.likeCount ?? 1));
      case "follow":
      case "share":
        return 3;
      case "subscribe":
        return 10;
      default:
        return 0;
    }
  }

  private addSupporter(event: LiveEvent, points: number): void {
    const key = normalize(event.userId || event.name) || event.name || "viewer";
    const existing = this.supporters.get(key);
    if (existing) {
      existing.points += points;
      if (event.name) existing.name = event.name;
    } else {
      this.supporters.set(key, { id: key, name: event.name || key, avatar: "", points });
    }
  }

  private updateSupporters(): void {
    this.state.live.supporters = [...this.supporters.values()].toSorted((a, b) => b.points - a.points).slice(0, 5);
  }

  /** Cache the avatar once, then swap the remote URL for the local one. */
  private cacheEventAvatar(event: LiveEvent): void {
    if (!event.avatar) return;
    const key = normalize(event.userId || event.name) || event.name || "viewer";
    void cacheAvatar(event.avatar).then((local) => {
      if (!local) return;
      const supporter = this.supporters.get(key);
      if (supporter) supporter.avatar = local;
      this.state.live.lastEvents = this.state.live.lastEvents.map((e) =>
        normalize(e.userId || e.name) === key ? { ...e, avatar: local } : e,
      );
      this.updateSupporters();
      this.emit();
    });
  }

  handleLiveEffect(effect: string, _payload: unknown): boolean {
    switch (effect) {
      case "show_start":
        this.startShow();
        return true;
      case "show_stop":
        this.stopShow();
        return true;
      case "show_pause":
        this.pauseShow();
        return true;
      case "show_resume":
        this.resumeShow();
        return true;
      case "show_skip":
        this.skipShowPhase();
        return true;
      case "force_left":
        this.forceWinner("a");
        return true;
      case "force_right":
        this.forceWinner("b");
        return true;
      case "skip_match":
        this.skipMatch();
        return true;
      case "next_category":
        this.nextTournament();
        return true;
      default:
        return false;
    }
  }

  async updateLiveConfig(patch: { url?: string; slug?: string; key?: string }): Promise<void> {
    const current = this.liveConfig ?? { url: this.state.live.url, slug: this.state.live.game, key: "" };
    const next: LiveConfig = {
      url: patch.url ?? current.url,
      slug: patch.slug ?? current.slug,
      key: patch.key ?? current.key,
    };
    this.liveConfig = next;
    this.state.live.url = next.url;
    this.state.live.game = next.slug;
    this.state.live.keySet = Boolean(next.key);
    await saveLiveConfig(next);
    this.live?.setConfig(next);
    this.emit();
  }

  // ---- votes ----------------------------------------------------------------

  private currentItems(): (Item | null)[] {
    const t = this.state.tournament;
    const match = t ? currentMatch(t) : null;
    if (!match) return [null, null];
    return [this.item(match.a), this.item(match.b)];
  }

  chatVote(text: string, viewer: string): void {
    if (this.state.show.active && this.state.show.phase === "category") {
      const categoryId = matchCategory(text, this.state.categories);
      if (!categoryId) return;
      const key = normalize(viewer) || "anonymous";
      if (this.state.settings.dedupeChat && this.state.show.categoryVoters.includes(key)) return;
      this.state.show.categoryVotes[categoryId] =
        (this.state.show.categoryVotes[categoryId] ?? 0) + this.state.settings.chatWeight;
      this.state.show.categoryVoters.push(key);
      this.log("vote", `${viewer} voted category ${this.category(categoryId)?.name ?? categoryId}`);
      this.emit();
      return;
    }

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

  // ---- stage view -----------------------------------------------------------

  setStageView(view: StageView): void {
    if (this.state.stageView === view) return;
    this.state.stageView = view;
    this.emit();
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

  updateSound(patch: Partial<SoundSettings>): void {
    this.state.settings = { ...this.state.settings, sound: { ...this.state.settings.sound, ...patch } };
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
    this.clearShowTimer();
    this.setSimulated(false);
    this.state.tournament = null;
    this.state.matchEndsAt = null;
    this.state.stageView = "match";
    this.state.show = {
      active: false,
      paused: false,
      phase: "idle",
      phaseEndsAt: null,
      categoryVotes: {},
      categoryVoters: [],
      result: null,
      champion: null,
    };
    this.showRound = null;
    this.supporters.clear();
    this.state.live.counts = { chat: 0, gift: 0, like: 0, follow: 0, share: 0, member: 0, subscribe: 0, roomUser: 0 };
    this.state.live.lastEvents = [];
    this.state.live.lastEventAt = null;
    this.updateSupporters();
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
      case "sound:update":
        this.updateSound(payload as Partial<SoundSettings>);
        break;
      case "cue:emit":
        this.live?.emitCue((payload as { id: string }).id);
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
      case "view:set":
        this.setStageView(payload as StageView);
        break;
      case "show:start":
        this.startShow();
        break;
      case "show:stop":
        this.stopShow();
        break;
      case "show:pause":
        this.pauseShow();
        break;
      case "show:resume":
        this.resumeShow();
        break;
      case "show:skipPhase":
        this.skipShowPhase();
        break;
      case "live:connect":
        this.live?.start();
        break;
      case "live:disconnect":
        this.live?.stop();
        break;
      case "live:update":
        await this.updateLiveConfig((payload as { url?: string; slug?: string; key?: string } | undefined) ?? {});
        break;
      case "live:inject":
        this.handleLiveEvent(payload as LiveEvent);
        break;
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
