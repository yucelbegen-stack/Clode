// TOROS – 59 s vertical cartoon documentary. Deterministic: render(t) draws frame at time t (s).
'use strict';
const W = 1080, H = 1920, FPS = 60, DUR = 59;
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
ctx.imageSmoothingQuality = 'high';

// ------------------------------------------------------------------ assets
const IMG = {};
let META = null;
const COLORS = ['white', 'red', 'green', 'blue', 'black', 'taxi', 'police'];
function loadImg(name, src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => { IMG[name] = i; res(); }; i.onerror = rej; i.src = src; });
}
async function loadAll() {
  META = await (await fetch('../assets/sprites/side_meta.json')).json();
  const L = [];
  for (const c of COLORS) {
    L.push(loadImg('station_' + c, `../assets/sprites/side_station_${c}.png`));
    L.push(loadImg('sedan_' + c, `../assets/sprites/side_sedan_${c}.png`));
  }
  L.push(loadImg('wheel_hi', '../assets/sprites/wheel_hi.png'));
  L.push(loadImg('wheel_sedan', '../assets/sprites/wheel_sedan.png'));
  L.push(loadImg('muddy', '../assets/sprites/muddy.png'));
  L.push(loadImg('front', '../assets/sprites/front_white.png'));
  await Promise.all(L);
  await Promise.all(['IBlack', 'IBlackI', 'IXB', 'IBold'].map(f => document.fonts.load(`80px ${f}`, 'ÇĞİÖŞÜçğıöşü')));
  window.NO_SHADOW = true;
  buildDecorated();
  buildGrain();
}

// ------------------------------------------------------------------ utils
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
const easeOut = k => 1 - Math.pow(1 - clamp(k, 0, 1), 3);
const easeIn = k => Math.pow(clamp(k, 0, 1), 3);
const easeOutBack = k => { k = clamp(k, 0, 1); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }

// motion profile: integrate speed v(t) (m/s) -> position(t) (m)
function makeMotion(vfn, dur, x0 = 0) {
  const dt = 1 / 480, n = Math.ceil(dur / dt) + 2, P = new Float64Array(n);
  P[0] = x0;
  for (let i = 1; i < n; i++) { const t = (i - 0.5) * dt; P[i] = P[i - 1] + vfn(t) * dt; }
  return {
    pos(t) { const f = clamp(t, 0, dur) / dt, i = Math.floor(f), k = f - i; return P[i] + (P[Math.min(i + 1, n - 1)] - P[i]) * k + (t > dur ? vfn(dur) * (t - dur) : 0) + (t < 0 ? vfn(0) * t : 0); },
    vel: vfn,
  };
}

// ------------------------------------------------------------------ car rendering
// sprite metadata (pixels of the source sprite)
function model(kind) {
  if (kind === 'station') {
    const m = META.side;
    return { m, wheel: 'wheel_hi', wheelSize: 1120, wheelR: 551, rM: m.rTire / m.pxPerM };
  }
  const m = META.sedan;
  return { m, wheel: 'wheel_sedan', wheelSize: 250, wheelR: 121.5, rM: m.rTire / m.pxPerM };
}

// taxi / police liveries painted once onto copies of the body sprites
const DECO = {};
function buildDecorated() {
  for (const kind of ['station', 'sedan']) {
    for (const c of COLORS) {
      const src = IMG[kind + '_' + c];
      const cnv = document.createElement('canvas'); cnv.width = src.width; cnv.height = src.height;
      const g = cnv.getContext('2d'); g.drawImage(src, 0, 0);
      if (c === 'taxi' || c === 'police') {
        g.globalCompositeOperation = 'source-atop';
        const beltY = kind === 'sedan' ? 418 : 330;   // just under the side trim / beltline
        const x0 = kind === 'sedan' ? 150 : 120, x1 = kind === 'sedan' ? 1560 : 1600;
        if (c === 'taxi') {
          // black-white checker band
          const s = 16;
          for (let x = x0; x < x1; x += s) for (let r = 0; r < 2; r++) {
            g.fillStyle = ((x / s + r) % 2 < 1) ? 'rgba(20,20,20,0.92)' : 'rgba(250,250,245,0.92)';
            g.fillRect(x, beltY + r * s, s, s);
          }
          g.font = '900 44px IBlack'; g.fillStyle = 'rgba(25,22,18,0.9)'; g.textAlign = 'center';
          g.fillText('TAKSİ', kind === 'sedan' ? 760 : 900, beltY + 92);
        } else {
          g.fillStyle = 'rgba(28,58,140,0.96)';
          g.fillRect(x0, beltY, x1 - x0, 46);
          g.fillStyle = 'rgba(200,30,40,0.95)';
          g.fillRect(x0, beltY + 46, x1 - x0, 9);
          g.font = '900 40px IBlack'; g.fillStyle = 'rgba(255,255,255,0.97)'; g.textAlign = 'center';
          g.fillText('POLİS', kind === 'sedan' ? 760 : 900, beltY + 37);
          g.font = '900 34px IBlack'; g.fillStyle = 'rgba(28,58,140,0.95)';
          g.fillText('155', kind === 'sedan' ? 1050 : 1180, beltY + 100);
        }
      }
      DECO[kind + '_' + c] = cnv;
    }
  }
}

// whole wheel (tyre + rim + hub cap) rotates as ONE rigid body; angle comes from distance rolled.
function drawWheel(g, md, cx, cy, rPx, angle, dAng, chains) {
  const img = IMG[md.wheel];
  const k = rPx / md.wheelR, S = md.wheelSize * k;
  const spread = Math.abs(dAng);                       // 360° shutter: blur = rotation during one frame
  const n = clamp(Math.ceil(spread / (1.2 * Math.PI / 180)), 1, 12);
  for (let i = 0; i < n; i++) {
    const a = angle - (n === 1 ? 0 : spread * Math.sign(dAng) * (i / (n - 1) - 0.5));
    g.save(); g.translate(cx, cy); g.rotate(a);
    g.globalAlpha = 1 / (i + 1);
    g.drawImage(img, -S / 2, -S / 2, S, S);
    g.restore();
  }
  g.globalAlpha = 1;
  if (chains) { // snow chains: cross links over the tread + side chain, rotate with the wheel
    g.save(); g.translate(cx, cy); g.rotate(angle);
    g.strokeStyle = '#c9ccd2'; g.lineCap = 'round';
    for (let k = 0; k < 10; k++) {
      const a = k * Math.PI / 5;
      g.lineWidth = rPx * 0.075; g.strokeStyle = '#3b3d42';
      g.beginPath(); g.moveTo(Math.cos(a) * rPx * 0.74, Math.sin(a) * rPx * 0.74); g.lineTo(Math.cos(a) * rPx * 1.01, Math.sin(a) * rPx * 1.01); g.stroke();
      g.lineWidth = rPx * 0.04; g.strokeStyle = '#d5d8de';
      g.beginPath(); g.moveTo(Math.cos(a) * rPx * 0.75, Math.sin(a) * rPx * 0.75); g.lineTo(Math.cos(a) * rPx * 1.0, Math.sin(a) * rPx * 1.0); g.stroke();
    }
    g.lineWidth = rPx * 0.035; g.strokeStyle = '#d5d8de'; g.setLineDash([rPx * 0.07, rPx * 0.05]);
    g.beginPath(); g.arc(0, 0, rPx * 0.76, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
    g.restore();
  }
  // fixed (non-rotating) lighting: sun from upper-left, ground bounce – sells the rotation
  g.save(); g.beginPath(); g.arc(cx, cy, rPx * 0.995, 0, Math.PI * 2); g.clip();
  const lg = g.createLinearGradient(cx - rPx * 0.6, cy - rPx, cx + rPx * 0.5, cy + rPx);
  lg.addColorStop(0, 'rgba(255,248,230,0.16)'); lg.addColorStop(0.45, 'rgba(255,255,255,0)'); lg.addColorStop(1, 'rgba(0,0,0,0.30)');
  g.fillStyle = lg; g.fillRect(cx - rPx, cy - rPx, rPx * 2, rPx * 2);
  g.restore();
}

// opts: kind, color, x (screen px of car centre), gy (ground line px), ppm (px per metre), dist (m rolled), v (m/s)
function drawCar(g, o) {
  const md = model(o.kind), m = md.m;
  const s = o.ppm / m.pxPerM;
  const w = m.w * s, h = m.h * s;
  const left = o.x - w / 2;
  const top = o.gy - m.ground * s;
  // clean contact shadow (baked reference shadows were removed)
  if (!o.noShadow && !window.NO_SHADOW) {
    g.save();
    const sg = g.createRadialGradient(o.x, o.gy, 0, o.x, o.gy, w * 0.52);
    sg.addColorStop(0, `rgba(30,24,18,${0.30 * (o.shadowA ?? 1)})`); sg.addColorStop(0.75, `rgba(30,24,18,${0.16 * (o.shadowA ?? 1)})`); sg.addColorStop(1, 'rgba(30,24,18,0)');
    g.fillStyle = sg; g.translate(o.x, o.gy); g.scale(1, 0.075); g.translate(-o.x, -o.gy);
    g.beginPath(); g.arc(o.x, o.gy, w * 0.52, 0, Math.PI * 2); g.fill(); g.restore();
  }
  // suspension: body floats a hair on the springs, wheels stay planted
  const bob = (o.bob ?? 1) * (Math.sin(o.dist * 2.1) * 0.9 + Math.sin(o.dist * 5.3 + 1) * 0.5) * clamp(Math.abs(o.v) / 2, 0, 1) * s * 2.2;
  const body = o.bodyImg || DECO[o.kind + '_' + o.color];
  if (o.bodyBlur) { g.save(); g.filter = `blur(${o.bodyBlur}px)`; }
  g.drawImage(body, left, top - bob, w, h);
  if (o.bodyBlur) g.restore();
  if (o.bodyOver) { g.save(); g.globalAlpha = o.bodyOverA ?? 1; g.drawImage(o.bodyOver, left, top - bob, w, h); g.restore(); }
  const rPx = m.rTire * s;
  const ang = o.dist / md.rM;
  const dAng = (o.v / FPS) / md.rM;
  for (const [wx] of m.wheels) drawWheel(g, md, left + wx * s, o.gy - rPx, rPx, ang, dAng, o.chains);
  if (o.onBody) o.onBody(g, left, top - bob, s);
  if (o.color === 'police') drawLightbar(g, o, left, top - bob, s);
  if (o.color === 'taxi') drawTaxiSign(g, o, left, top - bob, s);
  // exhaust puffs
  if (o.v > 0.3 && !o.noExhaust) {
    for (let i = 0; i < 4; i++) {
      const ph = ((o.t ?? 0) * 1.6 + i / 4) % 1;
      const ex = left + (o.kind === 'sedan' ? 70 : 60) * s - ph * 160 * s, ey = top + (o.kind === 'sedan' ? 555 : 470) * s - ph * 30 * s;
      g.fillStyle = `rgba(235,230,220,${0.35 * (1 - ph)})`;
      g.beginPath(); g.arc(ex, ey, (10 + ph * 34) * s, 0, Math.PI * 2); g.fill();
    }
  }
  return { left, top, w, h, s, rPx };
}
function roofOf(kind) { return kind === 'sedan' ? { x0: 600, x1: 860, y: 112 } : { x0: 560, x1: 900, y: 6 }; }
function drawLightbar(g, o, left, top, s) {
  const r = roofOf(o.kind);
  const x0 = left + r.x0 * s, x1 = left + r.x1 * s, y = top + r.y * s;
  const hh = 34 * s;
  g.fillStyle = '#2a2a2e'; g.fillRect(x0 + 10 * s, y - 8 * s, x1 - x0 - 20 * s, 10 * s);
  const ph = Math.floor((o.t ?? 0) * 6) % 2;
  const half = (x1 - x0) / 2;
  const cols = [['#ff2a2a', '#5a1010'], ['#1f6bff', '#0b1d55']];
  for (let i = 0; i < 2; i++) {
    const on = (i === ph);
    g.fillStyle = on ? cols[i][0] : cols[i][1];
    g.beginPath(); g.roundRect(x0 + i * half + 3 * s, y - hh, half - 6 * s, hh - 6 * s, 8 * s); g.fill();
    g.strokeStyle = '#1b1b1b'; g.lineWidth = 3 * s; g.stroke();
    if (on) {
      const cx = x0 + i * half + half / 2, cy = y - hh / 2;
      const gl = g.createRadialGradient(cx, cy, 0, cx, cy, 260 * s);
      gl.addColorStop(0, i ? 'rgba(60,120,255,0.55)' : 'rgba(255,50,50,0.55)'); gl.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gl; g.beginPath(); g.arc(cx, cy, 260 * s, 0, Math.PI * 2); g.fill();
    }
  }
}
function drawTaxiSign(g, o, left, top, s) {
  const r = roofOf(o.kind);
  const cx = left + (r.x0 + r.x1) / 2 * s, y = top + r.y * s;
  const w = 190 * s, h = 50 * s;
  g.fillStyle = '#1d1d1d'; g.fillRect(cx - w * 0.3, y - 8 * s, w * 0.6, 10 * s);
  g.fillStyle = '#ffd21a'; g.strokeStyle = '#1d1d1d'; g.lineWidth = 3.5 * s;
  g.beginPath(); g.roundRect(cx - w / 2, y - h - 4 * s, w, h, 10 * s); g.fill(); g.stroke();
  g.fillStyle = '#1d1d1d'; g.font = `900 ${30 * s}px IBlack`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('TAKSİ', cx, y - h / 2 - 3 * s);
  g.textBaseline = 'alphabetic';
}

// ------------------------------------------------------------------ world / backgrounds (flat paper-cut cartoon)
const INK = '#3a2e24';
function outline(g, w = 3) { g.lineWidth = w; g.strokeStyle = INK; g.lineJoin = 'round'; g.stroke(); }

function sky(g, top, mid, bot, horizon) {
  const lg = g.createLinearGradient(0, 0, 0, horizon);
  lg.addColorStop(0, top); lg.addColorStop(0.6, mid); lg.addColorStop(1, bot);
  g.fillStyle = lg; g.fillRect(0, 0, W, horizon + 4);
}
function sun(g, x, y, r, col = '#fff6c9', glow = 'rgba(255,240,180,0.45)') {
  const gl = g.createRadialGradient(x, y, r * 0.6, x, y, r * 3);
  gl.addColorStop(0, glow); gl.addColorStop(1, 'rgba(255,240,180,0)');
  g.fillStyle = gl; g.beginPath(); g.arc(x, y, r * 3, 0, 7); g.fill();
  g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
}
function cloud(g, x, y, s, a = 1) {
  g.save(); g.globalAlpha = a; g.translate(x, y); g.scale(s, s);
  g.beginPath();
  g.moveTo(-90, 20); g.arc(-60, 5, 32, Math.PI * 0.9, Math.PI * 1.75); g.arc(-15, -18, 42, Math.PI * 1.1, Math.PI * 1.95);
  g.arc(40, -5, 36, Math.PI * 1.25, Math.PI * 0.05); g.arc(75, 12, 22, Math.PI * 1.4, Math.PI * 0.5); g.lineTo(-90, 34); g.closePath();
  g.fillStyle = '#fbfaf6'; g.fill(); outline(g, 3 / s);
  g.restore();
}
function clouds(g, camPx, t, y0, n = 5, p = 0.04) {
  for (let i = -1; i < n + 1; i++) {
    const span = W + 400;
    let x = ((i * 330 + hash(i) * 120 - camPx * p - t * 8) % span + span) % span - 200;
    cloud(g, x, y0 + hash(i + 7) * 260, 0.9 + hash(i + 3) * 0.7);
  }
}
function mountains(g, camPx, baseY, p, col, height, snow = true, seed = 0) {
  const off = camPx * p;
  g.beginPath(); g.moveTo(0, baseY);
  const pts = [];
  for (let x = -20; x <= W + 20; x += 20) {
    const wx = (x + off) / 260 + seed;
    const y = baseY - height * (0.55 + 0.25 * Math.sin(wx * 1.3) + 0.2 * Math.sin(wx * 2.9 + 1.7) + 0.12 * Math.sin(wx * 6.1));
    pts.push([x, y]); g.lineTo(x, y);
  }
  g.lineTo(W + 20, baseY); g.closePath(); g.fillStyle = col; g.fill();
  if (snow) {
    g.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 1; i < pts.length - 1; i++) {
      const [x, y] = pts[i];
      if (y < pts[i - 1][1] && y < pts[i + 1][1] && y < baseY - height * 0.82) {
        g.beginPath(); g.moveTo(x - 26, y + 24); g.lineTo(x, y); g.lineTo(x + 24, y + 22); g.lineTo(x + 8, y + 16); g.lineTo(x - 4, y + 26); g.closePath(); g.fill();
      }
    }
  }
}
function poplar(g, x, base, h, w, col = '#5f9a3e', dark = '#4b7f30') {
  g.fillStyle = '#6b4a2f'; g.fillRect(x - 3, base - h * 0.12, 6, h * 0.12);
  g.beginPath(); g.moveTo(x, base - h); g.bezierCurveTo(x + w, base - h * 0.75, x + w * 0.8, base - h * 0.2, x, base - h * 0.08);
  g.bezierCurveTo(x - w * 0.8, base - h * 0.2, x - w, base - h * 0.75, x, base - h); g.closePath();
  g.fillStyle = col; g.fill(); outline(g, 2.5);
  g.beginPath(); g.moveTo(x, base - h * 0.95); g.bezierCurveTo(x + w * 0.7, base - h * 0.7, x + w * 0.6, base - h * 0.25, x + 2, base - h * 0.1); g.lineTo(x + 2, base - h * 0.95);
  g.fillStyle = dark; g.fill();
}
function roundTree(g, x, base, r, col = '#6fa84a') {
  g.fillStyle = '#6b4a2f'; g.fillRect(x - 5, base - r * 1.2, 10, r * 1.2);
  g.beginPath();
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; const rr = r * (0.85 + 0.15 * Math.sin(i * 2.3)); g.lineTo(x + Math.cos(a) * rr, base - r * 1.9 + Math.sin(a) * rr * 0.9); }
  g.closePath(); g.fillStyle = col; g.fill(); outline(g, 2.5);
  g.beginPath(); g.arc(x - r * 0.25, base - r * 2.1, r * 0.45, 0, 7); g.fillStyle = 'rgba(255,255,255,0.12)'; g.fill();
}
function house(g, x, base, w, h, wall = '#f3ead6', roof = '#c6553b') {
  g.beginPath(); g.rect(x, base - h, w, h); g.fillStyle = wall; g.fill(); outline(g, 2);
  g.beginPath(); g.moveTo(x - 8, base - h); g.lineTo(x + w * 0.5, base - h - h * 0.55); g.lineTo(x + w + 8, base - h); g.closePath();
  g.fillStyle = roof; g.fill(); outline(g, 2);
  g.fillStyle = '#5a7da0';
  for (let i = 0; i < Math.max(1, Math.floor(w / 34)); i++) g.fillRect(x + 10 + i * 34, base - h * 0.7, 14, 16);
  g.fillStyle = '#7a5236'; g.fillRect(x + w - 22, base - h * 0.55, 13, h * 0.55);
}
function minaret(g, x, base, h) {
  g.beginPath(); g.rect(x - 9, base - h, 18, h); g.fillStyle = '#f4f1e8'; g.fill(); outline(g, 2);
  g.beginPath(); g.rect(x - 14, base - h * 0.72, 28, 8); g.fillStyle = '#e8e2d2'; g.fill(); outline(g, 2);
  g.beginPath(); g.moveTo(x - 10, base - h); g.lineTo(x, base - h - 46); g.lineTo(x + 10, base - h); g.closePath(); g.fillStyle = '#9aa7b3'; g.fill(); outline(g, 2);
  g.beginPath(); g.ellipse(x - 70, base - 40, 60, 46, 0, Math.PI, 0); g.fillStyle = '#ece6d6'; g.fill(); outline(g, 2);
  g.beginPath(); g.rect(x - 130, base - 40, 120, 40); g.fillStyle = '#f4f0e6'; g.fill(); outline(g, 2);
}
function haystack(g, x, base, r) {
  g.beginPath(); g.moveTo(x - r, base); g.quadraticCurveTo(x - r, base - r * 1.5, x, base - r * 1.5); g.quadraticCurveTo(x + r, base - r * 1.5, x + r, base); g.closePath();
  g.fillStyle = '#e0b552'; g.fill(); outline(g, 2.5);
  g.strokeStyle = 'rgba(150,100,30,0.5)'; g.lineWidth = 2;
  for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(x + i * r * 0.3, base - 4); g.lineTo(x + i * r * 0.18, base - r * 1.2); g.stroke(); }
}
// repeated props along a parallax layer
function layer(g, camPx, p, spacing, fn, seed = 0) {
  const off = camPx * p;
  const i0 = Math.floor((off - 300) / spacing), i1 = Math.ceil((off + W + 300) / spacing);
  for (let i = i0; i <= i1; i++) fn(i * spacing - off + (hash(i + seed) - 0.5) * spacing * 0.5, i);
}
function poles(g, camPx, base, p = 0.92, spacing = 620) {
  const off = camPx * p, tops = [];
  const i0 = Math.floor((off - 700) / spacing), i1 = Math.ceil((off + W + 700) / spacing);
  for (let i = i0; i <= i1; i++) {
    const x = i * spacing - off;
    g.fillStyle = '#6b4a2f'; g.fillRect(x - 6, base - 330, 12, 330);
    g.fillRect(x - 50, base - 318, 100, 9); g.fillRect(x - 36, base - 290, 72, 7);
    g.strokeStyle = INK; g.lineWidth = 2; g.strokeRect(x - 6, base - 330, 12, 330);
    tops.push(x);
  }
  g.strokeStyle = 'rgba(40,32,26,0.85)'; g.lineWidth = 2;
  for (let k = 0; k < tops.length - 1; k++) for (const dy of [-314, -287]) for (const dx of [-44, 40]) {
    const a = tops[k] + dx * (dy === -287 ? 0.7 : 1), b = tops[k + 1] + dx * (dy === -287 ? 0.7 : 1);
    g.beginPath(); g.moveTo(a, base + dy); g.quadraticCurveTo((a + b) / 2, base + dy + 44, b, base + dy); g.stroke();
  }
}
function road(g, camPx, y0, y1, ppm, opts = {}) {
  g.fillStyle = opts.asphalt || '#7d7b78'; g.fillRect(0, y0, W, y1 - y0);
  // texture speckle moving exactly with ground
  g.fillStyle = 'rgba(255,255,255,0.05)';
  layer(g, camPx, 1, 23, (x, i) => { g.fillRect(x, y0 + 8 + hash(i * 3.1) * (y1 - y0 - 16), 3 + hash(i) * 5, 2); }, 4);
  g.fillStyle = 'rgba(0,0,0,0.06)';
  layer(g, camPx, 1, 37, (x, i) => { g.fillRect(x, y0 + 8 + hash(i * 1.7) * (y1 - y0 - 16), 6 + hash(i + 2) * 10, 3); }, 9);
  g.fillStyle = '#f2efe6';
  g.fillRect(0, y0 + 6, W, 6); g.fillRect(0, y1 - 12, W, 6);
  // centre dashes: 3 m dash / 3 m gap in world metres
  if (!opts.noDash) {
    const dash = 3 * ppm, per = 6 * ppm, off = ((camPx % per) + per) % per;
    const yd = opts.dashY ?? (y0 + y1) / 2 - 4;
    for (let x = -off; x < W + per; x += per) g.fillRect(x, yd, dash, 8);
  }
  g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, y0, W, 5);
}
function grass(g, camPx, y0, col = '#7fbf4d', col2 = '#6aa83e', ppm = 205) {
  g.fillStyle = col; g.fillRect(0, y0, W, H - y0);
  g.fillStyle = col2; g.fillRect(0, y0, W, 18);
  layer(g, camPx, 1.15, 70, (x, i) => {
    const y = y0 + 40 + hash(i * 2.3) * (H - y0 - 80);
    g.strokeStyle = 'rgba(60,110,40,0.75)'; g.lineWidth = 3;
    for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(x + k * 5, y); g.quadraticCurveTo(x + k * 9, y - 22, x + k * 12 + 4, y - 40 - hash(i + k) * 18); g.stroke(); }
    if (hash(i + 11) > 0.6) { g.fillStyle = ['#f4f1ea', '#e9c84a', '#d9674f', '#f0a0c0'][i & 3]; g.beginPath(); g.arc(x + 14, y - 44, 6, 0, 7); g.fill(); }
  }, 2);
}
function fields(g, camPx, y0, y1, p, cols) {
  g.fillStyle = cols[0]; g.fillRect(0, y0, W, y1 - y0);
  const off = camPx * p;
  layer(g, camPx, p, 380, (x, i) => {
    g.fillStyle = cols[1 + (Math.abs(i) % (cols.length - 1))];
    const yy = y0 + 10 + hash(i) * (y1 - y0 - 50);
    g.beginPath(); g.moveTo(x - 200, yy + 30); g.lineTo(x + 220, yy + 8); g.lineTo(x + 260, yy + 40); g.lineTo(x - 180, yy + 60); g.closePath(); g.fill();
  }, 5);
}

// village/steppe world used by several scenes
function villageWorld(g, camM, ppm, t, P = {}) {
  const camPx = camM * ppm;
  const horizon = P.horizon ?? 930;
  sky(g, P.skyTop ?? '#6fb1e0', P.skyMid ?? '#a7d3ee', P.skyBot ?? '#dcefee', horizon);
  if (P.sun !== false) sun(g, P.sunX ?? 860, P.sunY ?? 300, P.sunR ?? 62, P.sunCol, P.sunGlow);
  clouds(g, camPx, t, 170, 4, 0.03);
  mountains(g, camPx, horizon, 0.05, P.mtFar ?? '#9fb0c8', 230, true, 0);
  mountains(g, camPx, horizon + 10, 0.08, P.mtNear ?? '#8ea0b8', 150, false, 3.3);
  fields(g, camPx, horizon, horizon + 200, 0.18, P.fieldCols ?? ['#b8cf6a', '#a9c45b', '#d7c46a', '#c3d27a']);
  // far village + minaret
  layer(g, camPx, 0.16, 900, (x, i) => {
    if (hash(i + 50) < 0.6) {
      for (let k = 0; k < 4; k++) house(g, x + k * 64, horizon + 50, 54, 34, '#f3ead6', '#c6553b');
      if (hash(i + 77) < 0.6) minaret(g, x + 300, horizon + 52, 130);
    }
  }, 21);
  // poplar rows
  layer(g, camPx, 0.3, 120, (x, i) => {
    if (hash(i + 5) < 0.55) for (let k = 0; k < 3; k++) poplar(g, x + k * 26, horizon + 118, 150 + hash(i + k) * 40, 22);
  }, 31);
  layer(g, camPx, 0.45, 520, (x, i) => {
    const r = hash(i + 9);
    if (r < 0.45) roundTree(g, x, horizon + 175, 46 + hash(i) * 14);
    else if (r < 0.7) haystack(g, x, horizon + 180, 40);
  }, 41);
  g.fillStyle = P.verge ?? '#9ccc5c'; g.fillRect(0, horizon + 180, W, (P.roadY0 ?? 1120) - horizon - 180);
  if (P.poles !== false) poles(g, camPx, (P.roadY0 ?? 1120) + 4);
  road(g, camPx, P.roadY0 ?? 1120, P.roadY1 ?? 1330, ppm, P.road ?? {});
  grass(g, camPx, P.roadY1 ?? 1330, P.grass ?? '#7fbf4d', P.grass2 ?? '#6aa83e');
}

// ------------------------------------------------------------------ text / UI
function txt(g, s, x, y, o = {}) {
  g.save();
  g.font = `${o.font ?? 'IBlack'} ${''}`;
  g.font = `${o.size ?? 64}px ${o.font ?? 'IBlack'}`;
  g.textAlign = o.align ?? 'center'; g.textBaseline = o.base ?? 'alphabetic';
  if (o.ls) g.letterSpacing = o.ls + 'px';
  g.translate(x, y); if (o.rot) g.rotate(o.rot); if (o.scale) g.scale(o.scale, o.scale);
  g.globalAlpha = o.alpha ?? 1;
  if (o.shadow) { g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = o.shadow; g.shadowOffsetY = o.shadow * 0.4; }
  if (o.stroke) { g.lineWidth = o.sw ?? 10; g.strokeStyle = o.stroke; g.lineJoin = 'round'; g.strokeText(s, 0, 0); g.shadowColor = 'transparent'; }
  g.fillStyle = o.fill ?? '#fff'; g.fillText(s, 0, 0);
  g.restore();
}
function chip(g, s, x, y, o = {}) {
  g.save(); g.font = `${o.size ?? 40}px IBlack`; if (o.ls) g.letterSpacing = o.ls + 'px';
  const tw = g.measureText(s).width, pad = o.pad ?? 26, h = (o.size ?? 40) * 1.55;
  const k = o.k ?? 1;
  g.translate(x, y); g.scale(k, k); g.globalAlpha = o.alpha ?? 1;
  g.fillStyle = o.bg ?? '#1c1a17'; g.beginPath(); g.roundRect(-tw / 2 - pad, -h / 2, tw + pad * 2, h, h / 2); g.fill();
  if (o.border) { g.lineWidth = 4; g.strokeStyle = o.border; g.stroke(); }
  g.fillStyle = o.fill ?? '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, 0, 3);
  g.restore();
}

// word-by-word pop captions (Shorts style) – highlighted words in yellow
const CAPS = [
  [5.4, 10.8, '1971’de Bursa’da ilk Renault 12 banttan indi.', ['1971’de', 'Bursa’da']],
  [11.3, 14.8, 'Önce aileleri taşıdı…', ['aileleri']],
  [14.8, 18.3, '…sonra yükü de. 1989’da adı kondu: TOROS!', ['yükü', 'TOROS!']],
  [18.8, 23.5, 'Beyazı, kırmızısı, yeşili, mavisi, siyahı…', ['kırmızısı,', 'yeşili,', 'mavisi,', 'siyahı…']],
  [23.5, 28.3, 'Her mahallede mutlaka bir tane vardı.', ['mutlaka']],
  [28.8, 34.8, 'Taksi durağında da oydu, polis ekibinde de.', ['Taksi', 'polis']],
  [35.3, 39.6, 'Sırrı tekerleklerdeydi: önden çekişliydi.', ['önden', 'çekişliydi.']],
  [39.6, 43.8, 'Kar, çamur, köy yolu… durmak bilmedi.', ['durmak', 'bilmedi.']],
  [44.3, 47.6, '2000’de son Toros banttan indi.', ['2000’de']],
  [47.6, 50.8, 'Ama yollardan hâlâ silinmedi.', ['silinmedi.']],
];
const CAP_COL = { 'kırmızısı,': '#ff5a4a', 'yeşili,': '#5fd17a', 'mavisi,': '#5aa2ff', 'siyahı…': '#d8d8d8' };
function captions(g, t) {
  for (const [a, b, s, hl] of CAPS) {
    if (t < a || t > b + 0.15) continue;
    const words = s.split(' ');
    const fade = 1 - seg(t, b - 0.05, b + 0.15);
    const per = Math.min(0.32, (b - a - 0.6) / words.length);
    g.save(); g.font = '68px IBlack';
    // greedy wrap into lines (max 940 px)
    let lines;
    if (g.measureText(s).width <= 940) lines = [words];
    else { // best 2-line split (minimise the longer line) – no orphans
      let best = null;
      for (let i = 1; i < words.length; i++) {
        const a = words.slice(0, i), b = words.slice(i);
        const m = Math.max(g.measureText(a.join(' ')).width, g.measureText(b.join(' ')).width);
        if (!best || m < best[0]) best = [m, [a, b]];
      }
      lines = best[1];
    }
    const lh = 84, y0 = 1470 - (lines.length - 1) * lh / 2;
    let wi = 0;
    lines.forEach((ln, li) => {
      const full = ln.join(' '); const tw = g.measureText(full).width; let x = W / 2 - tw / 2;
      for (const w of ln) {
        const ww = g.measureText(w).width, sp = g.measureText(' ').width;
        const k = seg(t, a + wi * per, a + wi * per + 0.18);
        if (k > 0) {
          const sc = 0.6 + 0.4 * easeOutBack(k);
          const isH = hl.includes(w);
          txt(g, w, x + ww / 2, y0 + li * lh, { size: 68, fill: isH ? (CAP_COL[w] ?? '#ffd84a') : '#ffffff', stroke: '#111', sw: 14, scale: sc, alpha: fade * clamp(k * 2, 0, 1) });
        }
        x += ww + sp; wi++;
      }
    });
    g.restore();
  }
}

// paper grain + vignette (matches the reference's printed-paper feel)
let GRAIN = null;
function buildGrain() {
  GRAIN = document.createElement('canvas'); GRAIN.width = 540; GRAIN.height = 960;
  const g = GRAIN.getContext('2d'); const id = g.createImageData(540, 960);
  for (let i = 0; i < id.data.length; i += 4) { const v = 128 + (hash(i * 0.37) - 0.5) * 70; id.data[i] = v; id.data[i + 1] = v * 0.97; id.data[i + 2] = v * 0.9; id.data[i + 3] = 255; }
  g.putImageData(id, 0, 0);
}
function finish(g, t, vig = 0.35) {
  g.save(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = 0.10; g.drawImage(GRAIN, 0, 0, W, H); g.restore();
  const rg = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
  rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, `rgba(20,10,0,${vig})`);
  g.fillStyle = rg; g.fillRect(0, 0, W, H);
}
function chapter(g, t, a, b, label, sub) {
  const k = seg(t, a, a + 0.45), out = seg(t, b - 0.35, b);
  if (k <= 0 || out >= 1) return;
  const y = 250 - (1 - easeOut(k)) * 80;
  chip(g, label, W / 2, y, { size: 46, bg: '#1b1713', fill: '#ffd84a', alpha: (1 - out) * clamp(k * 2, 0, 1), ls: 2, border: '#ffd84a' });
  if (sub) txt(g, sub, W / 2, y + 86, { size: 40, font: 'IXB', fill: '#fff', stroke: '#1b1713', sw: 9, alpha: (1 - out) * k });
}

// ================================================================== SCENES
// S1 HOOK 0–5: abandoned, wheel-less, muddy Toros + title
const S1 = { a: 0, b: 5.0 };
function scene1(g, t) {
  const lt = t;
  const bg = g.createRadialGradient(W / 2, 980, 100, W / 2, 980, 1100);
  bg.addColorStop(0, '#5a4430'); bg.addColorStop(0.55, '#2c2016'); bg.addColorStop(1, '#0e0905');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  // light shaft
  g.save(); g.globalCompositeOperation = 'lighter';
  const sh = g.createLinearGradient(200, 0, 700, 1400); sh.addColorStop(0, 'rgba(255,210,150,0.16)'); sh.addColorStop(1, 'rgba(255,210,150,0)');
  g.fillStyle = sh; g.beginPath(); g.moveTo(300, 0); g.lineTo(620, 0); g.lineTo(980, 1500); g.lineTo(240, 1500); g.closePath(); g.fill(); g.restore();
  // ground
  g.fillStyle = '#3b2b1d'; g.fillRect(0, 1350, W, H - 1350);
  const gg = g.createLinearGradient(0, 1350, 0, 1580); gg.addColorStop(0, 'rgba(0,0,0,0.35)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gg; g.fillRect(0, 1350, W, 230);
  // shake on hits
  const hit = (h, d = 0.35) => Math.exp(-Math.max(0, lt - h) * 9) * (lt > h ? 1 : 0) * d;
  const shk = (hit(0.05) + hit(2.55) + hit(3.95, 0.6)) * 22;
  const zx = Math.sin(lt * 70) * shk, zy = Math.cos(lt * 53) * shk;
  const zoom = 1 + lt * 0.022;
  g.save(); g.translate(W / 2 + zx, 1090 + zy); g.scale(zoom, zoom);
  const im = IMG.muddy, sc = 1060 / im.width;
  // contact shadow
  const sg = g.createRadialGradient(0, 250, 0, 0, 250, 520); sg.addColorStop(0, 'rgba(0,0,0,0.55)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
  g.save(); g.scale(1, 0.12); g.fillStyle = sg; g.beginPath(); g.arc(0, 250 / 0.12, 520, 0, 7); g.fill(); g.restore();
  g.drawImage(im, -530, -im.height * sc / 2 - 20, 1060, im.height * sc);
  g.restore();
  // dust motes
  for (let i = 0; i < 60; i++) {
    const x = (hash(i) * W + lt * (10 + hash(i + 1) * 30)) % W, y = (hash(i + 2) * 1500 + 200 - lt * (8 + hash(i + 3) * 20) + 1500) % 1500 + 150;
    g.fillStyle = `rgba(255,225,180,${0.12 + 0.25 * hash(i + 4)})`; g.beginPath(); g.arc(x, y, 1.5 + hash(i + 5) * 3, 0, 7); g.fill();
  }
  // texts
  const k1 = seg(lt, 0.05, 0.35), k2 = seg(lt, 0.45, 0.75), k3 = seg(lt, 0.9, 1.2), out1 = seg(lt, 2.35, 2.55);
  if (out1 < 1) {
    txt(g, 'BU ARABA', W / 2, 360, { size: 92, scale: easeOutBack(k1), alpha: k1 * (1 - out1), stroke: '#000', sw: 14 });
    txt(g, '29 YIL BOYUNCA', W / 2, 480, { size: 104, fill: '#ffd84a', scale: easeOutBack(k2), alpha: k2 * (1 - out1), stroke: '#000', sw: 16 });
    txt(g, 'HER SOKAKTAYDI…', W / 2, 594, { size: 92, scale: easeOutBack(k3), alpha: k3 * (1 - out1), stroke: '#000', sw: 14 });
  }
  const k4 = seg(lt, 2.55, 2.8), k5 = seg(lt, 2.95, 3.15), out2 = seg(lt, 3.85, 4.0);
  if (k4 > 0 && out2 < 1) {
    txt(g, '…SONRA BİR GÜN', W / 2, 420, { size: 88, scale: easeOutBack(k4), alpha: k4 * (1 - out2), stroke: '#000', sw: 14 });
    // red stamp
    g.save(); g.translate(W / 2, 560); g.rotate(-0.07); const sk = 1 + (1 - easeOut(k5)) * 1.6; g.scale(sk, sk); g.globalAlpha = k5 * (1 - out2);
    g.strokeStyle = '#e0312b'; g.lineWidth = 10; g.strokeRect(-330, -70, 660, 140);
    g.fillStyle = '#e0312b'; g.font = '118px IBlack'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('YOK OLDU', 0, 6);
    g.restore();
  }
  // title card
  const kt = seg(lt, 3.95, 4.25);
  if (kt > 0) {
    g.fillStyle = `rgba(10,7,4,${0.55 * kt})`; g.fillRect(0, 0, W, H);
    const fl = Math.exp(-(lt - 3.95) * 10); g.fillStyle = `rgba(255,240,210,${fl * 0.85})`; g.fillRect(0, 0, W, H);
    txt(g, 'TOROS', W / 2, 520, { size: 250, fill: '#ffd84a', stroke: '#000', sw: 22, scale: 0.7 + 0.3 * easeOutBack(kt), alpha: kt, ls: 6, shadow: 30 });
    txt(g, 'BİR NESLİN ARABASI', W / 2, 640, { size: 64, fill: '#fff', stroke: '#000', sw: 12, alpha: seg(lt, 4.2, 4.45), ls: 4 });
    chip(g, 'BELGESEL · 1971–2000', W / 2, 750, { size: 36, bg: '#e0312b', fill: '#fff', alpha: seg(lt, 4.35, 4.6), ls: 2 });
  }
  finish(g, t, 0.55);
}

// S2 1971 BURSA factory: white sedan rolls out from behind the plant, A -> B
const S2 = { a: 5.0, b: 11.0 };
const M2 = makeMotion(t => 3.2 * smooth(t / 1.4), 6.2, -2.7);
function factory(g, x0, base) {
  const w = 600, h = 300;
  g.beginPath(); g.rect(x0, base - h, w, h); g.fillStyle = '#e9dcc3'; g.fill(); outline(g, 3);
  // saw-tooth roof
  g.beginPath(); g.moveTo(x0, base - h);
  for (let i = 0; i < 5; i++) { g.lineTo(x0 + i * 120, base - h - 70); g.lineTo(x0 + i * 120 + 120, base - h); }
  g.closePath(); g.fillStyle = '#b9b0a2'; g.fill(); outline(g, 3);
  for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(x0 + i * 120 + 4, base - h - 64); g.lineTo(x0 + i * 120 + 4, base - h - 6); g.lineTo(x0 + i * 120 + 50, base - h - 6); g.closePath(); g.fillStyle = '#8fb6d3'; g.fill(); }
  // windows
  g.fillStyle = '#8fb6d3';
  for (let i = 0; i < 7; i++) { g.fillRect(x0 + 30 + i * 80, base - h + 50, 50, 70); g.strokeStyle = INK; g.lineWidth = 2; g.strokeRect(x0 + 30 + i * 80, base - h + 50, 50, 70); }
  // chimney
  g.beginPath(); g.rect(x0 + 470, base - h - 260, 46, 200); g.fillStyle = '#b85a3c'; g.fill(); outline(g, 3);
  g.fillStyle = '#f2efe6'; g.fillRect(x0 + 470, base - h - 240, 46, 14); g.fillRect(x0 + 470, base - h - 200, 46, 14);
  // gate & sign
  g.beginPath(); g.rect(x0 + 200, base - 170, 240, 170); g.fillStyle = '#3d3a36'; g.fill(); outline(g, 3);
  g.strokeStyle = 'rgba(255,255,255,0.15)'; g.lineWidth = 2; for (let y = base - 160; y < base; y += 14) { g.beginPath(); g.moveTo(x0 + 204, y); g.lineTo(x0 + 436, y); g.stroke(); }
  g.beginPath(); g.roundRect(x0 + 150, base - h + 150, 340, 70, 10); g.fillStyle = '#1f4f8f'; g.fill(); outline(g, 3);
  txt(g, 'OTOMOBİL FABRİKASI', x0 + 320, base - h + 197, { size: 30, font: 'IBlack', fill: '#fff' });
}
function scene2(g, t) {
  const lt = t - S2.a, ppm = 200;
  villageWorld(g, 0, ppm, t, { poles: false, horizon: 930, skyTop: '#8cc2e6', skyBot: '#eef3e6', sunX: 900, sunY: 360 });
  const base = 1125;
  // smoke from chimney
  for (let i = 0; i < 6; i++) {
    const ph = (lt * 0.35 + i / 6) % 1;
    g.fillStyle = `rgba(240,236,228,${0.75 * (1 - ph)})`; g.beginPath(); g.arc(-40 + 493 + ph * 120, base - 300 - 270 - ph * 260, 26 + ph * 50, 0, 7); g.fill();
  }
  factory(g, -40, base);
  // car: emerges from behind plant's right wall (x = 560)
  const cx = 300 + M2.pos(lt) * ppm, v = M2.vel(lt);
  g.save(); g.beginPath(); g.rect(560, 0, W, H); g.clip();
  drawCar(g, { kind: 'sedan', color: 'white', x: cx, gy: 1290, ppm, dist: M2.pos(lt), v, t });
  g.restore();
  // rolling year counter
  const yr = Math.round(lerp(1950, 1971, easeOut(seg(lt, 0.1, 1.3))));
  txt(g, String(yr), W / 2, 610, { size: 200, fill: '#ffd84a', stroke: '#1b1713', sw: 18, alpha: seg(lt, 0, 0.3) * (1 - seg(lt, 5.6, 6)), shadow: 16 });
  chapter(g, t, S2.a + 0.1, S2.b, 'BURSA · 1971', 'Türkiye’nin Renault 12 hikâyesi başlıyor');
  captions(g, t);
  finish(g, t);
}

// S3 sedan then station pass A -> B, "1989: TOROS" stamp
const S3 = { a: 11.0, b: 18.5 };
const M3a = makeMotion(() => 3.3, 8), M3b = makeMotion(() => 3.2, 8);
function scene3(g, t) {
  const lt = t - S3.a, ppm = 205;
  villageWorld(g, 0, ppm, t, {});
  const start = -560;
  const xa = start + M3a.pos(lt) * ppm;
  const tb = lt - 3.6, xb = start + M3b.pos(tb) * ppm;
  if (lt < 4.6) {
    drawCar(g, { kind: 'sedan', color: 'white', x: xa, gy: 1290, ppm, dist: M3a.pos(lt), v: 3.3, t });
  }
  if (tb > -0.4) {
    drawCar(g, { kind: 'station', color: 'white', x: xb, gy: 1290, ppm, dist: M3b.pos(tb), v: 3.2, t });
    const ks = seg(lt, 5.35, 5.6);
    if (ks > 0) {
      g.save(); g.translate(xb + 40, 760); g.rotate(-0.08); const sk = 1 + (1 - easeOut(ks)) * 1.4; g.scale(sk, sk); g.globalAlpha = ks;
      g.fillStyle = 'rgba(224,49,43,0.95)'; g.beginPath(); g.roundRect(-240, -62, 480, 124, 16); g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 6; g.stroke();
      g.fillStyle = '#fff'; g.font = '52px IBlack'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('1989: ADI TOROS', 0, 4); g.restore();
    }
  }
  chapter(g, t, S3.a + 0.1, S3.b, 'İKİ KASA', 'Aynı ruh');
  captions(g, t);
  finish(g, t);
}

// S4 colour parade, static camera, golden steppe
const S4 = { a: 18.5, b: 28.5 };
const PARADE = [
  ['station', 'white', 'BEYAZ'], ['sedan', 'red', 'KIRMIZI'], ['station', 'green', 'YEŞİL'], ['sedan', 'blue', 'MAVİ'], ['station', 'black', 'SİYAH'],
];
const PCOL = { white: '#f4f1e8', red: '#e0453a', green: '#3aa05c', blue: '#3b7be0', black: '#2b2b2e' };
const M4 = makeMotion(() => 3.25, 12);
function scene4(g, t) {
  const lt = t - S4.a, ppm = 190;
  villageWorld(g, 0, ppm, t, { skyTop: '#5fa6dc', skyBot: '#f1e7c8', fieldCols: ['#d9c070', '#cdb45e', '#e3cd7d', '#c9b866'], verge: '#d6c378', grass: '#c9b35c', grass2: '#b79f4b', mtFar: '#a9a7bd', mtNear: '#9b98ae', sunX: 180, sunY: 330 });
  const start = -520;
  PARADE.forEach(([kind, col, name], i) => {
    const tt = lt - i * 1.82;
    const x = start + M4.pos(tt) * ppm;
    if (x < -600 || x > W + 600) return;
    drawCar(g, { kind, color: col, x, gy: 1292, ppm, dist: M4.pos(tt), v: 3.25, t });
    const isW = col === 'white';
    chip(g, name, x, 905, { size: 46, bg: PCOL[col], fill: (isW ? '#1b1713' : '#fff'), border: '#1b1713', ls: 2 });
  });
  chapter(g, t, S4.a + 0.1, S4.b, 'RENK RENK TOROS', 'Hangi renk sizin sokağınızdaydı?');
  captions(g, t);
  finish(g, t);
}

// S5 taxi + police (town). camera tracks the taxi, police overtakes in the back lane
const S5 = { a: 28.5, b: 35.0 };
const M5t = makeMotion(() => 3.0, 8), M5p = makeMotion(t => 3.0 + 1.4 * smooth(t / 1.2), 8, -7.5);
function townWorld(g, camM, ppm, t) {
  const camPx = camM * ppm;
  sky(g, '#7ab6e2', '#b9dcef', '#f3eedd', 950);
  sun(g, 880, 280, 58);
  clouds(g, camPx, t, 170, 4, 0.03);
  // apartment blocks (90s)
  const pal = ['#e9c9a0', '#d8e0c8', '#f0d9c8', '#cfd8e0', '#ead9a8'];
  layer(g, camPx, 0.35, 260, (x, i) => {
    const fl = 4 + Math.floor(hash(i) * 3), w = 220, h = fl * 78;
    const base = 1050;
    g.beginPath(); g.rect(x, base - h, w, h); g.fillStyle = pal[Math.abs(i) % 5]; g.fill(); outline(g, 3);
    for (let f = 0; f < fl; f++) for (let c = 0; c < 3; c++) {
      const wx = x + 22 + c * 66, wy = base - h + 18 + f * 78;
      g.fillStyle = '#6f93b4'; g.fillRect(wx, wy, 42, 44); g.strokeStyle = INK; g.lineWidth = 2; g.strokeRect(wx, wy, 42, 44);
      if ((f + c + i) % 3 === 0) { g.fillStyle = '#e5e0d4'; g.fillRect(wx - 6, wy + 40, 54, 8); g.strokeRect(wx - 6, wy + 40, 54, 8); }
    }
    g.fillStyle = '#c45a42'; g.fillRect(x - 6, base - h - 10, w + 12, 12);
    // shop sign at street level
    if (hash(i + 4) > 0.5) { g.fillStyle = '#f7f3ea'; g.fillRect(x + 20, base - 40, 180, 40); g.strokeRect(x + 20, base - 40, 180, 40); txt(g, ['BAKKAL', 'BERBER', 'FIRIN', 'KAHVE'][Math.abs(i) % 4], x + 110, base - 10, { size: 24, font: 'IBlack', fill: '#b3362c' }); }
  }, 61);
  g.fillStyle = '#cfc8b8'; g.fillRect(0, 1050, W, 70); // sidewalk
  g.fillStyle = 'rgba(0,0,0,0.12)'; layer(g, camPx, 1, 90, x => g.fillRect(x, 1050, 3, 70), 0);
  g.fillStyle = '#9c968a'; g.fillRect(0, 1112, W, 10);
  layer(g, camPx, 1, 560, (x, i) => { // street lamps
    g.fillStyle = '#4a4a4e'; g.fillRect(x, 760, 10, 300); g.fillRect(x - 60, 760, 70, 9);
    g.fillStyle = '#ffe9a8'; g.beginPath(); g.ellipse(x - 56, 774, 20, 9, 0, 0, 7); g.fill();
  }, 3);
  road(g, camPx, 1120, 1330, ppm, { asphalt: '#6f6d6a' });
  g.fillStyle = '#cfc8b8'; g.fillRect(0, 1330, W, 60); g.fillStyle = '#9c968a'; g.fillRect(0, 1330, W, 10);
  grass(g, camPx, 1390, '#86b85a', '#75a64c');
}
function scene5(g, t) {
  const lt = t - S5.a, ppm = 185;
  const camM = M5t.pos(lt) - 0.6;
  townWorld(g, camM, ppm, t);
  const xp = W / 2 + (M5p.pos(lt) - camM) * ppm * 0.88;
  drawCar(g, { kind: 'sedan', color: 'police', x: xp, gy: 1205, ppm: ppm * 0.88, dist: M5p.pos(lt), v: M5p.vel(lt), t });
  const xt = W / 2 + (M5t.pos(lt) - camM) * ppm;
  drawCar(g, { kind: 'sedan', color: 'taxi', x: xt, gy: 1305, ppm, dist: M5t.pos(lt), v: 3.0, t });
  chip(g, 'TAKSİ', 300, 560, { size: 52, bg: '#ffd21a', fill: '#1b1713', border: '#1b1713', alpha: seg(lt, 0.3, 0.6), ls: 3 });
  chip(g, 'POLİS', 780, 560, { size: 52, bg: '#1c3a8c', fill: '#fff', border: '#fff', alpha: seg(lt, 2.3, 2.6), ls: 3 });
  chapter(g, t, S5.a + 0.1, S5.b, 'SOKAĞIN EMEKÇİSİ');
  captions(g, t);
  finish(g, t);
}

// S6 WHEEL CLOSE-UP: camera locks on the front wheel and dollies in. whole wheel spins as one piece.
const S6 = { a: 35.0, b: 44.0 };
const v6 = t => { // slow down so the rotation reads clearly, then accelerate away
  if (t < 1.2) return 3.0;
  if (t < 2.6) return lerp(3.0, 0.9, smooth((t - 1.2) / 1.4));
  if (t < 6.4) return 0.9;
  return lerp(0.9, 3.3, smooth((t - 6.4) / 1.8));
};
const M6 = makeMotion(v6, 9.5);
function scene6(g, t) {
  const lt = t - S6.a;
  const zin = smooth(seg(lt, 0.6, 3.0)), zout = smooth(seg(lt, 6.8, 8.6));
  const ppm = lerp(205, 1100, zin * (1 - zout));
  const md = model('station'), m = md.m, s = ppm / m.pxPerM;
  // front wheel world position == car position + offset; keep the wheel pinned at screen (fx, fy)
  const dist = M6.pos(lt), v = M6.vel(lt);
  const wheelOffM = (m.wheels[1][0] - m.w / 2) / m.pxPerM; // metres from car centre to front axle
  const fxs = 540, fyGround = lerp(1290, 1330, zin * (1 - zout));
  const fx = lerp(540 + wheelOffM * 205, fxs, zin * (1 - zout)) ;
  const camM = dist + wheelOffM - (fx - W / 2) / ppm;       // world metre shown at screen centre
  villageWorld(g, camM, ppm, t, { roadY0: fyGround - 170 * (ppm / 205), roadY1: fyGround + 40 * (ppm / 205) });
  const carX = fx - wheelOffM * ppm;
  drawCar(g, { kind: 'station', color: 'white', x: carX, gy: fyGround, ppm, dist, v, t, bodyBlur: 0, noExhaust: ppm > 500 });
  const rPx = m.rTire * s, wy = fyGround - rPx;
  // annotations
  const ka = seg(lt, 2.7, 3.1) * (1 - seg(lt, 6.6, 6.9));
  if (ka > 0) {
    // rotating direction arrow around the wheel
    g.save(); g.globalAlpha = ka; g.strokeStyle = '#ffd84a'; g.lineWidth = 12; g.lineCap = 'round';
    const a0 = -Math.PI * 0.85 + (dist / md.rM) * 0.0, rr = rPx * 1.13;
    g.beginPath(); g.arc(fx, wy, rr, a0, a0 + Math.PI * 0.55); g.stroke();
    const ae = a0 + Math.PI * 0.55; const ax = fx + Math.cos(ae) * rr, ay = wy + Math.sin(ae) * rr;
    g.fillStyle = '#ffd84a'; g.beginPath(); g.moveTo(ax + Math.cos(ae + Math.PI / 2) * 34, ay + Math.sin(ae + Math.PI / 2) * 34);
    g.lineTo(ax + Math.cos(ae) * 26, ay + Math.sin(ae) * 26); g.lineTo(ax - Math.cos(ae) * 26, ay - Math.sin(ae) * 26); g.closePath(); g.fill();
    g.restore();
    chip(g, 'ÖNDEN ÇEKİŞ', W / 2, 330, { size: 58, bg: '#e0312b', fill: '#fff', k: 0.8 + 0.2 * easeOutBack(seg(lt, 2.7, 3.1)), alpha: ka, ls: 2 });
    txt(g, 'Motor önde, çeken tekerler de önde', W / 2, 440, { size: 44, font: 'IXB', fill: '#fff', stroke: '#1b1713', sw: 10, alpha: ka });
    // label: tyre + hub cap turn together
    const kb = seg(lt, 3.6, 4.0) * (1 - seg(lt, 6.6, 6.9));
    if (kb > 0) {
      g.save(); g.globalAlpha = kb; g.strokeStyle = '#fff'; g.lineWidth = 5;
      g.beginPath(); g.moveTo(fx + rPx * 0.45, wy - rPx * 0.45); g.lineTo(fx + rPx * 0.95, wy - rPx * 1.25); g.lineTo(fx + rPx * 1.0 + 30, wy - rPx * 1.25); g.stroke(); g.restore();
      chip(g, 'LASTİK + JANT KAPAĞI', Math.min(W - 250, fx + rPx * 1.0 + 30), wy - rPx * 1.25 - 60, { size: 34, bg: '#1b1713', fill: '#ffd84a', alpha: kb });
      txt(g, 'tek parça döner', Math.min(W - 250, fx + rPx * 1.0 + 30), wy - rPx * 1.25 + 20, { size: 34, font: 'IXB', fill: '#fff', stroke: '#1b1713', sw: 8, alpha: kb });
    }
  }
  // speed lines when accelerating away
  const ks = seg(lt, 7.2, 8.0) * (1 - seg(lt, 8.6, 9));
  if (ks > 0) { g.strokeStyle = `rgba(255,255,255,${0.35 * ks})`; g.lineWidth = 4; for (let i = 0; i < 14; i++) { const y = 700 + hash(i) * 700, x = ((hash(i + 3) * W) - lt * 2400) % W + W; g.beginPath(); g.moveTo(x % W, y); g.lineTo(x % W + 160, y); g.stroke(); } }
  chapter(g, t, S6.a + 0.1, S6.a + 2.6, 'YAKINDAN BAK');
  captions(g, t);
  finish(g, t);
}

// S7 sunset – end of production, car drives off A -> B
const S7 = { a: 44.0, b: 51.0 };
const M7 = makeMotion(t => 2.6, 8);
function scene7(g, t) {
  const lt = t - S7.a, ppm = 195;
  villageWorld(g, 0, ppm, t, {
    skyTop: '#3b3f78', skyMid: '#d9785a', skyBot: '#f6c26b', sunX: 760, sunY: 820, sunR: 95, sunCol: '#ffdc8a', sunGlow: 'rgba(255,170,90,0.55)',
    mtFar: '#7d5f78', mtNear: '#6c4f68', fieldCols: ['#c99a5b', '#b98a4e', '#d4a766', '#c08e52'], verge: '#b58a52', grass: '#9c7a45', grass2: '#8a6a3b', road: { asphalt: '#6a5d5a' }, poles: true,
  });
  g.fillStyle = 'rgba(255,140,60,0.12)'; g.fillRect(0, 0, W, H);
  const x = -480 + M7.pos(lt) * ppm;
  drawCar(g, { kind: 'station', color: 'white', x, gy: 1290, ppm, dist: M7.pos(lt), v: 2.6, t });
  const k = seg(lt, 0.2, 0.7), out = seg(lt, 3.3, 3.6);
  txt(g, '2000', W / 2, 520, { size: 230, fill: '#ffe2a0', stroke: '#2b1a12', sw: 20, alpha: k * (1 - out), scale: 0.8 + 0.2 * easeOutBack(k), shadow: 20 });
  txt(g, 'ÜRETİMİN SON YILI', W / 2, 620, { size: 52, fill: '#fff', stroke: '#2b1a12', sw: 10, alpha: seg(lt, 0.5, 0.9) * (1 - out), ls: 3 });
  const k2 = seg(lt, 3.6, 4.0);
  txt(g, 'AMA HİKÂYESİ', W / 2, 470, { size: 80, fill: '#fff', stroke: '#2b1a12', sw: 14, alpha: k2, scale: 0.8 + 0.2 * easeOutBack(k2) });
  txt(g, 'BİTMEDİ', W / 2, 590, { size: 120, fill: '#ffd84a', stroke: '#2b1a12', sw: 18, alpha: seg(lt, 3.9, 4.3), scale: 0.8 + 0.2 * easeOutBack(seg(lt, 3.9, 4.3)) });
  captions(g, t);
  finish(g, t, 0.5);
}

// S8 CTA (GTA-style mission screen): 7 cars drive in A -> parking slots, number them, ask for comments
const S8 = { a: 51.0, b: 59.0 };
const LINEUP = [
  ['station', 'white', 'BEYAZ'], ['sedan', 'red', 'KIRMIZI'], ['station', 'green', 'YEŞİL'], ['sedan', 'blue', 'MAVİ'],
  ['station', 'black', 'SİYAH'], ['sedan', 'taxi', 'TAKSİ'], ['sedan', 'police', 'POLİS'],
];
function arrive(t, dur, distM) { // decelerating arrival: position from -distM to 0, returns [pos, vel]
  const k = clamp(t / dur, 0, 1); const p = 1 - Math.pow(1 - k, 2.4);
  const vel = k >= 1 ? 0 : distM * 2.4 * Math.pow(1 - k, 1.4) / dur;
  return [-distM * (1 - p), vel];
}
function scene8(g, t) {
  const lt = t - S8.a;
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#1a1433'); bg.addColorStop(0.45, '#5a2a5c'); bg.addColorStop(0.75, '#e2774f'); bg.addColorStop(1, '#2a1a2c');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  // retro sun stripes
  g.save(); g.globalAlpha = 0.35; sun(g, W / 2, 1050, 300, '#ffb36b', 'rgba(255,140,90,0.25)');
  g.fillStyle = '#5a2a5c'; for (let i = 0; i < 9; i++) g.fillRect(0, 900 + i * 34 + i * i * 1.5, W, 6 + i * 2); g.restore();
  // mission header
  const kh = seg(lt, 0, 0.35);
  txt(g, 'GÖREV:', W / 2, 210, { size: 70, font: 'IBlackI', fill: '#fff', stroke: '#000', sw: 14, alpha: kh, ls: 4 });
  txt(g, 'HANGİSİ SİZİNDİ?', W / 2, 320, { size: 104, font: 'IBlackI', fill: '#ffd84a', stroke: '#000', sw: 18, alpha: kh, scale: 0.7 + 0.3 * easeOutBack(seg(lt, 0.1, 0.5)) });
  // wanted stars
  for (let i = 0; i < 5; i++) {
    const on = lt > 0.5 + i * 0.12 && (Math.floor(lt * 3) % 2 === 0 || lt < 1.6 + i * 0.12);
    star(g, W / 2 - 200 + i * 100, 400, 34, on ? '#fff3b0' : 'rgba(255,255,255,0.18)');
  }
  // lineup rows
  const rowH = 166, y0 = 640, ppm = 102;
  LINEUP.forEach(([kind, col, name], i) => {
    const ta = lt - 0.35 - i * 0.16;
    const gy = y0 + i * rowH;
    // lane strip
    g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(0, gy - 6, W, 12);
    if (ta < -0.5) return;
    const [p, vel] = arrive(ta, 1.6, 7);
    const x = 650 + p * ppm;
    drawCar(g, { kind, color: col, x, gy, ppm, dist: p, v: vel, t, bob: 0.6, noExhaust: vel < 0.4 });
    const kb = seg(ta, 1.2, 1.5);
    if (kb > 0) {
      g.save(); g.translate(110, gy - 70); g.scale(easeOutBack(kb), easeOutBack(kb));
      g.fillStyle = '#ffd84a'; g.beginPath(); g.arc(0, 0, 44, 0, 7); g.fill(); g.lineWidth = 6; g.strokeStyle = '#000'; g.stroke();
      g.fillStyle = '#000'; g.font = '56px IBlack'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(i + 1), 0, 3); g.restore();
      txt(g, name, 110, gy + 4, { size: 30, font: 'IBlack', fill: '#fff', stroke: '#000', sw: 6, alpha: kb });
    }
  });
  // CTA
  const kc = seg(lt, 2.6, 3.0), pulse = 1 + 0.04 * Math.sin(lt * 8);
  if (kc > 0) {
    g.save(); g.translate(W / 2, 1735); g.scale(pulse * (0.7 + 0.3 * easeOutBack(kc)), pulse * (0.7 + 0.3 * easeOutBack(kc))); g.globalAlpha = kc;
    g.fillStyle = '#e0312b'; g.beginPath(); g.roundRect(-450, -70, 900, 140, 26); g.fill(); g.lineWidth = 8; g.strokeStyle = '#000'; g.stroke();
    g.fillStyle = '#fff'; g.font = '62px IBlackI'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('NUMARAYI YORUMA YAZ', 0, 5);
    g.restore();
    // arrow
    const ay = 1835 + Math.sin(lt * 9) * 10;
    g.fillStyle = '#ffd84a'; g.beginPath(); g.moveTo(W / 2 - 34, ay - 20); g.lineTo(W / 2 + 34, ay - 20); g.lineTo(W / 2, ay + 22); g.closePath(); g.fill();
  }
  // mission passed banner at the end
  const km = seg(lt, 6.4, 6.7);
  if (km > 0) {
    g.fillStyle = `rgba(0,0,0,${0.55 * km})`; g.fillRect(0, 0, W, H);
    txt(g, 'GÖREV BAŞARILI!', W / 2, 900, { size: 112, font: 'IBlackI', fill: '#ffd84a', stroke: '#000', sw: 20, alpha: km, scale: 0.6 + 0.4 * easeOutBack(km) });
    txt(g, '+ ABONE OL', W / 2, 1030, { size: 72, font: 'IBlackI', fill: '#fff', stroke: '#000', sw: 14, alpha: seg(lt, 6.7, 7.0) });
    txt(g, 'Sonraki bölüm: ŞAHİN mi, TOROS mu?', W / 2, 1140, { size: 46, font: 'IXB', fill: '#fff', stroke: '#000', sw: 10, alpha: seg(lt, 7.0, 7.3) });
  }
  finish(g, t, 0.4);
}
function star(g, x, y, r, col) {
  g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath();
  g.fillStyle = col; g.fill(); g.lineWidth = 5; g.strokeStyle = '#000'; g.stroke();
}

// ------------------------------------------------------------------ master timeline
const SCENES = [[S1, scene1], [S2, scene2], [S3, scene3], [S4, scene4], [S5, scene5], [S6, scene6], [S7, scene7], [S8, scene8]];
function render(t) {
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  let cur = SCENES[SCENES.length - 1];
  for (const sc of SCENES) if (t >= sc[0].a && t < sc[0].b) { cur = sc; break; }
  cur[1](ctx, t);
  // cut transitions: quick flash + whip at every scene boundary
  for (const [S] of SCENES) {
    const d = t - S.a;
    if (S.a > 0 && d >= 0 && d < 0.22) { ctx.fillStyle = `rgba(255,250,235,${0.75 * (1 - d / 0.22)})`; ctx.fillRect(0, 0, W, H); }
  }
  ctx.restore();
}
window.render = render;
window.ready = loadAll().then(() => true);
window.META_INFO = { W, H, FPS, DUR };
