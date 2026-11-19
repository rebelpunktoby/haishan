// OMT instrument · starter voice v0.1 (RNBO codebox~)
// One instrument, two drivers: parameters follow omt/rnbo/CONTRACT.md.
// Layers: bed (four world ladders) · line · strike (bell) · storm (Euclidean 16ths) · edge. Space comes after (site hall / your Max space).

@param({min: 0, max: 1}) energy = 0;
@param({min: 0, max: 1}) follow = 0;
@param({min: 0, max: 1}) form = 0;
@param({min: 0, max: 1}) still = 0;
@param({min: 0, max: 1}) height = 0.5;
@param({min: -1, max: 1}) pan = 0;
@param({min: 0, max: 1}) storm = 0;
@param({min: 0, max: 1}) edge = 0.4;
@param({min: 0, max: 1}) room = 0.7;
@param({min: 4, max: 200}) pulse = 80;
@param({min: 20, max: 880}) root = 55;
@param({min: 0, max: 1}) ground = 1;
@param({min: 0, max: 1}) water = 0;
@param({min: 0, max: 1}) fire = 0;
@param({min: 0, max: 1}) wind = 0;
@param({min: 0, max: 1}) level = 1;
@param({min: 0, max: 100000000}) hit = 0;
@param({min: 0, max: 1}) hitamt = 0.6;

@state seed = 12345;
@state sEn = 0;
@state sFol = 0;
@state sForm = 0;
@state sStill = 0;
@state sH = 0.5;
@state sPan = 0;
@state sStorm = 0;
@state sEdge = 0.4;
@state sPulse = 80;
@state sRoot = 55;
@state sW0 = 1;
@state sW1 = 0;
@state sW2 = 0;
@state sW3 = 0;
@state sLvl = 0;
@state breathPh = 0;
@state bph = 0;
@state lineF = 220;
@state lineT = 220;
@state lineEnv = 0;
@state lineAmp = 0;
@state lineDec = 0.9999;
@state linePh = 0;
@state sixPh = 0;
@state sixStep = 0;
@state gateS = 1;
@state lowA = 0;
@state bandA = 0;
@state lowB = 0;
@state bandB = 0;
@state lastHit = 0;
@state bF = 440;
@state bE1 = 0;
@state bE2 = 0;
@state bE3 = 0;
@state bS1 = 0;
@state bS2 = 0;
@state bS3 = 0;
@state bD1 = 0.999;
@state bD2 = 0.999;
@state bD3 = 0.999;
@state bP1 = 0;
@state bP2 = 0;
@state bP3 = 0;
@state bPan = 0;
@state ph0_0 = 0.0;
@state ph0_1 = 0.3;
@state ph0_2 = 0.6;
@state ph0_3 = 0.9;
@state ph0_4 = 0.2;
@state ph0_5 = 0.5;
@state ph1_0 = 0.7;
@state ph1_1 = 0.0;
@state ph1_2 = 0.3;
@state ph1_3 = 0.6;
@state ph1_4 = 0.9;
@state ph1_5 = 0.2;
@state ph2_0 = 0.4;
@state ph2_1 = 0.7;
@state ph2_2 = 0.0;
@state ph2_3 = 0.3;
@state ph2_4 = 0.6;
@state ph2_5 = 0.9;
@state ph3_0 = 0.1;
@state ph3_1 = 0.4;
@state ph3_2 = 0.7;
@state ph3_3 = 0.0;
@state ph3_4 = 0.3;
@state ph3_5 = 0.6;

let sr = samplerate();
let TAU = 6.283185307179586;
// inputs (raw from the driver; all smoothing happens here, so the feel is designed in the patch)
let pEnergy = energy;
let pFollow = follow;
let pForm = form;
let pStill = still;
let pHeight = height;
let pPan = pan;
let pStorm = storm;
let pEdge = edge;
let pRoom = room;
let pPulse = pulse;
let pRoot = root;
let pW0 = ground;
let pW1 = water;
let pW2 = fire;
let pW3 = wind;
let pLevel = level;
let pHit = hit;
let pHitAmt = hitamt;
let kF = 1 - exp(-1 / (0.03 * sr));   // 30 ms: follows the body
let kS = 1 - exp(-1 / (0.4 * sr));    // 400 ms: slow things (worlds, root, level)
let kA = 1 - exp(-1 / (0.003 * sr));  // 3 ms: attacks without clicks
sEn = sEn + (pEnergy - sEn) * kF;
sFol = sFol + (pFollow - sFol) * kF;
sForm = sForm + (pForm - sForm) * kS;
sStill = sStill + (pStill - sStill) * kS;
sH = sH + (pHeight - sH) * kS;
sPan = sPan + (pPan - sPan) * kS;
sStorm = sStorm + (pStorm - sStorm) * kF;
sEdge = sEdge + (pEdge - sEdge) * kS;
sPulse = sPulse + (pPulse - sPulse) * kS;
sRoot = sRoot + (pRoot - sRoot) * kS;
sW0 = sW0 + (pW0 - sW0) * kS;
sW1 = sW1 + (pW1 - sW1) * kS;
sW2 = sW2 + (pW2 - sW2) * kS;
sW3 = sW3 + (pW3 - sW3) * kS;
sLvl = sLvl + (pLevel - sLvl) * kS;

// the strongest world leads the line, the strikes and the storm gate
let dw = 0; let dv = sW0;
if (sW1 > dv) { dw = 1; dv = sW1; }
if (sW2 > dv) { dw = 2; dv = sW2; }
if (sW3 > dv) { dw = 3; dv = sW3; }

// ---- 1 · bed: each world is a ladder of partials over the root; form and energy open the ladder, height tilts it bright ----
let bedOpen = clamp(sForm * 1.2 + sEn * 0.5 + sStill * 0.25, 0, 1) * 6;   // stillness lets a few partials ring
let bedLv = 0.2 + (0.75 * sFol + 0.25 * sForm) * 0.8;
breathPh = breathPh + 0.1 / sr; if (breathPh >= 1) breathPh = breathPh - 1;
let swell = 1 + sStill * 0.3 * sin(TAU * breathPh);   // stillness breathes
let pe = clamp(sPan * 0.5 - 0.3, -1, 1); let po = clamp(sPan * 0.5 + 0.3, -1, 1); let pc = sPan * 0.3;
let geL = sqrt(0.5 * (1 - pe)); let geR = sqrt(0.5 * (1 + pe));
let goL = sqrt(0.5 * (1 - po)); let goR = sqrt(0.5 * (1 + po));
let gcL = sqrt(0.5 * (1 - pc)); let gcR = sqrt(0.5 * (1 + pc));
let bedL = 0; let bedR = 0; let ny = sr * 0.45;
// world 土
ph0_0 = ph0_0 + sRoot * 1 / sr; if (ph0_0 >= 1) ph0_0 = ph0_0 - 1;
if (sRoot * 1 < ny) { let x = sin(TAU * ph0_0) * sW0 * 1.0 * clamp(bedOpen - 0 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 0.0);
  bedL = bedL + x * gcL; bedR = bedR + x * gcR; }
ph0_1 = ph0_1 + sRoot * 2 / sr; if (ph0_1 >= 1) ph0_1 = ph0_1 - 1;
if (sRoot * 2 < ny) { let x = sin(TAU * ph0_1) * sW0 * 0.8621 * clamp(bedOpen - 1 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 0.28);
  bedL = bedL + x * goL; bedR = bedR + x * goR; }
ph0_2 = ph0_2 + sRoot * 3 / sr; if (ph0_2 >= 1) ph0_2 = ph0_2 - 1;
if (sRoot * 3 < ny) { let x = sin(TAU * ph0_2) * sW0 * 0.7576 * clamp(bedOpen - 2 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 0.56);
  bedL = bedL + x * geL; bedR = bedR + x * geR; }
ph0_3 = ph0_3 + sRoot * 4 / sr; if (ph0_3 >= 1) ph0_3 = ph0_3 - 1;
if (sRoot * 4 < ny) { let x = sin(TAU * ph0_3) * sW0 * 0.6757 * clamp(bedOpen - 3 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 0.84);
  bedL = bedL + x * goL; bedR = bedR + x * goR; }
ph0_4 = ph0_4 + sRoot * 6 / sr; if (ph0_4 >= 1) ph0_4 = ph0_4 - 1;
if (sRoot * 6 < ny) { let x = sin(TAU * ph0_4) * sW0 * 0.6098 * clamp(bedOpen - 4 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 1.12);
  bedL = bedL + x * geL; bedR = bedR + x * geR; }
ph0_5 = ph0_5 + sRoot * 5 / sr; if (ph0_5 >= 1) ph0_5 = ph0_5 - 1;
if (sRoot * 5 < ny) { let x = sin(TAU * ph0_5) * sW0 * 0.5556 * clamp(bedOpen - 5 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 1.4);
  bedL = bedL + x * goL; bedR = bedR + x * goR; }
// world 水
ph1_0 = ph1_0 + sRoot * 2 / sr; if (ph1_0 >= 1) ph1_0 = ph1_0 - 1;
if (sRoot * 2 < ny) { let x = sin(TAU * ph1_0) * sW1 * 1.0 * clamp(bedOpen - 0 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 0.0);
  bedL = bedL + x * gcL; bedR = bedR + x * gcR; }
ph1_1 = ph1_1 + sRoot * 3 / sr; if (ph1_1 >= 1) ph1_1 = ph1_1 - 1;
if (sRoot * 3 < ny) { let x = sin(TAU * ph1_1) * sW1 * 0.8621 * clamp(bedOpen - 1 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 0.28);
  bedL = bedL + x * goL; bedR = bedR + x * goR; }
ph1_2 = ph1_2 + sRoot * 4 / sr; if (ph1_2 >= 1) ph1_2 = ph1_2 - 1;
if (sRoot * 4 < ny) { let x = sin(TAU * ph1_2) * sW1 * 0.7576 * clamp(bedOpen - 2 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 0.56);
  bedL = bedL + x * geL; bedR = bedR + x * geR; }
ph1_3 = ph1_3 + sRoot * 6 / sr; if (ph1_3 >= 1) ph1_3 = ph1_3 - 1;
if (sRoot * 6 < ny) { let x = sin(TAU * ph1_3) * sW1 * 0.6757 * clamp(bedOpen - 3 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 0.84);
  bedL = bedL + x * goL; bedR = bedR + x * goR; }
ph1_4 = ph1_4 + sRoot * 5 / sr; if (ph1_4 >= 1) ph1_4 = ph1_4 - 1;
if (sRoot * 5 < ny) { let x = sin(TAU * ph1_4) * sW1 * 0.6098 * clamp(bedOpen - 4 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 1.12);
  bedL = bedL + x * geL; bedR = bedR + x * geR; }
ph1_5 = ph1_5 + sRoot * 10 / sr; if (ph1_5 >= 1) ph1_5 = ph1_5 - 1;
if (sRoot * 10 < ny) { let x = sin(TAU * ph1_5) * sW1 * 0.5556 * clamp(bedOpen - 5 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 1.4);
  bedL = bedL + x * goL; bedR = bedR + x * goR; }
// world 火
ph2_0 = ph2_0 + sRoot * 4 / sr; if (ph2_0 >= 1) ph2_0 = ph2_0 - 1;
if (sRoot * 4 < ny) { let x = sin(TAU * ph2_0) * sW2 * 1.0 * clamp(bedOpen - 0 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 0.0);
  bedL = bedL + x * gcL; bedR = bedR + x * gcR; }
ph2_1 = ph2_1 + sRoot * 6 / sr; if (ph2_1 >= 1) ph2_1 = ph2_1 - 1;
if (sRoot * 6 < ny) { let x = sin(TAU * ph2_1) * sW2 * 0.8621 * clamp(bedOpen - 1 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 0.28);
  bedL = bedL + x * goL; bedR = bedR + x * goR; }
ph2_2 = ph2_2 + sRoot * 7 / sr; if (ph2_2 >= 1) ph2_2 = ph2_2 - 1;
if (sRoot * 7 < ny) { let x = sin(TAU * ph2_2) * sW2 * 0.7576 * clamp(bedOpen - 2 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 0.56);
  bedL = bedL + x * geL; bedR = bedR + x * geR; }
ph2_3 = ph2_3 + sRoot * 9 / sr; if (ph2_3 >= 1) ph2_3 = ph2_3 - 1;
if (sRoot * 9 < ny) { let x = sin(TAU * ph2_3) * sW2 * 0.6757 * clamp(bedOpen - 3 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 0.84);
  bedL = bedL + x * goL; bedR = bedR + x * goR; }
ph2_4 = ph2_4 + sRoot * 11 / sr; if (ph2_4 >= 1) ph2_4 = ph2_4 - 1;
if (sRoot * 11 < ny) { let x = sin(TAU * ph2_4) * sW2 * 0.6098 * clamp(bedOpen - 4 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 1.12);
  bedL = bedL + x * geL; bedR = bedR + x * geR; }
ph2_5 = ph2_5 + sRoot * 13 / sr; if (ph2_5 >= 1) ph2_5 = ph2_5 - 1;
if (sRoot * 13 < ny) { let x = sin(TAU * ph2_5) * sW2 * 0.5556 * clamp(bedOpen - 5 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 1.4);
  bedL = bedL + x * goL; bedR = bedR + x * goR; }
// world 風
ph3_0 = ph3_0 + sRoot * 16 / sr; if (ph3_0 >= 1) ph3_0 = ph3_0 - 1;
if (sRoot * 16 < ny) { let x = sin(TAU * ph3_0) * sW3 * 1.0 * clamp(bedOpen - 0 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 0.0);
  bedL = bedL + x * gcL; bedR = bedR + x * gcR; }
ph3_1 = ph3_1 + sRoot * 24 / sr; if (ph3_1 >= 1) ph3_1 = ph3_1 - 1;
if (sRoot * 24 < ny) { let x = sin(TAU * ph3_1) * sW3 * 0.8621 * clamp(bedOpen - 1 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 0.28);
  bedL = bedL + x * goL; bedR = bedR + x * goR; }
ph3_2 = ph3_2 + sRoot * 32 / sr; if (ph3_2 >= 1) ph3_2 = ph3_2 - 1;
if (sRoot * 32 < ny) { let x = sin(TAU * ph3_2) * sW3 * 0.7576 * clamp(bedOpen - 2 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 0.56);
  bedL = bedL + x * geL; bedR = bedR + x * geR; }
ph3_3 = ph3_3 + sRoot * 40 / sr; if (ph3_3 >= 1) ph3_3 = ph3_3 - 1;
if (sRoot * 40 < ny) { let x = sin(TAU * ph3_3) * sW3 * 0.6757 * clamp(bedOpen - 3 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 0.84);
  bedL = bedL + x * goL; bedR = bedR + x * goR; }
ph3_4 = ph3_4 + sRoot * 28 / sr; if (ph3_4 >= 1) ph3_4 = ph3_4 - 1;
if (sRoot * 28 < ny) { let x = sin(TAU * ph3_4) * sW3 * 0.6098 * clamp(bedOpen - 4 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 1.12);
  bedL = bedL + x * geL; bedR = bedR + x * geR; }
ph3_5 = ph3_5 + sRoot * 36 / sr; if (ph3_5 >= 1) ph3_5 = ph3_5 - 1;
if (sRoot * 36 < ny) { let x = sin(TAU * ph3_5) * sW3 * 0.5556 * clamp(bedOpen - 5 + 1, 0, 1) * max(0, 1 + (sH - 0.5) * 1.4);
  bedL = bedL + x * goL; bedR = bedR + x * goR; }
let bedG = bedLv * swell * 0.075;
bedL = bedL * bedG; bedR = bedR * bedG;

// ---- 2 · line: one voice stepping on the pulse; how often depends on follow, which note on height ----
let beatSec = 60 / max(4, sPulse);
bph = bph + 1 / (beatSec * sr);
if (bph >= 1) {
  bph = bph - 1;
  seed = (seed * 16807) % 2147483647; let r1 = seed / 2147483647;
  seed = (seed * 16807) % 2147483647; let r2 = seed / 2147483647;
  if (sEn > 0.03 && r1 < 0.15 + sFol * 0.8) {
    let li = floor(clamp(sH * 4 + r2 * 2, 0, 5));
    let lh = 1;
    if (dw == 0) {
      if (li == 0) lh = 1;
      if (li == 1) lh = 2;
      if (li == 2) lh = 3;
      if (li == 3) lh = 4;
      if (li == 4) lh = 6;
      if (li == 5) lh = 5;
    } else if (dw == 1) {
      if (li == 0) lh = 2;
      if (li == 1) lh = 3;
      if (li == 2) lh = 4;
      if (li == 3) lh = 6;
      if (li == 4) lh = 5;
      if (li == 5) lh = 10;
    } else if (dw == 2) {
      if (li == 0) lh = 4;
      if (li == 1) lh = 6;
      if (li == 2) lh = 7;
      if (li == 3) lh = 9;
      if (li == 4) lh = 11;
      if (li == 5) lh = 13;
    } else if (dw == 3) {
      if (li == 0) lh = 16;
      if (li == 1) lh = 24;
      if (li == 2) lh = 32;
      if (li == 3) lh = 40;
      if (li == 4) lh = 28;
      if (li == 5) lh = 36;
    }
    let f = sRoot * lh * 2;
    if (f < 180) f = f * 2; if (f < 180) f = f * 2; if (f < 180) f = f * 2;
    if (f > 1400) f = f * 0.5; if (f > 1400) f = f * 0.5; if (f > 1400) f = f * 0.5;
    lineT = f; lineEnv = 1; lineDec = exp(-1 / (beatSec * 1.5 * sr));
  }
}
lineF = lineF + (lineT - lineF) * kF;   // glide
lineEnv = lineEnv * lineDec;
lineAmp = lineAmp + (lineEnv - lineAmp) * kF;
linePh = linePh + lineF / sr; if (linePh >= 1) linePh = linePh - 1;
let lx = (sin(TAU * linePh) + 0.15 * sin(2 * TAU * linePh)) * lineAmp * 0.09 * (0.35 + 0.65 * clamp(sFol * 2.5, 0, 1)) * (1 - 0.4 * sStill);
let lp = clamp(sPan * 0.6, -1, 1);
let lineL = lx * sqrt(0.5 * (1 - lp)); let lineR = lx * sqrt(0.5 * (1 + lp));

// ---- 3 · strike: every change of `hit` rings one bell, pitched from the leading world ----
if (pHit != lastHit) {
  lastHit = pHit;
  seed = (seed * 16807) % 2147483647; let r3 = seed / 2147483647;
  seed = (seed * 16807) % 2147483647; let r4 = seed / 2147483647;
  let sh = 4; let dec = 5;
  if (dw == 0) {
    let si = floor(r3 * 3); dec = 5;
    if (si == 0) sh = 4;
    if (si == 1) sh = 6;
    if (si == 2) sh = 8;
  } else if (dw == 1) {
    let si = floor(r3 * 4); dec = 5;
    if (si == 0) sh = 10;
    if (si == 1) sh = 12;
    if (si == 2) sh = 15;
    if (si == 3) sh = 18;
  } else if (dw == 2) {
    let si = floor(r3 * 4); dec = 3;
    if (si == 0) sh = 14;
    if (si == 1) sh = 18;
    if (si == 2) sh = 22;
    if (si == 3) sh = 26;
  } else if (dw == 3) {
    let si = floor(r3 * 2); dec = 7;
    if (si == 0) sh = 32;
    if (si == 1) sh = 48;
  }
  let f = sRoot * sh;
  if (f < 400) f = f * 2; if (f < 400) f = f * 2; if (f < 400) f = f * 2; if (f > 4000) f = f * 0.5;
  bF = f;
  let amp = 0.16 * clamp(pHitAmt, 0.25, 1);
  bE1 = amp; bE2 = amp * 0.18; bE3 = amp * 0.06;
  bD1 = exp(-1 / (dec * sr)); bD2 = exp(-1 / (dec / 2.003 * sr)); bD3 = exp(-1 / (dec / 3.01 * sr));
  bPan = clamp(sPan * 0.7 + (r4 - 0.5) * 0.4, -1, 1);
}
bE1 = bE1 * bD1; bE2 = bE2 * bD2; bE3 = bE3 * bD3;
bS1 = bS1 + (bE1 - bS1) * kA; bS2 = bS2 + (bE2 - bS2) * kA; bS3 = bS3 + (bE3 - bS3) * kA;
bP1 = bP1 + bF / sr; if (bP1 >= 1) bP1 = bP1 - 1;
bP2 = bP2 + bF * 2.003 / sr; if (bP2 >= 1) bP2 = bP2 - 1;
bP3 = bP3 + bF * 3.01 / sr; if (bP3 >= 1) bP3 = bP3 - 1;
let bx = sin(TAU * bP1) * bS1 + sin(TAU * bP2) * bS2 + sin(TAU * bP3) * bS3;
let bellL = bx * sqrt(0.5 * (1 - bPan)); let bellR = bx * sqrt(0.5 * (1 + bPan));

// ---- 4 · storm: resonant noise, chopped by an even (Euclidean) rhythm on sixteenths that thins as the storm grows ----
sixPh = sixPh + 4 / (beatSec * sr);
let sg = 0.12;
if (dw == 1) sg = 0.2;
if (dw == 2) sg = 0.45;
if (dw == 3) sg = 0.15;
if (sixPh >= 1) { sixPh = sixPh - 1; sixStep = (sixStep + 1) % 16; }
let ek = clamp(floor(16 - (sg * 2.2 + 0.2) * sStorm * 14 + 0.5), 3, 13);
let gOn = 1;
if (sStorm > 0.35) { gOn = 0.1; if (floor((sixStep + 1) * ek / 16) != floor(sixStep * ek / 16)) gOn = 1; }
gateS = gateS + (gOn - gateS) * (1 - exp(-1 / (0.004 * sr)));
seed = (seed * 16807) % 2147483647; let nz = seed / 1073741823.5 - 1;
let fcA = clamp(sRoot * 16 * (1 + sH), 200, 5000); let fcB = clamp(fcA * 1.5, 200, 7000);
let fa = 2 * sin(3.141592653589793 * fcA / sr); let fb = 2 * sin(3.141592653589793 * fcB / sr);
lowA = lowA + fa * bandA; let hiA = nz - lowA - 0.15 * bandA; bandA = bandA + fa * hiA;
lowB = lowB + fb * bandB; let hiB = nz - lowB - 0.15 * bandB; bandB = bandB + fb * hiB;
let stG = sStorm * sStorm * 0.06 * gateS;
let stormL = bandA * stG; let stormR = bandB * stG;

// ---- 5 · edge and out: drive rises with edge × energy; soft ceiling at about −3 dBFS ----
let mixL = bedL + lineL + bellL + stormL; let mixR = bedR + lineR + bellR + stormR;
let drv = sEdge * sEn;
let dk = 1 + drv * 4;
mixL = mixL + (tanh(mixL * dk) / dk * 1.5 - mixL) * drv;
mixR = mixR + (tanh(mixR * dk) / dk * 1.5 - mixR) * drv;
out1 = 0.7 * tanh(mixL * sLvl * 1.4);
out2 = 0.7 * tanh(mixR * sLvl * 1.4);
