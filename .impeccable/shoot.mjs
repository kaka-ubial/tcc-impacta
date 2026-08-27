// Screenshot rig: headless Chrome + CDP (no extra deps, Node 22 WebSocket).
// Logs in as a seeded donor, captures /doacoes on desktop and mobile.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';

const APP = 'http://127.0.0.1:8899';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9222;
const OUT = '.impeccable/review';
const EMAIL = process.argv[2] || 'doador4@impacta.test';
const PASS = process.argv[3] || 'senha_segura';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

mkdirSync(OUT, { recursive: true });

const chrome = spawn(CHROME, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--user-data-dir=/tmp/impeccable-chrome-profile',
    '--no-first-run',
    '--window-size=1440,900',
    '--hide-scrollbars',
    'about:blank',
], { stdio: 'ignore' });

process.on('exit', () => chrome.kill());

async function waitForDebugger() {
    for (let i = 0; i < 50; i++) {
        try {
            const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
            const targets = await res.json();
            const page = targets.find((t) => t.type === 'page');
            if (page) return page.webSocketDebuggerUrl;
        } catch { /* not up yet */ }
        await sleep(200);
    }
    throw new Error('chrome debugger never came up');
}

const wsUrl = await waitForDebugger();
const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

let seq = 0;
const pending = new Map();
const events = [];
ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.id && pending.has(data.id)) {
        pending.get(data.id)(data);
        pending.delete(data.id);
    } else if (data.method) {
        events.push(data.method);
    }
};

function cdp(method, params = {}) {
    const id = ++seq;
    ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve) => pending.set(id, resolve));
}

async function evaluate(expression) {
    const res = await cdp('Runtime.evaluate', { expression, returnByValue: true });
    return res.result?.result?.value;
}

async function waitForLoad(timeout = 10000) {
    const start = Date.now();
    const seen = events.length;
    while (Date.now() - start < timeout) {
        if (events.slice(seen).includes('Page.loadEventFired')) return;
        await sleep(100);
    }
}

await cdp('Page.enable');
await cdp('Runtime.enable');

// 1. login
await cdp('Page.navigate', { url: `${APP}/login` });
await waitForLoad();
await sleep(800);

const filled = await evaluate(`(() => {
    const email = document.querySelector('input[type=email], input[name=email]');
    const pass = document.querySelector('input[type=password]');
    if (!email || !pass) return 'no-inputs';
    const setVal = (el, v) => {
        const setter = Object.getOwnPropertyDescriptor(el.constructor.prototype, 'value').set;
        setter.call(el, v);
        el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    setVal(email, ${JSON.stringify(EMAIL)});
    setVal(pass, ${JSON.stringify(PASS)});
    const btn = document.querySelector('button[type=submit]');
    btn.click();
    return 'submitted';
})()`);
console.log('login:', filled);
await sleep(3000);
console.log('after login url:', await evaluate('location.href'));

// 2. desktop capture
await cdp('Page.navigate', { url: `${APP}/doacoes` });
await waitForLoad();
await sleep(2500); // let entrance motion settle

let shot = await cdp('Page.captureScreenshot', { format: 'png' });
writeFileSync(`${OUT}/desktop.png`, Buffer.from(shot.result.data, 'base64'));
console.log('desktop.png saved');

// 3. mobile capture
await cdp('Emulation.setDeviceMetricsOverride', {
    width: 390, height: 844, deviceScaleFactor: 2, mobile: true,
});
await cdp('Page.navigate', { url: `${APP}/doacoes` });
await waitForLoad();
await sleep(2500);

shot = await cdp('Page.captureScreenshot', { format: 'png' });
writeFileSync(`${OUT}/mobile.png`, Buffer.from(shot.result.data, 'base64'));
console.log('mobile.png saved');

ws.close();
chrome.kill();
process.exit(0);
