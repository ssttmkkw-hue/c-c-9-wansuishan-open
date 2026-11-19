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

if (round === '3') {
  await page.goto(`${base}?diag=1`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__park && window.__park.ready === true, null, { timeout: 20000 });
  await page.evaluate(() => window.__park.setMuted(true));
  await page.evaluate(() => {
    window.__park.setTime(17.5 * 3600);
    window.__park.frame('overview');
  });
  await page.waitForTimeout(2500);
  const perf = await page.evaluate(() => ({
    fps: Math.round(window.__park.fps),
    draws: window.__park.draws,
    tris: window.__park.tris,
    quality: window.__park.quality,
    lod: window.__park.lod,
    shows: window.__park.listShows().length,
  }));
  console.log('perf', JSON.stringify(perf));
  await shot('overview');
  await shot('diag');

  for (const id of ['stage', 'shadow']) {
    await page.evaluate((lot) => window.__park.watch(lot, 'wide'), id);
    await page.waitForTimeout(700);
    console.log(id, JSON.stringify(await info()));
    await shot(id);
  }

  const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const phoneErrors = [];
  phone.on('pageerror', (err) => phoneErrors.push(`pageerror: ${err.message}`));
  phone.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (/GPU stall|ReadPixels|swiftshader/i.test(text)) return;
    phoneErrors.push(`console: ${text}`);
  });
  await phone.goto(base, { waitUntil: 'domcontentloaded' });
  await phone.waitForFunction(() => window.__park && window.__park.ready === true, null, { timeout: 20000 });
  await phone.evaluate(() => window.__park.setMuted(true));
  await phone.waitForTimeout(400);
  const before = await phone.evaluate(() => ({ ...window.__park.player }));
  const stick = await phone.locator('#stick').boundingBox();
  if (!stick) phoneErrors.push('joystick missing');
  else {
    const cx = stick.x + stick.width / 2;
    const cy = stick.y + stick.height / 2;
    await phone.mouse.move(cx, cy);
    await phone.mouse.down();
    await phone.mouse.move(cx, cy - 36);
    await phone.waitForTimeout(500);
    await phone.mouse.up();
  }
  const after = await phone.evaluate(() => ({ ...window.__park.player }));
  console.log('mobile move', JSON.stringify({ before, after }));
  if (Math.hypot(after.x - before.x, after.z - before.z) < 0.2) phoneErrors.push('joystick did not move the player');
  const canvas = await phone.locator('canvas').first().boundingBox();
  if (canvas) {
    await phone.mouse.move(canvas.x + canvas.width * 0.72, canvas.y + canvas.height * 0.4);
    await phone.mouse.down();
    await phone.mouse.move(canvas.x + canvas.width * 0.72 + 48, canvas.y + canvas.height * 0.4 + 10);
    await phone.mouse.up();
  }
  await phone.evaluate(() => window.__park.watch('market', 'wide'));
  await phone.waitForTimeout(800);
  const mobileFile = `${outDir}/c9-r3-mobile.png`;
  await phone.screenshot({ path: mobileFile });
  console.log('wrote', mobileFile);
  errors.push(...phoneErrors);
  await phone.close();
}

if (round === '2') {
  await page.evaluate(() => {
    window.__park.setTime(1680);
    window.__park.watch('market', 'close');
  });
  await page.waitForTimeout(900);
  const face = await page.evaluate(() => {
    const insp = window.__park.inspect();
    const fx = insp.cam[0] - insp.look[0];
    const fy = insp.cam[1] - insp.look[1];
    const fz = insp.cam[2] - insp.look[2];
    const fl = Math.hypot(fx, fz) || 1;
    return {
      insp,
      dot: (fx / fl) * insp.face[0] + (fz / fl) * insp.face[2],
      dist: Math.hypot(fx, fy, fz),
      sub: document.querySelector('.zh')?.textContent || '',
    };
  });
  console.log('face', JSON.stringify(face));
  if (face.dot < 0.55) errors.push(`face camera not in front dot=${face.dot.toFixed(3)}`);
  if (face.dist < 0.85 || face.dist > 3.2) errors.push(`face camera distance ${face.dist.toFixed(2)}`);
  if (!face.sub) errors.push('face shot has no subtitle');
  await shot('face');

  for (const id of ['shadow', 'field']) {
    await page.evaluate((lot) => window.__park.watch(lot, 'wide'), id);
    await page.waitForTimeout(800);
    console.log(id, JSON.stringify(await info()));
    await shot(id);
  }

  await page.evaluate(() => {
    window.__park.setTime(600);
    window.__park.watch('stage', 'wide');
  });
  await page.waitForTimeout(1000);
  console.log('crowd', JSON.stringify(await info()));
  await shot('crowd');

  await page.evaluate(() => {
    window.__park.setTime(11 * 3600 + 12 * 60);
    window.__park.watch('parade', 'wide');
  });
  await page.waitForTimeout(1200);
  const paradeInfo = await info();
  console.log('parade', JSON.stringify(paradeInfo));
  if (!paradeInfo.shows.some((s) => s.lotId === 'parade')) errors.push('parade missing from listShows');
  await shot('parade');
}

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
