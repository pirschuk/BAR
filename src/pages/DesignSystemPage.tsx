import { useEffect, useState, type ReactNode } from 'react';
import { ChevronLeft, Moon } from 'lucide-react';
import { Link } from 'react-router';
import { cocktails, countLabel, getCocktail, scaleIngredient, type GlassShape, type Servings } from '../lib/cocktails';
import { useTheme } from '../lib/theme';
import type { Cocktail, Ice } from '../types/cocktail';
import { Button, IconButton, buttonClass } from '../components/ui/Button';
import { Chip, ChipRow } from '../components/ui/Chip';
import { GlassIllustration } from '../components/ui/GlassIllustration';
import { CocktailCard, coverStyle } from '../components/ui/CocktailCard';
import { CocktailHero } from '../components/ui/CocktailHero';
import { StatGrid, StrengthMeter } from '../components/ui/StatGrid';
import { SectionHeader } from '../components/ui/SectionHeader';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { IngredientRow } from '../components/ui/IngredientRow';
import { StepList } from '../components/ui/StepList';
import { ThemeToggle } from '../components/ThemeToggle';
import { cocktailStats } from '../components/cocktailStats';
import { SERVINGS } from './CocktailPage';

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

function State({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="mb-2 text-caption text-fg-3 uppercase">{label}</p>
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
] as const;

const TYPE_SCALE = [
  { cls: 'text-large-title', name: 'large-title', spec: '34/41 · 700', use: 'заголовок экрана' },
  { cls: 'text-title-1', name: 'title-1', spec: '28/34 · 700', use: 'название коктейля' },
  { cls: 'text-title-2', name: 'title-2', spec: '22/28 · 700', use: 'секции' },
  { cls: 'text-headline', name: 'headline', spec: '17/22 · 600', use: 'карточки, кнопки' },
  { cls: 'text-body', name: 'body', spec: '17/22 · 400', use: 'основной текст' },
  { cls: 'text-callout', name: 'callout', spec: '16/21 · 400', use: 'шаги' },
  { cls: 'text-subhead', name: 'subhead', spec: '15/20 · 400', use: 'чипсы' },
  { cls: 'text-footnote', name: 'footnote', spec: '13/18 · 400', use: 'подписи, мета' },
  { cls: 'text-caption', name: 'caption', spec: '12/16 · 500', use: 'плашки' },
] as const;

const SHAPES: { shape: GlassShape; label: string; ice: Ice; cocktail: string }[] = [
  { shape: 'rocks', label: 'Рокс', ice: 'big-cube', cocktail: 'negroni' },
  { shape: 'coupe', label: 'Купе', ice: 'none', cocktail: 'daiquiri' },
  { shape: 'highball', label: 'Хайбол', ice: 'crushed', cocktail: 'mojito' },
  { shape: 'collins', label: 'Коллинз', ice: 'cubes', cocktail: 'tom-collins' },
  { shape: 'martini', label: 'Мартини', ice: 'none', cocktail: 'cosmopolitan' },
  { shape: 'wine', label: 'Винный', ice: 'cubes', cocktail: 'aperol-spritz' },
];

function useCssVar(name: string) {
  const { theme } = useTheme();
  const [value, setValue] = useState('');
  useEffect(() => {
    setValue(getComputedStyle(document.documentElement).getPropertyValue(name).trim());
  }, [name, theme]);
  return value;
}

function Swatch({ token, cls, note }: (typeof PALETTE)[number]) {
  const value = useCssVar(token);
  return (
    <div className="flex items-center gap-3">
      <span className={`size-11 shrink-0 rounded-control border border-border ${cls}`} />
      <span className="min-w-0">
        <span className="block text-subhead font-semibold text-fg">{token}</span>
        <span className="block truncate text-footnote text-fg-2">{note}</span>
        <span className="block truncate text-caption text-fg-3 uppercase">{value.replace(/\s+/g, '')}</span>
      </span>
    </div>
  );
}

// --- страница ---

export function DesignSystemPage() {
  const [chip, setChip] = useState('gin');
  const [servings, setServings] = useState<Servings>(2);
  const [checked, setChecked] = useState<ReadonlySet<number>>(new Set([0]));
  const sour = must('whiskey-sour');
  const mojito = must('mojito');

  const toggle = (i: number) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (!next.delete(i)) next.add(i);
      return next;
    });

  return (
    <main className="pb-safe">
      <header className="pt-safe flex items-start justify-between gap-3 px-4">
        <div>
          <h1 className="text-large-title text-fg">Дизайн-система</h1>
          <p className="mt-1 text-footnote text-fg-2">BAR v0.1 · компоненты MVP</p>
        </div>
        <ThemeToggle />
      </header>

      <ChipRow label="Разделы" className="mt-4">
        {[
          ['palette', 'Палитра'],
          ['type', 'Типографика'],
          ['button', 'Button'],
          ['chip', 'Chip'],
          ['glass', 'Бокалы'],
          ['card', 'CocktailCard'],
          ['hero', 'CocktailHero'],
          ['stats', 'StatGrid'],
          ['section', 'SectionHeader'],
          ['segmented', 'Segmented'],
          ['ingredient', 'IngredientRow'],
          ['steps', 'StepList'],
        ].map(([id, label]) => (
          <a key={id} href={`#${id}`} className="pressable hit-44 inline-flex h-chip shrink-0 items-center rounded-full border border-border bg-surface-2 px-3.5 text-subhead font-medium text-fg">
            {label}
          </a>
        ))}
      </ChipRow>

      <Section id="palette" title="Палитра" note="CSS-переменные; значения меняются вместе с темой. Обложки коктейлей — данные (cover), не токены.">
        <div className="grid grid-cols-2 items-start gap-x-3 gap-y-4 px-4">
          {PALETTE.map((p) => (
            <Swatch key={p.token} {...p} />
          ))}
        </div>
      </Section>

      <Section id="type" title="Типографика" note="Системный шрифт (SF Pro на iOS). Числа объёмов — tabular-nums.">
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

      <Section id="button" title="Button" note="L 50 — CTA, pill; M 44 — действия, радиус 12. IconButton: 36 визуально, 44 тач-зона.">
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
          <State label="Link как кнопка">
            <Link to="/" className={buttonClass('primary', 'l', 'w-full')}>
              Открыть каталог
            </Link>
          </State>
          <State label="IconButton · tonal — default / pressed / disabled">
            <div className="flex gap-4">
              <IconButton icon={Moon} label="Тема" />
              <IconButton icon={Moon} label="Тема" pressed />
              <IconButton icon={Moon} label="Тема" disabled />
            </div>
          </State>
          <State label="IconButton · glass — поверх обложки">
            <div className="cover-gradient flex gap-4 rounded-card p-4" style={coverStyle(sour)}>
              <IconButton icon={ChevronLeft} label="Назад" variant="glass" />
              <IconButton icon={ChevronLeft} label="Назад" variant="glass" pressed />
            </div>
          </State>
        </div>
      </Section>

      <Section id="chip" title="Chip / ChipRow" note="36 визуально, 44 тач-зона. Выбранный — акцент. Ряд уходит за правый край.">
        <div className="flex flex-col gap-5">
          <State label="default / selected / pressed / disabled" className="px-4">
            <div className="flex flex-wrap gap-2">
              <Chip>Джин</Chip>
              <Chip selected>Ром</Chip>
              <Chip pressed>Виски</Chip>
              <Chip disabled>Текила</Chip>
            </div>
          </State>
          <div>
            <p className="mb-2 px-4 text-caption text-fg-3 uppercase">ChipRow · интерактивно</p>
            <ChipRow label="База">
              {['Все', 'Джин', 'Ром', 'Виски', 'Текила', 'Водка', 'Аперитивы'].map((label) => (
                <Chip key={label} selected={chip === label} onClick={() => setChip(label)}>
                  {label}
                </Chip>
              ))}
            </ChipRow>
          </div>
        </div>
      </Section>

      <Section id="glass" title="GlassIllustration" note="6 силуэтов MVP; остальные бокалы маппятся на ближайший. Лёд: кубики, крупный, колотый.">
        <div className="grid grid-cols-3 gap-3 px-4">
          {SHAPES.map((s) => (
            <figure key={s.shape} className="cover-gradient flex flex-col items-center rounded-card pt-3 pb-2" style={coverStyle(must(s.cocktail))}>
              <GlassIllustration shape={s.shape} ice={s.ice} className="h-24" />
              <figcaption className="mt-1 text-caption text-on-media">{s.label}</figcaption>
            </figure>
          ))}
        </div>
      </Section>

      <Section id="card" title="CocktailCard" note="3:4, 173×231 в сетке. Градиент напитка + бокал + стеклянная плашка + скрим под названием.">
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
          <State label="светлый градиент">
            <CocktailCard cocktail={must('dry-martini')} />
          </State>
        </div>
      </Section>

      <Section id="hero" title="CocktailHero" note="На экране — 55% высоты; здесь превью 320. «Назад» — glass, под safe-area.">
        <div className="flex flex-col gap-5">
          <State label="короткое название" className="px-4">
            <div className="overflow-hidden rounded-card">
              <CocktailHero cocktail={must('negroni')} onBack={() => {}} height="preview" />
            </div>
          </State>
          <State label="длинное название" className="px-4">
            <div className="overflow-hidden rounded-card">
              <CocktailHero cocktail={LONG_NAME} onBack={() => {}} height="preview" />
            </div>
          </State>
        </div>
      </Section>

      <Section id="stats" title="StatGrid / StrengthMeter" note="4 колонки по содержимому, крайние — по краям; крепость — 4 деления по ABV: ≤10 · ≤18 · ≤26 · >26 %.">
        <div className="flex flex-col gap-5 px-4">
          <State label="Олд Фэшн">
            <StatGrid items={cocktailStats(must('old-fashioned'))} />
          </State>
          <State label="Мохито">
            <StatGrid items={cocktailStats(mojito)} />
          </State>
          <State label="StrengthMeter · уровни 1–4">
            <div className="grid grid-cols-4 gap-3 text-headline text-fg">
              {([[1, 8], [2, 15], [3, 24], [4, 30]] as const).map(([level, abv]) => (
                <StrengthMeter key={level} level={level} abv={abv} />
              ))}
            </div>
          </State>
        </div>
      </Section>

      <Section id="section" title="SectionHeader" note="title-2 + контрол справа или без него.">
        <div className="flex flex-col gap-3">
          <SectionHeader title="Приготовление" />
          <SectionHeader
            title="Ингредиенты"
            action={<SegmentedControl label="Порции" options={SERVINGS} value={servings} onChange={setServings} />}
          />
        </div>
      </Section>

      <Section id="segmented" title="SegmentedControl" note="Порции 1× / 2× / 4×. Активный — инверсия (fg на bg), не акцент: акцент на экране один.">
        <div className="flex flex-col gap-5 px-4">
          <State label="интерактивно">
            <SegmentedControl label="Порции" options={SERVINGS} value={servings} onChange={setServings} />
          </State>
          <State label="pressed (4×)">
            <SegmentedControl label="Порции" options={SERVINGS} value={1} onChange={() => {}} pressedValue={4} />
          </State>
        </div>
      </Section>

      <Section id="ingredient" title="IngredientRow" note={`Чек-лист, пересчёт под порции (сейчас ${servings}×). Тап по строке — отметить.`}>
        <ul>
          {mojito.ingredients.map((ing, i) => (
            <li key={ing.name}>
              <IngredientRow name={ing.name} amount={scaleIngredient(ing, servings)} checked={checked.has(i)} onToggle={() => toggle(i)} />
            </li>
          ))}
          <li>
            <IngredientRow
              name="Яичный белок"
              optional
              amount={scaleIngredient(sour.ingredients[3] ?? { name: '', category: 'egg' }, servings)}
              checked={false}
              onToggle={() => {}}
              pressed
            />
          </li>
        </ul>
        <p className="mt-2 px-4 text-caption text-fg-3 uppercase">default · checked · единицы мл / лист / бар. л. / долить · optional + pressed</p>
      </Section>

      <Section id="steps" title="StepList" note="Номер в круге 28 + callout; длинный шаг переносится.">
        <StepList steps={must('whiskey-sour').steps} />
      </Section>

      <p className="mt-12 px-4 text-center text-caption text-fg-3">В базе {countLabel(cocktails.length)}</p>
    </main>
  );
}
