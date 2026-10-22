import { cn } from '../../lib/cn';

type Option<T> = { value: T; label: string };

type Props<T extends string | number> = {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  /** для витрины: показать сегмент в нажатом состоянии */
  pressedValue?: T;
};

/** Сегменты 32 внутри подложки 36, тач-зона каждого сегмента ≥ 44 */
export function SegmentedControl<T extends string | number>({ label, options, value, onChange, pressedValue }: Props<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex h-chip shrink-0 items-center gap-0.5 rounded-control bg-surface-2 p-0.5">
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
              'pressable hit-44 h-8 min-w-12 rounded-check px-3 text-subhead font-semibold tabular-nums transition-colors',
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
