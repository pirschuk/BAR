#!/usr/bin/env node
// Валидация src/data/cocktails.json по правилам скилла cocktail-data.
// Запуск: node scripts/validate-cocktails.mjs  (код выхода 1 при ошибках)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const file = resolve(root, 'src/data/cocktails.json');

const METHODS = ['build', 'stir', 'shake', 'dry-shake', 'blend', 'muddle', 'layer', 'throw'];
const GLASSES_MVP = ['rocks', 'coupe', 'highball', 'collins', 'martini', 'wine'];
const ICE = ['none', 'cubes', 'big-cube', 'crushed', 'sphere'];
const UNITS = ['ml', 'dash', 'barspoon', 'piece', 'slice', 'leaf', 'pinch', 'top'];
const CATEGORIES = ['spirit', 'liqueur', 'wine', 'bitter', 'syrup', 'juice', 'soda', 'dairy', 'egg', 'garnish', 'other'];
const STRENGTHS = ['non-alcoholic', 'light', 'medium', 'strong'];
const BASES = ['gin', 'rum', 'whiskey', 'tequila', 'vodka', 'aperitif'];
const TAGS = ['classic', 'sour', 'bitter', 'sweet', 'fruity', 'herbal', 'citrus', 'creamy', 'spicy',
  'refreshing', 'summer', 'winter', 'brunch', 'aperitif', 'digestif', 'tiki', 'party', 'easy', 'non-alcoholic'];
const NO_ICE_GLASSES = ['coupe', 'martini', 'nick-and-nora'];
const PER_BASE = 2;
const MAX_TO_LUMINANCE = 0.15;
const ALLOWED_KEYS = ['id', 'name', 'nameEn', 'description', 'image', 'ingredients', 'method', 'steps', 'glass',
  'ice', 'garnish', 'abv', 'strength', 'difficulty', 'timeMin', 'tags', 'iba', 'base', 'cover'];
const ING_KEYS = ['name', 'amountMl', 'amount', 'unit', 'optional', 'category'];
const METHOD_WORDS = {
  shake: /взб|шейк/i, 'dry-shake': /без льда/i, stir: /перемеш/i, muddle: /разомн|мадлер/i,
  blend: /блендер/i, layer: /сло/i, build: /влей|долей/i, throw: /перелив/i,
};

const errors = [];
const warnings = [];
const err = (id, msg) => errors.push(`${id}: ${msg}`);

function strengthFor(abv) {
  if (abv === 0) return 'non-alcoholic';
  if (abv < 12) return 'light';
  if (abv <= 22) return 'medium';
  return 'strong';
}

function luminance(hex) {
  const ch = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
const HEX = /^#[0-9A-Fa-f]{6}$/;

let data;
try {
  data = JSON.parse(readFileSync(file, 'utf8'));
} catch (e) {
  console.error(`Не удалось прочитать ${file}: ${e.message}`);
  process.exit(1);
}
if (!Array.isArray(data)) {
  console.error('cocktails.json должен быть массивом');
  process.exit(1);
}

const ids = new Set();
const ingredientNames = new Map(); // name -> Set(category)
const baseCount = Object.fromEntries(BASES.map((b) => [b, 0]));

for (const [idx, c] of data.entries()) {
  const id = c?.id ?? `#${idx}`;
  for (const k of Object.keys(c)) if (!ALLOWED_KEYS.includes(k)) err(id, `лишнее поле "${k}"`);

  // 1. id
  if (typeof c.id !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(c.id)) err(id, 'id не kebab-case');
  if (ids.has(c.id)) err(id, 'id не уникален');
  ids.add(c.id);

  for (const k of ['name', 'nameEn', 'description']) {
    if (typeof c[k] !== 'string' || !c[k].trim()) err(id, `пустое поле ${k}`);
  }
  if (typeof c.description === 'string' && c.description.length > 160) err(id, `description ${c.description.length} > 160`);
  if (c.image !== undefined && (typeof c.image !== 'string' || !c.image.startsWith('/'))) err(id, 'image должен быть путём от /public');
  if (c.garnish !== undefined && (typeof c.garnish !== 'string' || !c.garnish.trim())) err(id, 'пустой garnish');

  // словари
  if (!METHODS.includes(c.method)) err(id, `method "${c.method}" вне словаря`);
  if (!GLASSES_MVP.includes(c.glass)) err(id, `glass "${c.glass}" не из 6 силуэтов MVP`);
  if (!ICE.includes(c.ice)) err(id, `ice "${c.ice}" вне словаря`);
  if (!STRENGTHS.includes(c.strength)) err(id, `strength "${c.strength}" вне словаря`);
  if (![1, 2, 3].includes(c.difficulty)) err(id, 'difficulty не 1|2|3');
  if (typeof c.timeMin !== 'number' || c.timeMin <= 0) err(id, 'timeMin должен быть > 0');
  if (c.iba !== undefined && typeof c.iba !== 'boolean') err(id, 'iba не boolean');

  // tags
  if (!Array.isArray(c.tags) || c.tags.length === 0) err(id, 'tags пусты');
  else {
    if (new Set(c.tags).size !== c.tags.length) err(id, 'дубли в tags');
    for (const t of c.tags) if (!TAGS.includes(t)) warnings.push(`${id}: тег "${t}" вне словаря`);
  }

  // steps
  if (!Array.isArray(c.steps) || c.steps.length < 2 || c.steps.length > 6) err(id, 'steps: нужно 2–6 шагов');
  else if (c.steps.some((s) => typeof s !== 'string' || !s.trim())) err(id, 'пустой шаг');

  // 5. method ↔ steps
  if (Array.isArray(c.steps) && METHOD_WORDS[c.method] && !c.steps.some((s) => METHOD_WORDS[c.method].test(s))) {
    err(id, `method "${c.method}" не отражён в шагах`);
  }

  // 4. abv ↔ strength
  if (typeof c.abv !== 'number' || c.abv < 0 || c.abv > 45) err(id, 'abv вне 0–45');
  else {
    if (c.strength !== strengthFor(c.abv)) err(id, `strength "${c.strength}" не согласован с abv ${c.abv} (ожидается ${strengthFor(c.abv)})`);
    const na = Array.isArray(c.tags) && c.tags.includes('non-alcoholic');
    if ((c.abv === 0) !== na) err(id, 'abv: 0 ⇔ тег non-alcoholic');
  }

  // 6. ice ↔ glass
  if (NO_ICE_GLASSES.includes(c.glass) && c.ice !== 'none') err(id, `ice должен быть none для ${c.glass}`);
  if (!NO_ICE_GLASSES.includes(c.glass) && c.ice === 'none') warnings.push(`${id}: ${c.glass} без льда`);

  // ingredients
  if (!Array.isArray(c.ingredients) || c.ingredients.length === 0) err(id, 'нет ингредиентов');
  else {
    let sum = 0;
    for (const ing of c.ingredients) {
      const n = ing?.name ?? '?';
      for (const k of Object.keys(ing)) if (!ING_KEYS.includes(k)) err(id, `${n}: лишнее поле "${k}"`);
      if (typeof ing.name !== 'string' || !ing.name.trim()) { err(id, 'ингредиент без name'); continue; }
      if (ing.name[0] !== ing.name[0].toLocaleUpperCase('ru')) err(id, `${n}: название с заглавной`);
      if (!CATEGORIES.includes(ing.category)) err(id, `${n}: category "${ing.category}" вне словаря`);
      if (ing.unit !== undefined && !UNITS.includes(ing.unit)) err(id, `${n}: unit "${ing.unit}" вне словаря`);
      if (ing.optional !== undefined && typeof ing.optional !== 'boolean') err(id, `${n}: optional не boolean`);

      const hasMl = ing.amountMl !== undefined;
      const hasAmt = ing.amount !== undefined;
      if (hasMl && hasAmt) err(id, `${n}: одновременно amountMl и amount`);
      if (ing.unit === 'top') {
        if (hasMl || hasAmt) err(id, `${n}: top — без количества`);
      } else if (['dash', 'barspoon'].includes(ing.unit)) {
        if (hasMl) err(id, `${n}: ${ing.unit} — без amountMl`);
        if (!hasAmt) err(id, `${n}: ${ing.unit} — нужен amount`);
      } else if (hasMl) {
        if (ing.unit && ing.unit !== 'ml') err(id, `${n}: amountMl с unit "${ing.unit}"`);
        const ok = typeof ing.amountMl === 'number' && ing.amountMl > 0 &&
          (ing.amountMl % 5 === 0 || ing.amountMl === 2.5 || ing.amountMl === 7.5);
        if (!ok) err(id, `${n}: amountMl ${ing.amountMl} не кратен 5`);
        sum += ing.amountMl;
      } else if (hasAmt) {
        if (!ing.unit || ing.unit === 'ml') err(id, `${n}: amount без штучной единицы`);
        if (typeof ing.amount !== 'number' || ing.amount <= 0) err(id, `${n}: amount должен быть > 0`);
      } else if (!ing.optional) {
        err(id, `${n}: нет количества`);
      }

      if (!ingredientNames.has(ing.name)) ingredientNames.set(ing.name, new Set());
      ingredientNames.get(ing.name).add(ing.category);
    }
    // 3. сумма объёмов
    if (sum < 40 || sum > 250) err(id, `сумма amountMl ${sum} вне 40–250`);
    if (c.glass === 'shot' && sum > 60) err(id, `шот: сумма ${sum} > 60`);
  }

  // base
  if (!BASES.includes(c.base)) err(id, `base "${c.base}" вне словаря`);
  else baseCount[c.base]++;

  // cover
  const cv = c.cover;
  if (!cv || typeof cv !== 'object') err(id, 'нет cover');
  else {
    for (const k of Object.keys(cv)) if (!['from', 'to'].includes(k)) err(id, `cover: лишнее поле "${k}"`);
    const okFrom = HEX.test(cv.from ?? '');
    const okTo = HEX.test(cv.to ?? '');
    if (!okFrom) err(id, `cover.from "${cv.from}" не #RRGGBB`);
    if (!okTo) err(id, `cover.to "${cv.to}" не #RRGGBB`);
    if (okTo && luminance(cv.to) >= MAX_TO_LUMINANCE) err(id, `cover.to яркость ${luminance(cv.to).toFixed(3)} ≥ ${MAX_TO_LUMINANCE}`);
    if (okFrom && okTo && luminance(cv.from) <= luminance(cv.to)) err(id, 'cover.from должен быть светлее cover.to');
  }
}

// 2 коктейля на каждую базу
for (const [b, n] of Object.entries(baseCount)) if (n !== PER_BASE) errors.push(`база ${b}: ${n} коктейлей, нужно ${PER_BASE}`);

// порядок массива по базам
const order = data.map((c) => BASES.indexOf(c.base));
if (order.some((v, i) => i > 0 && v < order[i - 1])) warnings.push(`порядок не по базам (${BASES.join(', ')})`);

// 8. единообразие названий: одно имя — одна категория; похожие имена
for (const [name, cats] of ingredientNames) {
  if (cats.size > 1) errors.push(`ингредиент "${name}" в разных категориях: ${[...cats].join(', ')}`);
}
const norm = (s) => s.toLocaleLowerCase('ru').replace(/ё/g, 'е').split(/[\s-]+/).sort().join(' ');
const seen = new Map();
for (const name of ingredientNames.keys()) {
  const k = norm(name);
  if (seen.has(k)) errors.push(`ингредиенты-дубли: "${seen.get(k)}" и "${name}"`);
  else seen.set(k, name);
}

console.log(`Коктейлей: ${data.length}; ингредиентов (уникальных): ${ingredientNames.size}`);
console.log(`Ингредиенты: ${[...ingredientNames.keys()].sort((a, b) => a.localeCompare(b, 'ru')).join(', ')}`);
for (const w of warnings) console.warn(`WARN  ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`ERROR ${e}`);
  console.error(`Ошибок: ${errors.length}`);
  process.exit(1);
}
console.log('Валидация: OK');
