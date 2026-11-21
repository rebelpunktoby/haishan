// app_v5.js — OceanMountain · the page (v5: the sky follows the sun; night comfort; the breath and the rests are visible)
// The core (engine_core.js) stays the truth. engine_v3.js surrounds it with one breath,
// a room that follows the sun, texture and an environment. This file reads the clock and
// the sky, feeds the stage, and draws the page.
import { OceanMountainV3, DEFAULTS } from "./engine_v3.js?v=2";
import { sunLongitude, moonLongitude, moonPhase, sunTimes, solarHours, jieqiIndexOf, zodiacOf, DEFAULT_PLACE } from "./sky.js?v=1";

// ---------- where: a place for the sun (never stored). The device's time zone picks a city; a tap picks the real spot ----------
const TZ_PLACES = {
  "America/Mexico_City": [19.43, -99.13, "Mexico City", "墨西哥城"], "America/Los_Angeles": [34.05, -118.24, "Los Angeles", "洛杉磯"],
  "America/New_York": [40.71, -74.01, "New York", "紐約"], "America/Chicago": [41.88, -87.63, "Chicago", "芝加哥"], "America/Denver": [39.74, -104.99, "Denver", "丹佛"],
  "America/Vancouver": [49.28, -123.12, "Vancouver", "溫哥華"], "America/Toronto": [43.65, -79.38, "Toronto", "多倫多"], "America/Sao_Paulo": [-23.55, -46.63, "São Paulo", "聖保羅"],
  "Europe/London": [51.51, -0.13, "London", "倫敦"], "Europe/Paris": [48.86, 2.35, "Paris", "巴黎"], "Europe/Berlin": [52.52, 13.41, "Berlin", "柏林"], "Europe/Madrid": [40.42, -3.70, "Madrid", "馬德里"],
  "Asia/Shanghai": [31.23, 121.47, "Shanghai", "上海"], "Asia/Hong_Kong": [22.32, 114.17, "Hong Kong", "香港"], "Asia/Taipei": [25.03, 121.57, "Taipei", "台北"], "Asia/Tokyo": [35.68, 139.69, "Tokyo", "東京"],
  "Asia/Seoul": [37.57, 126.98, "Seoul", "首爾"], "Asia/Singapore": [1.35, 103.82, "Singapore", "新加坡"], "Asia/Bangkok": [13.76, 100.50, "Bangkok", "曼谷"], "Australia/Sydney": [-33.87, 151.21, "Sydney", "雪梨"],
  "Asia/Kolkata": [28.61, 77.21, "Delhi", "德里"], "Asia/Dubai": [25.20, 55.27, "Dubai", "杜拜"], "Africa/Johannesburg": [-26.20, 28.05, "Johannesburg", "約翰尼斯堡"], "Pacific/Auckland": [-36.85, 174.76, "Auckland", "奧克蘭"]
};
function placeFromClock() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone, p = TZ_PLACES[tz];
  if (p) return { lat: p[0], lon: p[1], en: p[2], zh: p[3], tz, mine: false, byClock: false };
  const lon = -new Date().getTimezoneOffset() / 60 * 15;                       // within about half an hour of the true sun
  return { lat: 25, lon, en: "by your clock", zh: "依你的時鐘", tz, mine: false, byClock: true };
}

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

let sleepGain = null;
let audioCtx = null, engine = null, masterGain = null, analyser = null, wetAnalyser = null, airAnalyser = null, wetData = null, wetCurve = null, airBins = null, airLevel = 0, roomLevel = 0;
const GRAINS = Array.from({ length: 70 }, (_, i) => ({ x: (i * 0.618034) % 1, y: 0.12 + ((i * 0.381966) % 1) * 0.5, s: 0.6 + ((i * 7) % 5) / 5, ph: (i * 1.7) % 6.28 }));
let waveData = null, smoothWave = null, frameCount = 0;
const VIZ_POINTS = 128;
const vizCurve = new Float32Array(VIZ_POINTS);
let rmsGlow = 0, visualPower = 0, rafStarted = false;
let clockTimer = null, suspendTimer = null;
let solarMode = true, speakers = true, playing = false, lang = "en";   // 時辰 (true sun + 節氣) is the default; Clock is the other
let place = placeFromClock();
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

// ---------- the moment: one frame for everything the stage hears ----------
// 時辰 mode: hours are true solar hours at the place; the table steps by 時辰 (even rows) and the season by 節氣.
// Clock mode: the device's clock hour and calendar month.
function momentNow(now = new Date()) {
  const lamS = sunLongitude(now), jieqi = jieqiIndexOf(lamS), term = JIEQI_24[jieqi];
  const times = sunTimes(now, place.lat, place.lon);
  const clockH = now.getHours() + now.getMinutes() / 60, solH = solarHours(now, place.lon);
  const toFrame = d => d ? (solarMode ? solarHours(d, place.lon) : d.getHours() + d.getMinutes() / 60) : null;
  const hourF = solarMode ? solH : clockH, riseH = toFrame(times.rise), setH = toFrame(times.set);
  const h = Math.floor(hourF);
  const hour = solarMode ? tcmMeridianHour(h) : h;
  const month = solarMode ? engineMonthFromJieqi(term) : now.getMonth() + 1;
  return { now, hourF, riseH, setH, hour, month, jieqi, term, times, clockH, solH, sc: shichenFor(h), lamS };
}

function pushClock() {
  const m = momentNow();
  if (engine) { engine.setMoment({ hourF: m.hourF, riseH: m.riseH, setH: m.setH, month: m.month, hour: m.hour, jieqi: m.jieqi }); readDials(); }
  const { now, sc, term } = m;
  moTime.textContent = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")} · ${String(now.getMonth() + 1).padStart(2,"0")}.${String(now.getDate()).padStart(2,"0")}`;
  moHour.textContent = `${sc.zh}時`;
  moLine.textContent = lang === "zh" ? sc.line_zh : sc.line_en;
  moTerm.replaceChildren(Object.assign(document.createElement("b"), { textContent: term.zh }), document.createTextNode(lang === "zh" ? "" : "· " + term.en));
  paintSky(m, skyBucket < 0);
}

// ---------- the sky: colour follows the real sun; the season tints it a little; the night is warmer and darker ----------
const lerp = (a, b, t) => a + (b - a) * t;
const hex = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const toHex = v => "#" + v.map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0")).join("");
const mixc = (c1, c2, t) => { const a = hex(c1), b = hex(c2); return toHex(a.map((x, i) => lerp(x, b[i], t))); };
const SKY = {                                   // [top, bottom] — kept dark enough that the light text always reads
  night:   ["#07080F", "#0A0D18"],
  predawn: ["#0B0D1A", "#1E1824"],
  dawn:    ["#1A1D33", "#3D2E36"],
  morning: ["#232B44", "#2C3E4A"],
  noon:    ["#273149", "#2F4752"],
  after:   ["#242C45", "#2C404B"],
  dusk:    ["#221E38", "#4A3028"],
  evening: ["#11121F", "#1F1820"]
};
const smooth01 = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
function skyAt(hF, rise, set) {
  const len = Math.max(1, set - rise), pre = rise - 1.2, post = set + 1.4;
  const pick = (k1, k2, t) => [mixc(SKY[k1][0], SKY[k2][0], smooth01(t)), mixc(SKY[k1][1], SKY[k2][1], smooth01(t))];
  hF = ((hF % 24) + 24) % 24;
  if (hF < pre - 1 || hF >= post + 1) return pick("night", "night", 0);
  if (hF < pre) return pick("night", "predawn", hF - (pre - 1));
  if (hF < rise) return pick("predawn", "dawn", (hF - pre) / (rise - pre));
  const d = (hF - rise) / len;                                   // 0 at sunrise, 1 at sunset
  if (d < 0.18) return pick("dawn", "morning", d / 0.18);
  if (d < 0.45) return pick("morning", "noon", (d - 0.18) / 0.27);
  if (d < 0.72) return pick("noon", "after", (d - 0.45) / 0.27);
  if (d < 1) return pick("after", "dusk", (d - 0.72) / 0.28);
  if (hF < post) return pick("dusk", "evening", (hF - set) / (post - set));
  return pick("evening", "night", hF - post);
}
let skyBucket = -1;
function paintSky(m, force = false) {
  // the sky changes slowly: repaint at most every five minutes (with a slow fade), so a phone's GPU stays quiet
  const bucket = Math.floor(m.now.getTime() / 300000);
  if (!force && bucket === skyBucket) return; skyBucket = bucket;
  const root = document.documentElement.style;
  const rise = m.riseH ?? 6.5, set = m.setH ?? 18, hF = ((m.hourF % 24) + 24) % 24;
  let [top, bot] = skyAt(hF, rise, set);
  // the season, very slightly: cooler toward 冬至, warmer toward 夏至 (sun longitude: R1 input, R3 tint)
  const summer = Math.sin((m.lamS ?? 0) * Math.PI / 180);
  const tint = summer > 0 ? "#3A2A1C" : "#18233A";
  top = mixc(top, tint, Math.abs(summer) * 0.08); bot = mixc(bot, tint, Math.abs(summer) * 0.10);
  root.setProperty("--sky-a", top); root.setProperty("--sky-b", bot);
  // where the light comes from: the sun's arc by day, the moon by night (shown only, never fed to the sound)
  const day = smooth01((hF - (rise - 0.4)) / 1.0) * (1 - smooth01((hF - (set - 0.6)) / 1.0));
  let sx, sy, sc, sa;
  if (day > 0.05) {
    const f = Math.max(0, Math.min(1, (hF - rise) / Math.max(1, set - rise))), alt = Math.sin(Math.PI * f), warmth = 1 - alt;
    sx = 12 + 76 * f; sy = 96 - 62 * alt;                     // never higher than a third down: the light stays off the words
    sc = [lerp(236, 255, warmth), lerp(230, 190, warmth), lerp(214, 140, warmth)].map(Math.round).join(",");
    sa = (0.32 + 0.22 * alt) * day;
  } else {
    const ph = moonPhase(m.now), transit = (12 + ph.elongation / 15) % 24;   // the moon crosses the meridian ≈ elongation/15 h after noon
    let dh = hF - transit; if (dh > 12) dh -= 24; if (dh < -12) dh += 24;
    const up = Math.abs(dh) < 6, f = (dh + 6) / 12, alt = Math.max(0, Math.cos(dh / 6 * Math.PI / 2));
    sx = 12 + 76 * Math.max(0, Math.min(1, f)); sy = 92 - 60 * alt; sc = "200,212,236"; sa = up ? 0.10 + 0.32 * ph.fraction * alt : 0;
  }
  root.setProperty("--sun-x", sx.toFixed(1) + "%"); root.setProperty("--sun-y", sy.toFixed(1) + "%");
  root.setProperty("--sun-c", sc); root.setProperty("--sun-a", sa.toFixed(3));
  root.setProperty("--orb-o", (0.45 + 0.55 * day).toFixed(3));            // the colour fields recede at night
  // night comfort: warmer, darker; deepest at 亥 子 丑
  const night = 1 - day, deep = hF >= 21 ? smooth01((hF - 21) / 1.5) : (hF < 3 ? 1 - smooth01((hF - 1.5) / 1.5) : 0);
  root.setProperty("--warm", (0.035 * night + 0.03 * deep).toFixed(3));
  root.setProperty("--dim", (0.10 * night + 0.22 * deep).toFixed(3));
  setArtwork(m, top, bot);
}

// ---------- the breath and the rests, visible: the veil thins a little on the inhale and settles on a rest ----------
const nightveil = document.querySelector(".nightveil");
let veilLast = -1, restLast = "";
function breatheVeil() {
  if (!engine || !audioCtx || reduceMotion || !nightveil) return;
  const t = audioCtx.currentTime, b = engine.planned && engine.planned.find(x => x.t0 <= t && t < x.t3);
  if (!b) return;
  const inhale = Math.max(0, Math.min(1, (t - b.t0) / b.inhale)), exhale = Math.max(0, Math.min(1, (t - b.t2) / b.exhale));
  const lift = Math.sin(Math.PI * 0.5 * inhale) * (1 - exhale);
  let o = 1 - 0.30 * lift;
  if (b.rest && t >= b.t2) o = Math.min(1.25, o + 0.25 * Math.sin(Math.PI * exhale));
  o = Math.round(Math.min(1, o) * 100) / 100;
  const dimExtra = b.rest && t >= b.t2 ? 0.06 * Math.sin(Math.PI * exhale) : 0;
  if (o !== veilLast) { nightveil.style.opacity = o; veilLast = o; }
  const r = dimExtra.toFixed(2); if (r !== restLast) { nightveil.style.setProperty("--rest", r); restLast = r; }
}

// ---------- the lock screen: artwork for the hour ----------
let artKey = "";
function setArtwork(m, top, bot) {
  if (!("mediaSession" in navigator) || !navigator.mediaSession.metadata) return;
  const key = m.sc.zh + "|" + (m.term?.zh || "") + "|" + top; if (key === artKey) return; artKey = key;
  try {
    const c = document.createElement("canvas"); c.width = c.height = 512; const g = c.getContext("2d");
    const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
    g.strokeStyle = "rgba(159,216,196,.55)"; g.lineWidth = 2; g.beginPath();
    for (let x = 0; x <= 512; x += 8) { const y = 330 + Math.sin(x / 41) * 9 + Math.sin(x / 17) * 3; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    g.fillStyle = "#ECEAF4"; g.textAlign = "center"; g.textBaseline = "middle";
    g.font = '300 150px "Noto Serif TC", serif'; g.fillText(m.sc.zh + "時", 256, 210);
    g.fillStyle = "rgba(236,234,244,.6)"; g.font = '300 40px "Noto Serif TC", serif'; g.fillText(m.term?.zh || "", 256, 410);
    navigator.mediaSession.metadata = new MediaMetadata({ title: `${m.sc.zh}時 · 山海 OceanMountain`, artist: "Haishan Lai", album: "Live · follows the hour",
      artwork: [{ src: c.toDataURL("image/png"), sizes: "512x512", type: "image/png" }, { src: "/og.jpg", sizes: "1200x630", type: "image/jpeg" }] });
  } catch (_) {}
}


// ---------- i18n ----------
const I18N = {
  veil1:{en:"Sound that follows the hour.",zh:"隨時辰而生的聲音。"},
  veil2:{en:"Nothing is composed in advance.",zh:"無預先寫定之樂譜。"},
  begin:{en:"Begin",zh:"開始"},
  r_k:{en:"How it listens",zh:"它如何聆聽"},
  g1:{en:"The outer ring is the year: twenty-four solar terms, the sun walking them. The term sets the ground — low in winter, high in summer.",zh:"外圈是一年。二十四節氣，日行其上。節氣定地——冬沉，夏揚。"},
  g2:{en:"The inner ring is the day: twelve double-hours. Each one leans the pitch and the light — rising toward 午, sinking toward 子.",zh:"內圈是一日。十二時辰，各有所傾——向午而升，向子而沉。"},
  g3:{en:"Between them, the band of daylight from real sunrise to sunset; the room opens with it and closes after dark.",zh:"兩圈之間是晝。自日出至日落，室隨之開，入夜漸閉。"},
  g4:{en:"At the centre, the tide: the day's shape of pitch, drawn from the piece's own hour table. The moon is shown, and does not enter the sound.",zh:"中心是潮——音高一日之形，出自本曲時辰之表。月在其位，不入聲。"},
  s_sun:{en:"Sun",zh:"日"}, s_moon:{en:"Moon",zh:"月"}, s_day:{en:"Day",zh:"晝"}, s_sector:{en:"sector",zh:"宮"},
  k1:{en:"The outer ring: the year, the sun walking its twenty-four terms.",zh:"外環為年，日行二十四節。"},
  k2:{en:"The inner ring: the day, twelve double-hours, each leaning the sound.",zh:"內環為日，十二時辰，各傾其聲。"},
  k3:{en:"Between them, the light that is here now.",zh:"其間，是此刻的光。"},
  k4:{en:"The old texts read each hour through the body; here, only a way of listening.",zh:"古人以身讀時；此處，只是一種聆聽。"},
  s_more:{en:"Read more",zh:"細讀"}, s_now:{en:"Now",zh:"此刻"}, s_sounding:{en:"Sounding",zh:"正在響"},
  s_loc:{en:"use my location",zh:"用我的位置"}, s_mine:{en:"your location",zh:"你的位置"}, s_locno:{en:"location unavailable",zh:"無法取得位置"}, r_more:{en:"Read the ten articles →",zh:"閱讀十條憲章 →"},
  r1t:{en:"Ground · 節氣",zh:"地 · 節氣"}, r1:{en:"The solar term sets the register — low in winter, high in summer.",zh:"節氣定音域——冬低，夏高。"},
  r2t:{en:"Tide · 時辰",zh:"潮 · 時辰"}, r2:{en:"Each double-hour moves the pitch and brightness: rising toward 午, sinking toward 子. The shape on the wheel is that tide.",zh:"每個時辰推動音高與明暗：向午而升，向子而沉。輪上的形狀，就是這道潮。"},
  r3t:{en:"Colour · 四時",zh:"色 · 四時"}, r3:{en:"The day turns through four chords — morning, noon, dusk, night.",zh:"一日流轉四個和弦——晨、午、暮、夜。"},
  r4t:{en:"Breath · Light · Room",zh:"呼吸 · 光 · 空間"}, r4:{en:"Yours. How slowly it breathes, how bright, how large the space.",zh:"由你決定：呼吸多慢、多明亮、空間多大。"}, hint:{en:"Headphones recommended · Starts softly",zh:"建議使用耳機 · 聲音輕輕淡入"},
  c_breath:{en:"Breath",zh:"呼吸"}, c_light:{en:"Light",zh:"光"}, c_room:{en:"Room",zh:"空間"},
  m_phones:{en:"Headphones",zh:"耳機"}, m_speakers:{en:"Speakers",zh:"喇叭"},
  t_std:{en:"Clock",zh:"時鐘"}, t_iching:{en:"時辰",zh:"時辰"}, c_breath_hint:{en:"a breath",zh:"一息"},
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
  try { renderTimer(); } catch (_) {}
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

    engine = new OceanMountainV3(audioCtx);
    engine.env.loadManifest("field/manifest.json");
    masterGain = audioCtx.createGain(); masterGain.gain.value = 0;
    analyser = audioCtx.createAnalyser(); analyser.fftSize = 2048;
    waveData = new Float32Array(analyser.fftSize); smoothWave = new Float32Array(analyser.fftSize);
    sleepGain = audioCtx.createGain(); sleepGain.gain.value = 1;          // the sleep timer's fade lives on the audio clock, so it holds even if the page is throttled
    engine.output.connect(masterGain); masterGain.connect(sleepGain); sleepGain.connect(analyser); analyser.connect(audioCtx.destination);
    wetAnalyser = audioCtx.createAnalyser(); wetAnalyser.fftSize = 2048; wetAnalyser.smoothingTimeConstant = 0.85; engine.wet.connect(wetAnalyser);
    airAnalyser = audioCtx.createAnalyser(); airAnalyser.fftSize = 512; airAnalyser.smoothingTimeConstant = 0.9; engine.air.connect(airAnalyser);
    wetData = new Float32Array(wetAnalyser.fftSize); wetCurve = new Float32Array(VIZ_POINTS); airBins = new Float32Array(airAnalyser.frequencyBinCount);

    setMode(speakers);
    pushClock();
    readDials(true);
    engine.start();
    clockTimer = setInterval(pushClock, 30_000);

    fadeMaster(1, 0.9);                   // breathe in over ~3 s
    playing = true; wake();
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
    scheduleSleep();
  }
}

// ---------- the sleep timer: 20 · 30 min · 1 h · 1 · 2 · 3 時辰, then a slow fade and the sound stops ----------
const TIMER_OPTIONS = [0, 20, 30, 60, 120, 240, 360];          // minutes; 1 時辰 = 2 hours
const timerBtn = $("timerBtn");
let timerIdx = 0, timerEnd = 0, timerFlash = 0;
const fadeSecondsFor = min => Math.min(120, Math.max(45, min * 60 * 0.05));   // 45 s for 20 min … 2 min for the long ones
function timerOptionLabel(min) {
  if (!min) return lang === "zh" ? "定時" : "Timer";
  if (min >= 120) return lang === "zh" ? `${min / 120} 時辰` : `${min / 120} 時辰`;
  if (min === 60) return lang === "zh" ? "1 小時" : "1 h";
  return lang === "zh" ? `${min} 分` : `${min} min`;
}
function remainingLabel(ms) {
  const m = Math.max(0, Math.ceil(ms / 60000));
  if (m >= 60) { const h = Math.floor(m / 60), r = m % 60; return lang === "zh" ? `餘 ${h} 時 ${String(r).padStart(2, "0")} 分` : `– ${h} h ${String(r).padStart(2, "0")}`; }
  return lang === "zh" ? `餘 ${m} 分` : `– ${m} min`;
}
function renderTimer() {
  const min = TIMER_OPTIONS[timerIdx];
  timerBtn.classList.toggle("set", !!min);
  if (!min) { timerBtn.textContent = timerOptionLabel(0); timerBtn.setAttribute("aria-label", "Sleep timer: off. Tap to choose when the sound fades out."); return; }
  const text = Date.now() < timerFlash ? timerOptionLabel(min) : remainingLabel(timerEnd - Date.now());
  if (timerBtn.textContent !== text) timerBtn.textContent = text;
  const end = new Date(timerEnd);
  timerBtn.setAttribute("aria-label", `Sleep timer: the sound fades out at ${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}. Tap for the next option.`);
}
function scheduleSleep() {
  if (!sleepGain || !audioCtx) return;
  const g = sleepGain.gain, t = audioCtx.currentTime, min = TIMER_OPTIONS[timerIdx];
  g.cancelScheduledValues(t); g.setValueAtTime(g.value, t);
  if (!min) { g.linearRampToValueAtTime(1, t + 1.5); return; }
  const remaining = (timerEnd - Date.now()) / 1000, fade = fadeSecondsFor(min);
  if (remaining <= 0.5) { g.linearRampToValueAtTime(0, t + 2); return; }
  if (remaining > fade) { g.linearRampToValueAtTime(1, t + 1.5); g.setValueAtTime(1, t + remaining - fade); }
  g.linearRampToValueAtTime(0, t + remaining);                 // a straight breath out, ending exactly at the time
}
function setTimer(idx) {
  timerIdx = idx; const min = TIMER_OPTIONS[idx];
  timerEnd = min ? Date.now() + min * 60000 : 0;
  timerFlash = min ? Date.now() + 1800 : 0;
  scheduleSleep(); renderTimer();
}
function endTimer() {
  timerIdx = 0; timerEnd = 0;
  if (playing) onPowerToggle();                                // the fade has already brought it to silence; this pauses and lets the device rest
  setTimeout(() => { if (sleepGain && audioCtx) { const t = audioCtx.currentTime; sleepGain.gain.cancelScheduledValues(t); sleepGain.gain.setValueAtTime(1, t + 0.05); } }, 1500);
  renderTimer();
}
timerBtn.addEventListener("click", () => setTimer((timerIdx + 1) % TIMER_OPTIONS.length));
setInterval(() => { if (timerIdx && Date.now() >= timerEnd) endTimer(); else renderTimer(); }, 2000);
renderTimer();
function setMode(spk) {
  speakers = spk;
  modeBtn.setAttribute("aria-pressed", String(spk));
  modeBtn.setAttribute("aria-label", spk ? "Switch to headphone mode" : "Switch to speaker mode");
  if (engine) { engine.setOffsetCap(spk ? CAP_SPEAKERS : CAP_HEADPHONES); engine.setPresence(spk ? 0.5 : 0.35); }
}
function setTimeSystem(solar) {
  solarMode = solar;
  timeBtn.setAttribute("aria-pressed", String(solar));
  timeBtn.setAttribute("aria-label", solar ? "Switch to clock time" : "Switch to 時辰 time (by the sun)");
  pushClock(); if (aboutBox.classList.contains("open")) drawClock();
}
function readDials(immediate = false) {
  $("breathOut").textContent = engine ? `${Math.round(engine.lean.breathPeriod * dials.breath.value / 10)} s` : `${dials.breath.value} s`;
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
const hhmm = d => { if (!d) return "—"; try { return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: place.mine ? undefined : place.tz }).format(d); } catch (_) { return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; } };
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
  const m = momentNow(now), readH = m.hourF;
  const termIdx = m.jieqi, term = m.term, sign = zodiacOf(lamS), sc = m.sc;
  const inFrame = d => d ? (solarMode ? solarHours(d, place.lon) : d.getHours() + d.getMinutes() / 60) : null;
  return { now, lamS, lamM, ph, times, solH: m.solH, clockH: m.clockH, readH, termIdx, term, sign, sc, riseF: inFrame(times.rise), setF: inFrame(times.set) };
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
    const hr = sky.riseF, hs = sky.setF;
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
  $("skySun").textContent = L === "zh" ? `${sky.term.zh} · ${(Math.round(lamS) % 360)}° · ${sign.zh}${t("s_sector")}` : `${sky.term.zh} ${sky.term.en} · ${(Math.round(lamS) % 360)}° · ${sign.en} ${t("s_sector")}`;
  $("skyMoon").textContent = L === "zh" ? `${ph.name.zh} · ${Math.round(ph.fraction * 100)}% · ${(Math.round(lamM) % 360)}°` : `${ph.name.en} · ${Math.round(ph.fraction * 100)}% lit · ${(Math.round(lamM) % 360)}°`;
  const placeName = place.mine ? t("s_mine") : (L === "zh" ? place.zh : place.en);
  $("skyDay").textContent = times.rise ? `↑ ${hhmm(times.rise)} · ↓ ${hhmm(times.set)} · ${placeName}` : `${times.polar === "day" ? (L === "zh" ? "永晝" : "midnight sun") : (L === "zh" ? "永夜" : "polar night")} · ${placeName}`;
  const solTxt = `${String(Math.floor(sky.solH)).padStart(2, "0")}:${String(Math.floor((sky.solH % 1) * 60)).padStart(2, "0")}`;
  $("skyNow").textContent = (L === "zh" ? `${sc.zh}時` : `${sc.zh}時 · ${sc.en}`) + (solarMode ? ` · ${L === "zh" ? "日" : "Sun"} ${solTxt}` : ` · ${L === "zh" ? "時鐘" : "clock"} ${hhmm(now)}`);
  const snd = engine ? engine.env.sounding : [];
  $("skySounding").textContent = snd.length ? snd.map(d => L === "zh" ? d.zh : d.en).join(" · ") : (L === "zh" ? "聲部而已" : "the voices alone");
  $("locBtn").hidden = place.mine; if (place.mine) $("skyPlace").textContent = `${t("s_mine")} · ${Math.abs(place.lat).toFixed(1)}°${place.lat >= 0 ? "N" : "S"} ${Math.abs(place.lon).toFixed(1)}°${place.lon >= 0 ? "E" : "W"}`;
  svg.setAttribute("aria-label", `Now: ${sc.zh} ${sc.en} hour, ${sky.term.en}, sun at ${(Math.round(lamS) % 360)} degrees in ${sign.en}, ${ph.name.en.toLowerCase()}, sunrise ${hhmm(times.rise)}, sunset ${hhmm(times.set)}, ${placeName}.`);
}
// tap or hover a 節氣 tick: name it for a moment
document.addEventListener("pointerdown", e => {
  const hit = e.target.closest && e.target.closest("#wheel .hit"); if (!hit) return;
  const k = +hit.dataset.k, lam = (315 + k * 15) % 360, term = JIEQI_24[k];
  $("skySun").textContent = lang === "zh" ? `${term.zh} · ${lam}°` : `${term.zh} ${term.en} · ${lam}°`;
  document.querySelectorAll("#wheel .tick.tap").forEach(x => x.classList.remove("tap")); const tk = hit.nextElementSibling; if (tk) tk.classList.add("tap");
  clearTimeout(skyBack); skyBack = setTimeout(() => { if (lastSky) drawClock(skyNow()); }, 2600);
});
function startClock() { stopClock(); drawClock(); wheelTimer = setInterval(() => drawClock(), 60000); }
function stopClock() { if (wheelTimer) { clearInterval(wheelTimer); wheelTimer = null; } }
// sunrise and sunset for where you are — asked for on tap, used once, never stored
const locBtn = $("locBtn");
locBtn.addEventListener("click", () => {
  if (!navigator.geolocation) { locBtn.textContent = I18N.s_locno[lang]; return; }
  locBtn.disabled = true;
  navigator.geolocation.getCurrentPosition(
    pos => { place = { lat: pos.coords.latitude, lon: pos.coords.longitude, en: "", zh: "", tz: undefined, mine: true }; pushClock(); drawClock(); },
    () => { locBtn.textContent = I18N.s_locno[lang]; locBtn.disabled = false; },
    { maximumAge: 600000, timeout: 8000 });
});

function setAbout(open) {
  if (open) startClock(); else stopClock();
  aboutBox.classList.toggle("open", open); aboutBox.setAttribute("aria-hidden", String(!open));
  aboutBtn.setAttribute("aria-expanded", String(open));
  setTimeout(() => { (open ? aboutClose : aboutBtn).focus({ preventScroll: true }); if (open) aboutBox.scrollTop = 0; }, 30);
}

// ---------- the page settles: after a while without a touch, the readouts and controls step back ----------
let quietTimer = null;
function wake() { document.body.classList.remove("settled"); clearTimeout(quietTimer); quietTimer = setTimeout(() => { if (playing && !aboutBox.classList.contains("open")) document.body.classList.add("settled"); }, 7000); }
["pointerdown", "pointermove", "keydown", "touchstart"].forEach(ev => window.addEventListener(ev, wake, { passive: true }));

// ---------- wire ----------
initBtn.addEventListener("click", initialize, { once: true });
powerBtn.addEventListener("click", onPowerToggle);
modeBtn.addEventListener("click", () => setMode(!speakers));
timeBtn.addEventListener("click", () => setTimeSystem(!solarMode));
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
  artKey = ""; try { paintSky(momentNow(), true); } catch (_) {}
}
// If the browser or OS pauses the audio (tab hidden, a call, lock screen), bring it back
// as soon as it's allowed. Only an explicit Pause stops the station.
async function keepAlive() {
  if (!audioCtx || !playing) return;
  if (audioCtx.state !== "running") { try { await audioCtx.resume(); pushClock(); scheduleSleep(); } catch (_) {} }
  if (timerIdx && Date.now() >= timerEnd) endTimer();
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
function drawWave(nowMs) {
  requestAnimationFrame(drawWave);
  if (!analyser) return;
  if (frameCount % 2 === 0) breatheVeil();
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
    if (wetAnalyser) {                                   // the room: the wet signal, as a slow envelope band
      wetAnalyser.getFloatTimeDomainData(wetData);
      const wb = Math.floor(wetData.length / VIZ_POINTS); let wsq = 0;
      for (let p = 0; p < VIZ_POINTS; p++) { let m = 0; const base = p * wb; for (let j = 0; j < wb; j++) m = Math.max(m, Math.abs(wetData[base + j])); wetCurve[p] += (m - wetCurve[p]) * 0.03; wsq += m * m; }
      roomLevel += (Math.sqrt(wsq / VIZ_POINTS) - roomLevel) * 0.02;
      airAnalyser.getFloatFrequencyData(airBins); let e = 0; for (let i = 2; i < airBins.length; i++) e += Math.max(0, airBins[i] + 95); airLevel += (Math.min(1, e / (airBins.length * 30)) - airLevel) * 0.03;
    }
  }
  const w = canvas.clientWidth, h = canvas.clientHeight, mid = h / 2;
  const amp = h * 0.30 * (0.15 + 0.85 * visualPower), t = reduceMotion ? 0 : (nowMs || 0);
  // the trail: the canvas is not cleared but faded, so what was drawn decays like the room does
  ctx2d.globalCompositeOperation = "destination-out";
  const fade = reduceMotion ? 1 : 0.16 + 0.10 * (1 - Math.min(1, roomLevel * 6));      // slower fade when the room is fuller
  ctx2d.fillStyle = `rgba(0,0,0,${fade})`; ctx2d.fillRect(0, 0, w, h);
  ctx2d.globalCompositeOperation = "source-over";
  const glowTide = 0.5 + 0.5 * Math.sin(t * 0.00016);
  const glowAlpha = ((0.04 + 0.09 * visualPower) * (0.75 + 0.25 * glowTide) + rmsGlow * 0.10 * visualPower) * fade;   // steady state ≈ the old single-frame glow
  const glow = ctx2d.createRadialGradient(w / 2, mid, 0, w / 2, mid, Math.max(w, h) * (0.45 + 0.12 * glowTide));
  glow.addColorStop(0, `rgba(159,216,196,${Math.min(glowAlpha, 0.2 * fade)})`); glow.addColorStop(1, "rgba(159,216,196,0)");
  ctx2d.fillStyle = glow; ctx2d.fillRect(0, 0, w, h);
  const step = w / (VIZ_POINTS - 1);
  ctx2d.lineJoin = "round"; ctx2d.lineCap = "round"; ctx2d.shadowBlur = 0;
  // — the room: a wide, faint band behind the line, its height the wet envelope —
  if (wetCurve) {
    const settled = document.body.classList.contains("settled") ? 0.4 : 1;
    const band = Math.min(h * 0.46, 170) * visualPower, sway = Math.sin(t * 0.00009) * 4, ba = (0.07 + 0.09 * Math.min(1, roomLevel * 5)) * fade * settled;
    const bg = ctx2d.createLinearGradient(0, mid - band * 0.5, 0, mid + band * 0.5);   // soft edges: the room has no walls you can see
    bg.addColorStop(0, "rgba(143,227,210,0)"); bg.addColorStop(0.5, `rgba(143,227,210,${ba})`); bg.addColorStop(1, "rgba(143,227,210,0)");
    ctx2d.fillStyle = bg;
    ctx2d.beginPath(); ctx2d.moveTo(0, mid + sway);
    for (let p = 0; p < VIZ_POINTS; p++) ctx2d.lineTo(p * step, mid + sway - wetCurve[p] * band - 3);
    for (let p = VIZ_POINTS - 1; p >= 0; p--) ctx2d.lineTo(p * step, mid + sway + wetCurve[p] * band + 3);
    ctx2d.closePath(); ctx2d.fill();
  }
  // — the air: faint grain above the line, denser when the air bed is open —
  if (airLevel > 0.02 && visualPower > 0.2) {
    ctx2d.fillStyle = `rgba(226,222,236,${(0.25 + 0.5 * airLevel) * fade * (document.body.classList.contains("settled") ? 0.4 : 1)})`;
    for (const gr of GRAINS) { const y = mid - gr.y * h * 0.9 + Math.sin(t * 0.0002 * gr.s + gr.ph) * 6, x = (gr.x * w + t * 0.004 * gr.s) % w; const r = 0.6 + 0.9 * airLevel * gr.s; ctx2d.beginPath(); ctx2d.arc(x, y, r, 0, 6.283); ctx2d.fill(); }
  }
  // — the lead: one soft line —
  const tide = Math.sin(t * 0.00012) * 5 * (0.3 + 0.7 * visualPower);
  ctx2d.lineWidth = 1.5; ctx2d.strokeStyle = `rgba(173,226,210,${(0.5 + 0.4 * visualPower) * Math.min(1, fade * 2.2)})`;
  ctx2d.shadowColor = `rgba(143,227,210,${0.4 * visualPower})`; ctx2d.shadowBlur = 9 * visualPower;
  ctx2d.beginPath(); let px = 0, py = mid + tide + vizCurve[0] * amp; ctx2d.moveTo(px, py);
  for (let p = 1; p < VIZ_POINTS; p++) { const x = p * step, y = mid + tide + vizCurve[p] * amp; ctx2d.quadraticCurveTo(px, py, (px + x) / 2, (py + y) / 2); px = x; py = y; }
  ctx2d.lineTo(px, py); ctx2d.stroke(); ctx2d.shadowBlur = 0;
  ctx2d.strokeStyle = `rgba(232,227,213,${(0.10 + 0.22 * visualPower) * Math.min(1, fade * 2.2)})`; ctx2d.lineWidth = 0.5; ctx2d.stroke();
}
window.addEventListener("resize", sizeCanvas);
if (window.visualViewport) window.visualViewport.addEventListener("resize", sizeCanvas);
window.addEventListener("orientationchange", () => setTimeout(sizeCanvas, 250));
sizeCanvas();
readDials(true);
pushClock();
