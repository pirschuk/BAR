import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

/**
 * Горизонтальная лента карточек [Google — Saved, Insight Timer]: ширина 140, gap 12, поля 16,
 * следующая карточка выглядывает; прилипание к началу карточки.
 */
export function CardRail({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <ul aria-label={label} className={cn('no-scrollbar flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4', className)}>
      {children}
    </ul>
  );
}

export function CardRailItem({ children }: { children: ReactNode }) {
  return <li className="w-35 shrink-0 snap-start">{children}</li>;
}
