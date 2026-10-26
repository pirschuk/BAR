import { Check, ChevronRight, Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '../../lib/cn';

/**
 * Строка полки «Моего бара» [Alta — бренд крупно, тип подписью]: плитка r 16, название body,
 * подпись footnote fg-2 (тип своей бутылки, заметка), справа «в N коктейлях». Тап — шторка позиции.
 */
export function BarItemRow({
  title,
  subtitle,
  meta,
  onClick,
  pressed,
}: {
  title: string;
  subtitle?: string;
  /** «в 8 коктейлях» / «не участвует в рецептах» */
  meta?: string;
  onClick: () => void;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      data-pressed={pressed || undefined}
      onClick={onClick}
      className="pressable flex min-h-row-l w-full items-center gap-3 rounded-row bg-tile px-4 py-2.5 text-left"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body text-fg">{title}</span>
        {subtitle && <span className="block truncate text-footnote text-fg-2">{subtitle}</span>}
      </span>
      {meta && <span className="shrink-0 text-footnote text-fg-2">{meta}</span>}
      <ChevronRight className="size-4 shrink-0 text-fg-3" aria-hidden />
    </button>
  );
}

/**
 * Раздел на главной «Моего бара» [WHOOP, GitHub — My Work]: плитка r 24, Unbounded-заголовок, «4 позиции»,
 * превью названий (2 строки); справа шеврон — вся карточка ведёт внутрь. Добавлять — только на странице раздела.
 */
export function BarCategoryCard({
  title,
  meta,
  preview,
  placeholder,
  to,
  pressed,
}: {
  title: string;
  /** «4 позиции» / «Пока пусто» */
  meta: string;
  /** «Джин, Водка, Laphroaig 10 и ещё 1»; пусто — placeholder */
  preview?: string;
  /** пустой раздел: «Например: джин, ром, вермут» */
  placeholder: string;
  to: string;
  pressed?: boolean;
}) {
  return (
    <Link to={to} data-pressed={pressed || undefined} className="pressable flex items-center gap-3 rounded-tile bg-tile p-4">
      <span className="min-w-0 flex-1">
        <span className="block font-display text-section text-fg">{title}</span>
        <span className="mt-1 block text-footnote text-fg-2">{meta}</span>
        <span className={cn('mt-3 line-clamp-2 block text-subhead', preview ? 'text-fg' : 'text-fg-2')}>{preview || placeholder}</span>
      </span>
      <ChevronRight className="size-6 shrink-0 text-fg-2" aria-hidden />
    </Link>
  );
}

/**
 * «Советуем» в шторке — отдельная плитка над списком [Шаг 13]: заголовок + «откроют новые коктейли»,
 * строки PickRow с «+N коктейлей». Не смешивается со справочником.
 */
export function SuggestCard({ children }: { children: ReactNode }) {
  return (
    <section className="mx-4 overflow-hidden rounded-tile bg-tile py-2" aria-label="Советуем">
      <div className="px-4 pt-2 pb-1">
        <h3 className="text-headline text-fg">Советуем</h3>
        <p className="text-footnote text-fg-2">откроют новые коктейли</p>
      </div>
      {children}
    </section>
  );
}

/** Заголовок группы в длинном списке шторки: липнет под чипсами (top задаёт родитель), фон шторки */
export function GroupHeader({ id, title, className }: { id?: string; title: string; className?: string }) {
  return (
    <h3 id={id} className={cn('z-10 bg-surface px-4 pt-6 pb-2 text-headline text-fg', className)}>
      {title}
    </h3>
  );
}

/**
 * Строка выбора в шторке «Добавить» [Subway]: тап переключает, шторка не закрывается.
 * Справа круг 28: «+» контуром / «✓» заливкой акцентом. radio — для выбора типа бутылки.
 */
export function PickRow({
  title,
  subtitle,
  on,
  onToggle,
  pressed,
  radio,
}: {
  title: string;
  subtitle?: string;
  on: boolean;
  onToggle: () => void;
  pressed?: boolean;
  radio?: boolean;
}) {
  return (
    <button
      type="button"
      role={radio ? 'radio' : 'checkbox'}
      aria-checked={on}
      data-pressed={pressed || undefined}
      onClick={onToggle}
      className="pressable flex min-h-row-l w-full items-center gap-3 px-4 py-2 text-left"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body text-fg">{title}</span>
        {subtitle && <span className="block truncate text-footnote text-fg-2">{subtitle}</span>}
      </span>
      <span
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-full transition-colors',
          on ? 'bg-tile-strong text-accent' : 'border-2 border-fg-3/60 text-fg-2',
        )}
        aria-hidden
      >
        {on ? <Check className="size-4" strokeWidth={3} /> : !radio && <Plus className="size-4" strokeWidth={2.5} />}
      </span>
    </button>
  );
}

/** Поиск не нашёл — «＋ Добавить «Laphroaig 10» как свою бутылку» [Shopify — Add "Cap"] */
export function AddCustomRow({ query, onClick, pressed }: { query: string; onClick: () => void; pressed?: boolean }) {
  return (
    <button
      type="button"
      data-pressed={pressed || undefined}
      onClick={onClick}
      className="pressable flex min-h-row-l w-full items-center gap-3 px-4 py-2 text-left"
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-tile-strong text-accent" aria-hidden>
        <Plus className="size-4" strokeWidth={2.5} />
      </span>
      <span className="min-w-0 flex-1 text-body text-fg">
        Добавить <span className="text-accent">«{query.trim()}»</span> как свою бутылку
      </span>
    </button>
  );
}
