// env.js — the environment: a few elements with a reason.
//
// Each element is musical material, not a loop: filtered or resonated toward the day chord,
// phrased by the breath, sent through the same room, entering and leaving by rule, never
// louder than the voices. One or two elements sound at a time; the room tone is the floor.
//
// The grammar (what exists · what it is tied to · what it does · its register):
//   wind       autumn/winter 節氣, dusk and night, weather.turbulence     bed       R3 (R1: hour, 節氣)
//   rain       雨水 穀雨 小滿 芒種 小暑 大暑 (+清明), weather.grain         bed/grain R3 (R2: the term names)
//   water      雨水 白露 寒露 霜降; near sunrise and sunset                  bed       R3 (R1: sun)
//   insects    驚蟄 → 白露, evenings (戌 亥), summer most                  answer    R3 (R2: 驚蟄 as the waking)
//   birds      the hour of sunrise (卯), 春分 → 夏至 most                   gesture   R1 (sunrise) + R3
//   city       the working day (辰 → 酉) only, weather.density              bed       R3
//   room tone  always; deeper at night                                      floor     R3 — so a rest is a room, not a dead signal
//
// Sources: synthesized here so the page works with no files; field recordings in /circadian/field/
// replace them element by element when a manifest lists them (see field/README.md).

const rng = seed => { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
const clamp01 = x => Math.max(0, Math.min(1, x));
const near = (h, c, w) => Math.exp(-((((h - c + 12) % 24 + 24) % 24 - 12) ** 2) / (2 * w * w));

function noiseBuffer(ctx, seconds, kind, seed) {
  const n = Math.floor(ctx.sampleRate * seconds), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0), r = rng(seed);
  let p0 = 0, p1 = 0, br = 0;
  for (let i = 0; i < n; i++) {
    const w = r() * 2 - 1;
    if (kind === "white") d[i] = w * 0.5;
    else if (kind === "brown") { br = Math.max(-1, Math.min(1, br + w * 0.02)); d[i] = br * 0.9; }
    else { p0 = 0.997 * p0 + 0.003 * w; p1 = 0.95 * p1 + 0.05 * w; d[i] = (w * 0.35 + p1 * 1.2 + p0 * 6) * 0.3; }
  }
  return b;
}
function looped(ctx, buf) { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.start(0); return s; }

// ---------- the elements ----------
export const GRAMMAR = [
  { id: "wind", zh: "風", en: "wind", role: "bed", maxLevel: 0.14,
    affinity: (m, l, w) => { const j = m.jieqi; const season = (j >= 16 || j === 0) ? 0.7 : (j <= 5 ? 0.4 : 0.2); return season * (0.4 + 0.6 * w.turbulence) * (l.night ? 0.85 : 0.6); } },
  { id: "rain", zh: "雨", en: "rain", role: "bed", maxLevel: 0.10,
    affinity: (m, l, w) => { const j = m.jieqi; const term = [1, 5, 7, 8, 10, 11].includes(j) ? 0.7 : (j === 4 ? 0.4 : 0.1); return term * (0.5 + w.grain) * (1 - 0.6 * l.deep); } },
  { id: "water", zh: "水", en: "water", role: "bed", maxLevel: 0.09,
    affinity: (m, l, w) => { const j = m.jieqi; const term = j === 1 ? 0.6 : ([14, 16, 17].includes(j) ? 0.5 : 0.2); return clamp01(term + 0.3 * Math.max(l.dawn, l.dusk)) * (1 - 0.5 * l.deep); } },
  { id: "insects", zh: "蟲", en: "insects", role: "answer", maxLevel: 0.05,
    affinity: (m, l, w) => { const j = m.jieqi; const term = j === 2 ? 0.5 : ((j >= 6 && j <= 13) ? 0.8 : (j === 14 ? 0.4 : 0)); const evening = near(m.hourF, 21, 1.6); return term * (0.15 + 0.85 * evening) * (1 - 0.7 * l.deep); } },
  { id: "birds", zh: "鳥", en: "birds", role: "gesture", maxLevel: 0.07,
    affinity: (m, l, w) => { const j = m.jieqi; const season = (j >= 3 && j <= 9) ? 0.9 : ((j >= 10 && j <= 15) ? 0.5 : 0.3); return season * near(m.hourF, (m.riseH ?? 6.5) + 0.4, 1.3); } },
  { id: "city", zh: "城", en: "far city", role: "bed", maxLevel: 0.06,
    affinity: (m, l, w) => (m.hourF >= 7.5 && m.hourF <= 19) ? 0.45 * w.density * l.day : 0 },
  { id: "room", zh: "室", en: "room tone", role: "floor", maxLevel: 0.02, floor: true,
    affinity: (m, l, w) => l.deep ? 0.5 : (l.night ? 0.75 : 1) }
];

class Element {
  constructor(ctx, def, dest, seed) {
    this.ctx = ctx; this.def = def; this.seed = seed; this.built = false; this.active = false; this.field = null; this.fieldFiles = null; this.loading = false;
    this.out = ctx.createGain(); this.out.gain.value = 0; this.out.connect(dest);
    this.synthGain = ctx.createGain(); this.synthGain.gain.value = 1; this.synthGain.connect(this.out);
    this.fieldGain = ctx.createGain(); this.fieldGain.gain.value = 0; this.fieldGain.connect(this.out);
  }
  build() {
    if (this.built) return; this.built = true;
    const ctx = this.ctx, id = this.def.id, r = rng(this.seed), dest = this.synthGain;
    const bp = (f, q) => { const b = ctx.createBiquadFilter(); b.type = "bandpass"; b.frequency.value = f; b.Q.value = q; return b; };
    const lp = (f, q = 0.7) => { const b = ctx.createBiquadFilter(); b.type = "lowpass"; b.frequency.value = f; b.Q.value = q; return b; };
    const hp = (f) => { const b = ctx.createBiquadFilter(); b.type = "highpass"; b.frequency.value = f; return b; };
    const pan = (p) => { const n = ctx.createStereoPanner(); n.pan.value = p; return n; };
    if (id === "wind") {
      [-0.6, 0.6].forEach((side, i) => {
        const n = looped(ctx, noiseBuffer(ctx, 6 + i, "pink", this.seed + i)), f = bp(380 + 120 * i, 0.9), slow = ctx.createOscillator(), amt = ctx.createGain();
        slow.frequency.value = 0.045 + 0.02 * i; amt.gain.value = 220; slow.connect(amt); amt.connect(f.frequency); slow.start(0);
        n.connect(f); f.connect(pan(side)).connect(dest);
      });
      this.gust = ctx.createGain(); this.gust.gain.value = 1;   // breath-phrased gusts ride on `out`
    } else if (id === "rain") {
      const grain = looped(ctx, noiseBuffer(ctx, 5, "white", this.seed)), h = hp(1800), am = ctx.createGain(); am.gain.value = 0;
      const mod = looped(ctx, noiseBuffer(ctx, 7, "white", this.seed + 3)), modLp = lp(70, 0.5), modAmt = ctx.createGain(); modAmt.gain.value = 1.6; const base = ctx.createConstantSource(); base.offset.value = 0.5; base.start(0);
      mod.connect(modLp); modLp.connect(modAmt); modAmt.connect(am.gain); base.connect(am.gain);
      grain.connect(h); h.connect(am);
      const dryG = ctx.createGain(); dryG.gain.value = 0.45; am.connect(dryG); dryG.connect(lp(7000)).connect(dest);
      this.resonators = [0, 1, 2].map(i => { const b = bp(1000, 12), g = ctx.createGain(); g.gain.value = 0.35; am.connect(b); b.connect(g); g.connect(pan([-0.4, 0.1, 0.5][i])).connect(dest); return b; });
    } else if (id === "water") {
      const n = looped(ctx, noiseBuffer(ctx, 6, "brown", this.seed));
      [[180, 0.07, -0.3], [420, 0.05, 0.35]].forEach(([f0, rate, p]) => { const f = bp(f0, 2), slow = ctx.createOscillator(), amt = ctx.createGain(); slow.frequency.value = rate; amt.gain.value = f0 * 0.4; slow.connect(amt); amt.connect(f.frequency); slow.start(0); n.connect(f); f.connect(pan(p)).connect(dest); });
    } else if (id === "insects") {
      this.chirpers = [-0.5, 0.45].map((p, i) => { const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = 4000; const am = ctx.createGain(); am.gain.value = 0; const lfo = ctx.createOscillator(); lfo.frequency.value = 28 + 14 * i; const la = ctx.createGain(); la.gain.value = 0.5; const base = ctx.createConstantSource(); base.offset.value = 0.5; lfo.connect(la); la.connect(am.gain); base.connect(am.gain); base.start(0); lfo.start(0); const gate = ctx.createGain(); gate.gain.value = 0; o.connect(am); am.connect(gate); gate.connect(lp(6500)).connect(pan(p)).connect(dest); o.start(0); return { o, gate }; });
    } else if (id === "birds") {
      this.birdOut = lp(5200); this.birdOut.connect(dest);
    } else if (id === "city") {
      const n = looped(ctx, noiseBuffer(ctx, 6, "brown", this.seed)); n.connect(lp(160)).connect(dest);
    } else if (id === "room") {
      const n = looped(ctx, noiseBuffer(ctx, 8, "pink", this.seed)); n.connect(lp(500)).connect(dest);
    }
  }
  tune(chord, carrier) {
    if (!this.built) return; const t = this.ctx.currentTime, id = this.def.id;
    if (id === "rain") this.resonators.forEach((b, i) => { let f = chord[i] * 8; while (f < 900) f *= 2; while (f > 3200) f /= 2; b.frequency.setTargetAtTime(f, t, 1.2); });
    if (id === "insects") this.chirpers.forEach((c, i) => { let f = chord[2 - i] * 16; while (f < 3000) f *= 2; while (f > 5400) f /= 2; c.o.frequency.setTargetAtTime(f, t, 1.0); });
    this.chord = chord;
  }
  // level: breath-phrased per element
  apply(b, level) {
    const g = this.out.gain, id = this.def.id;
    if (level <= 0 && !this.active) return;
    if (level > 0 && !this.built) { this.build(); if (this.chord) this.tune(this.chord); }
    this.active = level > 0;
    if (id === "wind") { g.setTargetAtTime(level * (1.0 + 0.5 * (b.weather?.turbulence ?? 0.3)), b.t0, b.inhale / 1.8); g.setTargetAtTime(level * 0.6, b.t2, b.exhale / 1.8); }
    else if (id === "birds") { g.setTargetAtTime(level, b.t0, 1.0); if (level > 0) this.birdCalls(b, level); }
    else if (id === "insects") { g.setTargetAtTime(level, b.t0, b.inhale / 2); if (level > 0) this.chirpPattern(b); }
    else if (id === "rain") { g.setTargetAtTime(level * 0.8, b.t0, b.inhale / 2); g.setTargetAtTime(level, b.t2, b.exhale / 2); }
    else { g.setTargetAtTime(level, b.t0, Math.max(1.5, b.period / 3)); }
    if (level > 0 && this.fieldFiles && !this.field && !this.loading) this.loadField();
  }
  birdCalls(b, level) {
    const ctx = this.ctx, r = rng(this.seed + b.index * 7), calls = 1 + (r() < 0.35 ? 1 : 0), chord = this.chord || [110, 123.47, 164.81];
    for (let c = 0; c < calls; c++) {
      let t = b.t0 + r() * b.inhale * 0.9; const notes = 2 + Math.floor(r() * 3), base = chord[Math.floor(r() * 3)]; let f0 = base * 16; while (f0 < 1800) f0 *= 2; while (f0 > 3600) f0 /= 2;
      for (let k = 0; k < notes; k++) {
        const o = ctx.createOscillator(), g = ctx.createGain(), dur = 0.07 + r() * 0.09, f1 = f0 * (1 + (r() - 0.4) * 0.5), f2 = f1 * (0.75 + r() * 0.5);
        o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.9, t + dur * 0.25); g.gain.setTargetAtTime(0, t + dur * 0.55, dur * 0.18);
        o.connect(g); g.connect(this.birdOut); o.start(t); o.stop(t + dur + 0.25);
        t += dur + 0.04 + r() * 0.12;
      }
    }
  }
  chirpPattern(b) {
    const r = rng(this.seed + b.index * 13 + 1);
    this.chirpers.forEach((c, i) => { let t = b.t0 + r() * 1.5; while (t < b.t3) { const on = 0.8 + r() * 1.8, off = 0.8 + r() * 3.5; c.gate.gain.setTargetAtTime(1, t, 0.15); c.gate.gain.setTargetAtTime(0, t + on, 0.2); t += on + off; } });
  }
  async loadField() {
    this.loading = true;
    try {
      const file = this.fieldFiles[Math.floor(Math.random() * this.fieldFiles.length)];
      const res = await fetch(file); if (!res.ok) throw new Error(res.status);
      const buf = await this.ctx.decodeAudioData(await res.arrayBuffer());
      const src = this.ctx.createBufferSource(); src.buffer = buf; src.loop = true; src.loopStart = 0; src.loopEnd = buf.duration;
      const tone = this.ctx.createBiquadFilter(); tone.type = "lowpass"; tone.frequency.value = 8000;
      src.connect(tone); tone.connect(this.fieldGain); src.start(0);
      const t = this.ctx.currentTime; this.fieldGain.gain.setTargetAtTime(1, t, 3); this.synthGain.gain.setTargetAtTime(0, t, 3);
      this.field = src;
    } catch (e) { this.fieldFiles = null; }
    this.loading = false;
  }
}

export class Environment {
  constructor(ctx, dest, opts = {}) {
    this.ctx = ctx; this.enabled = opts.enabled ?? true; this.seed = opts.seed ?? 1;
    this.bus = ctx.createGain(); this.bus.gain.value = 1; this.bus.connect(dest);
    this.elements = GRAMMAR.map((def, i) => new Element(ctx, def, this.bus, this.seed + i * 101));
    this.current = [];
  }
  setEnabled(on) { this.enabled = on; const t = this.ctx.currentTime; this.bus.gain.setTargetAtTime(on ? 1 : 0, t, 2); }
  tune(chord, carrier) { this.elements.forEach(e => { e.chord = chord; e.tune(chord, carrier); }); }
  // choose for this breath: the floor always; then at most two elements by affinity, held for a few breaths so entries are rare
  plan(b, m, lean, w) {
    if (!this.enabled) { b.env = []; return; }
    const scored = this.elements.filter(e => !e.def.floor).map(e => ({ e, a: clamp01(e.def.affinity(m, lean, w)) })).filter(s => s.a > 0.22).sort((x, y) => y.a - x.a);
    if (b.index % 4 === 0 || !this.current.length) this.current = scored.slice(0, 2).map(s => s.e.def.id);
    b.env = this.elements.map(e => { const s = scored.find(x => x.e === e); const chosen = e.def.floor || (s && this.current.includes(e.def.id));
      const level = chosen ? (e.def.floor ? e.def.affinity(m, lean, w) * e.def.maxLevel : s.a * e.def.maxLevel * (0.7 + 0.3 * w.density)) : 0; return { id: e.def.id, level }; });
  }
  apply(b) { if (!b.env) return; b.env.forEach((x, i) => this.elements[i].apply(b, x.level)); }
  // field recordings: a manifest { "wind": ["field/wind_01.m4a", …], … } ; missing → synthesized stays
  async loadManifest(url) {
    try { const res = await fetch(url, { cache: "force-cache" }); if (!res.ok) return; const man = await res.json();
      this.elements.forEach(e => { if (Array.isArray(man[e.def.id]) && man[e.def.id].length) e.fieldFiles = man[e.def.id]; }); } catch (_) {}
  }
  get sounding() { return this.elements.filter(e => e.active && !e.def.floor).map(e => e.def); }
}
