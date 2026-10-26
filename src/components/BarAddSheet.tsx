import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ingredients, normalize } from '../lib/filters';
import { TOOLS, findBottle, sectionOf, subLabel, subOf, subOrder, subsOf, SECTIONS, type Bottle, type Inventory, type SectionKey, type SubKey } from '../lib/inventory';
import { plural } from '../lib/cocktails';
import { BottomSheet } from './ui/BottomSheet';
import { Button } from './ui/Button';
import { AddCustomRow, GroupHeader, PickRow, SuggestCard } from './ui/BarRows';
import { TypeNav, typeAnchor } from './ui/TypeNav';
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
 * Шторка «Добавить» в контексте раздела [Subway, Insight Timer, Shopify]: «Советуем» — отдельная плитка;
 * список по типам с липкими заголовками и отступом 24; чипсы-якоря (прокрутка + подсветка текущего типа);
 * строки + / ✓ (шторка не закрывается); «Добавить «…» как свою бутылку» → форма (тип — из этого раздела).
 */
const CHIPS_H = 68; // высота липкого ряда чипсов: py-2 + ряд (чипс 44 + py-1)
export function BarAddSheet({ open, onClose, section, sub, owned, bottles, suggestions, onToggle, onCreateBottle, inline, initialQuery = '' }: Props) {
  const subs = subsOf(section).filter((s) => s.id !== 'custom');
  const [q, setQ] = useState(initialQuery);
  const [step, setStep] = useState<'pick' | 'bottle'>('pick');
  useEffect(() => {
    if (open && !inline) {
      setQ('');
      setStep('pick');
    }
  }, [open, inline, sub, section]);

  // контейнер прокрутки шторки — для чипсов-якорей; открыли на подкатегории — сразу к ней
  const anchor = useRef<HTMLDivElement>(null);
  const scrollRoot = useCallback(() => anchor.current?.closest<HTMLElement>('.overflow-y-auto') ?? null, []);
  const prefix = `add-${section}`;
  useEffect(() => {
    if (!open || !sub) return;
    const t = setTimeout(() => {
      const root = scrollRoot();
      const el = document.getElementById(typeAnchor(prefix, sub));
      if (root && el) root.scrollTo({ top: root.scrollTop + el.getBoundingClientRect().top - root.getBoundingClientRect().top - CHIPS_H });
    }, 50);
    return () => clearTimeout(t);
  }, [open, sub, prefix, scrollRoot]);

  const n = normalize(q);
  const list = useMemo(
    () =>
      ITEMS.filter(
        (i) => i.section === section && (!n || [i.name, ...i.aliases].some((x) => normalize(x).includes(n))),
      ),
    [section, n],
  );
  const advice = !n ? suggestions : [];
  const exact = n && (ITEMS.some((i) => normalize(i.name) === n) || !!findBottle(bottles, q));
  const title = `Добавить ${SECTIONS.find((s) => s.id === section)!.addLabel}`;
  const groups = subs.flatMap((s) => (s.group ? [s.group] : []));
  const toggle = (id: string) => onToggle(id);
  const row = (id: string, name: string, subtitle?: string) => (
    <PickRow key={id} title={name} subtitle={subtitle} on={owned.has(id)} onToggle={() => toggle(id)} />
  );

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
          <Button className="w-full" onClick={onClose}>
            Готово
          </Button>
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
              setQ('');
              setStep('pick');
            }}
          />
        </div>
      ) : (
        <>
          <div ref={anchor} className="px-4 pt-1">
            <SearchBar value={q} onChange={setQ} placeholder="Название или бренд" aria-label="Найти в справочнике" autoFocus={!inline && !sub} />
          </div>
          {/* чипсы-якоря липнут к верху шторки; при поиске список плоский — чипсы не нужны */}
          {!n && (
            <TypeNav
              items={subs.map((s) => ({ id: s.id, label: s.label }))}
              prefix={prefix}
              offset={CHIPS_H}
              className="sticky top-0 z-20 mt-1 bg-surface py-2"
            />
          )}

          <div className="pb-4">
            {n && !exact && <AddCustomRow query={q} onClick={() => setStep('bottle')} />}
            {advice.length > 0 && (
              <div className="mt-2">
                <SuggestCard>
                  {advice.map((a) => row(a.ref, a.name, `+${a.count} ${plural(a.count, ['коктейль', 'коктейля', 'коктейлей'])}`))}
                </SuggestCard>
              </div>
            )}
            {n
              ? list.map((i) => row(i.id, i.name, subLabel(i.sub)))
              : subs.map((s) => (
                  <section key={s.id} id={typeAnchor(prefix, s.id)}>
                    <GroupHeader title={s.label} />
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
