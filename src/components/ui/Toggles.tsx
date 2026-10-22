import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/cn';

/** Визуальный переключатель iOS 51×31 (сам не кликабелен — им управляет строка) */
export function SwitchTrack({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={cn('relative inline-flex h-switch-h w-switch-w shrink-0 rounded-full transition-colors', on ? 'bg-accent' : 'bg-fg-3/35')}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 size-switch-thumb rounded-full bg-on-media shadow-md transition-transform',
          on && 'translate-x-5',
        )}
      />
    </span>
  );
}

/** Визуальный чекбокс 24 (как в чек-листе ингредиентов) */
export function CheckBox({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-6 shrink-0 items-center justify-center rounded-check border-2 transition-colors',
        on ? 'border-accent bg-accent text-accent-fg' : 'border-fg-3',
      )}
    >
      {on && <Check className="size-4" strokeWidth={3} />}
    </span>
  );
}

type RowProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  on: boolean;
  onToggle: () => void;
  disabled?: boolean;
  pressed?: boolean;
};

/** Строка-переключатель ≥ 52: заголовок + подпись + switch; вся строка — тач-зона [Mindtrip] */
export function SwitchRow({ title, subtitle, on, onToggle, disabled, pressed }: RowProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      data-pressed={pressed || undefined}
      onClick={onToggle}
      className="pressable flex min-h-row-l w-full items-center gap-3 px-4 py-2 text-left disabled:opacity-40"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-body text-fg">{title}</span>
        {subtitle && <span className="block text-footnote text-fg-2">{subtitle}</span>}
      </span>
      <SwitchTrack on={on} />
    </button>
  );
}

/** Строка-галочка ≥ 52: чекбокс слева, заголовок + подпись — «Могу сделать» в фильтрах */
export function CheckRow({ title, subtitle, on, onToggle, disabled, pressed }: RowProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      disabled={disabled}
      data-pressed={pressed || undefined}
      onClick={onToggle}
      className="pressable flex min-h-row-l w-full items-center gap-3 px-4 py-2 text-left disabled:cursor-default"
    >
      <span className={cn('contents', disabled && '[&>*]:opacity-40')}>
        <CheckBox on={on} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block text-body', disabled ? 'text-fg-3' : 'text-fg')}>{title}</span>
        {subtitle && <span className="block text-footnote text-fg-2">{subtitle}</span>}
      </span>
    </button>
  );
}
