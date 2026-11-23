// "Bu arabaya neden DAĞ KEÇİSİ dediler?" – 59.2 s vertical Short. Reuses car/world engine from scene.js.
'use strict';
const KDUR = 59.2;
let FROZEN = null;          // K5 freeze-frame cache
const KV = {};              // extra sprites/variants

async function kLoad() {
  await window.ready;
  const L = [];
  for (const [k, f] of [['sedan_orange', 'side_sedan_orange'], ['station_orange', 'side_station_orange'], ['rear_blue', 'rear_blue'], ['rear_red', 'rear_red'], ['rear_green', 'rear_green'], ['bg_village1', 'bgv_village1'], ['bg_village2', 'bgv_village2'], ['bg_snow', 'bgv_snow'], ['bg_crank', 'bgv_crank'], ['bg_crank_ng', 'bgv_crank_noglass'], ['bg_crank_nh', 'bgv_crank_nohand'], ['hand_crank', 'hand_crank_v'], ['front_green', 'front_green'], ['front_red', 'front_red']])
    L.push(loadImg(k, `../assets/sprites/${f}.png`));
  L.push(loadImg('family', '../assets/src/family_illus.png'));
  await Promise.all(L);
  window.NO_SHADOW = true;
  DECO['sedan_orange'] = IMG.sedan_orange;
  KV.mud = variant(DECO.station_white, 'mud');
  KV.snow = variant(DECO.station_red, 'snow');
  KV.dust = variant(DECO.sedan_green, 'dust');
  return true;
}
// paint mud / snow onto a copy of a body sprite (only where the car is – source-atop)
function variant(src, kind) {
  const c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
  const g = c.getContext('2d'); g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-atop';
  const W0 = src.width, H0 = src.height;
  if (kind === 'mud' || kind === 'dust') {
    const col = kind === 'mud' ? [120, 78, 40] : [176, 140, 96];
    for (let i = 0; i < (kind === 'mud' ? 420 : 160); i++) {
      const x = hash(i * 1.3) * W0, yy = H0 * (0.62 + 0.38 * Math.pow(hash(i * 2.7), 0.5));
      const r = 2 + hash(i * 3.1) * (kind === 'mud' ? 12 : 6);
      g.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${(kind === 'mud' ? 0.35 : 0.2) + 0.4 * hash(i * 4.4)})`;
      g.beginPath(); g.ellipse(x, yy, r * (1 + hash(i) * 1.5), r, hash(i * 5) * 3, 0, 7); g.fill();
    }
    const lg = g.createLinearGradient(0, H0 * 0.6, 0, H0);
    lg.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},0)`); lg.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},${kind === 'mud' ? 0.65 : 0.35})`);
    g.fillStyle = lg; g.fillRect(0, 0, W0, H0);
  } else if (kind === 'snow') {
    // snow cap on everything near the top silhouette + hood
    g.fillStyle = 'rgba(250,252,255,0.97)';
    for (let x = 0; x < W0; x += 6) {
      g.beginPath(); g.ellipse(x, 30 + Math.sin(x * 0.05) * 4, 14, 26, 0, 0, 7); g.fill();
    }
    g.beginPath(); g.ellipse(W0 * 0.86, H0 * 0.42, W0 * 0.16, 26, -0.08, 0, 7); g.fill();
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(255,255,255,${0.4 + 0.5 * hash(i)})`; g.beginPath(); g.arc(hash(i * 2.1) * W0, H0 * (0.55 + 0.45 * hash(i * 3.3)), 3 + hash(i * 7) * 7, 0, 7); g.fill(); }
  }
  return c;
}

// ------------------------------------------------------------------ drawing helpers
function goat(g, x, y, s, o = {}) { // (x,y) = between front & rear hooves on ground; s = px per metre
  const t = o.t ?? 0, bleat = o.bleat ?? 0, dir = o.dir ?? 1;
  g.save(); g.translate(x, y); g.scale(dir * s / 100, s / 100); // units: cm
  const legSw = o.walk ? Math.sin(t * 9) * 6 : 0;
  g.lineCap = 'round';
  // legs
  g.strokeStyle = '#d9d0bf'; g.lineWidth = 9;
  for (const [lx, ph] of [[-32, 0], [-22, 1], [26, 1], [36, 0]]) {
    g.beginPath(); g.moveTo(lx, -48); g.lineTo(lx + (ph ? legSw : -legSw), -4); g.stroke();
    g.fillStyle = '#3a2e24'; g.fillRect(lx + (ph ? legSw : -legSw) - 5, -6, 10, 6);
  }
  g.strokeStyle = INK; g.lineWidth = 2;
  // body
  g.beginPath(); g.ellipse(0, -62, 50, 25, 0, 0, 7); g.fillStyle = '#f4efe4'; g.fill(); outline(g, 3);
  g.beginPath(); g.ellipse(-12, -70, 20, 12, 0.3, 0, 7); g.fillStyle = '#9b6a3e'; g.fill();
  // tail
  g.beginPath(); g.moveTo(-48, -72); g.lineTo(-60, -90 - Math.sin(t * 12) * 4); g.lineWidth = 7; g.strokeStyle = '#f4efe4'; g.stroke();
  // neck + head (head lifts when bleating)
  const hb = bleat * 10 + Math.sin(t * 2.2) * 3;
  g.save(); g.translate(40, -74); g.rotate(-0.5 - bleat * 0.35 + Math.sin(t * 1.7) * 0.05);
  g.beginPath(); g.roundRect(-8, -40, 20, 44, 9); g.fillStyle = '#f4efe4'; g.fill(); outline(g, 3);
  g.translate(4, -44 - hb * 0.2); g.rotate(0.9 + bleat * 0.2);
  // horns
  g.strokeStyle = '#8a7356'; g.lineWidth = 6;
  g.beginPath(); g.moveTo(-4, -12); g.quadraticCurveTo(-22, -34, -34, -20); g.stroke();
  // head
  g.beginPath(); g.ellipse(10, 0, 24, 13, 0.15, 0, 7); g.fillStyle = '#f4efe4'; g.fill(); outline(g, 3);
  // ear
  g.beginPath(); g.ellipse(-6, -2, 12, 5, -0.6, 0, 7); g.fillStyle = '#e4d9c6'; g.fill(); outline(g, 2);
  // eye
  g.fillStyle = '#2a2018'; g.beginPath(); g.arc(6, -5, 3, 0, 7); g.fill();
  // beard
  g.beginPath(); g.moveTo(26, 8); g.lineTo(22, 26); g.lineTo(32, 10); g.closePath(); g.fillStyle = '#e8dfcf'; g.fill(); outline(g, 2);
  // mouth (opens on bleat)
  g.fillStyle = '#5a2c22'; g.beginPath(); g.ellipse(32, 6, 5, 1 + bleat * 5, 0.2, 0, 7); g.fill();
  g.restore();
  g.restore();
  if (bleat > 0.3) txt(g, 'MEEE!', x + dir * s * 0.9, y - s * 1.75, { size: Math.max(28, s * 0.32), font: 'IBlackI', fill: '#fff', stroke: INK, sw: 8, alpha: clamp((bleat - 0.3) * 3, 0, 1), rot: -0.12 * dir });
}
function person(g, x, base, h, o = {}) {
  const t = o.t ?? 0; const u = h / 100;
  g.save(); g.translate(x, base); g.scale(u, u);
  g.lineCap = 'round'; g.lineJoin = 'round';
  // legs
  g.fillStyle = o.pants ?? '#3c4a63'; g.beginPath(); g.roundRect(-14, -46, 12, 46, 5); g.fill(); g.beginPath(); g.roundRect(2, -46, 12, 46, 5); g.fill();
  g.fillStyle = '#2a2018'; g.fillRect(-16, -5, 16, 5); g.fillRect(1, -5, 16, 5);
  // body / skirt
  g.beginPath();
  if (o.skirt) { g.moveTo(-20, -82); g.lineTo(20, -82); g.lineTo(26, -30); g.lineTo(-26, -30); g.closePath(); }
  else g.roundRect(-20, -84, 40, 46, 10);
  g.fillStyle = o.shirt ?? '#b8432f'; g.fill(); g.strokeStyle = INK; g.lineWidth = 2.5; g.stroke();
  // arms (right arm waves)
  const wv = o.wave ? Math.sin(t * 7 + (o.ph ?? 0)) * 0.5 : 0;
  g.strokeStyle = o.shirt ?? '#b8432f'; g.lineWidth = 10;
  g.beginPath(); g.moveTo(-18, -78); g.lineTo(-24, -50); g.stroke();
  g.save(); g.translate(18, -78); g.rotate(o.wave ? -2.4 + wv : 0.15);
  g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 28); g.stroke(); g.fillStyle = o.skin ?? '#e9b98f'; g.beginPath(); g.arc(0, 32, 6, 0, 7); g.fill(); g.restore();
  g.fillStyle = o.skin ?? '#e9b98f'; g.beginPath(); g.arc(-24, -47, 6, 0, 7); g.fill();
  // head (headscarf drawn behind the face, framing it)
  if (o.scarf) { g.beginPath(); g.ellipse(0, -100, 24, 27, 0, 0, 7); g.moveTo(-20, -86); g.lineTo(-26, -70); g.lineTo(26, -70); g.lineTo(20, -86); g.fillStyle = o.scarf; g.fill(); g.strokeStyle = INK; g.lineWidth = 2.5; g.stroke(); }
  g.beginPath(); g.arc(0, o.scarf ? -98 : -100, o.scarf ? 15 : 17, 0, 7); g.fillStyle = o.skin ?? '#e9b98f'; g.fill(); g.strokeStyle = INK; g.lineWidth = 2.5; g.stroke();
  if (o.scarf) { /* face already framed */ }
  else { g.beginPath(); g.arc(0, -104, 17, Math.PI * 1.05, Math.PI * 1.95); g.lineTo(14, -108); g.lineTo(-14, -108); g.closePath(); g.fillStyle = o.hair ?? '#3a2a1e'; g.fill(); }
  g.fillStyle = '#2a2018'; g.beginPath(); g.arc(-6, -101, 2.2, 0, 7); g.arc(6, -101, 2.2, 0, 7); g.fill();
  if (o.mustache) { g.fillStyle = '#2a2018'; g.beginPath(); g.ellipse(0, -93, 9, 3.5, 0, 0, 7); g.fill(); }
  g.strokeStyle = '#7a3a2a'; g.lineWidth = 2; g.beginPath(); g.arc(0, o.mustache ? -90 : -93, 5, 0.2, Math.PI - 0.2); g.stroke();
  g.restore();
}
function galata(g, x, base, s) {
  g.save(); g.translate(x, base); g.scale(s, s);
  g.beginPath(); g.rect(-38, -300, 76, 300); g.fillStyle = '#cdb99a'; g.fill(); outline(g, 3);
  g.strokeStyle = 'rgba(80,60,40,0.35)'; g.lineWidth = 2; for (let y = -290; y < 0; y += 22) { g.beginPath(); g.moveTo(-38, y); g.lineTo(38, y); g.stroke(); }
  g.fillStyle = '#3d4e63'; for (const y of [-260, -200, -140]) for (const xx of [-18, 6]) g.fillRect(xx, y, 12, 26);
  g.beginPath(); g.rect(-46, -330, 92, 30); g.fillStyle = '#e3d4bb'; g.fill(); outline(g, 3);
  g.fillStyle = '#3d4e63'; for (let xx = -40; xx < 40; xx += 14) g.fillRect(xx, -324, 8, 18);
  g.beginPath(); g.moveTo(-50, -330); g.lineTo(0, -430); g.lineTo(50, -330); g.closePath(); g.fillStyle = '#5a6f86'; g.fill(); outline(g, 3);
  g.fillStyle = '#e8c35a'; g.fillRect(-2, -455, 4, 26);
  g.restore();
}
function mosque(g, x, base, s, col = '#8a93a6') {
  g.save(); g.translate(x, base); g.scale(s, s); g.fillStyle = col;
  g.fillRect(-160, -90, 320, 90);
  g.beginPath(); g.arc(0, -90, 110, Math.PI, 0); g.fill();
  for (const dx of [-115, 115]) { g.beginPath(); g.arc(dx, -90, 45, Math.PI, 0); g.fill(); }
  for (const dx of [-210, 210, -260, 260]) { g.fillRect(dx - 7, -300, 14, 300); g.beginPath(); g.moveTo(dx - 9, -300); g.lineTo(dx, -350); g.lineTo(dx + 9, -300); g.fill(); }
  g.fillRect(-3, -230, 6, 34);
  g.restore();
}
function rockMass(g, pts, col = '#9b8b78', dark = '#7d6e5d') {
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) g.lineTo(p[0], p[1]); g.closePath();
  g.fillStyle = col; g.fill(); outline(g, 3);
}
function snowMountains(g, camPx, baseY, p, height, col, seed) {
  const off = camPx * p; const pts = [];
  g.beginPath(); g.moveTo(-20, baseY);
  for (let x = -20; x <= W + 20; x += 16) {
    const wx = (x + off) / 300 + seed;
    const y = baseY - height * (0.6 + 0.28 * Math.sin(wx * 1.1) + 0.16 * Math.abs(Math.sin(wx * 2.7 + 0.5)) + 0.08 * Math.sin(wx * 7.3));
    pts.push([x, y]); g.lineTo(x, y);
  }
  g.lineTo(W + 20, baseY); g.closePath(); g.fillStyle = col; g.fill(); outline(g, 2.5);
  // snow caps follow the ridge
  g.save(); g.beginPath(); g.moveTo(-20, baseY); for (const [x, y] of pts) g.lineTo(x, y); g.lineTo(W + 20, baseY); g.closePath(); g.clip();
  g.beginPath(); g.moveTo(-20, 0);
  for (let x = -20; x <= W + 20; x += 16) { const wx = (x + off) / 300 + seed; g.lineTo(x, baseY - height * 0.70 + Math.sin(wx * 9.1) * 16 + ((x / 16) % 2 ? 14 : -6)); }
  g.lineTo(W + 20, 0); g.closePath(); g.fillStyle = '#f7f9fc'; g.fill();
  g.restore();
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const [x, y] of pts) g.lineTo(x, y); g.strokeStyle = INK; g.lineWidth = 2.5; g.stroke();
}

// ------------------------------------------------------------------ persistent UI: timeline + odometer
function yearAt(t) {
  if (t < 12) return 1971;
  if (t < 15) return lerp(1971, 1989, smooth((t - 12) / 3));
  if (t < 45.5) return lerp(1989, 1995, (t - 15) / 30.5);
  if (t < 53) return lerp(1995, 2000, smooth((t - 45.5) / 7.5));
  return 2000;
}
function timeline(g, t, alpha = 1) {
  if (alpha <= 0) return;
  const x0 = 170, x1 = 910, y = 112, Y = yearAt(t);
  const X = y2 => x0 + (y2 - 1971) / 29 * (x1 - x0);
  g.save(); g.globalAlpha = alpha;
  g.fillStyle = 'rgba(20,16,12,0.55)'; g.beginPath(); g.roundRect(x0 - 60, y - 44, x1 - x0 + 120, 88, 44); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke();
  g.strokeStyle = '#ffd84a'; g.beginPath(); g.moveTo(x0, y); g.lineTo(X(Y), y); g.stroke();
  for (const yr of [1971, 1989, 2000]) {
    const on = Y >= yr - 0.01;
    g.fillStyle = on ? '#ffd84a' : '#5b544c'; g.beginPath(); g.arc(X(yr), y, 13, 0, 7); g.fill(); g.strokeStyle = '#1b1713'; g.lineWidth = 3; g.stroke();
    txt(g, String(yr), X(yr), y - 20, { size: 26, font: 'IBlack', fill: on ? '#ffd84a' : 'rgba(255,255,255,0.55)', base: 'bottom' });
  }
  // marker
  g.fillStyle = '#fff'; g.beginPath(); g.arc(X(Y), y, 8, 0, 7); g.fill();
  txt(g, String(Math.round(Y)), X(Y), y + 38, { size: 24, font: 'IBlack', fill: '#fff', alpha: Y > 1971.5 && Y < 1999.5 && Math.abs(Y - 1989) > 0.6 ? 1 : 0 });
  g.restore();
}
const ODO_BASE = 186420;
function odometer(g, t, dist, alpha) {
  if (alpha <= 0) return;
  const val = ODO_BASE + t * 0.9 + dist * 0.25;            // stylised km reading
  const x = 820, y = 214, dw = 34, dh = 50;
  g.save(); g.globalAlpha = alpha;
  g.fillStyle = '#121212'; g.beginPath(); g.roundRect(x - 3 * dw - 18, y - dh / 2 - 12, 6 * dw + 36, dh + 24, 12); g.fill();
  g.strokeStyle = '#8b8b8b'; g.lineWidth = 3; g.stroke();
  // 6 drums: 5 whole km + 1 tenth (red). a drum rolls only while every drum to its right is passing 9 -> 0
  const v = val * 10;
  g.save(); g.beginPath(); g.rect(x - 3 * dw, y - dh / 2, 6 * dw, dh); g.clip();
  for (let i = 0; i < 6; i++) {
    const p = 5 - i, P10 = Math.pow(10, p);
    const base = Math.floor(v / P10) % 10, lower = v % P10;
    const frac = p === 0 ? v % 1 : Math.max(0, lower - (P10 - 1));
    const d = base + frac;
    const dx = x - 3 * dw + i * dw;
    g.fillStyle = i === 5 ? '#f2f0ea' : '#1d1d1d'; g.fillRect(dx + 1, y - dh / 2, dw - 2, dh);
    for (let k = -1; k <= 1; k++) {
      const n = ((Math.floor(d) + k) % 10 + 10) % 10, off = (d % 1) * dh;
      txt(g, String(n), dx + dw / 2, y + 15 - off + k * dh, { size: 38, font: 'IBlack', fill: i === 5 ? '#c4302b' : '#f2f0ea' });
    }
  }
  g.restore();
  txt(g, 'KM', x + 3 * dw + 30, y + 10, { size: 22, font: 'IBlack', fill: '#fff', stroke: '#000', sw: 5 });
  g.restore();
}

// captions (prompt's quoted lines)
const KCAPS = [
  [4.0, 6.8, 'Renault 12 burada üretilmeye başladı.', ['Renault', '12']],
  [7.0, 10.3, 'Ama asıl şöhreti sonra geldi.', ['şöhreti']],
  [10.6, 11.95, 'Adı: Renault 12.', ['Renault', '12.']],
  [12.2, 14.2, '1989. Yenilendi, adı değişti:', ['1989.']],
  [15.4, 17.45, 'Adını Toros Dağları’ndan aldı.', ['Toros', 'Dağları’ndan']],
  [18.7, 20.45, 'Çünkü bu araba Anadolu’yu taşıdı.', ['Anadolu’yu']],
  [20.7, 23.6, 'Köy yolu.', ['Köy']],
  [23.9, 26.8, 'Bayram yolu.', ['Bayram']],
  [27.1, 30.0, 'Çamur.', ['Çamur.']],
  [30.3, 33.2, 'Kar.', ['Kar.']],
  [33.5, 36.4, 'Hiç durmadı.', ['durmadı.']],
  [36.7, 39.4, 'Hidrolik direksiyon yok.', ['yok.']],
  [39.6, 40.95, 'Klima yok.', ['yok.']],
  [41.0, 42.45, 'Cam kolla açılırdı.', ['kolla']],
  [42.6, 44.0, 'Ama ucuzdu, dayanıklıydı.', ['ucuzdu,', 'dayanıklıydı.']],
  [44.0, 45.45, 'Her sanayide tamir edilirdi.', ['sanayide']],
  [45.7, 48.4, 'Taksi oldu.', ['Taksi']],
  [48.7, 50.9, 'Polis arabası oldu.', ['Polis']],
  [52.4, 54.4, '2000’e kadar üretildi.', ['2000’e']],
  [54.6, 56.0, 'Ailenin ilk arabası oldu.', ['ilk']],
];
function kCaptions(g, t, yBase = 1470) {
  for (const [a, b, s, hl] of KCAPS) {
    if (t < a || t > b + 0.12) continue;
    const words = s.split(' ');
    const fade = 1 - seg(t, b - 0.06, b + 0.12);
    const per = Math.min(0.26, (b - a - 0.35) / words.length);
    g.save(); g.font = '72px IBlack';
    let lines;
    if (g.measureText(s).width <= 940) lines = [words];
    else { let best = null; for (let i = 1; i < words.length; i++) { const A = words.slice(0, i), B = words.slice(i); const m = Math.max(g.measureText(A.join(' ')).width, g.measureText(B.join(' ')).width); if (!best || m < best[0]) best = [m, [A, B]]; } lines = best[1]; }
    const lh = 88, y0 = yBase - (lines.length - 1) * lh / 2; let wi = 0;
    lines.forEach((ln, li) => {
      const tw = g.measureText(ln.join(' ')).width; let x = W / 2 - tw / 2;
      for (const w of ln) {
        const ww = g.measureText(w).width, sp = g.measureText(' ').width;
        const k = seg(t, a + wi * per, a + wi * per + 0.16);
        if (k > 0) txt(g, w, x + ww / 2, y0 + li * lh, { size: 72, fill: hl.includes(w) ? '#ffd84a' : '#fff', stroke: '#111', sw: 15, scale: 0.6 + 0.4 * easeOutBack(k), alpha: fade * clamp(k * 2, 0, 1) });
        x += ww + sp; wi++;
      }
    });
    g.restore();
  }
}
function bigWord(g, s, t, a, b, y, o = {}) {
  const k = seg(t, a, a + 0.25), out = seg(t, b - 0.15, b);
  if (k <= 0 || out >= 1) return;
  txt(g, s, W / 2, y, { size: o.size ?? 120, font: o.font ?? 'IBlack', fill: o.fill ?? '#ffd84a', stroke: '#111', sw: o.sw ?? 18, scale: 0.55 + 0.45 * easeOutBack(k), alpha: (1 - out) * clamp(k * 2, 0, 1), rot: o.rot ?? 0, shadow: 14, ls: o.ls });
}

// ================================================================== SCENES (times in absolute seconds)
const K = {};
// K1 0–3.5: mountain road, white Toros with a goat on the roof. Also the loop target (frame 0).
const MK1 = makeMotion(() => 2.6, 6);
K.k1 = (g, t, noText) => {
  const lt = t, ppm = 200, dist = MK1.pos(lt), camM = dist;
  const camPx = camM * ppm;
  sky(g, '#5aa2d8', '#9fd0ee', '#e6f1ee', 900);
  sun(g, 860, 260, 58);
  clouds(g, camPx, t, 200, 4, 0.03);
  snowMountains(g, camPx, 1000, 0.05, 520, '#8f9fb8', 0.4);
  snowMountains(g, camPx, 1060, 0.12, 360, '#7d8ea8', 2.1);
  // slope behind road with pines
  g.fillStyle = '#7a9a52'; g.fillRect(0, 1040, W, 120);
  layer(g, camPx, 0.4, 90, (x, i) => { if (hash(i + 3) < 0.7) { g.beginPath(); g.moveTo(x, 1000 - hash(i) * 30); g.lineTo(x + 28, 1100); g.lineTo(x - 28, 1100); g.closePath(); g.fillStyle = '#3f6b3a'; g.fill(); outline(g, 2); } }, 7);
  road(g, camPx, 1150, 1310, ppm, {});
  // guard-rail posts + rail (move with the road)
  layer(g, camPx, 1, 160, x => { g.fillStyle = '#e8e4dc'; g.fillRect(x, 1300, 12, 60); g.strokeStyle = INK; g.lineWidth = 2; g.strokeRect(x, 1300, 12, 60); }, 0);
  g.fillStyle = '#d9d6cf'; g.fillRect(0, 1306, W, 16); g.strokeStyle = INK; g.strokeRect(-2, 1306, W + 4, 16);
  // cliff drop
  const cg = g.createLinearGradient(0, 1320, 0, H); cg.addColorStop(0, '#9b8a73'); cg.addColorStop(1, '#6e604f');
  g.fillStyle = cg; g.fillRect(0, 1322, W, H - 1322);
  g.strokeStyle = 'rgba(60,45,30,0.35)'; g.lineWidth = 3;
  layer(g, camPx, 1, 140, (x, i) => { g.beginPath(); g.moveTo(x, 1340 + hash(i) * 40); g.lineTo(x + 70, 1420 + hash(i + 1) * 120); g.lineTo(x + 30, 1600 + hash(i + 2) * 200); g.stroke(); }, 12);
  drawCar(g, { kind: 'station', color: 'white', x: 540, gy: 1265, ppm, dist, v: 2.6, t, onBody: (gg, left, top, s) => {
    goat(gg, left + 700 * s, top + 12 * s, ppm * 0.95, { t, bleat: Math.max(0, Math.sin(clamp((t - 0.35) / 0.9, 0, 1) * Math.PI)), dir: 1 });
  } });
  if (!noText) {
    const kb = seg(t, 0.08, 0.3);
    const tg = g.createLinearGradient(0, 220, 0, 760); tg.addColorStop(0, 'rgba(15,12,10,0)'); tg.addColorStop(0.25, `rgba(15,12,10,${0.55 * kb})`); tg.addColorStop(0.8, `rgba(15,12,10,${0.55 * kb})`); tg.addColorStop(1, 'rgba(15,12,10,0)');
    g.fillStyle = tg; g.fillRect(0, 220, W, 540);
    bigWord(g, 'BU ARABAYA NEDEN', t, 0.12, 3.5, 380, { size: 76, fill: '#fff', sw: 14 });
    bigWord(g, 'DAĞ KEÇİSİ', t, 0.55, 3.5, 520, { size: 150, sw: 22, rot: -0.03 });
    bigWord(g, 'DEDİLER?', t, 1.1, 3.5, 640, { size: 96, fill: '#fff', sw: 16 });
  }
  return dist;
};

// K2 3.5–10.5: Bursa plant – assembly line (wheels still: cars ride the conveyor), then the yard full of R12s
K.k2 = (g, t) => {
  const lt = t - 3.5;
  if (lt < 3.3) { // interior: finished cars roll off the line on their own wheels (A -> B), robot welder at work
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#5b4c3e'); bg.addColorStop(1, '#3d332a'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 5; i++) { const x = 40 + i * 210; g.fillStyle = '#b9c2b8'; g.fillRect(x, 420, 150, 220); g.beginPath(); g.rect(x, 420, 150, 220); ink(g, 5); g.beginPath(); g.moveTo(x + 75, 420); g.lineTo(x + 75, 640); g.moveTo(x, 530); g.lineTo(x + 150, 530); ink(g, 4); }
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) { const x = 40 + i * 210; const lg = g.createLinearGradient(x, 640, x + 200, 1300); lg.addColorStop(0, 'rgba(255,236,200,0.14)'); lg.addColorStop(1, 'rgba(255,236,200,0)'); g.fillStyle = lg; g.beginPath(); g.moveTo(x, 640); g.lineTo(x + 150, 640); g.lineTo(x + 380, 1320); g.lineTo(x + 160, 1320); g.closePath(); g.fill(); }
    g.restore();
    g.save(); g.beginPath(); g.rect(0, 0, W, 1250); g.globalAlpha = 0.5; g.fillStyle = HATCH_L; g.fill(); g.restore();
    for (let x = -60; x < W + 60; x += 120) { g.beginPath(); g.moveTo(x, 300); g.lineTo(x + 60, 360); g.lineTo(x + 120, 300); ink(g, 7); }
    g.beginPath(); g.moveTo(0, 300); g.lineTo(W, 300); g.moveTo(0, 360); g.lineTo(W, 360); ink(g, 7);
    for (let i = 0; i < 4; i++) { const x = 140 + i * 270; g.beginPath(); g.moveTo(x, 360); g.lineTo(x, 700); ink(g, 3); g.beginPath(); g.moveTo(x - 50, 740); g.lineTo(x + 50, 740); g.lineTo(x + 22, 700); g.lineTo(x - 22, 700); g.closePath(); g.fillStyle = '#4a4038'; g.fill(); ink(g, 2); const gl = g.createRadialGradient(x, 760, 0, x, 760, 260); gl.addColorStop(0, 'rgba(255,228,170,0.30)'); gl.addColorStop(1, 'rgba(255,228,170,0)'); g.fillStyle = gl; g.beginPath(); g.arc(x, 760, 260, 0, 7); g.fill(); }
    // plain concrete floor (nothing coloured under the cars)
    g.fillStyle = '#8b7e6c'; g.fillRect(0, 1250, W, H - 1250);
    g.strokeStyle = 'rgba(58,42,28,0.35)'; g.lineWidth = 2; for (let y = 1300; y < H; y += 90) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    g.beginPath(); g.moveTo(0, 1250); g.lineTo(W, 1250); ink(g, 3);
    const ppm = 160, v = 1.5;
    const cars = [['green', -5.5], ['blue', -0.3], ['white', 4.9]].map(([c, x0]) => ({ c, d: x0 + lt * v }));
    // robot welder hanging from the roof rail; torch tip touches the passing body
    const TX = 700, TY = 1150;
    const near = cars.some(o => { const cx = 0 + o.d * ppm; return TX > cx - 280 && TX < cx + 300; });
    g.lineCap = 'round';
    g.beginPath(); g.moveTo(820, 360); g.lineTo(820, 760); g.lineTo(TX + 40, 1060); g.lineTo(TX, TY - 6);
    g.strokeStyle = '#d0902e'; g.lineWidth = 26; g.stroke(); g.lineWidth = 3; g.strokeStyle = INK2; g.stroke();
    for (const [jx, jy] of [[820, 760], [TX + 40, 1060]]) { g.beginPath(); g.arc(jx, jy, 20, 0, 7); g.fillStyle = '#6f6458'; g.fill(); ink(g, 3); }
    g.beginPath(); g.rect(790, 330, 60, 34); g.fillStyle = '#6f6458'; g.fill(); ink(g, 3);
    cars.forEach(o => { const x = o.d * ppm; if (x > -700 && x < W + 700) drawCar(g, { kind: 'sedan', color: o.c, x, gy: 1250, ppm, dist: o.d, v, t, noExhaust: true, bob: 0.3 }); });
    if (near) {
      for (let i = 0; i < 46; i++) { const ph = (lt * 2.6 + hash(i)) % 1; const an = -Math.PI * (0.15 + 0.7 * hash(i + 1)); const sp = 140 + 160 * hash(i + 2);
        const sx = TX + Math.cos(an) * ph * sp - 40 * ph, sy = TY + Math.sin(an) * ph * sp + ph * ph * 260; g.fillStyle = `rgba(255,${190 + 60 * hash(i)},110,${1 - ph})`; g.fillRect(sx, sy, 4, 4); }
      const gl = g.createRadialGradient(TX, TY, 0, TX, TY, 110); gl.addColorStop(0, `rgba(210,230,255,${0.75 + 0.25 * Math.sin(lt * 50)})`); gl.addColorStop(1, 'rgba(210,230,255,0)'); g.fillStyle = gl; g.beginPath(); g.arc(TX, TY, 110, 0, 7); g.fill();
    }
    chip(g, 'BURSA · 1971', W / 2, 300, { size: 56, bg: '#1b1713', fill: '#ffd84a', border: '#ffd84a', ls: 3, k: 0.7 + 0.3 * easeOutBack(seg(lt, 0, 0.3)) });
  } else { // yard
    const ly = lt - 3.3, pan = ly * 1.1, ppm = 150;
    villageWorld(g, pan, ppm, t, { poles: false, horizon: 900, roadY0: 1330, roadY1: 1420, road: { noDash: true, asphalt: '#8b8984' } });
    factory(g, -60 - pan * ppm * 0.5, 1000);
    g.fillStyle = '#8d8b86'; g.fillRect(0, 1000, W, 330);
    g.strokeStyle = '#f2efe6'; g.lineWidth = 4; layer(g, pan * ppm, 1, 300, x => { g.beginPath(); g.moveTo(x, 1010); g.lineTo(x - 30, 1150); g.moveTo(x, 1170); g.lineTo(x - 30, 1320); g.stroke(); }, 0);
    // new cars leave the yard in two lanes, wheels rolling
    const row = (gy, rp, sp, off, v) => { const o2 = pan * rp * 0.75 - ly * v * rp; const i0 = Math.floor((o2 - 400) / sp), i1 = Math.ceil((o2 + W + 400) / sp);
      for (let i = i0; i <= i1; i++) { const c = ((i + off) % 2 + 2) % 2 ? 'green' : 'blue'; drawCar(g, { kind: 'sedan', color: c, x: i * sp - o2, gy, ppm: rp, dist: ly * v + i * 3.1, v, t, noExhaust: true, bob: 0.4 }); } };
    row(1150, 92, 450, 0, 1.2);
    row(1318, 118, 570, 1, 1.8);
    chip(g, 'BURSA · 1971', W / 2, 300, { size: 56, bg: '#1b1713', fill: '#ffd84a', border: '#ffd84a', ls: 3 });
  }
  kCaptions(g, t);
};

// K3 10.5–12: faded print of an orange Renault 12 drops onto a table
K.k3 = (g, t) => {
  const lt = t - 10.5;
  g.fillStyle = '#6b4a30'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 26; i++) { g.strokeStyle = `rgba(40,25,12,${0.15 + 0.15 * hash(i)})`; g.lineWidth = 2 + hash(i + 1) * 4; g.beginPath(); g.moveTo(0, i * 76 + hash(i) * 30); g.bezierCurveTo(300, i * 76 + 30, 700, i * 76 - 20, W, i * 76 + hash(i + 2) * 30); g.stroke(); }
  const k = easeOut(seg(lt, 0, 0.45)), rot = lerp(-0.35, -0.06, k), sc = lerp(1.5, 1, k), y = lerp(700, 900, k);
  g.save(); g.translate(W / 2, y); g.rotate(rot); g.scale(sc, sc);
  g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 40; g.shadowOffsetY = 20;
  g.fillStyle = '#f3ecdc'; g.fillRect(-430, -380, 860, 820); g.shadowColor = 'transparent';
  g.save(); g.beginPath(); g.rect(-390, -340, 780, 620); g.clip();
  const sk = g.createLinearGradient(0, -340, 0, 280); sk.addColorStop(0, '#c9d8d2'); sk.addColorStop(1, '#e9dcc0'); g.fillStyle = sk; g.fillRect(-390, -340, 780, 620);
  g.fillStyle = '#b9a98a'; g.fillRect(-390, 40, 780, 240);
  for (let i = 0; i < 4; i++) { g.fillStyle = ['#d9c6a3', '#cdb894', '#e2d1b1', '#c8b08a'][i]; g.fillRect(-390 + i * 200, -150, 180, 190); g.fillStyle = '#7d8c99'; g.fillRect(-360 + i * 200, -110, 40, 50); g.fillRect(-290 + i * 200, -110, 40, 50); }
  drawCar(g, { kind: 'sedan', color: 'orange', x: 0, gy: 200, ppm: 165, dist: 0, v: 0, t, noExhaust: true, bob: 0 });
  // faded print look
  g.fillStyle = 'rgba(240,200,140,0.22)'; g.fillRect(-390, -340, 780, 620);
  const vg = g.createRadialGradient(0, -30, 200, 0, -30, 560); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(90,50,20,0.45)'); g.fillStyle = vg; g.fillRect(-390, -340, 780, 620);
  g.restore();
  txt(g, 'Bursa, 1971', 0, 370, { size: 46, font: 'IBlackI', fill: '#5a4632' });
  g.restore();
  kCaptions(g, t, 1560);
};

// K4 12–17.5: plateau, snowy Taurus mountains, white Toros crosses A -> B, "TOROS"
const MK4 = makeMotion(() => 2.3, 7);
K.k4 = (g, t, noBig) => {
  const lt = t - 12, ppm = 175;
  sky(g, '#5b9fd6', '#a5d0ec', '#eef1e6', 980);
  sun(g, 180, 300, 54);
  clouds(g, 0, t, 230, 4, 0.03);
  snowMountains(g, 0, 1020, 0, 640, '#8796b0', 1.3);
  snowMountains(g, 0, 1060, 0, 380, '#7889a3', 4.4);
  fields(g, 0, 1040, 1180, 0, ['#c7c27a', '#b9b56a', '#d4cb85', '#c1bb72']);
  g.fillStyle = '#c4b874'; g.fillRect(0, 1180, W, 30);
  road(g, 0, 1200, 1330, ppm, {});
  grass(g, 0, 1330, '#b9b067', '#a59c58');
  const x = -470 + MK4.pos(lt) * ppm;
  drawCar(g, { kind: 'station', color: 'white', x, gy: 1290, ppm, dist: MK4.pos(lt), v: 2.3, t });
  const kt = noBig ? 0 : seg(lt, 2.3, 2.55);
  if (kt > 0) {
    g.save(); g.translate(W / 2, 640); const s2 = 1 + (1 - easeOut(kt)) * 1.8; g.scale(s2, s2); g.globalAlpha = kt;
    g.font = '230px IBlack'; g.textAlign = 'center'; g.lineJoin = 'round';
    g.lineWidth = 26; g.strokeStyle = '#111'; g.strokeText('TOROS', 0, 0); g.fillStyle = '#ffd84a'; g.fillText('TOROS', 0, 0);
    g.restore();
  }
  const ka = noBig ? 0 : seg(lt, 3.4, 3.8);
  if (ka > 0) {
    chip(g, 'TOROS DAĞLARI', 330, 780, { size: 40, bg: '#1b1713', fill: '#fff', border: '#fff', alpha: ka });
    g.save(); g.globalAlpha = ka; g.strokeStyle = '#fff'; g.lineWidth = 6; g.lineCap = 'round';
    g.beginPath(); g.moveTo(330, 815); g.quadraticCurveTo(300, 880, 360, 920); g.stroke();
    g.beginPath(); g.moveTo(360, 920); g.lineTo(330, 900); g.moveTo(360, 920); g.lineTo(336, 935); g.stroke(); g.restore();
  }
  kCaptions(g, t);
  return MK4.pos(lt);
};

// K5 17.5–20.5: freeze frame, desaturate + fade, "NEDEN Mİ?"
K.k5 = (g, t) => {
  const lt = t - 17.5;
  if (!FROZEN) {
    FROZEN = document.createElement('canvas'); FROZEN.width = W; FROZEN.height = H;
    const fg = FROZEN.getContext('2d'); fg.imageSmoothingQuality = 'high';
    const keep = KCAPS.slice(); KCAPS.length = 0; K.k4(fg, 17.49, true); KCAPS.push(...keep);
  }
  const k = smooth(seg(lt, 0.05, 0.8));
  g.save(); g.filter = `grayscale(${k}) sepia(${k * 0.35}) brightness(${1 - 0.45 * k}) blur(${k * 3}px)`;
  const z = 1 + lt * 0.02; g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-W / 2, -H / 2);
  g.drawImage(FROZEN, 0, 0); g.restore();
  // film-freeze flash + frame lines
  const fl = Math.exp(-lt * 12); g.fillStyle = `rgba(255,255,255,${0.7 * fl})`; g.fillRect(0, 0, W, H);
  bigWord(g, 'NEDEN Mİ?', t, 17.8, 20.5, 760, { size: 170, sw: 24 });
  kCaptions(g, t);
};

// K6 20.5–23.7: green sedan on a dirt village road, dust trail, A -> B
const MK6 = makeMotion(() => 3.3, 5);
function dirtWorld(g, camPx, t, ppm) {
  sky(g, '#6db0e0', '#a8d6ee', '#f0ead4', 930);
  sun(g, 880, 290, 56);
  clouds(g, camPx, t, 200, 4, 0.03);
  mountains(g, camPx, 930, 0.05, '#b3a99a', 200, false, 1);
  fields(g, camPx, 930, 1090, 0.18, ['#c9b56d', '#b9a55e', '#d6c27a', '#c4ae66']);
  layer(g, camPx, 0.35, 230, (x, i) => {
    if (hash(i + 2) < 0.65) { // adobe village houses (flat roofs)
      g.beginPath(); g.rect(x, 1010, 130, 80); g.fillStyle = '#d9b98a'; g.fill(); outline(g, 2.5);
      g.fillStyle = '#8a6a4a'; g.fillRect(x - 6, 1004, 142, 10); g.fillStyle = '#5a7da0'; g.fillRect(x + 20, 1035, 22, 24); g.fillStyle = '#7a5236'; g.fillRect(x + 80, 1040, 24, 50);
    } else poplar(g, x + 60, 1095, 170, 24);
  }, 17);
  g.fillStyle = '#b79a68'; g.fillRect(0, 1090, W, 70);
  // dirt road with ruts and stones (moves with ground)
  g.fillStyle = '#a88559'; g.fillRect(0, 1160, W, 190);
  g.fillStyle = 'rgba(90,60,30,0.25)'; g.fillRect(0, 1205, W, 14); g.fillRect(0, 1290, W, 14);
  layer(g, camPx, 1, 47, (x, i) => { g.fillStyle = `rgba(${hash(i) > 0.5 ? '230,210,170' : '90,65,40'},0.6)`; g.beginPath(); g.ellipse(x, 1170 + hash(i * 3) * 170, 5 + hash(i) * 8, 3 + hash(i + 1) * 4, 0, 0, 7); g.fill(); }, 3);
  grass(g, camPx, 1350, '#a9b25c', '#97a04f');
}
K.k6 = (g, t) => {
  const lt = t - 20.5, ppm = 190;
  dirtWorld(g, 0, t, ppm);
  const x = -520 + MK6.pos(lt) * ppm, dist = MK6.pos(lt);
  // dust clouds left behind by the tyres
  for (let i = 0; i < 26; i++) {
    const age = (i / 26) * 1.2, ox = x - 330 - age * 220 - (MK6.pos(lt) - MK6.pos(Math.max(0, lt - age))) * 0;
    const px = x - 360 + (-age * 3.3 * ppm) * 0.15 - i * 14, py = 1270 - age * 60 - hash(i) * 30;
    g.fillStyle = `rgba(214,190,150,${0.5 * (1 - age / 1.2)})`; g.beginPath(); g.arc(px, py, 30 + age * 70, 0, 7); g.fill();
  }
  drawCar(g, { kind: 'sedan', color: 'green', x, gy: 1300, ppm, dist, v: 3.3, t, bodyImg: KV.dust, noExhaust: true });
  kCaptions(g, t);
  return dist;
};

// K7 23.7–26.9: blue Toros with luggage on the roof, seen from behind, heading off for the bayram
K.k7 = (g, t) => {
  const lt = t - 23.7;
  const hz = 860, f = 1000, hc = 1.35;
  const skyG = g.createLinearGradient(0, 0, 0, hz); skyG.addColorStop(0, '#6c8fd0'); skyG.addColorStop(0.6, '#f0b77a'); skyG.addColorStop(1, '#ffe2a8'); g.fillStyle = skyG; g.fillRect(0, 0, W, hz);
  sun(g, 540, hz - 70, 80, '#fff0c0', 'rgba(255,200,120,0.5)');
  mountains(g, 0, hz, 0, '#a07f8c', 160, false, 2);
  g.fillStyle = '#c9a66a'; g.fillRect(0, hz, W, H - hz);
  const camZ = lt * 2.6;                        // camera travels at 2.6 m/s
  const carZ = 2.3 + lt * 0.55;                 // car slowly pulls away (3.15 m/s)
  const P = (X, Z) => [540 + f * X / Z, hz + f * hc / Z];
  // road trapezoid
  g.fillStyle = '#7a7470'; g.beginPath(); const a = P(-3.6, 1), b = P(3.6, 1); g.moveTo(a[0], a[1] * 1 + 900); g.lineTo(540 - 3, hz); g.lineTo(540 + 3, hz); g.lineTo(b[0], b[1] + 900); g.closePath(); g.fill();
  // solid edge line (right)
  { const [ax, ay] = P(1.7, 0.6), [bx, by] = P(1.85, 0.6), [cx2, cy2] = P(1.85, 400), [dx2, dy2] = P(1.7, 400); g.fillStyle = '#f2efe6'; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.lineTo(cx2, cy2); g.lineTo(dx2, dy2); g.closePath(); g.fill(); }
  // roadside poplars and posts streaming past
  for (let i = 0; i < 40; i++) {
    const z0 = i * 6 - (camZ % 6); if (z0 < 0.8) continue;
    for (const side of [-1, 1]) { const [px, py] = P(side * 5.2, z0); const sc = f / z0; poplar(g, px, py, sc * 4.5, sc * 0.6, '#6e8f42', '#587636'); }
  }
  // centre dashes (3 m on / 3 m off) – move with the camera
  g.fillStyle = '#f2efe6';
  for (let i = 0; i < 60; i++) {
    const z0 = i * 6 - (camZ % 6), z1 = z0 + 3; if (z1 < 0.6) continue;
    const za = Math.max(z0, 0.6); const [x0, y0] = P(-1.82, za), [x1, y1] = P(-1.70, za), [x2, y2] = P(-1.70, z1), [x3, y3] = P(-1.82, z1);
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineTo(x2, y2); g.lineTo(x3, y3); g.closePath(); g.fill();
  }
  // car (rear view), right lane
  const im = IMG.rear_blue, widthM = 1.64, wpx = f * widthM / carZ, s = wpx / im.width;
  const [cx, gy] = P(0.0, carZ);
  const bob = Math.sin(lt * 11) * 1.5 + Math.sin(lt * 5.3) * 1.2;
  const top = gy - im.height * s;
  g.drawImage(im, cx - wpx / 2, top - bob, wpx, im.height * s);
  // luggage on the rack
  const L = (x0, y0, w, h, col) => { g.beginPath(); g.roundRect(cx - wpx / 2 + x0 * s, top - bob + y0 * s, w * s, h * s, 10 * s); g.fillStyle = col; g.fill(); g.strokeStyle = INK; g.lineWidth = 3 * s; g.stroke(); };
  L(150, -120, 300, 130, '#8a4b2f'); L(470, -150, 260, 160, '#2f5d7a'); L(250, -230, 420, 110, '#c2873e'); L(720, -90, 120, 100, '#6b6f3a');
  g.strokeStyle = '#e9e1cf'; g.lineWidth = 5 * s; for (const xx of [300, 600]) { g.beginPath(); g.moveTo(cx - wpx / 2 + xx * s, top - bob + 15 * s); g.lineTo(cx - wpx / 2 + xx * s, top - bob - 235 * s); g.stroke(); }
  // number plate (Bursa 16)
  txt(g, '16 TR 1989', cx - wpx / 2 + 490 * s, top - bob + 518 * s, { size: 52 * s, font: 'IBlack', fill: '#1b1b1b' });
  // brake/tail glow + exhaust
  for (let i = 0; i < 5; i++) { const ph = (lt * 1.8 + i / 5) % 1; g.fillStyle = `rgba(240,235,225,${0.35 * (1 - ph)})`; g.beginPath(); g.arc(cx - wpx / 2 + 200 * s - ph * 40 * s, gy - 70 * s - ph * 50 * s, (20 + ph * 60) * s, 0, 7); g.fill(); }
  kCaptions(g, t);
  return camZ;
};

// K8 26.9–30.1: white Toros through mud (tracked), splashes, body gets muddier
const MK8 = makeMotion(() => 2.9, 5);
K.k8 = (g, t) => {
  const lt = t - 26.9, ppm = 200, dist = MK8.pos(lt), camPx = dist * ppm;
  sky(g, '#8a9fb2', '#b7c3cb', '#d9d8cc', 930);
  clouds(g, camPx, t, 180, 5, 0.03);
  mountains(g, camPx, 930, 0.05, '#8e8f8a', 200, false, 2);
  fields(g, camPx, 930, 1090, 0.2, ['#7d8a52', '#6f7c47', '#8a955c', '#76834c']);
  layer(g, camPx, 0.35, 260, (x, i) => { if (hash(i) < 0.6) poplar(g, x, 1100, 170, 22, '#557540', '#466434'); }, 5);
  g.fillStyle = '#6f5a3e'; g.fillRect(0, 1100, W, 70);
  g.fillStyle = '#6b4f30'; g.fillRect(0, 1160, W, 200);
  layer(g, camPx, 1, 150, (x, i) => { // puddles reflecting the sky
    g.fillStyle = 'rgba(160,175,185,0.55)'; g.beginPath(); g.ellipse(x, 1200 + hash(i) * 120, 60 + hash(i + 1) * 70, 12 + hash(i + 2) * 8, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(70,45,22,0.45)'; g.beginPath(); g.ellipse(x + 70, 1250 + hash(i + 3) * 90, 40, 9, 0, 0, 7); g.fill();
  }, 2);
  grass(g, camPx, 1360, '#6f8a46', '#5f793c');
  const md = model('station'), s = ppm / md.m.pxPerM;
  const car = drawCar(g, { kind: 'station', color: 'white', x: 540, gy: 1290, ppm, dist, v: 2.9, t, bodyOver: KV.mud, bodyOverA: clamp(0.25 + lt / 2.2, 0, 1), noExhaust: true });
  // mud splashes thrown back from both tyres
  for (const wx of md.m.wheels.map(w => car.left + w[0] * s)) {
    for (let i = 0; i < 22; i++) {
      const ph = (lt * 2.4 + hash(i + wx) ) % 1;
      const px = wx - 40 - ph * 260 - hash(i * 2) * 60, py = 1270 - Math.sin(ph * Math.PI) * (80 + hash(i * 3) * 120);
      g.fillStyle = `rgba(92,62,32,${0.9 * (1 - ph)})`; g.beginPath(); g.ellipse(px, py, 7 + hash(i) * 9, 5 + hash(i + 1) * 6, ph * 3, 0, 7); g.fill();
    }
  }
  kCaptions(g, t);
  return dist;
};

// K9 30.1–33.3: red Toros with snow chains, snowfall (tracked)
const MK9 = makeMotion(() => 2.4, 5);
K.k9 = (g, t) => {
  const lt = t - 30.1, ppm = 200, dist = MK9.pos(lt), camPx = dist * ppm;
  sky(g, '#9aa7b8', '#c4cdd8', '#e7ebf0', 930);
  snowMountains(g, camPx, 960, 0.05, 360, '#c8d0dc', 0.8);
  g.fillStyle = '#f2f5f9'; g.fillRect(0, 930, W, 240);
  layer(g, camPx, 0.35, 200, (x, i) => { if (hash(i) < 0.7) { g.beginPath(); g.moveTo(x, 1000); g.lineTo(x + 34, 1130); g.lineTo(x - 34, 1130); g.closePath(); g.fillStyle = '#3d5a48'; g.fill(); outline(g, 2); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(x, 1000); g.lineTo(x + 16, 1050); g.lineTo(x - 16, 1050); g.closePath(); g.fill(); } }, 9);
  // packed-snow road with tyre tracks
  g.fillStyle = '#dfe5ec'; g.fillRect(0, 1160, W, 190);
  g.fillStyle = 'rgba(120,130,145,0.35)'; g.fillRect(0, 1262, W, 22); g.fillRect(0, 1200, W, 18);
  layer(g, camPx, 1, 40, (x, i) => { g.fillStyle = 'rgba(150,160,175,0.4)'; g.fillRect(x, 1266, 10, 14); }, 0);
  g.fillStyle = '#f7f9fc'; g.fillRect(0, 1350, W, H - 1350);
  drawCar(g, { kind: 'station', color: 'red', x: 540, gy: 1290, ppm, dist, v: 2.4, t, bodyImg: KV.snow, chains: true });
  // snowfall (wind-blown, parallax)
  for (let i = 0; i < 180; i++) {
    const depth = 0.4 + hash(i) * 1.2, sp = 90 * depth;
    const x = ((hash(i + 1) * W * 1.4 - lt * sp * 1.3 - camPx * 0.15 * depth) % (W * 1.2) + W * 1.2) % (W * 1.2) - 60;
    const y = (hash(i + 2) * H + lt * sp * 2.2) % H;
    g.fillStyle = `rgba(255,255,255,${0.55 + 0.4 * hash(i + 3)})`; g.beginPath(); g.arc(x, y, 2 + depth * 3, 0, 7); g.fill();
  }
  kCaptions(g, t);
  return dist;
};

// K10 33.3–36.5: red Toros climbs a mountain track, goat on a rock
const MK10 = makeMotion(() => 2.2, 5);
K.k10 = (g, t) => {
  const lt = t - 33.3, ppm = 175, th = 0.24, dist = MK10.pos(lt);
  sky(g, '#5d9fd6', '#a2cfeb', '#e8f0ee', 900);
  sun(g, 880, 260, 56);
  snowMountains(g, dist * ppm, 980, 0.05, 560, '#8b9ab4', 3.1);
  g.fillStyle = '#86a35a'; g.fillRect(0, 975, W, H - 975);
  // slope: ground line through screen point (540,1300) with angle th, track moves along it
  const ox = 540, oy = 1300, cs = Math.cos(th), sn = Math.sin(th);
  g.save(); g.translate(ox, oy); g.rotate(-th);
  const camPx = dist * ppm;
  g.fillStyle = '#9b8a6d'; g.fillRect(-1400, 0, 2800, 1400);
  g.fillStyle = '#7d9a4e'; g.fillRect(-1400, -12, 2800, 14);
  g.fillStyle = '#b39b74'; g.fillRect(-1400, 0, 2800, 70);
  for (let i = -20; i < 20; i++) { const x = i * 90 - (camPx % 90); g.fillStyle = 'rgba(80,60,40,0.35)'; g.beginPath(); g.ellipse(x, 30 + hash(i + Math.floor(camPx / 90)) * 30, 10, 5, 0, 0, 7); g.fill(); }
  for (let i = -8; i < 8; i++) { const x = i * 260 - ((camPx * 1.0) % 260); rockMass(g, [[x, 90], [x + 60, 60], [x + 130, 80], [x + 160, 140], [x + 20, 150]], '#8a7a62'); }
  drawCar(g, { kind: 'station', color: 'red', x: 0, gy: 0, ppm, dist, v: 2.2, t });
  g.restore();
  // foreground rock with goat
  rockMass(g, [[640, H + 10], [700, 1700], [820, 1630], [960, 1650], [1110, 1720], [1110, H + 10]], '#a3927a');
  goat(g, 900, 1642, 125, { t, bleat: Math.max(0, Math.sin(clamp((lt - 1.0) / 0.9, 0, 1) * Math.PI)), dir: -1 });
  kCaptions(g, t, 1800);
  return dist;
};

// K11 36.5–39.5: driver's POV, heavy manual steering
K.k11 = (g, t) => {
  const lt = t - 36.5;
  // windscreen view: perspective road moving
  const hz = 760; const sk = g.createLinearGradient(0, 0, 0, hz); sk.addColorStop(0, '#6aa9db'); sk.addColorStop(1, '#e8f1ee'); g.fillStyle = sk; g.fillRect(0, 0, W, hz);
  mountains(g, 0, hz, 0, '#93a4bc', 160, true, 5);
  g.fillStyle = '#a9c46a'; g.fillRect(0, hz, W, 600);
  const steer = Math.sin(lt * 1.3) * 0.9;     // wheel angle (rad), road bends accordingly
  const bend = steer * 220;
  g.fillStyle = '#77736f'; g.beginPath(); g.moveTo(-200, 1300); g.quadraticCurveTo(540 + bend * 0.6, 1000, 520 + bend, hz); g.lineTo(560 + bend, hz); g.quadraticCurveTo(540 + bend * 0.6, 1000, 1280, 1300); g.closePath(); g.fill();
  g.strokeStyle = '#f2efe6'; g.lineWidth = 10; g.setLineDash([60, 60]); g.lineDashOffset = -lt * 600;
  g.beginPath(); g.moveTo(540, 1300); g.quadraticCurveTo(540 + bend * 0.6, 1000, 540 + bend, hz); g.stroke(); g.setLineDash([]);
  // windscreen frame + dashboard
  g.fillStyle = '#2b2723'; g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, 1100); g.lineTo(960, 1100); g.lineTo(880, 120); g.lineTo(200, 120); g.lineTo(120, 1100); g.lineTo(0, 1100); g.closePath(); g.fill();
  g.fillStyle = '#3a342e'; g.fillRect(0, 1080, W, H - 1080);
  g.fillStyle = '#2a2622'; g.beginPath(); g.roundRect(-20, 1050, W + 40, 200, 60); g.fill();
  // gauges
  for (const [gx, lbl] of [[380, 'km/h'], [700, '']]) {
    g.fillStyle = '#111'; g.beginPath(); g.arc(gx, 1170, 95, 0, 7); g.fill(); g.strokeStyle = '#8c8c8c'; g.lineWidth = 5; g.stroke();
    g.strokeStyle = '#eee'; g.lineWidth = 3; for (let k = 0; k <= 10; k++) { const a = Math.PI * (0.75 + k * 0.15); g.beginPath(); g.moveTo(gx + Math.cos(a) * 80, 1170 + Math.sin(a) * 80); g.lineTo(gx + Math.cos(a) * 66, 1170 + Math.sin(a) * 66); g.stroke(); }
    const na = Math.PI * (0.75 + (gx === 380 ? 0.55 + Math.sin(lt * 3) * 0.05 : 0.4 + Math.sin(lt * 5) * 0.08) * 1.5);
    g.strokeStyle = '#ff5a3a'; g.lineWidth = 5; g.beginPath(); g.moveTo(gx, 1170); g.lineTo(gx + Math.cos(na) * 70, 1170 + Math.sin(na) * 70); g.stroke();
    if (lbl) txt(g, lbl, gx, 1225, { size: 20, font: 'IBold', fill: '#ccc' });
  }
  // steering wheel (heavy, no power assist): jerky, effortful turns
  const cx = 540, cy = 1430, R = 330, shake = Math.sin(lt * 60) * 3 * Math.abs(Math.cos(lt * 1.3));
  g.strokeStyle = '#3c5a8a'; g.lineWidth = 110; g.lineCap = 'round';
  for (const a of [-2.55, -0.6]) { const ang = a + steer, hx = cx + Math.cos(ang) * R, hy = cy + Math.sin(ang) * R; g.beginPath(); g.moveTo(hx, hy + 20); g.lineTo(a < -1 ? -120 : W + 120, H + 60); g.stroke(); }
  g.save(); g.translate(cx + shake, cy); g.rotate(steer);
  g.strokeStyle = '#151515'; g.lineWidth = 46; g.beginPath(); g.arc(0, 0, R, 0, 7); g.stroke();
  g.strokeStyle = '#2c2c2c'; g.lineWidth = 10; g.beginPath(); g.arc(0, 0, R + 12, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
  g.fillStyle = '#1b1b1b'; g.beginPath(); g.moveTo(-R, -18); g.lineTo(-90, -40); g.lineTo(90, -40); g.lineTo(R, -18); g.lineTo(R, 22); g.lineTo(90, 50); g.lineTo(-90, 50); g.lineTo(-R, 22); g.closePath(); g.fill();
  g.beginPath(); g.ellipse(0, 10, 120, 95, 0, 0, 7); g.fillStyle = '#222'; g.fill(); g.strokeStyle = '#444'; g.lineWidth = 4; g.stroke();
  // hands at 10 and 2
  for (const a of [-2.55, -0.6]) {
    const hx = Math.cos(a) * R, hy = Math.sin(a) * R;
    g.fillStyle = '#e1a97f'; g.strokeStyle = INK; g.lineWidth = 4;
    g.beginPath(); g.ellipse(hx, hy, 58, 44, a, 0, 7); g.fill(); g.stroke();
    for (let k = -1; k <= 2; k++) { g.beginPath(); g.ellipse(hx + Math.cos(a + 1.57) * k * 20, hy + Math.sin(a + 1.57) * k * 20, 13, 26, a, 0, 7); g.fill(); g.stroke(); }
  }
  g.restore();
  // effort marks + sweat
  const ef = Math.abs(Math.cos(lt * 1.3));
  g.strokeStyle = `rgba(255,255,255,${0.8 * ef})`; g.lineWidth = 7;
  for (const [x, y, a] of [[150, 1180, -0.5], [930, 1180, 0.5], [120, 1260, -0.2], [960, 1260, 0.2]]) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(a) * 50, y - 50); g.stroke(); }
  txt(g, 'ZORLA!', 540, 960, { size: 70, font: 'IBlackI', fill: '#fff', stroke: '#111', sw: 12, alpha: ef * seg(lt, 0.4, 0.7), rot: -0.08 });
  kCaptions(g, t, 1520);
};

// K12 39.5–42.5: crank-operated window (no A/C)
K.k12 = (g, t) => {
  const lt = t - 39.5;
  const turns = smooth(seg(lt, 0.3, 2.7)) * 3.2;          // crank turns
  const glassTop = 330 + turns / 3.2 * 470;               // glass slides down as the crank turns
  // outside view through the window opening (moving scenery)
  g.save(); g.beginPath(); g.roundRect(110, 300, 860, 520, 40); g.clip();
  villageWorld(g, lt * 3.0, 120, t, { horizon: 640, roadY0: 800, roadY1: 860, poles: true, sunY: 380 });
  g.restore();
  // glass (tinted) with top edge at glassTop
  g.save(); g.beginPath(); g.roundRect(110, 300, 860, 520, 40); g.clip();
  g.fillStyle = 'rgba(60,80,90,0.35)'; g.fillRect(110, glassTop, 860, 600);
  g.fillStyle = 'rgba(255,255,255,0.25)'; g.beginPath(); g.moveTo(300, glassTop); g.lineTo(420, glassTop); g.lineTo(260, glassTop + 400); g.lineTo(140, glassTop + 400); g.closePath(); g.fill();
  g.fillStyle = '#ccc'; g.fillRect(110, glassTop - 6, 860, 10);
  g.restore();
  // wind lines once open
  const wo = clamp((turns - 1.2) / 1.5, 0, 1);
  if (wo > 0) { g.strokeStyle = `rgba(255,255,255,${0.6 * wo})`; g.lineWidth = 5; for (let i = 0; i < 8; i++) { const y = 380 + i * 50, x = ((lt * 1400 + i * 230) % 1300) - 200; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 80, y - 15, x + 160, y + 15, x + 240, y); g.stroke(); } }
  // door frame + panel (vinyl)
  g.fillStyle = '#d8c7a5'; g.beginPath(); g.rect(0, 0, W, H); g.roundRect(110, 300, 860, 520, 40); g.fill('evenodd');
  g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.roundRect(110, 300, 860, 520, 40); g.stroke();
  g.fillStyle = '#c4b08b'; g.fillRect(0, 880, W, H - 880);
  g.strokeStyle = 'rgba(80,60,40,0.35)'; g.lineWidth = 3; for (let y = 960; y < H; y += 70) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  g.fillStyle = '#9c8662'; g.beginPath(); g.roundRect(60, 900, 960, 110, 40); g.fill(); g.strokeStyle = INK; g.lineWidth = 4; g.stroke();   // armrest
  g.fillStyle = '#b9b9b9'; g.beginPath(); g.roundRect(160, 1080, 220, 60, 20); g.fill(); g.stroke();                                    // door handle
  // crank
  const px = 700, py = 1330, ang = turns * Math.PI * 2;
  g.fillStyle = '#9a9a9a'; g.beginPath(); g.arc(px, py, 46, 0, 7); g.fill(); g.strokeStyle = INK; g.lineWidth = 4; g.stroke();
  const kx = px + Math.cos(ang) * 170, ky = py + Math.sin(ang) * 170;
  g.strokeStyle = '#d6d6d6'; g.lineWidth = 30; g.lineCap = 'round'; g.beginPath(); g.moveTo(px, py); g.lineTo(kx, ky); g.stroke();
  g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
  g.fillStyle = '#2b2b2b'; g.beginPath(); g.arc(kx, ky, 34, 0, 7); g.fill();
  // hand on the knob
  g.fillStyle = '#e1a97f'; g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.ellipse(kx + 10, ky + 10, 62, 50, ang, 0, 7); g.fill(); g.stroke();
  g.strokeStyle = '#3c5a8a'; g.lineWidth = 100; g.beginPath(); g.moveTo(kx + 40, ky + 50); g.lineTo(W + 150, H + 100); g.stroke();
  // rotation arrow
  g.strokeStyle = '#ffd84a'; g.lineWidth = 10; g.beginPath(); g.arc(px, py, 240, ang - 1.2, ang - 0.2); g.stroke();
  bigWord(g, 'KLİMA YOK', t, 39.55, 41.0, 230, { size: 96, fill: '#ff5a4a' });
  kCaptions(g, t, 1640);
};

// K13 42.5–45.5: village house, Renault 12 parked, mechanic underneath
K.k13 = (g, t) => {
  const lt = t - 42.5;
  villageWorld(g, 0, 190, t, { poles: false, roadY0: 1200, roadY1: 1330, road: { noDash: true, asphalt: '#b49a6e' } });
  // house
  g.beginPath(); g.rect(80, 700, 620, 500); g.fillStyle = '#efe3c9'; g.fill(); outline(g, 4);
  g.beginPath(); g.moveTo(40, 700); g.lineTo(390, 520); g.lineTo(740, 700); g.closePath(); g.fillStyle = '#c6553b'; g.fill(); outline(g, 4);
  g.fillStyle = '#7a5236'; g.fillRect(320, 960, 120, 240); g.strokeStyle = INK; g.lineWidth = 3; g.strokeRect(320, 960, 120, 240);
  for (const x of [140, 520]) { g.fillStyle = '#6f93b4'; g.fillRect(x, 800, 110, 110); g.strokeRect(x, 800, 110, 110); g.fillStyle = '#c0392b'; for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(x + 15 + k * 27, 925, 10, 0, 7); g.fill(); } g.fillStyle = '#8a5a3a'; g.fillRect(x - 5, 930, 120, 16); }
  // wooden balcony beam
  g.fillStyle = '#8a5a3a'; g.fillRect(80, 760, 620, 14);
  const ppm = 190;
  drawCar(g, { kind: 'sedan', color: 'white', x: 620, gy: 1290, ppm, dist: 0, v: 0, t, noExhaust: lt < 2.4, bob: 0 });
  // mechanic legs sticking out + wrench
  const wr = Math.sin(lt * 9) * 0.5;
  // creeper board + legs coming out from under the car (towards the viewer)
  g.fillStyle = '#5a3a22'; g.beginPath(); g.roundRect(520, 1278, 150, 22, 6); g.fill();
  const kick = Math.sin(lt * 4.5) * 4;
  for (const [lx, ph] of [[548, 0], [618, 1]]) {
    g.fillStyle = '#2f4f7a'; g.beginPath(); g.roundRect(lx - 22, 1270, 44, 92 + (ph ? kick : -kick), 14); g.fill(); g.strokeStyle = INK; g.lineWidth = 3; g.stroke();
    g.fillStyle = '#2a2018'; g.beginPath(); g.ellipse(lx, 1368 + (ph ? kick : -kick), 30, 18, 0, 0, 7); g.fill();
  }
  // wrench poking out
  g.save(); g.translate(720, 1268); g.rotate(-0.25 + wr * 0.6); g.fillStyle = '#9aa0a8'; g.fillRect(0, -6, 90, 12); g.beginPath(); g.arc(94, 0, 15, 0.6, 5.7); g.fill(); g.restore();
  // toolbox
  g.fillStyle = '#c0392b'; g.fillRect(140, 1250, 120, 60); g.strokeStyle = INK; g.lineWidth = 3; g.strokeRect(140, 1250, 120, 60); g.fillStyle = '#7f1d14'; g.fillRect(170, 1236, 60, 14);
  if (lt > 1.2) txt(g, 'TIK TIK', 760, 1180, { size: 44, font: 'IBlackI', fill: '#fff', stroke: INK, sw: 8, alpha: (Math.sin(lt * 9) > 0 ? 1 : 0.4) * (1 - seg(lt, 2.3, 2.5)), rot: -0.1 });
  if (lt > 2.4) { txt(g, 'VINNN!', 820, 1000, { size: 60, font: 'IBlackI', fill: '#ffd84a', stroke: INK, sw: 10, alpha: seg(lt, 2.4, 2.6), rot: -0.1 }); }
  kCaptions(g, t);
};

// K14 45.5–48.5: yellow taxi at Galata, A -> B
const MK14 = makeMotion(() => 3.4, 4);
K.k14 = (g, t) => {
  const lt = t - 45.5, ppm = 185;
  sky(g, '#6ea6d8', '#b8d8ee', '#f3ead6', 960);
  sun(g, 180, 300, 54);
  clouds(g, 0, t, 230, 4, 0.03);
  // historic peninsula silhouette across the water
  mosque(g, 820, 960, 0.55, '#9aa3b4'); mosque(g, 230, 960, 0.4, '#a9b1c0');
  g.fillStyle = '#9aa3b4'; for (let i = 0; i < 14; i++) g.fillRect(i * 80, 930 - hash(i) * 30, 70, 40 + hash(i) * 30);
  // Golden Horn water
  g.fillStyle = '#5f8fb8'; g.fillRect(0, 960, W, 90);
  g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 3; for (let i = 0; i < 12; i++) { const x = (i * 110 + lt * 20) % (W + 100) - 50; g.beginPath(); g.moveTo(x, 985 + (i % 3) * 22); g.lineTo(x + 40, 985 + (i % 3) * 22); g.stroke(); }
  // ferry
  const fx = 900 - lt * 40; g.fillStyle = '#f2efe6'; g.beginPath(); g.moveTo(fx - 90, 1000); g.lineTo(fx + 90, 1000); g.lineTo(fx + 70, 1030); g.lineTo(fx - 80, 1030); g.closePath(); g.fill(); outline(g, 2); g.fillStyle = '#2e3e55'; g.fillRect(fx - 50, 980, 90, 22); g.fillStyle = '#c0392b'; g.fillRect(fx - 5, 960, 14, 22);
  // Galata hillside houses + tower
  g.fillStyle = '#d9c4a2'; g.beginPath(); g.moveTo(0, 1050); g.lineTo(0, 930); g.quadraticCurveTo(300, 820, 560, 900); g.lineTo(560, 1050); g.closePath(); g.fill();
  for (let i = 0; i < 12; i++) { const x = 10 + i * 46, y = 960 - Math.sin(i / 12 * Math.PI) * 70; g.fillStyle = ['#e7c9a0', '#f0dcc0', '#d9a98a', '#e9d7b0'][i % 4]; g.fillRect(x, y, 42, 1050 - y); g.strokeStyle = INK; g.lineWidth = 1.5; g.strokeRect(x, y, 42, 1050 - y); g.fillStyle = '#b5523b'; g.fillRect(x - 2, y - 8, 46, 9); }
  galata(g, 290, 905, 0.95);
  // seagulls
  for (let i = 0; i < 5; i++) { const x = (200 + i * 170 + lt * 60) % W, y = 500 + hash(i) * 200, fl = Math.sin(lt * 8 + i) * 10; g.strokeStyle = '#333'; g.lineWidth = 4; g.beginPath(); g.moveTo(x - 24, y - fl); g.quadraticCurveTo(x - 10, y - 14, x, y); g.quadraticCurveTo(x + 10, y - 14, x + 24, y - fl); g.stroke(); }
  // coastal road
  g.fillStyle = '#cfc8b8'; g.fillRect(0, 1050, W, 90); g.fillStyle = '#9c968a'; g.fillRect(0, 1132, W, 10);
  road(g, 0, 1140, 1330, ppm, {});
  g.fillStyle = '#cfc8b8'; g.fillRect(0, 1330, W, H - 1330);
  const x = -500 + MK14.pos(lt) * ppm;
  drawCar(g, { kind: 'sedan', color: 'taxi', x, gy: 1300, ppm, dist: MK14.pos(lt), v: 3.4, t });
  chip(g, 'GALATA', W / 2, 330, { size: 46, bg: '#1b1713', fill: '#ffd84a', border: '#ffd84a', ls: 3, alpha: seg(lt, 0.1, 0.4) });
  kCaptions(g, t);
  return MK14.pos(lt);
};

// K15 48.5–51: police Toros, light bar flashing (tracked)
const MK15 = makeMotion(() => 3.2, 4);
K.k15 = (g, t) => {
  const lt = t - 48.5, ppm = 190, dist = MK15.pos(lt);
  townWorld(g, dist, ppm, t);
  g.fillStyle = 'rgba(30,40,90,0.30)'; g.fillRect(0, 0, W, H);   // dusk
  drawCar(g, { kind: 'station', color: 'police', x: 540, gy: 1300, ppm, dist, v: 3.2, t });
  // flashing wash on the scene
  const ph = Math.floor(t * 6) % 2; g.fillStyle = ph ? 'rgba(40,90,255,0.10)' : 'rgba(255,40,40,0.10)'; g.fillRect(0, 0, W, H);
  kCaptions(g, t);
  return dist;
};

// K16 51–54.5: town avenue full of Toroses & taxis, two-way traffic
const TRAFFIC_R = [['station', 'red', 0], ['sedan', 'taxi', 2.1], ['station', 'blue', 4.2], ['sedan', 'taxi', 6.3], ['station', 'green', 8.4], ['sedan', 'taxi', 10.5], ['station', 'white', 12.6]];
const TRAFFIC_L = [['station', 'white', 0], ['sedan', 'red', 2.3], ['station', 'green', 4.6], ['sedan', 'blue', 6.9], ['station', 'red', 9.2], ['sedan', 'green', 11.5]];
K.k16 = (g, t) => {
  const lt = t - 51;
  townWorld(g, lt * 0.6, 150, t);
  // far lane (leftbound, mirrored)
  const ppmB = 128, vB = 3.0;
  TRAFFIC_L.forEach(([k, c, off]) => {
    const d = (lt + off) * vB; const xr = -1820 + d * ppmB;      // position in mirrored space
    if (xr < -500 || xr > W + 500) return;
    g.save(); g.translate(W, 0); g.scale(-1, 1);
    drawCar(g, { kind: k, color: c, x: xr, gy: 1196, ppm: ppmB, dist: d, v: vB, t, noExhaust: true });
    g.restore();
  });
  const ppmF = 150, vF = 3.2;
  TRAFFIC_R.forEach(([k, c, off]) => {
    const xx = -2180 + ((lt + off) * vF) * ppmF;
    if (xx < -500 || xx > W + 500) return;
    drawCar(g, { kind: k, color: c, x: xx, gy: 1310, ppm: ppmF, dist: (lt + off) * vF, v: vF, t });
  });
  bigWord(g, 'HALKIN ARABASI', t, 51.15, 54.5, 520, { size: 120, sw: 20 });
  kCaptions(g, t);
};

// K17 54.5–58.5: family with their Toros + channel badge + CTA
K.k17 = (g, t) => {
  const lt = t - 54.5;
  villageWorld(g, 0, 190, t, { poles: false, roadY0: 1260, roadY1: 1330, road: { noDash: true }, sunX: 860, sunY: 330 });
  roundTree(g, 120, 1250, 110);
  // picnic blanket
  g.fillStyle = '#c0392b'; g.beginPath(); g.moveTo(60, 1430); g.lineTo(520, 1400); g.lineTo(560, 1480); g.lineTo(80, 1510); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 6; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(90 + i * 80, 1430 - i * 5); g.lineTo(110 + i * 80, 1505 - i * 5); g.stroke(); }
  // tea glasses
  for (let i = 0; i < 3; i++) { const x = 220 + i * 70; g.fillStyle = 'rgba(160,50,20,0.85)'; g.beginPath(); g.moveTo(x - 12, 1420); g.lineTo(x + 12, 1420); g.lineTo(x + 8, 1450); g.lineTo(x - 8, 1450); g.closePath(); g.fill(); }
  drawCar(g, { kind: 'station', color: 'white', x: 680, gy: 1300, ppm: 175, dist: 0, v: 0, t, noExhaust: true, bob: 0 });
  // family
  person(g, 250, 1330, 250, { t, shirt: '#3c5a8a', pants: '#3a3a3a', mustache: true, hair: '#2a2018' });
  person(g, 370, 1330, 235, { t, skirt: true, shirt: '#8e3b5c', scarf: '#e8c35a', pants: '#5a3a3a' });
  person(g, 150, 1330, 150, { t, shirt: '#e0453a', pants: '#2f4f7a', wave: true, ph: 0, hair: '#4a2f1e' });
  person(g, 470, 1330, 135, { t, skirt: true, shirt: '#3aa05c', pants: '#3a3a3a', wave: true, ph: 1.2, hair: '#4a2f1e' });
  // channel badge (logo slot – swap with your logo file)
  const kb = easeOutBack(seg(lt, 0.1, 0.5));
  g.save(); g.translate(W / 2, 330); g.scale(kb, kb);
  g.fillStyle = '#1b1713'; g.beginPath(); g.arc(0, 0, 92, 0, 7); g.fill(); g.lineWidth = 8; g.strokeStyle = '#ffd84a'; g.stroke();
  const fr = IMG.front, fs = 150 / fr.width; g.drawImage(fr, -75, -fr.height * fs / 2 - 6, 150, fr.height * fs);
  g.restore();
  const kq = seg(lt, 1.5, 1.85);
  if (kq > 0) {
    g.fillStyle = `rgba(10,8,6,${0.35 * kq})`; g.fillRect(0, 480, W, 420);
    txt(g, 'SENİN BABANIN', W / 2, 610, { size: 100, fill: '#fff', stroke: '#111', sw: 18, scale: 0.6 + 0.4 * easeOutBack(kq), alpha: kq });
    txt(g, 'ARABASI NEYDİ?', W / 2, 740, { size: 112, fill: '#ffd84a', stroke: '#111', sw: 20, scale: 0.6 + 0.4 * easeOutBack(seg(lt, 1.7, 2.05)), alpha: seg(lt, 1.7, 2.0) });
    const ky = seg(lt, 2.4, 2.7), p = 1 + 0.05 * Math.sin(lt * 9);
    if (ky > 0) { chip(g, 'YORUMA YAZ', W / 2, 850, { size: 54, bg: '#e0312b', fill: '#fff', border: '#111', k: p * (0.6 + 0.4 * easeOutBack(ky)), alpha: ky, ls: 3 }); }
  }
  kCaptions(g, t, 1640);
};


// ================================================================== PHOTO-BASED SCENES (user's reference photos, toon-filtered)
function photoBg(g, img, zoom = 1, cx = W / 2, cy = H / 2, rot = 0) {
  g.save(); g.translate(cx, cy); g.rotate(rot); g.scale(zoom, zoom); g.translate(-W / 2, -H / 2); g.drawImage(img, 0, 0, W, H); g.restore();
}
// rear-view Toros on a perspective road: path = [[y, x], ...] centre line, width(y) in px
function rearCar(g, img, x, gy, wpx, t, o = {}) {
  const s = wpx / img.width, h = img.height * s, top = gy - h;
  const bob = (Math.sin(t * 11) * 1.2 + Math.sin(t * 5.3) * 1.0) * (wpx / 600);
  g.drawImage(img, x - wpx / 2, top - bob, wpx, h);
  if (o.chains) { // chains on the visible tyre faces, links run downwards as the tyre rolls
    for (const tx of [41, 791]) {
      const x0 = x - wpx / 2 + tx * s, tw = 150 * s, y0 = top + (img.height - 120) * s, th = 118 * s;
      g.save(); g.beginPath(); g.rect(x0, y0, tw, th); g.clip();
      const per = 26 * s, off = (t * 2.4 / 0.30 * 0.30 * 160 * s) % per;
      g.strokeStyle = '#d5d8de'; g.lineWidth = 5 * s;
      for (let yy = y0 - per + off; yy < y0 + th + per; yy += per) { g.beginPath(); g.moveTo(x0, yy); g.lineTo(x0 + tw, yy + 8 * s); g.stroke(); }
      g.strokeStyle = '#3b3d42'; g.lineWidth = 3 * s; g.beginPath(); g.moveTo(x0 + tw * 0.5, y0); g.lineTo(x0 + tw * 0.5, y0 + th); g.stroke();
      g.restore();
    }
  }
  if (o.dust) for (let i = 0; i < 14; i++) {
    const ph = (t * 1.6 + i / 14) % 1;
    g.fillStyle = `rgba(222,196,150,${0.45 * (1 - ph)})`;
    g.beginPath(); g.arc(x + (hash(i) - 0.5) * wpx * 1.1, gy - ph * wpx * 0.25, (0.05 + ph * 0.25) * wpx, 0, 7); g.fill();
  }
  return { top, s };
}
function pathX(path, y) { // interpolate centre-line x for a screen y (path sorted by y descending)
  for (let i = 0; i < path.length - 1; i++) { const [y0, x0] = path[i], [y1, x1] = path[i + 1]; if (y <= y0 && y >= y1) return lerp(x0, x1, (y0 - y) / (y0 - y1)); }
  return path[path.length - 1][1];
}
// front-view car coming TOWARD the camera on a perspective road. tyres (x ranges in sprite px) get rolling tread
const FRONT_TYRES = [[42, 195], [878, 1032]];
function frontCar(g, img, x, gy, wpx, t, distM, o = {}) {
  const s = wpx / img.width, h = img.height * s, top = gy - h;
  const bob = (Math.sin(distM * 2.1) * 0.9 + Math.sin(distM * 5.3 + 1) * 0.5) * (wpx / 700);
  g.drawImage(img, x - wpx / 2, top - bob, wpx, h);
  for (const [a0, a1] of FRONT_TYRES) {                    // tread blocks scroll down as the tyre rolls toward us
    const x0 = x - wpx / 2 + a0 * s, tw = (a1 - a0) * s, y0 = top + 760 * s, th = (img.height - 760) * s;
    g.save(); g.beginPath(); g.rect(x0, y0, tw, th); g.clip();
    const per = 22 * s, off = ((distM / 0.30) * 0.30 * 160 * s) % per;
    g.strokeStyle = 'rgba(10,8,6,0.55)'; g.lineWidth = 6 * s;
    for (let yy = y0 - per + off; yy < y0 + th + per; yy += per) { g.beginPath(); g.moveTo(x0, yy); g.lineTo(x0 + tw, yy); g.stroke(); }
    if (o.chains) { g.strokeStyle = '#d5d8de'; g.lineWidth = 5 * s; for (let yy = y0 - per * 2 + off * 2 % (per * 2); yy < y0 + th + per; yy += per * 2) { g.beginPath(); g.moveTo(x0, yy); g.lineTo(x0 + tw, yy + 10 * s); g.stroke(); } g.strokeStyle = '#3b3d42'; g.lineWidth = 3 * s; g.beginPath(); g.moveTo(x0 + tw / 2, y0); g.lineTo(x0 + tw / 2, y0 + th); g.stroke(); }
    g.restore();
  }
  if (o.dust) for (let i = 0; i < 12; i++) { const ph = (t * 1.4 + i / 12) % 1; g.fillStyle = `rgba(222,196,150,${0.35 * (1 - ph)})`; g.beginPath(); g.arc(x + (hash(i) - 0.5) * wpx * 1.2, gy - ph * wpx * 0.15, (0.05 + ph * 0.2) * wpx, 0, 7); g.fill(); }
  // soft contact shadow only (no black blobs)
  return { top, s };
}
function pathX(path, y) {
  for (let i = 0; i < path.length - 1; i++) { const [y0, x0] = path[i], [y1, x1] = path[i + 1]; if (y <= y0 && y >= y1) return lerp(x0, x1, (y0 - y) / (y0 - y1)); }
  return path[path.length - 1][1];
}
// K6 20.5–23.7: village dirt road (user photo via Adobe) – green Toros comes down the lane toward us
K.k6 = (g, t) => {
  const lt = t - 20.5;
  photoBg(g, IMG.bg_village1, 1.02 + lt * 0.006);
  const z = Math.max(2.4, 11 - lt * 2.9), y = 1060 + 1930 / z, dist = lt * 2.9;
  const x = pathX([[1920, 650], [1435, 597], [1148, 482], [1060, 413]], y);
  frontCar(g, IMG.front_green, x, y, 0.80 * (y - 1060), t, dist, { dust: true });
  kCaptions(g, t, 1540);
  return dist;
};
// K9 30.1–33.3: snowy mountain road (user photo via Adobe) – red Toros with chains comes out of the bend toward us
K.k9 = (g, t) => {
  const lt = t - 30.1;
  photoBg(g, IMG.bg_snow, 1.05 + lt * 0.006);
  const z = Math.max(2.3, 10 - lt * 2.4), y = 1000 + 1800 / z, dist = lt * 2.4;
  const x = pathX([[1920, 540], [1493, 545], [1263, 620], [1102, 637], [1000, 600]], y);
  frontCar(g, IMG.front_red, x, y, 0.66 * (y - 1000), t, dist, { chains: true });
  for (let i = 0; i < 220; i++) {
    const depth = 0.4 + hash(i) * 1.4, sp = 80 * depth;
    const xx = ((hash(i + 1) * W * 1.4 - lt * sp * 1.1) % (W * 1.2) + W * 1.2) % (W * 1.2) - 60;
    const yy = (hash(i + 2) * H + lt * sp * 2.4) % H;
    g.fillStyle = `rgba(255,255,255,${0.5 + 0.45 * hash(i + 3)})`; g.beginPath(); g.arc(xx, yy, 1.5 + depth * 3.2, 0, 7); g.fill();
  }
  kCaptions(g, t, 1540);
  return dist;
};
// K11 36.5–39.5: driver's seat (user photo) – heavy, unassisted steering: camera roll + jolts
K.k11 = (g, t) => {
  const lt = t - 36.5;
  const effort = Math.sin(lt * 2.1), jolt = Math.sin(lt * 47) * 4 * Math.abs(effort);
  photoBg(g, IMG.bg_crank, 1.75 + lt * 0.015, 185 + jolt, 305, effort * 0.025);
  const ef = Math.abs(effort);
  txt(g, 'ZORLA DÖNER!', W / 2, 360, { size: 74, font: 'IBlackI', fill: '#fff', stroke: '#111', sw: 14, alpha: seg(lt, 0.3, 0.6) * (0.55 + 0.45 * ef), rot: -0.06 });
  kCaptions(g, t, 1540);
};
// K12 39.5–42.5: crank window (user photo). Glass starts CLOSED, the crank turns and the glass slides down
// until it sits exactly where it is in the user's photo (then the photo itself takes over).
const GLASS_EDGE = [[0, 588], [100, 600], [200, 620], [300, 655], [380, 700], [420, 750], [460, 810], [500, 890], [540, 970], [568, 1028]];
const WINDOW_OPEN = [[0, 0], [170, 0], [330, 200], [450, 400], [540, 600], [588, 800], [604, 1006], [0, 1112]];
const GLASS_DROP = 720;                                   // px the glass travels (closed -> photo position)
K.k12 = (g, t) => {
  const lt = t - 39.5;
  const k = smooth(seg(lt, 0.25, 2.55));                  // 0 = closed, 1 = photo position
  const z = 1.0 + lt * 0.015;
  g.save(); g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-W / 2, -H / 2);
  g.drawImage(k > 0 && k < 1 ? IMG.bg_crank_nh : (k <= 0 ? IMG.bg_crank_ng : IMG.bg_crank), 0, 0, W, H);
  if (k < 1) {
    const dy = -(1 - k) * GLASS_DROP;
    g.save();
    g.beginPath(); WINDOW_OPEN.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.clip();
    g.translate(0, dy);
    // glass body = everything below/left of the edge curve
    g.beginPath(); g.moveTo(-10, 2200); GLASS_EDGE.forEach(([x, y]) => g.lineTo(x, y)); g.lineTo(568, 2200); g.closePath();
    g.fillStyle = 'rgba(205,215,220,0.26)'; g.fill();
    g.save(); g.clip();
    g.fillStyle = 'rgba(255,255,255,0.16)';
    for (const [x0, w0] of [[40, 70], [150, 28], [300, 90]]) { g.beginPath(); g.moveTo(x0, 560); g.lineTo(x0 + w0, 560); g.lineTo(x0 + w0 - 260, 1300); g.lineTo(x0 - 260, 1300); g.closePath(); g.fill(); }
    g.restore();
    // edge: bright bevel + thin dark line (like the photo's)
    g.beginPath(); GLASS_EDGE.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y));
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = 'rgba(70,70,70,0.55)'; g.lineWidth = 5; g.stroke();
    g.strokeStyle = 'rgba(245,248,250,0.85)'; g.lineWidth = 2.5; g.stroke();
    g.restore();
  }
  g.restore();
  // CRANK TURNS (3 full turns = glass travel). Arm rotates about the hub; the hand follows the knob,
  // forearm pivots from an off-screen shoulder. After 3 turns everything is back in the photo's pose.
  if (k > 0 && k < 1) {
    const P = [590, 1262], G0 = [505, 1335];
    const th = k * 3 * Math.PI * 2;                       // clockwise on screen
    const vx = G0[0] - P[0], vy = G0[1] - P[1];
    const G = [P[0] + vx * Math.cos(th) - vy * Math.sin(th), P[1] + vx * Math.sin(th) + vy * Math.cos(th)];
    g.save(); g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-W / 2, -H / 2);
    // crank: hub + metal arm + knob
    g.lineCap = 'round';
    g.strokeStyle = '#2a2622'; g.lineWidth = 34; g.beginPath(); g.moveTo(P[0], P[1]); g.lineTo(G[0], G[1]); g.stroke();
    g.strokeStyle = '#8d8a85'; g.lineWidth = 24; g.stroke();
    g.strokeStyle = 'rgba(235,232,225,0.8)'; g.lineWidth = 6; g.beginPath(); g.moveTo(P[0] - 5, P[1] - 5); g.lineTo(G[0] - 5, G[1] - 5); g.stroke();
    g.fillStyle = '#1e1c1a'; g.beginPath(); g.arc(P[0], P[1], 30, 0, 7); g.fill();
    g.fillStyle = '#4a4744'; g.beginPath(); g.arc(P[0] - 6, P[1] - 6, 12, 0, 7); g.fill();
    g.fillStyle = '#1e1c1a'; g.beginPath(); g.arc(G[0], G[1], 22, 0, 7); g.fill();
    // hand + forearm layer
    // hand follows the knob around the circle; the wrist rocks slightly with the turn
    g.translate(G[0], G[1]); g.rotate(Math.sin(th) * 0.07); g.translate(-G0[0], -G0[1]);
    g.drawImage(IMG.hand_crank, -500, 0, W + 500, H + 500);
    g.restore();
  }
  const px = 590, py = 1262;
  // turning arrow
  const ar = k * 3 * Math.PI * 2;
  g.save(); g.globalAlpha = seg(lt, 0.2, 0.4) * (1 - seg(lt, 2.5, 2.8)); g.strokeStyle = '#ffd84a'; g.lineWidth = 12; g.lineCap = 'round';
  g.beginPath(); g.arc(px, py, 190, ar - 1.3, ar - 0.2); g.stroke();
  const ae = ar - 0.2; g.fillStyle = '#ffd84a'; g.beginPath(); g.moveTo(px + Math.cos(ae) * 190 + Math.cos(ae + 1.57) * 30, py + Math.sin(ae) * 190 + Math.sin(ae + 1.57) * 30); g.lineTo(px + Math.cos(ae) * 165, py + Math.sin(ae) * 165); g.lineTo(px + Math.cos(ae) * 215, py + Math.sin(ae) * 215); g.closePath(); g.fill();
  g.restore();
  bigWord(g, 'KLİMA YOK', t, 39.55, 41.0, 300, { size: 104, fill: '#ff5a4a' });
  kCaptions(g, t, 1640);
};
// K13 42.5–45.5: village house (user photo) – Toros parked out front, starts up at the end
K.k13 = (g, t) => {
  const lt = t - 42.5;
  photoBg(g, IMG.bg_village2, 1.02 + lt * 0.008);
  const im = IMG.front, wpx = 600, s = wpx / im.width, h = im.height * s, gy = 1800, x = 650;
  const start = lt > 2.3, shake = start ? Math.sin(lt * 70) * 2 * Math.exp(-(lt - 2.3) * 3) : 0;
  g.drawImage(im, x - wpx / 2 + shake, gy - h, wpx, h);
  if (start) { // headlights on + exhaust
    for (const hx of [-0.36, -0.24, 0.24, 0.36]) {
      const gl = g.createRadialGradient(x + hx * wpx, gy - h * 0.43, 0, x + hx * wpx, gy - h * 0.43, 90);
      gl.addColorStop(0, 'rgba(255,250,215,0.9)'); gl.addColorStop(1, 'rgba(255,250,215,0)'); g.fillStyle = gl; g.beginPath(); g.arc(x + hx * wpx, gy - h * 0.43, 90, 0, 7); g.fill();
    }
    txt(g, 'VINNN!', 820, 1030, { size: 70, font: 'IBlackI', fill: '#ffd84a', stroke: '#111', sw: 12, alpha: seg(lt, 2.3, 2.5), rot: -0.1 });
  }
  if (lt > 1.0 && lt < 2.2) txt(g, 'TIK TIK', 860, 1480, { size: 50, font: 'IBlackI', fill: '#fff', stroke: '#111', sw: 10, alpha: Math.sin(lt * 9) > 0 ? 1 : 0.45, rot: -0.1 });
  kCaptions(g, t, 1250);
};
// K17 54.5–58.5: the family's first car (user illustration) + CTA
K.k17 = (g, t) => {
  const lt = t - 54.5, im = IMG.family;
  // blurred fill behind, sharp picture in the middle (slow push-in)
  g.save(); g.filter = 'blur(26px) brightness(0.55)'; const cs = H / im.height; g.drawImage(im, W / 2 - im.width * cs / 2, 0, im.width * cs, H); g.restore();
  const z = 1 + lt * 0.025, fw = W * z, fh = im.height * fw / im.width;
  g.save(); g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 40; g.drawImage(im, W / 2 - fw / 2, 1010 - fh / 2, fw, fh); g.restore();
  const kq = seg(lt, 1.5, 1.85);
  if (kq > 0) {
    txt(g, 'SENİN BABANIN', W / 2, 470, { size: 100, fill: '#fff', stroke: '#111', sw: 18, scale: 0.6 + 0.4 * easeOutBack(kq), alpha: kq });
    txt(g, 'ARABASI NEYDİ?', W / 2, 590, { size: 112, fill: '#ffd84a', stroke: '#111', sw: 20, scale: 0.6 + 0.4 * easeOutBack(seg(lt, 1.7, 2.05)), alpha: seg(lt, 1.7, 2.0) });
    const ky = seg(lt, 2.4, 2.7), p = 1 + 0.05 * Math.sin(lt * 9);
    if (ky > 0) chip(g, 'YORUMA YAZ ↓', W / 2, 1460, { size: 58, bg: '#e0312b', fill: '#fff', border: '#111', k: p * (0.6 + 0.4 * easeOutBack(ky)), alpha: ky, ls: 3 });
  }
  kCaptions(g, t, 1640);
};

// ------------------------------------------------------------------ master timeline
const KSC = [
  [0, 3.5, 'k1'], [3.5, 10.5, 'k2'], [10.5, 12, 'k3'], [12, 17.5, 'k4'], [17.5, 20.5, 'k5'], [20.5, 23.7, 'k6'], [23.7, 26.9, 'k7'],
  [26.9, 30.1, 'k8'], [30.1, 33.3, 'k9'], [33.3, 36.5, 'k10'], [36.5, 39.5, 'k11'], [39.5, 42.5, 'k12'], [42.5, 45.5, 'k13'],
  [45.5, 48.5, 'k14'], [48.5, 51, 'k15'], [51, 54.5, 'k16'], [54.5, 58.5, 'k17'], [58.5, 59.3, 'loop'],
];
const ROAD = new Set(['k1', 'k4', 'k6', 'k8', 'k9', 'k10', 'k14', 'k15']);
let LOOPBUF = null;
function kRender(t) {
  const g = ctx; g.save(); g.clearRect(0, 0, W, H);
  const sc = KSC.find(s => t >= s[0] && t < s[1]) || KSC[KSC.length - 1];
  let dist = 0;
  if (sc[2] === 'loop') {
    // closing frame dissolves into the opening frame (t=0) through an iris – seamless loop on replay
    K.k17(g, 58.49);
    timeline(g, 58.49, 1 - smooth(seg(t, 58.5, 58.8)));
    if (!LOOPBUF) { LOOPBUF = document.createElement('canvas'); LOOPBUF.width = W; LOOPBUF.height = H; K.k1(LOOPBUF.getContext('2d'), 0, true); }
    const k = smooth(seg(t, 58.5, 59.12));
    g.save(); g.beginPath(); g.arc(W / 2, 1000, k * 1300 + 1, 0, 7); g.clip(); g.drawImage(LOOPBUF, 0, 0); g.restore();
    if (k >= 1) g.drawImage(LOOPBUF, 0, 0);
    finish(g, t, 0.38);
    g.restore(); return;
  }
  window.__PHOTO_SCENE = ['k6', 'k9', 'k11', 'k12', 'k13', 'k17'].includes(sc[2]);
  dist = K[sc[2]](g, t) || 0;
  const odoA = ROAD.has(sc[2]) ? clamp(Math.min(t - sc[0], sc[1] - t) / 0.2, 0, 1) : 0;
  odometer(g, t, dist, odoA);
  timeline(g, t, sc[2] === 'k1' ? 0 : 1);
  finish(g, t, 0.38);
  // cut flash
  for (const s of KSC) { const d = t - s[0]; if (s[0] > 0 && s[2] !== 'loop' && s[2] !== 'k5' && d >= 0 && d < 0.12) { g.fillStyle = `rgba(255,250,235,${0.5 * (1 - d / 0.12)})`; g.fillRect(0, 0, W, H); } }
  g.restore();
}
window.render = kRender;
window.ready2 = kLoad();
window.META_INFO = { W, H, FPS, DUR: KDUR };
