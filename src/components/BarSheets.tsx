import { useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';
import type { Cocktail } from '../types/cocktail';
import { cocktails, inCocktailsLabel } from '../lib/cocktails';
import { getIngredient } from '../lib/filters';
import {
  SUBS,
  TOOLS,
  canMake,
  isSectionKey,
  sectionOf,
  subOf,
  subOrder,
  unlocks,
  usage,
  useInventory,
  type Bottle,
  type SectionKey,
  type SubKey,
} from '../lib/inventory';
import { Toast, ToastAction } from './ui/Toast';
import { BarAddSheet } from './BarAddSheet';
import { BarItemSheet, type ShelfItem } from './BarItemSheet';

export type BarRow = ShelfItem & { section: SectionKey; sub: SubKey; meta?: string };

const inRecipes = (n: number) => (n ? inCocktailsLabel(n) : undefined);

/** Все позиции бара строками: отметки (ингредиенты, инструменты) + свои бутылки, по подкатегориям и алфавиту */
export function useBarRows(): BarRow[] {
  const { owned, bottles } = useInventory();
  return useMemo(() => {
    const out: BarRow[] = [];
    for (const id of owned) {
      const tool = TOOLS.find((t) => t.id === id);
      const name = tool?.name ?? getIngredient(id)?.name;
      if (!name) continue;
      const used = usage(id, cocktails);
      out.push({ id, title: name, subtitle: tool ? 'подскажем замену' : undefined, used, section: sectionOf(id), sub: subOf(id), meta: inRecipes(used.length) });
    }
    for (const b of bottles) {
      const used = b.ref ? usage(b.ref, cocktails) : [];
      out.push({
        id: b.id,
        title: b.name,
        subtitle: [b.ref ? getIngredient(b.ref)?.name : 'Другое', b.note].filter(Boolean).join(' · '),
        bottle: b,
        used,
        section: sectionOf(b.ref),
        sub: subOf(b.ref),
        meta: b.ref ? inRecipes(used.length) : 'не в рецептах',
      });
    }
    const key = (r: BarRow) => (r.bottle ? r.bottle.ref : r.id);
    return out.sort((a, b) => subOrder(key(a)) - subOrder(key(b)) || a.title.localeCompare(b.title, 'ru'));
  }, [owned, bottles]);
}

/** Шторки «Моего бара» живут в хэше: #add-<раздел>[-<подкатегория>], #item-<id>; «Назад» закрывает */
export function useBarNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const open = (hash: string) => navigate({ hash }, { state: { sheet: true }, preventScrollReset: true });
  const close = () => {
    if ((location.state as { sheet?: boolean } | null)?.sheet) navigate(-1);
    else navigate({ hash: '' }, { replace: true, preventScrollReset: true });
  };
  return {
    openAdd: (section: SectionKey, sub?: SubKey) => open(`#add-${section}${sub ? `-${sub}` : ''}`),
    openItem: (id: string) => open(`#item-${id}`),
    close,
  };
}

function parseAdd(hash: string): { section: SectionKey; sub?: SubKey } | null {
  const m = hash.match(/^#add-(alcohol|mixers)(?:-([\w-]+))?$/);
  if (!m || !isSectionKey(m[1])) return null;
  const sub = SUBS.find((s) => s.id === m[2] && s.section === m[1])?.id;
  return { section: m[1], sub };
}

/** Шторки «Добавить» и позиции + тост «Вернуть» — общие для главной и страниц разделов */
export function BarSheets({ rows, aboveTabBar }: { rows: BarRow[]; aboveTabBar?: boolean }) {
  const { inv, owned, bottles, add, remove, addBottle, updateBottle, removeBottle, restoreBottle } = useInventory();
  const location = useLocation();
  const { close } = useBarNav();
  const isAvailable = (c: Cocktail) => canMake(c, inv);
  const addCtx = parseAdd(location.hash);
  // последний контекст держим, пока шторка анимированно закрывается
  const [lastCtx, setLastCtx] = useState<{ section: SectionKey; sub?: SubKey }>({ section: 'alcohol' });
  if (addCtx && (addCtx.section !== lastCtx.section || addCtx.sub !== lastCtx.sub)) setLastCtx(addCtx);
  const ctx = addCtx ?? lastCtx;
  const suggestions = useMemo(() => unlocks(cocktails, inv, 3, (r) => sectionOf(r) === ctx.section), [inv, ctx.section]);
  const item = location.hash.startsWith('#item-') ? (rows.find((r) => `#item-${r.id}` === location.hash) ?? null) : null;

  const [undo, setUndo] = useState<{ key: number; title: string; restore: () => void } | null>(null);
  const removeItem = (it: ShelfItem) => {
    const b: Bottle | undefined = it.bottle;
    if (b) removeBottle(b.id);
    else remove(it.id);
    setUndo({ key: Date.now(), title: it.title, restore: () => (b ? restoreBottle(b) : add([it.id])) });
    close();
  };

  return (
    <>
      <BarAddSheet
        open={!!addCtx}
        onClose={close}
        section={ctx.section}
        sub={ctx.sub}
        owned={owned}
        bottles={bottles}
        suggestions={suggestions}
        onToggle={(id) => (owned.has(id) ? remove(id) : add([id]))}
        onCreateBottle={(b) => addBottle(b)}
      />
      <BarItemSheet item={item} onClose={close} onRemove={removeItem} onSaveBottle={updateBottle} isAvailable={isAvailable} />
      {undo && (
        <Toast
          key={undo.key}
          icon={Trash2}
          filled={false}
          aboveTabBar={aboveTabBar}
          text={`«${undo.title}» убрано`}
          action={<ToastAction onClick={() => (undo.restore(), setUndo(null))}>Вернуть</ToastAction>}
          onDone={() => setUndo(null)}
        />
      )}
    </>
  );
}
