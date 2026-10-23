import { useCallback, useSyncExternalStore } from 'react';
import { getCocktail } from './cocktails';

// --- Избранное: localStorage, новые — в начале (порядок ряда в «Моём баре» = порядок добавления) ---

const KEY = 'bar-favorites-v1';
const listeners = new Set<() => void>();
let state: readonly string[] = load();
/** false — хранилище недоступно (приватный режим): избранное живёт до закрытия вкладки */
export let favoritesPersisted = true;

/** Чистая нормализация: только строки, без повторов, без id, которых больше нет в базе */
export function sanitizeFavorites(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const ids = raw.filter((x): x is string => typeof x === 'string' && !!getCocktail(x));
  return [...new Set(ids)];
}

/** Переключение: добавленный — в начало списка */
export function toggleFavorite(list: readonly string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [id, ...list];
}

function load(): readonly string[] {
  try {
    return sanitizeFavorites(JSON.parse(localStorage.getItem(KEY) ?? '[]'));
  } catch {
    return [];
  }
}

function save(next: readonly string[]) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
    favoritesPersisted = true;
  } catch {
    favoritesPersisted = false;
  }
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  // другая вкладка изменила избранное — подтягиваем
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    state = load();
    l();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener('storage', onStorage);
  };
};

export function useFavorites() {
  const list = useSyncExternalStore(subscribe, () => state, () => state);
  const has = useCallback((id: string) => list.includes(id), [list]);
  /** возвращает true, если коктейль добавлен (для тоста) */
  const toggle = useCallback((id: string) => {
    const next = toggleFavorite(state, id);
    save(next);
    return next.includes(id);
  }, []);
  return { list, has, toggle };
}
