// «Мне повезёт» (срез 2c): node scripts/shots-lucky.mjs [--url http://...]
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const args = process.argv.slice(2);
const ui = args.indexOf('--url');
const base = ui >= 0 ? args.splice(ui, 2)[1] : 'http://127.0.0.1:5173';
const theme = args[0] ?? 'dark';
const prefix = `lucky2c-${theme}`;
const root = new URL(base).pathname.endsWith('/') ? new URL(base).pathname : '/';
mkdirSync('.screenshots', { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await ctx.addInitScript(() => localStorage.getItem('bar-onboarded-v1') || localStorage.setItem('bar-onboarded-v1', 'test')); // онбординг первого запуска не перекрывает снимки
await ctx.addInitScript((t) => {
  if (!sessionStorage.getItem('seeded')) {
    localStorage.setItem('bar-inventory-v1', JSON.stringify(['gin', 'white-rum', 'vodka', 'lime', 'lemon', 'simple-syrup', 'soda']));
    sessionStorage.setItem('seeded', '1');
  }
}, theme);
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
const shots = [];
const log = [];
const go = (path) => page.goto(new URL(root + path.replace(/^\//, ''), base).href, { waitUntil: 'networkidle' });
const shot = async (name) => {
  await page.waitForTimeout(350);
  const path = `.screenshots/${prefix}-${name}.png`;
  await page.screenshot({ path });
  shots.push(path);
};
const dice = () => page.getByRole('button', { name: 'Мне повезёт' }).click();
const topName = () => page.locator('[role=dialog] article h3').last().textContent();
const caption = () => page.locator('[role=dialog] p.text-footnote').first().textContent();

await go('/');
await dice();
await shot('1-catalog');
log.push(`каталог: ${await caption()}`);

// свайп влево пальцем (мышью)
const before = await topName();
const card = page.locator('[role=dialog] article').last();
const b = await card.boundingBox();
await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
await page.mouse.down();
await page.mouse.move(b.x + b.width / 2 - 70, b.y + b.height / 2, { steps: 5 });
await shot('2-swipe-frame');
await page.mouse.move(b.x - 60, b.y + b.height / 2, { steps: 5 });
await page.mouse.up();
await page.waitForTimeout(400);
log.push(`свайп: ${before} → ${await topName()}`);

// «Ещё раз» по всей колоде — без повторов
const seen = new Set([await topName()]);
for (let i = 0; i < 50; i++) {
  await page.getByRole('button', { name: 'Ещё раз' }).click();
  await page.waitForTimeout(260);
  seen.add(await topName());
}
log.push(`«Ещё раз» ×50: уникальных ${seen.size} (в колоде 51, первые 51 показов без повторов)`);
await shot('3-after-shuffle');

// открыть рецепт → «Назад» возвращает в каталог без шторки
const name = await topName();
await page.getByRole('button', { name: 'Открыть рецепт' }).click();
await page.waitForURL(/cocktail/);
log.push(`открыть рецепт: ${name} → ${new URL(page.url()).pathname}`);
await page.goBack();
await page.waitForTimeout(300);
log.push(`назад: ${new URL(page.url()).pathname}${new URL(page.url()).hash} · шторка: ${await page.getByRole('dialog').count()}`);

await go('/?base=rum&taste=sour');
await dice();
log.push(`фильтры: ${await caption()}`);
await shot('4-filtered');

await go('/?q=сбальято');
await dice();
log.push(`один вариант: ${await caption()} · «Ещё раз» disabled: ${await page.getByRole('button', { name: 'Ещё раз' }).isDisabled()}`);
await shot('5-single');

await go('/?q=zzz');
await dice();
await shot('6-empty');

await go('/bar');
await dice();
log.push(`мой бар: ${await caption()}`);
await shot('7-bar');

console.log(log.join('\n'));
console.log(shots.join('\n'));
if (errors.length) console.log('Ошибки в консоли:\n' + errors.map((e) => '  ' + e).join('\n'));
await browser.close();
