/* 風雨殿 — the temple as an instrument in space and time.
   A concept model, not a building: lines, glass, air and light. Everything moves from the page's
   shared voice model (window.OMT), so what is seen is what is sounding. */
import {
  Scene, PerspectiveCamera, WebGLRenderer, Color, Fog, Group, BufferGeometry, Float32BufferAttribute,
  LineBasicMaterial, LineDashedMaterial, LineLoop, Line, LineSegments, MeshBasicMaterial, Mesh, PlaneGeometry,
  CylinderGeometry, BoxGeometry, RingGeometry, CircleGeometry, Points, PointsMaterial, AdditiveBlending,
  DoubleSide, Sprite, SpriteMaterial, CanvasTexture, Vector3, MathUtils, SRGBColorSpace
} from 'three';

const O = window.OMT;
const host = document.getElementById('cv3');
const reduceM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let okGL = false; try { const c = document.createElement('canvas'); okGL = !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) {}
if (O && host && okGL && !reduceM) start();

function start() {
  const R = 10, H = 7, SKY = 3;
  const TEAL = new Color('#8ec7b8'), WARM = new Color('#dba84a'), BONE = new Color('#e8e5dc');
  const SEAS = O.SCOL.map(s => { const m = s.match(/(\d+),(\d+),(\d+)/); return new Color(`rgb(${m[1]},${m[2]},${m[3]})`); });
  const mobile = window.innerWidth <= 900;

  const renderer = new WebGLRenderer({ canvas: host, antialias: true, alpha: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(mobile ? 1.25 : 2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = SRGBColorSpace;
  const scene = new Scene();
  scene.background = new Color('#131920');
  scene.fog = new Fog('#131920', 56, 110);
  const camera = new PerspectiveCamera(32, 1, 0.1, 200);

  const add = o => { scene.add(o); return o; };
  const lineMat = (c, op) => new LineBasicMaterial({ color: c, transparent: true, opacity: op, depthWrite: false });
  const glow = (c, op, fog = true) => new MeshBasicMaterial({ color: c, transparent: true, opacity: op, blending: AdditiveBlending, depthWrite: false, side: DoubleSide, fog });
  const az = k => k * Math.PI / 4;                      /* face k: 0 = north, clockwise */
  const P = (a, r, y) => new Vector3(r * Math.sin(a), y, -r * Math.cos(a));
  const loop = (r, y, n, a0) => { const p = []; for (let i = 0; i < n; i++) { const v = P(a0 + i * 2 * Math.PI / n, r, y); p.push(v.x, v.y, v.z); } const g = new BufferGeometry(); g.setAttribute('position', new Float32BufferAttribute(p, 3)); return g; };

  /* ground: compass rings and the eight directions */
  [6, 13, 20, 28].forEach((r, i) => add(new LineLoop(loop(r, 0, 128, 0), lineMat(BONE, .07 - i * .012))));
  { const p = []; for (let k = 0; k < 8; k++) { const a = P(az(k), R + 1, 0), b = P(az(k), 28, 0); p.push(a.x, 0, a.z, b.x, 0, b.z); }
    const g = new BufferGeometry(); g.setAttribute('position', new Float32BufferAttribute(p, 3)); add(new LineSegments(g, lineMat(BONE, .05))); }

  /* the body: an octagonal prism drawn as lines, a dashed inner skin, faint glass faces */
  const oct = (r, y) => loop(r, y, 8, Math.PI / 8);
  add(new LineLoop(oct(R, 0), lineMat(BONE, .38)));
  add(new LineLoop(oct(R, H), lineMat(BONE, .22)));
  { const p = []; for (let k = 0; k < 8; k++) { const v = P(Math.PI / 8 + az(k), R, 0); p.push(v.x, 0, v.z, v.x, H, v.z); }
    const g = new BufferGeometry(); g.setAttribute('position', new Float32BufferAttribute(p, 3)); add(new LineSegments(g, lineMat(BONE, .12))); }
  { const p = []; const RY = H + 2.8; for (let k = 0; k < 8; k++) { const a = P(Math.PI / 8 + az(k), R, H), b = P(Math.PI / 8 + az(k), SKY, RY); p.push(a.x, a.y, a.z, b.x, b.y, b.z); }
    const g = new BufferGeometry(); g.setAttribute('position', new Float32BufferAttribute(p, 3)); add(new LineSegments(g, lineMat(BONE, .13)));
    add(new LineLoop(loop(SKY, H + 2.8, 8, Math.PI / 8), lineMat(BONE, .2))); }
  const skin = new LineLoop(oct(R * .88, .02), new LineDashedMaterial({ color: BONE, transparent: true, opacity: .18, dashSize: .35, gapSize: .5 }));
  skin.computeLineDistances(); add(skin);

  const faceW = 2 * R * Math.sin(Math.PI / 8), apo = R * Math.cos(Math.PI / 8);
  const faces = [];
  for (let k = 0; k < 8; k++) {
    const wind = [2, 3, 6, 7].includes(k), sun = k === 4;
    const m = new Mesh(new PlaneGeometry(faceW, H), glow(sun ? WARM : TEAL, .03));
    const c = P(az(k), apo, H / 2); m.position.copy(c); m.rotation.y = -az(k); add(m);
    faces.push({ k, m, wind, sun });
  }
  /* south light slits */
  const slits = [];
  for (let i = 0; i < 5; i++) {
    const s = new Mesh(new PlaneGeometry(.07, H * .62), glow(WARM, .5));
    const off = (i - 2) * faceW * .16, c = P(az(4), apo + .02, H * .45);
    s.position.set(c.x + off * Math.cos(az(4)), c.y, c.z + off * Math.sin(az(4))); s.rotation.y = -az(4); add(s); slits.push(s);
  }

  /* chambers in the double skin: one tube per colour note, length from pitch */
  const tubes = [];
  O.S.forEach((s, si) => {
    const notes = O.VM.col[si];
    notes.forEach((n, j) => {
      if (n.sh) return;
      const len = Math.min(H - 1, 900 / n.f), a = az(s.face) + (j - 1) * .2, r = R * .94;
      const g = new Mesh(new CylinderGeometry(.16, .16, len, 14, 1, true), glow(SEAS[si], .1));
      const c = P(a, r, .5 + len / 2); g.position.copy(c); add(g);
      const core = new Mesh(new CylinderGeometry(.04, .04, len, 6, 1, true), glow(SEAS[si], .3));
      core.position.copy(c); add(core);
      tubes.push({ n, g, core, si });
    });
  });
  /* the pedal: A 110 as a sunlit and a shaded tube, A 55 as the ground ring */
  const pedalTubes = [az(4), az(0)].map((a, i) => {
    const g = new Mesh(new CylinderGeometry(.3, .3, H - 1.2, 18, 1, true), glow(TEAL, .12));
    g.position.copy(P(a, R * .7, (H - 1.2) / 2 + .3)); add(g); return { g, sunlit: i === 0 };
  });
  const groundRing = new Mesh(new RingGeometry(R * .62, R * .66, 128), glow(TEAL, .2));
  groundRing.rotation.x = -Math.PI / 2; groundRing.position.y = .03; add(groundRing);

  /* the chord in the air: each sounding note a ring, height by pitch, lobes by its place in the A series */
  const yOf = f => .6 + Math.log(f / 55) / Math.log(16) * (H - 1.4);
  const RING_N = 180;
  const rings = [];
  const mkRing = (src, col, ped) => {
    const g = new BufferGeometry(); g.setAttribute('position', new Float32BufferAttribute(new Float32Array(RING_N * 3), 3));
    const l = new LineLoop(g, new LineBasicMaterial({ color: col, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false }));
    add(l); rings.push({ src, l, ped, lob: Math.max(2, Math.round(src.f / 55)), ph: Math.random() * 6 });
  };
  O.VM.ped.forEach(p => mkRing(p, TEAL, true));
  O.VM.col.forEach((arr, si) => arr.forEach(n => mkRing(n, SEAS[si], false)));

  /* skywell: an open ring at the roof, a basin below, nine glass bars hung at their fall heights */
  add(new LineLoop(loop(SKY, H + 2.8, 64, 0), lineMat(BONE, .3)));
  const basin = new Mesh(new CircleGeometry(SKY * .95, 64), glow(TEAL, .06)); basin.rotation.x = -Math.PI / 2; basin.position.y = .02; add(basin);
  const GLF = [330, 440, 495, 550, 605, 660, 715, 770, 880];
  const bars = GLF.map((f, i) => {
    const fall = .6 + .38 * i, y = H - .5 - fall * 1.45, len = 1.2 * 440 / f;
    const a = i * 2 * Math.PI / 9 + .3, c = P(a, 1.55, y);
    const m = new Mesh(new BoxGeometry(.09, len, .5), glow(WARM, .14)); m.position.copy(c); m.rotation.y = -a; add(m);
    const thread = new Line(new BufferGeometry().setFromPoints([new Vector3(c.x, y + len / 2, c.z), new Vector3(c.x, H, c.z)]), lineMat(BONE, .1));
    add(thread);
    return { f, m, hit: 0 };
  });
  const ripples = [];
  for (let i = 0; i < 14; i++) { const m = new Mesh(new RingGeometry(.9, 1, 48), glow(WARM, 0)); m.rotation.x = -Math.PI / 2; m.position.y = .05; add(m); ripples.push({ m, t: -9 }); }
  let ripI = 0;

  /* rain through the skywell, sparse rain outside */
  const RN = mobile ? 160 : 320, rp = new Float32Array(RN * 3), rv = new Float32Array(RN);
  const reseed = (i, inside) => { const a = Math.random() * 6.28, r = inside ? Math.random() * SKY * .9 : R + 2 + Math.random() * 16;
    rp[i * 3] = r * Math.sin(a); rp[i * 3 + 1] = H + 3 + Math.random() * 10; rp[i * 3 + 2] = -r * Math.cos(a); rv[i] = 9 + Math.random() * 5; };
  for (let i = 0; i < RN; i++) reseed(i, i < RN * .45);
  const rainG = new BufferGeometry(); rainG.setAttribute('position', new Float32BufferAttribute(rp, 3));
  const rainM = new PointsMaterial({ color: BONE, size: .11, transparent: true, opacity: 0, depthWrite: false });
  add(new Points(rainG, rainM));

  /* wind: air drawn as moving points, streaming at the active face */
  const WN = mobile ? 380 : 760, wp = new Float32Array(WN * 3), wl = new Float32Array(WN), wo = new Float32Array(WN * 2);
  for (let i = 0; i < WN; i++) { wo[i * 2] = (Math.random() * 2 - 1) * 15; wo[i * 2 + 1] = Math.random() * H * 1.2; wl[i] = Math.random(); }
  const windG = new BufferGeometry(); windG.setAttribute('position', new Float32BufferAttribute(wp, 3));
  const windM = new PointsMaterial({ color: TEAL, size: .16, transparent: true, opacity: .4, blending: AdditiveBlending, depthWrite: false });
  add(new Points(windG, windM));

  /* sun: a disc on its arc and a blade of light across the floor */
  const sunDisc = new Mesh(new CircleGeometry(.6, 32), glow(WARM, .7, false)); add(sunDisc);
  const sunMark = new Mesh(new CircleGeometry(.45, 24), glow(WARM, .8)); sunMark.rotation.x = -Math.PI / 2; add(sunMark);
  const blade = new Mesh(new PlaneGeometry(.35, 1), glow(WARM, .5)); blade.rotation.x = -Math.PI / 2; blade.position.y = .04; add(blade);

  /* trigram labels */
  const TRI = ['坎', '艮', '震', '巽', '離', '坤', '兌', '乾'];
  const labels = TRI.map((t, k) => {
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
    x.font = "500 78px 'Noto Serif TC', serif"; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#e8e5dc'; x.fillText(t, 64, 70);
    const tex = new CanvasTexture(c); tex.colorSpace = SRGBColorSpace;
    const s = new Sprite(new SpriteMaterial({ map: tex, transparent: true, opacity: .5, depthWrite: false, fog: false }));
    s.position.copy(P(az(k), R + 2.6, .9)); s.scale.set(mobile ? 2.1 : 1.6, mobile ? 2.1 : 1.6, 1); add(s); return { s, k, c, tex };
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => labels.forEach(L => {
    const x = L.c.getContext('2d'); x.clearRect(0, 0, 128, 128); x.font = "500 78px 'Noto Serif TC', serif"; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#e8e5dc'; x.fillText(TRI[L.k], 64, 70); L.tex.needsUpdate = true; }));

  /* camera: slow orbit; drag to turn; each passage leans the view toward its part */
  const VIEW = {
    top: [-.55, .6, 50], origin: [-.79, .5, 46], wall: [null, .38, 44], pedal: [null, .2, 42], seasons: [null, .58, 47],
    rain: [null, 1.08, 42], light: [Math.PI + .5, .82, 44], silence: [null, .55, 54], listen: [null, .55, 48], method: [null, .62, 50], next: [null, .6, 50]
  };
  let camA = -.55, camE = .6, camD = 50, drag = null, lastUser = -99, spin = 0;
  host.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, a: camA, e: camE }; host.setPointerCapture(e.pointerId); });
  host.addEventListener('pointermove', e => { if (!drag) return; camA = drag.a - (e.clientX - drag.x) * .008; camE = MathUtils.clamp(drag.e + (e.clientY - drag.y) * .006, .08, 1.25); lastUser = performance.now() / 1000; });
  const end = () => { drag = null; }; host.addEventListener('pointerup', end); host.addEventListener('pointercancel', end);

  function size() {
    const r = host.getBoundingClientRect(); if (!r.width) return;
    renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.updateProjectionMatrix();
  }
  new ResizeObserver(size).observe(host); size();

  const look = new Vector3();
  host.addEventListener('webglcontextlost', e => { e.preventDefault(); document.documentElement.classList.remove('has3d'); });
  let visible = true;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(host);
  let t0 = performance.now() / 1000, prev = t0;
  const seen = new WeakSet();

  function frame() {
    requestAnimationFrame(frame);
    if (!visible || document.hidden || host.offsetParent === null) return;
    const now = performance.now() / 1000, dt = Math.min(.05, now - prev), t = now - t0; prev = now;
    const VM = O.VM, cur = O.cur(), S = O.S[cur], G = O.GU(), gw = G.w, gg = G.G, wa = O.windArc(), ra = O.rainArc();
    const focus = O.focus(), hi = O.hi();

    /* camera */
    const v = VIEW[focus] || VIEW.top, userHold = now - lastUser < 6;
    if (!userHold && !drag) {
      spin += dt * .035;
      let ta = v[0] === null ? az(S.face) + Math.PI + .35 + Math.sin(spin) * .5 : v[0];
      if (focus === 'top' || focus === 'listen' || focus === 'next' || focus === 'method' || focus === 'silence') ta = -.55 + spin;
      const da = Math.atan2(Math.sin(ta - camA), Math.cos(ta - camA)); camA += da * Math.min(1, dt * .6);
      camE += (v[1] - camE) * Math.min(1, dt * .8); camD += (v[2] - camD) * Math.min(1, dt * .8);
    }
    look.set(0, focus === 'rain' ? 2.6 : 3.4, 0); const cd = camD * (camera.aspect < 1 ? 1.12 : 1);
    camera.position.set(look.x + cd * Math.cos(camE) * Math.sin(camA), look.y + cd * Math.sin(camE), look.z - cd * Math.cos(camE) * Math.cos(camA));
    camera.lookAt(look);

    /* faces */
    faces.forEach(F => {
      const act = F.k === S.face, h = F.k === hi;
      const o = F.wind ? (act ? .05 + .1 * gg * (.5 + .5 * gw) : .02) : F.sun ? (O.sun() ? .05 : .02) : .015;
      F.m.material.opacity += ((h ? .07 : o) - F.m.material.opacity) * Math.min(1, dt * 3);
      F.m.material.color.copy(h ? WARM : F.sun ? WARM : TEAL);
    });

    /* tubes and pedal follow their levels */
    tubes.forEach(T => { const L = T.n.L || 0; T.g.material.opacity = .05 + .5 * L; T.core.material.opacity = .12 + 1.4 * L; });
    pedalTubes.forEach((p, i) => { const L = VM.ped[1].L || 0; p.g.material.opacity = (.035 + .12 * L) * (p.sunlit && O.sun() ? 1.25 : 1) * (focus === 'pedal' ? 1.8 : 1); });
    groundRing.material.opacity = (.08 + .3 * (VM.ped[0].L || 0)) * (focus === 'pedal' ? 1.8 : 1);
    groundRing.scale.setScalar(1 + .012 * Math.sin(t * 1.1));

    /* chord rings */
    rings.forEach(Rg => {
      const L = Math.min(1, (Rg.src.L || 0) * (Rg.ped ? .8 : 1.6));
      Rg.l.visible = L > .01; if (!Rg.l.visible) return;
      const y0 = yOf(Rg.src.f), r0 = Rg.ped ? 4.6 : 4.1, amp = (.08 + .5 * L) * (.6 + .8 * gg), sp = t * (.25 + .06 * Rg.lob) + Rg.ph;
      const pos = Rg.l.geometry.attributes.position.array;
      for (let i = 0; i < RING_N; i++) {
        const th = i / RING_N * Math.PI * 2, rr = r0 + amp * Math.sin(Rg.lob * th + sp) * Math.sin(t * (.7 + .05 * Rg.lob) + Rg.ph);
        pos[i * 3] = rr * Math.cos(th); pos[i * 3 + 1] = y0 + amp * .35 * Math.cos(Rg.lob * th + sp); pos[i * 3 + 2] = rr * Math.sin(th);
      }
      Rg.l.geometry.attributes.position.needsUpdate = true;
      Rg.l.material.opacity = (.12 + .8 * L) * (Rg.ped && focus === 'pedal' ? 1.4 : 1);
    });

    /* glass: light the bar each drop strikes, and ring the basin */
    VM.strikes.forEach(s => {
      if (seen.has(s) || s.t > now) return; seen.add(s);
      let bi = 0, bd = 1e9; bars.forEach((b, i) => { const d = Math.abs(b.f - s.f); if (d < bd) { bd = d; bi = i; } });
      bars[bi].hit = Math.max(bars[bi].hit, Math.min(1, .45 + s.gain * 6));
      const rp2 = ripples[ripI++ % ripples.length], a = Math.random() * 6.28, r = Math.random() * SKY * .7;
      rp2.m.position.set(r * Math.sin(a), .05, -r * Math.cos(a)); rp2.t = now; rp2.v = Math.min(1, .4 + s.gain * 6);
    });
    bars.forEach(b => { b.hit *= Math.exp(-dt * 3.2); b.m.material.opacity = .1 + .9 * b.hit * (focus === 'rain' ? 1 : .8); });
    ripples.forEach(r => { const q = (now - r.t) / 1.8; if (q < 0 || q > 1) { r.m.material.opacity = 0; return; } r.m.scale.setScalar(.2 + q * 1.6); r.m.material.opacity = (1 - q) * .6 * (r.v || .5); });

    /* rain */
    const rainOn = O.rain(), rlev = rainOn ? Math.max(ra, focus === 'rain' ? .6 : 0) * Math.min(1, S.rain * 1.4) : 0;
    rainM.opacity += ((rlev > .02 ? .4 + .4 * rlev : 0) - rainM.opacity) * Math.min(1, dt * 2);
    const n = Math.floor(RN * Math.min(1, .15 + rlev));
    for (let i = 0; i < RN; i++) {
      if (i >= n) { rp[i * 3 + 1] = -50; continue; }
      if (rp[i * 3 + 1] < -1) reseed(i, i < RN * .45);
      rp[i * 3 + 1] -= rv[i] * dt; rp[i * 3] += -Math.sin(az(S.face)) * gw * 1.4 * dt; rp[i * 3 + 2] += Math.cos(az(S.face)) * gw * 1.4 * dt;
      if (i < RN * .45 && rp[i * 3 + 1] < .05) reseed(i, true);
    }
    rainG.attributes.position.needsUpdate = true;

    /* wind: from the active face's side, into the face, faster and brighter in gusts */
    const wa0 = az(S.face), dx = -Math.sin(wa0), dz = Math.cos(wa0), px = Math.cos(wa0), pz = Math.sin(wa0), speed = .05 + .22 * gw;
    for (let i = 0; i < WN; i++) {
      wl[i] += dt * speed * (.6 + (i % 7) * .08); if (wl[i] > 1) { wl[i] -= 1; wo[i * 2] = (Math.random() * 2 - 1) * 15; }
      const u = 1 - wl[i] * 2, dist = 34 * u;
      let x = -dx * dist + px * wo[i * 2], z = -dz * dist + pz * wo[i * 2];
      const y = wo[i * 2 + 1] + Math.sin(t * .7 + i) * .15 * gg;
      const inside = Math.hypot(x, z) < R;
      if (inside) { x *= .995; z *= .995; }
      wp[i * 3] = x; wp[i * 3 + 1] = inside && wl[i] > .52 ? -50 : y; wp[i * 3 + 2] = z;
    }
    windG.attributes.position.needsUpdate = true;
    windM.opacity = (.16 + .6 * gw) * (focus === 'silence' ? .3 : 1);
    windM.size = .13 + .12 * gg;

    /* sun: one day every 60 s; the blade runs from the south slits across the floor */
    const day = (t % 60) / 60, sunOn = O.sun(), elev = Math.sin(day * Math.PI) * .95, sa = Math.PI + (day - .5) * 2.4;
    sunDisc.position.copy(P(sa, 34 * Math.cos(elev), 34 * Math.sin(elev) + 1)); sunDisc.lookAt(camera.position);
    sunMark.position.copy(P(sa, 20, .05)); sunMark.material.opacity = sunOn ? .3 + .6 * Math.sin(day * Math.PI) : .12;
    sunDisc.material.opacity = sunOn && elev > .15 ? .2 + .65 * Math.sin(day * Math.PI) : 0;
    const reach = MathUtils.clamp(1.2 / Math.max(.18, Math.tan(elev)), 1.2, R * 1.4), ba = sa + Math.PI;
    const start = P(az(4), apo, .04);
    blade.scale.set(1, reach, 1);
    blade.position.set(start.x + Math.sin(ba) * reach / 2, .04, start.z - Math.cos(ba) * reach / 2);
    blade.rotation.set(-Math.PI / 2, 0, -ba);
    blade.material.opacity = sunOn ? (.15 + .45 * Math.sin(day * Math.PI)) * (focus === 'light' ? 1.6 : 1) : 0;
    slits.forEach(s => { s.material.opacity = sunOn ? .2 + .5 * Math.sin(day * Math.PI) : .08; });

    /* labels */
    labels.forEach(L => { const act = L.k === S.face, h = L.k === hi; L.s.material.opacity = h ? 1 : act ? .95 : L.k === 4 ? .75 : .6;
      L.s.material.color.copy(h ? WARM : act ? TEAL : L.k === 4 ? WARM : BONE); });

    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
  window.OMT.has3d = true;
  document.documentElement.classList.add('has3d');
}
