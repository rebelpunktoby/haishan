// sky.js — a small, dependency-free sky: where the sun and moon are, the moon's
// phase, sunrise and sunset, true solar time. Low-precision Meeus (Astronomical
// Algorithms, ch. 22/25/28/47). Accuracy: sun ≈ 0.01°, moon ≈ 0.3°, rise/set ≈ 2 min.
// Nothing here reaches the sound engine: it is a reading, not an instrument.

const D2R = Math.PI / 180, R2D = 180 / Math.PI;
const norm = d => ((d % 360) + 360) % 360;
const sin = d => Math.sin(d * D2R), cos = d => Math.cos(d * D2R), tan = d => Math.tan(d * D2R);

export function julianDay(date) { return date.getTime() / 86400000 + 2440587.5; }
const centuries = jd => (jd - 2451545.0) / 36525;

// ---- the sun: apparent ecliptic longitude (Meeus 25) ----
function sunParts(T) {
  const L0 = norm(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
  const M = norm(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
  const e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * sin(M) + (0.019993 - 0.000101 * T) * sin(2 * M) + 0.000289 * sin(3 * M);
  const trueLon = L0 + C;
  const omega = 125.04 - 1934.136 * T;
  const lambda = norm(trueLon - 0.00569 - 0.00478 * sin(omega));
  const eps = 23.4392911 - 0.0130042 * T - 1.64e-7 * T * T + 5.04e-7 * T * T * T + 0.00256 * cos(omega);  // apparent obliquity
  const dec = Math.asin(sin(eps) * sin(lambda)) * R2D;
  // equation of time, minutes (Meeus 28.3)
  const y = tan(eps / 2) ** 2;
  const E = y * sin(2 * L0) - 2 * e * sin(M) + 4 * e * y * sin(M) * cos(2 * L0) - 0.5 * y * y * sin(4 * L0) - 1.25 * e * e * sin(2 * M);
  return { lambda, dec, eot: E * R2D * 4, L0, M };
}
export function sunLongitude(date) { return sunParts(centuries(julianDay(date))).lambda; }

// ---- the moon: ecliptic longitude (Meeus 47, leading terms) ----
export function moonLongitude(date) {
  const T = centuries(julianDay(date));
  const Lp = norm(218.3164477 + 481267.88123421 * T - 0.0015786 * T * T);
  const D = norm(297.8501921 + 445267.1114034 * T - 0.0018819 * T * T);
  const M = norm(357.5291092 + 35999.0502909 * T - 0.0001536 * T * T);
  const Mp = norm(134.9633964 + 477198.8675055 * T + 0.0087414 * T * T);
  const F = norm(93.2720950 + 483202.0175233 * T - 0.0036539 * T * T);
  const E = 1 - 0.002516 * T - 0.0000074 * T * T;
  const sum =
    6.288774 * sin(Mp) + 1.274027 * sin(2 * D - Mp) + 0.658314 * sin(2 * D) + 0.213618 * sin(2 * Mp)
    - 0.185116 * E * sin(M) - 0.114332 * sin(2 * F) + 0.058793 * sin(2 * D - 2 * Mp)
    + 0.057066 * E * sin(2 * D - M - Mp) + 0.053322 * sin(2 * D + Mp) + 0.045758 * E * sin(2 * D - M)
    - 0.040923 * E * sin(M - Mp) - 0.034720 * sin(D) - 0.030383 * E * sin(M + Mp)
    + 0.015327 * sin(2 * D - 2 * F) - 0.012528 * sin(Mp + 2 * F) + 0.010980 * sin(Mp - 2 * F)
    + 0.010675 * sin(4 * D - Mp) + 0.010034 * sin(3 * Mp) + 0.008548 * sin(4 * D - 2 * Mp)
    - 0.007888 * E * sin(2 * D + M - Mp) - 0.006766 * E * sin(2 * D + M) - 0.005163 * sin(D - Mp)
    + 0.004987 * E * sin(D + M) + 0.004036 * E * sin(2 * D - M + Mp) + 0.003994 * sin(2 * D + 2 * Mp)
    + 0.003861 * sin(4 * D) + 0.003665 * sin(2 * D - 3 * Mp);
  return norm(Lp + sum);
}

// ---- phase: elongation from the sun, illuminated fraction, a name ----
export const PHASES = [
  { en: "New moon", zh: "朔" }, { en: "Waxing crescent", zh: "娥眉月" }, { en: "First quarter", zh: "上弦" }, { en: "Waxing gibbous", zh: "盈凸月" },
  { en: "Full moon", zh: "望" }, { en: "Waning gibbous", zh: "虧凸月" }, { en: "Last quarter", zh: "下弦" }, { en: "Waning crescent", zh: "殘月" }
];
export function moonPhase(date) {
  const elong = norm(moonLongitude(date) - sunLongitude(date));
  const lit = (1 - cos(elong)) / 2;
  const idx = Math.floor(((elong + 22.5) % 360) / 45);
  return { elongation: elong, fraction: lit, index: idx, name: PHASES[idx], waxing: elong < 180 };
}

// ---- the sun's sector of the zodiac (a position, nothing more) ----
export const ZODIAC = [
  { en: "Aries", zh: "白羊", g: "♈" }, { en: "Taurus", zh: "金牛", g: "♉" }, { en: "Gemini", zh: "雙子", g: "♊" }, { en: "Cancer", zh: "巨蟹", g: "♋" },
  { en: "Leo", zh: "獅子", g: "♌" }, { en: "Virgo", zh: "處女", g: "♍" }, { en: "Libra", zh: "天秤", g: "♎" }, { en: "Scorpio", zh: "天蠍", g: "♏" },
  { en: "Sagittarius", zh: "射手", g: "♐" }, { en: "Capricorn", zh: "摩羯", g: "♑" }, { en: "Aquarius", zh: "水瓶", g: "♒" }, { en: "Pisces", zh: "雙魚", g: "♓" }
];
export const zodiacOf = lambda => ZODIAC[Math.floor(norm(lambda) / 30)];

// ---- the 24 solar terms are the sun's longitude in 15° steps: 春分 = 0°, 立春 = 315° ----
// Returns the index into a list that starts at 立春 (as JIEQI_24 does).
export const jieqiIndexOf = lambda => Math.floor(norm(lambda - 315) / 15);

// ---- sunrise, sunset, solar noon for a place, on the local calendar day of `date` ----
// Returns Date objects (null when the sun does not rise or set that day).
export function sunTimes(date, lat, lon) {
  const utcMidnight = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()); // local date, as UTC day
  const noonGuess = new Date(utcMidnight + (720 - 4 * lon) * 60000);               // mean solar noon, UTC
  const { dec, eot } = sunParts(centuries(julianDay(noonGuess)));
  const noonMin = 720 - 4 * lon - eot;                                              // minutes after UTC midnight
  const cosH = (sin(-0.833) - sin(lat) * sin(dec)) / (cos(lat) * cos(dec));
  const mk = m => new Date(utcMidnight + m * 60000);
  if (cosH > 1) return { rise: null, set: null, noon: mk(noonMin), polar: "night" };
  if (cosH < -1) return { rise: null, set: null, noon: mk(noonMin), polar: "day" };
  const H = Math.acos(cosH) * R2D;
  return { rise: mk(noonMin - 4 * H), set: mk(noonMin + 4 * H), noon: mk(noonMin), polar: null };
}

// ---- true solar time at a longitude: decimal hours 0–24 ----
export function solarHours(date, lon) {
  const { eot } = sunParts(centuries(julianDay(date)));
  const utcH = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  return ((utcH + lon / 15 + eot / 60) % 24 + 24) % 24;
}

export const DEFAULT_PLACE = Object.freeze({ lat: 19.43, lon: -99.13, en: "Mexico City", zh: "墨西哥城" });
