import type { LucideIcon } from 'lucide-react';
import type { Amount } from '../../lib/cocktails';

type Props = {
  name: string;
  amount?: Amount;
  optional?: boolean;
  /** нет в «Моём баре» — тег */
  missing?: boolean;
  /** подпись под названием вместо тегов («Украшение») */
  note?: string;
  icon?: LucideIcon;
};

/**
 * Ингредиент — своя округлая плитка [Apple News]: название слева, объём крупно справа колонкой.
 * Не кнопка: отметки «налил» нет (решение владельца, Итерация 3).
 */
export function IngredientTile({ name, amount, optional, missing, note, icon: Icon }: Props) {
  return (
    <div className="flex min-h-row-l items-center gap-3 rounded-row bg-tile px-4 py-3">
      <span className="min-w-0 flex-1">
        <span className="block text-body text-fg">{name}</span>
        {(optional || missing || note) && (
          <span className="mt-1 flex items-center gap-2">
            {missing && (
              <span className="inline-flex h-5 items-center rounded-full bg-tile-strong px-2 text-caption text-fg">нет дома</span>
            )}
            {optional && <span className="text-footnote text-fg-2">по желанию</span>}
            {note && <span className="text-footnote text-fg-2">{note}</span>}
          </span>
        )}
      </span>
      {amount && (
        <span className="flex shrink-0 items-baseline gap-1.5">
          <span className="min-w-9 text-right text-headline text-fg tabular-nums">{amount.value}</span>
          <span className="w-14 text-footnote text-fg-2">{amount.unit}</span>
        </span>
      )}
      {/* иконка справа, в колонке объёма: левый край текста у всех плиток один */}
      {Icon && <Icon className="size-5 shrink-0 text-fg-2" aria-hidden />}
    </div>
  );
}
