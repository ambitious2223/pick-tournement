import type { SoundSettings } from "../../shared/types.ts";

/**
 * The audio backbone: a small mixer with a limiter, a reverb send, and
 * music/sfx/voice buses. Everything is created lazily on first use so the
 * browser never starts an AudioContext before it is allowed to.
 */
export class AudioEngine {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  music: GainNode | null = null;
  sfx: GainNode | null = null;
  voice: GainNode | null = null;
  reverb: ConvolverNode | null = null;
  private reverbSend: GainNode | null = null;
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
    this.music = makeBus();
    this.sfx = makeBus();
    this.voice = makeBus();

    const reverb = ctx.createConvolver();
    reverb.buffer = this.makeImpulse(ctx, 2.4);
    const reverbOut = ctx.createGain();
    reverbOut.gain.value = 0.9;
    reverb.connect(reverbOut);
    reverbOut.connect(master);
    this.reverb = reverb;

    const reverbSend = ctx.createGain();
    reverbSend.gain.value = 0.25;
    reverbSend.connect(reverb);
    this.reverbSend = reverbSend;
  }

  private makeImpulse(ctx: AudioContext, seconds: number): AudioBuffer {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        const decay = Math.pow(1 - i / len, 2.6);
        data[i] = (Math.random() * 2 - 1) * decay;
      }
    }
    return buffer;
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

  /** A gain that follows the bus and also feeds the reverb send. */
  bus(kind: "music" | "sfx" | "voice"): GainNode | null {
    return this[kind];
  }

  send(node: AudioNode, reverbAmount = 0.25): void {
    if (!this.reverbSend || !this.ctx) return;
    const g = this.ctx.createGain();
    g.gain.value = reverbAmount;
    node.connect(g);
    g.connect(this.reverbSend);
  }

  applyConfig(sound: SoundSettings): void {
    this.muted = sound.muted;
    if (!this.ctx) return;
    const m = sound.muted ? 0 : Math.max(0, Math.min(1, sound.master));
    if (this.master) this.master.gain.value = m;
    if (this.music) this.music.gain.value = Math.max(0, Math.min(1, sound.music));
    if (this.sfx) this.sfx.gain.value = Math.max(0, Math.min(1, sound.sfx));
    if (this.voice) this.voice.gain.value = Math.max(0, Math.min(1, sound.voice));
  }

  get isMuted(): boolean {
    return this.muted;
  }
}

export const engine = new AudioEngine();
