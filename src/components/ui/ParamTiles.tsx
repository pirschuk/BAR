import { Info, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

export type Param = {
  icon: LucideIcon;
  label: string;
  value: string;
  /** цвет значения (крепость) */
  tone?: string;
  /** тап — статья «Барной азбуки» (бокал, метод, лёд); значок ⓘ у подписи */
  onClick?: () => void;
};

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
      {items.map(({ icon: Icon, label, value, tone, onClick }) => (
        <div key={label} className={cn('relative flex min-w-0 flex-col gap-2 rounded-tile bg-tile px-4 py-3.5', onClick && 'pressable')}>
          <dt className="flex items-center gap-1.5 text-footnote text-fg-2">
            <Icon className="size-4 shrink-0" aria-hidden />
            {label}
            {onClick && <Info className="ml-auto size-4 shrink-0 text-fg-3" aria-hidden />}
          </dt>
          {/* вся плитка — тач-зона статьи */}
          {onClick && <button type="button" onClick={onClick} aria-label={`${label} «${value}» — что это`} className="absolute inset-0 rounded-tile" />}
          <dd className={cn('flex h-6.5 items-center whitespace-nowrap', valueSize, tone ?? 'text-fg')} data-param-value>
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
