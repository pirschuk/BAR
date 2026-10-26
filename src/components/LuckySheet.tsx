import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Dices } from 'lucide-react';
import type { Cocktail } from '../types/cocktail';
import { current, makeDeck, next, shuffle } from '../lib/lucky';
import { BottomSheet, SheetFooter } from './ui/BottomSheet';
import { Button } from './ui/Button';
import { EmptyState } from './ui/EmptyState';
import { LuckyReel } from './ui/LuckyReel';
import { cn } from '../lib/cn';

type Props = {
  open: boolean;
  onClose: () => void;
  /** из чего выбирать — по контексту таба */
  pool: Cocktail[];
  /** «Подходят: 24 коктейля» / «Всё есть дома: 6 коктейлей» / «Весь каталог: 51 коктейль» */
  caption: string;
  onOpenRecipe: (id: string) => void;
  /** что предложить, если выбирать не из чего */
  empty: { title: string; hint: string; action?: ReactNode };
  isAvailable?: (c: Cocktail) => boolean;
  isFavorite?: (c: Cocktail) => boolean;
  /** для витрины */
  inline?: boolean;
  /** для витрины: застывший кадр спина, 0…1 */
  frame?: number;
};

/** Кадры барабана: 8 случайных карточек пула, кроме выпавшей (повторы допустимы, если пул мал) */
function stripFor(pool: Cocktail[], currentId: string): Cocktail[] {
  const rest = pool.filter((c) => c.id !== currentId);
  if (!rest.length) return [];
  const out: Cocktail[] = [];
  while (out.length < 8) out.push(...shuffle(rest));
  return out.slice(0, 8);
}

/** «Мне повезёт»: одна карточка каталога в барабане, «Ещё раз» — новый спин без повторов в раунде */
export function LuckySheet({ open, onClose, pool, caption, onOpenRecipe, empty, isAvailable, isFavorite, inline, frame }: Props) {
  const byId = useMemo(() => new Map(pool.map((c) => [c.id, c])), [pool]);
  const ids = useMemo(() => pool.map((c) => c.id).join(','), [pool]);
  const [deck, setDeck] = useState(() => makeDeck(pool.map((c) => c.id)));
  const [spinKey, setSpinKey] = useState(0);
  const [spinning, setSpinning] = useState(false);

  // новая колода и спин при каждом открытии и смене выборки
  useEffect(() => {
    if (!open) return;
    setDeck(makeDeck(ids ? ids.split(',') : []));
    setSpinKey((k) => k + 1);
  }, [open, ids]);

  const top = byId.get(current(deck) ?? '');
  const single = pool.length === 1;
  // кадры пересчитываются на каждый спин
  const strip = useMemo(() => (top && !single ? stripFor(pool, top.id) : []), [spinKey, top?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const again = () => {
    setDeck((d) => next(d));
    setSpinKey((k) => k + 1);
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      inline={inline}
      title="Мне повезёт"
      footer={
        top ? (
          <SheetFooter>
            <Button variant="secondary" className="px-5!" disabled={single || spinning} onClick={again}>
              <Dices className={cn('size-5', spinning && 'motion-safe:animate-roll-loop')} aria-hidden />
              Ещё раз
            </Button>
            <Button className="px-4! whitespace-nowrap" disabled={spinning} onClick={() => onOpenRecipe(top.id)}>
              Открыть рецепт
            </Button>
          </SheetFooter>
        ) : undefined
      }
    >
      {top ? (
        <div className="px-4 pb-2">
          <p className="mb-4 truncate text-footnote text-fg-2" aria-live="polite">
            {caption}
            {single && ' · единственный подходящий'}
          </p>
          <LuckyReel
            current={top}
            strip={strip}
            spinKey={spinKey}
            frame={frame}
            isAvailable={isAvailable}
            isFavorite={isFavorite}
            onSpin={() => setSpinning(true)}
            onSettle={() => setSpinning(false)}
          />
        </div>
      ) : (
        // та же высота, что у барабана с подписью: шторка не прыгает при смене фильтров
        <EmptyState icon={Dices} title={empty.title} hint={empty.hint} action={empty.action} className="min-h-deck justify-center" />
      )}
    </BottomSheet>
  );
}
