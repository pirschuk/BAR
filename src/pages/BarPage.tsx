import { TOPICS, termsOf } from '../lib/glossary';
import { GuideTile } from '../components/ui/GuideParts';
import { articlesLabel } from './GuidePage';
import { useMemo } from 'react';
import { ChevronRight, HardDriveDownload, Heart, Sparkles } from 'lucide-react';
import { Link } from 'react-router';
import type { Cocktail } from '../types/cocktail';
import { cocktails, getCocktail, plural } from '../lib/cocktails';
import { useFavorites } from '../lib/favorites';
import { QUICK_START, SECTIONS, barSummary, canMake, inventoryPersisted, sectionOf, unlocks, useInventory } from '../lib/inventory';
import { HintLine, InfoNote } from '../components/ui/Availability';
import { BarHero } from '../components/ui/BarHero';
import { BarCategoryCard } from '../components/ui/BarRows';
import { Button } from '../components/ui/Button';
import { CardRail, CardRailItem } from '../components/ui/CardRail';
import { CocktailCard } from '../components/ui/CocktailCard';
import { EmptyState } from '../components/ui/EmptyState';
import { SectionHeader } from '../components/ui/SectionHeader';
import { BarSheets, useBarNav, useBarRows, type BarRow } from '../components/BarSheets';

export const positionsLabel = (n: number) => `${n} ${plural(n, ['позиция', 'позиции', 'позиций'])}`;

/** «4 позиции» и превью «Джин, Водка, Laphroaig 10 и ещё 1» для карточки раздела */
function sectionSummary(rows: BarRow[]) {
  const names = rows.map((r) => r.title);
  const preview = names.length > 3 ? `${names.slice(0, 3).join(', ')} и ещё ${names.length - 3}` : names.join(', ');
  return { meta: rows.length ? positionsLabel(rows.length) : 'Пока пусто', preview };
}

/** «Мой бар» v2: итог + два раздела-карточки [WHOOP, GitHub]; списки — на страницах разделов */
export function BarPage() {
  const { inv, add } = useInventory();
  const rows = useBarRows();
  const { openAdd } = useBarNav();
  const summary = useMemo(() => barSummary(cocktails, inv), [inv]);
  const { list: favIds } = useFavorites();
  // веер героя: что можно приготовить — сначала избранное, затем по каталогу
  const covers = useMemo(() => {
    const able = cocktails.filter((c) => canMake(c, inv));
    return [...able.filter((c) => favIds.includes(c.id)), ...able.filter((c) => !favIds.includes(c.id))].slice(0, 3);
  }, [inv, favIds]);
  // «Что докупить ›» — в раздел, где больше советов
  const buySection = useMemo(() => unlocks(cocktails, inv, 1)[0], [inv]);
  const isAvailable = (c: Cocktail) => canMake(c, inv);
  const favs = favIds.map((id) => getCocktail(id)).filter((c) => !!c);
  const empty = rows.length === 0;

  return (
    <main className="pb-tabbar">
      <header className="pt-safe px-4">
        <h1 className="font-display text-display text-fg">Мой бар</h1>
        {!empty && (
          <p className="mt-1 text-footnote text-fg-2" aria-live="polite">
            {positionsLabel(rows.length)}
          </p>
        )}
      </header>

      {!inventoryPersisted && (
        <InfoNote icon={HardDriveDownload} className="mx-4 mt-4">
          Браузер не даёт сохранить бар — он сохранится до закрытия вкладки.
        </InfoNote>
      )}

      {empty ? (
        <EmptyState
          className="py-8!"
          title="Соберите бар за минуту"
          hint="Добавьте, что есть дома, — покажем, что можно приготовить"
          action={
            <Button icon={Sparkles} onClick={() => add(QUICK_START)}>
              Быстрый старт: базовый бар
            </Button>
          }
        />
      ) : (
        <div className="mt-5 px-4">
          <BarHero
            can={summary.can}
            nearly={summary.nearly}
            covers={covers}
            to="/?can=1"
            onBuy={buySection ? () => openAdd(sectionOf(buySection.ref)) : undefined}
          />
        </div>
      )}

      <div className={`${empty ? '' : 'mt-3'} flex flex-col gap-3 px-4`}>
        {SECTIONS.map((s) => {
          const { meta, preview } = sectionSummary(rows.filter((r) => r.section === s.id));
          return (
            <BarCategoryCard
              key={s.id}
              title={s.label}
              meta={meta}
              preview={preview}
              placeholder={s.placeholder}
              to={`/bar/${s.id}`}
            />
          );
        })}
      </div>

      {favs.length > 0 ? (
        <section className="mt-6" aria-label="Избранное">
          <SectionHeader
            size="l"
            title="Избранное"
            meta={
              <Link to="/?fav=1" viewTransition className="pressable -mr-2 inline-flex h-tap items-center gap-0.5 rounded-control px-2 text-subhead text-fg-2">
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
      ) : (
        <HintLine icon={Heart} className="mt-4 px-4">
          Нажмите сердце на странице коктейля&nbsp;— он появится в «Избранном»
        </HintLine>
      )}

      {/* «Барная азбука» — внизу: что за бокалы, инструменты, методы, лёд и меры */}
      <section className="mt-8" aria-label="Барная азбука">
        <SectionHeader
          size="l"
          title="Барная азбука"
          meta={
            <Link to="/guide" viewTransition className="pressable -mr-2 inline-flex h-tap items-center gap-0.5 rounded-control px-2 text-subhead text-fg-2">
              Все
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          }
        />
        <CardRail label="Темы азбуки" className="mt-2">
          {TOPICS.map((t) => (
            <CardRailItem key={t.id}>
              <GuideTile topic={t.id} label={t.label} count={articlesLabel(termsOf(t.id).length)} to={`/guide/${t.id}`} />
            </CardRailItem>
          ))}
        </CardRail>
      </section>

      <BarSheets rows={rows} aboveTabBar />
    </main>
  );
}
