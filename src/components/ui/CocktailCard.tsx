import type { CSSProperties } from 'react';
import { Link, useViewTransitionState } from 'react-router';
import { Heart } from 'lucide-react';
import type { Cocktail } from '../../types/cocktail';
import { glassLabel, strengthLabel } from '../../lib/cocktails';
import { cn } from '../../lib/cn';
import { GlassIllustration } from './GlassIllustration';
import { useIsGhost } from '../SwipeBack';
import { setNav } from '../../lib/motion';

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
  /** крупная («Мне повезёт»): название Unbounded section */
  large?: boolean;
  /** переход заменяет запись истории (из шторки «Мне повезёт» назад — на экран без шторки) */
  replace?: boolean;
  /** -1 — не в порядке табуляции (кадры барабана) */
  tabIndex?: number;
};

/** Карточка каталога 3:4: градиент напитка, силуэт бокала, плашка крепости (словом), название и бокал поверх скрима */
export function CocktailCard({ cocktail, pressed, className, available, favorite, compact, large, replace, tabIndex }: Props) {
  const to = `/cocktail/${cocktail.id}`;
  // общий элемент: эта карточка вырастает в обложку рецепта (и садится обратно) — имя только на время перехода к ней;
  // из шторки «Мне повезёт» (replace) — без перехода: та же карточка может быть и в сетке под шторкой
  const transitioning = useViewTransitionState(to);
  const ghost = useIsGhost();
  const shared = transitioning && !replace && !ghost;
  // «раскрытие»: фон, бокал и название летят каждый сам по себе — без растянутых плашек и текста
  const vt = (name: string) => (shared ? { viewTransitionName: name } : undefined);
  return (
    <Link
      to={to}
      viewTransition={!replace}
      onClick={replace ? undefined : () => setNav('expand')}
      replace={replace}
      tabIndex={tabIndex}
      data-pressed={pressed || undefined}
      className={cn('vt-card pressable-scale cover-gradient block aspect-card overflow-hidden rounded-tile outline-1 -outline-offset-1 outline-border', className)}
      style={{ ...coverStyle(cocktail), ...(shared ? {} : { '--vt': `card-${cocktail.id}` }) } as CSSProperties}
    >
      {/* фон для «раскрытия» — только градиент, без плашки и подписей */}
      {shared && <span className="cover-gradient absolute inset-0 rounded-[inherit]" style={vt('cover')} aria-hidden />}
      {/* compact (лента 140): бокал ниже ростом — двухстрочное название не наезжает */}
      <GlassIllustration shape={cocktail.glass} style={vt('cover-glass')} className={cn('absolute inset-x-0 mx-auto', compact ? 'top-5 h-2/5' : 'top-9 h-1/2')} />
      <span className="scrim-bottom absolute inset-0" aria-hidden />
      {/* крепость — словом, как в фильтре «Крепость»; бокал — под названием */}
      {!compact && (
        <span className={cn('glass absolute inline-flex items-center rounded-full text-on-media', large ? 'top-4 left-4 h-7 px-3 text-footnote' : 'top-3 left-3 h-6 px-2.5 text-caption')}>
          {strengthLabel(cocktail.strength)}
        </span>
      )}
      {/* правый верхний угол — только избранное: иконка без подложки, тень для светлых обложек */}
      {favorite && (
        <Heart
          className={cn('absolute fill-current text-on-media-accent drop-shadow-md', large ? 'top-4.5 right-4.5 size-6' : 'top-3.5 right-3.5 size-5')}
          aria-label="В избранном"
          role="img"
        />
      )}
      <span className={cn('absolute', large ? 'inset-x-5 bottom-5' : 'inset-x-3 bottom-3')}>
        {/* Unbounded 14 (`text-card`): название не спорит с обложкой; длинное слово — перенос, а не обрезка */}
        <span style={vt('cover-title')} className={cn('line-clamp-2 block font-display wrap-break-word hyphens-auto text-on-media', large ? 'text-section' : 'text-card')}>{cocktail.name}</span>
        {/* «можно приготовить» — статусом в строке бокала (язык v2: информер, не значок) */}
        <span className={cn('mt-1 block truncate text-on-media-2', large ? 'text-subhead' : 'text-footnote')}>
          {glassLabel(cocktail.glass)}
          {cocktail.custom && ' · авторский'}
          {available && <span className="text-success"> · всё есть</span>}
        </span>
      </span>
    </Link>
  );
}
