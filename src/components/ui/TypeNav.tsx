import { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/cn';
import { Chip, ChipRow } from './Chip';

export type TypeNavItem = { id: string; label: string; count?: number };

/** id секции в DOM — чтобы чипсы находили, куда скроллить */
export const typeAnchor = (prefix: string, id: string) => `${prefix}-${id}`;

const prefersReduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Навигация по типам: чипсы-якоря (тап — прокрутка к секции, а не фильтр) + подсветка текущего типа при
 * скролле (scroll-spy). root — контейнер прокрутки (шторка); без него — окно. offset — высота липкого над секцией.
 */
export function TypeNav({
  items,
  prefix,
  offset,
  root,
  className,
  activeId,
}: {
  items: TypeNavItem[];
  prefix: string;
  offset: number;
  root?: () => HTMLElement | null;
  className?: string;
  /** для витрины */
  activeId?: string;
}) {
  const [active, setActive] = useState(activeId ?? items[0]?.id);
  const row = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeId) return;
    const scroller: HTMLElement | Window = root?.() ?? window;
    const onScroll = () => {
      const top = scroller instanceof Window ? 0 : scroller.getBoundingClientRect().top;
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
  }, [items, prefix, offset, root, activeId]);

  // активный чип — в видимой части ряда
  useEffect(() => {
    row.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ inline: 'nearest', block: 'nearest' });
  }, [active]);

  const go = (id: string) => {
    const el = document.getElementById(typeAnchor(prefix, id));
    if (!el) return;
    const scroller = root?.();
    const behavior: ScrollBehavior = prefersReduced() ? 'auto' : 'smooth';
    if (scroller) scroller.scrollTo({ top: el.offsetTop - offset, behavior });
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
