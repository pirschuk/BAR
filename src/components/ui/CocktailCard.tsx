import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import { Check } from 'lucide-react';
import type { Cocktail } from '../../types/cocktail';
import { glassLabel, glassShape } from '../../lib/cocktails';
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
};

/** Карточка каталога 3:4: градиент напитка, силуэт бокала, стеклянная плашка меты, название поверх скрима */
export function CocktailCard({ cocktail, pressed, className, available }: Props) {
  return (
    <Link
      to={`/cocktail/${cocktail.id}`}
      data-pressed={pressed || undefined}
      className={cn('pressable-scale cover-gradient block aspect-card overflow-hidden rounded-card outline-1 -outline-offset-1 outline-border', className)}
      style={coverStyle(cocktail)}
    >
      <GlassIllustration
        shape={glassShape(cocktail.glass)}
        ice={cocktail.ice}
        className="absolute inset-x-0 top-9 mx-auto h-1/2"
      />
      <span className="scrim-bottom absolute inset-0" aria-hidden />
      <span className="glass absolute top-3 left-3 inline-flex h-6 items-center rounded-full px-2.5 text-caption text-on-media">
        {cocktail.abv}% · {glassLabel(cocktail.glass)}
      </span>
      {available && (
        <span
          className="glass absolute top-3 right-3 flex size-6 items-center justify-center rounded-full text-on-media-accent"
          title="Всё есть дома"
          aria-label="Всё есть дома"
          role="img"
        >
          <Check className="size-3.5" strokeWidth={3} aria-hidden />
        </span>
      )}
      <span className="absolute inset-x-3 bottom-3 line-clamp-2 text-headline text-on-media">{cocktail.name}</span>
    </Link>
  );
}
