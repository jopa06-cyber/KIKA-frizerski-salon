/**
 * screenshot-crop.mjs — viewport crop of a specific page section
 * Usage: node screenshot-crop.mjs <url> <scrollY> <clipHeight> <label>
 */
import { spawn }         from 'child_process';
import { createServer }  from 'net';
import http              from 'http';
import fs                from 'fs';
import path              from 'path';
import { fileURLToPath } from 'url';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const CHROME     = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT_DIR    = path.join(__dirname, 'temporary screenshots');
const TARGET_URL = process.argv[2] || 'http://localhost:3000';
const CLIP_Y     = parseInt(process.argv[3] ?? '0');
const CLIP_H     = parseInt(process.argv[4] ?? '900');
const LABEL      = process.argv[5] || 'crop';

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
let n = 1;
const fn = () => `screenshot-${n}-${LABEL}.png`;
while (fs.existsSync(path.join(OUT_DIR, fn()))) n++;
const OUT_FILE = path.join(OUT_DIR, fn());

function freePort() {
  return new Promise((res, rej) => {
    const s = createServer().listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }).on('error', rej);
  });
}
function getJSON(port, p) {
  return new Promise((res, rej) => { http.get({ hostname: '127.0.0.1', port, path: p }, r => { let b=''; r.on('data',d=>b+=d); r.on('end',()=>res(JSON.parse(b))); }).on('error',rej); });
}
function cdpCmd(ws, method, params = {}) {
  return new Promise((res, rej) => {
    const id = Math.floor(Math.random() * 1e9);
    const h = e => { const m = JSON.parse(e.data); if (m.id === id) { ws.removeEventListener('message', h); m.error ? rej(new Error(m.error.message)) : res(m.result); }};
    ws.addEventListener('message', h);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

const debugPort = await freePort();
const chrome = spawn(CHROME, [
  `--remote-debugging-port=${debugPort}`, '--headless=new', '--no-first-run',
  '--no-default-browser-check', '--disable-extensions', '--disable-gpu',
  '--window-size=1440,900', 'about:blank',
], { stdio: 'ignore' });

await new Promise(r => setTimeout(r, 1500));

try {
  const targets = await getJSON(debugPort, '/json');
  const target  = targets.find(t => t.type === 'page') ?? targets[0];
  const ws = new WebSocket(target.webSocketDebuggerUrl.replace('localhost', '127.0.0.1'));
  await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });

  await cdpCmd(ws, 'Page.enable');
  await cdpCmd(ws, 'Page.navigate', { url: TARGET_URL });
  await new Promise(r => setTimeout(r, 3500)); // wait for full load + fonts

  // keep viewport at 900px so vh units stay correct; captureBeyondViewport handles the rest
  await cdpCmd(ws, 'Emulation.setDeviceMetricsOverride', {
    width: 1440, height: 900, deviceScaleFactor: 1, mobile: false,
  });
  await new Promise(r => setTimeout(r, 300));

  // clip to the requested section
  const { data } = await cdpCmd(ws, 'Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
    clip: { x: 0, y: CLIP_Y, width: 1440, height: CLIP_H, scale: 1 },
  });

  fs.writeFileSync(OUT_FILE, Buffer.from(data, 'base64'));
  ws.close();
  console.log(`Saved → temporary screenshots/${fn()}`);
} finally { chrome.kill(); }
