import type { SoundSettings } from "../../shared/types.ts";
import { engine } from "./engine.ts";

/** Minimum gap between repeats of the same cue (ms). */
const MIN_INTERVAL: Record<string, number> = {
  "vote.chat": 45,
  "live.like": 120,
  "live.member": 80,
  "category.vote": 60,
};

/** Plain-language snapshot of the audio system for the on-screen status readout. */
export interface SoundStatus {
  /** "not started" | "running" | "suspended" | "closed". */
  context: string;
  muted: boolean;
  lastCue: string | null;
  lastCueAt: number | null;
  overrides: string[];
  reason: "idle" | "no-config" | "muted" | "disabled-cue" | "not-running" | "played" | "missing";
}

class SoundManager {
  /** Set by the broadcast provider; forwards cues to the server for Tikora mapping. */
  onCue: ((id: string) => void) | null = null;
  private config: SoundSettings | null = null;
  private lastPlay = new Map<string, number>();
  private overrides = new Set<string>();
  private buffers = new Map<string, AudioBuffer>();
  private overridesLoaded = false;

  /** A cue requested while the audio context was still locked, replayed on unlock. */
  private pendingCue: { id: string } | null = null;
  private lastCue: { id: string; at: number } | null = null;
  private reason: SoundStatus["reason"] = "idle";

  /** Shared in-flight unlock so concurrent callers await the same attempt. */
  private unlockPromise: Promise<void> | null = null;

  // Live counters.
  private prevCounts: Record<string, number> = {};
  private prevLeader = "";

  setConfig(sound: SoundSettings): void {
    this.config = sound;
    engine.applyConfig(sound);
  }

  get soundConfig(): SoundSettings | null {
    return this.config;
  }

  /** Snapshot of the audio system so the UI can show why sound is (not) playing. */
  status(): SoundStatus {
    const ctx = engine.ctx;
    return {
      context: !ctx ? "not started" : ctx.state === "running" ? "running" : ctx.state,
      muted: this.config?.muted ?? false,
      lastCue: this.lastCue?.id ?? null,
      lastCueAt: this.lastCue?.at ?? null,
      overrides: [...this.overrides],
      reason: this.reason,
    };
  }

  unlock(): Promise<void> {
    if (this.unlockPromise) return this.unlockPromise;
    this.unlockPromise = this.doUnlock()
      .catch(() => {
        /* a rejected resume must never leave callers hanging */
      })
      .finally(() => {
        this.unlockPromise = null;
      });
    return this.unlockPromise;
  }

  private async doUnlock(): Promise<void> {
    await engine.unlock();
    if (this.config) engine.applyConfig(this.config);
    if (!this.overridesLoaded) await this.loadOverrides();
    // A cue that arrived while the context was locked should not be lost.
    if (this.pendingCue && engine.running) {
      const p = this.pendingCue;
      this.pendingCue = null;
      if (this.overrides.has(p.id)) void this.playFile(p.id);
    }
  }

  private async loadOverrides(): Promise<void> {
    this.overridesLoaded = true;
    await this.fetchOverrides();
  }

  /** Re-read the override list after an upload/removal and drop stale decoded buffers. */
  async refreshOverrides(): Promise<void> {
    this.buffers.clear();
    await this.fetchOverrides();
  }

  private async fetchOverrides(): Promise<void> {
    this.overrides.clear();
    try {
      const res = await fetch("/api/sounds", { cache: "no-store" });
      if (!res.ok) return;
      const list = (await res.json()) as string[];
      for (const name of list) this.overrides.add(name.replace(/\.[a-z0-9]+$/i, ""));
    } catch {
      /* offline */
    }
    this.overridesLoaded = true;
  }

  hasOverride(id: string): boolean {
    return this.overrides.has(id);
  }

  /** Play a one-shot cue, honoring mute, per-cue toggles and rate limits. */
  play(id: string): void {
    const cfg = this.config;
    if (!cfg) {
      this.reason = "no-config";
      return;
    }
    if (cfg.muted) {
      this.reason = "muted";
      return;
    }
    if (cfg.disabledCues?.includes(id)) {
      this.reason = "disabled-cue";
      return;
    }
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    const gap = MIN_INTERVAL[id] ?? 25;
    if (now - (this.lastPlay.get(id) ?? 0) < gap) return;
    this.lastPlay.set(id, now);

    this.onCue?.(id);
    this.lastCue = { id, at: Date.now() };

    if (this.overrides.has(id)) {
      this.reason = "played";
      void this.playFile(id);
      return;
    }
    // No uploaded file for this cue yet: stay silent (the Sound tab shows it as missing).
    this.reason = "missing";
  }

  private async playFile(id: string): Promise<void> {
    const ctx = engine.ctx;
    const out = engine.bus("sfx");
    if (!ctx || !out || !engine.running) {
      this.pendingCue = { id };
      return;
    }
    let buffer = this.buffers.get(id);
    if (!buffer) {
      const found = await this.findOverrideFile(id);
      if (!found) {
        // The override disappeared — nothing to play.
        this.overrides.delete(id);
        this.reason = "missing";
        return;
      }
      try {
        const res = await fetch(found);
        buffer = await ctx.decodeAudioData(await res.arrayBuffer());
        this.buffers.set(id, buffer);
      } catch {
        // Broken file: drop the override so the UI stops claiming it is uploaded.
        this.overrides.delete(id);
        this.reason = "missing";
        return;
      }
    }
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const g = ctx.createGain();
    const dur = buffer.duration;
    const fadeIn = Math.min(0.012, dur * 0.25);
    const fadeOut = Math.min(0.05, dur * 0.25);
    // Gentle fade in/out so uploaded files never click or pop.
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(1, t + Math.max(0.001, fadeIn));
    if (dur > fadeIn + fadeOut) {
      g.gain.setValueAtTime(1, t + dur - fadeOut);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    }
    src.connect(g);
    g.connect(out);
    src.start(t);
    src.stop(t + dur + 0.03);
  }

  private async findOverrideFile(id: string): Promise<string | null> {
    for (const ext of [".mp3", ".ogg", ".wav", ".webm", ".m4a"]) {
      const url = `/sounds/${id}${ext}`;
      try {
        const res = await fetch(url, { method: "HEAD" });
        if (res.ok) return url;
      } catch {
        /* keep looking */
      }
    }
    return null;
  }

  /** Detect vote leader changes and fire the lead cue. */
  observeLeader(leader: string): void {
    if (leader && leader !== "tie" && this.prevLeader && this.prevLeader !== leader) {
      this.play("vote.lead");
    }
    this.prevLeader = leader;
  }

  /** Detect new live events by their type counters and fire the matching cue. */
  observeLiveCounts(counts: Record<string, number>, latest: { type: string; coins?: number }[]): void {
    const types: Record<string, string> = {
      chat: "vote.chat",
      like: "live.like",
      follow: "live.follow",
      share: "live.share",
      subscribe: "live.subscribe",
      member: "live.member",
    };
    for (const [type, cue] of Object.entries(types)) {
      const now = counts[type] ?? 0;
      const before = this.prevCounts[type] ?? now;
      if (now > before) this.play(cue);
      this.prevCounts[type] = now;
    }
    const giftNow = counts.gift ?? 0;
    const giftBefore = this.prevCounts.gift ?? giftNow;
    if (giftNow > giftBefore) {
      const coins = latest.find((e) => e.type === "gift")?.coins ?? 0;
      this.play(coins >= 50 ? "vote.gift.large" : coins >= 10 ? "vote.gift.medium" : "vote.gift.small");
    }
    this.prevCounts.gift = giftNow;
  }
}

export const sound = new SoundManager();
