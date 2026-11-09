// engine.js — OceanMountain PHRASE 1, native Web Audio port
// v6 — gain staging: low-band presence partials, 32 Hz subsonic HP, makeup + gentle compressor.
// v5 — Phase 3A: de-sharpened FM, slower envelopes, per-voice tidal breathing,
// darker master warmth. Architecture unchanged: 4 FM voices + drone,
// tanh saturation + 350/525ms cross-feedback delay + clip.

// ---------- DATA (from PHRASE_1.maxpat) ----------
const ICHING = [
  [110.0, 0.1, 0, 0], [110.0, 0.1, 0, 0], [165.0, 0.1, 0, 0], [165.0, 0.15, 0, 0],
  [110.0, 0.1, 0, 0], [220.0, 0.3, 0, 1], [220.0, 0.4, 0, 1], [275.0, 0.5, 1, 1],
  [330.0, 0.5, 1, 1], [330.0, 0.6, 1, 1], [275.0, 0.4, 1, 1], [440.0, 0.8, 1, 1],
  [440.0, 1.0, 1, 1], [550.0, 1.2, 1, 1], [550.0, 1.0, 1, 1], [440.0, 0.9, 1, 1],
  [440.0, 0.7, 1, 1], [165.0, 0.4, 1, 1], [165.0, 0.3, 0, 1], [110.0, 0.3, 0, 1],
  [110.0, 0.2, 0, 1], [165.0, 0.2, 0, 0], [110.0, 0.15, 0, 0], [110.0, 0.1, 0, 0]
];

const SEASON_OCT = { 1: 0.5, 2: 0.5, 3: 1.0, 4: 1.0, 5: 1.0, 6: 2.0,
                     7: 2.0, 8: 2.0, 9: 1.0, 10: 1.0, 11: 1.0, 12: 0.5 };

const DAY_CHORD = [
  [110.0, 123.47, 164.81],
  [110.0, 138.59, 155.56],
  [110.0, 138.59, 196.00],
  [110.0, 130.81, 146.83]
];

function quadrantOf(h) {
  if (h >= 5 && h <= 10) return 1;
  if (h >= 11 && h <= 16) return 2;
  if (h >= 17 && h <= 22) return 3;
  return 4;
}

function makeTanhCurve(n = 2048) {
  const c = new Float32Array(n);
  for (let i = 0; i < n; i++) c[i] = Math.tanh((i / (n - 1)) * 2 - 1);
  return c;
}

function makeClipCurve(n = 2048) {
  const c = new Float32Array(n);
  for (let i = 0; i < n; i++) c[i] = Math.max(-1, Math.min(1, (i / (n - 1)) * 2 - 1));
  return c;
}

// asymmetric soft curve: adds gentle 2nd/3rd harmonics so low tones read on small speakers
function makePresenceCurve(n = 2048, bias = 0.35) {
  const c = new Float32Array(n), off = Math.tanh(bias), norm = Math.tanh(1 + bias) - off;
  for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; c[i] = (Math.tanh(x + bias) - off) / norm; }
  return c;
}

function makeNegCosWave(ctx) {
  return ctx.createPeriodicWave(
    new Float32Array([0, -1]), new Float32Array([0, 0])
  );
}

const GLIDE_TC = 1.3;        // seconds (time constant) — ~4s perceived glide
const XFADE_TC = 1.0;        // seconds — quadrant crossfade
const FM_BETA = 0.18 * 2 * Math.PI;   // de-sharpened (was 0.4 cycles)
const ENV_PEAK = 0.5;        // envelope sustain target (was 0.7)

// ---------- one FM time-engine voice ----------
class FMVoice {
  constructor(ctx, destL, destR, breathRate) {
    this.ctx = ctx;
    this.active = false;
    this.attack = 3.2;                 // ALWAYS defined before any trigger

    this.oscL = ctx.createOscillator();
    this.oscR = ctx.createOscillator();
    this.oscL.frequency.value = 0;
    this.oscR.frequency.value = 0;

    this.modOsc = ctx.createOscillator();
    this.modOsc.frequency.value = 0;
    this.modGain = ctx.createGain();
    this.modGain.gain.value = 0;
    this.modOsc.connect(this.modGain);
    this.modGain.connect(this.oscL.frequency);
    this.modGain.connect(this.oscR.frequency);

    this.env  = ctx.createGain(); this.env.gain.value = 0;
    this.envR = ctx.createGain(); this.envR.gain.value = 0;
    this.enable  = ctx.createGain(); this.enable.gain.value = 0;
    this.enableR = ctx.createGain(); this.enableR.gain.value = 0;

    // warm sub-octave layer (pad body under the carrier)
    this.subOsc = ctx.createOscillator();
    this.subOsc.frequency.value = 0;
    this.subGain = ctx.createGain();
    this.subGain.gain.value = 0.25;
    this.subOsc.connect(this.subGain);
    this.subGain.connect(this.env);
    this.subGain.connect(this.envR);

    // tidal breathing stage: env -> enable -> breathGain -> trim -> bus
    this.breathGain  = ctx.createGain(); this.breathGain.gain.value = 0;
    this.breathGainR = ctx.createGain(); this.breathGainR.gain.value = 0;
    const breathLfo = ctx.createOscillator();
    breathLfo.frequency.value = breathRate;      // 0.04–0.065 Hz per voice
    const breathDepth = ctx.createGain(); breathDepth.gain.value = 0.11;
    const breathBase = ctx.createConstantSource(); breathBase.offset.value = 0.9;
    breathLfo.connect(breathDepth);
    breathDepth.connect(this.breathGain.gain);
    breathDepth.connect(this.breathGainR.gain);
    breathBase.connect(this.breathGain.gain);
    breathBase.connect(this.breathGainR.gain);

    const trimL = ctx.createGain(); trimL.gain.value = 0.2;
    const trimR = ctx.createGain(); trimR.gain.value = 0.2;

    this.oscL.connect(this.env);   this.env.connect(this.enable);
    this.enable.connect(this.breathGain);
    this.breathGain.connect(trimL); trimL.connect(destL);

    this.oscR.connect(this.envR);  this.envR.connect(this.enableR);
    this.enableR.connect(this.breathGainR);
    this.breathGainR.connect(trimR); trimR.connect(destR);

    const t = ctx.currentTime;
    this.oscL.start(t);
    this.oscR.start(t);
    this.modOsc.start(t);
    this.subOsc.start(t);
    breathLfo.start(t);
    breathBase.start(t);
  }

  setHour(carrier, offset, fmBit, envBit, oct) {
    const t = this.ctx.currentTime;
    const fc = carrier * oct;
    const fmFreq = fc * 0.5;
    const dev = fmBit ? Math.min(FM_BETA * fmFreq, fc * 0.9) : 0;

    this.oscL.frequency.setTargetAtTime(fc, t, GLIDE_TC);
    this.oscR.frequency.setTargetAtTime(fc + offset, t, GLIDE_TC);
    this.modOsc.frequency.setTargetAtTime(fmFreq, t, GLIDE_TC);
    this.modGain.gain.setTargetAtTime(dev, t, GLIDE_TC);
    this.subOsc.frequency.setTargetAtTime(fc * 0.5, t, GLIDE_TC);

    this.attack = envBit ? 0.45 : 3.2;
    if (this.active) this.triggerEnv();
  }

  triggerEnv() {
    const t = this.ctx.currentTime;
    const tc = Math.max(this.attack / 3, 0.01);   // never 0 / NaN
    [this.env.gain, this.envR.gain].forEach(g => {
      g.cancelScheduledValues(t);
      g.setTargetAtTime(ENV_PEAK, t, tc);
    });
  }

  setActive(on) {
    if (on === this.active) return;
    this.active = on;
    const t = this.ctx.currentTime;
    [this.enable.gain, this.enableR.gain].forEach(g => {
      g.cancelScheduledValues(t);
      g.setTargetAtTime(on ? 1 : 0, t, XFADE_TC);
    });
    if (on) this.triggerEnv();
  }
}

// ---------- the full engine ----------
export class CircadianEngine {
  constructor(ctx) {
    this.ctx = ctx;
    this.offsetCap = 1000;
    this.lastHour = -1;
    this.lastMonth = -1;

    // ===== MASTER MIXER =====
    this.timeBusL = ctx.createGain();
    this.timeBusR = ctx.createGain();

    this.droneBusL = ctx.createGain();
    this.droneBusR = ctx.createGain();
    const attL = ctx.createGain(); attL.gain.value = 0.2;
    const attR = ctx.createGain(); attR.gain.value = 0.2;
    const lpL = ctx.createBiquadFilter(); lpL.type = "lowpass"; lpL.frequency.value = 140; lpL.Q.value = 0.0001;
    const lpR = ctx.createBiquadFilter(); lpR.type = "lowpass"; lpR.frequency.value = 140; lpR.Q.value = 0.0001;
    this.droneBusL.connect(attL); attL.connect(lpL);
    this.droneBusR.connect(attR); attR.connect(lpR);

    const sumFXL = ctx.createGain();
    const sumFXR = ctx.createGain();
    this.timeBusL.connect(sumFXL); lpL.connect(sumFXL);
    this.timeBusR.connect(sumFXR); lpR.connect(sumFXR);

    const tanhL = ctx.createWaveShaper(); tanhL.curve = makeTanhCurve(); tanhL.oversample = "2x";
    const tanhR = ctx.createWaveShaper(); tanhR.curve = makeTanhCurve(); tanhR.oversample = "2x";
    sumFXL.connect(tanhL);
    sumFXR.connect(tanhR);

    const delL = ctx.createDelay(1.0); delL.delayTime.value = 0.350;
    const delR = ctx.createDelay(1.0); delR.delayTime.value = 0.525;
    const xLR = ctx.createGain(); xLR.gain.value = 0.4;
    const xRL = ctx.createGain(); xRL.gain.value = 0.4;
    tanhL.connect(delL);
    tanhR.connect(delR);
    delL.connect(xLR); xLR.connect(delR);
    delR.connect(xRL); xRL.connect(delL);
    const wetL = ctx.createGain(); wetL.gain.value = 0.35;
    const wetR = ctx.createGain(); wetR.gain.value = 0.35;
    delL.connect(wetL);
    delR.connect(wetR);

    const dwL = ctx.createGain();
    const dwR = ctx.createGain();
    tanhL.connect(dwL); wetL.connect(dwL);
    tanhR.connect(dwR); wetR.connect(dwR);
    const clipL = ctx.createWaveShaper(); clipL.curve = makeClipCurve();
    const clipR = ctx.createWaveShaper(); clipR.curve = makeClipCurve();
    const warmL = ctx.createBiquadFilter(); warmL.type = "lowpass"; warmL.frequency.value = 2000; warmL.Q.value = 0.35;
    const warmR = ctx.createBiquadFilter(); warmR.type = "lowpass"; warmR.frequency.value = 2000; warmR.Q.value = 0.35;
    dwL.connect(warmL); warmL.connect(clipL);
    dwR.connect(warmR); warmR.connect(clipR);
    // ===== PRESENCE (v6): harmonics of the low tones, high-passed, mixed in parallel =====
    // The composition stays untouched; this only makes 55–110 Hz fundamentals
    // perceptible on laptop / phone speakers via their upper partials.
    const presence = (src, dest) => {
      const lo1 = ctx.createBiquadFilter(); lo1.type = "lowpass"; lo1.frequency.value = 180; lo1.Q.value = 0.707;
      const lo2 = ctx.createBiquadFilter(); lo2.type = "lowpass"; lo2.frequency.value = 180; lo2.Q.value = 0.707;
      const drive = ctx.createGain(); drive.gain.value = 9.0;
      const shaper = ctx.createWaveShaper(); shaper.curve = makePresenceCurve(); shaper.oversample = "2x";
      const hp1 = ctx.createBiquadFilter(); hp1.type = "highpass"; hp1.frequency.value = 210; hp1.Q.value = 0.707;
      const hp2 = ctx.createBiquadFilter(); hp2.type = "highpass"; hp2.frequency.value = 210; hp2.Q.value = 0.707;
      const lp  = ctx.createBiquadFilter(); lp.type = "lowpass";  lp.frequency.value = 1800; lp.Q.value = 0.5;
      const amt = ctx.createGain(); amt.gain.value = 0;
      src.connect(lo1); lo1.connect(lo2); lo2.connect(drive); drive.connect(shaper); shaper.connect(hp1); hp1.connect(hp2); hp2.connect(lp); lp.connect(amt); amt.connect(dest);
      return amt;
    };
    this.presenceL = presence(dwL, clipL);
    this.presenceR = presence(dwR, clipR);

    const merger = ctx.createChannelMerger(2);
    clipL.connect(merger, 0, 0);
    clipR.connect(merger, 0, 1);

    // ===== MASTER (v6): subsonic clean-up, makeup gain, gentle peak control =====
    const subHP = ctx.createBiquadFilter(); subHP.type = "highpass"; subHP.frequency.value = 32; subHP.Q.value = 0.707;
    this.makeup = ctx.createGain(); this.makeup.gain.value = 1.4;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 8; comp.ratio.value = 3;
    comp.attack.value = 0.01; comp.release.value = 0.35;
    merger.connect(subHP); subHP.connect(this.makeup); this.makeup.connect(comp);
    this.output = comp;
    this.setPresence(0.35);

    // ===== FOUR TIME ENGINES (each with its own tidal breath rate) =====
    this.voices = [
      new FMVoice(ctx, this.timeBusL, this.timeBusR, 0.040),
      new FMVoice(ctx, this.timeBusL, this.timeBusR, 0.052),
      new FMVoice(ctx, this.timeBusL, this.timeBusR, 0.065),
      new FMVoice(ctx, this.timeBusL, this.timeBusR, 0.046)
    ];

    // ===== DRONE =====
    this.droneOscs = [0, 1, 2].map(() => {
      const o = ctx.createOscillator();
      o.frequency.value = 0;
      return o;
    });
    const droneSum = ctx.createGain();
    this.droneOscs.forEach(o => o.connect(droneSum));

    this.swell = ctx.createGain(); this.swell.gain.value = 0;
    const lfo = ctx.createOscillator();
    lfo.setPeriodicWave(makeNegCosWave(ctx));
    lfo.frequency.value = 0.05;
    const lfoDepth = ctx.createGain(); lfoDepth.gain.value = 0.5;
    const lfoOffset = ctx.createConstantSource(); lfoOffset.offset.value = 0.5;
    lfo.connect(lfoDepth);
    lfoDepth.connect(this.swell.gain);
    lfoOffset.connect(this.swell.gain);
    const droneTrim = ctx.createGain(); droneTrim.gain.value = 0.12;
    droneSum.connect(this.swell);
    this.swell.connect(droneTrim);
    droneTrim.connect(this.droneBusL);
    droneTrim.connect(this.droneBusR);

    const t = ctx.currentTime;
    this.droneOscs.forEach(o => o.start(t));
    lfo.start(t);
    lfoOffset.start(t);
  }

  // presence of upper partials (0 = off); speaker mode uses more
  setPresence(amount) {
    const t = this.ctx.currentTime;
    [this.presenceL.gain, this.presenceR.gain].forEach(g => g.setTargetAtTime(amount, t, 0.4));
  }

  setOffsetCap(cap) {
    this.offsetCap = cap;
    if (this.lastHour >= 0) this.update(this.lastMonth, this.lastHour, true);
  }

  update(month, hour, force = false) {
    if (!force && month === this.lastMonth && hour === this.lastHour) return;
    this.lastMonth = month;
    this.lastHour = hour;

    const oct = SEASON_OCT[month] ?? 1.0;
    const row = ICHING[hour] ?? ICHING[0];
    const [carrier, rawOffset, fmBit, envBit] = row;
    const offset = Math.min(rawOffset, this.offsetCap);
    const quad = quadrantOf(hour);

    this.voices.forEach((v, i) => {
      if (i === quad - 1) {
        v.setHour(carrier, offset, fmBit, envBit, oct);
        v.setActive(true);
      } else {
        v.setActive(false);
      }
    });

    const chord = DAY_CHORD[Math.floor(hour / 6)] ?? DAY_CHORD[0];
    const t = this.ctx.currentTime;
    this.droneOscs.forEach((o, i) => {
      o.frequency.setTargetAtTime(chord[i] * oct, t, GLIDE_TC);
    });
  }
}
