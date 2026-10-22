import { useCallback, useSyncExternalStore } from 'react';

export type Theme = 'dark' | 'light';

const KEY = 'bar-theme';
// = --bg темы (styles/index.css), для <meta name="theme-color">
const THEME_COLOR: Record<Theme, string> = { dark: '#0E0E10', light: '#F7F6F3' };
const listeners = new Set<() => void>();

function read(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // приватный режим — тема живёт до перезагрузки
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, read, () => 'dark' as Theme);
  const toggle = useCallback(() => setTheme(read() === 'dark' ? 'light' : 'dark'), []);
  return { theme, toggle };
}
