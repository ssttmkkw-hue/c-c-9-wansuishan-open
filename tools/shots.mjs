/**
 * Headless screenshots for 万岁山.
 * Usage: node tools/shots.mjs --round 1
 * Dev server must already be on http://127.0.0.1:5199/
 */
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';

const require = createRequire('/workspace/pwtool/package.json');
const { chromium } = require('playwright');

const round = process.argv.includes('--round') ? process.argv[process.argv.indexOf('--round') + 1] : '1';
const base = process.env.PARK_URL || 'http://127.0.0.1:5199/';
const outDir = '/workspace/wansuishan-shots';

const browser = await chromium.launch({
  args: [
    '--use-gl=swiftshader',
    '--enable-unsafe-swiftshader',
    '--use-angle=swiftshader',
    '--ignore-gpu-blocklist',
  ],
});

const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
page.on('console', (msg) => {
  if (msg.type() !== 'error') return;
  const text = msg.text();
  if (/GPU stall|ReadPixels|swiftshader/i.test(text)) return;
  errors.push(`console: ${text}`);
});

await mkdir(outDir, { recursive: true });
await page.goto(base, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__park && window.__park.ready === true, null, { timeout: 20000 });
await page.evaluate(() => window.__park.setMuted(true));

const shot = async (name) => {
  await page.waitForTimeout(450);
  const file = `${outDir}/c9-r${round}-${name}.png`;
  await page.screenshot({ path: file });
  console.log('wrote', file);
};

const info = async () =>
  page.evaluate(() => ({
    ready: window.__park.ready,
    fps: Math.round(window.__park.fps),
    time: window.__park.time,
    lots: window.__park.lots,
    shows: window.__park.listShows(),
    player: { ...window.__park.player },
    sub: document.querySelector('.zh')?.textContent || '',
  }));

if (round === '1') {
  await page.evaluate(() => window.__park.frame('overview'));
  await shot('overview');

  for (const id of ['stage', 'tea', 'market']) {
    await page.evaluate((lot) => window.__park.watch(lot, 'wide'), id);
    await page.waitForTimeout(700);
    console.log(id, JSON.stringify(await info()));
    await shot(id);
  }

  await page.evaluate(() => window.__park.watch('stage', 'close'));
  await page.waitForTimeout(800);
  await shot('face');

  await page.evaluate(() => {
    window.__park.teleport(0, 0, 24);
    window.__park.face(Math.PI);
  });
  await page.click('canvas');
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(700);
  console.log('walk', JSON.stringify(await info()));
  await shot('walk');
  await page.keyboard.up('KeyW');
}

console.log('errors', errors.length);
for (const e of errors) console.log(e);
await browser.close();
if (errors.length) process.exit(1);
