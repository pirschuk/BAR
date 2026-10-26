// --- Движение: платформа (iOS / Android), направление перехода страниц, тактильный отклик ---
//
// Переходы страниц — View Transitions (react-router `viewTransition`). Анимацию выбирает CSS по двум атрибутам <html>:
//   data-platform = ios | android — язык движения (UIKit или Material 3), токены в index.css;
//   data-nav = forward | back | tab | grid | none — что за переход сейчас.

export type Platform = 'ios' | 'android';
export type NavKind = 'forward' | 'back' | 'tab' | 'grid' | 'none';

const OVERRIDE_KEY = 'bar-motion-platform';

/** iPhone / iPad (в т. ч. iPadOS с десктопным UA) → ios; остальное — язык Material */
export function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  return ios ? 'ios' : 'android';
}

/** Ручной выбор с витрины (null — автоматически) */
export function platformOverride(): Platform | null {
  try {
    const v = localStorage.getItem(OVERRIDE_KEY);
    return v === 'ios' || v === 'android' ? v : null;
  } catch {
    return null;
  }
}

export function setPlatformOverride(p: Platform | null) {
  try {
    if (p) localStorage.setItem(OVERRIDE_KEY, p);
    else localStorage.removeItem(OVERRIDE_KEY);
  } catch {
    // приватный режим — выбор живёт до перезагрузки
  }
  applyPlatform(p ?? detectPlatform());
}

export const currentPlatform = (): Platform => (document.documentElement.dataset.platform as Platform) ?? 'android';

function applyPlatform(p: Platform) {
  document.documentElement.dataset.platform = p;
}

/** Установленное приложение (с экрана «Домой») — не вкладка браузера */
export const isStandalone = () =>
  matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

let reset: ReturnType<typeof setTimeout> | undefined;

const resetNav = () => (document.documentElement.dataset.nav = 'forward');

/**
 * Вид следующего перехода. Сбрасывается к forward, когда переход закончился (см. initMotion);
 * запасной таймер — если перехода не было (браузер без View Transitions, навигация без анимации).
 */
export function setNav(kind: NavKind) {
  document.documentElement.dataset.nav = kind;
  clearTimeout(reset);
  reset = setTimeout(() => !transitioning && resetNav(), 2000);
}
let transitioning = false;

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
const TAB_ROOTS = new Set(['/', '/bar']);
/** Обе страницы — корни вкладок: переход между ними — «вкладка», а не вглубь */
const isTabSwitch = (from: string, to: string) => from !== to && TAB_ROOTS.has(from.slice(BASE.length) || '/') && TAB_ROOTS.has(to.slice(BASE.length) || '/');

/**
 * Ставится до создания роутера: popstate приходит раньше, чем роутер запустит переход.
 * Назад по истории — back; если сменился только хэш (закрыли шторку) — без перехода страницы.
 */
export function initMotion() {
  applyPlatform(platformOverride() ?? detectPlatform());
  document.documentElement.dataset.nav = 'forward';
  let path = location.pathname;
  window.addEventListener('popstate', () => {
    setNav(location.pathname === path ? 'none' : isTabSwitch(path, location.pathname) ? 'tab' : 'back');
    path = location.pathname;
  });
  // переходы вперёд: роутер пишет историю до старта перехода — между вкладками ставим «вкладку» (Каталог ↔ Мой бар, ссылки в карточках)
  const sync = () => {
    if (isTabSwitch(path, location.pathname)) setNav('tab');
    path = location.pathname;
  };
  // конец перехода → направление по умолчанию
  const start = document.startViewTransition?.bind(document);
  if (start)
    document.startViewTransition = ((arg: Parameters<typeof start>[0]) => {
      transitioning = true;
      const t = start(arg);
      t.finished.finally(() => {
        transitioning = false;
        resetNav();
      });
      return t;
    }) as typeof start;
  for (const m of ['pushState', 'replaceState'] as const) {
    const orig = history[m].bind(history);
    history[m] = (...args: Parameters<History['pushState']>) => {
      orig(...args);
      sync();
    };
  }
}

/** Короткий тактильный отклик: Android — вибрация 10 мс; iPhone из веба вибрацию не даёт — остаётся визуальный pressed */
export const haptic = () => navigator.vibrate?.(10);
