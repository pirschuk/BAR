import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { Citrus, Heart, PenLine, Plus, SlidersHorizontal, Trash2 } from 'lucide-react';
import { Toast, ToastAction } from '../components/ui/Toast';
import { useCustomCocktails } from '../lib/custom';
import { setNav } from '../lib/motion';
import { useIsGhost } from '../components/SwipeBack';
import { cocktails, countLabel, glassLabel, iceLabel, methodLabel } from '../lib/cocktails';
import {
  EMPTY_FILTERS,
  FACETS,
  activeCount,
  applyFilters,
  facetLabel,
  filtersToParams,
  getIngredient,
  hasFacetFilters,
  isFacetKey,
  parseFilters,
  popularIngredients,
  similarFor,
  suggestIngredients,
  type FacetKey,
  type FilterState,
} from '../lib/filters';
import { addRecent, clearRecent, getRecent } from '../lib/recent';
import { Button } from '../components/ui/Button';
import { Chip, ChipDivider, ChipRow, ChipWrap } from '../components/ui/Chip';
import { CocktailCard } from '../components/ui/CocktailCard';
import { EmptyState } from '../components/ui/EmptyState';
import { SearchBar } from '../components/ui/SearchBar';
import { RecentRow, SearchRow, SearchSectionTitle, Highlight } from '../components/ui/SearchRows';
import { SectionHeader } from '../components/ui/SectionHeader';
import { useFavorites } from '../lib/favorites';
import { StickyHeader } from '../components/ui/StickyHeader';
import { FilterSheet } from '../components/FilterSheets';
import { canMake, useInventory } from '../lib/inventory';
import { Link } from 'react-router';
import { buttonClass } from '../components/ui/Button';
import type { Cocktail } from '../types/cocktail';

const FACET_ORDER: FacetKey[] = ['base', 'taste', 'strength'];

/** #filters → все фасеты, #facet-taste → один фасет; иначе шторка закрыта */
function sheetFromHash(hash: string): { open: boolean; facet: FacetKey | null } {
  if (hash === '#filters') return { open: true, facet: null };
  const m = hash.match(/^#facet-(\w+)$/);
  if (m?.[1] && isFacetKey(m[1])) return { open: true, facet: m[1] };
  return { open: false, facet: null };
}

function Grid({
  list,
  onOpen,
  isAvailable,
  isFav,
}: {
  list: Cocktail[];
  onOpen?: () => void;
  isAvailable: (c: Cocktail) => boolean;
  isFav: (c: Cocktail) => boolean;
}) {
  return (
    <ul className="grid grid-cols-2 gap-3 px-4" onClickCapture={onOpen}>
      {list.map((c) => (
        <li key={c.id}>
          <CocktailCard cocktail={c} available={isAvailable(c)} favorite={isFav(c)} />
        </li>
      ))}
    </ul>
  );
}

export function CatalogPage() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const f = useMemo(() => parseFilters(params), [params]);
  const { inv } = useInventory();
  const isAvailable = useMemo(() => (c: Cocktail) => canMake(c, inv), [inv]);
  const { list: favList } = useFavorites();
  // версия списка авторских — зависимость мемо: массив cocktails меняется на месте
  const { list: myList, upsert } = useCustomCocktails();
  // «призрак» под свайпом назад — без побочных эффектов
  const ghost = useIsGhost();
  // удалили авторский в редакторе — тост «Вернуть» (сам коктейль приходит в state перехода)
  const [deleted, setDeleted] = useState(() => (ghost ? null : ((location.state as { deleted?: Cocktail } | null)?.deleted ?? null)));
  const isFav = useMemo(() => (c: Cocktail) => favList.includes(c.id), [favList]);
  const list = useMemo(() => applyFilters(cocktails, f, isAvailable, isFav), [f, isAvailable, isFav, myList]);
  const markAvailable = f.can ? () => false : isAvailable;
  const sheet = sheetFromHash(location.hash);

  const input = useRef<HTMLInputElement>(null);
  const [searching, setSearching] = useState(false);
  const [recent, setRecent] = useState(getRecent);

  // фильтры (не набор текста в поиске) — сетка перестраивается переходом: карточки переезжают, лишние гаснут
  const setFilters = (next: FilterState) => {
    const animate = next.q === f.q;
    if (animate) setNav('grid');
    setParams(filtersToParams(next), { replace: true, preventScrollReset: true, viewTransition: animate });
  };

  // --- шторки живут в хэше: «Назад» закрывает шторку, а не уходит со страницы ---
  const pending = useRef<FilterState | null>(null);
  const openSheet = (hash: string) =>
    navigate({ search: location.search, hash }, { state: { sheet: true }, preventScrollReset: true });
  const closeSheet = () => {
    if ((location.state as { sheet?: boolean } | null)?.sheet) navigate(-1);
    else navigate({ search: location.search, hash: '' }, { replace: true, preventScrollReset: true });
  };
  const apply = (next: FilterState) => {
    pending.current = next;
    closeSheet();
  };
  // state с удалённым не переживает перезагрузку: тост показан один раз
  useEffect(() => {
    if (deleted && !ghost) navigate({ search: location.search, hash: location.hash }, { replace: true, state: null, preventScrollReset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // прямая ссылка с #filters: подкладываем запись без хэша, чтобы «Назад» закрыл шторку, а не ушёл с сайта
  useEffect(() => {
    if (!ghost && location.hash && !(location.state as { sheet?: boolean } | null)?.sheet) {
      const hash = location.hash;
      navigate({ search: location.search, hash: '' }, { replace: true, preventScrollReset: true });
      navigate({ search: location.search, hash }, { state: { sheet: true }, preventScrollReset: true });
    }
    // только при первом показе
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!location.hash && pending.current) {
      setFilters(pending.current);
      pending.current = null;
    }
  });

  // --- поиск ---
  const q = f.q;
  const setQuery = (value: string) => setFilters({ ...f, q: value });
  const remember = () => q.trim() && setRecent(addRecent(q));
  const cancelSearch = () => {
    setFilters({ ...f, q: '' });
    setSearching(false);
    input.current?.blur();
  };
  const pickIngredient = (id: string) => {
    remember();
    setFilters({ ...f, q: '', ing: id });
    setSearching(false);
    input.current?.blur();
  };
  const suggestions = q.trim() ? suggestIngredients(q, cocktails).filter((d) => d.id !== f.ing) : [];
  const showSearchPanel = searching && !q.trim();
  const resetFacets = () => setFilters({ ...EMPTY_FILTERS, q });

  return (
    <main className="pb-tabbar">
      {!searching && (
        <header className="pt-safe flex min-h-tap items-center justify-between gap-3 px-4">
          <h1 className="font-display text-display text-fg">Коктейли</h1>
          {/* авторский коктейль — «+» в шапке каталога */}
          <Link to="/new" viewTransition aria-label="Собрать свой коктейль" title="Собрать свой коктейль" className="pressable-scale flex size-tap shrink-0 items-center justify-center rounded-full bg-tile-strong text-fg">
            <Plus className="size-6" strokeWidth={2.25} aria-hidden />
          </Link>
        </header>
      )}

      <StickyHeader className={searching ? 'pt-safe' : 'mt-2'}>
        <form
          role="search"
          className="px-4 pt-1"
          onSubmit={(e) => {
            e.preventDefault();
            remember();
            input.current?.blur();
          }}
        >
          <SearchBar
            ref={input}
            value={q}
            onChange={setQuery}
            onFocus={() => setSearching(true)}
            showCancel={searching}
            onCancel={cancelSearch}
            placeholder="Название или ингредиент"
            aria-label="Поиск коктейлей"
          />
        </form>
        {!showSearchPanel && (
          <ChipRow label="Фильтры" className="mt-2 pb-2">
            <Chip
              icon={SlidersHorizontal}
              badge={activeCount(f)}
              aria-label={activeCount(f) ? `Фильтры, активно: ${activeCount(f)}` : 'Фильтры'}
              onClick={() => openSheet('#filters')}
            >
              Фильтры
            </Chip>
            <ChipDivider />
            {f.fav && (
              <Chip variant="removable" icon={Heart} iconClassName="fill-current text-accent" aria-label="Убрать фильтр «Избранное»" onClick={() => setFilters({ ...f, fav: false })}>
                Избранное
              </Chip>
            )}
            {f.my && (
              <Chip variant="removable" icon={PenLine} aria-label="Убрать фильтр «Авторские»" onClick={() => setFilters({ ...f, my: false })}>
                Авторские
              </Chip>
            )}
            {f.glass && (
              <Chip variant="removable" aria-label={`Убрать фильтр «${glassLabel(f.glass)}»`} onClick={() => setFilters({ ...f, glass: null })}>
                {glassLabel(f.glass)}
              </Chip>
            )}
            {f.method && (
              <Chip variant="removable" aria-label={`Убрать фильтр «${methodLabel(f.method)}»`} onClick={() => setFilters({ ...f, method: null })}>
                {methodLabel(f.method)}
              </Chip>
            )}
            {f.ice && (
              <Chip variant="removable" aria-label={`Убрать фильтр «${iceLabel(f.ice)}»`} onClick={() => setFilters({ ...f, ice: null })}>
                {f.ice === 'none' ? 'Без льда' : `Лёд: ${iceLabel(f.ice).toLowerCase()}`}
              </Chip>
            )}
            {f.ing && (
              <Chip variant="removable" aria-label={`Убрать ингредиент ${getIngredient(f.ing)?.name}`} onClick={() => setFilters({ ...f, ing: null })}>
                {getIngredient(f.ing)?.name}
              </Chip>
            )}
            {FACET_ORDER.map((key) => (
              <Chip
                key={key}
                variant="facet"
                selected={f[key].length > 0}
                aria-label={`${FACETS[key].title}: ${facetLabel(key, f)}`}
                onClick={() => openSheet(`#facet-${key}`)}
              >
                {facetLabel(key, f)}
              </Chip>
            ))}
            {hasFacetFilters(f) && (
              <Button variant="plain" size="s" onClick={resetFacets}>
                Сбросить
              </Button>
            )}
          </ChipRow>
        )}
      </StickyHeader>

      {showSearchPanel ? (
        <section aria-label="Подсказки поиска" className="pt-2">
          {recent.length > 0 && (
            <>
              <SearchSectionTitle
                title="Недавние"
                action={
                  <Button variant="ghost" size="s" onClick={() => (clearRecent(), setRecent([]))}>
                    Очистить
                  </Button>
                }
              />
              {recent.map((r) => (
                <RecentRow key={r} title={r} onClick={() => setQuery(r)} />
              ))}
            </>
          )}
          <SearchSectionTitle title="Популярные ингредиенты" />
          <ChipWrap label="Популярные ингредиенты">
            {popularIngredients().map((d) => (
              <Chip key={d.id} onClick={() => pickIngredient(d.id)}>
                {d.name}
              </Chip>
            ))}
          </ChipWrap>
        </section>
      ) : (
        <>
          {suggestions.map((d) => (
            <SearchRow
              key={d.id}
              icon={Citrus}
              title={
                <>
                  Ингредиент: <Highlight text={d.name} query={q} />
                </>
              }
              subtitle="Показать все коктейли с ним"
              onClick={() => pickIngredient(d.id)}
            />
          ))}

          <p className={`mt-2 px-4 text-footnote text-fg-2 ${list.length ? '' : 'invisible'}`} aria-live="polite">
            {countLabel(list.length)}
            {q.trim() && ` по запросу «${q.trim()}»`}
          </p>

          {list.length > 0 ? (
            <div className="mt-3">
              <Grid list={list} onOpen={remember} isAvailable={markAvailable} isFav={isFav} />
            </div>
          ) : f.fav && favList.length === 0 ? (
            // пустое избранное объясняет жест [Subway, Chick-fil-A]
            <EmptyState
              title="Здесь будут любимые коктейли"
              hint="Нажмите ♡ на странице коктейля"
              action={
                <Button variant="secondary" size="m" onClick={() => setFilters({ ...f, fav: false })}>
                  Сбросить фильтр
                </Button>
              }
            />
          ) : f.can && !applyFilters(cocktails, { ...EMPTY_FILTERS, can: true }, isAvailable).length ? (
            <EmptyState
              title={inv.size ? 'Пока ничего не получится' : 'Бар пока пуст'}
              hint={inv.size ? 'Добавьте 1–2 ингредиента в «Мой бар»' : 'Отметьте, что есть дома'}
              action={
                <Link to="/bar" viewTransition className={buttonClass('secondary', 'm')}>
                  Открыть «Мой бар»
                </Link>
              }
            />
          ) : (
            <>
              <EmptyState
                title="Ничего не нашлось"
                hint={
                  hasFacetFilters(f) && q.trim()
                    ? 'Измените запрос или уберите фильтры'
                    : hasFacetFilters(f)
                      ? 'Уберите часть фильтров'
                      : 'Попробуйте другое название или ингредиент'
                }
                action={
                  hasFacetFilters(f) && q.trim() ? (
                    <Button variant="secondary" size="m" onClick={() => setFilters(EMPTY_FILTERS)}>
                      Сбросить всё
                    </Button>
                  ) : hasFacetFilters(f) ? (
                    <Button variant="secondary" size="m" onClick={resetFacets}>
                      Сбросить фильтры
                    </Button>
                  ) : (
                    <Button variant="secondary" size="m" onClick={() => setQuery('')}>
                      Очистить поиск
                    </Button>
                  )
                }
              />
              <SectionHeader title="Похожие" />
              <div className="mt-2">
                <Grid list={similarFor(cocktails, f)} isAvailable={isAvailable} isFav={isFav} />
              </div>
            </>
          )}
        </>
      )}

      {deleted && (
        <Toast
          icon={Trash2}
          filled={false}
          aboveTabBar
          text={`«${deleted.name}» удалён`}
          action={<ToastAction onClick={() => (upsert(deleted), setDeleted(null))}>Вернуть</ToastAction>}
          onDone={() => setDeleted(null)}
        />
      )}
      <FilterSheet
        open={sheet.open}
        facet={sheet.facet}
        value={f}
        count={(draft) => applyFilters(cocktails, draft, isAvailable, isFav).length}
        onApply={apply}
        onClose={closeSheet}
        barEmpty={inv.size === 0}
        favEmpty={favList.length === 0}
        myEmpty={myList.length === 0}
      />
    </main>
  );
}
