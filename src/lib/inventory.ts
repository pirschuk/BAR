import { useCallback, useSyncExternalStore } from 'react';
import type { Cocktail, IngredientDef, IngredientGroup, Method } from '../types/cocktail';
import { getIngredient, ingredients } from './filters';

// --- Инструменты: не в словаре ингредиентов, нужны по методу; рецепты НЕ блокируют, только подсказка ---

export type Tool = { id: string; name: string; methods: Method[]; substitute: string };

export const TOOLS: Tool[] = [
  { id: 'tool-shaker', name: 'Шейкер', methods: ['shake', 'dry-shake'], substitute: 'подойдёт банка с плотной крышкой' },
  { id: 'tool-muddler', name: 'Мадлер', methods: ['muddle'], substitute: 'подойдёт скалка или ручка деревянной ложки' },
  { id: 'tool-barspoon', name: 'Барная ложка', methods: ['stir'], substitute: 'подойдёт длинная чайная ложка' },
  { id: 'tool-blender', name: 'Блендер', methods: ['blend'], substitute: 'замены нет — без блендера не получится' },
];

export function toolsFor(c: Cocktail): Tool[] {
  return TOOLS.filter((t) => t.methods.includes(c.method));
}

// --- Группы «Моего бара» ---

export const BAR_GROUPS: { id: IngredientGroup; label: string }[] = [
  { id: 'spirit', label: 'Крепкий алкоголь' },
  { id: 'liqueur', label: 'Ликёры, вина и вермуты' },
  { id: 'bitter', label: 'Биттеры' },
  { id: 'syrup', label: 'Сиропы и сахар' },
  { id: 'juice-fruit', label: 'Соки, фрукты и травы' },
  { id: 'soda', label: 'Газировка и миксеры' },
  { id: 'other', label: 'Прочее' },
];

/** То, что можно отметить в баре: не «всегда есть» (вода, соль…), по алфавиту */
export function barItems(group: IngredientGroup): IngredientDef[] {
  return ingredients
    .filter((d) => d.group === group && !d.pantry)
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
}

export const QUICK_START = ['gin', 'white-rum', 'vodka', 'lime', 'lemon', 'simple-syrup', 'soda'];

// --- Наличие ---

export type Inventory = ReadonlySet<string>;

/** Недостающие ингредиенты рецепта: без «всегда есть» и необязательных */
export function missing(c: Cocktail, inv: Inventory): { ref: string; name: string }[] {
  const out = new Map<string, string>();
  for (const i of c.ingredients) {
    if (i.optional || inv.has(i.ref) || getIngredient(i.ref)?.pantry) continue;
    out.set(i.ref, getIngredient(i.ref)?.name ?? i.name);
  }
  return [...out].map(([ref, name]) => ({ ref, name }));
}

export function canMake(c: Cocktail, inv: Inventory): boolean {
  return inv.size > 0 && missing(c, inv).length === 0;
}

export function barSummary(list: Cocktail[], inv: Inventory): { can: number; nearly: number } {
  let can = 0;
  let nearly = 0;
  for (const c of list) {
    const n = missing(c, inv).length;
    if (n === 0) can++;
    else if (n === 1) nearly++;
  }
  return inv.size ? { can, nearly } : { can: 0, nearly: 0 };
}

// --- «Мой бар»: два раздела → подкатегории [Мой бар v2] ---

export type SectionKey = 'alcohol' | 'mixers';
export type SubKey = 'spirit' | 'liqueur' | 'bitter' | 'custom' | 'syrup' | 'juice-fruit' | 'soda' | 'other' | 'tools';

/** label — заголовок подкатегории; addLabel — «Добавить …» (винительный падеж) */
export type Sub = { id: SubKey; section: SectionKey; label: string; addLabel: string; group?: IngredientGroup };

export const SUBS: Sub[] = [
  { id: 'spirit', section: 'alcohol', label: 'Крепкий', addLabel: 'крепкий алкоголь', group: 'spirit' },
  { id: 'liqueur', section: 'alcohol', label: 'Ликёры, вина и вермуты', addLabel: 'ликёр или вермут', group: 'liqueur' },
  { id: 'bitter', section: 'alcohol', label: 'Биттеры', addLabel: 'биттер', group: 'bitter' },
  // свои бутылки без типа («Другое»)
  { id: 'custom', section: 'alcohol', label: 'Своё', addLabel: 'свою бутылку' },
  { id: 'syrup', section: 'mixers', label: 'Сиропы и сахар', addLabel: 'сироп', group: 'syrup' },
  { id: 'juice-fruit', section: 'mixers', label: 'Соки, фрукты и травы', addLabel: 'сок или фрукт', group: 'juice-fruit' },
  { id: 'soda', section: 'mixers', label: 'Газировка и миксеры', addLabel: 'газировку', group: 'soda' },
  { id: 'other', section: 'mixers', label: 'Прочее', addLabel: 'что-то ещё', group: 'other' },
  { id: 'tools', section: 'mixers', label: 'Инструменты', addLabel: 'инструмент' },
];

export const SECTIONS: { id: SectionKey; label: string; addLabel: string }[] = [
  { id: 'alcohol', label: 'Алкоголь', addLabel: 'алкоголь' },
  { id: 'mixers', label: 'Миксеры и прочее', addLabel: 'миксеры' },
];

export function isSectionKey(v: string | undefined): v is SectionKey {
  return v === 'alcohol' || v === 'mixers';
}

/** Подкатегория позиции: ингредиент — по группе словаря, инструмент — «Инструменты», бутылка без типа — «Своё» */
export function subOf(ref: string | null): SubKey {
  if (!ref) return 'custom';
  if (TOOLS.some((t) => t.id === ref)) return 'tools';
  const g = getIngredient(ref)?.group;
  return SUBS.find((s) => s.group === g)?.id ?? 'other';
}

export function sectionOf(ref: string | null): SectionKey {
  const sub = subOf(ref);
  return SUBS.find((s) => s.id === sub)!.section;
}

export const subsOf = (section: SectionKey) => SUBS.filter((s) => s.section === section);
export const subLabel = (id: SubKey) => SUBS.find((s) => s.id === id)!.label;

/** Порядок: по подкатегории (как в SUBS), затем по алфавиту — сравнивать вместе с именем */
export function subOrder(ref: string | null): number {
  return SUBS.findIndex((s) => s.id === subOf(ref));
}

// --- Свои бутылки: «Laphroaig 10» → тип «Шотландский виски» (ref) — рецепты видят тип ---

export type Bottle = { id: string; name: string; ref: string | null; note?: string };

/** Эффективный бар: отметки ∪ типы своих бутылок («Другое» — ref null — в рецептах не участвует) */
export function effectiveInventory(ids: Inventory, bottles: readonly Bottle[]): Inventory {
  const out = new Set(ids);
  for (const b of bottles) if (b.ref) out.add(b.ref);
  return out;
}

export function findBottle(bottles: readonly Bottle[], name: string): Bottle | undefined {
  const n = name.trim().toLowerCase().replace(/ё/g, 'е');
  return bottles.find((b) => b.name.trim().toLowerCase().replace(/ё/g, 'е') === n);
}

/** Сколько рецептов использует позицию: ингредиент — по ref, инструмент — по методу */
export function usage(ref: string, list: Cocktail[]): Cocktail[] {
  const tool = TOOLS.find((t) => t.id === ref);
  if (tool) return list.filter((c) => tool.methods.includes(c.method));
  return list.filter((c) => c.ingredients.some((i) => i.ref === ref));
}

/** «Советуем»: позиция, которая единственная не хватает в N рецептах — топ по N; only — фильтр (раздел) */
export function unlocks(
  list: Cocktail[],
  inv: Inventory,
  limit = 3,
  only: (ref: string) => boolean = () => true,
): { ref: string; name: string; count: number }[] {
  if (!inv.size) return [];
  const counts = new Map<string, { name: string; count: number }>();
  for (const c of list) {
    const m = missing(c, inv);
    if (m.length !== 1) continue;
    const [{ ref, name }] = m as [{ ref: string; name: string }];
    if (!only(ref)) continue;
    counts.set(ref, { name, count: (counts.get(ref)?.count ?? 0) + 1 });
  }
  return [...counts]
    .map(([ref, v]) => ({ ref, ...v }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ru'))
    .slice(0, limit);
}

// --- Хранение: localStorage, общий стор для всех экранов ---

const KEY = 'bar-inventory-v1';
const BOTTLES_KEY = 'bar-bottles-v1';
const listeners = new Set<() => void>();
let state: Inventory = load();
let bottles: readonly Bottle[] = loadBottles();
let effective: Inventory = effectiveInventory(state, bottles);
/** false — хранилище недоступно (приватный режим): бар живёт до закрытия вкладки */
export let inventoryPersisted = true;

function load(): Inventory {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return new Set(Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

function loadBottles(): Bottle[] {
  try {
    const raw = JSON.parse(localStorage.getItem(BOTTLES_KEY) ?? '[]');
    if (!Array.isArray(raw)) return [];
    return raw.filter(
      (b): b is Bottle =>
        !!b && typeof b.id === 'string' && typeof b.name === 'string' && (b.ref === null || (typeof b.ref === 'string' && !!getIngredient(b.ref))),
    );
  } catch {
    return [];
  }
}

function persist(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    inventoryPersisted = true;
  } catch {
    inventoryPersisted = false;
  }
}

function save(next: Inventory) {
  state = next;
  effective = effectiveInventory(state, bottles);
  persist(KEY, [...next]);
  listeners.forEach((l) => l());
}

function saveBottles(next: readonly Bottle[]) {
  bottles = next;
  effective = effectiveInventory(state, bottles);
  persist(BOTTLES_KEY, next);
  listeners.forEach((l) => l());
}

export function setInventory(next: Inventory) {
  save(next);
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/**
 * inv — эффективный бар (отметки ∪ типы бутылок): его видят рецепты, «Могу сделать», 🎲.
 * owned — только отметки (полка показывает их и бутылки отдельными строками).
 */
export function useInventory() {
  const inv = useSyncExternalStore(subscribe, () => effective, () => effective);
  const owned = useSyncExternalStore(subscribe, () => state, () => state);
  const myBottles = useSyncExternalStore(subscribe, () => bottles, () => bottles);
  const toggle = useCallback((id: string) => {
    const next = new Set(state);
    if (!next.delete(id)) next.add(id);
    save(next);
  }, []);
  const add = useCallback((ids: string[]) => save(new Set([...state, ...ids])), []);
  const remove = useCallback((id: string) => {
    const next = new Set(state);
    next.delete(id);
    save(next);
  }, []);
  /** новая бутылка; дубль по названию — возвращает существующую, не создаёт */
  const addBottle = useCallback((b: Omit<Bottle, 'id'>): Bottle => {
    const dup = findBottle(bottles, b.name);
    if (dup) return dup;
    const created = { ...b, name: b.name.trim(), id: `b-${Date.now().toString(36)}` };
    saveBottles([...bottles, created]);
    return created;
  }, []);
  const updateBottle = useCallback((b: Bottle) => saveBottles(bottles.map((x) => (x.id === b.id ? b : x))), []);
  const removeBottle = useCallback((id: string) => saveBottles(bottles.filter((x) => x.id !== id)), []);
  /** «Вернуть» после удаления */
  const restoreBottle = useCallback((b: Bottle) => saveBottles([...bottles.filter((x) => x.id !== b.id), b]), []);
  return { inv, owned, bottles: myBottles, toggle, add, remove, addBottle, updateBottle, removeBottle, restoreBottle };
}
