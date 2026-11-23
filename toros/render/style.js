// Illustration style matched to the user's white-Toros reference: warm ink outlines (#3a2a1c), cross-hatched
// shading, muted earthy palette, printed-paper texture. Overrides the flat-vector helpers of scene.js / keci.js.
'use strict';
const INK2 = '#221d18';
let HATCH = null, HATCH_L = null, PAPER = null;
function makeHatch(sp, lw, col) {
  const c = document.createElement('canvas'); c.width = c.height = sp * 4;
  const g = c.getContext('2d'); g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'square';
  for (let k = -4; k <= 8; k++) { g.beginPath(); g.moveTo(k * sp, 0); g.lineTo(k * sp - sp * 4, sp * 4); g.stroke(); }
  return ctx.createPattern(c, 'repeat');
}
async function styleLoad() {
  await window.ready2;
  // the Toros reference is cel-shaded with soft tonal shadows, not hatched
  HATCH = 'rgba(34,28,22,0.13)';
  HATCH_L = 'rgba(34,28,22,0.06)';
  await loadImg('paper', '../assets/sprites/paper.png');
  PAPER = IMG.paper;
  return true;
}
function ink(g, w = 2.6) { g.lineWidth = w; g.strokeStyle = INK2; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); }
function hatchFill(g, pat = HATCH) { g.save(); g.fillStyle = pat; g.fill(); g.restore(); }

// ---------------------------------------------------------------- sky & clouds
sky = function (g, top, mid, bot, horizon) {
  // keep the caller's hues but pull them toward the reference's warm, faded print tones
  const lg = g.createLinearGradient(0, 0, 0, horizon);
  lg.addColorStop(0, mixc(top, '#c9b48e', 0.30)); lg.addColorStop(0.6, mixc(mid, '#e8d6b0', 0.35)); lg.addColorStop(1, mixc(bot, '#f1e2c2', 0.45));
  g.fillStyle = lg; g.fillRect(0, 0, W, horizon + 4);
};
function mixc(a, b, k) {
  const p = s => s.startsWith('#') ? [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)) : [200, 200, 200];
  const A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',')})`;
}
sun = function (g, x, y, r, col = '#fbefc8', glow = 'rgba(255,236,190,0.35)') {
  const gl = g.createRadialGradient(x, y, r * 0.6, x, y, r * 2.6); gl.addColorStop(0, glow); gl.addColorStop(1, 'rgba(255,236,190,0)');
  g.fillStyle = gl; g.beginPath(); g.arc(x, y, r * 2.6, 0, 7); g.fill();
  g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = col; g.fill(); ink(g, 2);
};
cloud = function (g, x, y, s, a = 1) {
  g.save(); g.globalAlpha = a; g.translate(x, y); g.scale(s, s);
  const P = () => { g.beginPath(); g.moveTo(-96, 22); g.bezierCurveTo(-120, 0, -86, -30, -58, -16); g.bezierCurveTo(-52, -52, 2, -60, 12, -30);
    g.bezierCurveTo(30, -50, 72, -38, 66, -10); g.bezierCurveTo(98, -12, 104, 22, 80, 26); g.closePath(); };
  P(); g.fillStyle = '#f6eedb'; g.fill();
  g.save(); P(); g.clip(); g.beginPath(); g.rect(-130, 2, 260, 40); g.fillStyle = 'rgba(190,170,140,0.35)'; g.fill(); g.beginPath(); g.rect(-130, 8, 260, 40); hatchFill(g, HATCH_L); g.restore();
  P(); ink(g, 2.2 / s);
  g.restore();
};

// ---------------------------------------------------------------- mountains (ink ridge + hatched shadow flanks)
function ridgePts(camPx, baseY, p, height, seed, step = 14) {
  const off = camPx * p, pts = [];
  for (let x = -30; x <= W + 30; x += step) {
    const wx = (x + off) / 260 + seed;
    const y = baseY - height * (0.55 + 0.25 * Math.sin(wx * 1.3) + 0.2 * Math.sin(wx * 2.9 + 1.7) + 0.12 * Math.sin(wx * 6.1) + 0.04 * Math.sin(wx * 17));
    pts.push([x, y]);
  }
  return pts;
}
function drawRange(g, pts, baseY, col, snowLine, snow) {
  const path = () => { g.beginPath(); g.moveTo(-30, baseY); for (const [x, y] of pts) g.lineTo(x, y); g.lineTo(W + 30, baseY); g.closePath(); };
  path(); g.fillStyle = col; g.fill();
  g.save(); path(); g.clip();
  // shadow flanks: where the ridge descends to the right (light from the left) -> hatching
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    if (y1 > y0) { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineTo(x1 + 70, baseY); g.lineTo(x0 + 70, baseY); g.closePath(); g.fillStyle = 'rgba(40,30,20,0.10)'; g.fill(); hatchFill(g, HATCH); }
  }
  if (snow) {
    g.beginPath(); g.moveTo(-30, 0);
    for (const [x, y] of pts) g.lineTo(x, Math.max(y, snowLine + Math.sin(x * 0.09) * 10 + ((x / 14) % 2 ? 12 : -4)));
    g.lineTo(W + 30, 0); g.closePath(); g.fillStyle = '#f4efe2'; g.fill();
  }
  // contour strokes on the flanks (engraving feel)
  g.strokeStyle = 'rgba(34,28,22,0.18)'; g.lineWidth = 1.2;
  for (let i = 3; i < pts.length - 3; i += 9) { const [x, y] = pts[i]; g.beginPath(); g.moveTo(x, y + 6); g.quadraticCurveTo(x + 18, y + 40, x + 8, y + 90); g.stroke(); }
  g.restore();
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const [x, y] of pts) g.lineTo(x, y); ink(g, 2.6);
}
mountains = function (g, camPx, baseY, p, col, height, snow = true, seed = 0) {
  const pts = ridgePts(camPx, baseY, p, height, seed);
  drawRange(g, pts, baseY, mixc(col, '#a39a88', 0.45), baseY - height * 0.8, snow);
};
snowMountains = function (g, camPx, baseY, p, height, col, seed) {
  const pts = ridgePts(camPx, baseY, p, height, seed, 12);
  drawRange(g, pts, baseY, mixc(col, '#9aa0a3', 0.4), baseY - height * 0.68, true);
};

// ---------------------------------------------------------------- vegetation
poplar = function (g, x, base, h, w, col = '#6f8a3c', dark = '#566d2e') {
  col = mixc(col, '#7b8a45', 0.5); dark = mixc(dark, '#4f5e2a', 0.5);
  g.fillStyle = '#5b4030'; g.fillRect(x - 3, base - h * 0.14, 6, h * 0.14);
  const P = () => { g.beginPath(); g.moveTo(x, base - h);
    const n = 9; for (let i = 0; i <= n; i++) { const t = i / n, yy = base - h + t * h * 0.88, ww = w * Math.sin(Math.PI * Math.min(1, t * 1.1)) * (0.85 + 0.25 * Math.sin(i * 2.7)); g.lineTo(x + ww, yy); }
    for (let i = n; i >= 0; i--) { const t = i / n, yy = base - h + t * h * 0.88, ww = w * Math.sin(Math.PI * Math.min(1, t * 1.1)) * (0.85 + 0.25 * Math.cos(i * 2.1)); g.lineTo(x - ww, yy); }
    g.closePath(); };
  P(); g.fillStyle = col; g.fill();
  g.save(); P(); g.clip(); g.beginPath(); g.rect(x, base - h, w * 2, h); g.fillStyle = dark; g.fill(); hatchFill(g, HATCH); g.restore();
  // leaf tufts
  g.strokeStyle = 'rgba(58,42,28,0.55)'; g.lineWidth = 1.2;
  for (let i = 0; i < 10; i++) { const t = (i + 0.5) / 10, yy = base - h + t * h * 0.85, ww = w * 0.6 * Math.sin(Math.PI * t); g.beginPath(); g.arc(x + (i % 2 ? ww * 0.3 : -ww * 0.3), yy, w * 0.28, 0.3, 2.6); g.stroke(); }
  P(); ink(g, 2.2);
};
roundTree = function (g, x, base, r, col = '#7a8f45') {
  col = mixc(col, '#7b8a45', 0.5);
  g.beginPath(); g.moveTo(x - 7, base); g.lineTo(x - 4, base - r * 1.3); g.lineTo(x + 4, base - r * 1.3); g.lineTo(x + 8, base); g.closePath(); g.fillStyle = '#6a4a32'; g.fill(); ink(g, 2);
  const lobes = [[0, -2.0, 0.62], [-0.55, -1.7, 0.5], [0.55, -1.75, 0.52], [-0.3, -2.35, 0.45], [0.35, -2.3, 0.48], [0, -1.45, 0.5]];
  for (const [dx, dy, rr] of lobes) {
    const cx = x + dx * r, cy = base + dy * r, R = rr * r;
    g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fillStyle = col; g.fill();
    g.save(); g.beginPath(); g.arc(cx, cy, R, 0, 7); g.clip(); g.beginPath(); g.arc(cx + R * 0.35, cy + R * 0.4, R * 0.95, 0, 7); g.fillStyle = 'rgba(50,60,25,0.35)'; g.fill(); hatchFill(g, HATCH); g.restore();
    g.beginPath(); g.arc(cx, cy, R, Math.PI * 0.75, Math.PI * 2.25); ink(g, 2);
  }
};
haystack = function (g, x, base, r) {
  const P = () => { g.beginPath(); g.moveTo(x - r, base); g.bezierCurveTo(x - r * 1.05, base - r * 1.2, x - r * 0.4, base - r * 1.6, x, base - r * 1.6); g.bezierCurveTo(x + r * 0.4, base - r * 1.6, x + r * 1.05, base - r * 1.2, x + r, base); g.closePath(); };
  P(); g.fillStyle = '#d2a75a'; g.fill();
  g.save(); P(); g.clip(); g.beginPath(); g.rect(x, base - r * 2, r * 2, r * 2); hatchFill(g, HATCH); g.restore();
  g.strokeStyle = 'rgba(120,80,30,0.7)'; g.lineWidth = 1.3;
  for (let i = -6; i <= 6; i++) { g.beginPath(); g.moveTo(x + i * r * 0.15, base - 2); g.quadraticCurveTo(x + i * r * 0.12, base - r * 0.8, x + i * r * 0.08, base - r * 1.4 + Math.abs(i) * 4); g.stroke(); }
  P(); ink(g, 2.4);
};
grass = function (g, camPx, y0, col = '#9a9a55', col2 = '#87884a', ppm = 205) {
  col = mixc(col, '#a39a5c', 0.55); col2 = mixc(col2, '#8c844c', 0.55);
  g.fillStyle = col; g.fillRect(0, y0, W, H - y0);
  g.fillStyle = col2; g.fillRect(0, y0, W, 14);
  g.save(); g.beginPath(); g.rect(0, y0, W, H - y0); g.globalAlpha = 0.5; g.fillStyle = HATCH_L; g.fill(); g.restore();
  layer(g, camPx, 1.15, 52, (x, i) => {
    const y = y0 + 30 + hash(i * 2.3) * (H - y0 - 60);
    g.strokeStyle = INK2; g.lineWidth = 1.6;
    for (let k = -3; k <= 3; k++) { g.beginPath(); g.moveTo(x + k * 4, y); g.quadraticCurveTo(x + k * 7, y - 16, x + k * 10 + 3, y - 26 - hash(i + k) * 14); g.stroke(); }
    if (hash(i + 11) > 0.75) { g.fillStyle = ['#efe6d2', '#d9b54a', '#c45c44'][i % 3]; g.beginPath(); g.arc(x + 10, y - 34, 4.5, 0, 7); g.fill(); g.lineWidth = 1; g.stroke(); }
  }, 2);
};
fields = function (g, camPx, y0, y1, p, cols) {
  g.fillStyle = mixc(cols[0], '#c2b27a', 0.5); g.fillRect(0, y0, W, y1 - y0);
  layer(g, camPx, p, 380, (x, i) => {
    const yy = y0 + 10 + hash(i) * (y1 - y0 - 50);
    g.beginPath(); g.moveTo(x - 200, yy + 30); g.lineTo(x + 220, yy + 8); g.lineTo(x + 260, yy + 40); g.lineTo(x - 180, yy + 60); g.closePath();
    g.fillStyle = mixc(cols[1 + (Math.abs(i) % (cols.length - 1))], '#b8a66c', 0.5); g.fill();
    g.strokeStyle = 'rgba(58,42,28,0.35)'; g.lineWidth = 1; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(x - 190 + k * 10, yy + 34 + k * 6); g.lineTo(x + 230 + k * 8, yy + 12 + k * 6); g.stroke(); }
  }, 5);
};

// ---------------------------------------------------------------- buildings (plaster, stone, tiled roofs, like the reference village)
house = function (g, x, base, w, h, wall = '#e9dcc0', roof = '#b8583c') {
  wall = mixc(wall, '#e4d3b2', 0.5); roof = mixc(roof, '#b2563a', 0.5);
  g.beginPath(); g.rect(x, base - h, w, h); g.fillStyle = wall; g.fill();
  g.save(); g.beginPath(); g.rect(x + w * 0.6, base - h, w * 0.4, h); g.clip(); g.beginPath(); g.rect(x, base - h, w, h); hatchFill(g, HATCH_L); g.restore();
  g.strokeStyle = 'rgba(58,42,28,0.3)'; g.lineWidth = 1; for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(x + 8 + hash(i + x) * (w - 16), base - 8 - hash(i * 3 + x) * (h - 16), 4, 2.5, 0, 0, 7); g.stroke(); }
  g.beginPath(); g.rect(x, base - h, w, h); ink(g, 2);
  g.beginPath(); g.moveTo(x - 8, base - h); g.lineTo(x + w * 0.5, base - h - h * 0.5); g.lineTo(x + w + 8, base - h); g.closePath(); g.fillStyle = roof; g.fill();
  g.save(); g.clip(); g.strokeStyle = 'rgba(58,30,20,0.55)'; g.lineWidth = 1; for (let k = 1; k < 5; k++) { const yy = base - h - h * 0.5 * k / 5; g.beginPath(); g.moveTo(x - 10, yy); g.lineTo(x + w + 10, yy); g.stroke(); } g.restore();
  g.beginPath(); g.moveTo(x - 8, base - h); g.lineTo(x + w * 0.5, base - h - h * 0.5); g.lineTo(x + w + 8, base - h); g.closePath(); ink(g, 2);
  for (let i = 0; i < Math.max(1, Math.floor(w / 34)); i++) { g.fillStyle = '#5d7486'; g.fillRect(x + 9 + i * 34, base - h * 0.72, 13, 15); g.strokeStyle = INK2; g.lineWidth = 1.5; g.strokeRect(x + 9 + i * 34, base - h * 0.72, 13, 15); }
  g.fillStyle = '#6e4a30'; g.fillRect(x + w - 22, base - h * 0.55, 13, h * 0.55); g.strokeRect(x + w - 22, base - h * 0.55, 13, h * 0.55);
};
minaret = function (g, x, base, h) {
  g.beginPath(); g.rect(x - 9, base - h, 18, h); g.fillStyle = '#ece4d2'; g.fill(); ink(g, 2);
  g.beginPath(); g.rect(x - 14, base - h * 0.72, 28, 8); g.fillStyle = '#ddd2bb'; g.fill(); ink(g, 2);
  g.beginPath(); g.moveTo(x - 10, base - h); g.lineTo(x, base - h - 46); g.lineTo(x + 10, base - h); g.closePath(); g.fillStyle = '#8f938f'; g.fill(); ink(g, 2);
  g.beginPath(); g.ellipse(x - 70, base - 40, 60, 46, 0, Math.PI, 0); g.fillStyle = '#e4dccb'; g.fill(); ink(g, 2);
  g.beginPath(); g.rect(x - 130, base - 40, 120, 40); g.fillStyle = '#ebe3d1'; g.fill(); ink(g, 2);
};
factory = function (g, x0, base) {
  const w = 600, h = 300;
  g.beginPath(); g.rect(x0, base - h, w, h); g.fillStyle = '#b9785a'; g.fill();
  // brick courses
  g.save(); g.clip(); g.strokeStyle = 'rgba(70,35,20,0.45)'; g.lineWidth = 1;
  for (let y = base - h, r = 0; y < base; y += 12, r++) { g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + w, y); g.stroke(); for (let x = x0 + (r % 2) * 14; x < x0 + w; x += 28) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 12); g.stroke(); } }
  g.beginPath(); g.rect(x0 + w * 0.65, base - h, w * 0.35, h); hatchFill(g, HATCH); g.restore();
  g.beginPath(); g.rect(x0, base - h, w, h); ink(g, 3);
  g.beginPath(); g.moveTo(x0, base - h); for (let i = 0; i < 5; i++) { g.lineTo(x0 + i * 120, base - h - 70); g.lineTo(x0 + i * 120 + 120, base - h); } g.closePath(); g.fillStyle = '#8e8a80'; g.fill(); ink(g, 3);
  for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(x0 + i * 120 + 4, base - h - 64); g.lineTo(x0 + i * 120 + 4, base - h - 6); g.lineTo(x0 + i * 120 + 50, base - h - 6); g.closePath(); g.fillStyle = '#9fb2ba'; g.fill(); ink(g, 1.5); }
  for (let i = 0; i < 7; i++) { g.fillStyle = '#8ea5ae'; g.fillRect(x0 + 30 + i * 80, base - h + 50, 50, 70); g.strokeStyle = INK2; g.lineWidth = 2; g.strokeRect(x0 + 30 + i * 80, base - h + 50, 50, 70); g.beginPath(); g.moveTo(x0 + 55 + i * 80, base - h + 50); g.lineTo(x0 + 55 + i * 80, base - h + 120); g.stroke(); }
  g.beginPath(); g.rect(x0 + 470, base - h - 260, 46, 200); g.fillStyle = '#a5543a'; g.fill(); ink(g, 3);
  g.fillStyle = '#efe6d2'; g.fillRect(x0 + 470, base - h - 240, 46, 12); g.fillRect(x0 + 470, base - h - 200, 46, 12);
  g.beginPath(); g.rect(x0 + 200, base - 170, 240, 170); g.fillStyle = '#4a443d'; g.fill(); ink(g, 3);
  g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 2; for (let y = base - 160; y < base; y += 14) { g.beginPath(); g.moveTo(x0 + 204, y); g.lineTo(x0 + 436, y); g.stroke(); }
  g.beginPath(); g.roundRect(x0 + 150, base - h + 150, 340, 70, 10); g.fillStyle = '#e9dfc8'; g.fill(); ink(g, 3);
  txt(g, 'OYAK RENAULT · BURSA', x0 + 320, base - h + 197, { size: 26, font: 'IBlack', fill: '#3a2a1c' });
};

// ---------------------------------------------------------------- goat – drawn like the reference: inked, fur strokes, hatched shading
goat = function (g, x, y, s, o = {}) {
  const t = o.t ?? 0, bleat = o.bleat ?? 0, dir = o.dir ?? 1;
  g.save(); g.translate(x, y); g.scale(dir * s / 100, s / 100); // cm units, hooves on y=0, facing +x
  g.lineCap = 'round'; g.lineJoin = 'round';
  const leg = (x0, y0, x1, ph) => { // two-segment leg with knee, hoof
    const sw = o.walk ? Math.sin(t * 9 + ph) * 5 : 0;
    g.beginPath(); g.moveTo(x0 - 5, y0); g.quadraticCurveTo(x0 - 6 + sw * 0.4, -26, x1 - 3 + sw, -4); g.lineTo(x1 + 4 + sw, -4); g.quadraticCurveTo(x0 + 4 + sw * 0.4, -26, x0 + 5, y0); g.closePath();
    g.fillStyle = '#ece4d3'; g.fill(); g.lineWidth = 1.6; g.strokeStyle = INK2; g.stroke();
    g.beginPath(); g.moveTo(x1 - 4 + sw, -5); g.lineTo(x1 + 5 + sw, -5); g.lineTo(x1 + 6 + sw, 0); g.lineTo(x1 - 5 + sw, 0); g.closePath(); g.fillStyle = '#2e241c'; g.fill();
  };
  leg(-30, -46, -32, 0); leg(26, -46, 30, 1.5);                    // far legs
  // body
  const B = () => { g.beginPath(); g.moveTo(-46, -62); g.bezierCurveTo(-50, -84, -20, -90, 8, -86); g.bezierCurveTo(30, -84, 44, -82, 46, -66);
    g.bezierCurveTo(48, -50, 36, -40, 20, -42); g.bezierCurveTo(4, -38, -24, -38, -38, -44); g.bezierCurveTo(-46, -48, -48, -54, -46, -62); g.closePath(); };
  B(); g.fillStyle = '#f1eadb'; g.fill();
  g.save(); B(); g.clip();
  g.beginPath(); g.ellipse(-8, -72, 22, 13, 0.2, 0, 7); g.fillStyle = '#9a6a42'; g.fill();               // brown patch
  g.beginPath(); g.rect(-60, -56, 120, 30); g.fillStyle = 'rgba(120,95,70,0.25)'; g.fill(); hatchFill(g, HATCH); // belly shade
  g.restore();
  // fur strokes along the back and belly
  g.strokeStyle = 'rgba(58,42,28,0.6)'; g.lineWidth = 1;
  for (let i = 0; i < 14; i++) { const xx = -40 + i * 6; g.beginPath(); g.moveTo(xx, -86 + Math.abs(i - 7) * 0.4); g.lineTo(xx - 3, -80); g.stroke(); g.beginPath(); g.moveTo(xx, -42); g.lineTo(xx - 2, -36 - (i % 3) * 2); g.stroke(); }
  B(); g.lineWidth = 2.2; g.strokeStyle = INK2; g.stroke();
  leg(-22, -46, -20, 3); leg(34, -48, 36, 4.5);                    // near legs
  // tail
  g.beginPath(); g.moveTo(-46, -76); g.quadraticCurveTo(-58, -92 - Math.sin(t * 12) * 3, -52, -98); g.lineWidth = 5; g.strokeStyle = '#efe7d6'; g.stroke(); g.lineWidth = 1.4; g.strokeStyle = INK2; g.stroke();
  // neck + head
  g.save(); g.translate(40, -78); g.rotate(-0.55 - bleat * 0.3 + Math.sin(t * 1.7) * 0.04);
  g.beginPath(); g.moveTo(-10, 6); g.bezierCurveTo(-12, -18, -4, -36, 4, -42); g.lineTo(16, -38); g.bezierCurveTo(14, -24, 12, -6, 10, 8); g.closePath(); g.fillStyle = '#f1eadb'; g.fill(); g.lineWidth = 2; g.strokeStyle = INK2; g.stroke();
  g.translate(10, -42); g.rotate(1.0 + bleat * 0.25);
  // horns (curved back, ridged)
  g.beginPath(); g.moveTo(-2, -10); g.bezierCurveTo(-14, -30, -34, -32, -40, -16); g.bezierCurveTo(-34, -24, -18, -22, 6, -8); g.closePath(); g.fillStyle = '#9b8566'; g.fill(); g.lineWidth = 1.6; g.strokeStyle = INK2; g.stroke();
  for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(-8 - k * 6, -16 - k * 2.5); g.lineTo(-4 - k * 6, -22 - k * 2.2); g.lineWidth = 1; g.stroke(); }
  // head shape
  g.beginPath(); g.moveTo(-6, -8); g.bezierCurveTo(6, -14, 24, -12, 34, -2); g.bezierCurveTo(38, 4, 34, 10, 26, 10); g.bezierCurveTo(14, 12, 0, 10, -6, 4); g.closePath();
  g.fillStyle = '#f1eadb'; g.fill(); g.lineWidth = 2; g.strokeStyle = INK2; g.stroke();
  g.save(); g.clip(); g.beginPath(); g.rect(-10, 2, 50, 12); hatchFill(g, HATCH); g.restore();
  // droopy ear
  g.beginPath(); g.moveTo(-2, -6); g.bezierCurveTo(-16, -6, -22, 6, -18, 12); g.bezierCurveTo(-10, 8, -4, 2, 2, -2); g.closePath(); g.fillStyle = '#e2d7c2'; g.fill(); g.lineWidth = 1.6; g.stroke();
  // eye (horizontal pupil)
  g.beginPath(); g.ellipse(10, -5, 4, 3, 0, 0, 7); g.fillStyle = '#d9a83c'; g.fill(); g.lineWidth = 1.2; g.stroke();
  g.fillStyle = '#1e1712'; g.fillRect(7.5, -5.8, 5, 1.6);
  // nostril + mouth
  g.fillStyle = '#3a2a1c'; g.beginPath(); g.ellipse(32, -1, 1.6, 1, 0.4, 0, 7); g.fill();
  g.beginPath(); g.ellipse(28, 7, 4, 0.8 + bleat * 3.5, 0.15, 0, 7); g.fillStyle = '#5a2c22'; g.fill();
  // beard
  g.beginPath(); g.moveTo(20, 9); g.bezierCurveTo(18, 18, 20, 26, 24, 30); g.bezierCurveTo(26, 22, 28, 16, 28, 9); g.closePath(); g.fillStyle = '#e7dcc8'; g.fill(); g.lineWidth = 1.4; g.stroke();
  g.restore();
  g.restore();
  if (bleat > 0.3) txt(g, 'MEEE!', x + dir * s * 0.95, y - s * 1.8, { size: Math.max(28, s * 0.32), font: 'IBlackI', fill: '#f6eedb', stroke: INK2, sw: 8, alpha: clamp((bleat - 0.3) * 3, 0, 1), rot: -0.12 * dir });
};

// ---------------------------------------------------------------- town (90s apartments drawn like the reference village houses)
townWorld = function (g, camM, ppm, t) {
  const camPx = camM * ppm;
  sky(g, '#7ab6e2', '#b9dcef', '#f3eedd', 950);
  sun(g, 880, 280, 54);
  clouds(g, camPx, t, 170, 4, 0.03);
  const pal = ['#e2cfae', '#d6d2bb', '#e6d0bc', '#cdcfc4', '#e3d3a4'];
  layer(g, camPx, 0.35, 260, (x, i) => {
    const fl = 4 + Math.floor(hash(i) * 3), w = 220, hgt = fl * 78, base = 1050;
    g.beginPath(); g.rect(x, base - hgt, w, hgt); g.fillStyle = pal[Math.abs(i) % 5]; g.fill();
    g.save(); g.clip(); g.beginPath(); g.rect(x + w * 0.7, base - hgt, w * 0.3, hgt); hatchFill(g, HATCH_L); g.restore();
    g.beginPath(); g.rect(x, base - hgt, w, hgt); ink(g, 2.6);
    for (let f = 0; f < fl; f++) for (let c = 0; c < 3; c++) {
      const wx = x + 22 + c * 66, wy = base - hgt + 18 + f * 78;
      g.fillStyle = '#6c8191'; g.fillRect(wx, wy, 42, 44); g.strokeStyle = INK2; g.lineWidth = 1.8; g.strokeRect(wx, wy, 42, 44);
      g.beginPath(); g.moveTo(wx + 21, wy); g.lineTo(wx + 21, wy + 44); g.stroke();
      if ((f + c + i) % 3 === 0) { g.fillStyle = '#e1d8c4'; g.fillRect(wx - 6, wy + 40, 54, 8); g.strokeRect(wx - 6, wy + 40, 54, 8); }
    }
    g.fillStyle = '#a9563c'; g.fillRect(x - 6, base - hgt - 10, w + 12, 12); g.strokeRect(x - 6, base - hgt - 10, w + 12, 12);
    if (hash(i + 4) > 0.5) { g.fillStyle = '#efe6d2'; g.fillRect(x + 20, base - 40, 180, 40); g.strokeRect(x + 20, base - 40, 180, 40); txt(g, ['BAKKAL', 'BERBER', 'FIRIN', 'KAHVE'][Math.abs(i) % 4], x + 110, base - 10, { size: 24, font: 'IBlack', fill: '#9e3a2a' }); }
  }, 61);
  g.fillStyle = '#c9bfa8'; g.fillRect(0, 1050, W, 70);
  g.fillStyle = 'rgba(58,42,28,0.25)'; layer(g, camPx, 1, 90, x => g.fillRect(x, 1050, 2, 70), 0);
  g.fillStyle = '#958b77'; g.fillRect(0, 1112, W, 10);
  layer(g, camPx, 1, 560, (x) => { g.fillStyle = '#4a4440'; g.fillRect(x, 760, 10, 300); g.fillRect(x - 60, 760, 70, 9); g.fillStyle = '#f3e3b0'; g.beginPath(); g.ellipse(x - 56, 774, 20, 9, 0, 0, 7); g.fill(); }, 3);
  road(g, camPx, 1120, 1330, ppm, { asphalt: '#77716a' });
  g.fillStyle = '#c9bfa8'; g.fillRect(0, 1330, W, 60); g.fillStyle = '#958b77'; g.fillRect(0, 1330, W, 10);
  grass(g, camPx, 1390);
};

// ---------------------------------------------------------------- road (inked edges, worn asphalt, hatched kerb)
const _roadOrig = road;
road = function (g, camPx, y0, y1, ppm, opts = {}) {
  _roadOrig(g, camPx, y0, y1, ppm, Object.assign({}, opts, { asphalt: opts.asphalt ? mixc(opts.asphalt, '#7d766c', 0.4) : '#7d766c' }));
  g.save(); g.beginPath(); g.rect(0, y0, W, y1 - y0); g.globalAlpha = 0.35; g.fillStyle = HATCH_L; g.fill(); g.restore();
  g.strokeStyle = 'rgba(58,42,28,0.35)'; g.lineWidth = 1.5;
  layer(g, camPx, 1, 140, (x, i) => { g.beginPath(); g.moveTo(x, y0 + 30 + hash(i) * (y1 - y0 - 60)); g.lineTo(x + 30 + hash(i + 1) * 50, y0 + 34 + hash(i) * (y1 - y0 - 60)); g.stroke(); }, 7);
  g.beginPath(); g.moveTo(0, y0); g.lineTo(W, y0); g.moveTo(0, y1); g.lineTo(W, y1); ink(g, 3);
};

// ---------------------------------------------------------------- print finish: paper grain (from the reference) + warm grade
const _finishOrig = finish;
finish = function (g, t, vig = 0.35) {
  if (window.__PHOTO_SCENE) { _finishOrig(g, t, vig * 0.7); return; }
  g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.55; g.drawImage(PAPER, 0, 0, W, H); g.restore();
  g.save(); g.globalCompositeOperation = 'soft-light'; g.fillStyle = 'rgba(214,170,110,0.35)'; g.fillRect(0, 0, W, H); g.restore();
  _finishOrig(g, t, vig);
};
window.ready3 = styleLoad();
