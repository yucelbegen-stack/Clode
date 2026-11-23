// "Realistic cartoon" pass, modelled on the user's Toros illustrations: crisp dark contour around each object's
// silhouette, soft multi-tone gradient shading, believable proportions and detail, muted warm palette.
'use strict';
const RINK = '#221d18';
function rinkStroke(g, w = 2.2) { g.lineWidth = w; g.strokeStyle = RINK; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); }
function blob(g, cx, cy, rx, ry, seed, n = 11, rough = 0.16) {
  g.beginPath();
  for (let i = 0; i <= n; i++) {
    const a = (i % n) / n * Math.PI * 2, r = 1 + (hash(seed + i * 1.37) - 0.5) * 2 * rough;
    const x = cx + Math.cos(a) * rx * r, y = cy + Math.sin(a) * ry * r;
    if (i === 0) g.moveTo(x, y); else { const ap = (i - 0.5) / n * Math.PI * 2; g.quadraticCurveTo(cx + Math.cos(ap) * rx * (r + 0.18), cy + Math.sin(ap) * ry * (r + 0.18), x, y); }
  }
  g.closePath();
}
function radial(g, cx, cy, r, c0, c1) { const gr = g.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r * 1.15); gr.addColorStop(0, c0); gr.addColorStop(1, c1); return gr; }

// ---------------------------------------------------------------- foliage (silhouette ink + 3-tone shading)
function canopy(g, clusters, pal, w) {
  // 1) ink silhouette: stroke all clusters thick, 2) fill all (erases inner lines), 3) shading + leaf texture
  for (const c of clusters) { blob(g, c[0], c[1], c[2], c[2] * 0.9, c[3], 12, 0.2); g.lineWidth = Math.max(2, w); g.strokeStyle = RINK; g.stroke(); }
  for (const c of clusters) { blob(g, c[0], c[1], c[2], c[2] * 0.9, c[3], 12, 0.2); g.fillStyle = radial(g, c[0], c[1], c[2], pal[1], pal[0]); g.fill(); }
  for (const c of clusters) {
    blob(g, c[0] - c[2] * 0.22, c[1] - c[2] * 0.25, c[2] * 0.55, c[2] * 0.45, c[3] + 5, 9, 0.25); g.fillStyle = pal[2]; g.globalAlpha = 0.55; g.fill(); g.globalAlpha = 1;
    // leaf scallops
    g.strokeStyle = 'rgba(34,40,20,0.45)'; g.lineWidth = Math.max(0.8, w * 0.45);
    for (let k = 0; k < 5; k++) { const a = hash(c[3] + k) * 6.28, rr = c[2] * (0.35 + 0.5 * hash(c[3] + k + 9)); const x = c[0] + Math.cos(a) * rr, y = c[1] + Math.sin(a) * rr * 0.9; g.beginPath(); g.arc(x, y, c[2] * 0.16, 0.2, 2.4); g.stroke(); }
  }
}
const PAL_TREE = ['#4d5e2c', '#8a9a4c', '#b3bd72'];
const PAL_POP = ['#475a2a', '#7f9446', '#a9b866'];
roundTree = function (g, x, base, r, col) {
  const w = Math.max(1.2, r / 45);
  // trunk with taper + two branches
  g.beginPath(); g.moveTo(x - r * 0.13, base); g.quadraticCurveTo(x - r * 0.08, base - r * 0.8, x - r * 0.05, base - r * 1.5); g.lineTo(x + r * 0.07, base - r * 1.5); g.quadraticCurveTo(x + r * 0.09, base - r * 0.8, x + r * 0.15, base); g.closePath();
  const tg = g.createLinearGradient(x - r * 0.15, 0, x + r * 0.15, 0); tg.addColorStop(0, '#6b4d36'); tg.addColorStop(1, '#3f2c1f'); g.fillStyle = tg; g.fill(); rinkStroke(g, w);
  g.beginPath(); g.moveTo(x, base - r * 1.0); g.quadraticCurveTo(x - r * 0.3, base - r * 1.3, x - r * 0.5, base - r * 1.55); g.moveTo(x + r * 0.02, base - r * 1.1); g.quadraticCurveTo(x + r * 0.3, base - r * 1.35, x + r * 0.45, base - r * 1.7); g.lineWidth = r * 0.07; g.strokeStyle = '#4a3424'; g.stroke();
  const cl = [[0, -2.1, 0.62], [-0.55, -1.8, 0.48], [0.58, -1.85, 0.5], [-0.32, -2.5, 0.44], [0.36, -2.45, 0.46], [0, -2.75, 0.36], [-0.75, -2.15, 0.36], [0.8, -2.2, 0.34]];
  canopy(g, cl.map(([dx, dy, rr], i) => [x + dx * r, base + dy * r, rr * r, i * 7 + Math.round(x)]), PAL_TREE, w);
};
poplar = function (g, x, base, h, w0) {
  const lw = Math.max(1, h / 170);
  g.beginPath(); g.moveTo(x - w0 * 0.08, base); g.lineTo(x - w0 * 0.05, base - h * 0.25); g.lineTo(x + w0 * 0.05, base - h * 0.25); g.lineTo(x + w0 * 0.08, base); g.closePath(); g.fillStyle = '#4a3527'; g.fill(); rinkStroke(g, lw);
  // one flame-shaped crown with a leafy scalloped edge
  const prof = t => Math.pow(Math.sin(Math.PI * Math.min(1, t)), 0.8) * (1 - 0.45 * t);
  const N = 22, yTop = base - h, yBot = base - h * 0.2, pts = [];
  for (let i = 0; i <= N; i++) { const t = i / N; pts.push([x + w0 * 0.5 * prof(1 - t) * (1 + 0.12 * Math.sin(i * 2.1 + x)), yTop + (yBot - yTop) * t]); }
  const path = () => {
    g.beginPath(); g.moveTo(x, yTop);
    for (let i = 1; i <= N; i++) { const [px, py] = pts[i], [qx, qy] = pts[i - 1]; g.quadraticCurveTo((px + qx) / 2 + (px - x) * 0.25 + 3, (py + qy) / 2, px, py); }
    g.quadraticCurveTo(x, yBot + h * 0.06, 2 * x - pts[N][0], yBot);
    for (let i = N - 1; i >= 0; i--) { const px = 2 * x - pts[i][0], py = pts[i][1], qx = 2 * x - pts[i + 1][0], qy = pts[i + 1][1]; g.quadraticCurveTo((px + qx) / 2 - (x - px) * 0.25 - 3, (py + qy) / 2, px, py); }
    g.closePath();
  };
  path(); const pg = g.createLinearGradient(x - w0 * 0.5, 0, x + w0 * 0.5, 0); pg.addColorStop(0, PAL_POP[2]); pg.addColorStop(0.45, PAL_POP[1]); pg.addColorStop(1, PAL_POP[0]); g.fillStyle = pg; g.fill();
  g.save(); path(); g.clip();
  g.strokeStyle = 'rgba(40,50,20,0.45)'; g.lineWidth = Math.max(0.7, lw * 0.6);
  for (let k = 0; k < 26; k++) { const t = hash(k + x * 0.1), yy = yTop + (yBot - yTop) * t, ww = w0 * 0.5 * prof(1 - t); const xx = x + (hash(k * 3 + x) - 0.5) * ww * 1.6; g.beginPath(); g.arc(xx, yy, Math.max(2, w0 * 0.09), 0.2, 2.6); g.stroke(); }
  g.fillStyle = 'rgba(30,40,15,0.18)'; g.fillRect(x + w0 * 0.05, yTop, w0, yBot - yTop);
  g.restore();
  path(); rinkStroke(g, lw * 1.3);
};
haystack = function (g, x, base, r) {
  const P = () => { g.beginPath(); g.moveTo(x - r, base); g.bezierCurveTo(x - r * 1.05, base - r * 1.2, x - r * 0.45, base - r * 1.65, x, base - r * 1.65); g.bezierCurveTo(x + r * 0.45, base - r * 1.65, x + r * 1.05, base - r * 1.2, x + r, base); g.closePath(); };
  P(); const hg = g.createLinearGradient(x - r, 0, x + r, 0); hg.addColorStop(0, '#e2bf6e'); hg.addColorStop(0.55, '#c99a4c'); hg.addColorStop(1, '#8e6a32'); g.fillStyle = hg; g.fill();
  g.save(); P(); g.clip(); g.strokeStyle = 'rgba(110,75,30,0.55)'; g.lineWidth = Math.max(0.8, r / 40);
  for (let i = 0; i < 40; i++) { const xx = x + (hash(i) - 0.5) * r * 2, yy = base - hash(i + 3) * r * 1.6; g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx + (hash(i + 5) - 0.5) * r * 0.3, yy + r * 0.25); g.stroke(); }
  g.restore(); P(); rinkStroke(g, Math.max(1.2, r / 30));
};
// ---------------------------------------------------------------- grass: gradient field + perspective tufts + flowers
grass = function (g, camPx, y0) {
  const gg = g.createLinearGradient(0, y0, 0, H); gg.addColorStop(0, '#a5ab62'); gg.addColorStop(1, '#6f8540'); g.fillStyle = gg; g.fillRect(0, y0, W, H - y0);
  g.beginPath(); g.moveTo(0, y0); g.lineTo(W, y0); rinkStroke(g, 2.2);
  const off = camPx * 1.1, sp = 46;
  for (let row = 0; row < 14; row++) {
    const ty = y0 + 18 + (row / 13) * (H - y0 - 10), sc = 0.55 + (ty - y0) / (H - y0) * 1.0;
    const step = sp * sc, i0 = Math.floor((off * sc - 40) / step), i1 = Math.ceil((off * sc + W + 40) / step);
    for (let i = i0; i <= i1; i++) {
      const hs = hash(i * 7.1 + row * 13.3); const x = i * step - off * sc + hs * step * 0.6, y = ty + (hash(i + row * 3) - 0.5) * 20;
      const bl = (14 + hs * 12) * sc;
      for (let k = -3; k <= 3; k++) { g.beginPath(); g.moveTo(x + k * 3 * sc, y); g.quadraticCurveTo(x + k * 5 * sc, y - bl * 0.6, x + k * 7 * sc + 2, y - bl * (0.8 + 0.3 * hash(i + k))); g.lineWidth = 1.6 * sc; g.strokeStyle = (k + i) % 3 ? '#556b2f' : '#8f9e52'; g.stroke(); }
      if (hs > 0.86) { const c = ['#f2ead8', '#e2b83c', '#c9503c'][i % 3]; for (let p = 0; p < 5; p++) { const a = p / 5 * 6.28; g.beginPath(); g.ellipse(x + Math.cos(a) * 3 * sc, y - bl - 2 + Math.sin(a) * 3 * sc, 2.6 * sc, 1.6 * sc, a, 0, 7); g.fillStyle = c; g.fill(); } g.beginPath(); g.arc(x, y - bl - 2, 1.6 * sc, 0, 7); g.fillStyle = '#d29a22'; g.fill(); }
    }
  }
};
// ---------------------------------------------------------------- clouds: volumetric cumulus
cloud = function (g, x, y, s, a = 1) {
  g.save(); g.globalAlpha = a; g.translate(x, y); g.scale(s, s);
  const C = [[-60, 0, 34], [-22, -18, 44], [22, -22, 40], [58, -2, 32], [0, 8, 40], [-88, 12, 22], [86, 12, 22]];
  for (const [cx, cy, r] of C) { g.beginPath(); g.arc(cx, cy, r, 0, 7); g.lineWidth = 3 / s; g.strokeStyle = 'rgba(34,29,24,0.75)'; g.stroke(); }
  for (const [cx, cy, r] of C) { g.beginPath(); g.arc(cx, cy, r, 0, 7); const gr = g.createLinearGradient(0, cy - r, 0, cy + r); gr.addColorStop(0, '#fbf5e8'); gr.addColorStop(0.65, '#eee2cc'); gr.addColorStop(1, '#c9bfb4'); g.fillStyle = gr; g.fill(); }
  g.beginPath(); g.rect(-120, 24, 240, 40); g.fillStyle = 'rgba(0,0,0,0)'; g.fill();
  g.restore();
};
// ---------------------------------------------------------------- mountains: layered rock, aerial perspective, shaded snow
function rangeRidge(camPx, baseY, p, height, seed) {
  const off = camPx * p, pts = [];
  for (let x = -40; x <= W + 40; x += 8) {
    const wx = (x + off) / 300 + seed;
    let y = 0.5 + 0.22 * Math.sin(wx * 1.2) + 0.18 * Math.sin(wx * 2.7 + 1.4) + 0.1 * Math.abs(Math.sin(wx * 5.3)) + 0.04 * Math.sin(wx * 13.1);
    pts.push([x, baseY - height * y]);
  }
  return pts;
}
function realRange(g, pts, baseY, col, snowY, haze) {
  const top = Math.min(...pts.map(p => p[1]));
  const path = () => { g.beginPath(); g.moveTo(-40, baseY); for (const [x, y] of pts) g.lineTo(x, y); g.lineTo(W + 40, baseY); g.closePath(); };
  path(); const mg = g.createLinearGradient(0, top, 0, baseY); mg.addColorStop(0, mixc(col, '#ffffff', 0.08)); mg.addColorStop(1, mixc(col, '#3a3a40', 0.25)); g.fillStyle = mg; g.fill();
  g.save(); path(); g.clip();
  // shadow faces (light from upper left): descending-right slopes get a darker wedge
  const sl = g.createLinearGradient(0, 0, W, 0); sl.addColorStop(0, 'rgba(255,250,235,0.10)'); sl.addColorStop(1, 'rgba(30,28,40,0.10)'); g.fillStyle = sl; g.fillRect(-40, top, W + 80, baseY - top);
  if (snowY !== null) {
    g.beginPath(); g.moveTo(-40, -10);
    for (const [x, y] of pts) g.lineTo(x, Math.max(y, snowY + Math.sin(x * 0.07) * 14 + Math.sin(x * 0.23) * 7));
    g.lineTo(W + 40, -10); g.closePath(); g.fillStyle = '#f5f2ea'; g.fill();
    // blue shadow on snow right faces
    const sg = g.createLinearGradient(0, top, 0, snowY + 30); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(1, 'rgba(120,135,165,0.25)'); g.fillStyle = sg; g.fillRect(-40, top, W + 80, snowY + 30 - top);
  }
  if (haze) { g.fillStyle = `rgba(232,224,206,${haze})`; g.fillRect(-40, top, W + 80, baseY - top); }
  g.restore();
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const [x, y] of pts) g.lineTo(x, y); rinkStroke(g, 2.4);
}
mountains = function (g, camPx, baseY, p, col, height, snow = true, seed = 0) {
  realRange(g, rangeRidge(camPx, baseY, p, height, seed), baseY, mixc(col, '#9c917c', 0.45), snow ? baseY - height * 0.8 : null, 0.12);
};
snowMountains = function (g, camPx, baseY, p, height, col, seed) {
  realRange(g, rangeRidge(camPx, baseY, p, height, seed), baseY, mixc(col, '#8f949a', 0.35), baseY - height * 0.66, 0.08);
};
// ---------------------------------------------------------------- village house (small, side elevation)
house = function (g, x, base, w, h, wall = '#e4d3b2', roof = '#b2563a') {
  const lw = Math.max(1.2, w / 60);
  g.beginPath(); g.rect(x, base - h, w, h); const wg = g.createLinearGradient(x, 0, x + w, 0); wg.addColorStop(0, '#eadcbf'); wg.addColorStop(1, '#c8b38f'); g.fillStyle = wg; g.fill();
  g.fillStyle = 'rgba(90,70,50,0.25)'; g.fillRect(x, base - h * 0.22, w, h * 0.22); // stone plinth
  g.fillStyle = 'rgba(40,30,20,0.18)'; g.fillRect(x, base - h, w, h * 0.12);      // eave shadow
  g.beginPath(); g.rect(x, base - h, w, h); rinkStroke(g, lw);
  g.beginPath(); g.moveTo(x - w * 0.08, base - h); g.lineTo(x + w * 0.5, base - h - h * 0.45); g.lineTo(x + w * 1.08, base - h); g.closePath();
  const rg = g.createLinearGradient(0, base - h - h * 0.45, 0, base - h); rg.addColorStop(0, '#c4673f'); rg.addColorStop(1, '#8a3f28'); g.fillStyle = rg; g.fill();
  g.save(); g.clip(); g.strokeStyle = 'rgba(70,25,15,0.5)'; g.lineWidth = lw * 0.6; for (let k = 1; k < 5; k++) { const yy = base - h - h * 0.45 * k / 5; g.beginPath(); g.moveTo(x - w * 0.1, yy); g.lineTo(x + w * 1.1, yy); g.stroke(); } g.restore();
  g.beginPath(); g.moveTo(x - w * 0.08, base - h); g.lineTo(x + w * 0.5, base - h - h * 0.45); g.lineTo(x + w * 1.08, base - h); g.closePath(); rinkStroke(g, lw);
  const nw = Math.max(1, Math.floor(w / 34));
  for (let i = 0; i < nw; i++) { const wx = x + w * 0.12 + i * (w * 0.76 / nw), ww = Math.min(14, w * 0.18); g.fillStyle = '#4c5a64'; g.fillRect(wx, base - h * 0.72, ww, ww * 1.2); g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(wx + 1, base - h * 0.72 + 1, ww * 0.35, ww * 1.2 - 2); g.strokeStyle = RINK; g.lineWidth = lw * 0.7; g.strokeRect(wx, base - h * 0.72, ww, ww * 1.2); }
};
// ---------------------------------------------------------------- realistic goat (side view, facing +x)
goat = function (g, x, y, s, o = {}) {
  const t = o.t ?? 0, bleat = o.bleat ?? 0, dir = o.dir ?? 1;
  g.save(); g.translate(x, y); g.scale(dir * s / 100, s / 100);  // units = cm, hooves at y=0
  const lw = 1.7, coat = '#efe8dc', coatD = '#c9bba5';
  const legPath = (hx, hy, kx, ky, fx) => { g.beginPath(); g.moveTo(hx - 6, hy); g.quadraticCurveTo(kx - 6, ky, fx - 3.5, -5); g.lineTo(fx + 3.5, -5); g.quadraticCurveTo(kx + 5, ky, hx + 6, hy); g.closePath(); };
  const leg = (hx, kx, fx, far, hind) => {
    if (hind) { g.beginPath(); g.moveTo(hx - 8, -52); g.quadraticCurveTo(hx - 12, -36, hx - 10, -28); g.lineTo(fx - 3, -6); g.lineTo(fx + 3.5, -6); g.lineTo(hx - 3, -28); g.quadraticCurveTo(hx + 2, -38, hx + 8, -52); g.closePath(); }
    else legPath(hx, -50, kx, -24, fx); const lg = g.createLinearGradient(hx - 6, 0, hx + 6, 0); lg.addColorStop(0, far ? '#cfc4b2' : coat); lg.addColorStop(1, far ? '#a99c88' : coatD); g.fillStyle = lg; g.fill(); g.lineWidth = lw; g.strokeStyle = RINK; g.stroke();
    g.beginPath(); g.moveTo(fx - 4.5, -6); g.lineTo(fx + 4.5, -6); g.lineTo(fx + 5.5, 0); g.lineTo(fx - 5, 0); g.closePath(); g.fillStyle = '#2b231c'; g.fill();
  };
  leg(-30, -33, -33, true, true); leg(28, 31, 29, true);
  // neck drawn first so the body overlaps its base (seamless join)
  const nod0 = -0.05 - bleat * 0.28 + Math.sin(t * 1.6) * 0.03;
  g.save(); g.translate(34, -80); g.rotate(nod0);
  g.beginPath(); g.moveTo(-14, 14); g.bezierCurveTo(-12, -6, -2, -26, 8, -36); g.lineTo(22, -32); g.bezierCurveTo(20, -16, 20, 2, 16, 16); g.closePath();
  const ngr = g.createLinearGradient(-12, 0, 22, 0); ngr.addColorStop(0, '#fbf7ef'); ngr.addColorStop(1, coatD); g.fillStyle = ngr; g.fill(); g.lineWidth = 1.8; g.strokeStyle = RINK; g.stroke();
  g.restore();
  // body: deep barrel, sloping rump, prominent withers
  const body = () => { g.beginPath(); g.moveTo(-44, -74); g.bezierCurveTo(-46, -90, -26, -94, -2, -92); g.bezierCurveTo(18, -92, 34, -96, 42, -88); g.bezierCurveTo(52, -76, 50, -56, 36, -46);
    g.bezierCurveTo(22, -40, 0, -40, -18, -44); g.bezierCurveTo(-34, -46, -46, -54, -46, -64); g.closePath(); };
  body(); const bg = g.createLinearGradient(0, -96, 0, -40); bg.addColorStop(0, '#fbf7ef'); bg.addColorStop(0.6, coat); bg.addColorStop(1, coatD); g.fillStyle = bg; g.fill();
  g.save(); body(); g.clip();
  blob(g, -12, -78, 20, 12, 3, 10, 0.25); g.fillStyle = '#8a5a35'; g.fill();          // tan saddle patch
  blob(g, 26, -84, 9, 6, 8, 8, 0.25); g.fillStyle = '#8a5a35'; g.fill();
  g.strokeStyle = 'rgba(80,65,50,0.45)'; g.lineWidth = 0.9;                            // coat hair
  for (let i = 0; i < 34; i++) { const xx = -42 + i * 2.6, yy = -60 + Math.sin(i) * 6; g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx - 2, yy + 6 + (i % 3) * 2); g.stroke(); }
  g.restore();
  body(); g.lineWidth = 2; g.strokeStyle = RINK; g.stroke();
  leg(-22, -24, -24, false, true); leg(36, 39, 37, false);
  // short upright tail
  g.beginPath(); g.moveTo(-44, -82); g.quadraticCurveTo(-54, -96 - Math.sin(t * 11) * 2, -48, -100); g.quadraticCurveTo(-44, -94, -41, -86); g.closePath(); g.fillStyle = coat; g.fill(); g.lineWidth = 1.5; g.strokeStyle = RINK; g.stroke();
  // neck
  const nod = -0.05 - bleat * 0.28 + Math.sin(t * 1.6) * 0.03;
  g.save(); g.translate(34, -80); g.rotate(nod);
  // head (scaled to real goat proportions)
  g.translate(15, -34); g.rotate(0.55 + bleat * 0.22); g.scale(0.66, 0.66);
  // horns: scimitar curve back, ridged
  g.beginPath(); g.moveTo(-4, -8); g.bezierCurveTo(-10, -30, -30, -40, -44, -30); g.bezierCurveTo(-30, -33, -14, -24, 4, -6); g.closePath();
  const hg = g.createLinearGradient(-44, -36, 4, -6); hg.addColorStop(0, '#6e5a43'); hg.addColorStop(1, '#b09a78'); g.fillStyle = hg; g.fill(); g.lineWidth = 1.5; g.strokeStyle = RINK; g.stroke();
  g.strokeStyle = 'rgba(40,30,20,0.6)'; g.lineWidth = 0.9; for (let k = 0; k < 8; k++) { const tt = k / 8; g.beginPath(); g.moveTo(-4 - tt * 36, -10 - tt * 22 + tt * tt * 8); g.lineTo(-1 - tt * 34, -6 - tt * 20 + tt * tt * 6); g.stroke(); }
  // long face, convex nose
  const head = () => { g.beginPath(); g.moveTo(-8, -10); g.bezierCurveTo(4, -16, 22, -14, 34, -6); g.bezierCurveTo(42, -2, 42, 6, 36, 9); g.bezierCurveTo(26, 12, 8, 12, -4, 8); g.bezierCurveTo(-10, 4, -12, -4, -8, -10); g.closePath(); };
  head(); const fg = g.createLinearGradient(0, -16, 0, 12); fg.addColorStop(0, '#fbf7ef'); fg.addColorStop(1, '#cdbfa9'); g.fillStyle = fg; g.fill(); g.lineWidth = 1.8; g.strokeStyle = RINK; g.stroke();
  g.beginPath(); g.moveTo(10, -12); g.bezierCurveTo(16, -10, 24, -8, 32, -4); g.lineWidth = 3.5; g.strokeStyle = 'rgba(138,90,53,0.6)'; g.stroke(); // tan face stripe
  // ear (horizontal, droopy)
  g.beginPath(); g.moveTo(-4, -6); g.bezierCurveTo(-16, -2, -24, 6, -22, 10); g.bezierCurveTo(-14, 8, -6, 4, 0, -1); g.closePath(); g.fillStyle = '#ddd1bd'; g.fill(); g.lineWidth = 1.4; g.strokeStyle = RINK; g.stroke();
  // eye: amber with horizontal pupil
  g.beginPath(); g.ellipse(9, -6, 4.2, 3.2, -0.1, 0, 7); g.fillStyle = '#d6a23a'; g.fill(); g.lineWidth = 1.2; g.strokeStyle = RINK; g.stroke();
  g.fillStyle = '#16110d'; g.beginPath(); g.ellipse(9, -6, 2.8, 0.9, -0.1, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(7.6, -7.2, 0.8, 0, 7); g.fill();
  g.beginPath(); g.moveTo(4, -9.5); g.quadraticCurveTo(9, -11, 14, -9); g.lineWidth = 1; g.strokeStyle = RINK; g.stroke();
  // nostril, mouth
  g.fillStyle = '#3a2a1c'; g.beginPath(); g.ellipse(37, 0, 1.8, 1.1, 0.5, 0, 7); g.fill();
  g.beginPath(); g.moveTo(31, 8); g.quadraticCurveTo(35, 9 + bleat * 6, 39, 7); g.lineWidth = 1.2; g.strokeStyle = RINK; g.stroke();
  if (bleat > 0.1) { g.beginPath(); g.ellipse(35, 9, 3.5, bleat * 3.5, 0, 0, 7); g.fillStyle = '#5a2c22'; g.fill(); }
  // beard
  g.beginPath(); g.moveTo(22, 10); g.bezierCurveTo(20, 20, 22, 30, 27, 34); g.bezierCurveTo(29, 26, 31, 18, 31, 10); g.closePath(); g.fillStyle = '#e6dccb'; g.fill(); g.lineWidth = 1.3; g.strokeStyle = RINK; g.stroke();
  g.strokeStyle = 'rgba(80,65,50,0.5)'; g.lineWidth = 0.8; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(24 + k * 1.6, 14); g.lineTo(25 + k * 1.4, 30); g.stroke(); }
  g.restore(); g.restore();
  if (bleat > 0.3) txt(g, 'MEEE!', x + dir * s * 0.95, y - s * 1.85, { size: Math.max(28, s * 0.3), font: 'IBlackI', fill: '#f6eedb', stroke: RINK, sw: 8, alpha: clamp((bleat - 0.3) * 3, 0, 1), rot: -0.12 * dir });
};
// ---------------------------------------------------------------- realistic hen (side view)
pChicken = function (g, X, z, t, ph = 0, col = '#a65a2e') {
  const [x, y] = P3(X, 0, z), s = PV.f * 0.42 / z, peck = Math.max(0, Math.sin(t * 2.6 + ph)) ** 3;
  g.save(); g.translate(x, y); g.scale(s / 40, s / 40);
  const dark = mixc(col, '#1e1711', 0.45), light = mixc(col, '#fff4e0', 0.35);
  g.strokeStyle = '#c48a2a'; g.lineWidth = 2.6; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-3, -14); g.lineTo(-4, 0); g.lineTo(-9, 1); g.moveTo(-4, 0); g.lineTo(1, 1); g.moveTo(5, -14); g.lineTo(6, 0); g.lineTo(1, 1); g.moveTo(6, 0); g.lineTo(11, 1); g.stroke();
  // tail feathers
  g.beginPath(); g.moveTo(-14, -26); g.bezierCurveTo(-24, -44, -34, -46, -36, -38); g.bezierCurveTo(-30, -36, -26, -30, -22, -22); g.closePath(); g.fillStyle = dark; g.fill(); g.lineWidth = 1.6; g.strokeStyle = RINK; g.stroke();
  // body
  const body = () => { g.beginPath(); g.moveTo(-20, -22); g.bezierCurveTo(-22, -36, -6, -40, 6, -36); g.bezierCurveTo(16, -34, 20, -26, 18, -18); g.bezierCurveTo(14, -10, -10, -10, -18, -16); g.closePath(); };
  body(); const bgr = g.createLinearGradient(0, -40, 0, -10); bgr.addColorStop(0, light); bgr.addColorStop(1, dark); g.fillStyle = bgr; g.fill(); g.lineWidth = 1.8; g.strokeStyle = RINK; g.stroke();
  // wing
  g.beginPath(); g.moveTo(-12, -28); g.bezierCurveTo(-4, -34, 8, -30, 10, -22); g.bezierCurveTo(2, -18, -8, -18, -12, -28); g.closePath(); g.fillStyle = mixc(col, '#1e1711', 0.25); g.fill(); g.lineWidth = 1.2; g.stroke();
  g.strokeStyle = 'rgba(30,20,10,0.5)'; g.lineWidth = 0.8; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(-6 + k * 5, -27); g.lineTo(-3 + k * 5, -21); g.stroke(); }
  // neck + head (pecks)
  g.save(); g.translate(12, -32); g.rotate(peck * 1.5);
  g.beginPath(); g.moveTo(-6, 4); g.quadraticCurveTo(-4, -8, 2, -12); g.lineTo(8, -10); g.quadraticCurveTo(6, 0, 4, 6); g.closePath(); g.fillStyle = col; g.fill(); g.lineWidth = 1.4; g.strokeStyle = RINK; g.stroke();
  g.beginPath(); g.ellipse(5, -14, 6.5, 5.5, 0, 0, 7); g.fillStyle = col; g.fill(); g.stroke();
  g.beginPath(); g.moveTo(1, -19); g.quadraticCurveTo(2, -25, 4, -21); g.quadraticCurveTo(6, -27, 8, -21); g.quadraticCurveTo(10, -24, 10, -18); g.closePath(); g.fillStyle = '#c4302a'; g.fill(); g.lineWidth = 1; g.stroke();
  g.beginPath(); g.ellipse(9, -9, 2, 3, 0, 0, 7); g.fillStyle = '#c4302a'; g.fill();
  g.beginPath(); g.moveTo(10.5, -15); g.lineTo(16, -13); g.lineTo(10.5, -11.5); g.closePath(); g.fillStyle = '#e2a82e'; g.fill(); g.lineWidth = 0.9; g.stroke();
  g.fillStyle = '#16110d'; g.beginPath(); g.arc(7, -15, 1.2, 0, 7); g.fill();
  g.restore(); g.restore();
};
window.ready5 = window.ready3;

// ---------------------------------------------------------------- rocks: irregular, shaded boulders
rockMass = function (g, pts, col = '#a3927a') {
  let cx = 0, cy = 0; pts.forEach(p => { cx += p[0]; cy += p[1]; }); cx /= pts.length; cy /= pts.length;
  const sm = () => { g.beginPath(); for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; if (i === 0) g.moveTo(mx, my); g.quadraticCurveTo(b[0], b[1], (b[0] + pts[(i + 2) % pts.length][0]) / 2, (b[1] + pts[(i + 2) % pts.length][1]) / 2); } g.closePath(); };
  sm(); const ys = pts.map(p => p[1]); const rg = g.createLinearGradient(cx - 60, Math.min(...ys), cx + 60, Math.max(...ys)); rg.addColorStop(0, mixc(col, '#f4ead8', 0.3)); rg.addColorStop(1, mixc(col, '#2a221a', 0.35)); g.fillStyle = rg; g.fill();
  g.save(); sm(); g.clip(); g.strokeStyle = 'rgba(40,32,24,0.35)'; g.lineWidth = 1.3;
  for (let k = 0; k < 5; k++) { const x0 = cx + (hash(k + cx) - 0.5) * 80, y0 = Math.min(...ys) + 8; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + (hash(k + 3) - 0.5) * 40, y0 + 40 + hash(k) * 60); g.stroke(); }
  g.restore(); sm(); rinkStroke(g, 2.2);
};
