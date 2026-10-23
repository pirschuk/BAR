import { useEffect, useState } from 'react';
import { countLabel } from '../lib/cocktails';
import { EMPTY_FILTERS, FACETS, getIngredient, type FacetKey, type FilterState } from '../lib/filters';
import { BottomSheet, SheetFooter, SheetSection } from './ui/BottomSheet';
import { Button } from './ui/Button';
import { Chip, ChipWrap } from './ui/Chip';
import { CheckRow } from './ui/Toggles';

type Props = {
  open: boolean;
  /** null — все фасеты (FilterSheet), иначе — один фасет (FacetSheet) [Viator] */
  facet: FacetKey | null;
  value: FilterState;
  /** сколько коктейлей даст черновик фильтров — для «Показать N» */
  count: (draft: FilterState) => number;
  onApply: (next: FilterState) => void;
  onClose: () => void;
  /** «Мой бар» пуст — галочка «Могу сделать» недоступна */
  barEmpty?: boolean;
  /** в избранном ничего — галочка «Только избранное» недоступна */
  favEmpty?: boolean;
  /** для витрины */
  inline?: boolean;
};

const ORDER: FacetKey[] = ['base', 'taste', 'strength'];

function toggle<T>(list: T[], id: T): T[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

/** Черновик внутри шторки: применяется только по «Показать N»; закрытие без него ничего не меняет */
export function FilterSheet({ open, facet, value, count, onApply, onClose, barEmpty = false, favEmpty = false, inline }: Props) {
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const keys = facet ? [facet] : ORDER;
  const n = count(draft);
  const reset = () =>
    setDraft(facet ? { ...draft, [facet]: [] } : { ...EMPTY_FILTERS, q: draft.q });
  const dirty = keys.some((k) => (draft[k] as string[]).length) || (!facet && (draft.ing !== null || draft.can || draft.fav));

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      inline={inline}
      title={facet ? FACETS[facet].title : 'Фильтры'}
      footer={
        <SheetFooter>
          <Button variant="plain" className="px-1!" onClick={reset} disabled={!dirty}>
            Сбросить
          </Button>
          {n === 0 ? (
            // не «бледный акцент», а нейтральная плашка: текст должен читаться в обеих темах
            <Button variant="secondary" className="px-4! whitespace-nowrap text-fg-2 disabled:opacity-100" disabled>
              Ничего не найдено
            </Button>
          ) : (
            <Button className="px-4! whitespace-nowrap" onClick={() => onApply(draft)}>
              Показать {countLabel(n)}
            </Button>
          )}
        </SheetFooter>
      }
    >
      {!facet && (
        <section className="border-b border-border pb-3">
          <CheckRow
            title="Могу сделать"
            subtitle={barEmpty ? 'Сначала отметьте, что есть дома, в «Моём баре»' : 'Только из того, что есть дома'}
            on={draft.can && !barEmpty}
            disabled={barEmpty}
            onToggle={() => setDraft({ ...draft, can: !draft.can })}
          />
          <CheckRow
            title="Только избранное"
            subtitle={favEmpty ? 'Отмечайте ♡ на странице коктейля' : 'Коктейли с сердцем'}
            on={draft.fav && !favEmpty}
            disabled={favEmpty}
            onToggle={() => setDraft({ ...draft, fav: !draft.fav })}
          />
        </section>
      )}
      {!facet && draft.ing && (
        <SheetSection title="Ингредиент">
          <ChipWrap label="Ингредиент">
            <Chip variant="removable" onClick={() => setDraft({ ...draft, ing: null })}>
              {getIngredient(draft.ing)?.name}
            </Chip>
          </ChipWrap>
        </SheetSection>
      )}
      {keys.map((key) => {
        const options = FACETS[key].options as readonly { id: string; label: string }[];
        const selected = draft[key] as string[];
        const body = (
          <ChipWrap label={FACETS[key].title}>
            {options.map((o) => (
              <Chip
                key={o.id}
                variant="option"
                selected={selected.includes(o.id)}
                onClick={() => setDraft({ ...draft, [key]: toggle(selected, o.id) })}
              >
                {o.label}
              </Chip>
            ))}
          </ChipWrap>
        );
        return facet ? (
          <div key={key} className="pt-2">
            <p className="mb-3 px-4 text-footnote text-fg-2">Можно выбрать несколько</p>
            {body}
          </div>
        ) : (
          <SheetSection key={key} title={FACETS[key].title}>
            {body}
          </SheetSection>
        );
      })}
    </BottomSheet>
  );
}
