// Scenes rebuilt on the user's GPT-generated art (Toros illustration style). Cars are our sprites, wheels rolling.
'use strict';
async function gptLoad() {
  await window.ready3;
  const L = [];
  for (const n of ['g_goat', 'g_hen_brown', 'g_hen_white', 'g_hen_black', 'g_factory_in', 'g_factory_yard']) L.push(loadImg(n, `../assets/sprites/${n}.png`));
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
window.ready6 = gptLoad();
