import { useEffect, useRef, useState } from 'react';

import { cn } from '../../lib/cn';
import { Chip, ChipRow } from './Chip';

export type TypeNavItem = { id: string; label: string; count?: number };

/** id секции в DOM — чтобы чипсы находили, куда скроллить */
export const typeAnchor = (prefix: string, id: string) => `${prefix}-${id}`;

/** Ближайший прокручиваемый предок (шторка) или окно */
function scrollParent(el: HTMLElement | null): HTMLElement | null {
  for (let n = el?.parentElement; n; n = n.parentElement) {
    const oy = getComputedStyle(n).overflowY;
    if ((oy === 'auto' || oy === 'scroll') && n.scrollHeight > n.clientHeight) return n;
  }
  return null;
}

const prefersReduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Навигация по типам: чипсы-якоря (тап — прокрутка к секции, а не фильтр) + подсветка текущего типа при
 * скролле (scroll-spy). Контейнер прокрутки находится сам (шторка или окно). offset — высота липкого над секцией.
 */
export function TypeNav({
  items,
  prefix,
  offset,
  className,
  activeId,
}: {
  items: TypeNavItem[];
  prefix: string;
  offset: number;
  className?: string;
  /** для витрины */
  activeId?: string;
}) {
  const [active, setActive] = useState(activeId ?? items[0]?.id);
  const row = useRef<HTMLDivElement>(null);
  // пока идёт прокрутка от тапа по чипсу — подсветку не трогаем (иначе мелькают промежуточные типы)
  const target = useRef<string | null>(null);
  const settle = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (activeId) return;
    const first = document.getElementById(typeAnchor(prefix, items[0]?.id ?? ''));
    const scroller: HTMLElement | Window = scrollParent(first) ?? window;
    const onScroll = () => {
      if (target.current) {
        clearTimeout(settle.current);
        settle.current = setTimeout(() => (target.current = null), 150);
        return;
      }
      const top = scroller instanceof Window ? 0 : scroller.getBoundingClientRect().top;
      // докрутили до конца — последний тип (короткая последняя секция до верха не доедет)
      const atEnd =
        scroller instanceof Window
          ? window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
          : scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2;
      const scrolled = scroller instanceof Window ? window.scrollY > 0 : scroller.scrollTop > 0;
      if (atEnd && scrolled) {
        setActive(items[items.length - 1]?.id);
        return;
      }
      let current = items[0]?.id;
      for (const it of items) {
        const el = document.getElementById(typeAnchor(prefix, it.id));
        if (el && el.getBoundingClientRect().top - top <= offset + 8) current = it.id;
      }
      setActive(current);
    };
    onScroll();
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => scroller.removeEventListener('scroll', onScroll);
  }, [items, prefix, offset, activeId]);

  // активный чип — в видимой части ряда. Только горизонтально и вручную: scrollIntoView прервал бы
  // плавную прокрутку списка к выбранному типу (а с ней и сами якоря)
  useEffect(() => {
    const chip = row.current?.querySelector<HTMLElement>('[aria-current="true"]');
    const strip = chip?.parentElement;
    if (!chip || !strip) return;
    const l = chip.offsetLeft - 16;
    const r = chip.offsetLeft + chip.offsetWidth + 16 - strip.clientWidth;
    if (strip.scrollLeft > l) strip.scrollTo({ left: l });
    else if (strip.scrollLeft < r) strip.scrollTo({ left: r });
  }, [active]);

  const go = (id: string) => {
    const el = document.getElementById(typeAnchor(prefix, id));
    if (!el) return;
    const scroller = scrollParent(el);
    const behavior: ScrollBehavior = prefersReduced() ? 'auto' : 'smooth';
    target.current = id;
    clearTimeout(settle.current);
    settle.current = setTimeout(() => (target.current = null), 1000);
    if (scroller) scroller.scrollTo({ top: scroller.scrollTop + el.getBoundingClientRect().top - scroller.getBoundingClientRect().top - offset, behavior });
    else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior });
    setActive(id);
  };

  return (
    <div ref={row} className={cn(className)}>
      <ChipRow label="Типы">
        {items.map((it) => (
          <Chip key={it.id} selected={active === it.id} aria-current={active === it.id} onClick={() => go(it.id)}>
            {it.label}
            {it.count !== undefined && <span className={cn('tabular-nums', active === it.id ? 'opacity-70' : 'text-fg-2')}>{it.count}</span>}
          </Chip>
        ))}
      </ChipRow>
    </div>
  );
}
