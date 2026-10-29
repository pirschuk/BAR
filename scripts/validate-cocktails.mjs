#!/usr/bin/env node
// Валидация src/data/cocktails.json, src/data/ingredients.json и src/data/glossary.json по правилам скилла cocktail-data.
// Запуск: node scripts/validate-cocktails.mjs  (код выхода 1 при ошибках)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const file = resolve(root, 'src/data/cocktails.json');
const dictFile = resolve(root, 'src/data/ingredients.json');
const glossaryFile = resolve(root, 'src/data/glossary.json');
const inventoryFile = resolve(root, 'src/lib/inventory.ts');

const METHODS = ['build', 'stir', 'shake', 'dry-shake', 'blend', 'muddle', 'layer', 'throw'];
// утверждённый список бокалов (10), у каждого свой силуэт в GlassIllustration
const GLASSES_MVP = ['rocks', 'highball', 'collins', 'coupe', 'martini', 'flute', 'wine', 'hurricane', 'copper-mug', 'irish-coffee'];
const ICE = ['none', 'cubes', 'big-cube', 'crushed', 'sphere'];
const UNITS = ['ml', 'dash', 'barspoon', 'piece', 'slice', 'leaf', 'pinch', 'top'];
const CATEGORIES = ['spirit', 'liqueur', 'wine', 'bitter', 'syrup', 'juice', 'soda', 'dairy', 'egg', 'garnish', 'other'];
const STRENGTHS = ['non-alcoholic', 'light', 'medium', 'strong'];
const BASES = ['gin', 'rum', 'whiskey', 'tequila', 'vodka', 'brandy', 'aperitif', 'non-alcoholic'];
const TASTES = ['sour', 'sweet', 'bitter', 'fruity', 'herbal', 'refreshing', 'creamy', 'spicy'];
const GROUPS = ['spirit', 'liqueur', 'bitter', 'syrup', 'juice-fruit', 'soda', 'other'];
const DICT_KEYS = ['id', 'name', 'aliases', 'group', 'abv', 'look', 'pantry', 'popular'];
const LOOK_KEYS = ['color', 'tint', 'body'];
const LOOK_BODIES = ['clear', 'tinted', 'opaque', 'none'];
const NON_ALC_GROUPS = ['soda', 'juice-fruit', 'syrup'];
const TAGS = ['classic', 'sour', 'bitter', 'sweet', 'fruity', 'herbal', 'citrus', 'creamy', 'spicy',
  'refreshing', 'summer', 'winter', 'brunch', 'aperitif', 'digestif', 'tiki', 'party', 'easy', 'non-alcoholic'];
const NO_ICE_GLASSES = ['coupe', 'martini', 'flute'];
const MIN_PER_BASE = 5;
const MAX_TO_LUMINANCE = 0.15;
const ALLOWED_KEYS = ['id', 'name', 'nameEn', 'description', 'image', 'ingredients', 'method', 'steps', 'glass',
  'ice', 'garnish', 'abv', 'strength', 'difficulty', 'timeMin', 'tags', 'iba', 'base', 'cover'];
const ING_KEYS = ['ref', 'name', 'amountMl', 'amount', 'unit', 'optional', 'category'];
const METHOD_WORDS = {
  shake: /взб|шейк/i, 'dry-shake': /без льда/i, stir: /перемеш/i, muddle: /разомн|мадлер/i,
  blend: /блендер/i, layer: /сло/i, build: /влей|долей/i, throw: /перелив/i,
};

const errors = [];
const warnings = [];
const err = (id, msg) => errors.push(`${id}: ${msg}`);
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

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

// словарь ингредиентов
let dict;
try {
  dict = JSON.parse(readFileSync(dictFile, 'utf8'));
} catch (e) {
  console.error(`Не удалось прочитать ${dictFile}: ${e.message}`);
  process.exit(1);
}
if (!Array.isArray(dict)) {
  console.error('ingredients.json должен быть массивом');
  process.exit(1);
}
const dictById = new Map();
const aliasOwner = new Map(); // alias -> id (для информации о пересечениях)
for (const [idx, d] of dict.entries()) {
  const did = `словарь ${d?.id ?? `#${idx}`}`;
  for (const k of Object.keys(d)) if (!DICT_KEYS.includes(k)) err(did, `лишнее поле "${k}"`);
  if (typeof d.id !== 'string' || !KEBAB.test(d.id)) err(did, 'id не kebab-case');
  if (dictById.has(d.id)) err(did, 'id словаря не уникален');
  dictById.set(d.id, d);
  if (typeof d.name !== 'string' || !d.name.trim()) err(did, 'пустое name');
  else if (d.name[0] !== d.name[0].toLocaleUpperCase('ru')) err(did, 'name с заглавной');
  if (!GROUPS.includes(d.group)) err(did, `group "${d.group}" вне словаря`);
  if (!Number.isInteger(d.abv) || d.abv < 0 || d.abv > 80) err(did, `abv "${d.abv}" — нужно целое 0–80`);
  else if (NON_ALC_GROUPS.includes(d.group) && d.abv !== 0) err(did, `abv ${d.abv} у группы ${d.group} — должно быть 0`);
  else if (d.pantry && d.abv !== 0) err(did, `abv ${d.abv} у pantry — должно быть 0`);
  // look — визуальный вид для иллюстрации напитка
  if (!d.look || typeof d.look !== 'object' || Array.isArray(d.look)) err(did, 'нет look { color, tint, body }');
  else {
    for (const k of Object.keys(d.look)) if (!LOOK_KEYS.includes(k)) err(did, `look: лишнее поле "${k}"`);
    if (typeof d.look.color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(d.look.color)) err(did, `look.color "${d.look.color}" — нужен #RRGGBB`);
    if (typeof d.look.tint !== 'number' || !Number.isFinite(d.look.tint) || d.look.tint < 0 || d.look.tint > 8) err(did, `look.tint "${d.look.tint}" — нужно число 0–8`);
    if (!LOOK_BODIES.includes(d.look.body)) err(did, `look.body "${d.look.body}" вне словаря (${LOOK_BODIES.join(', ')})`);
    else if (d.look.body === 'none' && d.look.tint !== 0) err(did, 'look: body "none" ⇒ tint 0');
  }
  if (d.pantry !== undefined && d.pantry !== true) err(did, 'pantry — только true или нет поля');
  if (d.popular !== undefined && d.popular !== true) err(did, 'popular — только true или нет поля');
  if (d.pantry && d.popular) err(did, 'pantry и popular одновременно');
  if (!Array.isArray(d.aliases) || d.aliases.length === 0) err(did, 'aliases пусты');
  else {
    if (new Set(d.aliases).size !== d.aliases.length) err(did, 'дубли в aliases');
    for (const a of d.aliases) {
      if (typeof a !== 'string' || !a.trim()) { err(did, 'пустой alias'); continue; }
      if (a !== a.toLocaleLowerCase('ru')) err(did, `alias "${a}" не в нижнем регистре`);
      if (!aliasOwner.has(a)) aliasOwner.set(a, []);
      aliasOwner.get(a).push(d.id);
    }
    if (typeof d.name === 'string' && !d.aliases.includes(d.name.toLocaleLowerCase('ru'))) {
      warnings.push(`${did}: name "${d.name}" не входит в aliases`);
    }
  }
}
const usedRefs = new Map(); // ref -> count
const nameRef = new Map(); // name -> Set(ref)

const ids = new Set();
const ingredientNames = new Map(); // name -> Set(category)
const baseCount = Object.fromEntries(BASES.map((b) => [b, 0]));

for (const [idx, c] of data.entries()) {
  const id = c?.id ?? `#${idx}`;
  for (const k of Object.keys(c)) if (!ALLOWED_KEYS.includes(k)) err(id, `лишнее поле "${k}"`);

  // 1. id
  if (typeof c.id !== 'string' || !KEBAB.test(c.id)) err(id, 'id не kebab-case');
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
  if (!GLASSES_MVP.includes(c.glass)) err(id, `glass "${c.glass}" не из утверждённого списка бокалов`);
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
    if (!c.tags.some((t) => TASTES.includes(t))) err(id, `нет вкусового тега (${TASTES.join(', ')})`);
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
    if ((c.base === 'non-alcoholic') !== (c.abv === 0)) err(id, 'base non-alcoholic ⇔ abv: 0');
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
      if (typeof ing.ref !== 'string' || !ing.ref) err(id, `${n}: нет ref`);
      else if (!dictById.has(ing.ref)) err(id, `${n}: ref "${ing.ref}" нет в словаре`);
      else {
        usedRefs.set(ing.ref, (usedRefs.get(ing.ref) ?? 0) + 1);
        if (!nameRef.has(ing.name)) nameRef.set(ing.name, new Set());
        nameRef.get(ing.name).add(ing.ref);
      }
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

// не меньше MIN_PER_BASE коктейлей на каждую базу
for (const [b, n] of Object.entries(baseCount)) if (n < MIN_PER_BASE) errors.push(`база ${b}: ${n} коктейлей, нужно ≥ ${MIN_PER_BASE}`);

// словарь: каждый id используется; одно название — один ref
for (const d of dict) {
  if (usedRefs.has(d.id)) continue;
  if (d.pantry) warnings.push(`словарь ${d.id}: не используется (pantry)`);
  else errors.push(`словарь ${d.id}: не используется ни в одном рецепте`);
}
for (const [name, refs] of nameRef) {
  if (refs.size > 1) errors.push(`ингредиент "${name}" с разными ref: ${[...refs].join(', ')}`);
}

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

// глоссарий «Барная азбука» (src/data/glossary.json)
const G_KINDS = ['glass', 'tool', 'method', 'ice', 'measure'];
const G_KEYS = ['kind', 'id', 'name', 'what', 'why', 'substitute'];
const G_LIMITS = { name: 40, what: 80, why: 170, substitute: 90 };
let glossary = [];
try {
  glossary = JSON.parse(readFileSync(glossaryFile, 'utf8'));
  if (!Array.isArray(glossary)) { errors.push('glossary.json должен быть массивом'); glossary = []; }
} catch (e) {
  errors.push(`Не удалось прочитать ${glossaryFile}: ${e.message}`);
}
const gIds = new Set();
const gByKind = Object.fromEntries(G_KINDS.map((k) => [k, new Set()]));
let lastKind = -1;
for (const [idx, g] of glossary.entries()) {
  const gid = `глоссарий ${g?.id ?? `#${idx}`}`;
  for (const k of Object.keys(g)) if (!G_KEYS.includes(k)) err(gid, `лишнее поле "${k}"`);
  const ki = G_KINDS.indexOf(g.kind);
  if (ki < 0) err(gid, `kind "${g.kind}" вне списка (${G_KINDS.join(', ')})`);
  else {
    if (ki < lastKind) err(gid, `порядок: ${g.kind} после ${G_KINDS[lastKind]} (нужно ${G_KINDS.join(' → ')})`);
    lastKind = Math.max(lastKind, ki);
    gByKind[g.kind].add(g.id);
  }
  if (typeof g.id !== 'string' || !KEBAB.test(g.id)) err(gid, 'id не kebab-case');
  else if (gIds.has(g.id)) err(gid, 'id не уникален');
  gIds.add(g.id);
  for (const k of ['name', 'what', 'why']) {
    if (typeof g[k] !== 'string' || !g[k].trim()) err(gid, `пустое поле ${k}`);
  }
  if (g.substitute !== undefined && (typeof g.substitute !== 'string' || !g.substitute.trim())) err(gid, 'пустой substitute');
  for (const [k, max] of Object.entries(G_LIMITS)) {
    if (typeof g[k] === 'string' && g[k].length > max) err(gid, `${k} ${g[k].length} > ${max}`);
  }
}
// у каждого glass / method / ice из рецептов есть статья
for (const [kind, field] of [['glass', 'glass'], ['method', 'method'], ['ice', 'ice']]) {
  for (const v of new Set(data.map((c) => c[field]))) {
    if (!gByKind[kind].has(v)) errors.push(`глоссарий: нет статьи ${kind} "${v}" (используется в cocktails.json)`);
  }
}
// все инструменты из TOOLS (src/lib/inventory.ts) описаны
let toolIds = ['tool-shaker', 'tool-muddler', 'tool-barspoon', 'tool-blender'];
try {
  const src = readFileSync(inventoryFile, 'utf8');
  const body = src.match(/export const TOOLS[^=]*=\s*\[([\s\S]*?)\n\];/)?.[1] ?? '';
  const found = [...body.matchAll(/id:\s*'([^']+)'/g)].map((m) => m[1]);
  if (found.length) toolIds = found;
  else warnings.push('глоссарий: TOOLS в inventory.ts не распознан, проверка по встроенному списку');
} catch {
  warnings.push('глоссарий: inventory.ts не прочитан, проверка по встроенному списку');
}
for (const t of toolIds) if (!gByKind.tool.has(t)) errors.push(`глоссарий: нет статьи tool "${t}" из TOOLS`);

console.log(`Коктейлей: ${data.length}; ингредиентов (уникальных названий): ${ingredientNames.size}`);
console.log(`По базам: ${BASES.map((b) => `${b} ${baseCount[b]}`).join(', ')}`);
console.log(`Словарь: ${dict.length} (popular ${dict.filter((d) => d.popular).length}, pantry ${dict.filter((d) => d.pantry).length})`);
console.log(`Глоссарий: ${glossary.length} (${G_KINDS.map((k) => `${k} ${gByKind[k].size}`).join(', ')})`);
console.log(`Ингредиенты: ${[...ingredientNames.keys()].sort((a, b) => a.localeCompare(b, 'ru')).join(', ')}`);
for (const w of warnings) console.warn(`WARN  ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`ERROR ${e}`);
  console.error(`Ошибок: ${errors.length}`);
  process.exit(1);
}
console.log('Валидация: OK');
