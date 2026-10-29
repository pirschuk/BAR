import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import type { Cocktail } from '../../types/cocktail';
import { countLabel } from '../../lib/cocktails';
import { cn } from '../../lib/cn';
import { coverStyle } from './CocktailCard';
import { DrinkArtReal } from './DrinkArtReal';

type Props = {
  can: number;
  nearly: number;
  /** до 3 коктейлей, которые можно приготовить, — веер мини-обложек */
  covers: Cocktail[];
  to: string;
  /** can = 0: куда ведёт «Что докупить ›» */
  onBuy?: () => void;
  pressed?: boolean;
};

// веер: обложки внахлёст, средняя выше
const FAN = ['-rotate-8 translate-x-8 translate-y-3', 'z-10', 'rotate-8 -translate-x-8 translate-y-3'];

/**
 * Герой «Можно приготовить» — главный блок «Моего бара», не такая же плитка: фирменный фон (акцент → чёрный),
 * число Unbounded 64, веер до 3 мини-обложек того, что можно сделать; вся плитка — «Показать N ›».
 * can = 0 — нейтральный фон, «ещё N — без одного» и «Что докупить ›».
 */
export function BarHero({ can, nearly, covers, to, onBuy, pressed }: Props) {
  const nearlyText = nearly > 0 ? `ещё ${countLabel(nearly)} — без одного ингредиента` : 'из того, что есть дома';
  if (can === 0)
    return (
      <section className="rounded-sheet bg-tile-strong p-5" aria-label="Можно приготовить">
        <p className="text-subhead text-fg-2">Можно приготовить</p>
        <p className="mt-1 font-display text-section text-fg">Пока ничего</p>
        <p className="mt-1 text-footnote text-fg-2">{nearly > 0 ? nearlyText : 'добавьте 1–2 ингредиента — список появится'}</p>
        {onBuy && (
          <button type="button" onClick={onBuy} className="pressable -mx-2 mt-2 flex min-h-tap items-center gap-1 rounded-control px-2 text-headline text-accent">
            Что докупить
            <ChevronRight className="size-5" aria-hidden />
          </button>
        )}
      </section>
    );
  return (
    <Link
      to={to}
      viewTransition
      data-pressed={pressed || undefined}
      className="pressable-scale hero-brand relative flex min-h-56 overflow-hidden rounded-sheet p-5 text-on-media"
      aria-label={`Можно приготовить ${countLabel(can)} — показать`}
    >
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <p className="text-subhead text-on-media-2">Можно приготовить</p>
        <p className="mt-1 h-22 font-display text-hero tabular-nums">{can}</p>
        <p className="mt-3 text-footnote text-on-media-2">{nearlyText}</p>
        <p className="mt-auto flex items-center gap-1 pt-3 text-headline">
          Показать {countLabel(can)}
          <ChevronRight className="size-5" aria-hidden />
        </p>
      </div>
      {/* веер обложек — то, что реально можно приготовить */}
      {/* веер — справа на уровне числа; подписи ниже идут на всю ширину */}
      <div className="pointer-events-none absolute top-5 right-4 flex" aria-hidden>
        {covers.slice(0, 3).map((c, i, all) => (
          <span
            key={c.id}
            className={cn(
              'cover-gradient flex h-22 w-16 shrink-0 items-end justify-center overflow-hidden rounded-row pb-2 shadow-lg outline-1 -outline-offset-1 outline-border',
              all.length === 1 ? 'rotate-6' : FAN[all.length === 2 ? i * 2 : i],
            )}
            style={coverStyle(c)}
          >
            <DrinkArtReal cocktail={c} className="h-14" />
          </span>
        ))}
      </div>
    </Link>
  );
}
