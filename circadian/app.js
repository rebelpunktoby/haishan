// app.js — OceanMountain Circadian Engine β
// Expects your RNBO export saved as ./export/patch.export.json
// (default RNBO export folder name — adjust PATCH_URL if yours differs)

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

const SEASONS = ["Winter", "Winter", "Spring", "Spring", "Spring", "Summer",
                 "Summer", "Summer", "Autumn", "Autumn", "Autumn", "Winter"];

// ---------- boot ----------
initBtn.addEventListener("click", initialize, { once: true });
modeToggle.addEventListener("click", onModeToggle);
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

// ---------- clock -> RNBO ----------
function pushClock() {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const hour = now.getHours();      // 0-23

  setParam(P_MONTH, month);
  setParam(P_HOUR, hour);

  clockReadout.textContent =
    `${String(hour).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  seasonReadout.textContent = SEASONS[month - 1];
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
