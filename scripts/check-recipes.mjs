#!/usr/bin/env node
// Проверка страницы рецепта на всех коктейлях (390×844, тёмная тема):
//  1) значения плиток параметров — в одну строку, без обрезки;
//  2) нет горизонтального скролла;
//  3) название на обложке — не больше 2 строк;
//  4) контраст текста fg / fg-2 на тинте напитка ≥ 4.5.
// Использование: node scripts/check-recipes.mjs [--url http://127.0.0.1:5173]
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  ({ chromium } = require('/opt/node22/lib/node_modules/playwright'));
}
const i = process.argv.indexOf('--url');
const base = i > -1 ? process.argv[i + 1] : 'http://127.0.0.1:5173';
const cocktails = JSON.parse(readFileSync(new URL('../src/data/cocktails.json', import.meta.url)));

// --- контраст: тинт = color-mix(cover.to 45%, --bg) в sRGB, как в utility recipe-tint ---
const hex = (h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16));
const lin = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const css = readFileSync(new URL('../src/styles/index.css', import.meta.url), 'utf8');
const token = (name) => hex(css.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, 'i'))[1]);
const [BG, FG, FG2] = [token('bg'), token('text'), token('text-2')];
const mix = Number(css.match(/--tint-top: color-mix\(in srgb, var\(--cover-to\) (\d+)%/)[1]) / 100;

const problems = [];
for (const c of cocktails) {
  const to = hex(c.cover.to);
  const tint = to.map((v, k) => v * mix + BG[k] * (1 - mix));
  for (const [name, color] of [['fg', FG], ['fg-2', FG2]]) {
    const r = ratio(color, tint);
    if (r < 4.5) problems.push(`${c.id}: контраст ${name} на тинте ${r.toFixed(2)} < 4.5`);
  }
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, colorScheme: 'dark' });
for (const c of cocktails) {
  await page.goto(`${base}/cocktail/${c.id}`);
  await page.waitForSelector('[data-param-value]');
  await page.evaluate(() => document.fonts.ready);
  const r = await page.evaluate(() => {
    const out = [];
    for (const dd of document.querySelectorAll('[data-param-value]')) {
      const tile = dd.parentElement.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(dd);
      const text = range.getBoundingClientRect();
      if (text.right > tile.right - 12 || range.getClientRects().length > 1) out.push(`значение «${dd.textContent}» не помещается`);
    }
    if (document.documentElement.scrollWidth > innerWidth) out.push(`горизонтальный скролл ${document.documentElement.scrollWidth}px`);
    const h1 = document.querySelector('h1');
    const lines = Math.round(h1.getBoundingClientRect().height / parseFloat(getComputedStyle(h1).lineHeight));
    if (lines > 2 || h1.scrollHeight > h1.clientHeight + 1) out.push(`название в ${lines} строк(и)`);
    return out;
  });
  problems.push(...r.map((p) => `${c.id}: ${p}`));
}
await browser.close();

if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`\n✗ ${problems.length} проблем(ы) на ${cocktails.length} рецептах`);
  process.exit(1);
}
console.log(`✓ ${cocktails.length} рецептов: параметры в одну строку, без горизонтального скролла, название ≤ 2 строк, контраст fg/fg-2 на тинте ≥ 4.5`);
