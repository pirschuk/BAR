import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import { Heart } from 'lucide-react';
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
  /** всё есть в «Моём баре» — «· всё есть» зелёным в строке бокала */
  available?: boolean;
  /** в избранном — ♥ без подложки в правом верхнем углу (угол зарезервирован под избранное); не кнопка */
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
      className={cn('pressable-scale cover-gradient block aspect-card overflow-hidden rounded-tile outline-1 -outline-offset-1 outline-border', className)}
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
      {/* правый верхний угол — только избранное: иконка без подложки, тень для светлых обложек */}
      {favorite && (
        <Heart
          className="absolute top-3.5 right-3.5 size-5 fill-current text-on-media-accent drop-shadow-md"
          aria-label="В избранном"
          role="img"
        />
      )}
      <span className="absolute inset-x-3 bottom-3">
        {/* Unbounded 14 (`text-card`): название не спорит с обложкой; длинное слово — перенос, а не обрезка */}
        <span className="line-clamp-2 font-display text-card wrap-break-word hyphens-auto text-on-media">{cocktail.name}</span>
        {/* «можно приготовить» — статусом в строке бокала (язык v2: информер, не значок) */}
        <span className="mt-1 block truncate text-footnote text-on-media-2">
          {glassLabel(cocktail.glass)}
          {available && <span className="text-success"> · всё есть</span>}
        </span>
      </span>
    </Link>
  );
}
