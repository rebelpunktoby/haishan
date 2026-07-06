// app.js — OceanMountain Circadian Engine β · DMT.beta
// Expects your RNBO export saved as ./export/patch.export.json

const PATCH_URL = "export/patch.export.json";

// RNBO parameter names (must match the param objects in your RNBO patch)
const P_MONTH = "inMonth";
const P_HOUR = "inHour";
const P_CAP = "offsetCap";

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
let device = null;
let analyser = null;
let waveData = null;
let clockTimer = null;
let ichingMode = false;

const SEASONS = ["Winter", "Winter", "Spring", "Spring", "Spring", "Summer",
                 "Summer", "Summer", "Autumn", "Autumn", "Autumn", "Winter"];

// TCM organ names indexed by meridian block hour (0,2,4...22)
const ORGANS = {
  0: "Gallbladder", 2: "Liver", 4: "Lungs", 6: "Large Intestine",
  8: "Stomach", 10: "Spleen", 12: "Heart", 14: "Small Intestine",
  16: "Bladder", 18: "Kidneys", 20: "Pericardium", 22: "Triple Burner"
};

// Jieqi season names keyed by the month integer we send
const JIEQI_SEASONS = { 4: "Li Chun · Spring", 7: "Li Xia · Summer",
                        10: "Li Qiu · Autumn", 1: "Li Dong · Winter" };

// ---------- boot ----------
initBtn.addEventListener("click", initialize, { once: true });
modeToggle.addEventListener("click", onModeToggle);
timeToggle.addEventListener("click", onTimeToggle);
window.addEventListener("resize", sizeCanvas);
sizeCanvas();
drawIdleHorizon();

async function initialize() {
  try {
    status("waking the engine…");

    // 1. Unlock WebAudio inside the user gesture
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") await audioCtx.resume();

    // 2. Fetch the exported patcher
    const resp = await fetch(PATCH_URL);
    if (!resp.ok) throw new Error(`Could not load ${PATCH_URL} (HTTP ${resp.status})`);
    const patcher = await resp.json();

    // 3. Load the RNBO runtime that matches the export version
    const version = patcher.desc?.meta?.rnboversion;
    if (!version) throw new Error("Export file has no RNBO version stamp.");
    await loadRNBOScript(version);

    // 4. Create the device
    device = await RNBO.createDevice({ context: audioCtx, patcher });

    // 5. Analyser between device and speakers
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.85;
    waveData = new Float32Array(analyser.fftSize);

    device.node.connect(analyser);
    analyser.connect(audioCtx.destination);

    // 6. Prime clock + mode, start pollers
    pushClock();
    clockTimer = setInterval(pushClock, 30_000);
    setMode(false); // default: headphones

    // 7. Reveal console, dissolve veil, start drawing
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

// Dynamically load the rnbo.min.js matching the export (official CDN pattern)
function loadRNBOScript(version) {
  return new Promise((resolve, reject) => {
    if (/^\d+\.\d+\.\d+-dev$/.test(version)) {
      return reject(new Error("Debug RNBO version detected — re-export with a release version."));
    }
    if (window.RNBO) return resolve();
    const el = document.createElement("script");
    el.src = `https://c74-public.nyc3.digitaloceanspaces.com/rnbo/${encodeURIComponent(version)}/rnbo.min.js`;
    el.onload = resolve;
    el.onerror = () => reject(new Error(`Failed to load RNBO runtime v${version}`));
    document.body.appendChild(el);
  });
}

// ---------- time systems ----------

// TCM Organ Clock: fold the local hour into its 2-hour meridian block.
// 23:00-00:59 -> 0, 01:00-02:59 -> 2, ... 21:00-22:59 -> 22
function tcmMeridianHour(hour) {
  if (hour === 23) return 0;
  return Math.floor((hour + 1) / 2) * 2;
}

// Jieqi Solar Terms: map day-of-year to the season's representative month.
// Boundaries (2026): Li Chun Feb 4 / Li Xia May 5 / Li Qiu Aug 7 / Li Dong Nov 7.
function jieqiMonth(now) {
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now - start) / 86_400_000);

  const LI_CHUN = 35;   // Feb 4
  const LI_XIA = 125;   // May 5
  const LI_QIU = 219;   // Aug 7
  const LI_DONG = 311;  // Nov 7

  if (dayOfYear >= LI_DONG || dayOfYear < LI_CHUN) return 1;  // Winter
  if (dayOfYear >= LI_QIU) return 10;                         // Autumn
  if (dayOfYear >= LI_XIA) return 7;                          // Summer
  return 4;                                                   // Spring
}

// ---------- clock -> RNBO ----------
function pushClock() {
  const now = new Date();
  const rawMonth = now.getMonth() + 1; // 1-12
  const rawHour = now.getHours();      // 0-23

  let sendMonth, sendHour;

  if (ichingMode) {
    sendHour = tcmMeridianHour(rawHour);
    sendMonth = jieqiMonth(now);
  } else {
    sendHour = rawHour;
    sendMonth = rawMonth;
  }

  setParam(P_MONTH, sendMonth);
  setParam(P_HOUR, sendHour);

  clockReadout.textContent =
    `${String(rawHour).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  seasonReadout.textContent = ichingMode
    ? `${JIEQI_SEASONS[sendMonth]} · ${ORGANS[sendHour]}`
    : SEASONS[rawMonth - 1];
}

function setParam(id, value) {
  if (!device) return;
  const p = device.parametersById.get(id);
  if (p) {
    p.value = value;
  } else {
    console.warn(`RNBO parameter "${id}" not found in export.`);
  }
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
  setParam(P_CAP, speakers ? CAP_SPEAKERS : CAP_HEADPHONES);
}

// ---------- standard / i-ching time mode ----------
function onTimeToggle() {
  ichingMode = timeToggle.getAttribute("aria-checked") !== "true";
  timeToggle.setAttribute("aria-checked", String(ichingMode));
  timeToggle.setAttribute("aria-label",
    ichingMode ? "Switch to standard time" : "Switch to I-Ching mode");
  labelStandard.classList.toggle("active", !ichingMode);
  labelIChing.classList.toggle("active", ichingMode);
  pushClock(); // apply the new time system immediately
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

  analyser.getFloatTimeDomainData(waveData);
  const w = canvas.clientWidth, h = canvas.clientHeight;
  const mid = h / 2;
  const amp = h * 0.38;

  ctx2d.clearRect(0, 0, w, h);

  // luminous breathing line
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

  // faint second pass = inner glow core
  ctx2d.shadowBlur = 0;
  ctx2d.strokeStyle = "rgba(232, 227, 213, 0.55)";
  ctx2d.lineWidth = 0.6;
  ctx2d.stroke();
}

function status(msg) { sysmsg.textContent = msg; }
