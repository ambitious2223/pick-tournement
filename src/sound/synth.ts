export interface ToneOptions {
  type?: OscillatorType;
  freq: number;
  t: number;
  dur: number;
  gain?: number;
  attack?: number;
  release?: number;
  detune?: number;
  glideTo?: number;
}

export function tone(ctx: AudioContext, dest: AudioNode, o: ToneOptions): OscillatorNode {
  const g = ctx.createGain();
  const peak = o.gain ?? 0.25;
  const attack = Math.min(o.attack ?? 0.008, o.dur * 0.5);
  const release = o.release ?? Math.max(0.02, o.dur - attack);
  g.gain.setValueAtTime(0.0001, o.t);
  g.gain.exponentialRampToValueAtTime(peak, o.t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, o.t + attack + release);
  g.connect(dest);

  const osc = ctx.createOscillator();
  osc.type = o.type ?? "sine";
  osc.frequency.setValueAtTime(o.freq, o.t);
  if (o.glideTo) osc.frequency.exponentialRampToValueAtTime(o.glideTo, o.t + o.dur);
  if (o.detune) osc.detune.value = o.detune;
  osc.connect(g);
  osc.start(o.t);
  osc.stop(o.t + o.dur + 0.05);
  return osc;
}

let noiseBuffer: AudioBuffer | null = null;
export function noiseBufferFor(ctx: AudioContext): AudioBuffer {
  if (noiseBuffer) return noiseBuffer;
  const len = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.2;
  }
  noiseBuffer = buffer;
  return buffer;
}

export interface NoiseOptions {
  t: number;
  dur: number;
  gain?: number;
  filter?: BiquadFilterType;
  freq?: number;
  q?: number;
  attack?: number;
  release?: number;
}

export function noise(ctx: AudioContext, dest: AudioNode, o: NoiseOptions): AudioBufferSourceNode {
  const src = ctx.createBufferSource();
  src.buffer = noiseBufferFor(ctx);
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = o.filter ?? "bandpass";
  filter.frequency.value = o.freq ?? 1200;
  filter.Q.value = o.q ?? 1;
  const g = ctx.createGain();
  const peak = o.gain ?? 0.15;
  const attack = o.attack ?? 0.005;
  const release = o.release ?? Math.max(0.02, o.dur - attack);
  g.gain.setValueAtTime(0.0001, o.t);
  g.gain.exponentialRampToValueAtTime(peak, o.t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, o.t + attack + release);
  src.connect(filter);
  filter.connect(g);
  g.connect(dest);
  src.start(o.t);
  src.stop(o.t + o.dur + 0.05);
  return src;
}
