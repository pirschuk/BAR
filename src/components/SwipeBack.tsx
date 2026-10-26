import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate, useNavigationType, useRoutes, type Location, type RouteObject } from 'react-router';
import { currentPlatform, isStandalone, skipNextBack } from '../lib/motion';

// --- Свайп назад от левого края — как в iOS. В установленном PWA на iPhone системного жеста «назад» нет. ---

/** true — страница рисуется «призраком» под уезжающей: без побочных эффектов (переходов, тостов) */
const GhostContext = createContext(false);
export const useIsGhost = () => useContext(GhostContext);

const EDGE = 24; // зона захвата у левого края, px
const COMMIT = 1 / 3; // доля ширины, после которой отпускание уводит назад
const FLICK = 0.5; // px/мс — быстрый смах уводит и с короткого хода
const PARALLAX = 0.3; // предыдущая страница стоит на 30% левее и догоняет
const FORCE_KEY = 'bar-swipe-back'; // '1' — включить вне standalone (витрина, тесты)

/** Стек истории текущей вкладки (ключи location) и позиции скролла — для «призрака» предыдущей страницы */
function useHistoryStack() {
  const location = useLocation();
  const type = useNavigationType();
  const stack = useRef<Location[]>([]);
  const scroll = useRef(new Map<string, number>());
  const s = stack.current;
  const top = s[s.length - 1];
  if (top?.key !== location.key) {
    if (type === 'POP') {
      const i = s.findIndex((l) => l.key === location.key);
      if (i >= 0) s.length = i + 1;
      else s.push(location);
    } else if (type === 'REPLACE' && s.length) s[s.length - 1] = location;
    else s.push(location);
  }
  useEffect(() => {
    const save = () => scroll.current.set(location.key, window.scrollY);
    window.addEventListener('scroll', save, { passive: true });
    return () => window.removeEventListener('scroll', save);
  }, [location.key]);
  const prev = s.length > 1 ? s[s.length - 2] : undefined;
  return { prev, prevScroll: prev ? (scroll.current.get(prev.key) ?? 0) : 0 };
}

function Ghost({ routes, location }: { routes: RouteObject[]; location: Location }) {
  return <GhostContext.Provider value>{useRoutes(routes, location)}</GhostContext.Provider>;
}

type Props = {
  /** страницы приложения — те же, что у роутера (без витрины) */
  routes: RouteObject[];
  /** с каких страниц жест не работает (корни вкладок — у них нет «назад») */
  disabledOn: (pathname: string) => boolean;
  /** то, что рисуется под предыдущей страницей поверх неё (таб-бар корня) */
  ghostChrome?: (pathname: string) => ReactNode;
  children: ReactNode;
};

/**
 * Страница едет за пальцем, под ней — **настоящая предыдущая страница** на своей позиции скролла (сдвинута на 30%
 * и притемнена, догоняет). Отпустил дальше трети или смахнул — уходит назад; иначе возвращается.
 * Только iOS в standalone: во вкладке Safari этот жест делает сам браузер.
 */
export function SwipeBack({ routes, disabledOn, ghostChrome, children }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const { prev, prevScroll } = useHistoryStack();
  // page — слой, который едет (fixed-элементы страницы привязаны к нему); scroller — свой скролл страницы внутри
  const page = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const ghost = useRef<HTMLDivElement>(null);
  const ghostScroller = useRef<HTMLDivElement>(null);
  /** куда вернуть скролл после ухода назад: роутер восстанавливает его, пока страница ещё зафиксирована */
  const restore = useRef<number | null>(null);
  const shade = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const pageScroll = useRef(0);

  const enabled = (() => {
    let forced = false;
    try {
      forced = localStorage.getItem(FORCE_KEY) === '1';
    } catch {
      // нет хранилища — только standalone
    }
    return !!prev && !disabledOn(location.pathname) && currentPlatform() === 'ios' && (forced || isStandalone());
  })();

  // смена страницы (ушли назад) — снять фиксацию и призрака в том же кадре, что и новая страница
  useLayoutEffect(() => {
    page.current?.removeAttribute('style');
    scroller.current?.removeAttribute('style');
    setActive(false);
    if (restore.current !== null) {
      window.scrollTo(0, restore.current);
      restore.current = null;
    }
  }, [location.key]);

  useEffect(() => {
    if (!enabled) return;
    const width = () => window.innerWidth;
    let startX = 0;
    let startY = 0;
    let dx = 0;
    let mode: 'idle' | 'pending' | 'drag' = 'idle';
    let last = { x: 0, t: 0, v: 0 };

    const apply = (x: number, animate: boolean) => {
      const el = page.current;
      if (!el) return;
      const p = Math.min(1, Math.max(0, x / width()));
      const t = animate ? 'transform 250ms cubic-bezier(0.32, 0.72, 0, 1), opacity 250ms' : 'none';
      el.style.transition = t;
      el.style.transform = `translateX(${x}px)`;
      if (ghost.current) {
        ghost.current.style.transition = t;
        ghost.current.style.transform = `translateX(${(p - 1) * PARALLAX * 100}%)`;
      }
      if (shade.current) {
        shade.current.style.transition = t;
        shade.current.style.opacity = String(1 - p);
      }
    };

    // фиксируем страницу в размер экрана: fixed-элементы (навбар) держатся за слой и едут с ним, контент — на своём скролле
    const lift = () => {
      const el = page.current;
      const sc = scroller.current;
      if (!el || !sc) return;
      pageScroll.current = window.scrollY;
      Object.assign(el.style, { position: 'fixed', inset: '0', margin: '0 auto', maxWidth: 'var(--spacing-app)', overflow: 'hidden', zIndex: '40', background: 'var(--bg)', boxShadow: '-8px 0 24px rgb(0 0 0 / 0.5)' });
      Object.assign(sc.style, { position: 'absolute', inset: '0', overflowY: 'auto' });
      sc.scrollTop = pageScroll.current;
      setActive(true);
    };
    const drop = () => {
      page.current?.removeAttribute('style');
      scroller.current?.removeAttribute('style');
      window.scrollTo(0, pageScroll.current);
      setActive(false);
    };

    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (e.touches.length !== 1 || !t || t.clientX > EDGE || document.querySelector('[role=dialog][aria-modal]')) return;
      mode = 'pending';
      startX = t.clientX;
      startY = t.clientY;
      dx = 0;
      last = { x: t.clientX, t: e.timeStamp, v: 0 };
    };
    const onMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (mode === 'idle' || !t) return;
      const mx = t.clientX - startX;
      const my = t.clientY - startY;
      if (mode === 'pending') {
        if (Math.abs(my) > 10 && Math.abs(my) > Math.abs(mx)) return void (mode = 'idle');
        if (mx < 8) return;
        mode = 'drag';
        lift();
      }
      e.preventDefault();
      const dt = e.timeStamp - last.t;
      if (dt > 0) last = { x: t.clientX, t: e.timeStamp, v: (t.clientX - last.x) / dt };
      dx = Math.max(0, mx);
      apply(dx, false);
    };
    const onEnd = () => {
      if (mode !== 'drag') return void (mode = 'idle');
      mode = 'idle';
      const commit = dx > width() * COMMIT || last.v > FLICK;
      apply(commit ? width() : 0, true);
      setTimeout(() => {
        if (!commit) return drop();
        // анимацию уже показали пальцем — переход страницы без повторной анимации
        skipNextBack();
        restore.current = prevScrollRef.current;
        navigate(-1);
        // уход заблокирован (несохранённая форма) — вернуть страницу на место
        setTimeout(() => page.current?.style.position && drop(), 400);
      }, 250);
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
  }, [enabled, navigate]);

  const prevScrollRef = useRef(prevScroll);
  prevScrollRef.current = prevScroll;
  // призрак встаёт на свою позицию скролла
  useLayoutEffect(() => {
    if (active && ghostScroller.current) ghostScroller.current.scrollTop = prevScroll;
  }, [active, prevScroll]);

  return (
    <>
      {active && prev && (
        <div ref={ghost} inert className="fixed inset-0 z-30 mx-auto max-w-app overflow-hidden bg-bg" style={{ transform: `translateX(-${PARALLAX * 100}%)` }}>
          <div ref={ghostScroller} className="no-scrollbar absolute inset-0 overflow-y-auto">
            <Ghost routes={routes} location={prev} />
          </div>
          {ghostChrome?.(prev.pathname)}
          <div ref={shade} className="pointer-events-none fixed inset-0 bg-scrim" />
        </div>
      )}
      <div ref={page}>
        <div ref={scroller} className="no-scrollbar">
          {children}
        </div>
      </div>
    </>
  );
}
