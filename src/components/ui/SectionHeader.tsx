import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

type Props = {
  title: string;
  action?: ReactNode;
  /** мета справа в строке заголовка: «~3 мин», счётчик, ссылка «Все 3 ›» */
  meta?: ReactNode;
  /** счётчик у заголовка по базовой линии («Сиропы и сахар  1») — не путается с «+» справа */
  count?: number;
  /** кнопка в строке заголовка после меты — «+» подкатегории [talabat] */
  trailing?: ReactNode;
  /** m — title-2 (каталог, бар); l — дисплейный заголовок рецепта */
  size?: 'm' | 'l';
  className?: string;
};

/**
 * m: заголовок + действие/контрол справа в одну строку.
 * l: дисплейный заголовок + мета текстом справа; контрол — строкой ниже (Unbounded широкий: «Ингредиенты» + 1×/2×/4× в 358 не входят).
 */
export function SectionHeader({ title, action, meta, trailing, count, size = 'm', className }: Props) {
  if (size === 'l')
    return (
      <div className={cn('px-4', className)}>
        {/* мета — текстом по базовой линии заголовка [Withings, Yazio], без пилюли и иконки */}
        <div className="flex min-h-tap items-baseline justify-between gap-3 pt-2">
          <h2 className="font-display text-section text-fg">{title}</h2>
          {(meta !== undefined || trailing) && (
            <span className="flex shrink-0 items-baseline gap-3">
              {meta !== undefined && <span className="text-subhead text-fg-2 tabular-nums">{meta}</span>}
              {trailing && <span className="self-center">{trailing}</span>}
            </span>
          )}
        </div>
        {action && <div className="mt-2">{action}</div>}
      </div>
    );
  return (
    <div className={cn('flex min-h-tap items-center justify-between gap-3 px-4', className)}>
      <h2 className="text-title-2 text-fg">
        {title}
        {count !== undefined && <span className="ml-2 text-subhead font-normal text-fg-2 tabular-nums">{count}</span>}
      </h2>
      {(meta !== undefined || trailing) && (
        <span className="flex shrink-0 items-center gap-3">
          {meta !== undefined && <span className="text-subhead text-fg-2 tabular-nums">{meta}</span>}
          {trailing}
        </span>
      )}
      {action}
    </div>
  );
}
