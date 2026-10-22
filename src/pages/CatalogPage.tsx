import { useSearchParams } from 'react-router';
import { BASES, cocktails, countLabel, filterByBase, isBase } from '../lib/cocktails';
import type { Base } from '../types/cocktail';
import { Chip, ChipRow } from '../components/ui/Chip';
import { CocktailCard } from '../components/ui/CocktailCard';
import { ThemeToggle } from '../components/ThemeToggle';

export function CatalogPage() {
  const [params, setParams] = useSearchParams();
  const raw = params.get('base');
  const base = isBase(raw) ? raw : null;
  const list = filterByBase(cocktails, base);

  const select = (next: Base | null) => {
    // повторный тап по выбранному — сброс на «Все»
    const value = next === base ? null : next;
    setParams(value ? { base: value } : {}, { replace: true, preventScrollReset: true });
  };

  return (
    <main className="pb-safe">
      <header className="pt-safe flex items-center justify-between gap-3 px-4">
        <h1 className="text-large-title text-fg">Коктейли</h1>
        <ThemeToggle />
      </header>

      <ChipRow label="База" className="mt-3">
        <Chip selected={base === null} onClick={() => select(null)}>
          Все
        </Chip>
        {BASES.map((b) => (
          <Chip key={b.id} selected={base === b.id} onClick={() => select(b.id)}>
            {b.label}
          </Chip>
        ))}
      </ChipRow>

      <p className="mt-2 px-4 text-footnote text-fg-2" aria-live="polite">
        {countLabel(list.length)}
      </p>

      <ul className="mt-3 grid grid-cols-2 gap-3 px-4">
        {list.map((c) => (
          <li key={c.id}>
            <CocktailCard cocktail={c} />
          </li>
        ))}
      </ul>
    </main>
  );
}
