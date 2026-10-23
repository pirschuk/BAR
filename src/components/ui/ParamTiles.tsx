import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

export type Param = { icon: LucideIcon; label: string; value: string; /** цвет значения (крепость) */ tone?: string };

/**
 * Параметры рецепта плитками 2×2 [Mindvalley, Vocabulary]: сверху подпись с иконкой («Бокал»), под ней значение
 * («Рокс») — читается сверху вниз. Значение — одной строкой; если хоть одно длиннее LONG символов
 * («Безалкогольный», «Медная кружка»), вся сетка — кеглем headline (кегль один на сетку).
 * Влезание проверяет scripts/check-recipes.mjs на всех рецептах.
 */
const LONG = 11;

export function ParamTiles({ items, className }: { items: Param[]; className?: string }) {
  const valueSize = items.some((p) => p.value.length > LONG) ? 'text-headline' : 'text-title-3';
  return (
    <dl className={cn('grid grid-cols-2 gap-3', className)}>
      {items.map(({ icon: Icon, label, value, tone }) => (
        <div key={label} className="flex min-w-0 flex-col gap-2 rounded-tile bg-tile px-4 py-3.5">
          <dt className="flex items-center gap-1.5 text-footnote text-fg-2">
            <Icon className="size-4 shrink-0" aria-hidden />
            {label}
          </dt>
          <dd className={cn('flex h-6.5 items-center whitespace-nowrap', valueSize, tone ?? 'text-fg')} data-param-value>
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
