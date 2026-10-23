import { useMemo, useState } from 'react';
import { HardDriveDownload, Sparkles, Wine } from 'lucide-react';
import { cocktails, plural } from '../lib/cocktails';
import { getIngredient, ingredients, normalize, popularIngredients } from '../lib/filters';
import { BAR_GROUPS, QUICK_START, TOOLS, barItems, barSummary, inventoryPersisted, useInventory } from '../lib/inventory';
import { BarSummary, InfoNote } from '../components/ui/Availability';
import { Button } from '../components/ui/Button';
import { Chip, ChipWrap } from '../components/ui/Chip';
import { EmptyState } from '../components/ui/EmptyState';
import { SearchBar } from '../components/ui/SearchBar';
import { SectionHeader } from '../components/ui/SectionHeader';

type Item = { id: string; name: string; aliases?: string[] };

const TOOL_ITEMS: Item[] = TOOLS.map((t) => ({ id: t.id, name: t.name }));

function OptionChips({ label, items, has, toggle }: { label: string; items: Item[]; has: (id: string) => boolean; toggle: (id: string) => void }) {
  return (
    <ChipWrap label={label}>
      {items.map((d) => (
        <Chip key={d.id} variant="option" selected={has(d.id)} onClick={() => toggle(d.id)}>
          {d.name}
        </Chip>
      ))}
    </ChipWrap>
  );
}

export function BarPage() {
  const { inv, toggle, add, remove } = useInventory();
  const [query, setQuery] = useState('');
  const summary = useMemo(() => barSummary(cocktails, inv), [inv]);
  const has = (id: string) => inv.has(id);

  const q = normalize(query);
  const found = useMemo<Item[]>(() => {
    if (!q) return [];
    const all: Item[] = [...ingredients.filter((d) => !d.pantry), ...TOOL_ITEMS];
    return all.filter((d) => [d.name, ...(d.aliases ?? [])].some((n) => normalize(n).includes(q)));
  }, [q]);
  const selected: Item[] = [...inv].map((id) => getIngredient(id) ?? TOOL_ITEMS.find((t) => t.id === id)).filter((d): d is Item => !!d);

  return (
    <main className="pb-tabbar">
      <header className="pt-safe px-4">
        <div className="flex min-h-tap items-center">
          <h1 className="text-large-title text-fg">Мой бар</h1>
        </div>
        <p className="text-footnote text-fg-2" aria-live="polite">
          {`${inv.size} ${plural(inv.size, ['позиция', 'позиции', 'позиций'])}`}
        </p>
      </header>

      {!inventoryPersisted && (
        <InfoNote icon={HardDriveDownload} className="mx-4 mt-4">
          Браузер не даёт сохранить бар — он сохранится до закрытия вкладки.
        </InfoNote>
      )}

      {inv.size === 0 ? (
        <EmptyState
          icon={Wine}
          title="Бар пока пуст"
          hint="Отметьте, что есть дома — покажем, что можно приготовить"
          action={
            <Button variant="secondary" size="m" icon={Sparkles} onClick={() => add(QUICK_START)}>
              Быстрый старт: базовый бар
            </Button>
          }
        />
      ) : (
        <div className="mt-4 px-4">
          <BarSummary can={summary.can} nearly={summary.nearly} to="/?can=1" />
        </div>
      )}

      <div className={`${inv.size ? 'mt-6' : 'mt-0'} px-4`}>
        <SearchBar value={query} onChange={setQuery} placeholder="Найти ингредиент" aria-label="Найти ингредиент" showCancel={!!query} onCancel={() => setQuery('')} />
      </div>

      {q ? (
        <>
          {selected.length > 0 && (
            <section className="mt-4">
              <SectionHeader title="Отмечено" />
              <ChipWrap label="Отмечено" className="mt-1">
                {selected.map((d) => (
                  <Chip key={d.id} variant="removable" aria-label={`Убрать ${d.name}`} onClick={() => remove(d.id)}>
                    {d.name}
                  </Chip>
                ))}
              </ChipWrap>
            </section>
          )}
          <section className="mt-4">
            <SectionHeader title="Найдено" />
            {found.length ? (
              <OptionChips label="Найдено" items={found} has={has} toggle={toggle} />
            ) : (
              <p className="px-4 text-subhead text-fg-2">Такого ингредиента нет в рецептах</p>
            )}
          </section>
        </>
      ) : (
        <>
          <section className="mt-6">
            <SectionHeader title="Популярное" />
            <OptionChips label="Популярное" items={popularIngredients()} has={has} toggle={toggle} />
          </section>
          {BAR_GROUPS.map((g) => (
            <section key={g.id} className="mt-6">
              <SectionHeader title={g.label} />
              <OptionChips label={g.label} items={barItems(g.id)} has={has} toggle={toggle} />
            </section>
          ))}
          <section className="mt-6">
            <SectionHeader title="Инструменты" />
            <p className="mb-2 px-4 text-footnote text-fg-2">Не скрывают рецепты — подскажем, чем заменить</p>
            <OptionChips label="Инструменты" items={TOOL_ITEMS} has={has} toggle={toggle} />
          </section>
        </>
      )}

    </main>
  );
}
