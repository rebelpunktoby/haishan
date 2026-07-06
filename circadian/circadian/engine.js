// engine.js — OceanMountain PHRASE 1, ported natively to Web Audio

// Faithful port of PHRASE_1.maxpat: 4 FM time engines + Am-cluster drone,

// YinYang_Brain season/harmony logic, master mixer with tanh saturation

// and 350/525ms cross-feedback delay.



// ---------- DATA (extracted verbatim from the Max patch) ----------



// coll iching_data: hour -> [carrierHz, offsetHz, fmBit, _, _, envBit, _, _]

const ICHING = [

[110.0, 0.1, 0, 0], [110.0, 0.1, 0, 0], [165.0, 0.1, 0, 0], [165.0, 0.15, 0, 0],

[110.0, 0.1, 0, 0], [220.0, 0.3, 0, 1], [220.0, 0.4, 0, 1], [275.0, 0.5, 1, 1],

[330.0, 0.5, 1, 1], [330.0, 0.6, 1, 1], [275.0, 0.4, 1, 1], [440.0, 0.8, 1, 1],

[440.0, 1.0, 1, 1], [550.0, 1.2, 1, 1], [550.0, 1.0, 1, 1], [440.0, 0.9, 1, 1],

[440.0, 0.7, 1, 1], [165.0, 0.4, 1, 1], [165.0, 0.3, 0, 1], [110.0, 0.3, 0, 1],

[110.0, 0.2, 0, 1], [165.0, 0.2, 0, 0], [110.0, 0.15, 0, 0], [110.0, 0.1, 0, 0]

]; // [carrier, offset, fmBit(P3), envBit(P6->attack speed)]



// YinYang_Brain: coll season_oct (month 1-12 -> octave multiplier)

const SEASON_OCT = { 1: 0.5, 2: 0.5, 3: 1.0, 4: 1.0, 5: 1.0, 6: 2.0,

7: 2.0, 8: 2.0, 9: 1.0, 10: 1.0, 11: 1.0, 12: 0.5 };



// YinYang_Brain: coll day_chord (floor(hour/6) -> 3 drone frequencies)

const DAY_CHORD = [

[110.0, 123.47, 164.81], // 0-5 Midnight A sus2

[110.0, 138.59, 155.56], // 6-11 Morning A Maj7#11

[110.0, 138.59, 196.00], // 12-17 Noon A13

[110.0, 130.81, 146.83] // 18-23 Evening A min11

];



// Quadrant expr: hour -> 1 Morning / 2 Noon / 3 Evening / 4 Midnight

function quadrantOf(h) {

if (h >= 5 && h <= 10) return 1;

if (h >= 11 && h <= 16) return 2;

if (h >= 17 && h <= 22) return 3;

return 4;

}



// ---------- helpers ----------



function makeTanhCurve(n = 2048) {

const c = new Float32Array(n);

for (let i = 0; i < n; i++) {

const x = (i / (n - 1)) * 2 - 1;

c[i] = Math.tanh(x);

}

return c; // tanh~ : saturation + implicit soft limit

}



function makeClipCurve(n = 2048) {

const c = new Float32Array(n);

for (let i = 0; i < n; i++) {

const x = (i / (n - 1)) * 2 - 1;

c[i] = Math.max(-1, Math.min(1, x));

}

return c; // clip~ -1. 1.

}



// -cos wave so LFO starts at -1 -> swell starts from SILENCE (phasor~->cos~->*-0.5->+0.5)

function makeNegCosWave(ctx) {

return ctx.createPeriodicWave(

new Float32Array([0, -1]), new Float32Array([0, 0]),

{ disableNormalization: false }

);

}



const GLIDE = 4; // seconds — frequency glide on hour change (anti-pop)

const XFADE = 3; // seconds — quadrant crossfade

const FM_BETA = 0.4 * 2 * Math.PI; // 0.4 cycles peak phase dev (scale 0 1 0. 0.4)



// ---------- one FM time-engine voice (p Morning / Noon / Evening / Midnight) ----------



class FMVoice {

constructor(ctx, destL, destR) {

this.ctx = ctx;

const t = ctx.currentTime;



// carriers (cycle~ L / R)

this.oscL = ctx.createOscillator();

this.oscR = ctx.createOscillator();

this.oscL.frequency.value = 0;

this.oscR.frequency.value = 0;



// FM modulator at carrier*0.5 (modOsc), depth via modGain (scaleFM -> *~)

this.modOsc = ctx.createOscillator();

this.modOsc.frequency.value = 0;

this.modGain = ctx.createGain();

this.modGain.gain.value = 0;

this.modOsc.connect(this.modGain);

this.modGain.connect(this.oscL.frequency);

this.modGain.connect(this.oscR.frequency);



// envelope (adsr~ 50/2000 attack, sustain 0.7 — sustained pad w/ retrigger feel)

this.env = ctx.createGain();

this.env.gain.value = 0;



// quadrant enable crossfade (replaces gate 4)

this.enable = ctx.createGain();

this.enable.gain.value = 0;



// per-voice output gain (*~ 0.2)

const trimL = ctx.createGain(); trimL.gain.value = 0.2;

const trimR = ctx.createGain(); trimR.gain.value = 0.2;



this.oscL.connect(this.env);

this.oscR.connect(this.envR = ctx.createGain());

this.envR.gain.value = 0;



// L path: oscL -> env -> enable -> trimL -> destL

this.env.connect(this.enable);

this.enable.connect(trimL);

trimL.connect(destL);



// R path: oscR -> envR -> enableR -> trimR -> destR

this.enableR = ctx.createGain(); this.enableR.gain.value = 0;

this.envR.connect(this.enableR);

this.enableR.connect(trimR);

trimR.connect(destR);



this.oscL.start(t);

this.oscR.start(t);

this.modOsc.start(t);

this.active = false;

}



// hourly data update (unpack -> carriers / FM / envelope speed)

setHour(carrier, offset, fmBit, envBit, oct) {

const t = this.ctx.currentTime;

const fc = carrier * oct; // seasonal octave fusion (r seasonal_oct -> * 1.)

const fmFreq = fc * 0.5; // modMult * 0.5

// FM deviation equivalent of 0.4-cycle phase mod: dev = beta * fmod, safety-capped

const dev = fmBit ? Math.min(FM_BETA * fmFreq, fc * 0.9) : 0;



this.oscL.frequency.setTargetAtTime(fc, t, GLIDE / 3);

this.oscR.frequency.setTargetAtTime(fc + offset, t, GLIDE / 3);

this.modOsc.frequency.setTargetAtTime(fmFreq, t, GLIDE / 3);

this.modGain.gain.setTargetAtTime(dev, t, GLIDE / 3);



// envelope: attack 2000ms (envBit 0) or 50ms (envBit 1) to sustain 0.7

this.attack = envBit ? 0.05 : 2.0;

if (this.active) this.triggerEnv();

}



triggerEnv() {

const t = this.ctx.currentTime;

for (const g of [this.env.gain, this.envR.gain]) {

g.cancelScheduledValues(t);

g.setTargetAtTime(0.7, t, this.attack / 3);

}

}



setActive(on) {

if (on === this.active) return;

this.active = on;

const t = this.ctx.currentTime;

for (const g of [this.enable.gain, this.enableR.gain]) {

g.cancelScheduledValues(t);

g.setTargetAtTime(on ? 1 : 0, t, XFADE / 3);

}

if (on) this.triggerEnv();

}

}



// ---------- the full engine ----------



export class CircadianEngine {

constructor(ctx) {

this.ctx = ctx;

this.offsetCap = 1000; // headphone mode default; 2 in speaker mode

this.lastHour = -1;

this.lastMonth = -1;



// ===== MASTER MIXER (v3 topology from the patch) =====

// time bus (tSum layers collapse into two per-channel sum nodes)

this.timeBusL = ctx.createGain();

this.timeBusR = ctx.createGain();

const faderTime = ctx.createGain(); faderTime.gain.value = 1.0; // live.gain~ 0dB

const faderTimeR = ctx.createGain(); faderTimeR.gain.value = 1.0;

this.timeBusL.connect(faderTime);

this.timeBusR.connect(faderTimeR);



// drone bus: fader -> *~0.2 -> lores~140 -> sumFX

this.droneBusL = ctx.createGain();

this.droneBusR = ctx.createGain();

const faderDrone = ctx.createGain(); faderDrone.gain.value = 1.0;

const faderDroneR = ctx.createGain(); faderDroneR.gain.value = 1.0;

const attL = ctx.createGain(); attL.gain.value = 0.2;

const attR = ctx.createGain(); attR.gain.value = 0.2;

const lpL = ctx.createBiquadFilter(); lpL.type = "lowpass"; lpL.frequency.value = 140; lpL.Q.value = 0.0001;

const lpR = ctx.createBiquadFilter(); lpR.type = "lowpass"; lpR.frequency.value = 140; lpR.Q.value = 0.0001;

this.droneBusL.connect(faderDrone); faderDrone.connect(attL); attL.connect(lpL);

this.droneBusR.connect(faderDroneR); faderDroneR.connect(attR); attR.connect(lpR);



// sumFX -> tanh~

const sumFXL = ctx.createGain();

const sumFXR = ctx.createGain();

faderTime.connect(sumFXL); lpL.connect(sumFXL);

faderTimeR.connect(sumFXR); lpR.connect(sumFXR);

const tanhL = ctx.createWaveShaper(); tanhL.curve = makeTanhCurve(); tanhL.oversample = "2x";

const tanhR = ctx.createWaveShaper(); tanhR.curve = makeTanhCurve(); tanhR.oversample = "2x";

sumFXL.connect(tanhL);

sumFXR.connect(tanhR);



// delay network: tapin~1000/tapout~ 350 & 525, xfeed 0.4, wet 0.35

const delL = ctx.createDelay(1.0); delL.delayTime.value = 0.350;

const delR = ctx.createDelay(1.0); delR.delayTime.value = 0.525;

const xLR = ctx.createGain(); xLR.gain.value = 0.4;

const xRL = ctx.createGain(); xRL.gain.value = 0.4;

tanhL.connect(delL);

tanhR.connect(delR);

delL.connect(xLR); xLR.connect(delR); // L tap -> *0.4 -> R line

delR.connect(xRL); xRL.connect(delL); // R tap -> *0.4 -> L line

const wetL = ctx.createGain(); wetL.gain.value = 0.35;

const wetR = ctx.createGain(); wetR.gain.value = 0.35;

delL.connect(wetL);

delR.connect(wetR);



// dry+wet -> clip~ -> stereo merge -> output

const dwL = ctx.createGain();

const dwR = ctx.createGain();

tanhL.connect(dwL); wetL.connect(dwL);

tanhR.connect(dwR); wetR.connect(dwR);

const clipL = ctx.createWaveShaper(); clipL.curve = makeClipCurve();

const clipR = ctx.createWaveShaper(); clipR.curve = makeClipCurve();

dwL.connect(clipL);

dwR.connect(clipR);

const merger = ctx.createChannelMerger(2);

clipL.connect(merger, 0, 0);

clipR.connect(merger, 0, 1);

this.output = merger; // connect this to analyser/destination in app.js



// ===== FOUR TIME ENGINES =====

this.voices = [

new FMVoice(ctx, this.timeBusL, this.timeBusR), // 1 Morning

new FMVoice(ctx, this.timeBusL, this.timeBusR), // 2 Noon

new FMVoice(ctx, this.timeBusL, this.timeBusR), // 3 Evening

new FMVoice(ctx, this.timeBusL, this.timeBusR) // 4 Midnight

];



// ===== DRONE (p Drone_Generator, frequencies driven by YY Brain fusion) =====

this.droneOscs = [0, 1, 2].map(() => {

const o = ctx.createOscillator();

o.frequency.value = 0;

return o;

});

const droneSum = ctx.createGain();

this.droneOscs.forEach(o => o.connect(droneSum));



// breathing LFO: phasor~0.05 -> cos~ -> *-0.5 -> +0.5 == unipolar 20s swell from silence

this.swell = ctx.createGain(); this.swell.gain.value = 0;

const lfo = ctx.createOscillator();

lfo.setPeriodicWave(makeNegCosWave(ctx));

lfo.frequency.value = 0.05;

const lfoDepth = ctx.createGain(); lfoDepth.gain.value = 0.5;

const lfoOffset = ctx.createConstantSource(); lfoOffset.offset.value = 0.5;

lfo.connect(lfoDepth);

lfoDepth.connect(this.swell.gain);

lfoOffset.connect(this.swell.gain);

const droneTrim = ctx.createGain(); droneTrim.gain.value = 0.12; // *~ 0.12

droneSum.connect(this.swell);

this.swell.connect(droneTrim);

droneTrim.connect(this.droneBusL);

droneTrim.connect(this.droneBusR);



const t = ctx.currentTime;

this.droneOscs.forEach(o => o.start(t));

lfo.start(t);

lfoOffset.start(t);

}



setOffsetCap(cap) {

this.offsetCap = cap;

if (this.lastHour >= 0) this.update(this.lastMonth, this.lastHour, true);

}



// The YinYang_Brain + coll + gate logic, called by pushClock()

update(month, hour, force = false) {

if (!force && month === this.lastMonth && hour === this.lastHour) return;

this.lastMonth = month;

this.lastHour = hour;



const oct = SEASON_OCT[month] ?? 1.0;



// --- time engines: coll iching_data row + quadrant gate ---

const [carrier, rawOffset, fmBit, envBit] = ICHING[hour];

const offset = Math.min(rawOffset, this.offsetCap);

const quad = quadrantOf(hour);



this.voices.forEach((v, i) => {

v.setActive(i === quad - 1);

if (i === quad - 1) v.setHour(carrier, offset, fmBit, envBit, oct);

});



// --- drone: day_chord band x seasonal octave (YY Brain fusion) ---

const chord = DAY_CHORD[Math.floor(hour / 6)];

const t = this.ctx.currentTime;

this.droneOscs.forEach((o, i) => {

o.frequency.setTargetAtTime(chord[i] * oct, t, GLIDE / 3);

});

}

}

File 2 — circadian/app.js (complete replacement; keeps your canvas, both toggles, veil mechanics — only initialize() and the param plumbing change):



// app.js — OceanMountain Circadian Engine β · DMT.beta

// Native Web Audio build — no RNBO, no external dependencies.



import { CircadianEngine } from "./engine.js";



const CAP_HEADPHONES = 1000;

const CAP_SPEAKERS = 2;



// ---------- DOM ----------

const initBtn = document.getElementById("initBtn");

const veil = document.getElementById("veil");

const consoleEl = document.getElementById("console");

const modeToggle = document.getElementById("modeToggle");

const labelPhones = document.getElementById("labelPhones");

const labelSpeakers = document.getElementById("labelSpeakers");

const timeToggle = document.getElementById("timeToggle");

const labelStandard = document.getElementById("labelStandard");

const labelIChing = document.getElementById("labelIChing");

const clockReadout = document.getElementById("clockReadout");

const seasonReadout = document.getElementById("seasonReadout");

const sysmsg = document.getElementById("sysmsg");

const canvas = document.getElementById("horizon");

const ctx2d = canvas.getContext("2d");



let audioCtx = null;

let engine = null;

let analyser = null;

let waveData = null;

let clockTimer = null;

let ichingMode = false;



const SEASONS = ["Winter", "Winter", "Spring", "Spring", "Spring", "Summer",

"Summer", "Summer", "Autumn", "Autumn", "Autumn", "Winter"];



const ORGANS = {

0: "Gallbladder", 2: "Liver", 4: "Lungs", 6: "Large Intestine",

8: "Stomach", 10: "Spleen", 12: "Heart", 14: "Small Intestine",

16: "Bladder", 18: "Kidneys", 20: "Pericardium", 22: "Triple Burner"

};



const JIEQI_SEASONS = { 4: "Li Chun · Spring", 7: "Li Xia · Summer",

10: "Li Qiu · Autumn", 1: "Li Dong · Winter" };



// ---------- boot ----------

initBtn.addEventListener("click", initialize, { once: true });

modeToggle.addEventListener("click", onModeToggle);

if (timeToggle) timeToggle.addEventListener("click", onTimeToggle);

window.addEventListener("resize", sizeCanvas);

sizeCanvas();

drawIdleHorizon();



async function initialize() {

try {

status("waking the engine…");



// 1. Unlock WebAudio inside the user gesture

audioCtx = new (window.AudioContext || window.webkitAudioContext)();

if (audioCtx.state === "suspended") await audioCtx.resume();



// 2. Build the native DSP graph (replaces RNBO device creation)

engine = new CircadianEngine(audioCtx);



// 3. Analyser between engine and speakers

analyser = audioCtx.createAnalyser();

analyser.fftSize = 2048;

analyser.smoothingTimeConstant = 0.85;

waveData = new Float32Array(analyser.fftSize);



engine.output.connect(analyser);

analyser.connect(audioCtx.destination);



// 4. Prime clock + mode, start pollers

pushClock();

clockTimer = setInterval(pushClock, 30_000);

setMode(false); // default: headphones



// 5. Reveal console, dissolve veil, start drawing

veil.classList.add("dissolved");

consoleEl.hidden = false;

status("");

requestAnimationFrame(drawWave);

} catch (err) {

console.error(err);

status(`init failed — ${err.message}`);

initBtn.addEventListener("click", initialize, { once: true });

}

}



// ---------- time systems ----------

function tcmMeridianHour(hour) {

if (hour === 23) return 0;

return Math.floor((hour + 1) / 2) * 2;

}



function jieqiMonth(now) {

const start = new Date(now.getFullYear(), 0, 0);

const dayOfYear = Math.floor((now - start) / 86_400_000);

const LI_CHUN = 35, LI_XIA = 125, LI_QIU = 219, LI_DONG = 311;

if (dayOfYear >= LI_DONG || dayOfYear < LI_CHUN) return 1;

if (dayOfYear >= LI_QIU) return 10;

if (dayOfYear >= LI_XIA) return 7;

return 4;

}



// ---------- clock -> engine ----------

function pushClock() {

const now = new Date();

const rawMonth = now.getMonth() + 1;

const rawHour = now.getHours();



let sendMonth, sendHour;

if (ichingMode) {

sendHour = tcmMeridianHour(rawHour);

sendMonth = jieqiMonth(now);

} else {

sendHour = rawHour;

sendMonth = rawMonth;

}



if (engine) engine.update(sendMonth, sendHour);



clockReadout.textContent =

`${String(rawHour).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

seasonReadout.textContent = ichingMode

? `${JIEQI_SEASONS[sendMonth]} · ${ORGANS[sendHour]}`

: SEASONS[rawMonth - 1];

}



// ---------- headphone / speaker mode ----------

function onModeToggle() {

const nowSpeakers = modeToggle.getAttribute("aria-checked") !== "true";

setMode(nowSpeakers);

}



function setMode(speakers) {

modeToggle.setAttribute("aria-checked", String(speakers));

modeToggle.setAttribute("aria-label",

speakers ? "Switch to headphone mode" : "Switch to speaker mode");

labelPhones.classList.toggle("active", !speakers);

labelSpeakers.classList.toggle("active", speakers);

if (engine) engine.setOffsetCap(speakers ? CAP_SPEAKERS : CAP_HEADPHONES);

}



// ---------- standard / i-ching time mode ----------

function onTimeToggle() {

ichingMode = timeToggle.getAttribute("aria-checked") !== "true";

timeToggle.setAttribute("aria-checked", String(ichingMode));

timeToggle.setAttribute("aria-label",

ichingMode ? "Switch to standard time" : "Switch to I-Ching mode");

labelStandard.classList.toggle("active", !ichingMode);

labelIChing.classList.toggle("active", ichingMode);

pushClock();

}



// ---------- canvas (unchanged) ----------

function sizeCanvas() {

const dpr = Math.min(window.devicePixelRatio || 1, 2);

canvas.width = canvas.clientWidth * dpr;

canvas.height = canvas.clientHeight * dpr;

ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);

}



function drawIdleHorizon() {

const w = canvas.clientWidth, h = canvas.clientHeight;

ctx2d.clearRect(0, 0, w, h);

ctx2d.strokeStyle = "rgba(159, 216, 196, 0.25)";

ctx2d.lineWidth = 1;

ctx2d.beginPath();

ctx2d.moveTo(0, h / 2);

ctx2d.lineTo(w, h / 2);

ctx2d.stroke();

}



function drawWave() {

requestAnimationFrame(drawWave);

if (!analyser) return;



analyser.getFloatTimeDomainData(waveData);

const w = canvas.clientWidth, h = canvas.clientHeight;

const mid = h / 2;

const amp = h * 0.38;



ctx2d.clearRect(0, 0, w, h);



ctx2d.lineWidth = 1.6;

ctx2d.strokeStyle = "#9fd8c4";

ctx2d.shadowColor = "rgba(159, 216, 196, 0.85)";

ctx2d.shadowBlur = 18;

ctx2d.lineJoin = "round";



ctx2d.beginPath();

const step = w / waveData.length;

for (let i = 0; i < waveData.length; i++) {

const x = i * step;

const y = mid + waveData[i] * amp;

i === 0 ? ctx2d.moveTo(x, y) : ctx2d.lineTo(x, y);

}

ctx2d.stroke();



ctx2d.shadowBlur = 0;

ctx2d.strokeStyle = "rgba(232, 227, 213, 0.55)";

ctx2d.lineWidth = 0.6;

ctx2d.stroke();

}

