import type { ReactNode } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '../../lib/cn';

type Props = {
  title: string;
  action?: ReactNode;
  /** мета-пилюля справа от заголовка (только l): «~3 мин» [MacroFactor] */
  meta?: string;
  /** m — title-2 (каталог, бар); l — дисплейный заголовок рецепта */
  size?: 'm' | 'l';
  className?: string;
};

/**
 * m: заголовок + действие/контрол справа в одну строку.
 * l: дисплейный заголовок + мета-пилюля справа; контрол — строкой ниже (Unbounded широкий: «Ингредиенты» + 1×/2×/4× в 358 не входят).
 */
export function SectionHeader({ title, action, meta, size = 'm', className }: Props) {
  if (size === 'l')
    return (
      <div className={cn('px-4', className)}>
        <div className="flex min-h-tap items-center justify-between gap-3">
          <h2 className="font-display text-section text-fg">{title}</h2>
          {meta && (
            <span className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full bg-tile-strong px-3 text-footnote text-fg tabular-nums">
              <Clock className="size-3.5" aria-hidden />
              {meta}
            </span>
          )}
        </div>
        {action && <div className="mt-2">{action}</div>}
      </div>
    );
  return (
    <div className={cn('flex min-h-tap items-center justify-between gap-3 px-4', className)}>
      <h2 className="text-title-2 text-fg">{title}</h2>
      {action}
    </div>
  );
}
