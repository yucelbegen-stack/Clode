// usage: node drive.js preview out_dir t1 t2 ...   |  node drive.js video out.mp4 startFrame endFrame
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
(async () => {
  const [mode, out, ...rest] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('console', m => console.log('[page]', m.text()));
  page.on('pageerror', e => { console.error('[pageerror]', e.message); process.exitCode = 2; });
  await page.goto('http://127.0.0.1:8765/render/' + (process.env.PAGE || 'index.html'));
  await page.evaluate(() => window.ready3 || window.ready2 || window.ready);
  const grab = async (t, q) => {
    const b64 = await page.evaluate(([t, q]) => { window.render(t); return document.getElementById('c').toDataURL(q ? 'image/jpeg' : 'image/png', q || undefined).split(',')[1]; }, [t, q]);
    return Buffer.from(b64, 'base64');
  };
  if (mode === 'preview') {
    fs.mkdirSync(out, { recursive: true });
    for (const ts of rest) fs.writeFileSync(`${out}/t${(+ts).toFixed(2)}.png`, await grab(+ts, 0));
  } else {
    const FPS = 60; const f0 = +rest[0], f1 = +rest[1];
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', String(FPS), out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const t0 = Date.now();
    for (let f = f0; f < f1; f++) {
      const buf = await grab(f / FPS, 0.95);
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if ((f - f0) % 300 === 0) console.log(`frame ${f} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
  }
  await browser.close();
})();
