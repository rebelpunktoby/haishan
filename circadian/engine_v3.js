// engine_v3.js — OceanMountain · the breathing stage (v3)
//
// engine_core.js stays the truth (hour table, season octave, day chords, voices,
// tanh + cross delay + clip, presence, makeup, compressor). This file surrounds it:
//
//   one breath         a single uneven breath clock phrases everything: the drone's swell,
//                      the voices' tide, light, the room, the entries, the rests
//   the room           a generated impulse response that follows the hour and the sun
//   rests              designed near-silence at the deep hours, decided by rule
//   texture            unison drift on the carrier, an air bed tuned to the day chord,
//                      an answering voice by counterpoint rule, a neighbour voice beneath
//   weather            one small object read once per breath — the hook for later inputs
//   environment        env.js: a few elements with a reason (see the grammar there)
//   safety             ~9 kHz ceiling, limiter, soft guard; every change is ramped
//
// Design choices here are Register 3. The hour, the sun and the season are measured inputs.

import { CircadianEngine } from "./engine_core.js?v=2";
import { Environment } from "./env.js?v=1";

// the core's own tables, read-only, so the stage knows what the core is playing
export const ICHING = [[110,0.1,0,0],[110,0.1,0,0],[165,0.1,0,0],[165,0.15,0,0],[110,0.1,0,0],[220,0.3,0,1],[220,0.4,0,1],[275,0.5,1,1],[330,0.5,1,1],[330,0.6,1,1],[275,0.4,1,1],[440,0.8,1,1],[440,1.0,1,1],[550,1.2,1,1],[550,1.0,1,1],[440,0.9,1,1],[440,0.7,1,1],[165,0.4,1,1],[165,0.3,0,1],[110,0.3,0,1],[110,0.2,0,1],[165,0.2,0,0],[110,0.15,0,0],[110,0.1,0,0]];
export const SEASON_OCT = {1:.5,2:.5,3:1,4:1,5:1,6:2,7:2,8:2,9:1,10:1,11:1,12:.5};
export const DAY_CHORD = [[110,123.47,164.81],[110,138.59,155.56],[110,138.59,196.00],[110,130.81,146.83]];
const quadrantOf = h => (h >= 5 && h <= 10) ? 1 : (h >= 11 && h <= 16) ? 2 : (h >= 17 && h <= 22) ? 3 : 4;

export const DEFAULTS = Object.freeze({ breath: 10, light: 50, room: 40 });
export function lightToCutoff(v) { return 700 * Math.pow(7500 / 700, Math.max(0, Math.min(100, v)) / 100); }
export function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const smooth = (x, a, b) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---------- the moment's lean: what the hour and the sun invite (Register 3 mappings of Register 1 inputs) ----------
// m: { hourF, riseH, setH, month, hour, jieqi }  — hourF/riseH/setH in one frame (solar or clock), decimal hours
export function leanOf(m) {
  const h = ((m.hourF % 24) + 24) % 24, rise = m.riseH ?? 6.5, set = m.setH ?? 18.5;
  const day = smooth(h, rise - 0.6, rise + 1.2) * (1 - smooth(h, set - 1.2, set + 0.6));
  const noon = 0.5 + 0.5 * Math.cos((h - 13) / 24 * 2 * Math.PI);
  const deep = (h >= 22 || h < 4) ? 1 : 0, night = day < 0.3 ? 1 : 0;
  const dawn = Math.exp(-((h - rise) ** 2) / (2 * 1.1 ** 2)), dusk = Math.exp(-((h - set) ** 2) / (2 * 1.1 ** 2));
  return {
    day, noon, deep, night, dawn, dusk,
    breathPeriod: 9 + 7 * (1 - noon),                       // 9 s at full day → 16 s at deep night
    roomSize: 1.8 + 1.7 * day + 0.5 * noon,                 // seconds of tail: closed at night, open by day (capped near 4 s for phone CPU)
    roomBright: 900 + 3800 * day + 700 * noon,              // Hz: where the tail darkens
    restEvery: deep ? 3 : (night ? 5 : 0),                  // one breath in N is a rest
    airLevel: night ? 0.030 : 0.014,
    answerLevel: night ? 0.26 : 0.17,
    swellFloor: deep ? 0.6 : 0.7
  };
}
export function defaultWeather(lean, m) {
  const j = m.jieqi ?? 0;                                   // 0 = 立春 … 23 = 大寒
  const wet = [1, 4, 5, 7, 8, 10, 11].includes(j) ? 0.6 : [2, 3, 6, 9, 12, 13].includes(j) ? 0.35 : 0.15;
  const windy = (j >= 16 || j === 0) ? 0.55 : (j <= 5 ? 0.4 : 0.25);
  return {
    density: lean.deep ? 0.12 : (lean.night ? 0.3 : 0.55),
    turbulence: Math.min(1, windy + 0.25 * lean.dusk),
    brightness: lean.noon,
    grain: wet
  };
}

// ---------- the breath: inhale · hold · exhale, uneven, never a metronome ----------
export function nextBreath(t0, period, r, walk) {
  const p = period * (1 + walk + (r() - 0.5) * 0.16);
  const inhale = p * (0.36 + (r() - 0.5) * 0.06), hold = p * (0.06 + r() * 0.04), exhale = p - inhale - hold;
  return { t0, inhale, hold, exhale, t1: t0 + inhale, t2: t0 + inhale + hold, t3: t0 + p, period: p };
}

// ---------- the room, as a generated impulse response ----------
export function makeRoomIR(ctx, seconds, brightHz, seed = 3) {
  const sr = ctx.sampleRate, n = Math.floor(sr * seconds), ir = ctx.createBuffer(2, n, sr), r = rng(seed);
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c); let y = 0;
    for (let i = 0; i < n; i++) {
      const tt = i / sr, env = Math.exp(-6.9 * tt / seconds);
      const cutoff = brightHz * Math.exp(-2.2 * tt / seconds) + 120, a = Math.exp(-2 * Math.PI * cutoff / sr);
      y = a * y + (1 - a) * (r() * 2 - 1);
      d[i] = tt < 0.012 ? 0 : y * env;
    }
    for (let k = 0; k < 6; k++) { const at = Math.floor(sr * (0.014 + r() * 0.05)); if (at < n) d[at] += (r() * 2 - 1) * 0.35 * Math.exp(-k * 0.45); }
    let e = 0; for (let i = 0; i < n; i++) e += d[i] * d[i];
    const g = 1.1 / Math.sqrt(e / n * seconds * 0.5 + 1e-9); for (let i = 0; i < n; i++) d[i] *= g;
  }
  return ir;
}

export class OceanMountainV3 {
  constructor(ctx, opts = {}) {
    this.ctx = ctx; this.offline = !!opts.offline; this.seed = opts.seed ?? ((Date.now() / 1000) | 0);
    this.state = { ...DEFAULTS }; this.r = rng(this.seed); this.walk = 0; this.breathIndex = 0;
    this.moment = { hourF: 12, riseH: 6.5, setH: 18.5, month: 6, hour: 12, jieqi: 9 };
    this.lean = leanOf(this.moment); this.weather = defaultWeather(this.lean, this.moment); this.weatherOverride = null;
    this.planned = []; this.nextT = null; this.timer = null;
    this.lastTone = -1; this.dir = 1; this.held = 0;

    const core = this.core = new CircadianEngine(ctx);
    this.coreGain = ctx.createGain();
    this.sum = ctx.createGain();
    this.tilt = ctx.createBiquadFilter(); this.tilt.type = "lowpass"; this.tilt.Q.value = 0.5; this.cutoff = lightToCutoff(DEFAULTS.light); this.tilt.frequency.value = this.cutoff;
    this.breathGain = ctx.createGain(); this.breathGain.gain.value = 0.9;
    this.dry = ctx.createGain(); this.send = ctx.createGain(); this.wet = ctx.createGain(); this.roomSum = ctx.createGain();
    this.pre = ctx.createDelay(0.2); this.pre.delayTime.value = 0.026;
    this.convA = ctx.createConvolver(); this.convB = ctx.createConvolver(); this.convAg = ctx.createGain(); this.convBg = ctx.createGain(); this.convBg.gain.value = 0; this.convUse = "A"; this.roomKey = "";
    const ceiling = ctx.createBiquadFilter(); ceiling.type = "lowpass"; ceiling.frequency.value = 9000; ceiling.Q.value = 0.6;
    const ceiling2 = ctx.createBiquadFilter(); ceiling2.type = "lowpass"; ceiling2.frequency.value = 9000; ceiling2.Q.value = 0.6;
    const limiter = ctx.createDynamicsCompressor(); limiter.threshold.value = -6; limiter.knee.value = 1; limiter.ratio.value = 20; limiter.attack.value = 0.002; limiter.release.value = 0.25;
    const trim = ctx.createGain(); trim.gain.value = 0.9;
    const guard = ctx.createWaveShaper(); guard.curve = (() => { const n = 2048, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; c[i] = Math.tanh(x * 1.15) * 0.98; } return c; })(); guard.oversample = "2x";

    core.output.connect(this.coreGain); this.coreGain.connect(this.sum);
    this.sum.connect(this.tilt); this.tilt.connect(this.breathGain);
    this.breathGain.connect(this.dry); this.breathGain.connect(this.send);
    this.send.connect(this.pre); this.pre.connect(this.convA); this.pre.connect(this.convB);
    this.convA.connect(this.convAg); this.convB.connect(this.convBg); this.convAg.connect(this.wet); this.convBg.connect(this.wet);
    this.dry.connect(this.roomSum); this.wet.connect(this.roomSum);
    this.roomSum.connect(ceiling); ceiling.connect(ceiling2); ceiling2.connect(limiter); limiter.connect(trim); trim.connect(guard);
    this.output = guard;

    this.buildTexture();
    this.env = new Environment(ctx, this.sum, { seed: this.seed + 17 });
    this.setRoom(DEFAULTS.room, true);
  }

  // ---------- listener controls (all ramped) ----------
  setBreath(knob) { this.state.breath = Math.max(4, Math.min(20, knob)); this.reschedule(); }
  setLight(v, immediate = false) {
    this.state.light = v; this.cutoff = lightToCutoff(v);
    const t = this.ctx.currentTime; this.tilt.frequency.cancelScheduledValues(t); this.tilt.frequency.setTargetAtTime(this.cutoff, t, immediate ? 0.01 : 0.5);
    this.reschedule();
  }
  setRoom(v, immediate = false) {
    this.state.room = v; const s = Math.max(0, Math.min(100, v)) / 100, t = this.ctx.currentTime, tc = immediate ? 0.01 : 0.6;
    this.roomBase = { send: 0.6 + 0.4 * s, wet: 0.38 + 0.7 * s, dry: 1 - 0.28 * s };
    this.pre.delayTime.setTargetAtTime(0.018 + 0.02 * s, t, tc);
    this.dry.gain.setTargetAtTime(this.roomBase.dry, t, tc);
    this.send.gain.setTargetAtTime(this.roomBase.send, t, tc); this.wet.gain.setTargetAtTime(this.roomBase.wet, t, tc);
    this.reschedule();
  }
  setOffsetCap(cap) { this.core.setOffsetCap(cap); this.applyNeighbour(); }
  // presence exists so 55–110 Hz reads on small speakers; on mid and high carriers it is the edge itself, so it fades with the carrier
  setPresence(a) { this.presenceBase = a; this.applyPresence(); }
  applyPresence() {
    const fc = this.carrier || this.carrierNow();
    const factor = Math.max(0.06, Math.min(1, Math.pow(110 / fc, 1.6)));
    this.core.setPresence((this.presenceBase ?? 0.35) * factor);
  }
  setWeather(w) { this.weatherOverride = w; }               // the hook: {density, turbulence, brightness, grain} or null
  setEnvironment(on) { this.env.setEnabled(on); }
  get breathPeriod() { return this.lean.breathPeriod * this.state.breath / 10; }

  // ---------- the moment: what the clock and the sun say ----------
  // m: { hourF, riseH, setH, month, hour, jieqi }
  setMoment(m, force = false) {
    const changed = force || m.hour !== this.moment.hour || m.month !== this.moment.month;
    this.moment = { ...this.moment, ...m };
    this.lean = leanOf(this.moment);
    if (!this.weatherOverride) this.weather = defaultWeather(this.lean, this.moment);
    if (changed) {
      this.core.update(this.moment.month, this.moment.hour, true);
      this.applyNeighbour();
      this.retuneTexture();
      this.applyPresence();
    }
    this.refreshRoom();
  }

  // ---------- the room follows the sun: regenerate the IR when the lean moves, crossfade over 4 s ----------
  refreshRoom(first = false) {
    const size = Math.round(this.lean.roomSize * 4) / 4, bright = Math.round(this.lean.roomBright / 250) * 250, key = size + "/" + bright;
    if (key === this.roomKey) return; const firstRoom = !this.roomKey; this.roomKey = key;
    const ir = makeRoomIR(this.ctx, size, bright, this.seed + 11 + Math.round(size * 4));
    const t = this.ctx.currentTime;
    if (firstRoom) { this.convA.buffer = ir; this.convAg.gain.value = 1; return; }
    const toB = this.convUse === "A"; const inConv = toB ? this.convB : this.convA, outConv = toB ? this.convA : this.convB, inG = toB ? this.convBg : this.convAg, outG = toB ? this.convAg : this.convBg;
    inConv.buffer = ir; inG.gain.setTargetAtTime(1, t, 1.5); outG.gain.setTargetAtTime(0, t, 1.5); this.convUse = toB ? "B" : "A";
    // once the crossfade is over, the old room stops working (a silent convolver still costs CPU)
    clearTimeout(this.roomRelease); if (!this.offline) this.roomRelease = setTimeout(() => { try { outConv.buffer = null; } catch (_) {} }, 8000);
  }

  // ---------- texture: unison drift, air bed, answering voice ----------
  carrierNow() { const row = ICHING[this.moment.hour] ?? ICHING[0]; return row[0] * (SEASON_OCT[this.moment.month] ?? 1); }
  chordNow() { const oct = SEASON_OCT[this.moment.month] ?? 1; return (DAY_CHORD[Math.floor(this.moment.hour / 6)] ?? DAY_CHORD[0]).map(f => f * oct); }
  buildTexture() {
    const ctx = this.ctx, fc = this.carrierNow(), chord = this.chordNow();
    this.unison = [-1, 1].map((side, i) => {
      const osc = ctx.createOscillator(); osc.type = "sine"; osc.frequency.value = fc;
      const drift = ctx.createOscillator(); drift.frequency.value = 0.011 + 0.007 * i;
      const driftAmt = ctx.createGain(); driftAmt.gain.value = fc * 0.0045;
      const det = ctx.createConstantSource(); det.offset.value = fc * 0.003 * side;
      drift.connect(driftAmt); driftAmt.connect(osc.frequency); det.connect(osc.frequency);
      const g = ctx.createGain(); g.gain.value = 0.15; const pan = ctx.createStereoPanner(); pan.pan.value = 0.45 * side;
      osc.connect(g); g.connect(pan); pan.connect(this.sum); osc.start(0); drift.start(0); det.start(0);
      return { osc, driftAmt, det, g, side };
    });
    // air bed: pinkish noise resonant at the day chord's upper octaves
    const n = ctx.sampleRate * 4, nb = ctx.createBuffer(1, n, ctx.sampleRate), d = nb.getChannelData(0), r = rng(this.seed + 5);
    let p0 = 0, p1 = 0; for (let i = 0; i < n; i++) { const w = r() * 2 - 1; p0 = 0.997 * p0 + 0.003 * w; p1 = 0.95 * p1 + 0.05 * w; d[i] = (w * 0.35 + p1 * 1.2 + p0 * 6) * 0.3; }
    const noise = ctx.createBufferSource(); noise.buffer = nb; noise.loop = true;
    this.air = ctx.createGain(); this.air.gain.value = this.lean.airLevel;
    this.airBp = chord.map((f, i) => { const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 9; const pan = ctx.createStereoPanner(); pan.pan.value = [-0.5, 0.1, 0.55][i]; noise.connect(bp); bp.connect(pan); pan.connect(this.air); return bp; });
    const airHp = ctx.createBiquadFilter(); airHp.type = "highpass"; airHp.frequency.value = 180; this.air.connect(airHp); airHp.connect(this.sum); noise.start(0);
    // the answering voice
    this.ans = ctx.createOscillator(); this.ans.type = "triangle"; this.ans.frequency.value = chord[1] * 2;
    this.ansLp = ctx.createBiquadFilter(); this.ansLp.type = "lowpass"; this.ansLp.Q.value = 0.6;
    this.ansEnv = ctx.createGain(); this.ansEnv.gain.value = 0; const ansPan = ctx.createStereoPanner(); ansPan.pan.value = -0.2;
    this.ans.connect(this.ansLp); this.ansLp.connect(this.ansEnv); this.ansEnv.connect(ansPan); ansPan.connect(this.sum); this.ans.start(0);
    this.retuneTexture(true);
  }
  retuneTexture(immediate = false) {
    const t = this.ctx.currentTime, tc = immediate ? 0.01 : 1.3, fc = this.carrierNow(), chord = this.chordNow(), mult = fc < 100 ? 8 : 4;
    this.unison.forEach(u => { u.osc.frequency.setTargetAtTime(fc, t, tc); u.driftAmt.gain.setTargetAtTime(fc * 0.0045, t, tc); u.det.offset.setTargetAtTime(fc * 0.003 * u.side, t, tc); });
    this.airBp.forEach((bp, i) => bp.frequency.setTargetAtTime(chord[i] * mult, t, tc));
    this.ansLp.frequency.setTargetAtTime(Math.max(400, fc * 6), t, tc);
    this.chord = chord; this.carrier = fc;
    if (this.env) this.env.tune(chord, fc);
  }
  // a neighbour voice holds a common tone quietly beneath the lead (counterpoint, not a pad)
  applyNeighbour() {
    const h = this.moment.hour, q = quadrantOf(h), lead = q - 1, nb = (lead + 3) % 4;   // the previous quadrant's voice
    const oct = SEASON_OCT[this.moment.month] ?? 1, fc = this.carrierNow(), chord = this.chordNow();
    // the chord tone nearest to one octave below the carrier (never the carrier itself)
    let best = chord[0], bestD = 1e9; chord.forEach(f => { let g = f; while (g * 2 < fc) g *= 2; while (g > fc) g /= 2; if (Math.abs(g - fc) < 1) return; const d = Math.abs(Math.log(g / fc) + Math.LN2); if (d < bestD) { bestD = d; best = g; } });
    const v = this.core.voices[nb], t = this.ctx.currentTime;
    v.setHour(best / oct, 0.1, 0, 0, oct); v.setActive(true);
    v.enable.gain.setTargetAtTime(0.38, t + 0.01, 1.0);
    this.core.voices.forEach((o, i) => { if (i !== lead && i !== nb) o.setActive(false); });
  }

  // ---------- the breath clock ----------
  start() { if (this.timer) return; this.nextT = this.ctx.currentTime + 0.1; this.tick(); this.timer = setInterval(() => this.tick(), 1000); }
  stop() { clearInterval(this.timer); this.timer = null; }
  tick() { const horizon = this.ctx.currentTime + 12; while (this.nextT < horizon) this.planOne(); this.planned = this.planned.filter(b => b.t3 > this.ctx.currentTime - 1); }
  scheduleAll(T) { this.nextT = 0.05; while (this.nextT < T + 20) this.planOne(); }
  planOne() {
    this.walk = Math.max(-0.08, Math.min(0.08, this.walk + (this.r() - 0.5) * 0.04));
    const b = nextBreath(this.nextT, this.breathPeriod, this.r, this.walk);
    b.index = this.breathIndex++; const lean = this.lean;
    b.rest = lean.restEvery ? (b.index % lean.restEvery === lean.restEvery - 1) : false;
    b.weather = this.weatherOverride || this.weather;
    b.lean = lean;
    this.chooseAnswer(b);
    this.env.plan(b, this.moment, lean, b.weather);
    this.planned.push(b); this.applyBreath(b); this.nextT = b.t3;
  }
  chooseAnswer(b) {
    if (b.rest) { b.answer = null; return; }
    this.held = (this.held + 1) % 3; let tone;
    if (this.held === 0 && this.lastTone >= 0) tone = this.lastTone;
    else { const c = [0, 1, 2].filter(k => k !== this.lastTone); tone = c[Math.floor(this.r() * c.length)]; this.dir = -this.dir; }
    const low = this.carrier < 100, octave = low ? (this.dir > 0 ? 4 : 2) : (this.dir > 0 ? 1 : 0.5);
    b.answer = { f: this.chord[tone] * octave, level: this.lean.answerLevel * (0.7 + 0.5 * this.r()) };
    this.lastTone = tone;
  }
  // everything that breathes, scheduled at absolute times; idempotent per breath
  applyBreath(b) {
    const lean = b.lean, core = this.core, rb = this.roomBase;
    // level: rises through the inhale, settles through the exhale (±1.3 dB), a shade lower when resting
    this.breathGain.gain.setTargetAtTime(b.rest ? 0.86 : 1.0, b.t0, b.inhale / 2.6);
    this.breathGain.gain.setTargetAtTime(b.rest ? 0.62 : 0.78, b.t2, b.exhale / 2.4);
    // the core's own tide and swell ride the same breath (never to zero)
    core.voices.forEach(v => { [v.breathGain.gain, v.breathGainR.gain].forEach(g => { g.setTargetAtTime(1.0, b.t0, b.inhale / 2.4); g.setTargetAtTime(0.82, b.t2, b.exhale / 2.2); }); });
    core.swell.gain.setTargetAtTime(1.0, b.t0, b.inhale / 2.2); core.swell.gain.setTargetAtTime(lean.swellFloor, b.t2, b.exhale / 2.0);
    // light: opens on the inhale, closes on the exhale; brightness from the weather hook
    const c = this.cutoff * (0.85 + 0.3 * b.weather.brightness);
    this.tilt.frequency.setTargetAtTime(c * 1.4, b.t0, b.inhale / 2.2); this.tilt.frequency.setTargetAtTime(c * 0.75, b.t2, b.exhale / 2.0);
    // the room takes in on the inhale, lets out on the exhale
    this.send.gain.setTargetAtTime(rb.send * 1.25, b.t0, b.inhale / 2.5); this.send.gain.setTargetAtTime(rb.send * 0.85, b.t2, b.exhale / 2.5);
    this.wet.gain.setTargetAtTime(rb.wet * 0.9, b.t0, b.inhale / 2.5); this.wet.gain.setTargetAtTime(rb.wet * 1.15, b.t2, b.exhale / 2.0);
    this.air.gain.setTargetAtTime(lean.airLevel * 1.6, b.t0, b.inhale / 2); this.air.gain.setTargetAtTime(lean.airLevel * 0.5, b.t2, b.exhale / 2);
    // a rest: the core sinks to near silence across the exhale and returns on the next inhale (the room tone stays)
    if (b.rest) {
      this.coreGain.gain.setTargetAtTime(0.18, b.t2, b.exhale / 2.2); this.coreGain.gain.setTargetAtTime(1.0, b.t3, b.inhale / 2.0);
      this.unison.forEach(u => { u.g.gain.setTargetAtTime(0.03, b.t2, b.exhale / 2.2); u.g.gain.setTargetAtTime(0.15, b.t3, b.inhale / 2); });
    }
    // the answering voice enters on the exhale, lets go through the next inhale
    if (b.answer) {
      this.ans.frequency.setTargetAtTime(b.answer.f, b.t2 - 0.4, 0.3);
      this.ansEnv.gain.setTargetAtTime(b.answer.level, b.t2, b.exhale * 0.32);
      this.ansEnv.gain.setTargetAtTime(0, b.t3 + 0.2, b.inhale * 0.45);
    }
    this.env.apply(b);
  }
  // a knob moved: re-apply the planned breaths that haven't started yet with the new values
  reschedule() {
    const now = this.ctx.currentTime + 0.05, future = this.planned.filter(b => b.t0 > now); if (!future.length) return;
    [this.breathGain.gain, this.send.gain, this.wet.gain, this.air.gain, this.tilt.frequency].forEach(p => p.cancelScheduledValues(now));
    future.forEach(b => this.applyBreath(b));
  }
}

// ---- WAV writer ----
export function audioBufferToWav(buf) {
  const ch = buf.numberOfChannels, len = buf.length, sr = buf.sampleRate, b = new ArrayBuffer(44 + len * ch * 2), v = new DataView(b);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, "RIFF"); v.setUint32(4, 36 + len * ch * 2, true); w(8, "WAVE"); w(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, ch, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * ch * 2, true); v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true); w(36, "data"); v.setUint32(40, len * ch * 2, true);
  const d = []; for (let c = 0; c < ch; c++) d.push(buf.getChannelData(c)); let o = 44;
  for (let i = 0; i < len; i++) for (let c = 0; c < ch; c++) { const s = Math.max(-1, Math.min(1, d[c][i])); v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7FFF, true); o += 2; }
  return new Blob([b], { type: "audio/wav" });
}
