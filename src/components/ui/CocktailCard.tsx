import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import { Check, Heart } from 'lucide-react';
import type { Cocktail } from '../../types/cocktail';
import { glassLabel, strengthLabel } from '../../lib/cocktails';
import { cn } from '../../lib/cn';
import { GlassIllustration } from './GlassIllustration';

export function coverStyle(cocktail: Pick<Cocktail, 'cover'>): CSSProperties {
  return { '--cover-from': cocktail.cover.from, '--cover-to': cocktail.cover.to } as CSSProperties;
}

type Props = {
  cocktail: Cocktail;
  pressed?: boolean;
  className?: string;
  /** всё есть в «Моём баре» — аккуратная отметка ✓ в правом верхнем углу */
  available?: boolean;
  /** в избранном — ♥ сверху, ✓ под ним (♥ — постоянная отметка, ✓ зависит от бара); индикатор, не кнопка */
  favorite?: boolean;
  /** узкая карточка ленты (CardRail): без плашки крепости и бокал ниже — иначе текст налезает */
  compact?: boolean;
};

/** Карточка каталога 3:4: градиент напитка, силуэт бокала, плашка крепости (словом), название и бокал поверх скрима */
export function CocktailCard({ cocktail, pressed, className, available, favorite, compact }: Props) {
  return (
    <Link
      to={`/cocktail/${cocktail.id}`}
      data-pressed={pressed || undefined}
      className={cn('pressable-scale cover-gradient block aspect-card overflow-hidden rounded-card outline-1 -outline-offset-1 outline-border', className)}
      style={coverStyle(cocktail)}
    >
      {/* compact (лента 140): бокал ниже ростом — двухстрочное название не наезжает */}
      <GlassIllustration shape={cocktail.glass} className={cn('absolute inset-x-0 mx-auto', compact ? 'top-5 h-2/5' : 'top-9 h-1/2')} />
      <span className="scrim-bottom absolute inset-0" aria-hidden />
      {/* крепость — словом, как в фильтре «Крепость»; бокал — под названием */}
      {!compact && (
        <span className="glass absolute top-3 left-3 inline-flex h-6 items-center rounded-full px-2.5 text-caption text-on-media">
          {strengthLabel(cocktail.strength)}
        </span>
      )}
      {(available || favorite) && (
        // столбиком: в строку с плашкой «Безалкогольный» два значка не помещаются даже в 173
        <span className="absolute top-3 right-3 flex flex-col gap-1">
          {favorite && (
            <span className="glass-strong flex size-6 items-center justify-center rounded-full text-on-media-accent" title="В избранном" aria-label="В избранном" role="img">
              <Heart className="size-3.5 fill-current" aria-hidden />
            </span>
          )}
          {available && (
            <span className="glass-strong flex size-6 items-center justify-center rounded-full text-on-media-accent" title="Всё есть дома" aria-label="Всё есть дома" role="img">
              <Check className="size-3.5" strokeWidth={3} aria-hidden />
            </span>
          )}
        </span>
      )}
      <span className="absolute inset-x-3 bottom-3">
        <span className="line-clamp-2 text-headline text-on-media">{cocktail.name}</span>
        <span className="mt-0.5 block truncate text-footnote text-on-media-2">{glassLabel(cocktail.glass)}</span>
      </span>
    </Link>
  );
}
