// Scenes rebuilt on the user's GPT-generated art (Toros illustration style). Cars are our sprites, wheels rolling.
'use strict';
async function gptLoad() {
  await window.ready3;
  const L = [];
  for (const n of ['g_goat', 'g_hen_brown', 'g_hen_white', 'g_hen_black', 'g_factory_in', 'g_factory_yard', 'g_mountain_road', 'g_plateau', 'g_village_road', 'g_mud', 'g_climb', 'g_mud_rain', 'g_bayram', 'g_town', 'g_galata', 'g_house', 'g_crank', 'g_crank_nohand', 'g_crank_hand', 'g_steer']) L.push(loadImg(n, `../assets/sprites/${n}.png`));
  await Promise.all(L);
  return true;
}
// ---------------------------------------------------------------- goat & hens as illustrated sprites
goat = function (g, x, y, s, o = {}) {           // (x,y) hooves on ground, s = px per metre
  const t = o.t ?? 0, bleat = o.bleat ?? 0, dir = o.dir ?? 1, im = IMG.g_goat;
  const h = 1.15 * s, w = im.width * h / im.height;
  const hop = Math.sin(clamp(bleat, 0, 1) * Math.PI) * 0.03 * s;
  g.save(); g.translate(x, y - hop); g.scale(dir, 1);
  g.rotate(-bleat * 0.03);
  g.drawImage(im, -w * 0.5, -h, w, h);
  g.restore();
  if (bleat > 0.3) txt(g, 'MEEE!', x + dir * s * 0.55, y - h - s * 0.05, { size: Math.max(28, s * 0.3), font: 'IBlackI', fill: '#f6eedb', stroke: '#221d18', sw: 8, alpha: clamp((bleat - 0.3) * 3, 0, 1), rot: -0.12 * dir });
};
const HEN = { '#a65a2e': 'g_hen_brown', '#efe6d6': 'g_hen_white', '#3a2a20': 'g_hen_black' };
pChicken = function (g, X, z, t, ph = 0, col = '#a65a2e') {
  const [x, y] = P3(X, 0, z), s = PV.f / z, im = IMG[HEN[col] || 'g_hen_brown'];
  const h = 0.42 * s, w = im.width * h / im.height, bob = Math.abs(Math.sin(t * 5 + ph)) * 0.015 * s;
  const dir = (Math.floor(t * 0.5 + ph) % 2) ? -1 : 1;
  g.save(); g.translate(x, y - bob); g.scale(dir, 1); g.drawImage(im, -w / 2, -h, w, h); g.restore();
};
// ---------------------------------------------------------------- K2 Bursa plant (GPT interior + yard)
K.k2 = (g, t) => {
  const lt = t - 3.5;
  if (lt < 3.3) {
    const z = 1 + lt * 0.012; g.save(); g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-W / 2, -H / 2);
    g.drawImage(IMG.g_factory_in, 0, 0, W, H);
    const ppm = 150, v = 1.6, gy = 1222;
    const cars = [['sedan', 'green', -6.2], ['station', 'red', -0.6], ['sedan', 'blue', 5.0]];
    const TX = 758, TY = 958;   // torch tip in the art
    let weld = false;
    for (const [k, c, x0] of cars) {
      const d = x0 + lt * v, x = d * ppm;
      if (x > -700 && x < W + 700) drawCar(g, { kind: k, color: c, x, gy, ppm, dist: d, v, t, noExhaust: true, bob: 0.2 });
      if (Math.abs(x - TX) < 200) weld = true;
    }
    if (weld) {
      for (let i = 0; i < 46; i++) { const ph = (lt * 2.6 + hash(i)) % 1, an = -Math.PI * (0.1 + 0.8 * hash(i + 1)), sp = 120 + 150 * hash(i + 2);
        const sx = TX + Math.cos(an) * ph * sp, sy = TY + 6 + Math.sin(an) * ph * sp + ph * ph * 280; g.fillStyle = `rgba(255,${190 + 60 * hash(i)},110,${1 - ph})`; g.fillRect(sx, sy, 4, 4); }
      const gl = g.createRadialGradient(TX, TY + 6, 0, TX, TY + 6, 95); gl.addColorStop(0, `rgba(215,232,255,${0.8 + 0.2 * Math.sin(lt * 50)})`); gl.addColorStop(1, 'rgba(215,232,255,0)'); g.fillStyle = gl; g.beginPath(); g.arc(TX, TY + 6, 95, 0, 7); g.fill();
    }
    g.restore();
  } else {
    const ly = lt - 3.3, z = 1 + ly * 0.01;
    g.save(); g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-W / 2, -H / 2);
    g.drawImage(IMG.g_factory_yard, 0, 0, W, H);
    // new cars leave the plant in both lanes: every colour, both body styles
    const far = [['station', 'white'], ['sedan', 'red'], ['station', 'blue'], ['sedan', 'black'], ['station', 'green']];
    const near = [['sedan', 'green'], ['station', 'black'], ['sedan', 'white'], ['station', 'red'], ['sedan', 'blue']];
    const lane = (list, gy, ppm, v, gap, off) => list.forEach(([k, c], i) => { const d = ly * v + off - i * gap, x = -560 + d * ppm; if (x > -600 && x < W + 600) drawCar(g, { kind: k, color: c, x, gy, ppm, dist: d, v, t, noExhaust: true, bob: 0.4 }); });
    lane(far, 1246, 104, 2.6, 6.2, 6.0);
    lane(near, 1356, 118, 3.0, 6.4, 3.2);
    g.restore();
  }
  chip(g, 'BURSA · 1971', W / 2, 300, { size: 56, bg: '#1b1713', fill: '#ffd84a', border: '#ffd84a', ls: 3, k: 0.7 + 0.3 * easeOutBack(seg(lt, 0, 0.3)) });
  kCaptions(g, t, 1600);
};

function bgPan(g, img, lt, zoomRate = 0.006) { const z = 1 + lt * zoomRate; g.save(); g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-W / 2, -H / 2); g.drawImage(img, 0, 0, W, H); g.restore(); }
// K1 0–3.5 mountain road (GPT) – white Toros A -> B, goat on the roof
K.k1 = (g, t, noText) => {
  const lt = t, ppm = 175, dist = MK1.pos(lt);
  bgPan(g, IMG.g_mountain_road, lt, 0.004);
  const x = 250 + dist * ppm * 0.55;
  drawCar(g, { kind: 'station', color: 'white', x, gy: 1440, ppm, dist, v: 2.6, t, onBody: (gg, left, top, s) => {
    goat(gg, left + 700 * s, top + 14 * s, ppm * 0.95, { t, bleat: Math.max(0, Math.sin(clamp((t - 0.35) / 0.9, 0, 1) * Math.PI)), dir: 1 });
  } });
  if (!noText) {
    const kb = seg(t, 0.08, 0.3);
    const tg = g.createLinearGradient(0, 220, 0, 760); tg.addColorStop(0, 'rgba(15,12,10,0)'); tg.addColorStop(0.25, `rgba(15,12,10,${0.45 * kb})`); tg.addColorStop(0.8, `rgba(15,12,10,${0.45 * kb})`); tg.addColorStop(1, 'rgba(15,12,10,0)');
    g.fillStyle = tg; g.fillRect(0, 220, W, 540);
    bigWord(g, 'BU ARABAYA NEDEN', t, 0.12, 3.5, 380, { size: 76, fill: '#fff', sw: 14 });
    bigWord(g, 'DAĞ KEÇİSİ', t, 0.55, 3.5, 520, { size: 150, sw: 22, rot: -0.03 });
    bigWord(g, 'DEDİLER?', t, 1.1, 3.5, 640, { size: 96, fill: '#fff', sw: 16 });
  }
  return dist;
};
// K4 12–17.5 plateau with the Taurus range (GPT) – white Toros A -> B, TOROS reveal
K.k4 = (g, t, noBig) => {
  const lt = t - 12, ppm = 165, d = MK4.pos(lt);
  bgPan(g, IMG.g_plateau, lt, 0.004);
  drawCar(g, { kind: 'station', color: 'white', x: -470 + d * ppm, gy: 1392, ppm, dist: d, v: 2.3, t });
  const kt = noBig ? 0 : seg(lt, 2.3, 2.55);
  if (kt > 0) {
    g.save(); g.translate(W / 2, 560); const s2 = 1 + (1 - easeOut(kt)) * 1.8; g.scale(s2, s2); g.globalAlpha = kt;
    g.font = '230px IBlack'; g.textAlign = 'center'; g.lineJoin = 'round';
    g.lineWidth = 26; g.strokeStyle = '#111'; g.strokeText('TOROS', 0, 0); g.fillStyle = '#ffd84a'; g.fillText('TOROS', 0, 0);
    g.restore();
  }
  kCaptions(g, t, 1600);
  return d;
};
// K6 20.5–23.7 village lane (GPT) – green Toros comes down the lane toward the camera
K.k6 = (g, t) => {
  const lt = t - 20.5, HZ = 945, VX = 538;
  bgPan(g, IMG.g_village_road, lt, 0.008);
  const k = smooth(lt / 3.2), y = lerp(1010, 1640, k * k * 0.4 + k * 0.6);   // accelerating toward us
  const roadW = 1060 * (y - HZ) / (1920 - HZ);
  const x = VX + (y - HZ) * 0.02;
  const dist = (y - 1010) / 60;
  frontCar(g, IMG.front_green, x, y, roadW * 0.56, t, dist, { dust: true });
  kCaptions(g, t, 1700);
  return dist;
};
// K8 26.9–30.1 muddy field track (GPT) – white Toros A -> B through the mud, splashes
K.k8 = (g, t) => {
  const lt = t - 26.9, ppm = 170, d = MK8.pos(lt);
  bgPan(g, IMG.g_mud_rain, lt, 0.004);
  const md = model('station'), s = ppm / md.m.pxPerM;
  const car = drawCar(g, { kind: 'station', color: 'white', x: -460 + d * ppm, gy: 1430, ppm, dist: d, v: 2.9, t, bodyOver: KV.mud, bodyOverA: clamp(0.25 + lt / 2.2, 0, 1), noExhaust: true });
  for (const wx of md.m.wheels.map(w => car.left + w[0] * s)) for (let i = 0; i < 22; i++) {
    const ph = (lt * 2.4 + hash(i + wx)) % 1, px = wx - 40 - ph * 240 - hash(i * 2) * 60, py = 1415 - Math.sin(ph * Math.PI) * (70 + hash(i * 3) * 110);
    g.fillStyle = `rgba(92,62,32,${0.9 * (1 - ph)})`; g.beginPath(); g.ellipse(px, py, 7 + hash(i) * 8, 5 + hash(i + 1) * 5, ph * 3, 0, 7); g.fill();
  }
  kCaptions(g, t, 1620);
  return d;
};

// K7 23.7–26.9 bayram road at sunset (GPT) – blue Toros with luggage drives away from camera
K.k7 = (g, t) => {
  const lt = t - 23.7, HZ = 936, VX = 540;
  bgPan(g, IMG.g_bayram, lt, 0.01);
  const k = lt / 3.2, y = lerp(1400, 1080, 1 - Math.pow(1 - k, 1.4));
  const roadW = 3.31 * (y - HZ), x = VX + roadW * 0.2, wpx = roadW * 0.24;
  const im = IMG.rear_blue, s = wpx / im.width, top = y - im.height * s, bob = Math.sin(lt * 11) * wpx * 0.003;
  g.drawImage(im, x - wpx / 2, top - bob, wpx, im.height * s);
  const L = (x0, y0, w, h, col) => { g.beginPath(); g.roundRect(x - wpx / 2 + x0 * s, top - bob + y0 * s, w * s, h * s, 10 * s); g.fillStyle = col; g.fill(); g.strokeStyle = '#221d18'; g.lineWidth = 3 * s; g.stroke(); };
  L(150, -120, 300, 130, '#8a4b2f'); L(470, -150, 260, 160, '#2f5d7a'); L(250, -230, 420, 110, '#c2873e'); L(720, -90, 120, 100, '#6b6f3a');
  g.strokeStyle = '#e9e1cf'; g.lineWidth = 5 * s; for (const xx of [300, 600]) { g.beginPath(); g.moveTo(x - wpx / 2 + xx * s, top - bob + 15 * s); g.lineTo(x - wpx / 2 + xx * s, top - bob - 235 * s); g.stroke(); }
  for (let i = 0; i < 5; i++) { const ph = (lt * 1.8 + i / 5) % 1; g.fillStyle = `rgba(240,235,225,${0.35 * (1 - ph)})`; g.beginPath(); g.arc(x - wpx / 2 + 200 * s - ph * 40 * s, y - 70 * s - ph * 50 * s, (20 + ph * 60) * s, 0, 7); g.fill(); }
  kCaptions(g, t, 1700);
  return lt * 3.1;
};
// K10 33.3–36.5 mountain track climb (GPT) – red Toros climbs the slope, goat on the big boulder
K.k10 = (g, t) => {
  const lt = t - 33.3, d = MK10.pos(lt);
  bgPan(g, IMG.g_climb, lt, 0.004);
  const th = Math.atan2(1370 - 1010, 1080), ppm = 150;
  const u = -260 + d * ppm, ox = u * Math.cos(th), oy = 1370 - u * Math.sin(th);
  g.save(); g.translate(ox, oy); g.rotate(-th);
  drawCar(g, { kind: 'station', color: 'red', x: 0, gy: 0, ppm, dist: d, v: 2.2, t });
  g.restore();
  goat(g, 770, 1318, 160, { t, bleat: Math.max(0, Math.sin(clamp((lt - 1.0) / 0.9, 0, 1) * Math.PI)), dir: -1 });
  kCaptions(g, t, 1800);
  return d;
};

// K13 42.5–45.5 village house (GPT) – white Toros parked in the yard, starts up
K.k13 = (g, t) => {
  const lt = t - 42.5;
  bgPan(g, IMG.g_house, lt, 0.006);
  const im = IMG.front, wpx = 640, s = wpx / im.width, h = im.height * s, gy = 1760, x = 560;
  const start = lt > 2.3, shake = start ? Math.sin(lt * 70) * 2 * Math.exp(-(lt - 2.3) * 3) : 0;
  g.drawImage(im, x - wpx / 2 + shake, gy - h, wpx, h);
  if (start) for (const hx of [-0.36, -0.24, 0.24, 0.36]) { const gl = g.createRadialGradient(x + hx * wpx, gy - h * 0.43, 0, x + hx * wpx, gy - h * 0.43, 80); gl.addColorStop(0, 'rgba(255,250,215,0.9)'); gl.addColorStop(1, 'rgba(255,250,215,0)'); g.fillStyle = gl; g.beginPath(); g.arc(x + hx * wpx, gy - h * 0.43, 80, 0, 7); g.fill(); }
  if (start) txt(g, 'VINNN!', 860, 1180, { size: 70, font: 'IBlackI', fill: '#ffd84a', stroke: '#111', sw: 12, alpha: seg(lt, 2.3, 2.5), rot: -0.1 });
  if (lt > 1.0 && lt < 2.2) txt(g, 'TIK TIK', 870, 1420, { size: 50, font: 'IBlackI', fill: '#fff', stroke: '#111', sw: 10, alpha: Math.sin(lt * 9) > 0 ? 1 : 0.45, rot: -0.1 });
  kCaptions(g, t, 1850);
};
// K14 45.5–48.5 Galata (GPT) – yellow taxi A -> B on the seaside road
K.k14 = (g, t) => {
  const lt = t - 45.5, ppm = 150, d = MK14.pos(lt);
  bgPan(g, IMG.g_galata, lt, 0.004);
  drawCar(g, { kind: 'sedan', color: 'taxi', x: -200 + d * ppm, gy: 1478, ppm, dist: d, v: 3.4, t });
  kCaptions(g, t, 1700);
  return d;
};
// K15 48.5–51 town street (GPT) – police Toros A -> B, light bar flashing
K.k15 = (g, t) => {
  const lt = t - 48.5, ppm = 150, d = MK15.pos(lt);
  bgPan(g, IMG.g_town, lt, 0.004);
  drawCar(g, { kind: 'station', color: 'police', x: -220 + d * ppm, gy: 1482, ppm, dist: d, v: 3.2, t });
  const ph = Math.floor(t * 6) % 2; g.fillStyle = ph ? 'rgba(40,90,255,0.07)' : 'rgba(255,40,40,0.07)'; g.fillRect(0, 0, W, H);
  kCaptions(g, t, 1700);
  return d;
};
// K16 51–54.5 town street (GPT) – two-way traffic, all colours + taxis
K.k16 = (g, t) => {
  const lt = t - 51;
  bgPan(g, IMG.g_town, lt, 0.004);
  const ppmB = 112, vB = 3.0;
  TRAFFIC_L.forEach(([k, c, off]) => { const d = (lt + off) * vB, xr = -1820 + d * ppmB; if (xr < -500 || xr > W + 500) return;
    g.save(); g.translate(W, 0); g.scale(-1, 1); drawCar(g, { kind: k, color: c, x: xr, gy: 1372, ppm: ppmB, dist: d, v: vB, t, noExhaust: true }); g.restore(); });
  const ppmF = 140, vF = 3.2;
  TRAFFIC_R.forEach(([k, c, off]) => { const xx = -2180 + ((lt + off) * vF) * ppmF; if (xx < -500 || xx > W + 500) return;
    drawCar(g, { kind: k, color: c, x: xx, gy: 1488, ppm: ppmF, dist: (lt + off) * vF, v: vF, t }); });
  bigWord(g, 'HALKIN ARABASI', t, 51.15, 54.5, 400, { size: 120, sw: 20 });
  kCaptions(g, t, 1700);
};

// K11 36.5–39.5 driver's seat (GPT) – heavy unassisted steering: whole view rocks and strains around the wheel hub
K.k11 = (g, t) => {
  const lt = t - 36.5, eff = Math.sin(lt * 2.1), jolt = Math.sin(lt * 47) * 2.5 * Math.abs(eff);
  const z = 1.06 + lt * 0.01;
  g.save(); g.translate(540 + jolt, 1395); g.rotate(eff * 0.035); g.scale(z, z); g.translate(-540, -1395);
  g.drawImage(IMG.g_steer, 0, 0, W, H); g.restore();
  txt(g, 'ZORLA DÖNER!', W / 2, 260, { size: 74, font: 'IBlackI', fill: '#fff', stroke: '#111', sw: 14, alpha: seg(lt, 0.3, 0.6) * (0.55 + 0.45 * Math.abs(eff)), rot: -0.06 });
  kCaptions(g, t, 1820);
};
// K12 39.5–42.5 crank window (GPT): glass starts CLOSED, crank turns 3 times, glass slides down out of sight
const WIN_OPEN = [[0, 118], [300, 150], [560, 200], [700, 270], [800, 390], [870, 600], [920, 820], [945, 960], [0, 1000]];
K.k12 = (g, t) => {
  const lt = t - 39.5, k = smooth(seg(lt, 0.25, 2.55)), turning = k > 0.001 && k < 0.999;
  const z = 1 + lt * 0.012;
  g.save(); g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-W / 2, -H / 2);
  g.drawImage(turning ? IMG.g_crank_nohand : IMG.g_crank, 0, 0, W, H);
  // glass: tinted pane with reflections, top edge parallel to the frame, travelling down below the sill
  const dy = k * 900;
  if (dy < 890) {
    g.save(); g.beginPath(); WIN_OPEN.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.clip();
    g.translate(0, dy);
    g.beginPath(); WIN_OPEN.slice(0, 8).forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.lineTo(1000, 2200); g.lineTo(-10, 2200); g.closePath();
    g.fillStyle = 'rgba(170,195,205,0.22)'; g.fill();
    g.save(); g.clip(); g.fillStyle = 'rgba(255,255,255,0.14)';
    for (const [x0, w0] of [[60, 80], [210, 30], [420, 110]]) { g.beginPath(); g.moveTo(x0 + 300, 100); g.lineTo(x0 + 300 + w0, 100); g.lineTo(x0 + w0 - 200, 1100); g.lineTo(x0 - 200, 1100); g.closePath(); g.fill(); }
    g.restore();
    g.beginPath(); WIN_OPEN.slice(0, 8).forEach(([x, y], i) => i ? g.lineTo(x, y + 4) : g.moveTo(x, y + 4));
    g.lineWidth = 6; g.strokeStyle = 'rgba(40,40,40,0.5)'; g.stroke(); g.lineWidth = 2.5; g.strokeStyle = 'rgba(245,248,250,0.9)'; g.stroke();
    g.restore();
  }
  if (turning) {
    const P = [704, 1262], G0 = [644, 1448], th = k * 3 * Math.PI * 2;
    const vx = G0[0] - P[0], vy = G0[1] - P[1];
    const G = [P[0] + vx * Math.cos(th) - vy * Math.sin(th), P[1] + vx * Math.sin(th) + vy * Math.cos(th)];
    // chrome crank arm (bevelled), hub cap, knob
    const ang = Math.atan2(G[1] - P[1], G[0] - P[0]), len = Math.hypot(G[0] - P[0], G[1] - P[1]);
    g.save(); g.translate(P[0], P[1]); g.rotate(ang);
    g.beginPath(); g.roundRect(-30, -24, len + 30, 48, 22); g.fillStyle = '#2a2826'; g.fill();
    const ag = g.createLinearGradient(0, -20, 0, 20); ag.addColorStop(0, '#f4f6f8'); ag.addColorStop(0.45, '#aeb4ba'); ag.addColorStop(1, '#5e646a');
    g.beginPath(); g.roundRect(-26, -20, len + 22, 40, 18); g.fillStyle = ag; g.fill();
    g.restore();
    g.save(); g.translate(P[0], P[1]); g.rotate(ang); g.beginPath(); g.roundRect(-40, -30, 80, 60, 26); const hg = g.createLinearGradient(0, -30, 0, 30); hg.addColorStop(0, '#f6f8fa'); hg.addColorStop(0.5, '#b4bac0'); hg.addColorStop(1, '#6c737a'); g.fillStyle = hg; g.fill(); g.lineWidth = 3; g.strokeStyle = '#2a2826'; g.stroke(); g.restore();
    g.beginPath(); g.arc(G[0], G[1], 34, 0, 7); const kg = g.createRadialGradient(G[0] - 9, G[1] - 9, 3, G[0], G[1], 34); kg.addColorStop(0, '#606064'); kg.addColorStop(1, '#1c1c1e'); g.fillStyle = kg; g.fill(); g.lineWidth = 2.5; g.strokeStyle = '#111'; g.stroke();
    // forearm pivots at an off-screen elbow; rotate+scale so the grip stays on the knob
    const E = [1250, 2300];
    const a0 = Math.atan2(G0[1] - E[1], G0[0] - E[0]), a1 = Math.atan2(G[1] - E[1], G[0] - E[0]);
    const sc = Math.hypot(G[0] - E[0], G[1] - E[1]) / Math.hypot(G0[0] - E[0], G0[1] - E[1]);
    g.save(); g.translate(E[0], E[1]); g.rotate(a1 - a0); g.scale(sc, sc); g.translate(-E[0], -E[1]);
    g.translate(G0[0], G0[1]); g.rotate(-(a1 - a0) * 0.6 + Math.sin(th) * 0.04); g.translate(-G0[0], -G0[1]);
    g.drawImage(IMG.g_crank_hand, 0, 0, W + 700, H + 700); g.restore();
  }
  g.restore();
  bigWord(g, 'KLİMA YOK', t, 39.55, 41.0, 300, { size: 104, fill: '#ff5a4a' });
  kCaptions(g, t, 1820);
};
window.ready6 = gptLoad();
