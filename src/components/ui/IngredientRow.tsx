import { Check } from 'lucide-react';
import type { Amount } from '../../lib/cocktails';
import { cn } from '../../lib/cn';

type Props = {
  name: string;
  amount: Amount;
  optional?: boolean;
  checked: boolean;
  onToggle: () => void;
  pressed?: boolean;
  /** нет в «Моём баре» — тег, без зачёркивания (зачёркивание = «уже налил») */
  missing?: boolean;
};

/** Строка чек-листа: вся строка — тач-зона (≥ 48), отмеченная — зачёркнута */
export function IngredientRow({ name, amount, optional, checked, onToggle, pressed, missing }: Props) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      data-pressed={pressed || undefined}
      onClick={onToggle}
      className="pressable flex min-h-row w-full items-center gap-3 px-4 py-2 text-left"
    >
      <span
        className={cn(
          'flex size-6 shrink-0 items-center justify-center rounded-check border-2 transition-colors',
          checked ? 'border-accent bg-accent text-accent-fg' : 'border-fg-3',
        )}
        aria-hidden
      >
        {checked && <Check className="size-4" strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block text-body', checked ? 'text-fg-3 line-through' : 'text-fg')}>{name}</span>
        {(optional || missing) && (
          <span className="block text-footnote text-fg-2">
            {[optional && 'по желанию', missing && 'нет дома'].filter(Boolean).join(' · ')}
          </span>
        )}
      </span>
      <span className="flex shrink-0 items-baseline gap-1.5">
        <span className={cn('min-w-9 text-right text-headline tabular-nums', checked ? 'text-fg-3' : 'text-fg')}>{amount.value}</span>
        <span className={cn('w-14 text-footnote', checked ? 'text-fg-3' : 'text-fg-2')}>{amount.unit}</span>
      </span>
    </button>
  );
}
