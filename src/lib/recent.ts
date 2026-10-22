// Недавние поисковые запросы — до 5, в localStorage. Без хранилища — просто пусто.
const KEY = 'bar-recent-searches';
const MAX = 5;

export function getRecent(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string').slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function addRecent(query: string): string[] {
  const q = query.trim();
  if (!q) return getRecent();
  const next = [q, ...getRecent().filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // приватный режим — недавние не сохраняются
  }
  return next;
}

export function clearRecent(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // нет хранилища — нечего чистить
  }
}
