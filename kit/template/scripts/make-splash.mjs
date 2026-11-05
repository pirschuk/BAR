// Заставки запуска iPhone (apple-touch-startup-image) из public/favicon.svg: node scripts/make-splash.mjs
// Без них установленное PWA на iPhone стартует с белой вспышки. Чёрный фон #000, знак 120 pt по центру.
// Печатает <link>-теги для index.html.
import { mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

// CSS-ширина × высота @ плотность — актуальные iPhone (портрет)
const DEVICES = [
  [375, 667, 2], [375, 812, 3], [360, 780, 3], [390, 844, 3], [393, 852, 3], [402, 874, 3],
  [414, 896, 2], [414, 896, 3], [428, 926, 3], [430, 932, 3], [440, 956, 3],
];
const svg = readFileSync('public/favicon.svg', 'utf8').replace('<svg ', '<svg width="120" height="120" ');
mkdirSync('public/splash', { recursive: true });
const browser = await chromium.launch();
const links = [];
for (const [w, h, dpr] of DEVICES) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
  await page.setContent(`<body style="margin:0;background:#000;height:100vh;display:grid;place-items:center">${svg}</body>`);
  const name = `splash-${w * dpr}x${h * dpr}.png`;
  await page.screenshot({ path: `public/splash/${name}` });
  await page.close();
  links.push(`    <link rel="apple-touch-startup-image" media="(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: portrait)" href="/splash/${name}" />`);
}
await browser.close();
console.log(links.join('\n'));
