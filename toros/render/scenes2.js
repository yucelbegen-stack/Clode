// Code-drawn replacements for the photo scenes, in the Toros reference style:
// crisp dark ink outlines, soft gradient (cel) shading, warm muted palette, paper grain. True 3D perspective.
'use strict';
const PV = { hz: 880, f: 1000, hc: 1.35, cx: 540 };
function P3(X, Y, z) { return [PV.cx + PV.f * X / z, PV.hz + PV.f * (PV.hc - Y) / z]; }
function poly(g, pts) { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); }
function shadeGrad(g, x0, y0, x1, y1, base, k = 0.22) {
  const lg = g.createLinearGradient(x0, y0, x1, y1);
  lg.addColorStop(0, base); lg.addColorStop(1, mixc(base, '#2a2018', k)); return lg;
}

// ---------------------------------------------------------------- props in perspective
function pHouseLeft(g, X0, z0, z1, wallH, depth, wall = '#d9c7a3', roof = '#b4583b') {
  // side wall facing the road (plane X = X0), plus the near gable end (z = z0)
  const A = P3(X0, 0, z0), B = P3(X0, 0, z1), C = P3(X0, wallH, z1), D = P3(X0, wallH, z0);
  poly(g, [A, B, C, D]); g.fillStyle = shadeGrad(g, A[0], 0, B[0], 0, wall, 0.25); g.fill();
  // stone courses
  g.save(); poly(g, [A, B, C, D]); g.clip(); g.strokeStyle = 'rgba(34,28,22,0.28)'; g.lineWidth = 1;
  for (let k = 0; k < 40; k++) { const zz = lerp(z0, z1, hash(k * 3.1 + X0)), yy = wallH * hash(k * 1.7 + z0); const [sx, sy] = P3(X0, yy, zz); const r = PV.f * 0.12 / zz; g.beginPath(); g.roundRect(sx - r * 0.25, sy - r * 0.35, r * 0.5, r * 0.7, r * 0.15); g.stroke(); }
  g.restore();
  poly(g, [A, B, C, D]); ink(g, 2.2);
  // window + shutters + flower box mid-wall
  const zw = lerp(z0, z1, 0.35), zw2 = zw + 1.0;
  const w1 = P3(X0, 1.1, zw), w2 = P3(X0, 1.1, zw2), w3 = P3(X0, 2.2, zw2), w4 = P3(X0, 2.2, zw);
  poly(g, [w1, w2, w3, w4]); g.fillStyle = '#4f5b63'; g.fill(); ink(g, 1.8);
  const fb = [P3(X0 + 0.15, 1.1, zw), P3(X0 + 0.15, 1.1, zw2), P3(X0 + 0.15, 0.95, zw2), P3(X0 + 0.15, 0.95, zw)];
  poly(g, fb); g.fillStyle = '#9a5a36'; g.fill(); ink(g, 1.4);
  for (let k = 0; k < 4; k++) { const [fx, fy] = P3(X0 + 0.2, 1.2, zw + 0.15 + k * 0.23); const r = PV.f * 0.09 / zw; g.beginPath(); g.arc(fx, fy, r, 0, 7); g.fillStyle = k % 2 ? '#c8413a' : '#d9573e'; g.fill(); g.lineWidth = 1; g.strokeStyle = INK2; g.stroke(); }
  // door
  const zd = lerp(z0, z1, 0.72), d1 = P3(X0, 0, zd), d2 = P3(X0, 0, zd + 0.9), d3 = P3(X0, 2.0, zd + 0.9), d4 = P3(X0, 2.0, zd);
  poly(g, [d1, d2, d3, d4]); g.fillStyle = '#6e4a30'; g.fill(); ink(g, 1.8);
  // roof: eave over the wall rising to the ridge
  const R1 = P3(X0 + 0.5, wallH + 0.1, z0 - 0.4), R2 = P3(X0 + 0.5, wallH + 0.1, z1 + 0.4), R3 = P3(X0 - depth / 2, wallH + 1.8, z1 + 0.4), R4 = P3(X0 - depth / 2, wallH + 1.8, z0 - 0.4);
  poly(g, [R1, R2, R3, R4]); g.fillStyle = shadeGrad(g, 0, R4[1], 0, R1[1], roof, 0.3); g.fill();
  g.save(); poly(g, [R1, R2, R3, R4]); g.clip(); g.strokeStyle = 'rgba(60,25,15,0.45)'; g.lineWidth = 1.2;
  for (let zz = z0; zz < z1 + 0.4; zz += 0.35) { const a = P3(X0 + 0.5, wallH + 0.1, zz), b = P3(X0 - depth / 2, wallH + 1.8, zz); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
  g.restore(); poly(g, [R1, R2, R3, R4]); ink(g, 2.2);
  // near gable end
  const G1 = P3(X0, 0, z0), G2 = P3(X0 - depth, 0, z0), G3 = P3(X0 - depth, wallH, z0), G4 = P3(X0 - depth / 2, wallH + 1.8, z0 - 0.4), G5 = P3(X0, wallH, z0);
  poly(g, [G1, G2, G3, G4, G5]); g.fillStyle = mixc(wall, '#2a2018', 0.12); g.fill(); ink(g, 2.2);
}
function pPoplar(g, X, z, hM = 14, wM = 1.5) { const [x, y] = P3(X, 0, z); poplar(g, x, y, PV.f * hM / z, PV.f * wM / z); }
function pTree(g, X, z, rM = 2.2) { const [x, y] = P3(X, 0, z); roundTree(g, x, y, PV.f * rM / z); }
function pHay(g, X, z, rM = 1.6) { const [x, y] = P3(X, 0, z); haystack(g, x, y, PV.f * rM / z); }
function pFence(g, X, z0, z1) {
  const posts = []; for (let z = z0; z <= z1; z += 2.2) posts.push(z);
  for (const yy of [0.55, 0.95]) { const a = P3(X, yy, z0), b = P3(X, yy, z1); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineWidth = Math.max(2, PV.f * 0.07 / z0); g.strokeStyle = '#7a5a3c'; g.stroke(); }
  for (const z of posts) { const a = P3(X, 0, z), b = P3(X, 1.15, z); const w = PV.f * 0.12 / z; g.beginPath(); g.rect(a[0] - w / 2, b[1], w, a[1] - b[1]); g.fillStyle = '#6e4e33'; g.fill(); ink(g, 1.4); }
}
function pPine(g, X, z, hM = 9, snow = true) {
  const [x, y] = P3(X, 0, z), s = PV.f / z, h = hM * s, w = hM * 0.3 * s;
  g.fillStyle = '#5a4030'; g.fillRect(x - 0.15 * s, y - 0.9 * s, 0.3 * s, 0.9 * s);
  for (let k = 0; k < 4; k++) {
    const t0 = 0.12 + k * 0.21, ty = y - h * (t0 + 0.32), by = y - h * t0, ww = w * (1 - k * 0.2);
    poly(g, [[x, ty], [x + ww, by], [x - ww, by]]); g.fillStyle = shadeGrad(g, x - ww, 0, x + ww, 0, '#3f5a43', 0.35); g.fill(); ink(g, 1.8);
    if (snow) { poly(g, [[x, ty], [x + ww * 0.55, ty + (by - ty) * 0.55], [x + ww * 0.2, ty + (by - ty) * 0.48], [x - ww * 0.15, ty + (by - ty) * 0.6], [x - ww * 0.5, ty + (by - ty) * 0.5]]); g.fillStyle = '#f3f0e8'; g.fill(); g.lineWidth = 1.2; g.strokeStyle = INK2; g.stroke(); }
  }
}
function pChicken(g, X, z, t, ph = 0, col = '#a65a2e') {
  const [x, y] = P3(X, 0, z), s = PV.f * 0.4 / z, peck = Math.max(0, Math.sin(t * 3 + ph)) * 0.25;
  g.save(); g.translate(x, y); g.scale(s / 40, s / 40);
  g.strokeStyle = '#c9902e'; g.lineWidth = 3; g.beginPath(); g.moveTo(-4, -12); g.lineTo(-5, 0); g.moveTo(5, -12); g.lineTo(6, 0); g.stroke();
  g.beginPath(); g.ellipse(0, -24, 20, 14, 0, 0, 7); g.fillStyle = col; g.fill(); ink(g, 2);
  g.beginPath(); g.moveTo(-18, -28); g.lineTo(-30, -42); g.lineTo(-22, -24); g.fillStyle = mixc(col, '#2a2018', 0.4); g.fill(); ink(g, 1.6);
  g.save(); g.translate(14, -32); g.rotate(peck * 2.2);
  g.beginPath(); g.arc(0, -6, 8, 0, 7); g.fillStyle = col; g.fill(); ink(g, 1.8);
  g.fillStyle = '#c8302a'; g.beginPath(); g.arc(-1, -15, 4, 0, 7); g.fill(); g.fillStyle = '#e0a030'; g.beginPath(); g.moveTo(7, -7); g.lineTo(13, -5); g.lineTo(7, -3); g.fill();
  g.fillStyle = '#111'; g.beginPath(); g.arc(3, -7, 1.3, 0, 7); g.fill(); g.restore();
  g.restore();
}
// dirt / snow road surface in perspective with two wheel ruts
function pRoad(g, halfW, col, rutCol, verge) {
  const zN = 0.6, zF = 400;
  g.fillStyle = verge; g.fillRect(0, PV.hz, W, H - PV.hz);
  poly(g, [P3(-halfW, 0, zN), P3(halfW, 0, zN), P3(halfW, 0, zF), P3(-halfW, 0, zF)]);
  const [, yN] = P3(0, 0, zN); g.fillStyle = shadeGrad(g, 0, PV.hz, 0, Math.min(H, yN), mixc(col, '#efe3c6', 0.25), -0.0); g.fill();
  g.fillStyle = col; g.globalAlpha = 0.6; g.fill(); g.globalAlpha = 1;
  for (const X of [-0.78, 0.78]) { poly(g, [P3(X - 0.2, 0, zN), P3(X + 0.2, 0, zN), P3(X + 0.2, 0, zF), P3(X - 0.2, 0, zF)]); g.fillStyle = rutCol; g.fill(); }
  // edge ink lines
  for (const X of [-halfW, halfW]) { const a = P3(X, 0, zN), b = P3(X, 0, zF); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineWidth = 2.2; g.strokeStyle = 'rgba(34,28,22,0.55)'; g.stroke(); }
  // pebbles
  for (let k = 0; k < 90; k++) { const z = 1.2 + Math.pow(hash(k), 2) * 40, X = (hash(k + 9) - 0.5) * halfW * 1.9; const [x, y] = P3(X, 0, z), r = PV.f * 0.03 / z; g.beginPath(); g.ellipse(x, y, r * 1.4, r * 0.7, 0, 0, 7); g.fillStyle = 'rgba(120,95,65,0.5)'; g.fill(); g.beginPath(); g.ellipse(x - r * 0.3, y - r * 0.25, r * 0.6, r * 0.3, 0, 0, 7); g.fillStyle = 'rgba(255,245,225,0.5)'; g.fill(); }
}

// ---------------------------------------------------------------- K6 village lane, green Toros comes toward camera
K.k6 = (g, t) => {
  const lt = t - 20.5;
  sky(g, '#7fb2d6', '#bcd6e0', '#f0e4c8', PV.hz);
  sun(g, 860, 280, 52);
  cloud(g, 260, 260, 1.2); cloud(g, 760, 380, 0.9); cloud(g, 980, 210, 0.8);
  mountains(g, 0, PV.hz + 4, 0, '#b9a079', 150, false, 1.3);
  mountains(g, 0, PV.hz + 6, 0, '#a99068', 90, false, 4.1);
  pRoad(g, 2.2, '#cfae7a', 'rgba(140,105,65,0.16)', '#a7a35e');
  const items = [];
  for (let z = 70; z >= 6; z -= 9) items.push([z, () => pPoplar(g, 6.5, z, 15, 1.5)], [z + 4, () => pPoplar(g, -9.5, z + 4, 15, 1.5)]);
  for (const [z0, z1] of [[34, 44], [20, 30], [7, 15]]) items.push([z0, () => pHouseLeft(g, -3.6, z0, z1, 3.0, 5.5)]);
  items.push([16, () => pHay(g, 5.2, 16, 1.8)], [9, () => pTree(g, 7.5, 9, 2.4)]);
  items.push([12, () => pFence(g, 3.1, 4, 40)]);
  [[-2.4, 6.0, '#a65a2e'], [-2.0, 4.6, '#efe6d6'], [-2.8, 3.8, '#3a2a20']].forEach(([X, z, c], i) => items.push([z, () => pChicken(g, X, z, t, i * 1.7, c)]));
  const z = lerp(16, 3.0, smooth(lt / 3.2)), dist = (16 - z);
  items.push([z, () => { const [x, y] = P3(0.55, 0, z); frontCar(g, IMG.front_green, x, y, PV.f * 1.68 / z, t, dist, { dust: true }); }]);
  items.sort((a, b) => b[0] - a[0]).forEach(([, fn]) => fn());
  kCaptions(g, t, 1640);
  return dist;
};

// ---------------------------------------------------------------- K9 snowy mountain road, red Toros with chains
K.k9 = (g, t) => {
  const lt = t - 30.1;
  sky(g, '#9aa3ab', '#c3c6c4', '#e6e2d8', PV.hz);
  snowMountains(g, 0, PV.hz + 4, 0, 330, '#8f98a0', 2.2);
  snowMountains(g, 0, PV.hz + 8, 0, 170, '#7f8a90', 5.0);
  pRoad(g, 2.4, '#a8998a', 'rgba(70,58,48,0.22)', '#eeebe3');
  // snow banks
  for (const s of [-1, 1]) { poly(g, [P3(s * 2.4, 0, 0.6), P3(s * 3.4, 0.5, 0.6), P3(s * 3.4, 0.5, 400), P3(s * 2.4, 0, 400)]); g.fillStyle = '#f5f3ee'; g.fill(); g.lineWidth = 1.6; g.strokeStyle = 'rgba(34,28,22,0.4)'; g.stroke(); }
  const items = [];
  for (let z = 90; z >= 11; z -= 7) { items.push([z, () => pPine(g, -6.5 - hash(z) * 4, z, 8 + hash(z + 1) * 4)]); items.push([z + 3.5, () => pPine(g, 6 + hash(z + 2) * 4, z + 3.5, 7 + hash(z + 3) * 4)]); }
  const z = lerp(15, 2.9, smooth(lt / 3.2)), dist = 15 - z;
  items.push([z, () => { const [x, y] = P3(0.5, 0, z); frontCar(g, IMG.front_red, x, y, PV.f * 1.68 / z, t, dist, { chains: true }); }]);
  items.sort((a, b) => b[0] - a[0]).forEach(([, fn]) => fn());
  for (let i = 0; i < 240; i++) {
    const depth = 0.4 + hash(i) * 1.4, sp = 80 * depth;
    const xx = ((hash(i + 1) * W * 1.4 - lt * sp * 1.1) % (W * 1.2) + W * 1.2) % (W * 1.2) - 60;
    const yy = (hash(i + 2) * H + lt * sp * 2.4) % H;
    g.beginPath(); g.arc(xx, yy, 1.5 + depth * 3, 0, 7); g.fillStyle = `rgba(255,255,255,${0.55 + 0.4 * hash(i + 3)})`; g.fill();
  }
  kCaptions(g, t, 1640);
  return dist;
};

// ---------------------------------------------------------------- K13 village house: Toros parked, mechanic works, engine starts
K.k13 = (g, t) => {
  const lt = t - 42.5;
  sky(g, '#86b4d4', '#c3d8de', '#f1e5c8', 900);
  sun(g, 900, 260, 50); cloud(g, 200, 240, 1.1); cloud(g, 700, 330, 0.8);
  mountains(g, 0, 900, 0, '#b9a079', 160, false, 2.6);
  g.fillStyle = '#a7a35e'; g.fillRect(0, 900, W, 140);
  // house front (frontal elevation)
  const hx = 60, hw = 820, hy = 1290, hh = 420;
  g.beginPath(); g.rect(hx, hy - hh, hw, hh); g.fillStyle = shadeGrad(g, hx, 0, hx + hw, 0, '#dcc9a5', 0.18); g.fill();
  g.save(); g.clip(); g.strokeStyle = 'rgba(34,28,22,0.25)'; g.lineWidth = 1.3;
  for (let k = 0; k < 120; k++) { const x = hx + hash(k * 1.3) * hw, y = hy - hash(k * 2.9) * hh; g.beginPath(); g.ellipse(x, y, 16 + hash(k) * 12, 9 + hash(k + 1) * 6, 0, 0, 7); g.stroke(); }
  g.restore(); g.beginPath(); g.rect(hx, hy - hh, hw, hh); ink(g, 3);
  // tiled roof
  poly(g, [[hx - 40, hy - hh], [hx + hw + 40, hy - hh], [hx + hw - 40, hy - hh - 150], [hx + 40, hy - hh - 150]]);
  g.fillStyle = shadeGrad(g, 0, hy - hh - 150, 0, hy - hh, '#b4583b', 0.3); g.fill();
  g.save(); g.clip(); g.strokeStyle = 'rgba(60,25,15,0.5)'; g.lineWidth = 1.5; for (let x = hx - 40; x < hx + hw + 60; x += 22) { g.beginPath(); g.moveTo(x, hy - hh); g.lineTo(x + 10, hy - hh - 150); g.stroke(); } for (let y = hy - hh - 140; y < hy - hh; y += 28) { g.beginPath(); g.moveTo(hx - 40, y); g.lineTo(hx + hw + 40, y); g.stroke(); } g.restore();
  poly(g, [[hx - 40, hy - hh], [hx + hw + 40, hy - hh], [hx + hw - 40, hy - hh - 150], [hx + 40, hy - hh - 150]]); ink(g, 3);
  // window with shutters + geraniums, wooden door
  const wx = 150, wy = hy - 330; g.beginPath(); g.rect(wx, wy, 190, 170); g.fillStyle = '#4f5b63'; g.fill(); ink(g, 3);
  g.beginPath(); g.moveTo(wx + 95, wy); g.lineTo(wx + 95, wy + 170); g.moveTo(wx, wy + 85); g.lineTo(wx + 190, wy + 85); ink(g, 3);
  g.fillStyle = 'rgba(240,236,226,0.75)'; g.fillRect(wx + 8, wy + 8, 36, 150); g.fillRect(wx + 146, wy + 8, 36, 150);
  g.beginPath(); g.rect(wx - 10, wy + 170, 210, 18); g.fillStyle = '#9a5a36'; g.fill(); ink(g, 2);
  for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(wx + 10 + k * 34, wy + 160, 14, 0, 7); g.fillStyle = k % 2 ? '#c8413a' : '#e0573e'; g.fill(); ink(g, 1.4); }
  g.beginPath(); g.rect(560, hy - 300, 150, 300); g.fillStyle = shadeGrad(g, 560, 0, 710, 0, '#7a5236', 0.25); g.fill(); ink(g, 3);
  for (let y = hy - 290; y < hy; y += 40) { g.beginPath(); g.moveTo(566, y); g.lineTo(704, y); g.lineWidth = 1.4; g.strokeStyle = 'rgba(34,28,22,0.45)'; g.stroke(); }
  // tree overhanging on the right
  roundTree(g, 980, 1290, 170);
  // yard ground
  g.fillStyle = '#cdb07e'; g.fillRect(0, 1290, W, H - 1290);
  for (let k = 0; k < 70; k++) { g.beginPath(); g.ellipse(hash(k) * W, 1300 + hash(k + 4) * 620, 6 + hash(k + 2) * 8, 3 + hash(k + 3) * 3, 0, 0, 7); g.fillStyle = 'rgba(110,85,55,0.35)'; g.fill(); }
  g.beginPath(); g.moveTo(0, 1290); g.lineTo(W, 1290); ink(g, 2.5);
  pChickenFlat(g, 150, 1520, 1.3, t, 0); pChickenFlat(g, 260, 1600, 1.1, t, 1.3, '#efe6d6');
  // Toros parked in front, starts at 2.3 s
  const im = IMG.front, wpx = 620, s = wpx / im.width, h = im.height * s, gy = 1790, x = 660;
  const start = lt > 2.3, shake = start ? Math.sin(lt * 70) * 2 * Math.exp(-(lt - 2.3) * 3) : 0;
  g.drawImage(im, x - wpx / 2 + shake, gy - h, wpx, h);
  if (start) for (const hx2 of [-0.36, -0.24, 0.24, 0.36]) { const gl = g.createRadialGradient(x + hx2 * wpx, gy - h * 0.43, 0, x + hx2 * wpx, gy - h * 0.43, 80); gl.addColorStop(0, 'rgba(255,250,215,0.9)'); gl.addColorStop(1, 'rgba(255,250,215,0)'); g.fillStyle = gl; g.beginPath(); g.arc(x + hx2 * wpx, gy - h * 0.43, 80, 0, 7); g.fill(); }
  if (start) txt(g, 'VINNN!', 860, 1180, { size: 70, font: 'IBlackI', fill: '#ffd84a', stroke: '#111', sw: 12, alpha: seg(lt, 2.3, 2.5), rot: -0.1 });
  if (lt > 1.0 && lt < 2.2) txt(g, 'TIK TIK', 880, 1480, { size: 50, font: 'IBlackI', fill: '#fff', stroke: '#111', sw: 10, alpha: Math.sin(lt * 9) > 0 ? 1 : 0.45, rot: -0.1 });
  kCaptions(g, t, 700);
};
function pChickenFlat(g, x, y, sc, t, ph, col = '#a65a2e') { const z = PV.f * 0.4 / (40 * sc); const [bx] = P3(0, 0, 1); g.save(); g.translate(x - PV.cx, y - (PV.hz + PV.f * PV.hc / z)); pChicken(g, 0, z, t, ph, col); g.restore(); }

window.ready4 = window.ready3;
