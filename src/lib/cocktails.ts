import data from '../data/cocktails.json';
import type { Base, Cocktail, Glass, Ice, Ingredient, Method } from '../types/cocktail';

export const cocktails = data as Cocktail[];

export function getCocktail(id: string | undefined): Cocktail | undefined {
  return cocktails.find((c) => c.id === id);
}

export const BASES: { id: Base; label: string }[] = [
  { id: 'gin', label: 'Джин' },
  { id: 'rum', label: 'Ром' },
  { id: 'whiskey', label: 'Виски' },
  { id: 'tequila', label: 'Текила' },
  { id: 'vodka', label: 'Водка' },
  { id: 'aperitif', label: 'Аперитивы' },
];

export function isBase(value: string | null): value is Base {
  return BASES.some((b) => b.id === value);
}

export function filterByBase(list: Cocktail[], base: Base | null): Cocktail[] {
  return base ? list.filter((c) => c.base === base) : list;
}

/** Русское склонение по числу: plural(2, ['коктейль', 'коктейля', 'коктейлей']) */
export function plural(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (!Number.isInteger(n)) return forms[1];
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

export function countLabel(n: number): string {
  return `${n} ${plural(n, ['коктейль', 'коктейля', 'коктейлей'])}`;
}

// --- Бокалы: в MVP 6 силуэтов, остальные — на ближайший ---

export type GlassShape = 'rocks' | 'coupe' | 'highball' | 'collins' | 'martini' | 'wine';

const GLASS_SHAPE: Record<Glass, GlassShape> = {
  rocks: 'rocks',
  'double-rocks': 'rocks',
  highball: 'highball',
  collins: 'collins',
  coupe: 'coupe',
  martini: 'martini',
  'nick-and-nora': 'coupe',
  hurricane: 'collins',
  wine: 'wine',
  flute: 'wine',
  'copper-mug': 'highball',
  tiki: 'highball',
  shot: 'rocks',
};

export function glassShape(glass: Glass): GlassShape {
  return GLASS_SHAPE[glass];
}

const GLASS_LABEL: Record<Glass, string> = {
  rocks: 'Рокс',
  'double-rocks': 'Рокс',
  highball: 'Хайбол',
  collins: 'Коллинз',
  coupe: 'Купе',
  martini: 'Мартини',
  'nick-and-nora': 'Ник-н-Нора',
  hurricane: 'Харрикейн',
  wine: 'Винный',
  flute: 'Флюте',
  'copper-mug': 'Кружка',
  tiki: 'Тики',
  shot: 'Шот',
};

const METHOD_LABEL: Record<Method, string> = {
  build: 'В бокале',
  stir: 'Стир',
  shake: 'Шейк',
  'dry-shake': 'Драй-шейк',
  blend: 'Блендер',
  muddle: 'Мадл',
  layer: 'Слоями',
  throw: 'Пролив',
};

const ICE_LABEL: Record<Ice, string> = {
  none: 'Без льда',
  cubes: 'Кубики',
  'big-cube': 'Крупный',
  crushed: 'Колотый',
  sphere: 'Шар',
};

export const glassLabel = (g: Glass) => GLASS_LABEL[g];
export const methodLabel = (m: Method) => METHOD_LABEL[m];
export const iceLabel = (i: Ice) => ICE_LABEL[i];

/** Крепость в 4 деления: 0 — безалкогольный */
export function strengthLevel(abv: number): 0 | 1 | 2 | 3 | 4 {
  if (abv <= 0) return 0;
  if (abv <= 10) return 1;
  if (abv <= 18) return 2;
  if (abv <= 26) return 3;
  return 4;
}

// --- Порции и единицы ---

export type Servings = 1 | 2 | 4;

const FRACTIONS: Record<string, string> = { '0.25': '¼', '0.5': '½', '0.75': '¾' };

function formatNumber(n: number): string {
  const whole = Math.floor(n);
  const rest = Math.round((n - whole) * 100) / 100;
  if (rest === 0) return String(whole);
  const frac = FRACTIONS[String(rest)];
  if (frac) return whole === 0 ? frac : `${whole}${frac}`;
  return String(Math.round(n * 10) / 10).replace('.', ',');
}

const UNIT_FORMS: Partial<Record<NonNullable<Ingredient['unit']>, [string, string, string]>> = {
  slice: ['долька', 'дольки', 'долек'],
  leaf: ['лист', 'листа', 'листьев'],
  pinch: ['щепотка', 'щепотки', 'щепоток'],
};

const UNIT_SHORT: Partial<Record<NonNullable<Ingredient['unit']>, string>> = {
  ml: 'мл',
  dash: 'дэш',
  barspoon: 'бар. л.',
  piece: 'шт.',
};

export type Amount = { value: string; unit: string };

/** Количество ингредиента с учётом порций. «Долить» не умножается. */
export function scaleIngredient(ing: Ingredient, servings: Servings): Amount {
  if (ing.unit === 'top') return { value: '', unit: 'долить' };
  if (ing.amountMl !== undefined) return { value: formatNumber(ing.amountMl * servings), unit: 'мл' };
  if (ing.amount !== undefined) {
    const n = ing.amount * servings;
    const unit = ing.unit ?? 'piece';
    const forms = UNIT_FORMS[unit];
    return { value: formatNumber(n), unit: forms ? plural(n, forms) : (UNIT_SHORT[unit] ?? '') };
  }
  return { value: '', unit: 'по вкусу' };
}
