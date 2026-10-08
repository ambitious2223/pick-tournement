import { engine } from "./engine.ts";

const STEPS = 16;
export const AUTO_TRACK = "auto";
export const DEFAULT_TRACK = "arena-pump";

export const mtof = (m: number): number => 440 * Math.pow(2, (m - 69) / 12);
const at = (s: string, i: number): string => s[i] ?? ".";
const hit = (s: string, i: number): boolean => at(s, i) === "x";

export interface MusicPatterns {
  kick: string;
  snare: string;
  hat: string;
  bass: string;
  chord: string;
  lead: string;
}

export interface MusicTrack {
  id: string;
  name: string;
  nameAr: string;
  genre: string;
  genreAr: string;
  bpm: number;
  level: number;
  prog: number[][];
  chordBars?: number;
  patterns: MusicPatterns;
  clap?: boolean;
  bassWave?: OscillatorType;
  chordWave?: OscillatorType;
  leadWave?: OscillatorType;
  chordFilter?: number;
  chordDur?: number;
  bassFilter?: number;
  bassDur?: number;
  leadDur?: number;
}

export const MUSIC_LIBRARY: MusicTrack[] = [
  {
    id: "arena-pump",
    name: "Arena Pump",
    nameAr: "نبض الملعب",
    genre: "Trap",
    genreAr: "تراب",
    bpm: 140,
    level: 0.38,
    chordBars: 2,
    prog: [
      [45, 57, 60, 64],
      [45, 57, 60, 64],
      [41, 53, 57, 60],
      [43, 55, 59, 62],
    ],
    patterns: {
      kick: "x..x....x.x.....",
      snare: "........x.......",
      hat: "x.xxx.x.x.xxx.x.",
      bass: "x.......x.x.....",
      chord: "....x.......x...",
      lead: "............x...",
    },
    bassWave: "sawtooth",
    chordWave: "sawtooth",
    leadWave: "square",
    chordFilter: 2400,
    chordDur: 0.34,
    bassFilter: 700,
    bassDur: 0.5,
    leadDur: 0.3,
  },
  {
    id: "victory-rush",
    name: "Victory Rush",
    nameAr: "إندفاع الفوز",
    genre: "Electro House",
    genreAr: "هاوس إلكترو",
    bpm: 128,
    level: 0.42,
    clap: true,
    chordBars: 1,
    prog: [
      [48, 60, 64, 67],
      [45, 57, 60, 64],
      [41, 53, 57, 60],
      [43, 55, 59, 62],
    ],
    patterns: {
      kick: "x...x...x...x...",
      snare: "....x.......x...",
      hat: "..x...x...x...x.",
      bass: "..x...x...x...x.",
      chord: "x...x...x...x...",
      lead: "..x...x...x...x.",
    },
    bassWave: "sawtooth",
    chordWave: "square",
    leadWave: "sawtooth",
    chordFilter: 3000,
    chordDur: 0.26,
    bassFilter: 950,
    bassDur: 0.2,
    leadDur: 0.22,
  },
  {
    id: "neon-clash",
    name: "Neon Clash",
    nameAr: "صدام النيون",
    genre: "Synthwave",
    genreAr: "سينثويف",
    bpm: 110,
    level: 0.36,
    chordBars: 1,
    prog: [
      [48, 60, 63, 67],
      [44, 56, 60, 63],
      [51, 63, 67, 70],
      [46, 58, 62, 65],
    ],
    patterns: {
      kick: "x...x...x...x...",
      snare: "....x.......x...",
      hat: "..x...x...x...x.",
      bass: "x.x.x.x.x.x.x.x.",
      chord: "x.......x.......",
      lead: "x.x.x.x.x.x.x.x.",
    },
    bassWave: "sawtooth",
    chordWave: "sawtooth",
    leadWave: "triangle",
    chordFilter: 3200,
    chordDur: 0.5,
    bassFilter: 900,
    bassDur: 0.22,
    leadDur: 0.24,
  },
  {
    id: "sudden-death",
    name: "Sudden Death",
    nameAr: "موت مفاجئ",
    genre: "Dark Drill",
    genreAr: "درايل مظلم",
    bpm: 144,
    level: 0.4,
    chordBars: 2,
    prog: [
      [50, 62, 65, 69],
      [50, 62, 65, 69],
      [46, 58, 62, 65],
      [48, 60, 64, 67],
    ],
    patterns: {
      kick: "x.......x.x.....",
      snare: "....x.......x...",
      hat: "..x...x...x...x.",
      bass: "x.......x.......",
      chord: "........x.......",
      lead: "..........x.....",
    },
    bassWave: "sine",
    chordWave: "sawtooth",
    leadWave: "square",
    chordFilter: 2000,
    chordDur: 0.3,
    bassFilter: 320,
    bassDur: 0.6,
    leadDur: 0.4,
  },
  {
    id: "golden-hour",
    name: "Golden Hour",
    nameAr: "الساعة الذهبية",
    genre: "Lo-fi Chill",
    genreAr: "لايفاي هادئ",
    bpm: 96,
    level: 0.3,
    chordBars: 1,
    prog: [
      [41, 53, 57, 60, 64],
      [45, 57, 60, 64, 67],
      [38, 50, 53, 57, 60],
      [43, 55, 59, 62, 65],
    ],
    patterns: {
      kick: "x.......x.......",
      snare: "....x.......x...",
      hat: "..x...x...x...x.",
      bass: "x.......x.......",
      chord: "x.......x.......",
      lead: "......x.....x...",
    },
    bassWave: "triangle",
    chordWave: "triangle",
    leadWave: "sine",
    chordFilter: 1700,
    chordDur: 0.9,
    bassFilter: 500,
    bassDur: 0.7,
    leadDur: 0.35,
  },
  {
    id: "power-grid",
    name: "Power Grid",
    nameAr: "شبكة القوة",
    genre: "Big Room",
    genreAr: "بيغ روم",
    bpm: 126,
    level: 0.44,
    clap: true,
    chordBars: 1,
    prog: [
      [45, 57, 60, 64],
      [41, 53, 57, 60],
      [43, 55, 59, 62],
      [41, 53, 57, 60],
    ],
    patterns: {
      kick: "x...x...x...x...",
      snare: "....x.......x...",
      hat: "..x...x...x...x.",
      bass: "x...x...x...x...",
      chord: "x.......x...x...",
      lead: "x.x.x.x.x.x.x.x.",
    },
    bassWave: "sawtooth",
    chordWave: "square",
    leadWave: "sawtooth",
    chordFilter: 3600,
    chordDur: 0.3,
    bassFilter: 1100,
    bassDur: 0.2,
    leadDur: 0.2,
  },
  {
    id: "desert-march",
    name: "Desert March",
    nameAr: "زحف الصحراء",
    genre: "Cinematic",
    genreAr: "سينمائي",
    bpm: 120,
    level: 0.34,
    chordBars: 2,
    prog: [
      [40, 55, 59, 64],
      [48, 60, 64, 67],
      [43, 55, 59, 62],
      [50, 54, 57, 62],
    ],
    patterns: {
      kick: "x.......x.......",
      snare: "........x.......",
      hat: "x.x.x.x.x.x.x.x.",
      bass: "x.......x...x...",
      chord: "x.......x.......",
      lead: "....x.......x...",
    },
    bassWave: "triangle",
    chordWave: "sawtooth",
    leadWave: "triangle",
    chordFilter: 2400,
    chordDur: 0.8,
    bassFilter: 700,
    bassDur: 0.4,
    leadDur: 0.4,
  },
  {
    id: "first-blood",
    name: "First Blood",
    nameAr: "أول دم",
    genre: "808 Drill",
    genreAr: "درايل ٨٠٨",
    bpm: 142,
    level: 0.4,
    chordBars: 2,
    prog: [
      [43, 55, 58, 62],
      [39, 51, 55, 58],
      [48, 60, 63, 67],
      [50, 54, 57, 62],
    ],
    patterns: {
      kick: "x.....x..x......",
      snare: "....x.......x...",
      hat: "..x.x.x.x.x.xxx.",
      bass: "x.......x.....x.",
      chord: "........x.......",
      lead: "..........x.x...",
    },
    bassWave: "sine",
    chordWave: "square",
    leadWave: "square",
    chordFilter: 2100,
    chordDur: 0.3,
    bassFilter: 280,
    bassDur: 0.55,
    leadDur: 0.3,
  },
  {
    id: "champion-rise",
    name: "Champion Rise",
    nameAr: "صعود البطل",
    genre: "Anthemic Pop",
    genreAr: "بوب بطولي",
    bpm: 124,
    level: 0.42,
    clap: true,
    chordBars: 1,
    prog: [
      [48, 60, 64, 67],
      [43, 55, 59, 62],
      [45, 57, 60, 64],
      [41, 53, 57, 60],
    ],
    patterns: {
      kick: "x...x...x...x...",
      snare: "....x.......x...",
      hat: "..x...x...x...x.",
      bass: "x.x.x.x.x.x.x.x.",
      chord: "x...x...x...x...",
      lead: "x..x.x.x..x.x.x.",
    },
    bassWave: "sawtooth",
    chordWave: "sawtooth",
    leadWave: "triangle",
    chordFilter: 3400,
    chordDur: 0.28,
    bassFilter: 1000,
    bassDur: 0.2,
    leadDur: 0.24,
  },
  {
    id: "after-party",
    name: "After Party",
    nameAr: "حفلة ما بعد",
    genre: "Funk Disco",
    genreAr: "فانك ديسكو",
    bpm: 116,
    level: 0.36,
    clap: true,
    chordBars: 1,
    prog: [
      [50, 62, 65, 69],
      [43, 55, 58, 62],
      [48, 60, 64, 67],
      [41, 53, 57, 60],
    ],
    patterns: {
      kick: "x...x...x...x...",
      snare: "....x.......x...",
      hat: "x.x.x.x.x.x.x.x.",
      bass: "x.o.x.o.x.o.x.o.",
      chord: "..x...x...x...x.",
      lead: "....x..x....x..x",
    },
    bassWave: "sawtooth",
    chordWave: "sawtooth",
    leadWave: "square",
    chordFilter: 3000,
    chordDur: 0.24,
    bassFilter: 800,
    bassDur: 0.18,
    leadDur: 0.2,
  },
];

export const MUSIC_BY_ID: Record<string, MusicTrack> = Object.fromEntries(
  MUSIC_LIBRARY.map((t) => [t.id, t]),
);

export const MUSIC_IDS: string[] = MUSIC_LIBRARY.map((t) => t.id);

export const SLOT_TRACK: Record<string, string> = {
  "music.category": "desert-march",
  "music.match.r16": "neon-clash",
  "music.match.qf": "arena-pump",
  "music.match.sf": "first-blood",
  "music.match.final": "victory-rush",
  "music.champion": "champion-rise",
};

export function resolveTrack(desired: string | null, musicTrack: string): string | null {
  if (!desired) return null;
  if (MUSIC_BY_ID[desired]) return desired;
  if (musicTrack && musicTrack !== AUTO_TRACK && MUSIC_BY_ID[musicTrack]) return musicTrack;
  const auto = SLOT_TRACK[desired];
  if (auto && MUSIC_BY_ID[auto]) return auto;
  return MUSIC_BY_ID[DEFAULT_TRACK] ? DEFAULT_TRACK : null;
}

let noiseCache: { ctx: AudioContext; buf: AudioBuffer } | null = null;

function whiteNoise(ctx: AudioContext): AudioBuffer {
  if (noiseCache && noiseCache.ctx === ctx) return noiseCache.buf;
  const len = Math.floor(ctx.sampleRate * 1.5);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  noiseCache = { ctx, buf };
  return buf;
}

export class MusicPlayer {
  private fader: GainNode | null = null;
  private track: MusicTrack | null = null;
  private step = 0;
  private bar = 0;
  private nextTime = 0;
  private timer = 0;

  get trackId(): string | null {
    return this.track ? this.track.id : null;
  }

  start(track: MusicTrack, out: GainNode, level: number): void {
    const ctx = engine.ctx;
    this.release();
    this.track = track;
    this.step = 0;
    this.bar = 0;
    if (!ctx) return;
    const fader = ctx.createGain();
    const t = engine.now();
    fader.gain.setValueAtTime(0.0001, t);
    fader.gain.linearRampToValueAtTime(level, t + 1.2);
    fader.connect(out);
    this.fader = fader;
    this.nextTime = t + 0.08;
    this.timer = window.setInterval(() => this.tick(), 40);
    this.tick();
  }

  setLevel(level: number): void {
    const fader = this.fader;
    if (!fader) return;
    const t = engine.now();
    fader.gain.cancelScheduledValues(t);
    fader.gain.setValueAtTime(fader.gain.value, t);
    fader.gain.linearRampToValueAtTime(level, t + 0.25);
  }

  stop(): void {
    this.release();
    this.track = null;
  }

  private release(): void {
    if (this.timer) {
      window.clearInterval(this.timer);
      this.timer = 0;
    }
    const fader = this.fader;
    this.fader = null;
    if (!fader) return;
    const t = engine.now();
    fader.gain.cancelScheduledValues(t);
    fader.gain.setValueAtTime(fader.gain.value, t);
    fader.gain.linearRampToValueAtTime(0.0001, t + 0.5);
    window.setTimeout(() => {
      try {
        fader.disconnect();
      } catch {
        /* already gone */
      }
    }, 800);
  }

  private tick(): void {
    const ctx = engine.ctx;
    const track = this.track;
    const dest = this.fader;
    if (!ctx || !track || !dest) return;
    const stepDur = 60 / track.bpm / 4;
    const horizon = ctx.currentTime + 0.13;
    let guard = 0;
    while (this.nextTime < horizon && guard < 64) {
      guard++;
      if (this.nextTime < ctx.currentTime) this.nextTime = ctx.currentTime + 0.02;
      this.playStep(ctx, track, dest, this.step, this.nextTime);
      this.nextTime += stepDur;
      this.step++;
      if (this.step >= STEPS) {
        this.step = 0;
        this.bar++;
      }
    }
  }

  private playStep(ctx: AudioContext, track: MusicTrack, dest: AudioNode, step: number, t: number): void {
    const p = track.patterns;
    const barsPerChord = Math.max(1, track.chordBars ?? 2);
    const chordCount = Math.max(1, track.prog.length);
    const chord = track.prog[Math.floor(this.bar / barsPerChord) % chordCount] ?? track.prog[0] ?? [];
    const root = chord[0] ?? 48;

    if (hit(p.kick, step)) this.kick(ctx, dest, t);
    if (hit(p.snare, step)) {
      if (track.clap) this.clap(ctx, dest, t);
      else this.snare(ctx, dest, t);
    }
    const h = at(p.hat, step);
    if (h === "x" || h === "o") this.hat(ctx, dest, t, h === "o");

    const b = at(p.bass, step);
    if (b === "x" || b === "o") this.bassNote(ctx, dest, t, track, mtof(root + (b === "o" ? 12 : 0)));

    if (hit(p.chord, step) && chord.length > 1) this.stab(ctx, dest, t, track, chord);

    const l = at(p.lead, step);
    if (l !== "." && chord.length > 1) {
      const index = Number(l);
      if (Number.isFinite(index)) this.leadNote(ctx, dest, t, track, chord, index);
    }
  }

  private kick(ctx: AudioContext, dest: AudioNode, t: number): void {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.9, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
    g.connect(dest);
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(165, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    o.connect(g);
    o.start(t);
    o.stop(t + 0.38);
  }

  private snare(ctx: AudioContext, dest: AudioNode, t: number): void {
    const src = ctx.createBufferSource();
    src.buffer = whiteNoise(ctx);
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 1800;
    f.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.32, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.17);
    src.connect(f);
    f.connect(g);
    g.connect(dest);
    engine.send(g, 0.16);
    src.start(t);
    src.stop(t + 0.22);

    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.setValueAtTime(220, t);
    o.frequency.exponentialRampToValueAtTime(150, t + 0.1);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(0.2, t + 0.004);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
    o.connect(og);
    og.connect(dest);
    o.start(t);
    o.stop(t + 0.16);
  }

  private clap(ctx: AudioContext, dest: AudioNode, t: number): void {
    this.burst(ctx, dest, t, 0.09, 0.2);
    this.burst(ctx, dest, t + 0.014, 0.09, 0.2);
    this.burst(ctx, dest, t + 0.028, 0.14, 0.28);
  }

  private burst(ctx: AudioContext, dest: AudioNode, t: number, dur: number, gain: number): void {
    const src = ctx.createBufferSource();
    src.buffer = whiteNoise(ctx);
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 1600;
    f.Q.value = 1.4;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(dest);
    engine.send(g, 0.14);
    src.start(t);
    src.stop(t + dur + 0.04);
  }

  private hat(ctx: AudioContext, dest: AudioNode, t: number, open: boolean): void {
    const dur = open ? 0.16 : 0.04;
    const src = ctx.createBufferSource();
    src.buffer = whiteNoise(ctx);
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 7200;
    f.Q.value = 0.7;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.15, t + 0.0015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(dest);
    src.start(t);
    src.stop(t + dur + 0.04);
  }

  private bassNote(ctx: AudioContext, dest: AudioNode, t: number, track: MusicTrack, freq: number): void {
    const dur = track.bassDur ?? 0.26;
    const cutoff = track.bassFilter ?? 900;
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.Q.value = 4;
    f.frequency.setValueAtTime(cutoff, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(90, cutoff * 0.35), t + Math.min(dur, 0.3));
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.42, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const o = ctx.createOscillator();
    o.type = track.bassWave ?? "sawtooth";
    o.frequency.setValueAtTime(freq, t);
    o.connect(f);
    f.connect(g);
    g.connect(dest);
    o.start(t);
    o.stop(t + dur + 0.06);
  }

  private stab(ctx: AudioContext, dest: AudioNode, t: number, track: MusicTrack, chord: number[]): void {
    const dur = track.chordDur ?? 0.3;
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = track.chordFilter ?? 2600;
    f.Q.value = 1.1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.15, t + 0.014);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    f.connect(g);
    g.connect(dest);
    engine.send(g, 0.18);
    chord.slice(1).forEach((note, i) => {
      const o = ctx.createOscillator();
      o.type = track.chordWave ?? "sawtooth";
      o.frequency.value = mtof(note);
      o.detune.value = i % 2 === 0 ? -7 : 7;
      o.connect(f);
      o.start(t);
      o.stop(t + dur + 0.06);
    });
  }

  private leadNote(
    ctx: AudioContext,
    dest: AudioNode,
    t: number,
    track: MusicTrack,
    chord: number[],
    index: number,
  ): void {
    const pool: number[] = [];
    for (const note of chord.slice(1)) {
      pool.push(note, note + 12);
    }
    const note = pool[index % Math.max(1, pool.length)];
    if (note === undefined) return;
    const dur = track.leadDur ?? 0.2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const o = ctx.createOscillator();
    o.type = track.leadWave ?? "triangle";
    o.frequency.value = mtof(note);
    o.connect(g);
    g.connect(dest);
    engine.send(g, 0.22);
    o.start(t);
    o.stop(t + dur + 0.06);
  }
}
