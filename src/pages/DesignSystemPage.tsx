import { useEffect, useState, type ReactNode } from 'react';
import { ChevronLeft, HardDriveDownload, Heart, Plus, Trash2, SlidersHorizontal, Wrench } from 'lucide-react';
import { Link } from 'react-router';
import { GLASSES, STRENGTH_LABEL, cocktails, servingVolume, countLabel, getCocktail, scaleIngredient, type Servings } from '../lib/cocktails';
import type { Cocktail, Glass } from '../types/cocktail';
import { Button, IconButton, buttonClass } from '../components/ui/Button';
import { Chip, ChipDivider, ChipRow, ChipWrap } from '../components/ui/Chip';
import { SearchBar } from '../components/ui/SearchBar';
import { Highlight, RecentRow, SearchRow, SearchSectionTitle } from '../components/ui/SearchRows';
import { EmptyState } from '../components/ui/EmptyState';
import { BottomSheet, SheetFooter, SheetSection } from '../components/ui/BottomSheet';
import { StickyHeader } from '../components/ui/StickyHeader';
import { FilterSheet } from '../components/FilterSheets';
import { TabBar } from '../components/ui/TabBar';
import { LuckySheet } from '../components/LuckySheet';
import { CheckRow, SwitchRow } from '../components/ui/Toggles';
import { AvailabilityLine, HintLine, InfoNote } from '../components/ui/Availability';
import { EMPTY_FILTERS, applyFilters, type FilterState } from '../lib/filters';
import { GlassIllustration } from '../components/ui/GlassIllustration';
import { CocktailCard, coverStyle } from '../components/ui/CocktailCard';
import { CocktailHero } from '../components/ui/CocktailHero';
import { NavBar } from '../components/ui/NavBar';
import { FavoriteButton } from '../components/ui/FavoriteButton';
import { Toast, ToastAction } from '../components/ui/Toast';
import { CardRail, CardRailItem } from '../components/ui/CardRail';
import { AddCustomRow, BarCategoryCard, BarItemRow, GroupHeader, PickRow, SuggestCard } from '../components/ui/BarRows';
import { BarHero } from '../components/ui/BarHero';
import { TypeNav } from '../components/ui/TypeNav';
import { BottleForm } from '../components/ui/BottleForm';
import { TextField } from '../components/ui/TextField';
import { BarAddSheet } from '../components/BarAddSheet';
import { BarItemSheet } from '../components/BarItemSheet';
import { usage, type Bottle } from '../lib/inventory';
import { ParamTiles } from '../components/ui/ParamTiles';
import { SectionHeader } from '../components/ui/SectionHeader';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { GarnishNote, IngredientList, IngredientTile } from '../components/ui/IngredientTile';
import { Steps } from '../components/ui/Steps';
import { STRENGTH_TONE, cocktailParams } from '../components/cocktailStats';
import { SERVINGS, timeMeta } from './CocktailPage';

// --- оболочка витрины ---

function Section({ id, title, note, children }: { id: string; title: string; note: string; children: ReactNode }) {
  return (
    <section id={id} className="mt-10 scroll-mt-4">
      <div className="px-4">
        <h2 className="text-title-2 text-fg">{title}</h2>
        <p className="mt-1 text-footnote text-fg-2">{note}</p>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Секция витрины на тинте напитка — как на странице рецепта */
function Tinted({ cocktail, ...props }: { id: string; title: string; note: string; children: ReactNode; cocktail: string }) {
  return (
    <div className="recipe-tint mt-10 pt-1 pb-6" style={coverStyle(must(cocktail))}>
      <Section {...props} />
    </div>
  );
}

function State({ label, children, className, inset }: { label: string; children: ReactNode; className?: string; inset?: boolean }) {
  return (
    <div className={className}>
      <p className={`mb-2 text-caption text-fg-3 uppercase ${inset ? 'px-4' : ''}`}>{label}</p>
      {children}
    </div>
  );
}

// --- данные витрины ---

const must = (id: string): Cocktail => {
  const c = getCocktail(id);
  if (!c) throw new Error(`Нет коктейля ${id} в cocktails.json`);
  return c;
};

const LONG_NAME: Cocktail = { ...must('cosmopolitan'), id: 'cosmopolitan', name: 'Космополитен с клюквой и цитрусовой водкой' };

const PALETTE = [
  { token: '--bg', cls: 'bg-bg', note: 'фон экрана' },
  { token: '--surface', cls: 'bg-surface', note: 'карточки, шторки' },
  { token: '--surface-2', cls: 'bg-surface-2', note: 'поля, чипсы' },
  { token: '--text', cls: 'bg-fg', note: 'текст · fg' },
  { token: '--text-2', cls: 'bg-fg-2', note: 'вторичный · fg-2' },
  { token: '--text-3', cls: 'bg-fg-3', note: 'подписи · fg-3' },
  { token: '--accent', cls: 'bg-accent', note: 'акцент, CTA' },
  { token: '--accent-fg', cls: 'bg-accent-fg', note: 'текст на акценте' },
  { token: '--border', cls: 'bg-border', note: 'разделители' },
  { token: '--danger', cls: 'bg-danger', note: 'ошибка' },
  { token: '--success', cls: 'bg-success', note: 'успех' },
  { token: '--tile', cls: 'bg-tile', note: 'плитки на тинте' },
  { token: '--tile-strong', cls: 'bg-tile-strong', note: 'круги, пилюли на тинте' },
  { token: '--strength-none', cls: 'bg-strength-none', note: 'крепость: безалкогольный' },
  { token: '--strength-light', cls: 'bg-strength-light', note: 'крепость: лёгкий' },
  { token: '--strength-medium', cls: 'bg-strength-medium', note: 'крепость: средний' },
  { token: '--strength-strong', cls: 'bg-strength-strong', note: 'крепость: крепкий' },
] as const;

const TYPE_SCALE = [
  { cls: 'font-display text-display', name: 'display', spec: 'Unbounded 34/40 · 700', use: 'название на обложке' },
  { cls: 'font-display text-hero', name: 'hero', spec: 'Unbounded 64/64 · 700', use: 'число «Можно приготовить»' },
  { cls: 'font-display text-section', name: 'section', spec: 'Unbounded 24/30 · 600', use: 'секции рецепта, разделы бара' },
  { cls: 'font-display text-card', name: 'card', spec: 'Unbounded 14/19 · 600', use: 'название на карточке каталога' },
  { cls: 'text-large-title', name: 'large-title', spec: '34/41 · 700', use: 'не используется (экраны — display)' },
  { cls: 'text-title-1', name: 'title-1', spec: '28/34 · 700', use: 'резерв' },
  { cls: 'text-title-2', name: 'title-2', spec: '22/28 · 700', use: 'секции каталога, типы бара, пустые состояния' },
  { cls: 'text-title-3', name: 'title-3', spec: '20/26 · 600', use: 'значения плиток параметров' },
  { cls: 'text-headline', name: 'headline', spec: '17/22 · 600', use: 'кнопки, «Советуем», объёмы' },
  { cls: 'text-body', name: 'body', spec: '17/22 · 400', use: 'основной текст, шаги, строки списков' },
  { cls: 'text-callout', name: 'callout', spec: '16/21 · 400', use: 'чипсы, сегменты' },
  { cls: 'text-subhead', name: 'subhead', spec: '15/20 · 400', use: 'подписи действий, информеры' },
  { cls: 'text-footnote', name: 'footnote', spec: '13/18 · 400', use: 'подписи, мета' },
  { cls: 'text-caption', name: 'caption', spec: '12/16 · 500', use: 'плашки' },
] as const;

// пример коктейля для каждого бокала из утверждённого списка
const GLASS_SAMPLES: Record<Glass, string> = {
  rocks: 'negroni',
  highball: 'mojito',
  collins: 'tom-collins',
  coupe: 'daiquiri',
  martini: 'cosmopolitan',
  flute: 'kir-royal',
  wine: 'aperol-spritz',
  hurricane: 'pina-colada',
  'copper-mug': 'moscow-mule',
  'irish-coffee': 'irish-coffee',
};

function useCssVar(name: string) {
  const [value, setValue] = useState('');
  useEffect(() => {
    setValue(getComputedStyle(document.documentElement).getPropertyValue(name).trim());
  }, [name]);
  return value;
}

function Swatch({ token, cls, note }: (typeof PALETTE)[number]) {
  const value = useCssVar(token);
  return (
    <div className="flex items-center gap-3">
      <span className={`size-11 shrink-0 rounded-control border border-border ${cls}`} />
      <span className="min-w-0">
        <span className="block text-subhead font-semibold text-fg">{token}</span>
        <span className="block text-footnote text-fg-2">{note}</span>
        <span className="block text-caption break-all text-fg-2">{value}</span>
      </span>
    </div>
  );
}

// --- страница ---

export function DesignSystemPage() {
  const [facets, setFacets] = useState<Set<string>>(new Set(['Вкус']));
  const [options, setOptions] = useState<Set<string>>(new Set(['Кислый']));
  const [query, setQuery] = useState('');
  const sheetValue: FilterState = { ...EMPTY_FILTERS, taste: ['sour'] };
  const sheetCount = (d: FilterState) => applyFilters(cocktails, d).length;
  const [sw, setSw] = useState(true);
  const [ck, setCk] = useState(false);
  const [servings, setServings] = useState<Servings>(2);
  const [fav, setFav] = useState(false);
  // «Мой бар» на витрине — своё состояние, настоящий бар не трогаем
  const [demoOwned, setDemoOwned] = useState<ReadonlySet<string>>(new Set(['gin', 'lime']));
  const [demoBottles, setDemoBottles] = useState<Bottle[]>([{ id: 'b-demo', name: 'Laphroaig 10', ref: 'scotch', note: '10 лет' }]);
  const [field, setField] = useState('');
  const sour = must('whiskey-sour');
  const mojito = must('mojito');

  return (
    <main className="pb-safe">
      <header className="pt-safe flex items-start justify-between gap-3 px-4">
        <div>
          <h1 className="text-large-title text-fg">Дизайн-система</h1>
          <p className="mt-1 text-footnote text-fg-2">BAR v0.3 · язык рецепта v2 (Итерация 3)</p>
        </div>
      </header>

      <ChipRow label="Разделы" className="mt-4">
        {[
          ['palette', 'Палитра'],
          ['type', 'Типографика'],
          ['button', 'Button'],
          ['chip', 'Chip'],
          ['search', 'Поиск'],
          ['empty', 'EmptyState'],
          ['sheet', 'Шторки'],
          ['sticky', 'StickyHeader'],
          ['tabbar', 'TabBar'],
          ['toggles', 'Switch / Check'],
          ['availability', 'Наличие'],
          ['lucky', 'Мне повезёт'],
          ['glass', 'Бокалы'],
          ['card', 'CocktailCard'],
          ['hero', 'CocktailHero'],
          ['navbar', 'NavBar'],
          ['favorites', 'Избранное'],
          ['bar', 'Мой бар'],
          ['tint', 'Тинт'],
          ['params', 'ParamTiles'],
          ['section', 'SectionHeader'],
          ['segmented', 'Segmented'],
          ['ingredient', 'IngredientTile'],
          ['steps', 'Steps'],
        ].map(([id, label]) => (
          <a key={id} href={`#${id}`} className="pressable inline-flex h-chip shrink-0 items-center rounded-full bg-tile px-4 text-callout font-medium text-fg">
            {label}
          </a>
        ))}
      </ChipRow>

      <Section id="palette" title="Палитра" note="CSS-переменные, тема одна — тёмная, фон #000. Обложки коктейлей — данные (cover), не токены; поверх обложек — on-media (белый / 72% / акцент). Герой бара — hero-brand (акцент → чёрный).">
        <div className="grid grid-cols-2 items-start gap-x-3 gap-y-4 px-4">
          {PALETTE.map((p) => (
            <Swatch key={p.token} {...p} />
          ))}
        </div>
      </Section>

      <Section id="type" title="Типографика" note="Заголовки рецепта — Unbounded (локальный woff2, OFL), остальное — системный (SF Pro / Roboto). Числа объёмов — tabular-nums.">
        <div className="flex flex-col gap-4 px-4">
          {TYPE_SCALE.map((t) => (
            <div key={t.name} className="border-b border-border pb-3">
              <p className={`${t.cls} truncate text-fg`}>Негрони</p>
              <p className="mt-1 text-caption text-fg-3">
                {t.name} · {t.spec} · {t.use}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="button" title="Button" note="L 50 — CTA, pill; M 44 — действия, радиус 12; S 44 — в ряду чипсов («Сбросить»). IconButton: m 36 (тач-зона 44), l 44, xl 56 — закреплённые кнопки навбара.">
        <div className="flex flex-col gap-5 px-4">
          <State label="primary · L — default / pressed / disabled">
            <div className="flex flex-wrap gap-3">
              <Button>В каталог</Button>
              <Button pressed>В каталог</Button>
              <Button disabled>В каталог</Button>
            </div>
          </State>
          <State label="secondary · ghost · M">
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" size="m">
                Secondary
              </Button>
              <Button variant="secondary" size="m" pressed>
                Pressed
              </Button>
              <Button variant="ghost" size="m">
                Ghost
              </Button>
            </div>
          </State>
          <State label="S · plain / pressed / disabled — «Сбросить» в ряду фильтров">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="plain" size="s">Сбросить</Button>
              <Button variant="plain" size="s" pressed>Сбросить</Button>
              <Button variant="plain" size="s" disabled>Сбросить</Button>
            </div>
          </State>
          <State label="Link как кнопка">
            <Link to="/" className={buttonClass('primary', 'l', 'w-full')}>
              Открыть каталог
            </Link>
          </State>
          <State label="IconButton · tonal m 36 — default / pressed / disabled (✕ шторок)">
            <div className="flex gap-4">
              <IconButton icon={Plus} label="Добавить" />
              <IconButton icon={Plus} label="Добавить" pressed />
              <IconButton icon={Plus} label="Добавить" disabled />
            </div>
          </State>
          <State label="IconButton · xl 56 — glass поверх обложки / tile-strong на чёрном (навбар)">
            <div className="cover-gradient flex gap-4 rounded-card p-4" style={coverStyle(sour)}>
              <IconButton icon={ChevronLeft} label="Назад" variant="glass" size="xl" />
              <IconButton icon={ChevronLeft} label="Назад" variant="glass" size="xl" pressed />
              <IconButton icon={Plus} label="Добавить" size="xl" className="bg-tile-strong!" />
            </div>
          </State>
        </div>
      </Section>

      <Section id="chip" title="Chip / ChipRow" note="44 (сам себе тач-зона), callout 16, иконки 18 — больше прежних 36, но меньше поля поиска 56. Варианты: filter, facet (⌄), option (+ / ✓), removable (×).">
        <div className="flex flex-col gap-5">
          <State label="filter — default / selected / pressed / disabled / с иконкой и бейджем" className="px-4">
            <div className="flex flex-wrap gap-2">
              <Chip>Джин</Chip>
              <Chip selected>Ром</Chip>
              <Chip pressed>Виски</Chip>
              <Chip disabled>Текила</Chip>
              <Chip icon={SlidersHorizontal}>Фильтры</Chip>
              <Chip icon={SlidersHorizontal} badge={2}>Фильтры</Chip>
            </div>
          </State>
          <State label="facet — пусто / выбрано одно / выбрано несколько / pressed" className="px-4">
            <div className="flex flex-wrap gap-2">
              <Chip variant="facet">Вкус</Chip>
              <Chip variant="facet" selected>Кислый</Chip>
              <Chip variant="facet" selected>Ром +1</Chip>
              <Chip variant="facet" pressed>Крепость</Chip>
            </div>
          </State>
          <State inset label="option — «+» не выбран / «✓» выбран (интерактивно)">
            <ChipWrap label="Вкус">
              {['Кислый', 'Сладкий', 'Горький', 'Фруктовый', 'Травяной'].map((o) => (
                <Chip
                  key={o}
                  variant="option"
                  selected={options.has(o)}
                  onClick={() => setOptions((prev) => { const n = new Set(prev); if (!n.delete(o)) n.add(o); return n; })}
                >
                  {o}
                </Chip>
              ))}
            </ChipWrap>
          </State>
          <State label="removable — активный ингредиент из поиска" className="px-4">
            <div className="flex flex-wrap gap-2">
              <Chip variant="removable">Кампари</Chip>
              <Chip variant="removable" pressed>Лайм</Chip>
            </div>
          </State>
          <div>
            <p className="mb-2 px-4 text-caption text-fg-3 uppercase">ChipRow — «Фильтры» │ фасеты · «Сбросить» (интерактивно)</p>
            <ChipRow label="Фильтры">
              <Chip icon={SlidersHorizontal} badge={facets.size}>Фильтры</Chip>
              <ChipDivider />
              {['База', 'Вкус', 'Крепость'].map((label) => (
                <Chip
                  key={label}
                  variant="facet"
                  selected={facets.has(label)}
                  onClick={() => setFacets((prev) => { const n = new Set(prev); if (!n.delete(label)) n.add(label); return n; })}
                >
                  {facets.has(label) ? (label === 'Вкус' ? 'Кислый' : label === 'База' ? 'Ром +1' : 'Лёгкий') : label}
                </Chip>
              ))}
              {facets.size > 0 && (
                <Button variant="plain" size="s" onClick={() => setFacets(new Set())}>
                  Сбросить
                </Button>
              )}
            </ChipRow>
          </div>
        </div>
      </Section>

      <Section id="search" title="SearchBar / строки поиска" note="Поле 56 — соразмерно закреплённым кнопкам рецепта; иконки 20, текст body, пилюля; ⓧ при вводе; «Отмена» в режиме поиска. Строки ≥ 48: недавнее (часы), подсказка (лупа).">
        <div className="flex flex-col gap-5">
          <State label="пусто" className="px-4">
            <SearchBar value="" onChange={() => {}} placeholder="Название или ингредиент" />
          </State>
          <State label="режим поиска + ввод (интерактивно)" className="px-4">
            <SearchBar value={query} onChange={setQuery} showCancel onCancel={() => setQuery('')} placeholder="Название или ингредиент" />
          </State>
          <State label="с текстом" className="px-4">
            <SearchBar value="кампари" onChange={() => {}} placeholder="Название или ингредиент" />
          </State>
          <State label="disabled" className="px-4">
            <SearchBar value="" onChange={() => {}} disabled placeholder="Найти ингредиент" />
          </State>
          <div>
            <SearchSectionTitle title="Недавние" action={<Button variant="plain" size="s">Очистить</Button>} />
            <RecentRow title="негрони" />
            <RecentRow title="что-то с кампари" pressed />
            <SearchSectionTitle title="Подсказка при вводе «камп»" />
            <SearchRow title={<>Ингредиент: <Highlight text="Кампари" query="камп" /></>} subtitle="Показать все коктейли с ним" />
          </div>
        </div>
      </Section>

      <Section id="empty" title="EmptyState" note="Язык v2 — без иконок-заглушек: заголовок title-2, одна подсказка, действие (одно или два).">
        <div className="flex flex-col gap-3">
          <EmptyState
            title="Ничего не нашлось"
            hint="Уберите часть фильтров"
            action={<Button variant="secondary" size="m">Сбросить фильтры</Button>}
            className="mx-4 rounded-card bg-tile"
          />
          <EmptyState
            title="Соберите бар за минуту"
            hint="Добавьте, что есть дома, — покажем, что можно приготовить"
            action={<Button>Быстрый старт: базовый бар</Button>}
            className="mx-4 rounded-card bg-tile"
          />
        </div>
      </Section>

      <Section id="sheet" title="BottomSheet / FacetSheet / FilterSheet" note="Здесь — встроенно, на экране — поверх скрима. Свайп за хэндл: вверх — large, вниз — закрыть. «Показать N» — живой счётчик.">
        <div className="flex flex-col gap-6 px-4">
          <State label="BottomSheet · базовый, с липким футером">
            <div className="overflow-hidden rounded-sheet border border-border">
              <BottomSheet
                open
                inline
                onClose={() => {}}
                title="Заголовок"
                footer={
                  <SheetFooter>
                    <Button variant="plain" className="px-1!">Сбросить</Button>
                    <Button className="px-4! whitespace-nowrap">Показать 12 коктейлей</Button>
                  </SheetFooter>
                }
              >
                <SheetSection title="Секция">
                  <p className="px-4 text-subhead text-fg-2">Содержимое прокручивается, футер остаётся на месте.</p>
                </SheetSection>
              </BottomSheet>
            </div>
          </State>
          <State label="FacetSheet · Вкус (интерактивно)">
            <div className="overflow-hidden rounded-sheet border border-border">
              <FilterSheet open inline facet="taste" value={sheetValue} count={sheetCount} onApply={() => {}} onClose={() => {}} />
            </div>
          </State>
          <State label="FilterSheet · все фасеты">
            <div className="overflow-hidden rounded-sheet border border-border">
              <FilterSheet open inline facet={null} value={sheetValue} count={sheetCount} onApply={() => {}} onClose={() => {}} />
            </div>
          </State>
          <State label="FilterSheet · бар пуст — «Могу сделать» недоступна">
            <div className="overflow-hidden rounded-sheet border border-border">
              <FilterSheet open inline facet={null} barEmpty favEmpty value={EMPTY_FILTERS} count={sheetCount} onApply={() => {}} onClose={() => {}} />
            </div>
          </State>
          <State label="N = 0 — CTA disabled">
            <div className="overflow-hidden rounded-sheet border border-border">
              <FilterSheet open inline facet="strength" value={{ ...EMPTY_FILTERS, q: 'zzz' }} count={() => 0} onApply={() => {}} onClose={() => {}} />
            </div>
          </State>
        </div>
      </Section>

      <Section id="sticky" title="StickyHeader" note="До прилипания — фон экрана; после — стекло без линии (язык v2). Заголовок уезжает, поиск 56 и ряд чипсов 44 остаются.">
        <div className="flex flex-col gap-5">
          {[false, true].map((stuck) => (
            <State inset key={String(stuck)} label={stuck ? 'прилипла' : 'в потоке'}>
              <div className="cover-gradient" style={coverStyle(must('negroni'))}>
                <StickyHeader forceStuck={stuck}>
                  <div className="px-4 pt-2">
                    <SearchBar value="" onChange={() => {}} placeholder="Название или ингредиент" />
                  </div>
                  <ChipRow label="Фильтры" className="mt-2 pb-2">
                    <Chip icon={SlidersHorizontal}>Фильтры</Chip>
                    <ChipDivider />
                    <Chip variant="facet">База</Chip>
                    <Chip variant="facet">Вкус</Chip>
                    <Chip variant="facet">Крепость</Chip>
                  </ChipRow>
                </StickyHeader>
              </div>
            </State>
          ))}
        </div>
      </Section>

      <Section id="tabbar" title="TabBar" note="Плавающая стеклянная пилюля 64, отступ 16; активный таб — подложка surface-2; по центру — 🎲 48 на tile-strong (действие, не таб; бросок кубика на тап) → LuckySheet. Только на корневых экранах.">
        <div className="flex flex-col gap-5">
          <State inset label="«Мне повезёт» disabled (например, пока данные не готовы)">
            <div className="cover-gradient py-6" style={coverStyle(must('aperol-spritz'))}>
              <TabBar inline luckyDisabled />
            </div>
          </State>
          <State inset label="активный «Каталог»">
            <div className="py-2">
              <TabBar inline activeTo="/" />
            </div>
          </State>
          <State inset label="активный «Мой бар» · pressed «Каталог»">
            <div className="py-2">
              <TabBar inline activeTo="/bar" pressedTo="/" />
            </div>
          </State>
        </div>
      </Section>

      <Section id="toggles" title="SwitchRow / CheckRow" note="Строки ≥ 52, вся строка — тач-зона. Switch 51×31 — настройки; галочка — «Могу сделать» в фильтрах.">
        <div className="flex flex-col">
          <SwitchRow title="Подсказки по инструментам" subtitle="Пример строки-настройки" on={sw} onToggle={() => setSw(!sw)} />
          <SwitchRow title="Выключено" on={false} onToggle={() => {}} />
          <SwitchRow title="Pressed" on onToggle={() => {}} pressed />
          <SwitchRow title="Disabled" on={false} onToggle={() => {}} disabled />
          <CheckRow title="Могу сделать" subtitle="Только из того, что есть дома" on={ck} onToggle={() => setCk(!ck)} />
          <CheckRow title="Могу сделать" subtitle="Сначала отметьте, что есть дома, в «Моём баре»" on={false} onToggle={() => {}} disabled />
        </div>
      </Section>

      <Section id="availability" title="Подсказки" note="InfoNote — нейтральная подсказка. Итог бара — BarHero (раздел «Мой бар»), наличие в рецепте — AvailabilityLine (раздел IngredientTile).">
        <div className="flex flex-col gap-3 px-4">
          <InfoNote icon={Wrench}>Понадобится шейкер — подойдёт банка с плотной крышкой.</InfoNote>
          <InfoNote icon={HardDriveDownload}>Браузер не даёт сохранить бар — он сохранится до закрытия вкладки.</InfoNote>
        </div>
      </Section>

      <Section id="lucky" title="LuckySheet / LuckyReel" note="Барабан карточками: та же карточка каталога (CocktailCard large) на всю ширину, отдельные карточки проезжают сверху вниз ~900 мс и тормозят с отскоком (--ease-spring); свечение цветом напитка; «Ещё раз» — новый спин без повторов. Один вариант — pop без спина; reduced-motion — без анимации. 🎲 в таб-баре — tile-strong, бросок на тап.">
        <div className="flex flex-col gap-6 px-4">
          <State label="барабан (интерактивно: «Ещё раз»)">
            <div className="overflow-hidden rounded-sheet border border-border">
              <LuckySheet open inline pool={cocktails.slice(0, 8)} caption="Весь каталог: 8 коктейлей" onClose={() => {}} onOpenRecipe={() => {}} empty={{ title: '', hint: '' }} isFavorite={(c) => c.id === 'negroni'} />
            </div>
          </State>
          <State label="кадр спина">
            <div className="overflow-hidden rounded-sheet border border-border">
              <LuckySheet open inline frame={0.55} pool={cocktails.slice(8, 12)} caption="Подходят: 4 коктейля" onClose={() => {}} onOpenRecipe={() => {}} empty={{ title: '', hint: '' }} />
            </div>
          </State>
          <State label="единственный вариант — pop, «Ещё раз» disabled">
            <div className="overflow-hidden rounded-sheet border border-border">
              <LuckySheet open inline pool={[must('negroni')]} caption="Всё есть дома: 1 коктейль" onClose={() => {}} onOpenRecipe={() => {}} empty={{ title: '', hint: '' }} isAvailable={() => true} />
            </div>
          </State>
          <State label="выбирать не из чего">
            <div className="overflow-hidden rounded-sheet border border-border">
              <LuckySheet
                open
                inline
                pool={[]}
                caption=""
                onClose={() => {}}
                onOpenRecipe={() => {}}
                empty={{ title: 'Не из чего выбирать', hint: 'Ничего не подходит под поиск и фильтры', action: <Button variant="secondary" size="m">Сбросить всё</Button> }}
              />
            </div>
          </State>
        </div>
      </Section>

      <Section id="glass" title="GlassIllustration" note="Утверждённый список — 10 бокалов, у каждого свой силуэт. Лёд не рисуем: один бокал всегда выглядит одинаково.">
        <div className="grid grid-cols-3 gap-3 px-4">
          {GLASSES.map((g) => (
            <figure key={g.id} className="cover-gradient flex flex-col items-center rounded-card pt-3 pb-2" style={coverStyle(must(GLASS_SAMPLES[g.id]))}>
              <GlassIllustration shape={g.id} className="h-24" />
              <figcaption className="mt-1 truncate px-1 text-caption text-on-media">{g.label}</figcaption>
            </figure>
          ))}
        </div>
      </Section>

      <Section id="card" title="CocktailCard" note="3:4, 173×231, r 24. Название — Unbounded; под ним бокал и «· всё есть» зелёным, если всё есть дома. Правый верхний угол — только ♥ избранного, без подложки. Плашка — крепость словом.">
        <div className="grid grid-cols-2 gap-x-3 gap-y-5 px-4">
          <State label="default">
            <CocktailCard cocktail={must('negroni')} />
          </State>
          <State label="pressed">
            <CocktailCard cocktail={must('daiquiri')} pressed />
          </State>
          <State label="длинное название">
            <CocktailCard cocktail={LONG_NAME} />
          </State>
          <State label="♥ избранное">
            <CocktailCard cocktail={must('dry-martini')} favorite />
          </State>
          <State label="всё есть">
            <CocktailCard cocktail={must('mojito')} available />
          </State>
          <State label="♥ + всё есть">
            <CocktailCard cocktail={must('daiquiri')} available favorite />
          </State>
        </div>
      </Section>

      <Section id="hero" title="CocktailHero" note="На экране — 55% высоты; здесь превью 320. На странице кнопки не в обложке, а в закреплённом NavBar.">
        <div className="flex flex-col gap-5">
          <State label="короткое название" className="px-4">
            <div className="overflow-hidden rounded-card">
              <CocktailHero cocktail={must('negroni')} height="preview" />
            </div>
          </State>
          <State label="длинное название" className="px-4">
            <div className="overflow-hidden rounded-card">
              <CocktailHero cocktail={LONG_NAME} height="preview" />
            </div>
          </State>
        </div>
      </Section>

      <Section id="navbar" title="NavBar" note="Кнопки «Назад» и ♡ (56, стекло) закреплены всегда; когда крупный заголовок ушёл вверх — проявляются название и подложка nav-fade: размытие, сквозь которое виден градиент, с плавным затуханием книзу, без линии.">
        <div className="flex flex-col gap-5">
          <State label="в начале скролла — только кнопки" inset>
            <div className="cover-gradient relative mx-4 h-32 overflow-hidden rounded-card" style={coverStyle(must('negroni'))}>
              <NavBar inline visible={false} title="Негрони" onBack={() => {}} action={<FavoriteButton on={fav} onToggle={() => setFav(!fav)} />} />
            </div>
          </State>
          <State label="заголовок ушёл — подложка и название" inset>
            <div className="recipe-tint relative mx-4 h-32 overflow-hidden rounded-card" style={coverStyle(must('negroni'))}>
              <p className="absolute inset-x-4 top-10 font-display text-section text-fg">Ингредиенты</p>
              <NavBar inline visible title="Негрони" onBack={() => {}} action={<FavoriteButton on onToggle={() => {}} />} />
            </div>
          </State>
          <State label="страница бара (plain) · длинное название" inset>
            <div className="relative mx-4 h-32 overflow-hidden rounded-card bg-bg">
              <p className="absolute inset-x-4 top-10 text-title-2 text-fg">Сиропы и сахар</p>
              <NavBar inline visible tone="plain" title={LONG_NAME.name} onBack={() => {}} action={<IconButton icon={Plus} label="Добавить" size="xl" className="bg-tile-strong!" />} />
            </div>
          </State>
        </div>
      </Section>

      <Section id="favorites" title="Избранное" note="FavoriteButton — стекло 56 в закреплённом навбаре (как «Назад»); в избранном — заливка акцентом + «пульс». Тост — только на добавление. Карточка — ♥ без подложки в правом верхнем углу (не кнопка). CardRail — лента 160, gap 12.">
        <div className="flex flex-col gap-5">
          <State label="FavoriteButton · интерактивно / выкл / вкл / pressed" inset>
            <div className="cover-gradient mx-4 flex items-center gap-4 rounded-card p-4" style={coverStyle(must('negroni'))}>
              <FavoriteButton on={fav} onToggle={() => setFav(!fav)} />
              <FavoriteButton on={false} onToggle={() => {}} />
              <FavoriteButton on onToggle={() => {}} />
              <FavoriteButton on onToggle={() => {}} pressed />
            </div>
          </State>
          <State label="Toast · на добавление, поверх белого заголовка рецепта" inset>
            <div className="recipe-tint relative mx-4 overflow-hidden rounded-card pt-3 pb-4" style={coverStyle(must('pina-colada'))}>
              <p className="px-4 font-display text-section text-fg">Ингредиенты</p>
              <div className="absolute inset-x-0 top-2">
                <Toast inline icon={Heart} text="В избранном" action={<ToastAction to="/?fav=1">Открыть</ToastAction>} />
              </div>
            </div>
          </State>
                    <State label="CardRail (compact: без плашки, бокал ниже; ♥ не нужен — все избранные) · ✓" inset>
            <CardRail label="Избранные коктейли">
              {['negroni', 'mojito', 'dry-martini', 'daiquiri', 'aperol-spritz'].map((id, i) => (
                <CardRailItem key={id}>
                  <CocktailCard cocktail={must(id)} compact available={i % 2 === 1} />
                </CardRailItem>
              ))}
            </CardRail>
          </State>
          <State label="Карточка каталога · ♥ + «всё есть» с длинной плашкой" inset>
            <div className="grid grid-cols-2 gap-3 px-4">
              <CocktailCard cocktail={must('virgin-colada')} favorite available />
              <CocktailCard cocktail={must('dry-martini')} favorite />
            </div>
          </State>
          <State label="Пусто — HintLine" inset>
            <HintLine icon={Heart} className="px-4">
              Нажмите сердце на странице коктейля — он появится здесь
            </HintLine>
          </State>
          <State label="Каталог ?fav=1, избранное пусто" inset>
            <EmptyState title="Здесь будут любимые коктейли" hint="Нажмите ♡ на странице коктейля" action={<Button variant="secondary" size="m">Сбросить фильтр</Button>} />
          </State>
          <State label="Чип фильтра" inset>
            <ChipRow label="Фильтры">
              <Chip variant="removable" icon={Heart} iconClassName="fill-current text-accent">Избранное</Chip>
            </ChipRow>
          </State>
        </div>
      </Section>

      <Section id="bar" title="Мой бар" note="v3: главная — герой BarHero (фирменный фон, число Unbounded 64, веер обложек) + BarCategoryCard с шевроном; страница раздела — только непустые типы, TypeNav-якоря, одна «+» в навбаре. Шторка: «Советуем» отдельной плиткой, липкий TypeNav-якоря, тихие GroupHeader, «Готово» без подписи.">
        <div className="flex flex-col gap-5">
          <State label="BarHero · 5 (веер 3) / 1 / 0 с «Что докупить» / pressed" inset>
            <div className="flex flex-col gap-3 px-4">
              <BarHero can={5} nearly={6} covers={[must('negroni'), must('daiquiri'), must('mojito')]} to="/?can=1" />
              <BarHero can={1} nearly={0} covers={[must('aperol-spritz')]} to="/?can=1" />
              <BarHero can={0} nearly={3} covers={[]} to="/?can=1" onBuy={() => {}} />
              <BarHero can={2} nearly={1} covers={[must('dry-martini'), must('gin-tonic')]} to="/?can=1" pressed />
            </div>
          </State>
          <State label="BarItemRow · справочная / своя бутылка / «Другое» / инструмент / pressed" inset>
            <div className="flex flex-col gap-2 px-4">
              <BarItemRow title="Джин" meta="в 8 коктейлях" onClick={() => {}} />
              <BarItemRow title="Laphroaig 10" subtitle="Шотландский виски · 10 лет" meta="в 3 коктейлях" onClick={() => {}} />
              <BarItemRow title="Сироп лаванды" subtitle="Другое" meta="не в рецептах" onClick={() => {}} />
              <BarItemRow title="Шейкер" subtitle="подскажем замену" meta="в 22 коктейлях" onClick={() => {}} />
              <BarItemRow title="Лайм" meta="в 12 коктейлях" onClick={() => {}} pressed />
            </div>
          </State>
          <State label="BarCategoryCard · заполнен / пуст / pressed" inset>
            <div className="flex flex-col gap-3 px-4">
              <BarCategoryCard title="Алкоголь" meta="4 позиции" preview="Джин, Водка, Laphroaig 10 и ещё 1" to="/bar/alcohol" placeholder="Например: джин, ром, вермут" />
              <BarCategoryCard title="Миксеры и прочее" meta="Пока пусто" to="/bar/mixers" placeholder="Например: лайм, сироп, тоник" />
              <BarCategoryCard title="Миксеры и прочее" meta="6 позиций" preview="Лайм, Лимон, Мята и ещё 3" to="/bar/mixers" placeholder="Например: лайм, сироп, тоник" pressed />
            </div>
          </State>
          <State label="TypeNav · чипсы-якоря со счётчиком (активный) · тип со счётчиком без «+»" inset>
            <TypeNav items={[{ id: 'spirit', label: 'Крепкий', count: 3 }, { id: 'bitter', label: 'Биттеры', count: 1 }]} prefix="ds" offset={0} activeId="spirit" />
            <SectionHeader title="Крепкий" count={3} className="mt-2" />
          </State>
          <State label="SuggestCard + GroupHeader (тихая подпись, секции через 24)" inset>
            <div className="mx-4 overflow-hidden rounded-card bg-surface pt-2 pb-2">
              <SuggestCard>
                <PickRow title="Бурбон" subtitle="+2 коктейля" on={false} onToggle={() => {}} />
                <PickRow title="Кампари" subtitle="+1 коктейль" on onToggle={() => {}} />
              </SuggestCard>
              <GroupHeader title="Крепкий" />
              <PickRow title="Абсент" on={false} onToggle={() => {}} />
              <GroupHeader title="Ликёры, вина и вермуты" />
              <PickRow title="Амаретто" on={false} onToggle={() => {}} />
            </div>
          </State>
          <State label="PickRow · выкл / вкл / pressed · AddCustomRow" inset>
            <div className="mx-4 overflow-hidden rounded-card bg-surface">
              <PickRow title="Джин" subtitle="Алкоголь" on={false} onToggle={() => {}} />
              <PickRow title="Лайм" subtitle="Миксеры и прочее" on onToggle={() => {}} />
              <PickRow title="Тоник" on={false} onToggle={() => {}} pressed />
              <AddCustomRow query="Laphroaig 10" onClick={() => {}} />
            </div>
          </State>
          <State label="TextField" inset>
            <div className="px-4">
              <TextField label="Заметка" value={field} onChange={setField} placeholder="Год, возраст — что угодно" hint="Необязательно" />
            </div>
          </State>
          <State label="BottleForm · новая (тип не выбран — кнопка disabled) / правка" inset>
            <div className="flex flex-col gap-4">
              <div className="mx-4 rounded-card bg-surface py-4">
                <BottleForm initial={{ name: 'Laphroaig 10', ref: null }} submitLabel="Добавить в бар" onSubmit={() => {}} />
              </div>
              <div className="mx-4 rounded-card bg-surface py-4">
                <BottleForm editing initial={{ name: 'Laphroaig 10', ref: 'scotch', note: '10 лет' }} submitLabel="Сохранить" onSubmit={() => {}} />
              </div>
            </div>
          </State>
          <State label="Шторка «Добавить алкоголь» (интерактивно) · «Советуем»" inset>
            <div className="mx-4 overflow-hidden rounded-sheet border border-border">
              <BarAddSheet
                open
                inline
                section="alcohol"
                suggestions={[
                  { ref: 'bourbon', name: 'Бурбон', count: 2 },
                  { ref: 'campari', name: 'Кампари', count: 1 },
                ]}
                onClose={() => {}}
                owned={demoOwned}
                bottles={demoBottles}
                onToggle={(id) =>
                  setDemoOwned((prev) => {
                    const next = new Set(prev);
                    if (!next.delete(id)) next.add(id);
                    return next;
                  })
                }
                onCreateBottle={(b) => setDemoBottles((prev) => [...prev, { ...b, id: `b-${prev.length}` }])}
              />
            </div>
          </State>
          <State label="Шторка на подкатегории «Газировка» · поиск не нашёл" inset>
            <div className="mx-4 overflow-hidden rounded-sheet border border-border">
              <BarAddSheet open inline section="mixers" sub="soda" suggestions={[]} initialQuery="Fever-Tree" onClose={() => {}} owned={demoOwned} bottles={demoBottles} onToggle={() => {}} onCreateBottle={() => {}} />
            </div>
          </State>
          <State label="Шторка позиции · своя бутылка" inset>
            <div className="mx-4 overflow-hidden rounded-sheet border border-border">
              <BarItemSheet
                inline
                item={{ id: 'b-demo', title: 'Laphroaig 10', subtitle: 'Шотландский виски', bottle: demoBottles[0], used: usage('scotch', cocktails) }}
                onClose={() => {}}
                onRemove={() => {}}
                onSaveBottle={() => {}}
                isAvailable={() => false}
              />
            </div>
          </State>
          <State label="Пустой бар — EmptyState без иконки, два действия" inset>
            <EmptyState
              title="Соберите бар за минуту"
              hint="Отметьте, что есть дома — покажем, что можно приготовить"
              action={
                <div className="flex flex-col items-stretch gap-2">
                  <Button icon={Plus}>Добавить</Button>
                  <Button variant="plain" size="m">Быстрый старт: базовый бар</Button>
                </div>
              }
            />
          </State>
          <State label="Toast · убрано, над таб-баром" inset>
            <Toast inline icon={Trash2} filled={false} text="«Кампари» убрано" action={<ToastAction>Вернуть</ToastAction>} />
          </State>
        </div>
      </Section>

      <Section id="tint" title="Тинт напитка" note="recipe-tint: cover.to 45% поверх --bg под обложкой, дальше растворяется в фон. Плитки — --tile поверх тинта.">
        <div className="grid grid-cols-3 gap-3 px-4">
          {['negroni', 'daiquiri', 'aperol-spritz'].map((id) => (
            <div key={id} className="recipe-tint h-40 overflow-hidden rounded-card p-2" style={coverStyle(must(id))}>
              <div className="truncate rounded-row bg-tile p-2 text-caption text-fg">{must(id).name}</div>
            </div>
          ))}
        </div>
      </Section>

      <Tinted id="params" title="ParamTiles" note="2×2, gap 12, плитка r 24: сверху подпись с иконкой 16, под ней значение title-3 одной строкой. Крепость — словом и цветом шкалы, без делений." cocktail="negroni">
        <div className="flex flex-col gap-5 px-4">
          <State label="Негрони">
            <ParamTiles items={cocktailParams(must('negroni'))} />
          </State>
          <State label="Вирджин Колада — длинные слова">
            <ParamTiles items={cocktailParams(must('virgin-colada'))} />
          </State>
          <State label="Московский мул">
            <ParamTiles items={cocktailParams(must('moscow-mule'))} />
          </State>
          <State label="Шкала крепости — цвет значения">
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              {(Object.keys(STRENGTH_LABEL) as (keyof typeof STRENGTH_LABEL)[]).map((k) => (
                <span key={k} className={`text-headline ${STRENGTH_TONE[k]}`}>
                  {STRENGTH_LABEL[k]}
                </span>
              ))}
            </div>
          </State>
        </div>
      </Tinted>

      <Tinted id="section" title="SectionHeader" note="l — Unbounded 24/30, мета текстом subhead fg-2 по базовой линии справа («~3 мин»), контрол — строкой ниже; выход порции — справа от 1×/2×/4×; m — title-2 (каталог, бар)." cocktail="daiquiri">
        <div className="flex flex-col gap-3">
          <SectionHeader
            size="l"
            title="Ингредиенты"
            action={
              <div className="flex items-center justify-between gap-3">
                <SegmentedControl label="Порции" options={SERVINGS} value={servings} onChange={setServings} />
                <span className="text-right text-subhead text-fg-2 tabular-nums">{servingVolume(must('mojito'), servings)}</span>
              </div>
            }
          />
          <SectionHeader size="l" title="Приготовление" meta={timeMeta(3)} />
          <SectionHeader title="Похожие" />
        </div>
      </Tinted>

      <Tinted id="segmented" title="SegmentedControl" note="Порции 1× / 2× / 4×: пилюля 44 на тинте, сегменты 40 (тач-зона 44). Активный — инверсия (fg на bg), не акцент." cocktail="daiquiri">
        <div className="flex flex-col gap-5 px-4">
          <State label="интерактивно">
            <SegmentedControl label="Порции" options={SERVINGS} value={servings} onChange={setServings} />
          </State>
          <State label="pressed (4×)">
            <SegmentedControl label="Порции" options={SERVINGS} value={1} onChange={() => {}} pressedValue={4} />
          </State>
        </div>
      </Tinted>

      <Tinted id="ingredient" title="IngredientTile" note={`Плитка r 16, min-h 52, gap 8; без чекбокса и тапа. Общая сетка: числа по правому краю, единицы — колонка по самой длинной (сейчас ${servings}×). «Долить» — стилем значения. Украшение — GarnishNote под списком. Наличие — информер AvailabilityLine: точка + текст, без кнопки.`} cocktail="mojito">
        <div className="flex flex-col px-4">
          <AvailabilityLine state="all" />
          <AvailabilityLine state="missing" names={['Кампари']} />
          <AvailabilityLine state="missing" names={['Кампари', 'Красный вермут', 'Апельсиновый биттер']} />
          <AvailabilityLine state="empty-bar" />
        </div>
        <IngredientList className="mx-4 mt-4">
          {mojito.ingredients.map((ing) => (
            <IngredientTile key={ing.name} name={ing.name} amount={scaleIngredient(ing, servings)} />
          ))}
          <IngredientTile name="Кампари" amount={{ value: '30', unit: 'мл' }} missing />
          <IngredientTile name="Яичный белок" optional amount={scaleIngredient(sour.ingredients[3] ?? { ref: 'egg-white', name: '', category: 'egg' }, servings)} />
        </IngredientList>
        <GarnishNote value={mojito.garnish ?? 'Веточка мяты'} className="mx-4 mt-3" />
        <GarnishNote value="Долька апельсина и коктейльная вишня" className="mx-4 mt-2" />
        <p className="mt-2 px-4 text-footnote text-fg-2">Выход: {servingVolume(mojito, servings)} · Негрони: {servingVolume(must('negroni'), servings)}</p>
        <p className="mt-2 px-4 text-caption text-fg-3 uppercase">информер наличия: всё / нет дома 1 / 3 / бар пуст (ссылка) · мл / листа / долить · нет дома · по желанию · украшение — GarnishNote строкой под списком</p>
      </Tinted>

      <Tinted id="steps" title="Steps" note="Таймлайн: номер в круге 32 (callout 600) + вертикальная линия к следующему (у последнего нет), текст body, между шагами 32; без подложек. Подсказка про инструмент — InfoNote-плитка перед первым шагом." cocktail="whiskey-sour">
        <InfoNote tile icon={Wrench} className="mx-4">
          Понадобится шейкер — подойдёт банка с плотной крышкой.
        </InfoNote>
        <Steps steps={sour.steps} className="mt-5" />
        <p className="mt-6 px-4 text-caption text-fg-3 uppercase">2 шага</p>
        <Steps steps={sour.steps.slice(0, 2)} className="mt-2" />
      </Tinted>

      <p className="mt-12 px-4 text-center text-caption text-fg-3">В базе {countLabel(cocktails.length)}</p>
    </main>
  );
}
