// engine.js — OceanMountain PHRASE 1, ported natively to Web Audio
const ICHING = [
  [110.0, 0.1, 0, 0], [110.0, 0.1, 0, 0], [165.0, 0.1, 0, 0], [165.0, 0.15, 0, 0],
  [110.0, 0.1, 0, 0], [220.0, 0.3, 0, 1], [220.0, 0.4, 0, 1], [275.0, 0.5, 1, 1],
  [330.0, 0.5, 1, 1], [330.0, 0.6, 1, 1], [275.0, 0.4, 1, 1], [440.0, 0.8, 1, 1],
  [440.0, 1.0, 1, 1], [550.0, 1.2, 1, 1], [550.0, 1.0, 1, 1], [440.0, 0.9, 1, 1],
  [440.0, 0.7, 1, 1], [165.0, 0.4, 1, 1], [165.0, 0.3, 0, 1], [110.0, 0.3, 0, 1],
  [110.0, 0.2, 0, 1], [165.0, 0.2, 0, 0], [110.0, 0.15, 0, 0], [110.0, 0.1, 0, 0]
];
const SEASON_OCT = { 1: 0.5, 2: 0.5, 3: 1.0, 4: 1.0, 5: 1.0, 6: 2.0, 7: 2.0, 8: 2.0, 9: 1.0, 10: 1.0, 11: 1.0, 12: 0.5 };
const DAY_CHORD = [[110.0, 123.47, 164.81], [110.0, 138.59, 155.56], [110.0, 138.59, 196.00], [110.0, 130.81, 146.83]];

function quadrantOf(h) {
  if (h >= 5 && h <= 10) return 1;
  if (h >= 11 && h <= 16) return 2;
  if (h >= 17 && h <= 22) return 3;
  return 4;
}

function makeTanhCurve(n = 2048) {
  const c = new Float32Array(n);
  for (let i = 0; i < n; i++) { c[i] = Math.tanh(((i / (n - 1)) * 2 - 1)); }
  return c;
}

function makeClipCurve(n = 2048) {
  const c = new Float32Array(n);
  for (let i = 0; i < n; i++) { c[i] = Math.max(-1, Math.min(1, ((i / (n - 1)) * 2 - 1))); }
  return c;
}

class FMVoice {
  constructor(ctx, destL, destR) {
    this.ctx = ctx;
    const t = ctx.currentTime;
    this.oscL = ctx.createOscillator(); this.oscR = ctx.createOscillator();
    this.modOsc = ctx.createOscillator(); this.modGain = ctx.createGain();
    this.env = ctx.createGain(); this.envR = ctx.createGain();
    this.enable = ctx.createGain(); this.enableR = ctx.createGain();
    this.active = false;
    this.oscL.connect(this.env); this.env.connect(this.enable);
    this.oscR.connect(this.envR); this.envR.connect(this.enableR);
    const trimL = ctx.createGain(); trimL.gain.value = 0.2;
    const trimR = ctx.createGain(); trimR.gain.value = 0.2;
    this.enable.connect(trimL); trimL.connect(destL);
    this.enableR.connect(trimR); trimR.connect(destR);
    this.modOsc.connect(this.modGain); this.modGain.connect(this.oscL.frequency); this.modGain.connect(this.oscR.frequency);
    this.oscL.start(t); this.oscR.start(t); this.modOsc.start(t);
  }
  setHour(carrier, offset, fmBit, envBit, oct) {
    const t = this.ctx.currentTime;
    const fc = carrier * oct;
    this.oscL.frequency.setTargetAtTime(fc, t, 0.1);
    this.oscR.frequency.setTargetAtTime(fc + offset, t, 0.1);
    this.modOsc.frequency.setTargetAtTime(fc * 0.5, t, 0.1);
    this.modGain.gain.setTargetAtTime(fmBit ? 0.4 * fc : 0, t, 0.1);
    this.attack = envBit ? 0.05 : 2.0;
  }
  setActive(on) {
    this.active = on;
    const t = this.ctx.currentTime;
    [this.enable.gain, this.enableR.gain].forEach(g => g.setTargetAtTime(on ? 1 : 0, t, 1.0));
    if (on) [this.env.gain, this.envR.gain].forEach(g => g.setTargetAtTime(0.7, t, this.attack / 3));
  }
}

export class CircadianEngine {
  constructor(ctx) {
    this.ctx = ctx;
    this.offsetCap = 1000;
    this.timeBusL = ctx.createGain(); this.timeBusR = ctx.createGain();
    this.output = ctx.createChannelMerger(2);
    this.voices = [new FMVoice(ctx, this.timeBusL, this.timeBusR), new FMVoice(ctx, this.timeBusL, this.timeBusR), new FMVoice(ctx, this.timeBusL, this.timeBusR), new FMVoice(ctx, this.timeBusL, this.timeBusR)];
    this.droneOscs = [0,1,2].map(() => { const o = ctx.createOscillator(); o.start(); return o; });
    this.droneOscs.forEach(o => o.connect(ctx.createGain()));
  }
  update(m, h) {
    const oct = SEASON_OCT[m] ?? 1.0;
    const [c, off, fm, env] = ICHING[h];
    this.voices.forEach((v, i) => { v.setActive(i === quadrantOf(h)-1); if(i === quadrantOf(h)-1) v.setHour(c, Math.min(off, this.offsetCap), fm, env, oct); });
  }
  setOffsetCap(c) { this.offsetCap = c; }
}
