import { Check, ChevronRight, Plus } from 'lucide-react';
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

/** «Докупить»: что откроет больше коктейлей — название, «откроет N коктейлей», «+» 44 */
export function UnlockRow({ name, hint, onAdd, pressed }: { name: string; hint: string; onAdd: () => void; pressed?: boolean }) {
  return (
    <div className="flex min-h-row-l items-center gap-3 rounded-row bg-tile py-1.5 pr-1.5 pl-4">
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body text-fg">{name}</span>
        <span className="block text-footnote text-success">{hint}</span>
      </span>
      <IconButton icon={Plus} label={`Добавить ${name} в бар`} size="l" pressed={pressed} onClick={onAdd} className="bg-tile-strong!" />
    </div>
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
          on ? 'bg-accent text-accent-fg' : 'border-2 border-fg-3/60 text-fg-2',
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
