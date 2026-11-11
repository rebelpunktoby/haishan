// engine_v2.js — OceanMountain · the merged OMT demo (v2 master stage)
//
// The circadian engine (engine.js) stays the truth: I-Ching hour table,
// season octave, day-quadrant chords, voices, drone, tanh + delay + clip,
// presence, makeup, compressor. Nothing in it is changed.
//
// This file wraps it in a calm top layer brought in from Sketch 4A, and
// a hearing-safety master, so one page gives a visitor one living piece:
//
//   engine.output
//     → Light  (gentle low-pass tilt; the breath opens it a little on each inhale)
//     → Breath (one slow shared LFO on level, 5–16 s per cycle)
//     → Room   (long filtered delay, dry/wet)
//     → ceiling (~9 kHz; nothing harsh above it)
//     → limiter (fast peak control, brick-wall clip as the last guard)
//     → output
//
// Every parameter change is ramped (setTargetAtTime); nothing jumps.

import { CircadianEngine } from "./engine.js?v=6";

const TAU = 2 * Math.PI;

export const DEFAULTS = Object.freeze({ breath: 10, light: 50, room: 40 });

// Light 0–100 → tilt cutoff, 700 Hz .. 7.5 kHz (exponential, gentle at the top)
export function lightToCutoff(v) {
  const x = Math.max(0, Math.min(100, v)) / 100;
  return 700 * Math.pow(7500 / 700, x);
}

export class OceanMountainV2 {
  constructor(ctx) {
    this.ctx = ctx;
    this.core = new CircadianEngine(ctx);
    this.state = { ...DEFAULTS };

    // ----- Light: a one-pole tilt the breath can open -----
    this.tilt = ctx.createBiquadFilter();
    this.tilt.type = "lowpass";
    this.tilt.Q.value = 0.5;
    this.tilt.frequency.value = lightToCutoff(DEFAULTS.light);

    // ----- Breath: level + a little brightness, one shared slow cycle -----
    this.breathGain = ctx.createGain();
    this.breathGain.gain.value = 0;                       // driven by base + LFO
    this.breathBase = ctx.createConstantSource();
    this.breathBase.offset.value = 0.90;                  // resting level
    this.breathLfo = ctx.createOscillator();
    this.breathLfo.type = "sine";
    this.breathLfo.frequency.value = 1 / DEFAULTS.breath;
    this.breathAmp = ctx.createGain();
    this.breathAmp.gain.value = 0.10;                     // ±10 % level, never to zero
    this.breathCut = ctx.createGain();
    this.breathCut.gain.value = lightToCutoff(DEFAULTS.light) * 0.30;  // opens the tilt on inhale
    this.breathBase.connect(this.breathGain.gain);
    this.breathLfo.connect(this.breathAmp);
    this.breathAmp.connect(this.breathGain.gain);
    this.breathLfo.connect(this.breathCut);
    this.breathCut.connect(this.tilt.frequency);

    // ----- Room: long, dark, filtered delay -----
    this.dry = ctx.createGain();
    this.send = ctx.createGain();
    this.delay = ctx.createDelay(3.0);
    this.delay.delayTime.value = 0.92;
    this.fbTone = ctx.createBiquadFilter();
    this.fbTone.type = "lowpass";
    this.fbTone.frequency.value = 1500;
    this.fbTone.Q.value = 0.5;
    this.fb = ctx.createGain();
    this.wet = ctx.createGain();
    this.roomSum = ctx.createGain();

    // ----- Hearing safety -----
    this.ceiling = ctx.createBiquadFilter();              // nothing harsh above ~9 kHz
    this.ceiling.type = "lowpass";
    this.ceiling.frequency.value = 9000;
    this.ceiling.Q.value = 0.6;
    this.ceiling2 = ctx.createBiquadFilter();             // second pole: 24 dB/oct
    this.ceiling2.type = "lowpass";
    this.ceiling2.frequency.value = 9000;
    this.ceiling2.Q.value = 0.6;
    this.limiter = ctx.createDynamicsCompressor();        // fast peak limiter
    this.limiter.threshold.value = -6;
    this.limiter.knee.value = 1;
    this.limiter.ratio.value = 20;
    this.limiter.attack.value = 0.002;
    this.limiter.release.value = 0.25;
    this.trim = ctx.createGain();
    this.trim.gain.value = 0.9;
    this.guard = ctx.createWaveShaper();                  // last resort: soft clip at ±0.98
    this.guard.curve = (() => {
      const n = 2048, c = new Float32Array(n);
      for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; c[i] = Math.tanh(x * 1.15) * 0.98; }
      return c;
    })();
    this.guard.oversample = "2x";

    // ----- wiring -----
    this.core.output.connect(this.tilt);
    this.tilt.connect(this.breathGain);
    this.breathGain.connect(this.dry);
    this.breathGain.connect(this.send);
    this.send.connect(this.delay);
    this.delay.connect(this.fbTone);
    this.fbTone.connect(this.fb);
    this.fb.connect(this.delay);
    this.fbTone.connect(this.wet);
    this.dry.connect(this.roomSum);
    this.wet.connect(this.roomSum);
    this.roomSum.connect(this.ceiling);
    this.ceiling.connect(this.ceiling2);
    this.ceiling2.connect(this.limiter);
    this.limiter.connect(this.trim);
    this.trim.connect(this.guard);
    this.output = this.guard;

    this.setRoom(DEFAULTS.room, true);

    const t = ctx.currentTime;
    this.breathBase.start(t);
    this.breathLfo.start(t);
  }

  // ---- the three listener controls; all ramped ----
  setBreath(seconds) {
    const s = Math.max(4, Math.min(20, seconds));
    this.state.breath = s;
    this.breathLfo.frequency.setTargetAtTime(1 / s, this.ctx.currentTime, 1.2);
  }

  setLight(v, immediate = false) {
    this.state.light = v;
    const c = lightToCutoff(v), t = this.ctx.currentTime, tc = immediate ? 0.01 : 0.5;
    this.tilt.frequency.setTargetAtTime(c, t, tc);
    this.breathCut.gain.setTargetAtTime(c * 0.30, t, tc);
  }

  setRoom(v, immediate = false) {
    this.state.room = v;
    const s = Math.max(0, Math.min(100, v)) / 100, t = this.ctx.currentTime, tc = immediate ? 0.01 : 0.6;
    this.send.gain.setTargetAtTime(0.18 + 0.62 * s, t, tc);
    this.fb.gain.setTargetAtTime(0.12 + 0.40 * s, t, tc);          // never above 0.52: no runaway
    this.wet.gain.setTargetAtTime(0.70 * s, t, tc);
    this.dry.gain.setTargetAtTime(1 - 0.30 * s, t, tc);
  }

  // ---- pass-throughs to the core (unchanged behaviour) ----
  update(month, hour, force) { this.core.update(month, hour, force); }
  setOffsetCap(cap) { this.core.setOffsetCap(cap); }
  setPresence(a) { this.core.setPresence(a); }
}

// ---- WAV writer (from Sketch 4B) ----
export function audioBufferToWav(buf) {
  const ch = buf.numberOfChannels, len = buf.length, sr = buf.sampleRate;
  const b = new ArrayBuffer(44 + len * ch * 2), v = new DataView(b);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, "RIFF"); v.setUint32(4, 36 + len * ch * 2, true); w(8, "WAVE");
  w(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, ch, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * ch * 2, true); v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true);
  w(36, "data"); v.setUint32(40, len * ch * 2, true);
  const d = []; for (let c = 0; c < ch; c++) d.push(buf.getChannelData(c));
  let o = 44;
  for (let i = 0; i < len; i++) for (let c = 0; c < ch; c++) {
    const s = Math.max(-1, Math.min(1, d[c][i]));
    v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7FFF, true); o += 2;
  }
  return new Blob([b], { type: "audio/wav" });
}

// ---- "take this moment with you": render N seconds of the current moment offline ----
// opts: { seconds, month, hour, state:{breath,light,room}, speakers:boolean }
export async function renderMoment(opts) {
  const sr = 44100, L = opts.seconds;
  const O = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!O) throw new Error("Offline rendering isn't supported in this browser.");
  const oc = new O(2, Math.round(sr * L), sr);
  const e = new OceanMountainV2(oc);
  e.setBreath(opts.state.breath); e.setLight(opts.state.light, true); e.setRoom(opts.state.room, true);
  e.setOffsetCap(opts.speakers ? 2 : 1000); e.setPresence(opts.speakers ? 0.5 : 0.35);
  e.update(opts.month, opts.hour, true);
  const fade = oc.createGain();
  fade.gain.setValueAtTime(0, 0);
  fade.gain.setTargetAtTime(1, 0, 0.8);                      // breathe in
  fade.gain.setValueAtTime(1, Math.max(0, L - 3.5));
  fade.gain.setTargetAtTime(0, Math.max(0, L - 3.5), 0.7);   // breathe out
  e.output.connect(fade); fade.connect(oc.destination);
  const buf = await oc.startRendering();
  return audioBufferToWav(buf);
}

export { TAU };
