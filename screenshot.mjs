/**
 * screenshot.mjs
 * Full-page screenshot via Chrome DevTools Protocol.
 * Requires: Node.js v22+ (built-in WebSocket) + Google Chrome installed.
 *
 * Usage:
 *   node screenshot.mjs [url] [label]
 *   node screenshot.mjs http://localhost:3000
 *   node screenshot.mjs http://localhost:3000 hero
 */

import { spawn }      from 'child_process';
import { createServer } from 'net';
import http            from 'http';
import fs              from 'fs';
import path            from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CHROME     = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT_DIR    = path.join(__dirname, 'temporary screenshots');
const TARGET_URL = process.argv[2] || 'http://localhost:3000';
const LABEL      = process.argv[3] || '';

// ── output filename (auto-incremented, never overwrites) ──────────────────
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
let n = 1;
const filename = () => LABEL ? `screenshot-${n}-${LABEL}.png` : `screenshot-${n}.png`;
while (fs.existsSync(path.join(OUT_DIR, filename()))) n++;
const OUT_FILE = path.join(OUT_DIR, filename());

// ── find a free TCP port ──────────────────────────────────────────────────
function freePort() {
  return new Promise((res, rej) => {
    const s = createServer().listen(0, '127.0.0.1', () => {
      const p = s.address().port;
      s.close(() => res(p));
    }).on('error', rej);
  });
}

// ── HTTP GET → JSON ───────────────────────────────────────────────────────
function getJSON(port, urlPath) {
  return new Promise((res, rej) => {
    http.get({ hostname: '127.0.0.1', port, path: urlPath }, r => {
      let b = '';
      r.on('data', d => b += d);
      r.on('end', () => res(JSON.parse(b)));
    }).on('error', rej);
  });
}

// ── send a CDP command and wait for its response ──────────────────────────
function cdpCmd(ws, method, params = {}) {
  return new Promise((res, rej) => {
    const id = Math.floor(Math.random() * 1e9);
    const handler = event => {
      const msg = JSON.parse(event.data);
      if (msg.id === id) {
        ws.removeEventListener('message', handler);
        if (msg.error) rej(new Error(msg.error.message));
        else res(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

// ── wait for a CDP event ──────────────────────────────────────────────────
function cdpEvent(ws, eventName) {
  return new Promise(res => {
    const handler = event => {
      const msg = JSON.parse(event.data);
      if (msg.method === eventName) {
        ws.removeEventListener('message', handler);
        res(msg.params);
      }
    };
    ws.addEventListener('message', handler);
  });
}

// ── main ──────────────────────────────────────────────────────────────────
const debugPort = await freePort();

console.log(`Launching Chrome (headless) on port ${debugPort}…`);
const chrome = spawn(CHROME, [
  `--remote-debugging-port=${debugPort}`,
  '--headless=new',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-extensions',
  '--disable-gpu',
  '--window-size=1440,900',
  'about:blank',
], { stdio: 'ignore' });

// give Chrome time to start its debug server
await new Promise(r => setTimeout(r, 1500));

try {
  // get the debugger WebSocket URL for the first page tab
  const targets = await getJSON(debugPort, '/json');
  const target  = targets.find(t => t.type === 'page') ?? targets[0];
  if (!target) throw new Error('No Chrome tab found');
  const wsUrl = target.webSocketDebuggerUrl.replace('localhost', '127.0.0.1');

  // connect via Node's built-in WebSocket (v22+)
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => {
    ws.addEventListener('open',  res);
    ws.addEventListener('error', rej);
  });

  // enable Page domain and navigate
  await cdpCmd(ws, 'Page.enable');
  const navDone = cdpEvent(ws, 'Page.loadEventFired');
  await cdpCmd(ws, 'Page.navigate', { url: TARGET_URL });
  await Promise.race([navDone, new Promise(r => setTimeout(r, 8000))]);
  await new Promise(r => setTimeout(r, 800)); // let animations settle

  // fix viewport at 1440×900 so vh units stay correct
  await cdpCmd(ws, 'Emulation.setDeviceMetricsOverride', {
    width:             1440,
    height:            900,
    deviceScaleFactor: 1,
    mobile:            false,
  });

  // capture PNG
  const { data } = await cdpCmd(ws, 'Page.captureScreenshot', {
    format:                'png',
    captureBeyondViewport: true,
    fromSurface:           true,
  });

  fs.writeFileSync(OUT_FILE, Buffer.from(data, 'base64'));
  ws.close();
  console.log(`Screenshot saved → temporary screenshots/${filename()}`);
} finally {
  chrome.kill();
}
