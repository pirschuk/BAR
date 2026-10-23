import { useEffect, useMemo, useRef, useState } from 'react';
import { ingredients, normalize } from '../lib/filters';
import { TOOLS, findBottle, sectionOf, subLabel, subOf, subOrder, subsOf, SECTIONS, type Bottle, type Inventory, type SectionKey, type SubKey } from '../lib/inventory';
import { plural } from '../lib/cocktails';
import { BottomSheet, SheetFooter } from './ui/BottomSheet';
import { Button } from './ui/Button';
import { Chip, ChipRow } from './ui/Chip';
import { AddCustomRow, PickRow } from './ui/BarRows';
import { BottleForm } from './ui/BottleForm';
import { SearchBar } from './ui/SearchBar';

type Item = { id: string; name: string; aliases: string[]; sub: SubKey; section: SectionKey };

const ITEMS: Item[] = [
  ...ingredients.filter((d) => !d.pantry).map((d) => ({ id: d.id, name: d.name, aliases: d.aliases, sub: subOf(d.id), section: sectionOf(d.id) })),
  ...TOOLS.map((t) => ({ id: t.id, name: t.name, aliases: [], sub: 'tools' as const, section: 'mixers' as const })),
].sort((a, b) => subOrder(a.id) - subOrder(b.id) || a.name.localeCompare(b.name, 'ru'));

export type Suggestion = { ref: string; name: string; count: number };

type Props = {
  open: boolean;
  onClose: () => void;
  /** раздел, из которого открыли; подкатегория — выбранный фильтр */
  section: SectionKey;
  sub?: SubKey;
  owned: Inventory;
  bottles: readonly Bottle[];
  /** «Советуем» — что откроет больше коктейлей (бывший «Докупить») */
  suggestions: Suggestion[];
  onToggle: (id: string) => void;
  onCreateBottle: (b: Omit<Bottle, 'id'>) => void;
  /** для витрины */
  inline?: boolean;
  initialQuery?: string;
};

/**
 * Шторка «Добавить» в контексте раздела [Subway, Insight Timer, Shopify]: заголовок «Добавить газировку»,
 * чипсы подкатегорий раздела, «Советуем» (+N коктейлей), строки + / ✓ (шторка не закрывается),
 * «Добавить «…» как свою бутылку» → форма; тип бутылки — только из этого раздела.
 */
export function BarAddSheet({ open, onClose, section, sub, owned, bottles, suggestions, onToggle, onCreateBottle, inline, initialQuery = '' }: Props) {
  const subs = subsOf(section).filter((s) => s.id !== 'custom');
  const [q, setQ] = useState(initialQuery);
  const [filter, setFilter] = useState<SubKey | 'all'>(sub ?? 'all');
  const [step, setStep] = useState<'pick' | 'bottle'>('pick');
  const [added, setAdded] = useState(0);
  useEffect(() => {
    if (open && !inline) {
      setQ('');
      setStep('pick');
      setAdded(0);
      setFilter(sub ?? 'all');
    }
  }, [open, inline, sub, section]);

  // выбранная подкатегория может стоять за краем ряда — доскроллить к ней
  const chips = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open) chips.current?.querySelector('[aria-pressed="true"]')?.scrollIntoView({ inline: 'nearest', block: 'nearest' });
  }, [open, filter]);

  const n = normalize(q);
  const list = useMemo(
    () =>
      ITEMS.filter(
        (i) => i.section === section && (filter === 'all' || i.sub === filter) && (!n || [i.name, ...i.aliases].some((x) => normalize(x).includes(n))),
      ),
    [section, filter, n],
  );
  const advice = !n ? suggestions.filter((s) => filter === 'all' || subOf(s.ref) === filter) : [];
  const exact = n && (ITEMS.some((i) => normalize(i.name) === n) || !!findBottle(bottles, q));
  const title = `Добавить ${filter === 'all' ? SECTIONS.find((s) => s.id === section)!.addLabel : subs.find((s) => s.id === filter)!.addLabel}`;
  const groups = subs.flatMap((s) => (s.group ? [s.group] : []));
  const toggle = (id: string) => {
    if (!owned.has(id)) setAdded((a) => a + 1);
    onToggle(id);
  };
  const row = (id: string, name: string, subtitle?: string) => (
    <PickRow key={id} title={name} subtitle={subtitle} on={owned.has(id)} onToggle={() => toggle(id)} />
  );
  const shownSubs = subs.filter((s) => filter === 'all' || s.id === filter);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      inline={inline}
      initialDetent="large"
      title={step === 'bottle' ? 'Своя бутылка' : title}
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
            groups={groups}
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
            <SearchBar value={q} onChange={setQ} placeholder="Название или бренд" aria-label="Найти в справочнике" autoFocus={!inline && !sub} />
          </div>
          <div ref={chips}>
            <ChipRow label="Подкатегория" className="mt-3 scroll-px-4">
              <Chip selected={filter === 'all'} aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
                Всё
              </Chip>
              {subs.map((s) => (
                <Chip key={s.id} selected={filter === s.id} aria-pressed={filter === s.id} onClick={() => setFilter(s.id)}>
                  {s.label}
                </Chip>
              ))}
            </ChipRow>
          </div>

          <div className="mt-2 pb-4">
            {n && !exact && <AddCustomRow query={q} onClick={() => setStep('bottle')} />}
            {advice.length > 0 && (
              <section>
                <h3 className="px-4 pt-4 pb-1 text-footnote text-fg-2">Советуем</h3>
                {advice.map((a) => row(a.ref, a.name, `+${a.count} ${plural(a.count, ['коктейль', 'коктейля', 'коктейлей'])}`))}
              </section>
            )}
            {n
              ? list.map((i) => row(i.id, i.name, subLabel(i.sub)))
              : shownSubs.map((s) => (
                  <section key={s.id}>
                    <h3 className="px-4 pt-4 pb-1 text-footnote text-fg-2">{s.label}</h3>
                    {list.filter((i) => i.sub === s.id).map((i) => row(i.id, i.name))}
                  </section>
                ))}
            {n && !list.length && exact && <p className="px-4 py-3 text-subhead text-fg-2">Уже есть в баре</p>}
          </div>
        </>
      )}
    </BottomSheet>
  );
}
