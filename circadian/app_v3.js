// app_v2.js — OceanMountain · the merged OMT demo
// The circadian engine stays the truth (engine.js). engine_v2.js wraps it in
// breath / light / room and a hearing-safe master. This file is the page.
import { OceanMountainV2, DEFAULTS } from "./engine_v2.js?v=1";
import { sunLongitude, moonLongitude, moonPhase, sunTimes, solarHours, jieqiIndexOf, zodiacOf, DEFAULT_PLACE } from "./sky.js?v=1";

const CAP_HEADPHONES = 1000;
const CAP_SPEAKERS = 2;

const $ = (id) => document.getElementById(id);
const initBtn = $("initBtn"), veil = $("veil"), consoleEl = $("console");
const modeBtn = $("modeBtn"), timeBtn = $("timeBtn"), powerBtn = $("powerBtn");
const aboutBtn = $("aboutBtn"), aboutBox = $("about"), aboutClose = $("aboutClose");
const langBtn = $("langToggle"), msg = $("msg"), sysmsg = $("sysmsg");
const moTime = $("moTime"), moHour = $("moHour"), moLine = $("moLine"), moTerm = $("moTerm");
const canvas = $("horizon"), ctx2d = canvas.getContext("2d");
const dials = { breath: $("breath"), light: $("light"), room: $("room") };

let audioCtx = null, engine = null, masterGain = null, analyser = null;
let waveData = null, smoothWave = null, frameCount = 0;
const VIZ_POINTS = 128;
const vizCurve = new Float32Array(VIZ_POINTS);
let rmsGlow = 0, visualPower = 0, rafStarted = false;
let clockTimer = null, suspendTimer = null;
let ichingMode = false, speakers = false, playing = false, lang = "en";
let solarRead = false;                 // 時辰 read by true solar time (default: clock hour)
let place = { ...DEFAULT_PLACE, mine: false };
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- the calendar (unchanged from the engine page) ----------
const JIEQI_24 = [
  { m: 2, d: 4,  zh: "立春", en: "Beginning of Spring" }, { m: 2, d: 19, zh: "雨水", en: "Rain Water" },
  { m: 3, d: 5,  zh: "驚蟄", en: "Awakening of Insects" }, { m: 3, d: 20, zh: "春分", en: "Spring Equinox" },
  { m: 4, d: 4,  zh: "清明", en: "Clear and Bright" }, { m: 4, d: 20, zh: "穀雨", en: "Grain Rain" },
  { m: 5, d: 5,  zh: "立夏", en: "Beginning of Summer" }, { m: 5, d: 21, zh: "小滿", en: "Grain Buds" },
  { m: 6, d: 5,  zh: "芒種", en: "Grain in Ear" }, { m: 6, d: 21, zh: "夏至", en: "Summer Solstice" },
  { m: 7, d: 7,  zh: "小暑", en: "Minor Heat" }, { m: 7, d: 22, zh: "大暑", en: "Major Heat" },
  { m: 8, d: 7,  zh: "立秋", en: "Beginning of Autumn" }, { m: 8, d: 23, zh: "處暑", en: "End of Heat" },
  { m: 9, d: 7,  zh: "白露", en: "White Dew" }, { m: 9, d: 23, zh: "秋分", en: "Autumn Equinox" },
  { m: 10, d: 8, zh: "寒露", en: "Cold Dew" }, { m: 10, d: 23, zh: "霜降", en: "Frost's Descent" },
  { m: 11, d: 7,  zh: "立冬", en: "Beginning of Winter" }, { m: 11, d: 22, zh: "小雪", en: "Minor Snow" },
  { m: 12, d: 7,  zh: "大雪", en: "Major Snow" }, { m: 12, d: 21, zh: "冬至", en: "Winter Solstice" },
  { m: 1, d: 5,   zh: "小寒", en: "Minor Cold" }, { m: 1, d: 20,  zh: "大寒", en: "Major Cold" }
];

// The twelve double-hours: name, and what the hour means, in one quiet line.
// (時辰 are read by true solar time per the ratified mapping; the engine's hour
// table is keyed by clock hour, so the readout shows the 時辰 of the clock hour.)
const SHICHEN = {
  23: { zh: "子", en: "Zi",   line_en: "The hinge of the night. Everything rests; one thing begins.", line_zh: "夜之樞。萬物皆息，一陽始生。" },
  1:  { zh: "丑", en: "Chou", line_en: "The root dark. Slow work beneath the ground.", line_zh: "根之暗。地下緩緩運作。" },
  3:  { zh: "寅", en: "Yin",  line_en: "The first breath before light.", line_zh: "天光未至，第一口氣。" },
  5:  { zh: "卯", en: "Mao",  line_en: "The clearing. Light arrives and loosens.", line_zh: "天將明。光至而鬆。" },
  7:  { zh: "辰", en: "Chen", line_en: "The intake. The day gathers its material.", line_zh: "納入。一日聚其材。" },
  9:  { zh: "巳", en: "Si",   line_en: "Steady work. The mind holds a line.", line_zh: "穩作。心持一線。" },
  11: { zh: "午", en: "Wu",   line_en: "The still point at full light.", line_zh: "正午之靜。光滿而止。" },
  13: { zh: "未", en: "Wei",  line_en: "The softened glare. Warmth without edge.", line_zh: "光漸柔。暖而無鋒。" },
  15: { zh: "申", en: "Shen", line_en: "A second clarity, cooler than the first.", line_zh: "再明。較初更清。" },
  17: { zh: "酉", en: "You",  line_en: "The descent. Things return to where they live.", line_zh: "歸降。萬物還其所居。" },
  19: { zh: "戌", en: "Xu",   line_en: "The guarded dusk. The room closes gently.", line_zh: "守暮。室漸閉。" },
  21: { zh: "亥", en: "Hai",  line_en: "The deep. Sound grows rare; silence speaks.", line_zh: "深時。聲稀，靜語。" }
};

function shichenFor(hour) {            // 23–0 → 子, 1–2 → 丑, …
  const h = (hour + 1) % 24;           // shift so pairs align: 23,0 → 0 ; 1,2 → 2 ; …
  const start = (Math.floor(h / 2) * 2 + 23) % 24;
  return SHICHEN[start] ?? SHICHEN[23];
}
function tcmMeridianHour(hour) { if (hour === 23) return 0; return Math.floor((hour + 1) / 2) * 2; }

function currentJieqi(now) {
  const year = now.getFullYear();
  const today = new Date(year, now.getMonth(), now.getDate()).getTime();
  let current = JIEQI_24.find(t => t.zh === "冬至") ?? JIEQI_24[0];
  let currentTime = new Date(year - 1, current.m - 1, current.d).getTime();
  for (const term of JIEQI_24) {
    const termTime = new Date(year, term.m - 1, term.d).getTime();
    if (termTime <= today && termTime >= currentTime) { current = term; currentTime = termTime; }
  }
  return current;
}
function engineMonthFromJieqi(term) {
  if (["立春","雨水","驚蟄","春分","清明","穀雨"].includes(term.zh)) return 4;
  if (["立夏","小滿","芒種","夏至","小暑","大暑"].includes(term.zh)) return 7;
  if (["立秋","處暑","白露","秋分","寒露","霜降"].includes(term.zh)) return 10;
  return 1;
}

function currentSend() {
  const now = new Date(), rawMonth = now.getMonth() + 1, rawHour = now.getHours();
  const term = currentJieqi(now);
  const sendHour = ichingMode ? tcmMeridianHour(rawHour) : rawHour;
  const sendMonth = ichingMode ? engineMonthFromJieqi(term) : rawMonth;
  return { now, rawMonth, rawHour, term, sendHour, sendMonth };
}

function pushClock() {
  const { now, rawMonth, rawHour, term, sendHour, sendMonth } = currentSend();
  if (engine) engine.update(sendMonth, sendHour);
  const sc = shichenFor(solarRead ? Math.floor(solarHours(now, place.lon)) : rawHour);
  const sunTerm = JIEQI_24[jieqiIndexOf(sunLongitude(now))];
  moTime.textContent = `${String(rawHour).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")} · ${String(rawMonth).padStart(2,"0")}.${String(now.getDate()).padStart(2,"0")}`;
  moHour.textContent = lang === "zh" ? `${sc.zh}時` : `${sc.zh}時 · ${sc.en}`;
  moLine.textContent = lang === "zh" ? sc.line_zh : sc.line_en;
  moTerm.replaceChildren(Object.assign(document.createElement("b"), { textContent: sunTerm.zh }), document.createTextNode(lang === "zh" ? "" : " " + sunTerm.en));
}

// ---------- i18n ----------
const I18N = {
  veil1:{en:"Sound that follows the hour.",zh:"隨時辰而生的聲音。"},
  veil2:{en:"Nothing is composed in advance.",zh:"無預先寫定之樂譜。"},
  begin:{en:"Begin",zh:"開始"},
  r_k:{en:"How it listens",zh:"它如何聆聽"},
  s_sun:{en:"Sun",zh:"日"}, s_moon:{en:"Moon",zh:"月"}, s_day:{en:"Day",zh:"晝"},
  s_rt:{en:"Hour",zh:"時辰"}, s_clock:{en:"clock",zh:"時鐘"}, s_solar:{en:"true sun",zh:"真太陽時"},
  s_loc:{en:"use my location",zh:"用我的位置"}, s_mine:{en:"your location",zh:"你的位置"}, s_locno:{en:"location unavailable",zh:"無法取得位置"},
  s_note:{en:"Positions only. The sound follows the clock and the solar term; the moon and the signs are a reading, not an input.",zh:"僅為位置。聲音隨時鐘與節氣；月與星座只是讀數，不入聲。"}, r_more:{en:"Read the ten articles ↗",zh:"閱讀十條憲章 ↗"},
  r1t:{en:"Ground · 節氣",zh:"地 · 節氣"}, r1:{en:"The solar term sets the register — low in winter, high in summer.",zh:"節氣定音域——冬低，夏高。"},
  r2t:{en:"Tide · 時辰",zh:"潮 · 時辰"}, r2:{en:"Each double-hour moves the pitch and brightness: rising toward 午, sinking toward 子. The shape on the wheel is that tide.",zh:"每個時辰推動音高與明暗：向午而升，向子而沉。輪上的形狀，就是這道潮。"},
  r3t:{en:"Colour · 四時",zh:"色 · 四時"}, r3:{en:"The day turns through four chords — morning, noon, dusk, night.",zh:"一日流轉四個和弦——晨、午、暮、夜。"},
  r4t:{en:"Breath · Light · Room",zh:"呼吸 · 光 · 空間"}, r4:{en:"Yours. How slowly it breathes, how bright, how large the space.",zh:"由你決定：呼吸多慢、多明亮、空間多大。"}, hint:{en:"Headphones recommended · Starts softly",zh:"建議使用耳機 · 聲音輕輕淡入"},
  c_breath:{en:"Breath",zh:"呼吸"}, c_light:{en:"Light",zh:"光"}, c_room:{en:"Room",zh:"空間"},
  m_phones:{en:"Headphones",zh:"耳機"}, m_speakers:{en:"Speakers",zh:"喇叭"},
  t_std:{en:"Clock",zh:"時鐘"}, t_iching:{en:"時辰",zh:"時辰"},
  pause:{en:"Pause",zh:"暫停"}, play:{en:"Play",zh:"繼續"},
  render:{en:"Take this moment with you",zh:"帶走此刻"}, about:{en:"About",zh:"關於"}, close:{en:"Close",zh:"關閉"},
  colophon:{en:"breath · tide · hour · season",zh:"呼吸 · 潮汐 · 時辰 · 節氣"}
};
function applyLang(next) {
  lang = next;
  document.documentElement.setAttribute("lang", lang === "zh" ? "zh-Hant" : "en");
  document.body.classList.toggle("lang-zh", lang === "zh");
  document.querySelectorAll("[data-i18n]").forEach(el => { const k = el.getAttribute("data-i18n"); if (I18N[k]) el.textContent = I18N[k][lang]; });
  if (powerBtn.querySelector("[data-i18n]")) powerBtn.querySelector("[data-i18n]").textContent = I18N[playing ? "pause" : "play"][lang];
  langBtn.textContent = lang === "en" ? "繁" : "EN";
  langBtn.setAttribute("aria-label", lang === "en" ? "Switch to Traditional Chinese" : "Switch to English");
  pushClock();
  if (aboutBox.classList.contains("open")) drawClock();
}
langBtn.addEventListener("click", () => applyLang(lang === "en" ? "zh" : "en"));

// ---------- audio ----------
async function unlock(ctx) {              // iOS: a silent buffer inside the tap, then resume
  try {
    const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0);
  } catch (_) {}
  if (ctx.state !== "running") await ctx.resume();
}

async function initialize() {
  try {
    status(lang === "zh" ? "喚醒中…" : "waking…");
    const AC = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AC({ latencyHint: "playback" });
    await unlock(audioCtx);
    audioCtx.addEventListener("statechange", () => { if (playing && audioCtx.state !== "running") setTimeout(keepAlive, 300); });

    engine = new OceanMountainV2(audioCtx);
    masterGain = audioCtx.createGain(); masterGain.gain.value = 0;
    analyser = audioCtx.createAnalyser(); analyser.fftSize = 2048;
    waveData = new Float32Array(analyser.fftSize); smoothWave = new Float32Array(analyser.fftSize);
    engine.output.connect(masterGain); masterGain.connect(analyser); analyser.connect(audioCtx.destination);

    readDials(true);
    setMode(false);
    pushClock();
    clockTimer = setInterval(pushClock, 30_000);

    fadeMaster(1, 0.9);                   // breathe in over ~3 s
    playing = true;
    document.body.classList.add("on");
    document.body.classList.remove("paused");
    veil.classList.add("gone");
    consoleEl.removeAttribute("hidden");
    status("");
    if (!rafStarted) { rafStarted = true; requestAnimationFrame(drawWave); }
    setupMediaSession();
  } catch (err) {
    console.error(err);
    status(lang === "zh" ? "聲音無法啟動，請再按一次。" : "The sound couldn’t start. Tap Begin to try again.");
    initBtn.addEventListener("click", initialize, { once: true });
  }
}
function fadeMaster(target, tc) {
  const t = audioCtx.currentTime;
  masterGain.gain.cancelScheduledValues(t);
  masterGain.gain.setTargetAtTime(target, t, tc);
}
async function onPowerToggle() {
  if (!audioCtx || !masterGain) return;
  if (playing) {
    playing = false; document.body.classList.add("paused");
    powerBtn.querySelector("[data-i18n]").textContent = I18N.play[lang];
    powerBtn.setAttribute("aria-label", "Resume the sound");
    fadeMaster(0, 1.0);
    if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "paused";
    clearTimeout(suspendTimer);
    suspendTimer = setTimeout(() => { if (!playing && audioCtx.state === "running") audioCtx.suspend(); }, 3400);
  } else {
    clearTimeout(suspendTimer);
    if (audioCtx.state === "suspended") await audioCtx.resume();
    pushClock();
    playing = true; document.body.classList.remove("paused");
    powerBtn.querySelector("[data-i18n]").textContent = I18N.pause[lang];
    powerBtn.setAttribute("aria-label", "Pause the sound");
    fadeMaster(1, 0.9);
    if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "playing";
  }
}
function setMode(spk) {
  speakers = spk;
  modeBtn.setAttribute("aria-pressed", String(spk));
  modeBtn.setAttribute("aria-label", spk ? "Switch to headphone mode" : "Switch to speaker mode");
  if (engine) { engine.setOffsetCap(spk ? CAP_SPEAKERS : CAP_HEADPHONES); engine.setPresence(spk ? 0.5 : 0.35); }
}
function setTimeSystem(iching) {
  ichingMode = iching;
  timeBtn.setAttribute("aria-pressed", String(iching));
  timeBtn.setAttribute("aria-label", iching ? "Switch to clock time" : "Switch to 時辰 time");
  pushClock();
}
function readDials(immediate = false) {
  $("breathOut").textContent = `${dials.breath.value} s`;
  $("lightOut").textContent = dials.light.value;
  $("roomOut").textContent = dials.room.value;
  if (!engine) return;
  engine.setBreath(+dials.breath.value);
  engine.setLight(+dials.light.value, immediate);
  engine.setRoom(+dials.room.value, immediate);
}
Object.values(dials).forEach(d => d.addEventListener("input", () => readDials(false)));

// ---------- knobs: 270° sweep, drag up/down, wheel, double-click resets ----------
const KNOB_A0 = -225, KNOB_A1 = 45;
function arcPath(r, a0, a1) {
  const p = a => [Math.cos(a * Math.PI / 180) * r, Math.sin(a * Math.PI / 180) * r];
  const [x0, y0] = p(a0), [x1, y1] = p(a1);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}
function buildKnob(box) {
  const input = $(box.dataset.for), NS = "http://www.w3.org/2000/svg";
  box.innerHTML = `<svg viewBox="-50 -50 100 100"><g class="ticks"></g><path class="track" d="${arcPath(44, KNOB_A0, KNOB_A1)}"/><path class="val" d="${arcPath(44, KNOB_A0, KNOB_A1)}"/><circle class="body" r="33"/><circle class="ring" r="34"/><line class="ptr" x1="0" y1="-14" x2="0" y2="-28"/></svg>`;
  const ticks = box.querySelector(".ticks");
  for (let i = 0; i <= 10; i++) { const a = (KNOB_A0 + (KNOB_A1 - KNOB_A0) * i / 10) * Math.PI / 180, l = document.createElementNS(NS, "line");
    l.setAttribute("x1", (Math.cos(a) * 37.5).toFixed(2)); l.setAttribute("y1", (Math.sin(a) * 37.5).toFixed(2));
    l.setAttribute("x2", (Math.cos(a) * 40).toFixed(2)); l.setAttribute("y2", (Math.sin(a) * 40).toFixed(2)); ticks.append(l); }
  const val = box.querySelector(".val"), ptr = box.querySelector(".ptr"), len = val.getTotalLength();
  val.style.strokeDasharray = len;
  const min = +input.min, max = +input.max, step = +input.step || 1;
  const paint = () => { const f = (+input.value - min) / (max - min);
    val.style.strokeDashoffset = (len * (1 - f)).toFixed(2);
    ptr.setAttribute("transform", `rotate(${(KNOB_A0 + 90 + (KNOB_A1 - KNOB_A0) * f).toFixed(1)})`); };
  const set = v => { v = Math.round(Math.max(min, Math.min(max, v)) / step) * step;
    if (+input.value !== v) { input.value = v; input.dispatchEvent(new Event("input", { bubbles: true })); } paint(); };
  input.addEventListener("input", paint);
  let y0 = 0, v0 = 0;
  box.addEventListener("pointerdown", e => { box.setPointerCapture(e.pointerId); y0 = e.clientY; v0 = +input.value; e.preventDefault(); });
  box.addEventListener("pointermove", e => { if (!box.hasPointerCapture(e.pointerId)) return;
    const fine = e.shiftKey ? 0.25 : 1; set(v0 + (y0 - e.clientY) / 180 * (max - min) * fine); });
  box.addEventListener("wheel", e => { e.preventDefault(); set(+input.value - Math.sign(e.deltaY) * step * (max - min > 20 ? 2 : 1)); }, { passive: false });
  box.addEventListener("dblclick", () => set(+input.dataset.default));
  paint();
}
document.querySelectorAll(".knob").forEach(buildKnob);
function status(t) { sysmsg.textContent = t; }

// ---------- about ----------
// ---------- the clock: 節氣 ring · 時辰 ring · day and night · sun · moon · the tide ----------
const TIDE = [110,110,165,165,110,220,220,275,330,330,275,440,440,550,550,440,440,165,165,110,110,165,110,110]; // engine hour table, Hz
const BRANCH = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
const MAJOR = new Set(["立春","春分","立夏","夏至","立秋","秋分","立冬","冬至"]);
const NS = "http://www.w3.org/2000/svg";
const mk = (n, a, text) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); if (text != null) e.textContent = text; return e; };
const angDay = h => Math.PI / 2 + (h / 24) * 2 * Math.PI;                 // 子 at the bottom, 午 at the top, clockwise
const angYear = lam => Math.PI / 2 + ((lam - 270) / 360) * 2 * Math.PI;   // 冬至 at the bottom, 夏至 at the top — the year laid over the day
const pt = (a, r) => [+(Math.cos(a) * r).toFixed(2), +(Math.sin(a) * r).toFixed(2)];
const hhmm = d => d ? `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` : "—";
function sector(r1, r2, a0, a1) {                                          // annular sector, a0 → a1 clockwise (increasing angle)
  while (a1 < a0) a1 += 2 * Math.PI;
  const big = a1 - a0 > Math.PI ? 1 : 0, [x0, y0] = pt(a0, r2), [x1, y1] = pt(a1, r2), [x2, y2] = pt(a1, r1), [x3, y3] = pt(a0, r1);
  return `M${x0} ${y0}A${r2} ${r2} 0 ${big} 1 ${x1} ${y1}L${x2} ${y2}A${r1} ${r1} 0 ${big} 0 ${x3} ${y3}Z`;
}
function moonDisc(frac, r) {                                               // lit fraction 0–1; lit limb on +x (the group is rotated to face the sun)
  const k = Math.cos(frac * Math.PI);                                      // terminator bulge: +1 new … 0 quarter … −1 full
  const outer = `A${r} ${r} 0 1 1 0 ${r}`;                                 // right-hand limb, top → bottom
  const inner = `A${(Math.abs(k) * r).toFixed(3)} ${r} 0 1 ${k > 0 ? 0 : 1} 0 ${-r}`;   // terminator, bottom → top
  return `M0 ${-r}${outer}${inner}Z`;
}
let wheelTimer = null, lastSky = null, skyBack = null;
function skyNow(now = new Date()) {
  const lamS = sunLongitude(now), lamM = moonLongitude(now), ph = moonPhase(now);
  const times = sunTimes(now, place.lat, place.lon);
  const solH = solarHours(now, place.lon), clockH = now.getHours() + now.getMinutes() / 60;
  const readH = solarRead ? solH : clockH;
  const termIdx = jieqiIndexOf(lamS), term = JIEQI_24[termIdx], sign = zodiacOf(lamS);
  const sc = shichenFor(Math.floor(readH));
  return { now, lamS, lamM, ph, times, solH, clockH, readH, termIdx, term, sign, sc };
}
function drawClock(sky = skyNow()) {
  const svg = $("wheel"); if (!svg) return;
  lastSky = sky;
  svg.replaceChildren();
  const R1 = 150, R1i = 142, RO = 134, RB1 = 119, RB2 = 127, R2 = 118, RL = 102, r0 = 28, rMax = 84;
  const { now, lamS, lamM, ph, times, readH, termIdx, sign, sc } = sky;
  const g = (cls) => { const e = mk("g", { class: cls }); svg.append(e); return e; };

  // — day and night: the band between the 時辰 ring and the orbit —
  const band = g("band");
  if (times.rise && times.set) {
    const hr = times.rise.getHours() + times.rise.getMinutes() / 60, hs = times.set.getHours() + times.set.getMinutes() / 60;
    band.append(mk("path", { d: sector(RB1, RB2, angDay(hr), angDay(hs)), class: "day" }),
                mk("path", { d: sector(RB1, RB2, angDay(hs), angDay(hr)), class: "night" }));
    for (const [h, c] of [[hr, "rise"], [hs, "set"]]) { const [x1, y1] = pt(angDay(h), RB1 - 2), [x2, y2] = pt(angDay(h), RB2 + 2); band.append(mk("line", { x1, y1, x2, y2, class: "twi " + c })); }
  } else band.append(mk("path", { d: sector(RB1, RB2, 0, 2 * Math.PI - 1e-4), class: times.polar === "day" ? "day" : "night" }));

  // — 時辰 ring —
  const hours = g("hours");
  hours.append(mk("circle", { r: R2, class: "seg" }));
  for (let i = 0; i < 12; i++) {
    const a = angDay(i * 2 - 1), [x1, y1] = pt(a, R2 - 7), [x2, y2] = pt(a, R2);
    hours.append(mk("line", { x1, y1, x2, y2, class: "seg" }));
    const [x, y] = pt(angDay(i * 2), RL);
    hours.append(mk("text", { x, y, class: "lbl" + (BRANCH[i] === sc.zh ? " now" : "") }, BRANCH[i]));
  }

  // — 節氣 ring: 24 ticks, 8 named, the current one lit; every tick carries its name —
  const terms = g("terms");
  terms.append(mk("circle", { r: R1, class: "seg faint" }));
  for (let k = 0; k < 24; k++) {
    const lam = 315 + k * 15, a = angYear(lam), major = MAJOR.has(JIEQI_24[k].zh), cur = k === termIdx;
    const [x1, y1] = pt(a, major ? R1i - 4 : R1i), [x2, y2] = pt(a, R1);
    const tick = mk("line", { x1, y1, x2, y2, class: "tick" + (major ? " major" : "") + (cur ? " cur" : "") });
    const tt = mk("title", {}, `${JIEQI_24[k].zh} · ${JIEQI_24[k].en} · ${lam % 360}°`); tick.append(tt);
    const hit = mk("path", { d: sector(R1i - 10, R1 + 12, angYear(lam - 7.5), angYear(lam + 7.5)), class: "hit", "data-k": k });
    terms.append(hit, tick);
    if (major || cur) { const [x, y] = pt(angYear(lam), R1 + 11); terms.append(mk("text", { x, y, class: "tl" + (cur ? " cur" : "") }, JIEQI_24[k].zh)); }
  }

  // — orbit: the sun at its longitude, the moon at hers with her phase —
  const orbit = g("orbit");
  orbit.append(mk("circle", { r: RO, class: "core" }));
  const [sx, sy] = pt(angYear(lamS), RO);
  orbit.append(mk("circle", { cx: sx, cy: sy, r: 5.5, class: "sunglow" }), mk("circle", { cx: sx, cy: sy, r: 3.2, class: "sun" }));
  const [mx, my] = pt(angYear(lamM), RO);
  const toSun = Math.atan2(sy - my, sx - mx) * 180 / Math.PI;              // the lit side always faces the sun
  const moon = mk("g", { transform: `translate(${mx} ${my}) rotate(${toSun.toFixed(1)})`, class: "moon" });
  moon.append(mk("circle", { r: 4.2, class: "moon-dark" }), mk("path", { d: moonDisc(ph.fraction, 4.2), class: "moon-lit" }));
  orbit.append(moon);

  // — the tide of pitch, from the engine's hour table —
  const lo = Math.log(110), hi = Math.log(550); let d = "";
  for (let k = 0; k <= 96; k++) {
    const hf = (k / 96) * 24, i0 = Math.floor(hf) % 24, i1 = (i0 + 1) % 24, f = hf - Math.floor(hf);
    const pch = Math.log(TIDE[i0]) * (1 - f) + Math.log(TIDE[i1]) * f;
    const [x, y] = pt(angDay(hf), r0 + 8 + (rMax - r0 - 8) * (pch - lo) / (hi - lo));
    d += (k ? "L" : "M") + x + " " + y;
  }
  const centre = g("centre");
  centre.append(mk("circle", { r: r0, class: "core" }), mk("path", { d: d + "Z", class: "tide" }));

  // — the hand for now —
  const a = angDay(readH), [hx, hy] = pt(a, R2 - 3);
  const hand = g("now");
  hand.append(mk("line", { x1: 0, y1: 0, x2: hx, y2: hy, class: "hand" }), mk("circle", { cx: hx, cy: hy, r: 3, class: "dot" }), mk("text", { x: 0, y: 3, class: "mark" }, "NOW"));

  // — the reading, in words —
  const L = lang;
  const t = (k) => I18N[k][L];
  $("skySun").textContent = L === "zh" ? `${sky.term.zh} · ${(Math.round(lamS) % 360)}° · ${sign.zh}` : `${sky.term.zh} ${sky.term.en} · ${(Math.round(lamS) % 360)}° · ${sign.en}`;
  $("skyMoon").textContent = L === "zh" ? `${ph.name.zh} · ${Math.round(ph.fraction * 100)}% · ${(Math.round(lamM) % 360)}°` : `${ph.name.en} · ${Math.round(ph.fraction * 100)}% lit · ${(Math.round(lamM) % 360)}°`;
  const placeName = place.mine ? t("s_mine") : (L === "zh" ? place.zh : place.en);
  $("skyDay").textContent = times.rise ? `↑ ${hhmm(times.rise)} · ↓ ${hhmm(times.set)} · ${placeName}` : `${times.polar === "day" ? (L === "zh" ? "永晝" : "midnight sun") : (L === "zh" ? "永夜" : "polar night")} · ${placeName}`;
  $("skyRead").textContent = (L === "zh" ? `${sc.zh}時` : `${sc.zh}時 · ${sc.en}`) + ` · ${hhmm(now)}` + (solarRead ? ` · ${t("s_solar")} ${String(Math.floor(sky.solH)).padStart(2, "0")}:${String(Math.floor((sky.solH % 1) * 60)).padStart(2, "0")}` : "");
  svg.setAttribute("aria-label", `Now: ${sc.zh} ${sc.en} hour, ${sky.term.en}, sun at ${(Math.round(lamS) % 360)} degrees in ${sign.en}, ${ph.name.en.toLowerCase()}, sunrise ${hhmm(times.rise)}, sunset ${hhmm(times.set)}, ${placeName}.`);
}
// tap or hover a 節氣 tick: name it for a moment
document.addEventListener("pointerdown", e => {
  const hit = e.target.closest && e.target.closest("#wheel .hit"); if (!hit) return;
  const k = +hit.dataset.k, lam = (315 + k * 15) % 360, term = JIEQI_24[k];
  $("skySun").textContent = lang === "zh" ? `${term.zh} · ${lam}°` : `${term.zh} ${term.en} · ${lam}°`;
  clearTimeout(skyBack); skyBack = setTimeout(() => { if (lastSky) drawClock(skyNow()); }, 2600);
});
function startClock() { stopClock(); drawClock(); wheelTimer = setInterval(() => drawClock(), 60000); }
function stopClock() { if (wheelTimer) { clearInterval(wheelTimer); wheelTimer = null; } }
// 時辰 by clock hour or true solar time (a reading; the engine still follows the clock)
const readBtn = $("readBtn");
function setSolarRead(on) {
  solarRead = on;
  readBtn.setAttribute("aria-pressed", String(on));
  pushClock(); if (aboutBox.classList.contains("open")) drawClock();
}
readBtn.addEventListener("click", () => setSolarRead(!solarRead));
// sunrise and sunset for where you are — asked for on tap, used once, never stored
const locBtn = $("locBtn");
locBtn.addEventListener("click", () => {
  if (!navigator.geolocation) { locBtn.textContent = I18N.s_locno[lang]; return; }
  locBtn.disabled = true;
  navigator.geolocation.getCurrentPosition(
    pos => { place = { lat: pos.coords.latitude, lon: pos.coords.longitude, en: "", zh: "", mine: true }; locBtn.hidden = true; pushClock(); drawClock(); },
    () => { locBtn.textContent = I18N.s_locno[lang]; locBtn.disabled = false; },
    { maximumAge: 600000, timeout: 8000 });
});

function setAbout(open) {
  if (open) startClock(); else stopClock();
  aboutBox.classList.toggle("open", open); aboutBox.setAttribute("aria-hidden", String(!open));
  aboutBtn.setAttribute("aria-expanded", String(open));
  setTimeout(() => { (open ? aboutClose : aboutBtn).focus({ preventScroll: true }); if (open) aboutBox.scrollTop = 0; }, 30);
}

// ---------- wire ----------
initBtn.addEventListener("click", initialize, { once: true });
powerBtn.addEventListener("click", onPowerToggle);
modeBtn.addEventListener("click", () => setMode(!speakers));
timeBtn.addEventListener("click", () => setTimeSystem(!ichingMode));
aboutBtn.addEventListener("click", () => setAbout(!aboutBox.classList.contains("open")));
aboutClose.addEventListener("click", () => setAbout(false));
aboutBox.addEventListener("click", (e) => { if (e.target === aboutBox) setAbout(false); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && aboutBox.classList.contains("open")) setAbout(false); });
// ---------- keep playing, like a station ----------
function setupMediaSession() {
  try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (_) {}
  if (!("mediaSession" in navigator)) return;
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: "山海 OceanMountain", artist: "Haishan Lai", album: "Live · follows the hour",
      artwork: [{ src: "/og.jpg", sizes: "1200x630", type: "image/jpeg" }]
    });
    navigator.mediaSession.setActionHandler("play", () => { if (!playing) onPowerToggle(); });
    navigator.mediaSession.setActionHandler("pause", () => { if (playing) onPowerToggle(); });
    navigator.mediaSession.setActionHandler("stop", () => { if (playing) onPowerToggle(); });
    navigator.mediaSession.playbackState = playing ? "playing" : "paused";
  } catch (_) {}
}
// If the browser or OS pauses the audio (tab hidden, a call, lock screen), bring it back
// as soon as it's allowed. Only an explicit Pause stops the station.
async function keepAlive() {
  if (!audioCtx || !playing) return;
  if (audioCtx.state !== "running") { try { await audioCtx.resume(); pushClock(); } catch (_) {} }
  if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "playing";
}
["visibilitychange", "pageshow", "focus", "pointerdown", "keydown"].forEach(ev =>
  (ev === "visibilitychange" ? document : window).addEventListener(ev, keepAlive, { passive: true }));
setInterval(keepAlive, 4000);

// ---------- canvas ----------
function sizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = canvas.clientWidth * dpr; canvas.height = canvas.clientHeight * dpr;
  ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (!rafStarted) drawIdleHorizon();
}
function drawIdleHorizon() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  ctx2d.clearRect(0, 0, w, h);
  const clear = Math.min(0.45, 90 / w), fade = Math.min(0.2, 110 / w);
  const g = ctx2d.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, "rgba(159,216,196,0)");
  g.addColorStop(Math.min(0.12, 0.5 - clear - fade - 0.01), "rgba(159,216,196,.25)");
  g.addColorStop(0.5 - clear - fade, "rgba(159,216,196,.18)");
  g.addColorStop(0.5 - clear, "rgba(159,216,196,0)");
  g.addColorStop(0.5 + clear, "rgba(159,216,196,0)");
  g.addColorStop(0.5 + clear + fade, "rgba(159,216,196,.18)");
  g.addColorStop(Math.max(0.88, 0.5 + clear + fade + 0.01), "rgba(159,216,196,.25)");
  g.addColorStop(1, "rgba(159,216,196,0)");
  ctx2d.strokeStyle = g; ctx2d.lineWidth = 1;
  ctx2d.beginPath(); ctx2d.moveTo(0, h / 2); ctx2d.lineTo(w, h / 2); ctx2d.stroke();
}
const WAVE_LAYERS = [
  { yOff: -6, ampMul: 1.25, alpha: 0.16, width: 0.8, tideAmp: 11, tideSpeed: 0.00005, drift: 14, phase: 4.4 },
  { yOff: 0,  ampMul: 1.0,  alpha: 0.80, width: 1.4, tideAmp: 5,  tideSpeed: 0.00010, drift: 8,  phase: 0.0 },
  { yOff: 7,  ampMul: 0.6,  alpha: 0.26, width: 1.0, tideAmp: 8,  tideSpeed: 0.00007, drift: 20, phase: 2.1 }
];
function drawWave(nowMs) {
  requestAnimationFrame(drawWave);
  if (!analyser) return;
  const target = playing ? 1 : 0;
  visualPower += (target - visualPower) * 0.012;
  frameCount++;
  if (frameCount % 2 === 0) {
    analyser.getFloatTimeDomainData(waveData);
    for (let i = 0; i < waveData.length; i++) smoothWave[i] += (waveData[i] - smoothWave[i]) * 0.06;
    const block = Math.floor(smoothWave.length / VIZ_POINTS);
    for (let p = 0; p < VIZ_POINTS; p++) { let sum = 0; const base = p * block; for (let j = 0; j < block; j++) sum += smoothWave[base + j]; vizCurve[p] += (sum / block - vizCurve[p]) * 0.08; }
    let sq = 0; for (let i = 0; i < smoothWave.length; i += 16) sq += smoothWave[i] * smoothWave[i];
    rmsGlow += (Math.sqrt(sq / (smoothWave.length / 16)) - rmsGlow) * 0.05;
  }
  const w = canvas.clientWidth, h = canvas.clientHeight, mid = h / 2;
  const amp = h * 0.34 * (0.15 + 0.85 * visualPower), t = reduceMotion ? 0 : (nowMs || 0);
  ctx2d.clearRect(0, 0, w, h);
  const glowTide = 0.5 + 0.5 * Math.sin(t * 0.00016);
  const glowAlpha = (0.04 + 0.09 * visualPower) * (0.75 + 0.25 * glowTide) + rmsGlow * 0.10 * visualPower;
  const glow = ctx2d.createRadialGradient(w / 2, mid, 0, w / 2, mid, Math.max(w, h) * (0.45 + 0.12 * glowTide));
  glow.addColorStop(0, `rgba(159,216,196,${Math.min(glowAlpha, 0.2)})`); glow.addColorStop(1, "rgba(159,216,196,0)");
  ctx2d.fillStyle = glow; ctx2d.fillRect(0, 0, w, h);
  const step = w / (VIZ_POINTS - 1);
  ctx2d.lineJoin = "round"; ctx2d.lineCap = "round";
  for (const L of WAVE_LAYERS) {
    const tide = Math.sin(t * L.tideSpeed + L.phase) * L.tideAmp * (0.3 + 0.7 * visualPower);
    const driftX = Math.sin(t * L.tideSpeed * 1.7 + L.phase) * L.drift * visualPower;
    const layerAmp = amp * L.ampMul;
    ctx2d.lineWidth = L.width;
    ctx2d.strokeStyle = `rgba(159,216,196,${L.alpha * (0.35 + 0.65 * visualPower)})`;
    ctx2d.shadowColor = `rgba(159,216,196,${0.45 * visualPower})`; ctx2d.shadowBlur = 10 * visualPower;
    ctx2d.beginPath();
    let px = driftX, py = mid + L.yOff + tide + vizCurve[0] * layerAmp;
    ctx2d.moveTo(px, py);
    for (let p = 1; p < VIZ_POINTS; p++) { const x = p * step + driftX, y = mid + L.yOff + tide + vizCurve[p] * layerAmp; ctx2d.quadraticCurveTo(px, py, (px + x) / 2, (py + y) / 2); px = x; py = y; }
    ctx2d.lineTo(px, py); ctx2d.stroke();
  }
  ctx2d.shadowBlur = 0;
  ctx2d.strokeStyle = `rgba(232,227,213,${0.12 + 0.28 * visualPower})`; ctx2d.lineWidth = 0.6; ctx2d.stroke();
}
window.addEventListener("resize", sizeCanvas);
if (window.visualViewport) window.visualViewport.addEventListener("resize", sizeCanvas);
window.addEventListener("orientationchange", () => setTimeout(sizeCanvas, 250));
sizeCanvas();
readDials(true);
pushClock();
