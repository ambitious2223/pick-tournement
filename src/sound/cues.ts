import { noise, tone } from "./synth.ts";
import type { AudioEngine } from "./engine.ts";

export interface CueOptions {
  intensity?: number;
  /** 0 = Round of 16 … 3 = Grand Final (drives escalation). */
  roundIndex?: number;
}

type Cue = (ctx: AudioContext, out: AudioNode, t: number, engine: AudioEngine, opts: CueOptions) => void;

function blip(freq: number, dur: number, gain: number, type: OscillatorType = "sine"): Cue {
  return (ctx, out, t, engine) => {
    tone(ctx, out, { type, freq, t, dur, gain, glideTo: freq * 1.4 });
    engine.send(out, 0.12);
  };
}

export const RECIPES: Record<string, Cue> = {
  // ---- category ----
  "category.start": (ctx, out, t, engine) => {
    tone(ctx, out, { type: "sine", freq: 220, t, dur: 1.2, gain: 0.16, attack: 0.3 });
    tone(ctx, out, { type: "sine", freq: 330, t: t + 0.02, dur: 1.2, gain: 0.12, attack: 0.35 });
    tone(ctx, out, { type: "triangle", freq: 660, t: t + 0.05, dur: 0.8, gain: 0.06, attack: 0.2 });
    noise(ctx, out, { t, dur: 1.0, gain: 0.05, filter: "bandpass", freq: 900, q: 0.8, attack: 0.3 });
    engine.send(out, 0.3);
  },
  "category.vote": (ctx, out, t, engine) => {
    tone(ctx, out, { type: "sine", freq: 1400, t, dur: 0.07, gain: 0.09, glideTo: 1800 });
    engine.send(out, 0.1);
  },
  "category.winner": (ctx, out, t, engine) => {
    [523.25, 659.25, 783.99].forEach((f, i) => tone(ctx, out, { type: "triangle", freq: f, t: t + i * 0.08, dur: 0.5, gain: 0.16 }));
    tone(ctx, out, { type: "sine", freq: 261.63, t, dur: 0.6, gain: 0.12 });
    engine.send(out, 0.35);
  },

  // ---- round intro (escalates with roundIndex) ----
  "round.intro": (ctx, out, t, engine, opts) => {
    const r = opts.roundIndex ?? 0;
    const base = 110 * Math.pow(1.12, r);
    // riser
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    const g = ctx.createGain();
    osc.frequency.setValueAtTime(base * 2, t);
    osc.frequency.exponentialRampToValueAtTime(base * 8, t + 1.1);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.08 + r * 0.03, t + 0.9);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.25);
    osc.connect(g);
    g.connect(out);
    osc.start(t);
    osc.stop(t + 1.3);
    engine.send(g, 0.3);
    // impact
    tone(ctx, out, { type: "sine", freq: 120 + r * 20, t: t + 1.05, dur: 0.9, gain: 0.3, glideTo: 45 });
    noise(ctx, out, { t: t + 1.05, dur: 0.5, gain: 0.16, filter: "lowpass", freq: 2200, q: 0.6 });
    engine.send(out, 0.4);
  },

  // ---- bracket ----
  "bracket.intro": (ctx, out, t, engine) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 1.2;
    filter.frequency.setValueAtTime(400, t);
    filter.frequency.exponentialRampToValueAtTime(4200, t + 0.55);
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(520, t + 0.55);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.15);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    osc.connect(filter);
    filter.connect(g);
    g.connect(out);
    osc.start(t);
    osc.stop(t + 0.75);
    engine.send(g, 0.25);
  },
  "bracket.focus": blip(900, 0.12, 0.1, "triangle"),
  "bracket.outro": (ctx, out, t, engine) => {
    tone(ctx, out, { type: "sine", freq: 700, t, dur: 0.5, gain: 0.09, glideTo: 220 });
    noise(ctx, out, { t, dur: 0.5, gain: 0.07, filter: "bandpass", freq: 1400, q: 0.9 });
    engine.send(out, 0.25);
  },
  "bracket.winner": (ctx, out, t, engine) => {
    tone(ctx, out, { type: "sine", freq: 392, t, dur: 0.7, gain: 0.2 });
    tone(ctx, out, { type: "sine", freq: 587.33, t: t + 0.06, dur: 0.7, gain: 0.16 });
    engine.send(out, 0.4);
  },

  // ---- match ----
  "match.countdown": (ctx, out, t, engine) => {
    tone(ctx, out, { type: "triangle", freq: 880, t, dur: 0.16, gain: 0.18 });
    engine.send(out, 0.2);
  },
  "match.start": (ctx, out, t, engine) => {
    [0, 0.12, 0.24].forEach((d) => tone(ctx, out, { type: "sine", freq: 1568, t: t + d, dur: 0.25, gain: 0.14 }));
    tone(ctx, out, { type: "sine", freq: 392, t: t + 0.24, dur: 1.2, gain: 0.22, glideTo: 196 });
    engine.send(out, 0.4);
  },
  "match.tick": (ctx, out, t, engine) => {
    tone(ctx, out, { type: "triangle", freq: 1200, t, dur: 0.05, gain: 0.12 });
    engine.send(out, 0.12);
  },
  "match.suddenDeath": (ctx, out, t, engine) => {
    tone(ctx, out, { type: "sine", freq: 200, t, dur: 1.0, gain: 0.22, glideTo: 90 });
    tone(ctx, out, { type: "sawtooth", freq: 400, t, dur: 0.9, gain: 0.06, glideTo: 180 });
    engine.send(out, 0.4);
  },
  "match.end": (ctx, out, t, engine) => {
    tone(ctx, out, { type: "sine", freq: 180, t, dur: 0.7, gain: 0.24, glideTo: 60 });
    noise(ctx, out, { t, dur: 0.4, gain: 0.12, filter: "lowpass", freq: 1600 });
    engine.send(out, 0.35);
  },

  // ---- votes ----
  "vote.chat": blip(1500, 0.05, 0.06),
  "vote.gift.small": (ctx, out, t, engine) => {
    tone(ctx, out, { type: "sine", freq: 1046.5, t, dur: 0.3, gain: 0.16 });
    tone(ctx, out, { type: "sine", freq: 1568, t: t + 0.05, dur: 0.3, gain: 0.12 });
    engine.send(out, 0.3);
  },
  "vote.gift.medium": (ctx, out, t, engine) => {
    [784, 1046.5, 1318.5].forEach((f, i) => tone(ctx, out, { type: "triangle", freq: f, t: t + i * 0.05, dur: 0.45, gain: 0.16 }));
    engine.send(out, 0.35);
  },
  "vote.gift.large": (ctx, out, t, engine) => {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(ctx, out, { type: "triangle", freq: f, t: t + i * 0.07, dur: 0.7, gain: 0.18 }));
    tone(ctx, out, { type: "sine", freq: 130.81, t, dur: 0.9, gain: 0.16 });
    engine.send(out, 0.45);
  },
  "vote.lead": (ctx, out, t, engine) => {
    tone(ctx, out, { type: "sine", freq: 660, t, dur: 0.18, gain: 0.16 });
    tone(ctx, out, { type: "sine", freq: 990, t: t + 0.12, dur: 0.25, gain: 0.16 });
    engine.send(out, 0.3);
  },

  // ---- result ----
  "result.win": (ctx, out, t, engine) => {
    [392, 523.25, 659.25, 783.99].forEach((f, i) => tone(ctx, out, { type: "triangle", freq: f, t: t + i * 0.1, dur: 0.8, gain: 0.18 }));
    engine.send(out, 0.45);
  },
  "result.lose": (ctx, out, t, engine) => {
    tone(ctx, out, { type: "sine", freq: 330, t, dur: 0.7, gain: 0.12, glideTo: 165 });
    engine.send(out, 0.25);
  },

  // ---- champion / top pickers ----
  "champion.win": (ctx, out, t, engine) => {
    [261.63, 329.63, 392, 523.25, 659.25].forEach((f, i) => tone(ctx, out, { type: "triangle", freq: f, t: t + i * 0.12, dur: 1.4, gain: 0.2 }));
    tone(ctx, out, { type: "sine", freq: 130.81, t, dur: 1.6, gain: 0.2 });
    noise(ctx, out, { t, dur: 1.2, gain: 0.06, filter: "bandpass", freq: 1000, q: 0.7, attack: 0.3 });
    engine.send(out, 0.5);
  },
  "champion.reveal": (ctx, out, t, engine) => {
    for (let i = 0; i < 6; i++) {
      tone(ctx, out, { type: "sine", freq: 1600 + Math.random() * 2400, t: t + i * 0.05, dur: 0.25, gain: 0.07 });
    }
    engine.send(out, 0.5);
  },
  "champion.supporter": (ctx, out, t, engine) => {
    tone(ctx, out, { type: "sine", freq: 1318.5, t, dur: 0.35, gain: 0.14 });
    tone(ctx, out, { type: "sine", freq: 1975.5, t: t + 0.04, dur: 0.3, gain: 0.1 });
    engine.send(out, 0.4);
  },

  // ---- live extras ----
  "live.like": blip(1100, 0.06, 0.05, "triangle"),
  "live.follow": (ctx, out, t, engine) => {
    tone(ctx, out, { type: "sine", freq: 659.25, t, dur: 0.25, gain: 0.12 });
    tone(ctx, out, { type: "sine", freq: 987.77, t: t + 0.09, dur: 0.3, gain: 0.12 });
    engine.send(out, 0.3);
  },
  "live.share": (ctx, out, t, engine) => {
    tone(ctx, out, { type: "triangle", freq: 523.25, t, dur: 0.2, gain: 0.1 });
    tone(ctx, out, { type: "triangle", freq: 698.46, t: t + 0.08, dur: 0.25, gain: 0.1 });
    engine.send(out, 0.3);
  },
  "live.subscribe": (ctx, out, t, engine) => {
    [392, 493.88, 587.33, 783.99].forEach((f, i) => tone(ctx, out, { type: "sine", freq: f, t: t + i * 0.08, dur: 0.6, gain: 0.14 }));
    engine.send(out, 0.4);
  },
  "live.member": blip(700, 0.14, 0.08, "sine"),
};

export type CueId = keyof typeof RECIPES;
export const CUE_IDS = Object.keys(RECIPES);

export function playCue(engine: AudioEngine, id: string, opts: CueOptions = {}): boolean {
  if (!engine.ctx) return false;
  const recipe = RECIPES[id];
  const out = engine.bus("sfx");
  if (!recipe || !out) return false;
  const t = engine.now() + 0.02;
  try {
    recipe(engine.ctx, out, t, engine, opts);
  } catch {
    return false;
  }
  return true;
}
