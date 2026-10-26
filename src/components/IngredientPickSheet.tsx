import { useEffect, useMemo, useRef, useState } from 'react';
import { ingredients, normalize } from '../lib/filters';
import { SUBS, subLabel, subOf, subOrder } from '../lib/inventory';
import { BottomSheet } from './ui/BottomSheet';
import { Button } from './ui/Button';
import { GroupHeader, PickRow } from './ui/BarRows';
import { TypeNav, typeAnchor } from './ui/TypeNav';
import { SearchBar } from './ui/SearchBar';

// весь справочник (и «всегда есть» — сахар, вода), без инструментов и своих бутылок
const ITEMS = ingredients
  .map((d) => ({ id: d.id, name: d.name, aliases: d.aliases, sub: subOf(d.id) }))
  .sort((a, b) => subOrder(a.id) - subOrder(b.id) || a.name.localeCompare(b.name, 'ru'));
const TYPES = SUBS.filter((s) => s.group && ITEMS.some((i) => i.sub === s.id));

type Props = {
  open: boolean;
  onClose: () => void;
  /** ref, уже добавленные в рецепт */
  picked: ReadonlySet<string>;
  onToggle: (ref: string) => void;
  /** для витрины */
  inline?: boolean;
  initialQuery?: string;
};

const CHIPS_H = 68; // как в BarAddSheet: py-2 + чипс 44 + py-1

/**
 * Выбор ингредиентов для авторского коктейля — та же шторка, что «Добавить» в «Моём баре»
 * (поиск, чипсы-якоря по типам, строки + / ✓), но по обоим разделам и **без своей бутылки и «Советуем»**:
 * рецепт собирается только из справочника.
 */
export function IngredientPickSheet({ open, onClose, picked, onToggle, inline, initialQuery = '' }: Props) {
  const [q, setQ] = useState(initialQuery);
  useEffect(() => {
    if (open && !inline) setQ('');
  }, [open, inline]);

  const anchor = useRef<HTMLDivElement>(null);
  const prefix = 'pick';
  const n = normalize(q);
  const list = useMemo(() => ITEMS.filter((i) => !n || [i.name, ...i.aliases].some((x) => normalize(x).includes(n))), [n]);
  // не найдено — свою позицию не предлагаем: только подсказка
  const row = (id: string, name: string, subtitle?: string) => (
    <PickRow key={id} title={name} subtitle={subtitle} on={picked.has(id)} onToggle={() => onToggle(id)} />
  );

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      inline={inline}
      initialDetent="large"
      title="Ингредиенты"
      footer={
        <Button className="w-full" onClick={onClose}>
          Готово
        </Button>
      }
    >
      <div ref={anchor} className="px-4 pt-1">
        <SearchBar value={q} onChange={setQ} placeholder="Название или бренд" aria-label="Найти в справочнике" autoFocus={!inline} />
      </div>
      {!n && (
        <TypeNav
          items={TYPES.map((s) => ({ id: s.id, label: s.label }))}
          prefix={prefix}
          offset={CHIPS_H}
          className="sticky top-0 z-20 mt-1 bg-surface py-2"
        />
      )}
      <div className="pb-4">
        {n
          ? list.map((i) => row(i.id, i.name, subLabel(i.sub)))
          : TYPES.map((s) => (
              <section key={s.id} id={typeAnchor(prefix, s.id)}>
                <GroupHeader title={s.label} />
                {list.filter((i) => i.sub === s.id).map((i) => row(i.id, i.name))}
              </section>
            ))}
        {n && !list.length && <p className="px-4 py-3 text-subhead text-fg-2">Такого нет в справочнике — рецепт собирается из того, что есть в баре</p>}
      </div>
    </BottomSheet>
  );
}
