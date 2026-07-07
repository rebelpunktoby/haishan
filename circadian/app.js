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

const SEASONS = ["Winter", "Winter", "Spring", "Spring", "Spring", "Summer",
                 "Summer", "Summer", "Autumn", "Autumn", "Autumn", "Winter"];

const ORGANS = {
  0: "Gallbladder", 2: "Liver", 4: "Lungs", 6: "Large Intestine",
  8: "Stomach", 10: "Spleen", 12: "Heart", 14: "Small Intestine",
  16: "Bladder", 18: "Kidneys", 20: "Pericardium", 22: "Triple Burner"
};

const JIEQI_SEASONS = { 4: "Li Chun · Spring", 7: "Li Xia · Summer",
                        10: "Li Qiu · Autumn", 1: "Li Dong · Winter" };

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

function jieqiMonth(now) {
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now - start) / 86_400_000);
  const LI_CHUN = 35, LI_XIA = 125, LI_QIU = 219, LI_DONG = 311;
  if (dayOfYear >= LI_DONG || dayOfYear < LI_CHUN) return 1;
  if (dayOfYear >= LI_QIU) return 10;
  if (dayOfYear >= LI_XIA) return 7;
  return 4;
}

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
    ichingMode ? "Switch to standard time" : "Switch to I-Ching mode");
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
