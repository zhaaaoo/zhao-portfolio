// a tiny synth for the island; every sound is generated, so there are no audio files to load
let ctx: AudioContext | undefined;
let out: GainNode;
let noise: AudioBuffer;
let muted = (() => {
  try {
    return localStorage.getItem('sound') === 'off';
  } catch {
    return false;
  }
})();

const VOLUME = 0.55;

function audio() {
  if (!ctx) {
    ctx = new AudioContext();
    out = ctx.createGain();
    out.gain.value = muted ? 0 : VOLUME;
    out.connect(ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

// browsers only let audio start after a gesture, so wake the context on the first one
addEventListener('pointerdown', () => audio(), { once: true });
addEventListener('keydown', () => audio(), { once: true });

export const isMuted = () => muted;

export function setMuted(value: boolean) {
  muted = value;
  try {
    localStorage.setItem('sound', value ? 'off' : 'on');
  } catch {
    // private mode; the choice just won't stick
  }
  if (ctx) out.gain.setTargetAtTime(value ? 0 : VOLUME, ctx.currentTime, 0.05);
}

function envelope(a: AudioContext, peak: number, length: number, at: number) {
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, at + length);
  g.connect(out);
  return g;
}

function hiss(type: BiquadFilterType, from: number, to: number, peak: number, length: number, at?: number) {
  const a = audio();
  const t = at ?? a.currentTime;
  const src = a.createBufferSource();
  src.buffer = noise;
  const f = a.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(from, t);
  f.frequency.exponentialRampToValueAtTime(to, t + length);
  src.connect(f).connect(envelope(a, peak, length, t));
  src.start(t, Math.random());
  src.stop(t + length + 0.05);
}

function tone(type: OscillatorType, from: number, to: number, peak: number, length: number, at?: number) {
  const a = audio();
  const t = at ?? a.currentTime;
  const o = a.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(from, t);
  o.frequency.exponentialRampToValueAtTime(to, t + length);
  o.connect(envelope(a, peak, length, t));
  o.start(t);
  o.stop(t + length + 0.05);
}

const now = () => audio().currentTime;

export const sfx = {
  whoosh: () => hiss('bandpass', 250, 3200, 0.5, 1.1),
  pop: () => tone('sine', 520, 1300, 0.25, 0.12),
  thump: () => {
    tone('sine', 150, 38, 0.9, 0.4);
    hiss('lowpass', 1400, 120, 0.6, 0.45);
  },
  heartbeat: () => {
    const t = now();
    tone('sine', 72, 40, 0.8, 0.2, t);
    tone('sine', 72, 40, 0.55, 0.2, t + 0.24);
  },
  splash: () => {
    const t = now();
    hiss('lowpass', 5000, 260, 0.7, 0.8, t);
    for (let i = 0; i < 6; i++) tone('sine', 300 + Math.random() * 300, 900 + Math.random() * 700, 0.1, 0.07, t + 0.35 + i * 0.08);
  },
  bubble: () => tone('sine', 320 + Math.random() * 260, 1100, 0.07, 0.07),
  shutter: () => {
    const t = now();
    hiss('highpass', 3000, 6000, 0.4, 0.03, t);
    hiss('highpass', 2500, 5000, 0.3, 0.05, t + 0.07);
  },
  chime: () => {
    const t = now();
    [784, 988, 1319].forEach((f, i) => tone('triangle', f, f, 0.18, 0.35, t + i * 0.09));
  },
};

// wind and edge noise for the snowboard run; set() takes speed and carve in 0..1
export function ride() {
  const a = audio();
  const src = a.createBufferSource();
  src.buffer = noise;
  src.loop = true;
  const low = a.createBiquadFilter();
  low.type = 'lowpass';
  const lowGain = a.createGain();
  lowGain.gain.value = 0;
  const edge = a.createBiquadFilter();
  edge.type = 'bandpass';
  edge.frequency.value = 2600;
  edge.Q.value = 1.4;
  const edgeGain = a.createGain();
  edgeGain.gain.value = 0;
  src.connect(low).connect(lowGain).connect(out);
  src.connect(edge).connect(edgeGain).connect(out);
  src.start();
  return {
    set(speed: number, carve: number) {
      const t = a.currentTime;
      low.frequency.setTargetAtTime(220 + speed * 1600, t, 0.08);
      lowGain.gain.setTargetAtTime(speed * 0.75, t, 0.08);
      edgeGain.gain.setTargetAtTime(carve * speed * 0.4, t, 0.05);
    },
    stop() {
      const t = a.currentTime;
      lowGain.gain.setTargetAtTime(0, t, 0.15);
      edgeGain.gain.setTargetAtTime(0, t, 0.1);
      src.stop(t + 1);
    },
  };
}

const BPM = 120;
let beatStart: number | null = null;

// beats since the music started, or a free-running count without it, so dance moves land on the beat
export function beats() {
  return ctx && beatStart !== null ? (ctx.currentTime - beatStart) * (BPM / 60) : performance.now() / (60000 / BPM);
}

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
// A, F#m, D, E: four bars of something bright
const chords = [
  [69, 73, 76, 81],
  [66, 69, 73, 78],
  [62, 66, 69, 74],
  [64, 68, 71, 76],
];
const arp = [0, 1, 2, 3, 2, 1, 3, 2];

export function music() {
  const a = audio();
  const step = 60 / BPM / 2;
  let next = a.currentTime + 0.1;
  beatStart = next;
  let n = 0;
  const play = (i: number, t: number) => {
    const s = i % 8;
    const bar = Math.floor(i / 8) % 4;
    const chord = chords[bar];
    if (s === 0 || s === 4 || (s === 7 && bar % 2)) tone('sine', 160, 42, 0.9, 0.3, t);
    if (s === 2 || s === 6) hiss('bandpass', 1900, 1100, 0.5, 0.16, t);
    hiss('highpass', 7500, 9000, s % 2 ? 0.14 : 0.08, 0.05, t);
    if (bar === 3 && s >= 6) hiss('highpass', 7500, 9000, 0.1, 0.04, t + step / 2);
    if (s === 0) tone('triangle', hz(chord[0] - 36), hz(chord[0] - 36), 0.4, step * 7.5, t);
    tone('square', hz(chord[arp[s]]), hz(chord[arp[s]]), 0.035, step * 0.9, t);
  };
  const timer = setInterval(() => {
    // after the tab was hidden, skip ahead instead of firing every missed note at once
    while (next < a.currentTime) {
      next += step;
      n++;
    }
    while (next < a.currentTime + 0.25) {
      play(n++, next);
      next += step;
    }
  }, 60);
  return () => {
    clearInterval(timer);
    beatStart = null;
  };
}
