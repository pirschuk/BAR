import { Check, ChevronRight, Plus } from 'lucide-react';
import { Link } from 'react-router';
import { cn } from '../../lib/cn';
import { IconButton } from './Button';

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

/** Пустая подкатегория — «＋ Добавить газировку»: плитка контуром, тап — шторка на этой подкатегории */
export function AddRow({ label, onClick, pressed }: { label: string; onClick: () => void; pressed?: boolean }) {
  return (
    <button
      type="button"
      data-pressed={pressed || undefined}
      onClick={onClick}
      className="pressable flex min-h-row-l w-full items-center gap-3 rounded-row border border-tile-strong px-4 text-left text-body text-fg-2"
    >
      <Plus className="size-5 shrink-0 text-accent" aria-hidden />
      Добавить {label}
    </button>
  );
}

/**
 * Раздел на главной «Моего бара» [WHOOP, GitHub — My Work]: плитка r 24, Unbounded-заголовок, мета, превью
 * названий (2 строки); вся карточка — переход на страницу раздела, «+» 44 — шторка раздела (не вложены).
 */
export function BarCategoryCard({
  title,
  meta,
  preview,
  to,
  onAdd,
  placeholder,
  accentAdd,
  pressed,
}: {
  title: string;
  /** «4 позиции · в 23 коктейлях» */
  meta: string;
  /** «Джин, Водка, Laphroaig 10 и ещё 1»; пусто — подсказка placeholder */
  preview?: string;
  /** пустой раздел: «Например: джин, ром, вермут» */
  placeholder: string;
  /** «+» акцентом — пуст только этот раздел (когда пуст весь бар, акцент у «Быстрого старта») */
  accentAdd?: boolean;
  to: string;
  onAdd: () => void;
  pressed?: boolean;
}) {
  return (
    <section className="relative flex items-start gap-3 rounded-tile bg-tile p-4" aria-label={title}>
      <Link to={to} data-pressed={pressed || undefined} className="pressable absolute inset-0 rounded-tile" aria-label={`${title}: ${meta}`} />
      <div className="pointer-events-none relative min-w-0 flex-1">
        {/* шеврон — inline за последним словом: при переносе не висит рядом с «+» второй кнопкой */}
        <h2 className="font-display text-section text-fg">
          {title}&nbsp;<ChevronRight className="inline size-5 align-[-2px] text-fg-3" aria-hidden />
        </h2>
        <p className="mt-1 text-footnote text-fg-2">{meta}</p>
        <p className={cn('mt-3 line-clamp-2 text-subhead', preview ? 'text-fg' : 'text-fg-2')}>{preview || placeholder}</p>
      </div>
      <IconButton
        icon={Plus}
        label={`Добавить: ${title.toLowerCase()}`}
        size="l"
        onClick={onAdd}
        className={cn('relative', accentAdd ? 'bg-accent! text-accent-fg!' : 'bg-tile-strong!')}
      />
    </section>
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
