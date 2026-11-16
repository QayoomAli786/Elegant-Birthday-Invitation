/**
 * Tiny Web Audio synth: party sound effects + a music-box "Happy Birthday"
 * with sing-along (karaoke) events. No audio files needed.
 */

interface AudioGraph {
  ctx: AudioContext;
  master: GainNode;
  fx: GainNode;
}

type WindowWithWebkit = Window & { webkitAudioContext?: typeof AudioContext };

let graph: AudioGraph | null = null;
let noiseBuffer: AudioBuffer | null = null;

/** Lazily creates (and resumes) the shared AudioContext. Call inside a user gesture first. */
export function getAudio(): AudioGraph | null {
  if (typeof window === "undefined") return null;
  if (!graph) {
    const Ctor = window.AudioContext || (window as WindowWithWebkit).webkitAudioContext;
    if (!Ctor) return null;
    let ctx: AudioContext;
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
    const master = ctx.createGain();
    master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 10;
    comp.ratio.value = 5;
    comp.attack.value = 0.002;
    comp.release.value = 0.2;
    master.connect(comp);
    comp.connect(ctx.destination);
    const fx = ctx.createGain();
    fx.gain.value = 0.5;
    fx.connect(master);
    graph = { ctx, master, fx };
  }
  if (graph.ctx.state === "suspended") graph.ctx.resume().catch(() => undefined);
  return graph;
}

function getNoise(ctx: AudioContext) {
  if (!noiseBuffer || noiseBuffer.sampleRate !== ctx.sampleRate) {
    const length = Math.floor(ctx.sampleRate * 2);
    noiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

function envelope(param: AudioParam, t: number, peak: number, attack: number, decay: number) {
  param.setValueAtTime(0.0001, t);
  param.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack);
  param.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

interface NoiseOpts {
  filter?: BiquadFilterType;
  freq?: number;
  freqEnd?: number;
  q?: number;
  peak?: number;
  attack?: number;
  decay?: number;
}

function noise(g: AudioGraph, t: number, o: NoiseOpts = {}) {
  const { filter = "bandpass", freq = 1000, freqEnd, q = 1, peak = 0.4, attack = 0.005, decay = 0.2 } = o;
  const src = g.ctx.createBufferSource();
  src.buffer = getNoise(g.ctx);
  const f = g.ctx.createBiquadFilter();
  f.type = filter;
  f.Q.value = q;
  f.frequency.setValueAtTime(freq, t);
  if (freqEnd) f.frequency.exponentialRampToValueAtTime(freqEnd, t + attack + decay);
  const amp = g.ctx.createGain();
  envelope(amp.gain, t, peak, attack, decay);
  src.connect(f);
  f.connect(amp);
  amp.connect(g.fx);
  src.start(t, Math.random() * 0.6);
  src.stop(t + attack + decay + 0.05);
}

interface ToneOpts {
  freq: number;
  freqEnd?: number;
  type?: OscillatorType;
  peak?: number;
  attack?: number;
  decay?: number;
}

function tone(g: AudioGraph, t: number, o: ToneOpts) {
  const { freq, freqEnd, type = "sine", peak = 0.2, attack = 0.01, decay = 0.4 } = o;
  const osc = g.ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + attack + decay);
  const amp = g.ctx.createGain();
  envelope(amp.gain, t, peak, attack, decay);
  osc.connect(amp);
  amp.connect(g.fx);
  osc.start(t);
  osc.stop(t + attack + decay + 0.05);
}

let lastBoom = 0;
let lastPop = 0;
let lastScratch = 0;

export const sfx = {
  pop() {
    const g = getAudio();
    if (!g) return;
    const t = g.ctx.currentTime;
    if (t - lastPop < 0.03) return;
    lastPop = t;
    noise(g, t, { filter: "bandpass", freq: 1500 + Math.random() * 1000, q: 0.8, peak: 0.9, attack: 0.002, decay: 0.09 });
    noise(g, t, { filter: "highpass", freq: 5000, q: 0.4, peak: 0.25, attack: 0.001, decay: 0.04 });
    tone(g, t, { freq: 240, freqEnd: 60, peak: 0.45, attack: 0.002, decay: 0.12 });
  },
  boom() {
    const g = getAudio();
    if (!g) return;
    const t = g.ctx.currentTime;
    if (t - lastBoom < 0.1) return;
    lastBoom = t;
    noise(g, t, { filter: "lowpass", freq: 1400, freqEnd: 110, q: 0.7, peak: 0.55, attack: 0.006, decay: 1.2 });
    tone(g, t, { freq: 120, freqEnd: 38, peak: 0.35, attack: 0.004, decay: 0.55 });
    for (let i = 0; i < 7; i++) {
      noise(g, t + 0.25 + Math.random() * 0.7, {
        filter: "highpass",
        freq: 2500 + Math.random() * 4000,
        q: 0.8,
        peak: 0.05 + Math.random() * 0.08,
        attack: 0.001,
        decay: 0.025 + Math.random() * 0.03,
      });
    }
  },
  whoosh() {
    const g = getAudio();
    if (!g) return;
    noise(g, g.ctx.currentTime, { filter: "bandpass", freq: 280, freqEnd: 2400, q: 1.4, peak: 0.3, attack: 0.15, decay: 0.4 });
  },
  blow() {
    const g = getAudio();
    if (!g) return;
    noise(g, g.ctx.currentTime, { filter: "lowpass", freq: 1100, freqEnd: 260, q: 0.4, peak: 0.28, attack: 0.03, decay: 0.38 });
  },
  chime() {
    const g = getAudio();
    if (!g) return;
    const t = g.ctx.currentTime;
    [1046.5, 1318.5, 1568, 2093].forEach((f, i) => tone(g, t + i * 0.07, { freq: f, peak: 0.13, attack: 0.004, decay: 0.7 }));
  },
  tada() {
    const g = getAudio();
    if (!g) return;
    const t = g.ctx.currentTime;
    [392, 523.25, 659.25, 783.99].forEach((f, i) =>
      tone(g, t + i * 0.08, { freq: f, type: "triangle", peak: 0.16, attack: 0.005, decay: 0.22 }),
    );
    [523.25, 659.25, 783.99, 1046.5].forEach((f) =>
      tone(g, t + 0.36, { freq: f, type: "triangle", peak: 0.1, attack: 0.02, decay: 1.3 }),
    );
  },
  twinkle() {
    const g = getAudio();
    if (!g || g.ctx.state !== "running") return;
    tone(g, g.ctx.currentTime, { freq: 1800 + Math.random() * 900, peak: 0.035, attack: 0.003, decay: 0.15 });
  },
  scratch() {
    const g = getAudio();
    if (!g) return;
    const t = g.ctx.currentTime;
    if (t - lastScratch < 0.07) return;
    lastScratch = t;
    noise(g, t, { filter: "highpass", freq: 2500 + Math.random() * 2500, q: 0.6, peak: 0.06, attack: 0.004, decay: 0.05 });
  },
  squish() {
    const g = getAudio();
    if (!g) return;
    noise(g, g.ctx.currentTime, { filter: "lowpass", freq: 700, freqEnd: 180, q: 1.2, peak: 0.4, attack: 0.02, decay: 0.28 });
  },
};

/* ------------------------------------------------------------------ */
/*  Happy Birthday — music box + soft chords, with karaoke events      */
/* ------------------------------------------------------------------ */

export const NAME_TOKEN = "{name}";

interface SongNote {
  note: string;
  beats: number;
  token: number;
}
interface SongChord {
  at: number;
  notes: string[];
  beats: number;
}
export interface SongLine {
  tokens: string[];
  notes: SongNote[];
  chords: SongChord[];
}

const n = (note: string, beats: number, token: number): SongNote => ({ note, beats, token });
const C = ["C3", "G3", "E4"];
const G7 = ["G2", "F3", "B3"];
const F = ["F2", "C3", "A3"];

export const SONG: SongLine[] = [
  {
    tokens: ["Hap", "py ", "birth", "day ", "to ", "you"],
    notes: [n("G4", 0.75, 0), n("G4", 0.25, 1), n("A4", 1, 2), n("G4", 1, 3), n("C5", 1, 4), n("B4", 2, 5)],
    chords: [
      { at: 1, notes: C, beats: 3 },
      { at: 4, notes: G7, beats: 2.5 },
    ],
  },
  {
    tokens: ["Hap", "py ", "birth", "day ", "to ", "you"],
    notes: [n("G4", 0.75, 0), n("G4", 0.25, 1), n("A4", 1, 2), n("G4", 1, 3), n("D5", 1, 4), n("C5", 2, 5)],
    chords: [
      { at: 1, notes: G7, beats: 3 },
      { at: 4, notes: C, beats: 2.5 },
    ],
  },
  {
    tokens: ["Hap", "py ", "birth", "day ", "dear ", NAME_TOKEN],
    notes: [
      n("G4", 0.75, 0),
      n("G4", 0.25, 1),
      n("G5", 1, 2),
      n("E5", 1, 3),
      n("C5", 1, 4),
      n("B4", 1, 5),
      n("A4", 2, 5),
    ],
    chords: [
      { at: 1, notes: C, beats: 3 },
      { at: 4, notes: F, beats: 3 },
    ],
  },
  {
    tokens: ["Hap", "py ", "birth", "day ", "to ", "you!"],
    notes: [n("F5", 0.75, 0), n("F5", 0.25, 1), n("E5", 1, 2), n("C5", 1, 3), n("D5", 1, 4), n("C5", 3, 5)],
    chords: [
      { at: 1, notes: C, beats: 2 },
      { at: 3, notes: G7, beats: 1 },
      { at: 4, notes: C, beats: 3 },
    ],
  },
];

const SEMITONES: Record<string, number> = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };

function freqOf(note: string) {
  const m = /^([A-G])([#b]?)(\d)$/.exec(note);
  if (!m) return 440;
  const semis = SEMITONES[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0) + (Number(m[3]) - 4) * 12;
  return 440 * Math.pow(2, semis / 12);
}

function musicBox(ctx: AudioContext, dest: AudioNode, freq: number, t: number, dur: number) {
  const amp = ctx.createGain();
  const tail = Math.max(0.5, dur + 0.35);
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(0.22, t + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.07, t + 0.18);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + tail);
  amp.connect(dest);
  const partials: [OscillatorType, number, number][] = [
    ["triangle", 1, 1],
    ["sine", 2, 0.35],
    ["sine", 3.01, 0.12],
    ["sine", 4.02, 0.05],
  ];
  for (const [type, mult, gain] of partials) {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq * mult;
    const g = ctx.createGain();
    g.gain.value = gain;
    osc.connect(g);
    g.connect(amp);
    osc.start(t);
    osc.stop(t + tail + 0.05);
  }
}

function pad(ctx: AudioContext, dest: AudioNode, freq: number, t: number, dur: number) {
  const osc = ctx.createOscillator();
  osc.type = "triangle";
  osc.frequency.value = freq;
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(0.055, t + 0.06);
  amp.gain.exponentialRampToValueAtTime(0.03, t + dur * 0.6);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.3);
  osc.connect(amp);
  amp.connect(dest);
  osc.start(t);
  osc.stop(t + dur + 0.35);
}

export interface MusicState {
  playing: boolean;
  line: number;
  token: number;
}
type Listener = (state: MusicState) => void;

class MusicPlayer {
  private state: MusicState = { playing: false, line: -1, token: -1 };
  private listeners = new Set<Listener>();
  private bus: GainNode | null = null;
  private timers: number[] = [];
  private readonly beat = 0.44;

  getState() {
    return this.state;
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private set(patch: Partial<MusicState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l(this.state));
  }

  start(delay = 0.12) {
    if (this.state.playing) return;
    const g = getAudio();
    if (!g) return;
    this.bus = g.ctx.createGain();
    this.bus.gain.value = 0.85;
    this.bus.connect(g.master);
    this.set({ playing: true, line: -1, token: -1 });
    this.schedule(g.ctx.currentTime + delay);
  }

  stop() {
    if (!this.state.playing) return;
    this.timers.forEach((id) => clearTimeout(id));
    this.timers = [];
    const g = getAudio();
    const bus = this.bus;
    this.bus = null;
    if (g && bus) {
      bus.gain.cancelScheduledValues(g.ctx.currentTime);
      bus.gain.setTargetAtTime(0, g.ctx.currentTime, 0.06);
      window.setTimeout(() => bus.disconnect(), 600);
    }
    this.set({ playing: false, line: -1, token: -1 });
  }

  toggle() {
    if (this.state.playing) this.stop();
    else this.start();
  }

  private at(time: number, fn: () => void) {
    const g = getAudio();
    if (!g) return;
    this.timers.push(window.setTimeout(fn, Math.max(0, (time - g.ctx.currentTime) * 1000)));
  }

  private schedule(t0: number) {
    const g = getAudio();
    const bus = this.bus;
    if (!g || !bus) return;
    this.timers = [];
    const B = this.beat;
    let lineStart = t0;
    SONG.forEach((line, li) => {
      let offset = 0;
      for (const note of line.notes) {
        const t = lineStart + offset * B;
        musicBox(g.ctx, bus, freqOf(note.note), t, note.beats * B);
        this.at(t, () => this.set({ line: li, token: note.token }));
        offset += note.beats;
      }
      for (const chord of line.chords) {
        for (const cn of chord.notes) pad(g.ctx, bus, freqOf(cn), lineStart + chord.at * B, chord.beats * B);
      }
      lineStart += offset * B;
    });
    this.at(lineStart + 0.4, () => this.set({ line: -1, token: -1 }));
    const next = lineStart + 3 * B;
    this.at(next - 0.25, () => this.schedule(next));
  }
}

export const music = new MusicPlayer();
