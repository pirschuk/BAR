import { forwardRef, useImperativeHandle, useRef, useState, type PointerEvent } from 'react';
import type { Cocktail } from '../../types/cocktail';
import { BASES, glassLabel, methodLabel, strengthLabel } from '../../lib/cocktails';
import { cn } from '../../lib/cn';
import { coverStyle } from './CocktailCard';
import { GlassIllustration } from './GlassIllustration';

/** Большая карточка «Мне повезёт»: градиент, бокал, база, название title-1, метод · бокал · крепость */
export function LuckyCard({ cocktail, className }: { cocktail: Cocktail; className?: string }) {
  const base = BASES.find((b) => b.id === cocktail.base)?.label;
  return (
    <article className={cn('cover-gradient relative h-full overflow-hidden rounded-card outline-1 -outline-offset-1 outline-border', className)} style={coverStyle(cocktail)}>
      <GlassIllustration shape={cocktail.glass} className="absolute inset-x-0 top-10 mx-auto h-1/2" />
      <span className="scrim-bottom absolute inset-0" aria-hidden />
      {base && (
        <span className="glass absolute top-3 left-3 inline-flex h-6 items-center rounded-full px-2.5 text-caption text-on-media">{base}</span>
      )}
      <div className="absolute inset-x-4 bottom-4">
        <h3 className="line-clamp-2 text-title-1 text-on-media">{cocktail.name}</h3>
        <p className="mt-1 text-footnote text-on-media-2">
          {strengthLabel(cocktail.strength)} · {glassLabel(cocktail.glass)} · {methodLabel(cocktail.method)}
        </p>
      </div>
    </article>
  );
}

type Props = {
  current: Cocktail;
  /** карта под верхней; нет — колода из одной карты */
  peek?: Cocktail;
  onNext: () => void;
  /** для витрины: зафиксировать кадр свайпа, px */
  frame?: number;
};

const FLY_MS = 220;

function reducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Колода: следующая карта выглядывает сзади (scale .94, сдвиг 24) [Julienne];
 * верхнюю смахивают влево/вправо (порог 30% ширины или быстрый флик) — следующая.
 * Кнопка «Ещё раз» вызывает тот же вылет через ref: deck.current?.throwNext().
 */
export type LuckyDeckHandle = { throwNext: () => void };

export const LuckyDeck = forwardRef<LuckyDeckHandle, Props>(function LuckyDeck({ current, peek, onNext, frame }, ref) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [fly, setFly] = useState<0 | 1 | -1>(0);
  const start = useRef<{ x: number; t: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const canSwipe = !!peek && frame === undefined;

  // нажатие «Ещё раз» во время полёта не теряется: одно копится и запускается после приземления
  const queued = useRef(false);
  const throwCard = (dir: 1 | -1) => {
    if (reducedMotion()) {
      setDx(0);
      onNext();
      return;
    }
    setFly(dir);
    window.setTimeout(() => {
      onNext();
      setFly(0);
      setDx(0);
      if (queued.current) {
        queued.current = false;
        window.setTimeout(() => throwCard(-1), 30);
      }
    }, FLY_MS);
  };
  useImperativeHandle(ref, () => ({
    throwNext: () => {
      if (!canSwipe) return;
      if (fly) queued.current = true;
      else throwCard(-1);
    },
  }));

  const onDown = (e: PointerEvent) => {
    if (!canSwipe || fly) return;
    start.current = { x: e.clientX, t: performance.now() };
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    if (start.current) setDx(e.clientX - start.current.x);
  };
  const onUp = (e: PointerEvent) => {
    if (!start.current) return;
    const width = box.current?.clientWidth ?? 358;
    const speed = Math.abs(e.clientX - start.current.x) / Math.max(1, performance.now() - start.current.t);
    start.current = null;
    setDragging(false);
    if (Math.abs(dx) > width * 0.3 || (speed > 0.6 && Math.abs(dx) > 24)) throwCard(dx > 0 ? 1 : -1);
    else setDx(0);
  };

  const offset = frame ?? (fly ? fly * 480 : dx);
  const progress = Math.min(1, Math.abs(offset) / 240);

  return (
    <div ref={box} className="relative mt-1 mb-6 h-70" aria-live="polite">
      {peek && (
        <div
          aria-hidden
          className="absolute inset-0 transition-transform duration-200"
          style={{ transform: `translateY(${24 * (1 - progress)}px) scale(${0.92 + 0.08 * progress})` }}
        >
          <LuckyCard cocktail={peek} className="brightness-75" />
        </div>
      )}
      <div
        key={current.id}
        className={cn('animate-fade-in absolute inset-0 touch-pan-y select-none', canSwipe && 'cursor-grab', !dragging && 'transition-transform duration-200')}
        style={{ transform: `translateX(${offset}px) rotate(${offset / 32}deg)` }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <LuckyCard cocktail={current} />
      </div>
    </div>
  );
});
