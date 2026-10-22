import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
  pressed?: boolean;
};

/** Чипс фильтра: визуально 36, тач-зона 44, pill */
export function Chip({ selected = false, pressed, className, children, type = 'button', ...rest }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      data-pressed={pressed || undefined}
      className={cn(
        'pressable hit-44 inline-flex h-chip shrink-0 items-center rounded-full border px-3.5 text-subhead font-medium whitespace-nowrap select-none',
        'disabled:pointer-events-none disabled:opacity-40',
        selected ? 'border-transparent bg-accent text-accent-fg' : 'border-border bg-surface-2 text-fg',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Горизонтальный ряд чипсов: скролл без скроллбара, края экрана 16px, ряд уходит за правый край */
export function ChipRow({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn('no-scrollbar flex gap-2 overflow-x-auto scroll-px-4 px-4 py-1', className)}
    >
      {children}
    </div>
  );
}
