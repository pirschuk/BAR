import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

export type Param = { icon: LucideIcon; label: string; value: string; extra?: ReactNode };

/**
 * Параметры рецепта плитками 2×2 [Mindvalley, Vocabulary]: иконка в круге 32 → значение title-3 → подпись footnote.
 * Значение — одной строкой; если хоть одно длиннее LONG символов («Безалкогольный», «Медная кружка»),
 * вся сетка — кеглем headline (иначе не входит в плитку 171; кегль один на сетку). Влезание проверяет scripts/check-recipes.mjs на всех рецептах.
 */
const LONG = 11;

export function ParamTiles({ items, className }: { items: Param[]; className?: string }) {
  const valueSize = items.some((p) => p.value.length > LONG) ? 'text-headline' : 'text-title-3';
  return (
    <dl className={cn('grid grid-cols-2 gap-3', className)}>
      {items.map(({ icon: Icon, label, value, extra }) => (
        <div key={label} className="flex min-w-0 flex-col rounded-tile bg-tile p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-tile-strong">
              <Icon className="size-4 text-fg" aria-hidden />
            </span>
            {extra}
          </div>
          {/* порядок для чтения — подпись, затем значение; визуально значение выше */}
          <dt className="order-last mt-0.5 text-footnote text-fg-2">{label}</dt>
          <dd className={cn('mt-3 flex h-6.5 items-center whitespace-nowrap text-fg', valueSize)} data-param-value>
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** 4 деления крепости (по ABV: ≤10 · ≤18 · ≤26 · >26 %); слово — в значении плитки */
export function StrengthTicks({ level }: { level: 0 | 1 | 2 | 3 | 4 }) {
  return (
    <span className="flex w-14 gap-1" aria-hidden>
      {[1, 2, 3, 4].map((i) => (
        <span key={i} className={cn('h-1.5 flex-1 rounded-full', i <= level ? 'bg-accent' : 'bg-fg-3/60')} />
      ))}
    </span>
  );
}
