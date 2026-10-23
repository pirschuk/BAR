import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Check, ChevronDown, Plus, X, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

/**
 * filter    — чипс в ряду каталога (выбран — акцент)
 * facet     — фасет с ⌄; выбран — акцент и значение вместо названия [Viator, Google Drive]
 * option    — вариант в шторке: «+» → «✓» — действие видно до тапа [Cherrypick]
 * removable — активный элемент с «×», тап снимает [Kitchen Stories]
 */
export type ChipVariant = 'filter' | 'facet' | 'option' | 'removable';

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ChipVariant;
  selected?: boolean;
  pressed?: boolean;
  icon?: LucideIcon;
  /** доп. классы иконки: «♥ Избранное» — `fill-current text-accent` */
  iconClassName?: string;
  /** число на бейдже (например, активные фильтры) */
  badge?: number;
};

/** Чипс: визуально 36, тач-зона 44, pill */
export function Chip({ variant = 'filter', selected = false, pressed, icon: Icon, iconClassName, badge, className, children, type = 'button', ...rest }: ChipProps) {
  const filled = selected || variant === 'removable';
  return (
    <button
      type={type}
      aria-pressed={variant === 'removable' ? undefined : selected}
      data-pressed={pressed || undefined}
      className={cn(
        'pressable hit-44 inline-flex h-chip shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-subhead font-medium whitespace-nowrap select-none',
        'disabled:pointer-events-none disabled:opacity-40',
        // язык v2: плитки без рамок
        variant === 'removable'
          ? 'border-transparent bg-tile-strong text-fg'
          : filled
            ? 'border-transparent bg-accent text-accent-fg'
            : 'border-transparent bg-tile text-fg',
        (variant === 'option' || Icon) && 'pl-3',
        (variant === 'facet' || variant === 'removable') && 'pr-3',
        className,
      )}
      {...rest}
    >
      {variant === 'option' && (selected ? <Check className="size-4" strokeWidth={2.5} aria-hidden /> : <Plus className="size-4" aria-hidden />)}
      {Icon && <Icon className={cn('size-4', iconClassName)} aria-hidden />}
      {children}
      {badge !== undefined && badge > 0 && (
        <span
          className={cn(
            'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-caption tabular-nums',
            filled ? 'bg-accent-fg text-accent' : 'bg-accent text-accent-fg',
          )}
        >
          {badge}
        </span>
      )}
      {variant === 'facet' && <ChevronDown className="size-4 opacity-70" aria-hidden />}
      {variant === 'removable' && <X className="size-4" aria-hidden />}
    </button>
  );
}

/** Горизонтальный ряд чипсов: скролл без скроллбара, края экрана 16px, ряд уходит за правый край */
export function ChipRow({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn('no-scrollbar flex items-center gap-2 overflow-x-auto scroll-px-4 px-4 py-1', className)}
    >
      {children}
    </div>
  );
}

/** Вертикальный разделитель 1×20 между «Фильтры» и фасетами [NYT Cooking] */
export function ChipDivider() {
  return <span className="h-5 w-px shrink-0 bg-border" aria-hidden />;
}

/** Wrap-группа чипсов (шторка, «Мой бар», популярное в поиске) */
export function ChipWrap({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div role="group" aria-label={label} className={cn('flex flex-wrap gap-2 px-4', className)}>
      {children}
    </div>
  );
}
