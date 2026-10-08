import type { SoundSettings } from "../../shared/types.ts";
import { engine } from "./engine.ts";
import { playCue, type CueOptions } from "./cues.ts";
import { AUTO_TRACK, MUSIC_BY_ID, MusicPlayer, resolveTrack } from "./music.ts";

/** Minimum gap between repeats of the same cue (ms). */
const MIN_INTERVAL: Record<string, number> = {
  "vote.chat": 45,
  "live.like": 120,
  "live.member": 80,
};

class SoundManager {
  /** Set by the broadcast provider; forwards cues to the server for Tikora mapping. */
  onCue: ((id: string) => void) | null = null;
  private config: SoundSettings | null = null;
  private lastPlay = new Map<string, number>();
  private overrides = new Set<string>();
  private buffers = new Map<string, AudioBuffer>();
  private overridesLoaded = false;

  private player = new MusicPlayer();
  private desiredSlot: string | null = null;
  private currentTrack: string | null = null;

  // Live counters.
  private prevCounts: Record<string, number> = {};
  private prevLeader = "";

  setConfig(sound: SoundSettings): void {
    this.config = sound;
    engine.applyConfig(sound);
    this.applyMusic();
  }

  get soundConfig(): SoundSettings | null {
    return this.config;
  }

  async unlock(): Promise<void> {
    await engine.unlock();
    if (this.config) engine.applyConfig(this.config);
    // Music requested before the context existed is applied now.
    this.applyMusic();
    if (!this.overridesLoaded) await this.loadOverrides();
  }

  private async loadOverrides(): Promise<void> {
    this.overridesLoaded = true;
    try {
      const res = await fetch("/api/sounds");
      if (!res.ok) return;
      const list = (await res.json()) as string[];
      for (const name of list) this.overrides.add(name.replace(/\.[a-z0-9]+$/i, ""));
    } catch {
      /* no override dir yet */
    }
  }

  /** Play a one-shot cue, honoring mute, per-cue toggles, rate limits and file overrides. */
  play(id: string, opts: CueOptions = {}): void {
    const cfg = this.config;
    if (!cfg || cfg.muted) return;
    if (cfg.disabledCues?.includes(id)) return;
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    const gap = MIN_INTERVAL[id] ?? 25;
    if (now - (this.lastPlay.get(id) ?? 0) < gap) return;
    this.lastPlay.set(id, now);

    this.onCue?.(id);
    if (this.overrides.has(id)) {
      void this.playFile(id);
      return;
    }
    if (!engine.running) return;
    playCue(engine, id, opts);
  }

  private async playFile(id: string): Promise<void> {
    const ctx = engine.ctx;
    const out = engine.bus("sfx");
    if (!ctx || !out) return;
    let buffer = this.buffers.get(id);
    if (!buffer) {
      const found = await this.findOverrideFile(id);
      if (!found) {
        this.overrides.delete(id);
        return;
      }
      try {
        const res = await fetch(found);
        buffer = await ctx.decodeAudioData(await res.arrayBuffer());
        this.buffers.set(id, buffer);
      } catch {
        return;
      }
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(out);
    src.start();
  }

  private async findOverrideFile(id: string): Promise<string | null> {
    for (const ext of [".mp3", ".ogg", ".wav", ".webm"]) {
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

  // ---- music ----------------------------------------------------------------

  /**
   * Remember the desired slot (a show slot like `music.match.qf`, or a library
   * track id from a preview) and (re)apply it once audio is available.
   */
  setMusic(slot: string | null): void {
    this.desiredSlot = slot;
    this.applyMusic();
  }

  /**
   * Resolve the desired slot through the picked background track, then start /
   * stop / re-level the bed. Runs again whenever the sound settings change, so
   * picking a different track or moving the volume slider takes effect live.
   */
  private applyMusic(): void {
    if (!engine.ctx || !engine.running) return;
    const cfg = this.config;
    const enabled = cfg ? cfg.musicEnabled && !cfg.muted : false;
    const target =
      enabled && this.desiredSlot
        ? resolveTrack(this.desiredSlot, cfg ? cfg.musicTrack ?? AUTO_TRACK : AUTO_TRACK)
        : null;

    if (target !== this.currentTrack) {
      this.currentTrack = target;
      if (!target) {
        this.player.stop();
        return;
      }
      const def = MUSIC_BY_ID[target];
      const out = engine.bus("music");
      if (!def || !out) {
        this.player.stop();
        return;
      }
      this.player.start(def, out, this.levelFor(target));
      return;
    }
    if (target) this.player.setLevel(this.levelFor(target));
  }

  private levelFor(id: string): number {
    const def = MUSIC_BY_ID[id];
    if (!def) return 0;
    const trim = this.config && this.config.trackVolume[id] !== undefined ? this.config.trackVolume[id] : 1;
    return def.level * trim;
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
