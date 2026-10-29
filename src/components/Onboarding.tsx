import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import { getCocktail } from '../lib/cocktails';
import type { Cocktail } from '../types/cocktail';
import { cn } from '../lib/cn';
import { Button } from './ui/Button';
import { PageDots } from './ui/PageDots';
import { CocktailCard } from './ui/CocktailCard';
import { CheckBox } from './ui/Toggles';
import { GuideTile } from './ui/GuideParts';

// --- Онбординг первого запуска: 3 идеи на настоящих кусочках интерфейса + финал с действием ---

const card = (id: string) => getCocktail(id)!;

/** Слайд 1 — каталог: веер из трёх карточек с картинками напитков, лёгкое покачивание */
function CardFan() {
  const ids = ['mojito', 'negroni', 'aviation'];
  return (
    <div className="relative h-72 w-full" inert>
      {ids.map((id, i) => (
        <div
          key={id}
          className={cn(
            'absolute top-4 left-1/2 w-36 motion-safe:animate-[float_4s_ease-in-out_infinite]',
            i === 0 && '-translate-x-[118%] rotate-[-9deg]',
            i === 1 && 'z-10 -translate-x-1/2 -translate-y-3',
            i === 2 && 'translate-x-[18%] rotate-[9deg]',
          )}
          style={{ animationDelay: `${i * 0.4}s` }}
        >
          <CocktailCard cocktail={card(id)} tabIndex={-1} />
        </div>
      ))}
    </div>
  );
}

const DEMO_ROWS = ['Джин', 'Кампари', 'Красный вермут'];

/** Слайд 2 — «Мой бар»: строки отмечаются по очереди, число «Можно приготовить» растёт */
function BarDemo({ active }: { active: boolean }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!active) return setStep(0);
    const t = [1, 2, 3].map((n) => setTimeout(() => setStep(n), 450 + n * 450));
    return () => t.forEach(clearTimeout);
  }, [active]);
  const can = [0, 1, 3, 6][step]!;
  return (
    <div className="flex w-full max-w-80 flex-col gap-2" inert>
      <div className="hero-brand rounded-sheet p-5 text-on-media">
        <p className="text-subhead text-on-media-2">Можно приготовить</p>
        <p className="mt-1 font-display text-hero tabular-nums">{can}</p>
      </div>
      {DEMO_ROWS.map((name, i) => (
        <div key={name} className="flex min-h-row-l items-center justify-between gap-3 rounded-row bg-tile px-4">
          <span className="text-body text-fg">{name}</span>
          <CheckBox on={step > i} />
        </div>
      ))}
    </div>
  );
}

/** авторский для слайда 3 — картинка из состава, никто её не рисовал */
const OWN: Cocktail = {
  ...card('negroni'),
  id: 'my-intro',
  name: 'Мой Кампари-тоник',
  glass: 'highball',
  ice: 'cubes',
  method: 'build',
  custom: true,
  abv: 9,
  strength: 'light',
  ingredients: [
    { ref: 'campari', name: 'Кампари', amountMl: 40, category: 'bitter' },
    { ref: 'soda', name: 'Содовая', unit: 'top', category: 'soda' },
  ],
};

/** Слайд 3 — своё: авторская карточка в избранном (♡ на ней), плитка азбуки */
function OwnDemo() {
  return (
    <div className="flex w-full max-w-80 items-start gap-3" inert>
      <div className="w-40 shrink-0">
        <CocktailCard cocktail={OWN} tabIndex={-1} favorite />
      </div>
      {/* ♡ — уже на карточке (избранное), рядом — плитка азбуки */}
      <div className="flex min-w-0 flex-1 flex-col justify-center self-stretch">
        <GuideTile topic="glass" label="Бокалы" count="10 статей" to="/guide" />
      </div>
    </div>
  );
}

type Slide = { title: [string, string]; text: string; visual: (active: boolean) => ReactNode };

const SLIDES: Slide[] = [
  { title: ['100 коктейлей', 'с рецептами'], text: 'Поиск по названию и ингредиенту, фильтры и «Мне повезёт», когда не знаете, что выбрать.', visual: () => <CardFan /> },
  { title: ['Отметьте,', 'что есть дома'], text: '«Мой бар» покажет, что можно приготовить прямо сейчас и чего не хватает до нового.', visual: (a) => <BarDemo active={a} /> },
  { title: ['Ваше', 'собственное'], text: 'Собирайте свои коктейли, сохраняйте любимые и разбирайтесь в бокалах и методах в азбуке.', visual: () => <OwnDemo /> },
];

type Props = {
  open: boolean;
  /** «Пропустить», «Назад», «Понятно» */
  onClose: () => void;
  /** финал: быстрый старт / отмечу сам / каталог; null — без финала (повтор, бар уже не пуст) */
  onFinish: ((choice: 'quick' | 'bar' | 'catalog') => void) | null;
  /** для витрины: рисовать в рамке, начать с экрана */
  inline?: boolean;
  startAt?: number;
};

/**
 * Полноэкранный онбординг [pillowtalk, Google Health]: «Пропустить» сверху, визуал из настоящих компонентов,
 * заголовок Unbounded в два тона (вторая строка — акцент), подпись, точки и «Дальше». Свайп листает
 * со следованием за пальцем; финальный экран — действие (заполнить бар), а не прощание.
 */
export function Onboarding({ open, onClose, onFinish, inline, startAt = 0 }: Props) {
  const total = SLIDES.length + (onFinish ? 1 : 0);
  const [index, setIndex] = useState(startAt);
  const [dx, setDx] = useState(0);
  const drag = useRef<{ x: number; y: number; on: boolean } | null>(null);
  useEffect(() => {
    if (open) setIndex(startAt);
  }, [open, startAt]);
  if (!open) return null;

  const last = index === total - 1;
  const go = (i: number) => setIndex(Math.max(0, Math.min(total - 1, i)));
  const next = () => (last ? onClose() : go(index + 1));

  const onDown = (e: PointerEvent) => {
    if ((e.target as HTMLElement).closest('button, a')) return;
    drag.current = { x: e.clientX, y: e.clientY, on: false };
  };
  const onMove = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const mx = e.clientX - d.x;
    if (!d.on && Math.abs(mx) > 8 && Math.abs(mx) > Math.abs(e.clientY - d.y)) {
      d.on = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    // у краёв — сопротивление
    if (d.on) setDx((index === 0 && mx > 0) || (last && mx < 0) ? mx / 3 : mx);
  };
  const onUp = () => {
    if (drag.current?.on) {
      if (dx < -60) go(index + 1);
      else if (dx > 60) go(index - 1);
    }
    drag.current = null;
    setDx(0);
  };

  const finalSlide = (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <span className="flex size-20 items-center justify-center rounded-full bg-tile-strong text-accent">
        <Sparkles className="size-9" aria-hidden />
      </span>
      <h2 className="mt-8 font-display text-display text-fg">
        Соберите бар
        <br />
        <span className="text-accent">за минуту</span>
      </h2>
      <p className="mt-4 text-body text-fg-2">Начните с базового набора — потом добавите своё. Или отметьте всё сами.</p>
    </div>
  );

  return (
    <div
      role="dialog"
      aria-modal={inline ? undefined : true}
      aria-label="Знакомство с BAR"
      className={cn('flex flex-col overflow-hidden bg-bg text-fg', inline ? 'relative h-[760px]' : 'fixed inset-0 z-[60] mx-auto max-w-app')}
      onKeyDown={(e) => (e.key === 'ArrowRight' ? go(index + 1) : e.key === 'ArrowLeft' ? go(index - 1) : undefined)}
    >
      <div className={cn('shrink-0', !inline && 'pt-safe')}>
        <div className="flex h-nav-btn items-center justify-end px-2">
          {!last && (
            <Button variant="plain" size="m" className="text-fg-2!" onClick={onClose}>
              Пропустить
            </Button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 touch-pan-y select-none" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        <div
          className="flex h-full"
          style={{
            width: `${total * 100}%`,
            transform: `translateX(calc(${(-index * 100) / total}% + ${dx}px))`,
            transition: dx ? 'none' : 'transform var(--dur-push) var(--ease-push)',
          }}
        >
          {SLIDES.map((s, i) => (
            <section key={i} aria-hidden={i !== index || undefined} className="flex h-full flex-col px-6" style={{ width: `${100 / total}%` }}>
              <div className="flex min-h-0 flex-1 items-center justify-center">{s.visual(i === index)}</div>
              <h2 className="font-display text-display text-fg">
                {s.title[0]}
                <br />
                <span className="text-accent">{s.title[1]}</span>
              </h2>
              <p className="mt-3 text-body text-fg-2">{s.text}</p>
            </section>
          ))}
          {onFinish && (
            <section aria-hidden={!last || undefined} className="h-full" style={{ width: `${100 / total}%` }}>
              {finalSlide}
            </section>
          )}
        </div>
      </div>

      <div className={cn('shrink-0 px-4 pt-6', inline ? 'pb-4' : 'pb-safe-sm')}>
        <PageDots count={total} index={index} className="mb-5" />
        {last && onFinish ? (
          <div className="flex flex-col gap-2">
            <Button icon={Sparkles} className="w-full" onClick={() => onFinish('quick')}>
              Быстрый старт: базовый бар
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => onFinish('bar')}>
              Отмечу сам
            </Button>
            <Button variant="plain" className="w-full text-fg-2!" onClick={() => onFinish('catalog')}>
              Сначала посмотрю каталог
            </Button>
          </div>
        ) : (
          <Button className="w-full" onClick={next}>
            {last ? 'Понятно' : 'Дальше'}
          </Button>
        )}
      </div>
    </div>
  );
}
