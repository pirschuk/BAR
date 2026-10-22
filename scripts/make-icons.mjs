// Иконки PWA из public/favicon.svg: node scripts/make-icons.mjs
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const svg = readFileSync('public/favicon.svg', 'utf8');
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, size, pad] of [['icon-192', 192, 0], ['icon-512', 512, 0], ['apple-touch-icon', 180, 0], ['icon-maskable-512', 512, 0.1]]) {
  await page.setViewportSize({ width: size, height: size });
  // maskable: фон до краёв, символ в безопасной зоне
  const inner = pad ? svg.replace('rx="26"', 'rx="0"').replace('<path', `<g transform="translate(${60 * pad * 4} ${60 * pad * 4}) scale(${1 - pad * 4})"><path`).replace('</svg>', '</g></svg>') : svg.replace('rx="26"', 'rx="0"');
  await page.setContent(`<body style="margin:0">${inner.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body>`);
  await page.screenshot({ path: `public/icons/${name}.png`, omitBackground: true });
}
await browser.close();
console.log('ok');
