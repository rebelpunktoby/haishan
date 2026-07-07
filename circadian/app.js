// app.js — OceanMountain Circadian Engine · DMT.beta
import { CircadianEngine } from "./engine.js?v=4";

const CAP_HEADPHONES = 1000;
const CAP_SPEAKERS = 2;

const initBtn = document.getElementById("initBtn");
const veil = document.getElementById("veil");
const consoleEl = document.getElementById("console");
const modeToggle = document.getElementById("modeToggle");
const labelPhones = document.getElementById("labelPhones");
const labelSpeakers = document.getElementById("labelSpeakers");
const timeToggle = document.getElementById("timeToggle");
const labelStandard = document.getElementById("labelStandard");
const labelIChing = document.getElementById("labelIChing");
const powerBtn = document.getElementById("powerBtn");
const clockReadout = document.getElementById("clockReadout");
const seasonReadout = document.getElementById("seasonReadout");
const bodyReadout = document.getElementById("bodyReadout");
const sysmsg = document.getElementById("sysmsg");
const canvas = document.getElementById("horizon");
const ctx2d = canvas.getContext("2d");

let audioCtx = null;
let engine = null;
let analyser = null;
let waveData = null;
let smoothWave = null;
let frameCount = 0;
let clockTimer = null;
let ichingMode = false;
let playing = false;

const JIEQI_24 = [
  { m: 2, d: 4,  zh: "立春", title: "Threshold of Emergence" },
  { m: 2, d: 19, zh: "雨水", title: "Aqueous Dissolution" },
  { m: 3, d: 5,  zh: "驚蟄", title: "The Subterranean Shock" },
  { m: 3, d: 20, zh: "春分", title: "Vernal Symmetry" },
  { m: 4, d: 4,  zh: "清明", title: "Lucid Horizon" },
  { m: 4, d: 20, zh: "穀雨", title: "Somatic Incubation" },

  { m: 5, d: 5,  zh: "立夏", title: "Ignition of Flux" },
  { m: 5, d: 21, zh: "小滿", title: "Lesser Concrescence" },
  { m: 6, d: 5,  zh: "芒種", title: "The Drive of Fruition" },
  { m: 6, d: 21, zh: "夏至", title: "Zenith of Amplitude" },
  { m: 7, d: 7,  zh: "小暑", title: "Thermal Entropy" },
  { m: 7, d: 22, zh: "大暑", title: "Maximal Saturation" },

  { m: 8, d: 7,  zh: "立秋", title: "Threshold of Contraction" },
  { m: 8, d: 23, zh: "處暑", title: "Recession of the Flame" },
  { m: 9, d: 7,  zh: "白露", title: "Crystalline Condensation" },
  { m: 9, d: 23, zh: "秋分", title: "Autumnal Symmetry" },
  { m: 10, d: 8, zh: "寒露", title: "Descent into Shadow" },
  { m: 10, d: 23, zh: "霜降", title: "Suspension of Form" },

  { m: 11, d: 7,  zh: "立冬", title: "The Submersion Point" },
  { m: 11, d: 22, zh: "小雪", title: "Sensory Attenuation" },
  { m: 12, d: 7,  zh: "大雪", title: "Absolute Muteness" },
  { m: 12, d: 21, zh: "冬至", title: "The Nadir of Novelty" },
  { m: 1, d: 5,   zh: "小寒", title: "Gestation in the Void" },
  { m: 1, d: 20,  zh: "大寒", title: "The Absolute Limit" }
];

const BODY_TIME_STATES = {
  0:  { channel: "足少陽膽經", zh: "黃鐘一陽", title: "The Midnight Catalyst" },
  2:  { channel: "足厥陰肝經", zh: "震雷萌動", title: "The Visionary Labyrinth" },
  4:  { channel: "手太陰肺經", zh: "天地交泰", title: "The Pranic Threshold" },
  6:  { channel: "手陽明大腸經", zh: "商音肅降", title: "The Entropic Release" },
  8:  { channel: "足陽明胃經", zh: "厚德載物", title: "The Somatic Crucible" },
  10: { channel: "足太陰脾經", zh: "黃中通理", title: "The Cognitive Synthesizer" },
  12: { channel: "手少陰心經", zh: "離明虛中", title: "The Sovereign Resonance" },
  14: { channel: "手太陽小腸經", zh: "辨物居方", title: "The Signal Discriminator" },
  16: { channel: "足太陽膀胱經", zh: "天一生水", title: "The Oceanic Axis" },
  18: { channel: "足少陰腎經", zh: "歸根復命", title: "The Primordial Root" },
  20: { channel: "手厥陰心包經", zh: "和光同塵", title: "Guardian of the Inner Sanctum" },
  22: { channel: "手少陽三焦經", zh: "大音希聲", title: "The Interstitial Matrix" }
};

initBtn.addEventListener("click", initialize, { once: true });
modeToggle.addEventListener("click", onModeToggle);
if (timeToggle) timeToggle.addEventListener("click", onTimeToggle);
if (powerBtn) powerBtn.addEventListener("click", onPowerToggle);
window.addEventListener("resize", sizeCanvas);
sizeCanvas();
drawIdleHorizon();

async function initialize() {
  try {
    status("waking the engine…");
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") await audioCtx.resume();

    engine = new CircadianEngine(audioCtx);

    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    waveData = new Float32Array(analyser.fftSize);
    smoothWave = new Float32Array(analyser.fftSize);

    engine.output.connect(analyser);
    analyser.connect(audioCtx.destination);

    pushClock();
    clockTimer = setInterval(pushClock, 30_000);
    setMode(false);
    playing = true;

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

// ---------- play / stop ----------
async function onPowerToggle() {
  if (!audioCtx) return;
  if (playing) {
    await audioCtx.suspend();
    playing = false;
    powerBtn.textContent = "PLAY";
    powerBtn.setAttribute("aria-label", "Resume the sound");
  } else {
    await audioCtx.resume();
    pushClock();
    playing = true;
    powerBtn.textContent = "PAUSE";
    powerBtn.setAttribute("aria-label", "Pause the sound");
  }
}

// ---------- time systems ----------
function tcmMeridianHour(hour) {
  if (hour === 23) return 0;
  return Math.floor((hour + 1) / 2) * 2;
}

function currentJieqi(now) {
  const year = now.getFullYear();
  const today = new Date(year, now.getMonth(), now.getDate()).getTime();

  // Default for Jan 1–4: previous cycle is still 冬至.
  let current = JIEQI_24.find(term => term.zh === "冬至") ?? JIEQI_24[0];
  let currentTime = new Date(year - 1, current.m - 1, current.d).getTime();

  for (const term of JIEQI_24) {
    const termTime = new Date(year, term.m - 1, term.d).getTime();

    if (termTime <= today && termTime >= currentTime) {
      current = term;
      currentTime = termTime;
    }
  }

  return current;
}

function engineMonthFromJieqi(term) {
  if (["立春", "雨水", "驚蟄", "春分", "清明", "穀雨"].includes(term.zh)) return 4;
  if (["立夏", "小滿", "芒種", "夏至", "小暑", "大暑"].includes(term.zh)) return 7;
  if (["立秋", "處暑", "白露", "秋分", "寒露", "霜降"].includes(term.zh)) return 10;
  return 1;
}

function pushClock() {
  const now = new Date();
  const rawMonth = now.getMonth() + 1;
  const rawHour = now.getHours();

  const term = currentJieqi(now);
  const bodyHour = tcmMeridianHour(rawHour);
  const bodyState = BODY_TIME_STATES[bodyHour] ?? BODY_TIME_STATES[0];

  let sendMonth, sendHour;
  if (ichingMode) {
    sendHour = bodyHour;
    sendMonth = engineMonthFromJieqi(term);
  } else {
    sendHour = rawHour;
    sendMonth = rawMonth;
  }

  if (engine) engine.update(sendMonth, sendHour);

  clockReadout.textContent =
    `${String(rawHour).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} · ${String(rawMonth).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;

  seasonReadout.textContent = `${term.zh} · ${term.title}`;
  bodyReadout.textContent = `${bodyState.zh} · ${bodyState.title}`;
}
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

function onTimeToggle() {
  ichingMode = timeToggle.getAttribute("aria-checked") !== "true";
  timeToggle.setAttribute("aria-checked", String(ichingMode));
  timeToggle.setAttribute("aria-label",
    ichingMode ? "Switch to standard time" : "Switch to I-CHING TIME");
  labelStandard.classList.toggle("active", !ichingMode);
  labelIChing.classList.toggle("active", ichingMode);
  pushClock();
}

// ---------- canvas ----------
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

  // half speed: only advance the wave every second frame
  frameCount++;
  if (frameCount % 2 === 0) {
    analyser.getFloatTimeDomainData(waveData);
    // watery inertia: each point drifts slowly toward the live signal
    for (let i = 0; i < waveData.length; i++) {
      smoothWave[i] += (waveData[i] - smoothWave[i]) * 0.06;
    }
  }

  const w = canvas.clientWidth, h = canvas.clientHeight;
  const mid = h / 2;
  const amp = h * 0.2;   // gentler swell than before

  ctx2d.clearRect(0, 0, w, h);

  ctx2d.lineWidth = 1.4;
  ctx2d.strokeStyle = "#9fd8c4";
  ctx2d.shadowColor = "rgba(159, 216, 196, 0.7)";
  ctx2d.shadowBlur = 14;
  ctx2d.lineJoin = "round";

  ctx2d.beginPath();
  const step = w / smoothWave.length;
  for (let i = 0; i < smoothWave.length; i++) {
    const x = i * step;
    const y = mid + smoothWave[i] * amp;
    i === 0 ? ctx2d.moveTo(x, y) : ctx2d.lineTo(x, y);
  }
  ctx2d.stroke();

  ctx2d.shadowBlur = 0;
  ctx2d.strokeStyle = "rgba(232, 227, 213, 0.45)";
  ctx2d.lineWidth = 0.6;
  ctx2d.stroke();
}

function status(msg) { sysmsg.textContent = msg; }
