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
 * «Мне повезёт» — барабан: та же карточка, что в каталоге (CocktailCard large), в окне 3:4. Спин — кадры
 * проезжают снизу вверх ~900 мс и тормозят с перелётом и отскоком (--ease-spring); за выпавшей — свечение
 * цветом напитка. Один вариант — «pop» без спина; reduced-motion — без анимации.
 */
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
    el.style.transition = 'none';
    el.style.transform = 'translateY(0)';
    void el.offsetHeight;
    el.style.transition = `transform ${SPIN_MS}ms var(--ease-spring)`;
    el.style.transform = `translateY(-${(frames.length - 1) * 100}%)`;
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
  const frameStyle = frame !== undefined ? { transform: `translateY(-${frame * (frames.length - 1) * 100}%)` } : undefined;

  return (
    <div className="h-lucky-card relative mx-auto aspect-card">
      {/* свечение цветом напитка — проявляется после остановки */}
      {settled && <span key={`${spinKey}-${current.id}`} className="lucky-glow absolute -inset-6" style={coverStyle(current)} aria-hidden />}
      <div className={cn('relative h-full overflow-hidden rounded-tile', spinning && 'pointer-events-none')}>
        <div ref={reel} className="h-full" style={frameStyle}>
          {shown.map((c, i) => (
            <div key={`${c.id}-${i}`} className={cn('h-full', settled && strip.length === 0 && frame === undefined && 'motion-safe:animate-card-pop')}>
              <CocktailCard
                cocktail={c}
                large
                replace
                tabIndex={settled ? undefined : -1}
                available={isAvailable?.(c)}
                favorite={isFavorite?.(c)}
                className="h-full"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
