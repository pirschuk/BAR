// Состояния «Моего бара» (срез 2b): node scripts/shots-bar.mjs [--url http://...]
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const args = process.argv.slice(2);
const ui = args.indexOf('--url');
const base = ui >= 0 ? args.splice(ui, 2)[1] : 'http://127.0.0.1:5173';
const theme = args[0] ?? 'dark';
const prefix = `bar2b-${theme}`;
const root = new URL(base).pathname.endsWith('/') ? new URL(base).pathname : '/';
mkdirSync('.screenshots', { recursive: true });

const QUICK = ['gin', 'white-rum', 'vodka', 'lime', 'lemon', 'simple-syrup', 'soda'];
const browser = await chromium.launch();
const shots = [];
const errors = [];

async function session(inventory, fn) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  await ctx.addInitScript(([t, inv]) => {
    if (inv && !sessionStorage.getItem('seeded')) {
      localStorage.setItem('bar-inventory-v1', JSON.stringify(inv));
      sessionStorage.setItem('seeded', '1');
    }
  }, [theme, inventory]);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  const go = (path) => page.goto(new URL(root + path.replace(/^\//, ''), base).href, { waitUntil: 'networkidle' });
  const shot = async (name, opts = {}) => {
    await page.waitForTimeout(250);
    const path = `.screenshots/${prefix}-${name}.png`;
    await page.screenshot({ path, ...opts });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > 390);
    shots.push(path + (overflow ? '  ⚠ горизонтальный скролл' : ''));
  };
  await fn(page, go, shot);
  await ctx.close();
}

await session(null, async (page, go, shot) => {
  await go('/bar');
  await shot('1-empty');
  await go('/cocktail/negroni');
  await shot('2-recipe-empty-bar');
  await go('/bar');
  await page.getByRole('button', { name: /Быстрый старт/ }).click();
  await shot('3-after-quick-start');
  await shot('4-bar-full', { fullPage: true });
  await page.getByRole('searchbox').fill('верм');
  await shot('5-bar-search');
});

await session([...QUICK, 'campari', 'tool-barspoon'], async (page, go, shot) => {
  await go('/');
  await shot('6-catalog-marks');
  await page.getByRole('button', { name: /^Фильтры/ }).click();
  await page.getByRole('checkbox', { name: /Могу сделать/ }).click();
  await shot('7-filter-can');
  await page.getByRole('button', { name: /^Показать/ }).click();
  await shot('8-catalog-can');
  await go('/cocktail/negroni');
  await shot('9-recipe-missing', { fullPage: true });
  await go('/cocktail/daiquiri');
  await shot('10-recipe-all', { fullPage: true });
});

console.log(shots.join('\n'));
if (errors.length) console.log('Ошибки в консоли:\n' + errors.map((e) => '  ' + e).join('\n'));
await browser.close();
