import { useEffect, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { Cocktail } from '../types/cocktail';
import { countLabel } from '../lib/cocktails';
import type { Bottle } from '../lib/inventory';
import { BottomSheet } from './ui/BottomSheet';
import { Button } from './ui/Button';
import { CardRail, CardRailItem } from './ui/CardRail';
import { CocktailCard } from './ui/CocktailCard';
import { BottleForm } from './ui/BottleForm';

export type ShelfItem = {
  /** id отметки (ингредиент / инструмент) или бутылки */
  id: string;
  title: string;
  subtitle?: string;
  bottle?: Bottle;
  /** рецепты, где используется (ингредиент — по ref, инструмент — по методу) */
  used: Cocktail[];
};

type Props = {
  item: ShelfItem | null;
  onClose: () => void;
  onRemove: (item: ShelfItem) => void;
  onSaveBottle: (b: Bottle) => void;
  isAvailable: (c: Cocktail) => boolean;
  /** для витрины */
  inline?: boolean;
};

/** Шторка позиции: что это, где используется (лента карточек), заметка; «Изменить» для своей бутылки, «Убрать из бара» */
export function BarItemSheet({ item, onClose, onRemove, onSaveBottle, isAvailable, inline }: Props) {
  const [editing, setEditing] = useState(false);
  useEffect(() => setEditing(false), [item?.id]);
  if (!item) return <BottomSheet open={false} onClose={onClose} title="" inline={inline}>{null}</BottomSheet>;
  const b = item.bottle;

  return (
    <BottomSheet open onClose={onClose} inline={inline} title={editing ? 'Изменить бутылку' : item.title}>
      {editing && b ? (
        <div className="pb-6">
          <BottleForm
            editing
            initial={{ name: b.name, ref: b.ref, note: b.note }}
            submitLabel="Сохранить"
            onSubmit={(d) => {
              onSaveBottle({ ...b, ...d, note: d.note });
              setEditing(false);
            }}
          />
        </div>
      ) : (
        <div className="pb-6">
          {item.subtitle && <p className="px-4 text-subhead text-fg-2">{item.subtitle}</p>}

          <h3 className="mt-5 px-4 text-headline text-fg">
            {item.used.length ? `Используется в ${countLabel(item.used.length)}` : b && !b.ref ? 'Не участвует в рецептах' : 'Пока ни в одном рецепте'}
          </h3>
          {item.used.length > 0 && (
            <CardRail label="Рецепты с этой позицией" className="mt-3">
              {item.used.slice(0, 8).map((c) => (
                <CardRailItem key={c.id}>
                  <CocktailCard cocktail={c} compact available={isAvailable(c)} />
                </CardRailItem>
              ))}
            </CardRail>
          )}

          <div className="mt-6 flex flex-col gap-2 px-4">
            {b && (
              <Button variant="secondary" icon={Pencil} className="w-full bg-tile-strong!" onClick={() => setEditing(true)}>
                Изменить
              </Button>
            )}
            <Button variant="plain" icon={Trash2} className="w-full text-danger!" onClick={() => onRemove(item)}>
              Убрать из бара
            </Button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
