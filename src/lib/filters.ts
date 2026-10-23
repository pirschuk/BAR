import ingredientsData from '../data/ingredients.json';
import type { Base, Cocktail, IngredientDef, Strength, Taste } from '../types/cocktail';
import { BASES, STRENGTH_LABEL } from './cocktails';

export const ingredients = ingredientsData as IngredientDef[];
const byId = new Map(ingredients.map((i) => [i.id, i]));

export function getIngredient(id: string | null | undefined): IngredientDef | undefined {
  return id ? byId.get(id) : undefined;
}

// --- Фасеты ---

export const TASTES: { id: Taste; label: string }[] = [
  { id: 'sour', label: 'Кислый' },
  { id: 'sweet', label: 'Сладкий' },
  { id: 'bitter', label: 'Горький' },
  { id: 'fruity', label: 'Фруктовый' },
  { id: 'herbal', label: 'Травяной' },
  { id: 'refreshing', label: 'Освежающий' },
  { id: 'creamy', label: 'Сливочный' },
  { id: 'spicy', label: 'Пряный' },
];

export const STRENGTHS: { id: Strength; label: string }[] = (['non-alcoholic', 'light', 'medium', 'strong'] as const).map((id) => ({
  id,
  label: STRENGTH_LABEL[id],
}));

export type FacetKey = 'base' | 'taste' | 'strength';

export const FACETS = {
  base: { title: 'База', options: BASES },
  taste: { title: 'Вкус', options: TASTES },
  strength: { title: 'Крепость', options: STRENGTHS },
} as const;

export function isFacetKey(value: string): value is FacetKey {
  return value in FACETS;
}

// --- Состояние фильтров (живёт в URL) ---

export type FilterState = {
  q: string;
  base: Base[];
  taste: Taste[];
  strength: Strength[];
  /** фильтр по ингредиенту из подсказки поиска («Ингредиент: Кампари») */
  ing: string | null;
  /** «Могу сделать» — только то, для чего всё есть в «Моём баре» */
  can: boolean;
  /** «Только избранное» */
  fav: boolean;
};

export const EMPTY_FILTERS: FilterState = { q: '', base: [], taste: [], strength: [], ing: null, can: false, fav: false };

function pickList<T extends string>(raw: string | null, allowed: readonly { id: T }[]): T[] {
  if (!raw) return [];
  const ids = new Set(allowed.map((o) => o.id));
  return raw.split(',').filter((v): v is T => ids.has(v as T));
}

export function parseFilters(params: URLSearchParams): FilterState {
  const ing = params.get('ing');
  return {
    q: params.get('q') ?? '',
    base: pickList(params.get('base'), BASES),
    taste: pickList(params.get('taste'), TASTES),
    strength: pickList(params.get('strength'), STRENGTHS),
    ing: ing && byId.has(ing) ? ing : null,
    can: params.get('can') === '1',
    fav: params.get('fav') === '1',
  };
}

export function filtersToParams(f: FilterState): Record<string, string> {
  const out: Record<string, string> = {};
  if (f.q.trim()) out.q = f.q;
  if (f.base.length) out.base = f.base.join(',');
  if (f.taste.length) out.taste = f.taste.join(',');
  if (f.strength.length) out.strength = f.strength.join(',');
  if (f.ing) out.ing = f.ing;
  if (f.can) out.can = '1';
  if (f.fav) out.fav = '1';
  return out;
}

/** Число выбранных значений во всех фасетах — бейдж на «Фильтры» (без текста поиска) */
export function activeCount(f: FilterState): number {
  return f.base.length + f.taste.length + f.strength.length + (f.ing ? 1 : 0) + (f.can ? 1 : 0) + (f.fav ? 1 : 0);
}

export function hasFacetFilters(f: FilterState): boolean {
  return activeCount(f) > 0;
}

/** Подпись фасета в ряду: «Вкус» → «Кислый» → «Кислый +1» [Google Drive] */
export function facetLabel(key: FacetKey, f: FilterState): string {
  const selected = f[key] as string[];
  const options = FACETS[key].options as readonly { id: string; label: string }[];
  if (!selected.length) return FACETS[key].title;
  const first = options.find((o) => o.id === selected[0])?.label ?? '';
  return selected.length > 1 ? `${first} +${selected.length - 1}` : first;
}

// --- Поиск ---

export function normalize(s: string): string {
  return s.toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
}

const haystacks = new WeakMap<Cocktail, string>();

function haystack(c: Cocktail): string {
  let h = haystacks.get(c);
  if (!h) {
    const parts = [c.name, c.nameEn];
    for (const i of c.ingredients) {
      parts.push(i.name);
      const def = byId.get(i.ref);
      if (def) parts.push(def.name, ...def.aliases);
    }
    h = normalize(parts.join(' | '));
    haystacks.set(c, h);
  }
  return h;
}

/** Все слова запроса должны найтись в названии RU/EN, ингредиентах или их синонимах */
export function matchesQuery(c: Cocktail, q: string): boolean {
  const words = normalize(q).split(' ').filter(Boolean);
  if (!words.length) return true;
  const h = haystack(c);
  return words.every((w) => h.includes(w));
}

/** canMake / isFav — «всё есть дома» и «в избранном» (сторы передаются снаружи, логика остаётся чистой) */
export function applyFilters(
  list: Cocktail[],
  f: FilterState,
  canMake?: (c: Cocktail) => boolean,
  isFav?: (c: Cocktail) => boolean,
): Cocktail[] {
  return list.filter(
    (c) =>
      (!f.can || (canMake?.(c) ?? false)) &&
      (!f.fav || (isFav?.(c) ?? false)) &&
      matchesQuery(c, f.q) &&
      (!f.base.length || f.base.includes(c.base)) &&
      (!f.taste.length || f.taste.some((t) => c.tags.includes(t))) &&
      (!f.strength.length || f.strength.includes(c.strength)) &&
      (!f.ing || c.ingredients.some((i) => i.ref === f.ing)),
  );
}

/** Подсказки-ингредиенты для запроса: по имени и синонимам, кроме «всегда есть» */
export function suggestIngredients(q: string, list: Cocktail[], limit = 2): IngredientDef[] {
  const n = normalize(q);
  if (n.length < 2) return [];
  const used = new Set(list.flatMap((c) => c.ingredients.map((i) => i.ref)));
  const score = (d: IngredientDef) => {
    const names = [d.name, ...d.aliases].map(normalize);
    if (names.some((x) => x === n)) return 0;
    if (names.some((x) => x.startsWith(n))) return 1;
    if (names.some((x) => x.includes(n))) return 2;
    return -1;
  };
  return ingredients
    .filter((d) => !d.pantry && used.has(d.id))
    .map((d) => [d, score(d)] as const)
    .filter(([, s]) => s >= 0)
    .sort((a, b) => a[1] - b[1] || a[0].name.localeCompare(b[0].name, 'ru'))
    .slice(0, limit)
    .map(([d]) => d);
}

export function popularIngredients(): IngredientDef[] {
  return ingredients.filter((d) => d.popular && !d.pantry);
}

/** «Похожие» для пустой выдачи: ослабляем фильтры — сначала только поиск, затем всё подряд */
export function similarFor(list: Cocktail[], f: FilterState, limit = 4): Cocktail[] {
  const relaxed = [
    applyFilters(list, { ...EMPTY_FILTERS, q: f.q }),
    applyFilters(list, { ...f, q: '' }),
    list.filter((c) => c.iba),
  ];
  return (relaxed.find((r) => r.length) ?? list).slice(0, limit);
}
