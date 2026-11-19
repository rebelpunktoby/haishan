"""Generates the OMT starter RNBO voice (codebox~) and the Max harness patch from one template."""
import json, pathlib, uuid
OUT = pathlib.Path(__file__).resolve().parent.parent / 'src'

PARAMS = [  # name, default, min, max  (order = codebox inlet order = CONTRACT.md order)
 ('energy',0,0,1),('follow',0,0,1),('form',0,0,1),('still',0,0,1),('height',.5,0,1),('pan',0,-1,1),
 ('storm',0,0,1),('edge',.4,0,1),('room',.7,0,1),('pulse',80,4,200),('root',55,20,880),
 ('ground',1,0,1),('water',0,0,1),('fire',0,0,1),('wind',0,0,1),('level',1,0,1),('hit',0,0,100000000),('hitamt',.6,0,1)]
LAD = [[1,2,3,4,6,5,7,9,11,13],[2,3,4,6,5,10,9,7,14,11],[4,6,7,9,11,13,14,15,17,19],[16,24,32,40,28,36,44,52]]
STRK = [[4,6,8],[10,12,15,18],[14,18,22,26],[32,48]]
SGATE = [.12,.2,.45,.15]; DEC = [5,5,3,7]
NB = 6  # bed partials per world

def code(variant):
    L = []; a = L.append
    a('// OMT instrument · starter voice v0.1 (RNBO codebox~)')
    a('// One instrument, two drivers: parameters follow omt/rnbo/CONTRACT.md.')
    a('// Layers: bed (four world ladders) · line · strike (bell) · storm (Euclidean 16ths) · edge. Space comes after (site hall / your Max space).')
    a('')
    if variant == 'params':
        for n,d,lo,hi in PARAMS: a(f'@param({{min: {lo}, max: {hi}}}) {n} = {d};')
        a('')
    st = ['seed = 12345','sEn = 0','sFol = 0','sForm = 0','sStill = 0','sH = 0.5','sPan = 0','sStorm = 0','sEdge = 0.4',
          'sPulse = 80','sRoot = 55','sW0 = 1','sW1 = 0','sW2 = 0','sW3 = 0','sLvl = 0','breathPh = 0',
          'bph = 0','lineF = 220','lineT = 220','lineEnv = 0','lineAmp = 0','lineDec = 0.9999','linePh = 0',
          'sixPh = 0','sixStep = 0','gateS = 1','lowA = 0','bandA = 0','lowB = 0','bandB = 0',
          'lastHit = 0','bF = 440','bE1 = 0','bE2 = 0','bE3 = 0','bS1 = 0','bS2 = 0','bS3 = 0','bD1 = 0.999','bD2 = 0.999','bD3 = 0.999',
          'bP1 = 0','bP2 = 0','bP3 = 0','bPan = 0']
    st += [f'ph{w}_{i} = {((w*7+i*3)%10)/10}' for w in range(4) for i in range(NB)]
    for s in st: a(f'@state {s};')
    a('')
    a('let sr = samplerate();')
    a('let TAU = 6.283185307179586;')
    a('// inputs (raw from the driver; all smoothing happens here, so the feel is designed in the patch)')
    names = ['pEnergy','pFollow','pForm','pStill','pHeight','pPan','pStorm','pEdge','pRoom','pPulse','pRoot','pW0','pW1','pW2','pW3','pLevel','pHit','pHitAmt']
    for k,(nm,(pn,*_)) in enumerate(zip(names,PARAMS)):
        a(f'let {nm} = {pn if variant=="params" else "in"+str(k+1)};')
    a('let kF = 1 - exp(-1 / (0.03 * sr));   // 30 ms: follows the body')
    a('let kS = 1 - exp(-1 / (0.4 * sr));    // 400 ms: slow things (worlds, root, level)')
    a('let kA = 1 - exp(-1 / (0.003 * sr));  // 3 ms: attacks without clicks')
    for s,p,k in [('sEn','pEnergy','kF'),('sFol','pFollow','kF'),('sForm','pForm','kS'),('sStill','pStill','kS'),('sH','pHeight','kS'),
                  ('sPan','pPan','kS'),('sStorm','pStorm','kF'),('sEdge','pEdge','kS'),('sPulse','pPulse','kS'),('sRoot','pRoot','kS'),
                  ('sW0','pW0','kS'),('sW1','pW1','kS'),('sW2','pW2','kS'),('sW3','pW3','kS'),('sLvl','pLevel','kS')]:
        a(f'{s} = {s} + ({p} - {s}) * {k};')
    a('')
    a('// the strongest world leads the line, the strikes and the storm gate')
    a('let dw = 0; let dv = sW0;')
    for w in (1,2,3): a(f'if (sW{w} > dv) {{ dw = {w}; dv = sW{w}; }}')
    a('')
    a('// ---- 1 · bed: each world is a ladder of partials over the root; form and energy open the ladder, height tilts it bright ----')
    a('let bedOpen = clamp(sForm * 1.2 + sEn * 0.5 + sStill * 0.25, 0, 1) * ' + str(NB) + ';   // stillness lets a few partials ring')
    a('let bedLv = 0.2 + (0.75 * sFol + 0.25 * sForm) * 0.8;')
    a('breathPh = breathPh + 0.1 / sr; if (breathPh >= 1) breathPh = breathPh - 1;')
    a('let swell = 1 + sStill * 0.3 * sin(TAU * breathPh);   // stillness breathes')
    a('let pe = clamp(sPan * 0.5 - 0.3, -1, 1); let po = clamp(sPan * 0.5 + 0.3, -1, 1); let pc = sPan * 0.3;')
    a('let geL = sqrt(0.5 * (1 - pe)); let geR = sqrt(0.5 * (1 + pe));')
    a('let goL = sqrt(0.5 * (1 - po)); let goR = sqrt(0.5 * (1 + po));')
    a('let gcL = sqrt(0.5 * (1 - pc)); let gcR = sqrt(0.5 * (1 + pc));')
    a('let bedL = 0; let bedR = 0; let ny = sr * 0.45;')
    for w in range(4):
        a(f'// world {"土水火風"[w]}')
        for i in range(NB):
            h = LAD[w][i]; wt = round(1/(1+.16*i),4); tilt = f'max(0, 1 + (sH - 0.5) * {round(i/(NB-1)*1.4,3)})'
            v = f'ph{w}_{i}'
            a(f'{v} = {v} + sRoot * {h} / sr; if ({v} >= 1) {v} = {v} - 1;')
            a(f'if (sRoot * {h} < ny) {{ let x = sin(TAU * {v}) * sW{w} * {wt} * clamp(bedOpen - {i} + 1, 0, 1) * {tilt};')
            pan = 'gc' if i == 0 else ('go' if i % 2 else 'ge')
            a(f'  bedL = bedL + x * {pan}L; bedR = bedR + x * {pan}R; }}')
    a('let bedG = bedLv * swell * 0.075;')
    a('bedL = bedL * bedG; bedR = bedR * bedG;')
    a('')
    a('// ---- 2 · line: one voice stepping on the pulse; how often depends on follow, which note on height ----')
    a('let beatSec = 60 / max(4, sPulse);')
    a('bph = bph + 1 / (beatSec * sr);')
    a('if (bph >= 1) {')
    a('  bph = bph - 1;')
    a('  seed = (seed * 16807) % 2147483647; let r1 = seed / 2147483647;')
    a('  seed = (seed * 16807) % 2147483647; let r2 = seed / 2147483647;')
    a('  if (sEn > 0.03 && r1 < 0.15 + sFol * 0.8) {')
    a('    let li = floor(clamp(sH * 4 + r2 * 2, 0, 5));')
    a('    let lh = 1;')
    for w in range(4):
        cond = 'if' if w == 0 else '} else if'
        a(f'    {cond} (dw == {w}) {{')
        for i in range(6): a(f'      if (li == {i}) lh = {LAD[w][i]};')
    a('    }')
    a('    let f = sRoot * lh * 2;')
    a('    if (f < 180) f = f * 2; if (f < 180) f = f * 2; if (f < 180) f = f * 2;')
    a('    if (f > 1400) f = f * 0.5; if (f > 1400) f = f * 0.5; if (f > 1400) f = f * 0.5;')
    a('    lineT = f; lineEnv = 1; lineDec = exp(-1 / (beatSec * 1.5 * sr));')
    a('  }')
    a('}')
    a('lineF = lineF + (lineT - lineF) * kF;   // glide')
    a('lineEnv = lineEnv * lineDec;')
    a('lineAmp = lineAmp + (lineEnv - lineAmp) * kF;')
    a('linePh = linePh + lineF / sr; if (linePh >= 1) linePh = linePh - 1;')
    a('let lx = (sin(TAU * linePh) + 0.15 * sin(2 * TAU * linePh)) * lineAmp * 0.09 * (0.35 + 0.65 * clamp(sFol * 2.5, 0, 1)) * (1 - 0.4 * sStill);')
    a('let lp = clamp(sPan * 0.6, -1, 1);')
    a('let lineL = lx * sqrt(0.5 * (1 - lp)); let lineR = lx * sqrt(0.5 * (1 + lp));')
    a('')
    a('// ---- 3 · strike: every change of `hit` rings one bell, pitched from the leading world ----')
    a('if (pHit != lastHit) {')
    a('  lastHit = pHit;')
    a('  seed = (seed * 16807) % 2147483647; let r3 = seed / 2147483647;')
    a('  seed = (seed * 16807) % 2147483647; let r4 = seed / 2147483647;')
    a('  let sh = 4; let dec = 5;')
    for w in range(4):
        cond = 'if' if w == 0 else '} else if'
        n = len(STRK[w])
        a(f'  {cond} (dw == {w}) {{')
        a(f'    let si = floor(r3 * {n}); dec = {DEC[w]};')
        for i,s in enumerate(STRK[w]): a(f'    if (si == {i}) sh = {s};')
    a('  }')
    a('  let f = sRoot * sh;')
    a('  if (f < 400) f = f * 2; if (f < 400) f = f * 2; if (f < 400) f = f * 2; if (f > 4000) f = f * 0.5;')
    a('  bF = f;')
    a('  let amp = 0.16 * clamp(pHitAmt, 0.25, 1);')
    a('  bE1 = amp; bE2 = amp * 0.18; bE3 = amp * 0.06;')
    a('  bD1 = exp(-1 / (dec * sr)); bD2 = exp(-1 / (dec / 2.003 * sr)); bD3 = exp(-1 / (dec / 3.01 * sr));')
    a('  bPan = clamp(sPan * 0.7 + (r4 - 0.5) * 0.4, -1, 1);')
    a('}')
    a('bE1 = bE1 * bD1; bE2 = bE2 * bD2; bE3 = bE3 * bD3;')
    a('bS1 = bS1 + (bE1 - bS1) * kA; bS2 = bS2 + (bE2 - bS2) * kA; bS3 = bS3 + (bE3 - bS3) * kA;')
    a('bP1 = bP1 + bF / sr; if (bP1 >= 1) bP1 = bP1 - 1;')
    a('bP2 = bP2 + bF * 2.003 / sr; if (bP2 >= 1) bP2 = bP2 - 1;')
    a('bP3 = bP3 + bF * 3.01 / sr; if (bP3 >= 1) bP3 = bP3 - 1;')
    a('let bx = sin(TAU * bP1) * bS1 + sin(TAU * bP2) * bS2 + sin(TAU * bP3) * bS3;')
    a('let bellL = bx * sqrt(0.5 * (1 - bPan)); let bellR = bx * sqrt(0.5 * (1 + bPan));')
    a('')
    a('// ---- 4 · storm: resonant noise, chopped by an even (Euclidean) rhythm on sixteenths that thins as the storm grows ----')
    a('sixPh = sixPh + 4 / (beatSec * sr);')
    a('let sg = 0.12;')
    for w in (1,2,3): a(f'if (dw == {w}) sg = {SGATE[w]};')
    a('if (sixPh >= 1) { sixPh = sixPh - 1; sixStep = (sixStep + 1) % 16; }')
    a('let ek = clamp(floor(16 - (sg * 2.2 + 0.2) * sStorm * 14 + 0.5), 3, 13);')
    a('let gOn = 1;')
    a('if (sStorm > 0.35) { gOn = 0.1; if (floor((sixStep + 1) * ek / 16) != floor(sixStep * ek / 16)) gOn = 1; }')
    a('gateS = gateS + (gOn - gateS) * (1 - exp(-1 / (0.004 * sr)));')
    a('seed = (seed * 16807) % 2147483647; let nz = seed / 1073741823.5 - 1;')
    a('let fcA = clamp(sRoot * 16 * (1 + sH), 200, 5000); let fcB = clamp(fcA * 1.5, 200, 7000);')
    a('let fa = 2 * sin(3.141592653589793 * fcA / sr); let fb = 2 * sin(3.141592653589793 * fcB / sr);')
    a('lowA = lowA + fa * bandA; let hiA = nz - lowA - 0.15 * bandA; bandA = bandA + fa * hiA;')
    a('lowB = lowB + fb * bandB; let hiB = nz - lowB - 0.15 * bandB; bandB = bandB + fb * hiB;')
    a('let stG = sStorm * sStorm * 0.06 * gateS;')
    a('let stormL = bandA * stG; let stormR = bandB * stG;')
    a('')
    a('// ---- 5 · edge and out: drive rises with edge × energy; soft ceiling at about −3 dBFS ----')
    a('let mixL = bedL + lineL + bellL + stormL; let mixR = bedR + lineR + bellR + stormR;')
    a('let drv = sEdge * sEn;')
    a('let dk = 1 + drv * 4;')
    a('mixL = mixL + (tanh(mixL * dk) / dk * 1.5 - mixL) * drv;')
    a('mixR = mixR + (tanh(mixR * dk) / dk * 1.5 - mixR) * drv;')
    a('out1 = 0.7 * tanh(mixL * sLvl * 1.4);')
    a('out2 = 0.7 * tanh(mixR * sLvl * 1.4);')
    return '\n'.join(L) + '\n'

inlet_code = code('inlets'); param_code = code('params')
(OUT/'omt-voice.codebox.js').write_text(param_code)

# ---------- the Max patch: rnbo~ (params → codebox~ → out~) inside a harness that turns IAC CCs into parameters ----------
APP = {"major": 8, "minor": 6, "revision": 0, "architecture": "x64", "modernui": 1}
def box(id_, cls, text=None, rect=(0,0,100,22), ni=1, no=1, ot=None, **kw):
    b = {"id": id_, "maxclass": cls, "numinlets": ni, "numoutlets": no, "patching_rect": list(rect)}
    if ot is not None: b["outlettype"] = ot
    elif no: b["outlettype"] = [""] * no
    if text is not None: b["text"] = text
    b.update(kw); return {"box": b}
def line(s, so, d, di): return {"patchline": {"source": [s, so], "destination": [d, di]}}

# inside rnbo~
rb, rl = [], []
for k,(n,d,lo,hi) in enumerate(PARAMS):
    rb.append(box(f"p{k}", "newobj", f"param {n} @value {d} @min {lo} @max {hi}", (20 + (k % 6) * 150, 20 + (k // 6) * 36, 140, 22), ni=1, no=2))
    rl.append(line(f"p{k}", 0, "cb", k))
rb.append(box("cb", "codebox~", None, (20, 140, 900, 560), ni=len(PARAMS), no=2, ot=["signal", "signal"], code=inlet_code, fontface=0, fontsize=11.0))
rb.append(box("o1", "newobj", "out~ 1", (20, 720, 60, 22), ni=1, no=0))
rb.append(box("o2", "newobj", "out~ 2", (860, 720, 60, 22), ni=1, no=0))
rl += [line("cb", 0, "o1", 0), line("cb", 1, "o2", 0)]
rnbo_patcher = {"fileversion": 1, "appversion": APP, "classnamespace": "rnbo", "rect": [80, 80, 960, 780], "gridsize": [15, 15],
                "boxes": rb, "lines": rl}

ob, ol = [], []
y0 = 70
ob.append(box("title", "comment", "OMT instrument · harness — the Motion page (Chrome, ?midi=1, IAC Driver) plays rnbo~. Turn on audio with the speaker. Double-click rnbo~ to design. Export: see omt/rnbo/CONTRACT.md",
              (20, 15, 900, 34), ni=1, no=0, linecount=2))
CC = [  # cc, lo, hi, param
 (37,0,1,'energy'),(36,0,1,'follow'),(20,0,1,'form'),(24,0,1,'still'),(22,0,1,'height'),(23,-1,1,'pan'),
 (25,0,1,'storm'),(35,0,1,'edge'),(39,0,1,'room'),(40,40,140,'pulse'),(41,0,1,'level')]
for k,(cc,lo,hi,n) in enumerate(CC):
    x = 20 + k * 82
    ob.append(box(f"c{k}", "newobj", f"ctlin {cc} 1", (x, y0, 76, 22), ni=1, no=2))
    ob.append(box(f"s{k}", "newobj", f"scale 0 127 {float(lo)} {float(hi)}", (x, y0 + 30, 76, 22), ni=6, no=1))
    ob.append(box(f"q{k}", "newobj", f"prepend {n}", (x, y0 + 60, 76, 22), ni=1, no=1))
    ol += [line(f"c{k}", 0, f"s{k}", 0), line(f"s{k}", 0, f"q{k}", 0), line(f"q{k}", 0, "rnbo", 0)]
# root from the page's tuning: CC 42 = A4 420–460 → A1
x = 20 + len(CC) * 82
ob += [box("cr", "newobj", "ctlin 42 1", (x, y0, 76, 22), ni=1, no=2), box("sr", "newobj", "scale 0 127 420. 460.", (x, y0 + 30, 76, 22), ni=6, no=1),
       box("dr", "newobj", "/ 8.", (x, y0 + 60, 40, 22), ni=2, no=1), box("qr", "newobj", "prepend root", (x, y0 + 90, 80, 22), ni=1, no=1)]
ol += [line("cr", 0, "sr", 0), line("sr", 0, "dr", 0), line("dr", 0, "qr", 0), line("qr", 0, "rnbo", 0)]
# worlds: CC 27 is a bitmask (土 1, 水 2, 火 4, 風 8); equal power across the worlds that are on
y1 = 210
ob.append(box("cw", "newobj", "ctlin 27 1", (20, y1, 76, 22), ni=1, no=2))
ob.append(box("tw", "newobj", "t i i i i i", (20, y1 + 30, 140, 22), ni=1, no=5))
ol += [line("cw", 0, "tw", 0)]
ob.append(box("nw", "newobj", "expr 1./sqrt(max(1, (($i1>>0)&1)+(($i1>>1)&1)+(($i1>>2)&1)+(($i1>>3)&1)))", (180, y1 + 30, 420, 22), ni=1, no=1))
ol.append(line("tw", 4, "nw", 0))
for w,n in enumerate(['ground','water','fire','wind']):
    x = 20 + w * 150
    ob.append(box(f"bw{w}", "newobj", f"expr (($i1>>{w})&1)*$f2", (x, y1 + 90, 130, 22), ni=2, no=1))
    ob.append(box(f"qw{w}", "newobj", f"prepend {n}", (x, y1 + 120, 100, 22), ni=1, no=1))
    ol += [line("tw", 3 - w, f"bw{w}", 0), line("nw", 0, f"bw{w}", 1), line(f"bw{w}", 0, f"qw{w}", 0), line(f"qw{w}", 0, "rnbo", 0)]
# strikes: the page plays a note on channel 3 per strike; velocity is the strength
y2 = 210
ob += [box("ni", "newobj", "notein 3", (660, y2, 70, 22), ni=1, no=2),
       box("sv", "newobj", "sel 0", (700, y2 + 30, 50, 22), ni=2, no=2),
       box("tv", "newobj", "t b f", (700, y2 + 60, 50, 22), ni=1, no=2),
       box("dv", "newobj", "/ 127.", (760, y2 + 90, 50, 22), ni=2, no=1),
       box("qa", "newobj", "prepend hitamt", (760, y2 + 120, 100, 22), ni=1, no=1),
       box("bt", "button", None, (620, y2 + 60, 24, 24), ni=1, no=1, ot=["bang"]),
       box("ct", "newobj", "counter", (660, y2 + 90, 70, 22), ni=3, no=4),
       box("qh", "newobj", "prepend hit", (660, y2 + 120, 80, 22), ni=1, no=1),
       box("cm2", "comment", "strike (or click)", (560, y2 + 90, 100, 20), ni=1, no=0)]
ol += [line("ni", 1, "sv", 0), line("sv", 1, "tv", 0), line("tv", 1, "dv", 0), line("dv", 0, "qa", 0), line("qa", 0, "rnbo", 0),
       line("tv", 0, "ct", 0), line("bt", 0, "ct", 0), line("ct", 0, "qh", 0), line("qh", 0, "rnbo", 0)]
# defaults on load, and a few hand controls for designing without the page
y3 = 390
ob += [box("lb", "newobj", "loadbang", (20, y3, 70, 22), ni=1, no=1, ot=["bang"]),
       box("df", "message", "root 55, pulse 80, ground 1, level 1, height 0.5, room 0.7, edge 0.4, hitamt 0.6", (20, y3 + 30, 520, 22), ni=2, no=1),
       box("cm3", "comment", "by hand: drag a number, then send it", (580, y3, 260, 20), ni=1, no=0)]
ol += [line("lb", 0, "df", 0), line("df", 0, "rnbo", 0)]
for k,n in enumerate(['energy','follow','form','still','storm']):
    x = 580 + k * 70
    ob += [box(f"fn{k}", "flonum", None, (x, y3 + 30, 60, 22), ni=1, no=2, ot=["", "bang"], minimum=0.0, maximum=1.0, format=6),
           box(f"fp{k}", "newobj", f"prepend {n}", (x, y3 + 60, 66, 22), ni=1, no=1)]
    ol += [line(f"fn{k}", 0, f"fp{k}", 0), line(f"fp{k}", 0, "rnbo", 0)]
y4 = 490
ob.append(box("rnbo", "newobj", "rnbo~", (20, y4, 300, 22), ni=1, no=3, ot=["signal", "signal", "list"],
              patcher=rnbo_patcher, rnboattrcache={}, varname="omt", saved_object_attributes={"optimization": "O1", "parameter_enable": 1, "uuid": str(uuid.uuid4())}))
ob.append(box("dac", "ezdac~", None, (20, y4 + 50, 45, 45), ni=2, no=0))
ob.append(box("cm4", "comment", "space: add your reverb between rnbo~ and the speaker for the Mac set (the site adds its own hall)", (90, y4 + 60, 520, 20), ni=1, no=0))
ol += [line("rnbo", 0, "dac", 0), line("rnbo", 1, "dac", 1)]
top = {"patcher": {"fileversion": 1, "appversion": APP, "classnamespace": "box", "rect": [60, 60, 980, 640], "gridsize": [15, 15],
                   "boxes": ob, "lines": ol}}
(OUT/'omt-instrument.maxpat').write_text(json.dumps(top, indent=1, ensure_ascii=False))
(OUT.parent/'.inlet-code.txt').unlink(missing_ok=True)
print(len(inlet_code.splitlines()), 'lines of codebox;', len(ob), 'boxes')
