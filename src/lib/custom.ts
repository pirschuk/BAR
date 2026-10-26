import { useCallback, useSyncExternalStore } from 'react';
import type { Base, Cocktail, Cover, Glass, Ice, Ingredient, IngredientCategory, IngredientGroup, Method, Strength } from '../types/cocktail';
import { GLASSES, cocktails } from './cocktails';
import { getIngredient } from './filters';

// --- Авторские коктейли: только из ингредиентов справочника; крепость считаем сами ---

/** Разбавление льдом по методу (доля от объёма жидкости) — калибровка на 51 базовом рецепте, см. custom.test.ts */
export const DILUTION: Record<Method, number> = {
  stir: 0.25,
  shake: 0.25,
  'dry-shake': 0.25,
  build: 0.1,
  muddle: 0.15,
  blend: 0.4,
  layer: 0,
  throw: 0.15,
};

/** «Долить» — эта доля объёма бокала (часть бокала занимает лёд) */
export const TOP_SHARE = 0.4;

/** Объём строки, мл: мл — как есть; дэш — 1; бар. ложка — 5; «долить» — доля бокала; штучное — 0 */
function volumeOf(i: Ingredient, glass: Glass): number {
  if (i.unit === 'top') return (GLASSES.find((g) => g.id === glass)?.ml ?? 300) * TOP_SHARE;
  if (i.amountMl !== undefined) return i.amountMl;
  if (i.unit === 'dash') return i.amount ?? 1;
  if (i.unit === 'barspoon') return (i.amount ?? 1) * 5;
  return 0;
}

/** Крепость готового напитка, %: спирт / (объём × (1 + разбавление по методу)), округление до целого */
export function computeAbv(ingredients: Ingredient[], method: Method, glass: Glass): number {
  let alcohol = 0;
  let volume = 0;
  for (const i of ingredients) {
    const v = volumeOf(i, glass);
    volume += v;
    alcohol += (v * (getIngredient(i.ref)?.abv ?? 0)) / 100;
  }
  if (!volume) return 0;
  return Math.round((alcohol / (volume * (1 + DILUTION[method]))) * 100);
}

/** Пороги скилла cocktail-data: 0 | <12 | 12–22 | >22 */
export function strengthOf(abv: number): Strength {
  if (abv <= 0) return 'non-alcoholic';
  if (abv < 12) return 'light';
  if (abv <= 22) return 'medium';
  return 'strong';
}

/** Обложка по базе — данные, как cover в cocktails.json (to — тёмный, правило 10 cocktail-data) */
export const COVERS: { id: Base; cover: Cover }[] = [
  { id: 'gin', cover: { from: '#9FD3B4', to: '#123A2A' } },
  { id: 'rum', cover: { from: '#E8A35C', to: '#3D1F0A' } },
  { id: 'whiskey', cover: { from: '#C98A4B', to: '#2E1806' } },
  { id: 'tequila', cover: { from: '#D9E07A', to: '#2D3310' } },
  { id: 'vodka', cover: { from: '#A9C3E6', to: '#14233A' } },
  { id: 'brandy', cover: { from: '#D4865A', to: '#3A140A' } },
  { id: 'aperitif', cover: { from: '#E2343F', to: '#4A0A14' } },
  { id: 'non-alcoholic', cover: { from: '#F29BB5', to: '#3F1022' } },
];
export const coverFor = (base: Base) => COVERS.find((c) => c.id === base)!.cover;

const CATEGORY: Record<IngredientGroup, IngredientCategory> = {
  spirit: 'spirit',
  liqueur: 'liqueur',
  bitter: 'bitter',
  syrup: 'syrup',
  'juice-fruit': 'juice',
  soda: 'soda',
  other: 'other',
};

// --- Строка ингредиента по умолчанию: как его чаще всего льют в базовых рецептах ---

type Usage = Pick<Ingredient, 'amountMl' | 'amount' | 'unit'>;
const kindOf = (i: Usage) => (i.unit === 'top' ? 'top' : i.amountMl !== undefined ? 'ml' : (i.unit ?? 'piece'));
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]!;

/** Нет в рецептах — по группе словаря */
const GROUP_DEFAULT: Record<IngredientGroup, Usage> = {
  spirit: { amountMl: 45 },
  liqueur: { amountMl: 20 },
  bitter: { amount: 2, unit: 'dash' },
  syrup: { amountMl: 15 },
  'juice-fruit': { amountMl: 20 },
  soda: { unit: 'top' },
  other: { amountMl: 15 },
};

export function defaultUsage(ref: string): Usage {
  const uses = cocktails.filter((c) => !c.custom).flatMap((c) => c.ingredients.filter((i) => i.ref === ref));
  if (!uses.length) return { ...GROUP_DEFAULT[getIngredient(ref)?.group ?? 'other'] };
  const count = new Map<string, Ingredient[]>();
  for (const u of uses) count.set(kindOf(u), [...(count.get(kindOf(u)) ?? []), u]);
  const [kind, same] = [...count].sort((a, b) => b[1].length - a[1].length)[0]!;
  if (kind === 'top') return { unit: 'top' };
  if (kind === 'ml') return { amountMl: median(same.map((u) => u.amountMl!)) };
  return { amount: median(same.map((u) => u.amount ?? 1)), unit: same[0]!.unit };
}

/** Новая строка: имя и категория — из словаря, количество — defaultUsage */
export function lineFor(ref: string): Ingredient {
  const def = getIngredient(ref)!;
  return { ref, name: def.name, category: CATEGORY[def.group], ...defaultUsage(ref) };
}

/** Шаг степпера: мл — 5, штучное — 1 */
export const stepOf = (i: Ingredient) => (i.amountMl !== undefined ? 5 : 1);

/**
 * База по составу (её не выбирают — она нужна только фильтру «База»): крепкий с наибольшим объёмом;
 * поровну (Лонг-Айленд) — тот, что выше в списке; без крепкого — аперитив, без алкоголя — безалкогольный.
 */
const SPIRIT_BASE: Record<string, Base> = {
  gin: 'gin', 'white-rum': 'rum', 'dark-rum': 'rum', bourbon: 'whiskey', 'rye-whiskey': 'whiskey', scotch: 'whiskey',
  'peated-scotch': 'whiskey', 'irish-whiskey': 'whiskey', tequila: 'tequila', mezcal: 'tequila', vodka: 'vodka',
  'citrus-vodka': 'vodka', cognac: 'brandy', pisco: 'brandy',
};
export function baseOf(list: Ingredient[]): Base | null {
  if (!list.length) return null;
  const spirit = [...list].filter((i) => SPIRIT_BASE[i.ref]).sort((a, b) => (b.amountMl ?? 0) - (a.amountMl ?? 0))[0];
  if (spirit) return SPIRIT_BASE[spirit.ref]!;
  return list.some((i) => (getIngredient(i.ref)?.abv ?? 0) > 0) ? 'aperitif' : 'non-alcoholic';
}

export type Draft = {
  id?: string;
  name: string;
  description: string;
  base: Base;
  glass: Glass;
  method: Method;
  ice: Ice;
  garnish: string;
  cover: Cover;
  /** только ref из словаря */
  ingredients: Ingredient[];
  steps: string[];
};

export const EMPTY_DRAFT: Draft = {
  name: '',
  description: '',
  base: 'gin',
  glass: 'rocks',
  method: 'stir',
  ice: 'big-cube',
  garnish: '',
  cover: coverFor('gin'),
  ingredients: [],
  steps: [''],
};

/** Что не так с черновиком — пусто, если можно сохранять */
export function draftErrors(d: Draft): string[] {
  const out: string[] = [];
  if (!d.name.trim()) out.push('Название');
  if (d.ingredients.length < 2) out.push('Хотя бы 2 ингредиента');
  if (d.ingredients.some((i) => !getIngredient(i.ref))) out.push('Ингредиенты — только из справочника');
  if (d.ingredients.some((i) => i.unit !== 'top' && !(i.amountMl || i.amount))) out.push('Количество у каждого ингредиента');
  if (!d.steps.some((s) => s.trim())) out.push('Хотя бы 1 шаг');
  return out;
}

export function toCocktail(d: Draft, now = Date.now()): Cocktail {
  const ingredients = d.ingredients.map((i) => {
    const def = getIngredient(i.ref)!;
    return { ...i, name: def.name, category: CATEGORY[def.group] };
  });
  const abv = computeAbv(ingredients, d.method, d.glass);
  const steps = d.steps.map((s) => s.trim()).filter(Boolean);
  return {
    id: d.id ?? `my-${now.toString(36)}`,
    name: d.name.trim(),
    nameEn: '',
    description: d.description.trim(),
    ingredients,
    method: d.method,
    steps,
    glass: d.glass,
    ice: d.ice,
    garnish: d.garnish.trim() || undefined,
    abv,
    strength: strengthOf(abv),
    difficulty: 1,
    timeMin: 2 + steps.length,
    tags: [],
    base: baseOf(ingredients) ?? d.base,
    cover: d.cover,
    custom: true,
    createdAt: now,
  };
}

export function toDraft(c: Cocktail): Draft {
  return {
    id: c.id,
    name: c.name,
    description: c.description,
    base: c.base,
    glass: c.glass,
    method: c.method,
    ice: c.ice,
    garnish: c.garnish ?? '',
    cover: c.cover,
    ingredients: c.ingredients.map((i) => ({ ...i })),
    steps: c.steps.length ? [...c.steps] : [''],
  };
}

// --- Хранение: localStorage; авторские — в начале общего массива cocktails (каталог, фильтры, 🎲 видят их) ---

const KEY = 'bar-custom-cocktails-v1';
const listeners = new Set<() => void>();
let state: readonly Cocktail[] = [];
/** false — хранилище недоступно (приватный режим): коктейли живут до закрытия вкладки */
export let customPersisted = true;

function sync(next: readonly Cocktail[]) {
  cocktails.splice(0, state.length, ...next);
  state = next;
}

function load(): Cocktail[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    if (!Array.isArray(raw)) return [];
    return raw.filter((c): c is Cocktail => !!c && typeof c.id === 'string' && c.custom === true && Array.isArray(c.ingredients));
  } catch {
    return [];
  }
}

function save(next: readonly Cocktail[]) {
  sync(next);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
    customPersisted = true;
  } catch {
    customPersisted = false;
  }
  listeners.forEach((l) => l());
}

sync(load());

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Авторские коктейли: новые — в начале; save заменяет по id или добавляет */
export function useCustomCocktails() {
  const list = useSyncExternalStore(subscribe, () => state, () => state);
  const upsert = useCallback((c: Cocktail) => {
    save(state.some((x) => x.id === c.id) ? state.map((x) => (x.id === c.id ? c : x)) : [c, ...state]);
  }, []);
  const remove = useCallback((id: string) => save(state.filter((x) => x.id !== id)), []);
  return { list, upsert, remove };
}
