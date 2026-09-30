import type { SoundSettings } from "../../shared/types.ts";
import { engine } from "./engine.ts";
import { playCue, type CueOptions } from "./cues.ts";

/** Minimum gap between repeats of the same cue (ms). */
const MIN_INTERVAL: Record<string, number> = {
  "vote.chat": 45,
  "live.like": 120,
  "live.member": 80,
};

interface MusicTrack {
  freqs: number[];
  level: number;
}

/** Procedural ambient beds (chord tones). Overridable by files in data/sounds. */
export const MUSIC_TRACKS: Record<string, MusicTrack> = {
  "music.category": { freqs: [220, 277.18, 329.63], level: 0.5 },
  "music.match.r16": { freqs: [196, 246.94, 293.66], level: 0.5 },
  "music.match.qf": { freqs: [207.65, 261.63, 311.13], level: 0.55 },
  "music.match.sf": { freqs: [220, 277.18, 329.63], level: 0.6 },
  "music.match.final": { freqs: [233.08, 293.66, 349.23], level: 0.7 },
  "music.champion": { freqs: [261.63, 329.63, 392, 523.25], level: 0.85 },
};

export const MUSIC_IDS = Object.keys(MUSIC_TRACKS);

class SoundManager {
  /** Set by the broadcast provider; forwards cues to the server for Tikora mapping. */
  onCue: ((id: string) => void) | null = null;
  private config: SoundSettings | null = null;
  private lastPlay = new Map<string, number>();
  private overrides = new Set<string>();
  private buffers = new Map<string, AudioBuffer>();
  private overridesLoaded = false;
  private musicGain: GainNode | null = null;
  private musicNodes: OscillatorNode[] = [];
  private currentTrack: string | null = null;
  private desiredTrack: string | null = null;
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

  /** Remember the desired track and (re)apply it once audio is available. */
  setMusic(track: string | null): void {
    this.desiredTrack = track;
    this.applyMusic();
  }

  /** Crossfade the background music to the desired track (null stops it). */
  private applyMusic(): void {
    if (!engine.ctx || !engine.running) return;
    const enabled = this.config ? this.config.musicEnabled && !this.config.muted : false;
    const target = enabled ? this.desiredTrack : null;
    if (target === this.currentTrack) return;

    if (this.musicGain && engine.ctx) {
      const g = this.musicGain;
      const t = engine.now();
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(g.gain.value, t);
      g.gain.linearRampToValueAtTime(0.0001, t + 0.6);
      const nodes = this.musicNodes;
      setTimeout(() => nodes.forEach((n) => { try { n.stop(); } catch { /* ignore */ } }), 800);
      this.musicNodes = [];
      this.musicGain = null;
    }
    this.currentTrack = target;
    if (!target) return;

    const def = MUSIC_TRACKS[target];
    const out = engine.bus("music");
    if (!def || !out || !engine.ctx) return;
    const ctx = engine.ctx;
    const t = engine.now();
    const gain = ctx.createGain();
    const level = (def.level ?? 0.5) * (this.config?.trackVolume?.[target] ?? 1);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(level, t + 1.5);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;
    filter.connect(gain);
    gain.connect(out);
    engine.send(gain, 0.5);

    for (const f of def.freqs) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      osc.detune.value = (Math.random() - 0.5) * 8;
      osc.connect(filter);
      osc.start(t);
      this.musicNodes.push(osc);
    }
    this.musicGain = gain;
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
