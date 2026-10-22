import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Dices, Shuffle } from 'lucide-react';
import type { Cocktail } from '../types/cocktail';
import { current, makeDeck, next, peek } from '../lib/lucky';
import { BottomSheet, SheetFooter } from './ui/BottomSheet';
import { Button } from './ui/Button';
import { EmptyState } from './ui/EmptyState';
import { LuckyDeck, type LuckyDeckHandle } from './ui/LuckyDeck';

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
  /** для витрины */
  inline?: boolean;
  frame?: number;
};

/** «Мне повезёт»: колода по контексту таба, «Ещё раз» и «Открыть рецепт» [Julienne, Transit] */
export function LuckySheet({ open, onClose, pool, caption, onOpenRecipe, empty, inline, frame }: Props) {
  const byId = useMemo(() => new Map(pool.map((c) => [c.id, c])), [pool]);
  const ids = useMemo(() => pool.map((c) => c.id).join(','), [pool]);
  const [deck, setDeck] = useState(() => makeDeck(pool.map((c) => c.id)));
  const deckRef = useRef<LuckyDeckHandle>(null);

  // новая колода при каждом открытии и смене выборки
  useEffect(() => {
    if (open) setDeck(makeDeck(ids ? ids.split(',') : []));
  }, [open, ids]);

  const top = byId.get(current(deck) ?? '');
  const under = byId.get(peek(deck) ?? '');
  const single = pool.length === 1;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      inline={inline}
      title="Мне повезёт"
      footer={
        top ? (
          <SheetFooter>
            <Button variant="secondary" icon={Shuffle} className="px-5!" disabled={single} onClick={() => deckRef.current?.throwNext()}>
              Ещё раз
            </Button>
            <Button className="px-4! whitespace-nowrap" onClick={() => onOpenRecipe(top.id)}>
              Открыть рецепт
            </Button>
          </SheetFooter>
        ) : undefined
      }
    >
      {top ? (
        <div className="px-4">
          <p className="mb-4 text-footnote text-fg-2">
            {caption}
            {single ? ' · это единственный подходящий' : ' · смахните карту или нажмите «Ещё раз»'}
          </p>
          <LuckyDeck ref={deckRef} current={top} peek={under} frame={frame} onNext={() => setDeck((d) => next(d))} />
        </div>
      ) : (
        <EmptyState icon={Dices} title={empty.title} hint={empty.hint} action={empty.action} />
      )}
    </BottomSheet>
  );
}
