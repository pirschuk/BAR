import { useLayoutEffect, useRef, useState } from 'react';
import type { Cocktail } from '../../types/cocktail';
import { cn } from '../../lib/cn';
import { CocktailCard, coverStyle } from './CocktailCard';

type Props = {
  /** выпавшая карточка */
  current: Cocktail;
  /** кадры барабана — что мелькает перед остановкой (пусто — без спина, «pop») */
  strip: Cocktail[];
  /** меняется — новый спин */
  spinKey: number;
  onSettle?: () => void;
  onSpin?: () => void;
  isAvailable?: (c: Cocktail) => boolean;
  isFavorite?: (c: Cocktail) => boolean;
  /** для витрины: застывший кадр спина, 0…1 */
  frame?: number;
};

const SPIN_MS = 900;
const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * «Мне повезёт» — барабан **карточками**: та же карточка, что в каталоге (CocktailCard large), на всю ширину,
 * высота — `h-lucky-card` (не 3:4: иначе карточка огромная).
 * Спин — отдельные карточки с зазором 12 проезжают сверху вниз ~900 мс (видны целиком, не в окне) и тормозят
 * с перелётом и отскоком (--ease-spring); за выпавшей — свечение цветом напитка. Один вариант — «pop»;
 * reduced-motion — без анимации. Лента прижата низом: остальные карточки выше выпавшей (не растят прокрутку).
 */
const GAP = 12;
export function LuckyReel({ current, strip, spinKey, onSettle, onSpin, isAvailable, isFavorite, frame }: Props) {
  const reel = useRef<HTMLDivElement>(null);
  const [spinning, setSpinning] = useState(false);
  const frames = [...strip, current];
  const spin = strip.length > 0 && !reduced();

  // спин: ставим ленту в начало без перехода, на следующем кадре — едем к последней карточке
  useLayoutEffect(() => {
    const el = reel.current;
    if (!el || frame !== undefined) return;
    if (!spin) {
      setSpinning(false);
      onSettle?.();
      return;
    }
    setSpinning(true);
    onSpin?.();
    const step = el.parentElement!.clientHeight + GAP;
    el.style.transition = 'none';
    el.style.transform = `translateY(${(frames.length - 1) * step}px)`;
    void el.offsetHeight;
    el.style.transition = `transform ${SPIN_MS}ms var(--ease-spring)`;
    el.style.transform = 'translateY(0)';
    const t = setTimeout(() => {
      setSpinning(false);
      onSettle?.();
    }, SPIN_MS);
    return () => clearTimeout(t);
    // спин — только на смену spinKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinKey]);

  // после остановки лента из одной карточки: сбрасываем сдвиг, чтобы фокус и ссылки были у выпавшей
  const settled = !spinning && frame === undefined;
  useLayoutEffect(() => {
    if (settled && reel.current) {
      reel.current.style.transition = 'none';
      reel.current.style.transform = 'none';
    }
  }, [settled]);

  const shown = settled ? [current] : frames;
  // витрина: доля пути, в высотах карточки (+ зазор)
  const frameStyle = frame !== undefined ? { transform: `translateY(calc(${(1 - frame) * (frames.length - 1)} * (100% / ${frames.length} + ${GAP / frames.length}px)))` } : undefined;

  return (
    <div className="h-lucky-card relative w-full">
      {/* свечение цветом напитка — проявляется после остановки */}
      {settled && <span key={`${spinKey}-${current.id}`} className="lucky-glow absolute -inset-6" style={coverStyle(current)} aria-hidden />}
      <div className={cn('relative h-full', spinning && 'pointer-events-none')}>
        {/* лента прижата низом: последняя (выпавшая) — на месте карточки, остальные выше */}
        <div ref={reel} className="absolute inset-x-0 bottom-0 flex flex-col" style={{ gap: GAP, ...frameStyle }}>
          {shown.map((c, i) => (
            <div key={`${c.id}-${i}`} className={cn('h-lucky-card w-full', settled && strip.length === 0 && frame === undefined && 'motion-safe:animate-card-pop')}>
              <CocktailCard
                cocktail={c}
                large
                replace
                tabIndex={settled ? undefined : -1}
                available={isAvailable?.(c)}
                favorite={isFavorite?.(c)}
                className="aspect-auto! h-full"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
