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

// --- Хранение: localStorage, общий стор для всех экранов ---

const KEY = 'bar-inventory-v1';
const listeners = new Set<() => void>();
let state: Inventory = load();
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

function save(next: Inventory) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify([...next]));
    inventoryPersisted = true;
  } catch {
    inventoryPersisted = false;
  }
  listeners.forEach((l) => l());
}

export function setInventory(next: Inventory) {
  save(next);
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useInventory() {
  const inv = useSyncExternalStore(subscribe, () => state, () => state);
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
  return { inv, toggle, add, remove };
}
