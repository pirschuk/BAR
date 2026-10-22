#!/usr/bin/env node
// Скриншот роута в мобильном вьюпорте 390×844 @2x → .screenshots/<имя>.png
// Использование: node scripts/screenshot.mjs <роут> [имя] [--full] [--theme light|dark] [--url http://...]
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  // Глобальный Playwright облачного окружения (Chromium в /opt/pw-browsers).
  ({ chromium } = require('/opt/node22/lib/node_modules/playwright'));
}

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  if (i === -1) return undefined;
  const value = args[i + 1];
  args.splice(i, 2);
  return value;
};
const full = args.includes('--full');
if (full) args.splice(args.indexOf('--full'), 1);
const theme = flag('--theme');
const base = flag('--url') ?? 'http://127.0.0.1:5173';

const route = args[0] ?? '/';
const name = args[1] ?? (route.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home');
const stamp = new Date().toISOString().slice(11, 19).replace(/:/g, '');
const out = `.screenshots/${name}-${stamp}.png`;

mkdirSync('.screenshots', { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  colorScheme: theme === 'light' ? 'light' : 'dark',
  reducedMotion: 'reduce',
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

await page.goto(new URL(route, base).href, { waitUntil: 'networkidle' });
if (theme) await page.evaluate((t) => (document.documentElement.dataset.theme = t), theme);
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);

const overflowX = await page.evaluate(() => document.documentElement.scrollWidth > 390);
await page.screenshot({ path: out, fullPage: full });
await browser.close();

console.log(out);
if (overflowX) console.log('ВНИМАНИЕ: горизонтальный скролл — контент шире 390px');
if (errors.length) console.log('Ошибки в консоли:\n' + errors.map((e) => '  ' + e).join('\n'));
