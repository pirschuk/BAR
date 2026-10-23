// Состояния каталога (срез 2a) одним прогоном: node scripts/shots-catalog.mjs [префикс] [--url http://...]
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const args = process.argv.slice(2);
const ui = args.indexOf('--url');
const base = ui >= 0 ? args.splice(ui, 2)[1] : 'http://127.0.0.1:5173';
const theme = args[0] ?? 'dark';
const prefix = args[1] ?? `cat2a-${theme}`;
mkdirSync('.screenshots', { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
const shots = [];
const shot = async (name, opts = {}) => {
  await page.waitForTimeout(250);
  const path = `.screenshots/${prefix}-${name}.png`;
  await page.screenshot({ path, ...opts });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > 390);
  shots.push(path + (overflow ? '  ⚠ горизонтальный скролл' : ''));
};
const go = (path) => page.goto(new URL(path, base).href, { waitUntil: 'networkidle' });
const root = new URL(base).pathname.endsWith('/') ? new URL(base).pathname : '/';

await go(root);
await shot('1-default');
await page.mouse.wheel(0, 700);
await shot('2-scrolled-sticky');

await go(root);
await page.getByRole('searchbox').click();
await shot('3-search-focus');
await page.getByRole('searchbox').fill('камп');
await page.keyboard.press('Enter');
await shot('4-search-query');
await page.getByRole('button', { name: /Ингредиент: Кампари/ }).click();
await shot('5-ingredient-filter');

await go(root);
await page.getByRole('button', { name: /^Вкус:/ }).click();
await page.getByRole('button', { name: 'Кислый' }).click();
await shot('6-facet-sheet');
await page.getByRole('button', { name: /^Показать/ }).click();
await shot('7-facet-applied');

await page.getByRole('button', { name: /^Фильтры/ }).click();
await shot('8-filter-sheet');
await page.getByRole('button', { name: 'Безалкогольные' }).click();
await page.getByRole('button', { name: 'Крепкий' }).click();
await shot('9-filter-sheet-zero');
await page.getByRole('button', { name: 'Закрыть' }).first().click();

await go(`${root}?q=zzz&base=rum`);
await shot('10-empty', { fullPage: true });

console.log(shots.join('\n'));
if (errors.length) console.log('Ошибки в консоли:\n' + errors.map((e) => '  ' + e).join('\n'));
await browser.close();
