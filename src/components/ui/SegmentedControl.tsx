import { cn } from '../../lib/cn';

type Option<T> = { value: T; label: string };

type Props<T extends string | number> = {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  /** для витрины: показать сегмент в нажатом состоянии */
  pressedValue?: T;
  /** m — 36 на surface-2; l — пилюля 44 на плитке поверх тинта (рецепт) */
  size?: 'm' | 'l';
};

/** m: сегменты 32 в подложке 36, тач-зона ≥ 44; l: пилюля 44, сегменты 40 */
export function SegmentedControl<T extends string | number>({ label, options, value, onChange, pressedValue, size = 'm' }: Props<T>) {
  const l = size === 'l';
  return (
    <div role="radiogroup" aria-label={label} className={cn('inline-flex shrink-0 items-center gap-0.5 p-0.5', l ? 'h-tap rounded-full bg-tile-strong' : 'h-chip rounded-control bg-surface-2')}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            data-pressed={o.value === pressedValue || undefined}
            onClick={() => onChange(o.value)}
            className={cn(
              'pressable font-semibold tabular-nums transition-colors',
              l ? 'hit-44 h-10 min-w-13 rounded-full px-3 text-callout' : 'hit-44 h-8 min-w-12 rounded-check px-3 text-subhead',
              active ? 'bg-fg text-bg' : 'text-fg-2',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
