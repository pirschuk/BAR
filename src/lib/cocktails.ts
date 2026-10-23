import data from '../data/cocktails.json';
import type { Base, Cocktail, Glass, Ice, Ingredient, Method, Strength } from '../types/cocktail';

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
  { id: 'brandy', label: 'Бренди' },
  { id: 'aperitif', label: 'Аперитивы' },
  { id: 'non-alcoholic', label: 'Безалкогольные' },
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

// --- Бокалы: утверждённый список, у каждого свой силуэт ---

/** Утверждённые бокалы; ml — стандартный барный объём подачи (для порции с доливкой «до верха») */
export const GLASSES: { id: Glass; label: string; ml: number }[] = [
  { id: 'rocks', label: 'Рокс', ml: 250 },
  { id: 'highball', label: 'Хайбол', ml: 300 },
  { id: 'collins', label: 'Коллинз', ml: 350 },
  { id: 'coupe', label: 'Купе', ml: 180 },
  { id: 'martini', label: 'Мартини', ml: 180 },
  { id: 'flute', label: 'Флюте', ml: 180 },
  { id: 'wine', label: 'Винный', ml: 400 },
  { id: 'hurricane', label: 'Харрикейн', ml: 450 },
  { id: 'copper-mug', label: 'Медная кружка', ml: 400 },
  { id: 'irish-coffee', label: 'Айриш-кофе', ml: 250 },
];
const GLASS_ML = Object.fromEntries(GLASSES.map((g) => [g.id, g.ml])) as Record<Glass, number>;

const GLASS_LABEL = Object.fromEntries(GLASSES.map((g) => [g.id, g.label])) as Record<Glass, string>;

const METHOD_LABEL: Record<Method, string> = {
  build: 'В бокале',
  stir: 'Перемешать',
  shake: 'Шейкер',
  'dry-shake': 'Драй-шейк',
  blend: 'Блендер',
  muddle: 'Размять',
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

/** Крепость словом — те же слова, что в фильтре «Крепость» */
export const STRENGTH_LABEL: Record<Strength, string> = {
  'non-alcoholic': 'Безалкогольный',
  light: 'Лёгкий',
  medium: 'Средний',
  strong: 'Крепкий',
};
export const strengthLabel = (s: Strength) => STRENGTH_LABEL[s];
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

/**
 * Объём одной порции, мл: есть доливка «до верха» — объём бокала (GLASSES.ml);
 * иначе — сумма мл ингредиентов (дэши и бар. ложки не считаются).
 */
export function portionMl(c: Pick<Cocktail, 'ingredients' | 'glass'>): number {
  const ml = c.ingredients.reduce((sum, i) => sum + (i.unit === 'top' ? 0 : (i.amountMl ?? 0)), 0);
  return c.ingredients.some((i) => i.unit === 'top') ? Math.max(ml, GLASS_ML[c.glass]) : ml;
}

/** Итоговый объём для строки 1×/2×/4× [Alma, Apple News]: порция × множитель — «≈ 90 мл», при 2× «≈ 180 мл» */
export function servingVolume(c: Pick<Cocktail, 'ingredients' | 'glass'>, servings: Servings): string {
  return `≈ ${formatNumber(portionMl(c) * servings)} мл`;
}

