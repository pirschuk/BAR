import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

type Props = {
  title: string;
  action?: ReactNode;
  /** мета-пилюля (только l): «4 шага · ~3 мин» [MacroFactor] */
  meta?: string;
  /** m — title-2 (каталог, бар); l — дисплейный заголовок рецепта */
  size?: 'm' | 'l';
  className?: string;
};

/**
 * m: заголовок + действие/контрол справа в одну строку.
 * l: дисплейный заголовок, контрол/пилюля — строкой ниже (Unbounded широкий: «Ингредиенты» + 1×/2×/4× в 358 не входят).
 */
export function SectionHeader({ title, action, meta, size = 'm', className }: Props) {
  if (size === 'l')
    return (
      <div className={cn('px-4', className)}>
        <h2 className="font-display text-section text-fg">{title}</h2>
        {(meta || action) && (
          <div className="mt-3 flex items-center gap-3">
            {meta && <span className="inline-flex h-7 items-center rounded-full bg-tile-strong px-3 text-footnote text-fg tabular-nums">{meta}</span>}
            {action}
          </div>
        )}
      </div>
    );
  return (
    <div className={cn('flex min-h-tap items-center justify-between gap-3 px-4', className)}>
      <h2 className="text-title-2 text-fg">{title}</h2>
      {action}
    </div>
  );
}
