import type { SoundSettings } from "../../shared/types.ts";

/**
 * The audio backbone: a small mixer with a limiter and master/sfx/voice buses.
 * Everything is created lazily on first use so the browser never starts an
 * AudioContext before it is allowed to.
 *
 * There are no built-in tones — every sound is an uploaded file played through
 * the `sfx` bus.
 */
export class AudioEngine {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  sfx: GainNode | null = null;
  voice: GainNode | null = null;
  private muted = false;

  init(): void {
    if (this.ctx) return;
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    this.ctx = ctx;

    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -3;
    limiter.knee.value = 6;
    limiter.ratio.value = 12;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.25;
    limiter.connect(ctx.destination);

    const master = ctx.createGain();
    master.gain.value = 0.8;
    master.connect(limiter);
    this.master = master;

    const makeBus = (): GainNode => {
      const g = ctx.createGain();
      g.connect(master);
      return g;
    };
    this.sfx = makeBus();
    this.voice = makeBus();
  }

  async unlock(): Promise<void> {
    this.init();
    if (this.ctx && this.ctx.state !== "running") {
      try {
        await this.ctx.resume();
      } catch {
        /* ignore */
      }
    }
  }

  get running(): boolean {
    return this.ctx?.state === "running";
  }

  now(): number {
    return this.ctx?.currentTime ?? 0;
  }

  bus(kind: "sfx" | "voice"): GainNode | null {
    return this[kind];
  }

  applyConfig(sound: SoundSettings): void {
    this.muted = sound.muted;
    if (!this.ctx) return;
    const m = sound.muted ? 0 : Math.max(0, Math.min(1, sound.master));
    if (this.master) this.master.gain.value = m;
    if (this.sfx) this.sfx.gain.value = Math.max(0, Math.min(1, sound.sfx));
    if (this.voice) this.voice.gain.value = Math.max(0, Math.min(1, sound.voice));
  }

  get isMuted(): boolean {
    return this.muted;
  }
}

export const engine = new AudioEngine();
