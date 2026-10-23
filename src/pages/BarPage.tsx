import { useMemo, useState } from 'react';
import { ChevronRight, HardDriveDownload, Heart, Plus, Sparkles, Trash2 } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import type { Cocktail } from '../types/cocktail';
import { cocktails, getCocktail, plural } from '../lib/cocktails';
import { getIngredient } from '../lib/filters';
import { useFavorites } from '../lib/favorites';
import {
  QUICK_START,
  SHELVES,
  TOOLS,
  barSummary,
  canMake,
  inventoryPersisted,
  shelfOf,
  shelfOrder,
  unlocks,
  usage,
  useInventory,
  type Bottle,
  type ShelfKey,
} from '../lib/inventory';
import { BarSummary, HintLine, InfoNote } from '../components/ui/Availability';
import { BarItemRow, UnlockRow } from '../components/ui/BarRows';
import { Button, IconButton } from '../components/ui/Button';
import { CardRail, CardRailItem } from '../components/ui/CardRail';
import { CocktailCard } from '../components/ui/CocktailCard';
import { EmptyState } from '../components/ui/EmptyState';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Toast, ToastAction } from '../components/ui/Toast';
import { BarAddSheet } from '../components/BarAddSheet';
import { BarItemSheet, type ShelfItem } from '../components/BarItemSheet';

const inRecipes = (n: number) => (n ? `в ${n} ${plural(n, ['коктейле', 'коктейлях', 'коктейлях'])}` : undefined);

type Row = ShelfItem & { shelf: ShelfKey; order: number; meta?: string };

/** Полка «Моего бара» [Итерация «Мой бар»]: моё — строками по секциям, справочник — в шторке «Добавить» */
export function BarPage() {
  const { inv, owned, bottles, add, remove, addBottle, updateBottle, removeBottle, restoreBottle } = useInventory();
  const location = useLocation();
  const navigate = useNavigate();
  const summary = useMemo(() => barSummary(cocktails, inv), [inv]);
  const toBuy = useMemo(() => unlocks(cocktails, inv), [inv]);
  const isAvailable = (c: Cocktail) => canMake(c, inv);
  const { list: favIds } = useFavorites();
  const favs = favIds.map((id) => getCocktail(id)).filter((c) => !!c);

  // --- шторки живут в хэше: «Назад» закрывает шторку ---
  const openSheet = (hash: string) => navigate({ hash }, { state: { sheet: true }, preventScrollReset: true });
  const closeSheet = () => {
    if ((location.state as { sheet?: boolean } | null)?.sheet) navigate(-1);
    else navigate({ hash: '' }, { replace: true, preventScrollReset: true });
  };

  // --- строки полки: отметки + свои бутылки ---
  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    for (const id of owned) {
      const tool = TOOLS.find((t) => t.id === id);
      const name = tool?.name ?? getIngredient(id)?.name;
      if (!name) continue;
      const used = usage(id, cocktails);
      out.push({ id, title: name, subtitle: tool ? 'подскажем замену' : undefined, used, shelf: shelfOf(id), order: shelfOrder(id), meta: inRecipes(used.length) });
    }
    for (const b of bottles) {
      const used = b.ref ? usage(b.ref, cocktails) : [];
      const type = b.ref ? getIngredient(b.ref)?.name : 'Другое';
      out.push({
        id: b.id,
        title: b.name,
        subtitle: [type, b.note].filter(Boolean).join(' · '),
        bottle: b,
        used,
        shelf: shelfOf(b.ref),
        order: shelfOrder(b.ref),
        meta: b.ref ? inRecipes(used.length) : 'не в рецептах',
      });
    }
    return out.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, 'ru'));
  }, [owned, bottles]);

  const sheetItem = location.hash.startsWith('#item-') ? (rows.find((r) => `#item-${r.id}` === location.hash) ?? null) : null;
  const empty = rows.length === 0;

  // --- «Убрать» с тостом «Вернуть» ---
  const [undo, setUndo] = useState<{ key: number; title: string; restore: () => void } | null>(null);
  const removeItem = (item: ShelfItem) => {
    const b: Bottle | undefined = item.bottle;
    if (b) removeBottle(b.id);
    else remove(item.id);
    setUndo({ key: Date.now(), title: item.title, restore: () => (b ? restoreBottle(b) : add([item.id])) });
    closeSheet();
  };

  const buySection = toBuy.length > 0 && (
    <section className="mt-6" aria-label="Докупить">
      <SectionHeader title="Докупить" />
      <ul className="mt-1 flex flex-col gap-2 px-4">
        {toBuy.map((u) => (
          <li key={u.ref}>
            <UnlockRow name={u.name} hint={`откроет ${u.count} ${plural(u.count, ['коктейль', 'коктейля', 'коктейлей'])}`} onAdd={() => add([u.ref])} />
          </li>
        ))}
      </ul>
    </section>
  );

  const favSection = favs.length > 0 && (
    <section className="mt-6" aria-label="Избранное">
      <SectionHeader
        title="Избранное"
        action={
          <Link to="/?fav=1" className="pressable -mr-2 inline-flex h-tap items-center gap-0.5 rounded-control px-2 text-subhead text-fg-2">
            Все {favs.length}
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        }
      />
      <CardRail label="Избранные коктейли" className="mt-2">
        {favs.map((c) => (
          <CardRailItem key={c.id}>
            <CocktailCard cocktail={c} available={isAvailable(c)} compact />
          </CardRailItem>
        ))}
      </CardRail>
    </section>
  );

  return (
    <main className="pb-tabbar">
      <header className="pt-safe flex items-start justify-between gap-3 px-4">
        <div className="min-w-0">
          <h1 className="font-display text-display text-fg">Мой бар</h1>
          <p className="mt-1 text-footnote text-fg-2" aria-live="polite">
            {empty ? 'Пока пусто' : `${rows.length} ${plural(rows.length, ['позиция', 'позиции', 'позиций'])}`}
          </p>
        </div>
        <IconButton icon={Plus} label="Добавить в бар" size="l" className="mt-1 bg-tile-strong!" onClick={() => openSheet('#add')} />
      </header>

      {!inventoryPersisted && (
        <InfoNote icon={HardDriveDownload} className="mx-4 mt-4">
          Браузер не даёт сохранить бар — он сохранится до закрытия вкладки.
        </InfoNote>
      )}

      {empty ? (
        <>
          <EmptyState
            title="Соберите бар за минуту"
            hint="Отметьте, что есть дома — покажем, что можно приготовить"
            action={
              <div className="flex flex-col items-stretch gap-2">
                <Button icon={Plus} onClick={() => openSheet('#add')}>
                  Добавить
                </Button>
                <Button variant="plain" size="m" icon={Sparkles} onClick={() => add(QUICK_START)}>
                  Быстрый старт: базовый бар
                </Button>
              </div>
            }
          />
          {favSection || (
            <HintLine icon={Heart} className="px-4">
              Нажмите сердце на странице коктейля — он появится в «Избранном»
            </HintLine>
          )}
        </>
      ) : (
        <>
          <div className="mt-5 px-4">
            <BarSummary can={summary.can} nearly={summary.nearly} to="/?can=1" />
          </div>
          {/* ничего не получается — «Докупить» сразу под итогом */}
          {summary.can === 0 && buySection}
          {favSection}
          {SHELVES.map((s) => {
            const items = rows.filter((r) => r.shelf === s.id);
            if (!items.length) return null;
            return (
              <section key={s.id} className="mt-6" aria-label={s.label}>
                <SectionHeader title={s.label} />
                <ul className="mt-1 flex flex-col gap-2 px-4">
                  {items.map((r) => (
                    <li key={r.id}>
                      <BarItemRow title={r.title} subtitle={r.subtitle} meta={r.meta} onClick={() => openSheet(`#item-${r.id}`)} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
          {summary.can > 0 && buySection}
        </>
      )}

      <BarAddSheet
        open={location.hash === '#add'}
        onClose={closeSheet}
        owned={owned}
        bottles={bottles}
        onToggle={(id) => (owned.has(id) ? remove(id) : add([id]))}
        onCreateBottle={(b) => addBottle(b)}
      />
      <BarItemSheet
        item={sheetItem}
        onClose={closeSheet}
        onRemove={removeItem}
        onSaveBottle={updateBottle}
        isAvailable={isAvailable}
      />
      {undo && (
        <Toast
          key={undo.key}
          icon={Trash2}
          filled={false}
          aboveTabBar
          text={`«${undo.title}» убрано`}
          action={<ToastAction onClick={() => (undo.restore(), setUndo(null))}>Вернуть</ToastAction>}
          onDone={() => setUndo(null)}
        />
      )}
    </main>
  );
}
