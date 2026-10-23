import { ChevronLeft } from 'lucide-react';
import type { Cocktail } from '../../types/cocktail';
import { cn } from '../../lib/cn';
import { IconButton } from './Button';
import { coverStyle } from './CocktailCard';
import { GlassIllustration } from './GlassIllustration';

type Props = {
  cocktail: Cocktail;
  onBack?: () => void;
  /** screen — 55% высоты экрана; preview — уменьшенная, для витрины */
  height?: 'screen' | 'preview';
};

/**
 * Обложка рецепта: градиент напитка, крупный бокал, «Назад» на стекле, название поверх скрима.
 * Колонка: бокал занимает всё место над названием — длинное название уменьшает бокал, а не наезжает на него.
 */
export function CocktailHero({ cocktail, onBack, height = 'screen' }: Props) {
  return (
    <header
      className={cn('cover-gradient relative flex flex-col overflow-hidden', height === 'screen' ? 'h-hero pt-safe' : 'h-80 pt-3')}
      style={coverStyle(cocktail)}
    >
      <span className="scrim-top absolute inset-0" aria-hidden />
      <span className="scrim-bottom absolute inset-0" aria-hidden />
      {/* низ обложки растворяется в тинт напитка — тело страницы продолжает градиент */}
      <span className="hero-fade absolute inset-x-0 bottom-0 h-24" aria-hidden />

      {/* под кнопкой «Назад» (44) — отступ 48, бокал вписывается в оставшуюся высоту */}
      <div className="relative mt-12 mb-3 min-h-0 flex-1">
        <GlassIllustration shape={cocktail.glass} className="absolute inset-0 size-full" />
      </div>

      {onBack && (
        <div className={cn('absolute left-4', height === 'screen' ? 'top-safe' : 'top-3')}>
          <IconButton icon={ChevronLeft} label="Назад" variant="glass" size="l" onClick={onBack} />
        </div>
      )}

      <div className="relative px-4 pb-5">
        <h1 className="line-clamp-2 font-display text-display text-balance text-on-media">{cocktail.name}</h1>
        <p className="mt-1 text-subhead text-on-media-2">{cocktail.nameEn}</p>
      </div>
    </header>
  );
}
