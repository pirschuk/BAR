import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

type Props = {
  title: string;
  action?: ReactNode;
  /** мета справа в строке заголовка (только l): «~3 мин», «≈ 90 мл» */
  meta?: string;
  /** m — title-2 (каталог, бар); l — дисплейный заголовок рецепта */
  size?: 'm' | 'l';
  className?: string;
};

/**
 * m: заголовок + действие/контрол справа в одну строку.
 * l: дисплейный заголовок + мета текстом справа; контрол — строкой ниже (Unbounded широкий: «Ингредиенты» + 1×/2×/4× в 358 не входят).
 */
export function SectionHeader({ title, action, meta, size = 'm', className }: Props) {
  if (size === 'l')
    return (
      <div className={cn('px-4', className)}>
        {/* мета — текстом по базовой линии заголовка [Withings, Yazio], без пилюли и иконки */}
        <div className="flex min-h-tap items-baseline justify-between gap-3 pt-2">
          <h2 className="font-display text-section text-fg">{title}</h2>
          {meta && <span className="shrink-0 text-subhead text-fg-2 tabular-nums">{meta}</span>}
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
