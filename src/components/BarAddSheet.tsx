import { useEffect, useMemo, useState } from 'react';
import { ingredients, normalize, popularIngredients } from '../lib/filters';
import { SHELVES, TOOLS, findBottle, shelfOf, shelfOrder, type Bottle, type Inventory, type ShelfKey } from '../lib/inventory';
import { plural } from '../lib/cocktails';
import { BottomSheet, SheetFooter } from './ui/BottomSheet';
import { Button } from './ui/Button';
import { Chip, ChipRow } from './ui/Chip';
import { AddCustomRow, PickRow } from './ui/BarRows';
import { BottleForm } from './ui/BottleForm';
import { SearchBar } from './ui/SearchBar';

type Item = { id: string; name: string; aliases: string[]; shelf: ShelfKey };

const ITEMS: Item[] = [
  ...ingredients.filter((d) => !d.pantry).map((d) => ({ id: d.id, name: d.name, aliases: d.aliases, shelf: shelfOf(d.id) })),
  ...TOOLS.map((t) => ({ id: t.id, name: t.name, aliases: [], shelf: 'tools' as const })),
].sort((a, b) => shelfOrder(a.id) - shelfOrder(b.id) || a.name.localeCompare(b.name, 'ru'));

const FILTERS: { id: ShelfKey | 'all'; label: string }[] = [
  { id: 'all', label: 'Всё' },
  { id: 'alcohol', label: 'Алкоголь' },
  { id: 'mixers', label: 'Миксеры' },
  { id: 'tools', label: 'Инструменты' },
];

type Props = {
  open: boolean;
  onClose: () => void;
  owned: Inventory;
  bottles: readonly Bottle[];
  onToggle: (id: string) => void;
  onCreateBottle: (b: Omit<Bottle, 'id'>) => void;
  /** для витрины */
  inline?: boolean;
  initialQuery?: string;
  initialStep?: 'pick' | 'bottle';
};

/**
 * Шторка «Добавить в бар» [Subway, Perplexity, Shopify]: поиск + фильтр-чипсы, строки + / ✓ (шторка не
 * закрывается), «Добавить «…» как свою бутылку» → шаг 2 в той же шторке. Футер: «Добавлено N» + «Готово».
 */
export function BarAddSheet({ open, onClose, owned, bottles, onToggle, onCreateBottle, inline, initialQuery = '', initialStep = 'pick' }: Props) {
  const [q, setQ] = useState(initialQuery);
  const [filter, setFilter] = useState<ShelfKey | 'all'>('all');
  const [step, setStep] = useState(initialStep);
  const [added, setAdded] = useState(0);
  useEffect(() => {
    if (open && !inline) {
      setQ('');
      setStep('pick');
      setAdded(0);
    }
  }, [open, inline]);

  const n = normalize(q);
  const list = useMemo(
    () =>
      ITEMS.filter(
        (i) => (filter === 'all' || i.shelf === filter) && (!n || [i.name, ...i.aliases].some((x) => normalize(x).includes(n))),
      ),
    [filter, n],
  );
  const popular = !n && filter === 'all' ? popularIngredients() : [];
  const exact = n && (ITEMS.some((i) => normalize(i.name) === n) || !!findBottle(bottles, q));
  const toggle = (id: string) => {
    if (!owned.has(id)) setAdded((a) => a + 1);
    onToggle(id);
  };

  const row = (i: { id: string; name: string }, subtitle?: string) => (
    <PickRow key={i.id} title={i.name} subtitle={subtitle} on={owned.has(i.id)} onToggle={() => toggle(i.id)} />
  );
  const sections = SHELVES.filter((s) => s.id !== 'other' && (filter === 'all' || filter === s.id));

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      inline={inline}
      initialDetent="large"
      title={step === 'bottle' ? 'Своя бутылка' : 'Добавить в бар'}
      onBack={step === 'bottle' ? () => setStep('pick') : undefined}
      footer={
        step === 'pick' && (
          <SheetFooter>
            <p className="text-subhead text-fg-2" aria-live="polite">
              {added ? `Добавлено ${added} ${plural(added, ['позиция', 'позиции', 'позиций'])}` : 'Отметьте, что есть'}
            </p>
            <Button onClick={onClose}>Готово</Button>
          </SheetFooter>
        )
      }
    >
      {step === 'bottle' ? (
        <div className="pt-2 pb-6">
          <BottleForm
            initial={{ name: q.trim(), ref: null }}
            submitLabel="Добавить в бар"
            onSubmit={(b) => {
              onCreateBottle(b);
              setAdded((a) => a + 1);
              setQ('');
              setStep('pick');
            }}
          />
        </div>
      ) : (
        <>
          <div className="px-4 pt-1">
            <SearchBar value={q} onChange={setQ} placeholder="Джин, Laphroaig 10, тоник…" aria-label="Найти в справочнике" autoFocus={!inline} />
          </div>
          <ChipRow label="Раздел" className="mt-3">
            {FILTERS.map((f) => (
              <Chip key={f.id} selected={filter === f.id} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
                {f.label}
              </Chip>
            ))}
          </ChipRow>

          <div className="mt-2 pb-4">
            {n && !exact && <AddCustomRow query={q} onClick={() => setStep('bottle')} />}
            {popular.length > 0 && (
              <section>
                <h3 className="px-4 pt-4 pb-1 text-footnote text-fg-2">Популярное</h3>
                {popular.map((d) => row(d, SHELVES.find((s) => s.id === shelfOf(d.id))?.label))}
              </section>
            )}
            {n
              ? list.map((i) => row(i, SHELVES.find((s) => s.id === i.shelf)?.label))
              : sections.map((s) => (
                  <section key={s.id}>
                    <h3 className="px-4 pt-4 pb-1 text-footnote text-fg-2">{s.label}</h3>
                    {list.filter((i) => i.shelf === s.id).map((i) => row(i))}
                  </section>
                ))}
            {n && !list.length && exact && <p className="px-4 py-3 text-subhead text-fg-2">Уже есть в баре</p>}
          </div>
        </>
      )}
    </BottomSheet>
  );
}
