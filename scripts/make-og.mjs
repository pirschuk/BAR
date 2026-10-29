// Картинка-превью ссылки (Open Graph, 1200×630) из настоящих карточек приложения: node scripts/make-og.mjs
// Нужен запущенный dev-сервер (npm run dev). Результат — public/og.png.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
const base = process.argv[2] ?? 'http://127.0.0.1:5173';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.addInitScript(() => localStorage.setItem('bar-onboarded-v1', 'og'));
await page.goto(`${base}/onboarding`);
await page.waitForTimeout(800);
// веер карточек первого экрана онбординга + заголовок — на чёрном фоне 1200×630
await page.evaluate(() => {
  const fan = document.querySelector('[aria-label="Знакомство с BAR"] section > div');
  const shell = document.createElement('div');
  shell.style.cssText = 'position:fixed;inset:0;z-index:99;background:#000;display:flex;align-items:center;gap:24px;padding:0 72px;font-family:Unbounded,system-ui';
  shell.innerHTML = '<div style="flex:1;color:#fff"><div style="font-size:84px;font-weight:700;line-height:1">BAR</div><div style="margin-top:20px;font-size:44px;font-weight:700;line-height:1.15">100 коктейлей<br><span style="color:#FF8A3D">и ваш домашний бар</span></div><div style="margin-top:24px;font:28px system-ui;color:rgba(255,255,255,.65)">Рецепты и что приготовить из того, что есть дома</div></div>';
  const right = document.createElement('div');
  right.style.cssText = 'width:470px;transform:scale(1.25);transform-origin:center';
  right.appendChild(fan.cloneNode(true));
  shell.appendChild(right);
  document.body.appendChild(shell);
});
await page.waitForTimeout(400);
await page.screenshot({ path: 'public/og.png' });
await browser.close();
console.log('public/og.png');
