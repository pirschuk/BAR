import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { Amount } from '../../lib/cocktails';
import { cn } from '../../lib/cn';

/**
 * Список ингредиентов — общая сетка «название | число | единица» (subgrid): числа выровнены по правому краю,
 * колонка единиц шириной по самой длинной единице в рецепте — справа нет пустоты.
 */
export function IngredientList({ children, className }: { children: ReactNode; className?: string }) {
  return <ul className={cn('grid grid-cols-[minmax(0,1fr)_auto_auto] gap-y-2', className)}>{children}</ul>;
}

type Props = {
  name: string;
  amount: Amount;
  optional?: boolean;
  /** нет в «Моём баре» — тег */
  missing?: boolean;
};

/**
 * Ингредиент — своя округлая плитка [Apple News]: название слева, объём крупно справа.
 * Не кнопка: отметки «налил» нет. Без числа («долить», «по вкусу») — слово стилем значения, а не единицы.
 * Только внутри IngredientList.
 */
export function IngredientTile({ name, amount, optional, missing }: Props) {
  return (
    <li className="col-span-3 grid min-h-row-l grid-cols-subgrid items-center rounded-row bg-tile px-4 py-3">
      <span className="min-w-0 pr-3">
        <span className="block text-body text-fg">{name}</span>
        {(optional || missing) && (
          <span className="mt-1 flex items-center gap-2">
            {missing && <span className="inline-flex h-5 items-center rounded-full bg-tile-strong px-2 text-caption text-fg">нет дома</span>}
            {optional && <span className="text-footnote text-fg-2">по желанию</span>}
          </span>
        )}
      </span>
      {amount.value ? (
        <>
          <span className="text-right text-headline text-fg tabular-nums">{amount.value}</span>
          <span className="pl-1.5 text-footnote text-fg-2">{amount.unit}</span>
        </>
      ) : (
        <span className="col-span-2 text-right text-headline text-fg">{amount.unit}</span>
      )}
    </li>
  );
}

/** Украшение — по логике ингредиента: слева что это («Украшение» с иконкой), справа чем украсить */
export function GarnishTile({ value, icon: Icon, className }: { value: string; icon: LucideIcon; className?: string }) {
  return (
    <div className={cn('flex min-h-row-l items-center gap-3 rounded-row bg-tile px-4 py-3', className)}>
      <span className="flex shrink-0 items-center gap-1.5 text-body text-fg-2">
        <Icon className="size-4" aria-hidden />
        Украшение
      </span>
      <span className="min-w-0 flex-1 text-right text-body text-fg">{value}</span>
    </div>
  );
}
