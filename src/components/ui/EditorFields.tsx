import { useLayoutEffect, useRef, type PointerEvent, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { ChevronRight, GripVertical, Minus, Plus, X, type LucideIcon } from 'lucide-react';
import type { Cover, Strength } from '../../types/cocktail';
import { strengthLabel } from '../../lib/cocktails';
import { cn } from '../../lib/cn';
import { STRENGTH_TONE } from '../cocktailStats';

// --- Поля редактора авторского коктейля (язык v2: плитки bg-tile, поля 56, тач-зоны ≥ 44) ---

/** Многострочное поле: bg-tile r 24, растёт по тексту; подпись сверху, как у TextField */
export function TextArea({
  label,
  value,
  onChange,
  hint,
  error,
  className,
  ...rest
}: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> & { label?: string; value: string; onChange: (v: string) => void; hint?: string; error?: boolean }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <label className={cn('flex flex-col gap-1.5', className)}>
      {label && <span className="text-footnote text-fg-2">{label}</span>}
      <textarea
        ref={ref}
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'min-h-field resize-none rounded-tile bg-tile px-5 py-4 text-body text-fg outline-none placeholder:text-fg-3 focus:outline-1 focus:outline-fg-3',
          error && 'outline-1 outline-danger',
        )}
        {...rest}
      />
      {hint && <span className="text-footnote text-fg-2">{hint}</span>}
    </label>
  );
}

/** Степпер количества «−  30 мл  +»: кнопки 44, шаг по единице; без числа («долить») — только подпись */
export function Stepper({
  value,
  unit,
  onChange,
  step,
  min = 0,
  label,
}: {
  value?: number;
  unit: string;
  onChange?: (v: number) => void;
  step: number;
  min?: number;
  label: string;
}) {
  if (value === undefined || !onChange) return <span className="px-3 text-headline text-fg">{unit}</span>;
  return (
    <span className="flex items-center rounded-full bg-tile-strong" role="group" aria-label={label}>
      <button type="button" aria-label="Меньше" disabled={value - step < min} onClick={() => onChange(Math.max(min, value - step))} className="pressable flex size-tap items-center justify-center rounded-full text-fg disabled:text-fg-3">
        <Minus className="size-4" aria-hidden />
      </button>
      <span className="min-w-14 text-center text-headline text-fg tabular-nums">
        {value} <span className="text-footnote text-fg-2">{unit}</span>
      </span>
      <button type="button" aria-label="Больше" onClick={() => onChange(value + step)} className="pressable flex size-tap items-center justify-center rounded-full text-fg">
        <Plus className="size-4" aria-hidden />
      </button>
    </span>
  );
}

/** Строка выбора параметра: «🍸 Бокал · Рокс ›» — тап открывает шторку-список */
export function ParamPickRow({ icon: Icon, label, value, onClick, pressed }: { icon: LucideIcon; label: string; value?: string; onClick: () => void; pressed?: boolean }) {
  return (
    <button type="button" data-pressed={pressed || undefined} onClick={onClick} className="pressable flex min-h-row-l w-full items-center gap-3 rounded-row bg-tile px-4 text-left">
      <Icon className="size-5 shrink-0 text-fg-2" aria-hidden />
      <span className="flex-1 text-body text-fg-2">{label}</span>
      <span className={cn('text-body', value ? 'text-fg' : 'text-fg-3')}>{value ?? 'Выберите'}</span>
      <ChevronRight className="size-4 shrink-0 text-fg-3" aria-hidden />
    </button>
  );
}

/** Перетаскивание за ≡ (отдельная ручка — не мешает скроллу): onMove(from, to) по пересечению середин строк */
function useDrag(index: number, onMove: (from: number, to: number) => void) {
  return (e: PointerEvent<HTMLButtonElement>) => {
    const row = e.currentTarget.closest('[data-row]') as HTMLElement | null;
    const list = row?.parentElement;
    if (!row || !list) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    let current = index;
    row.dataset.dragging = '1';
    const move = (ev: globalThis.PointerEvent) => {
      const rows = [...list.querySelectorAll<HTMLElement>(':scope > [data-row]')];
      const target = rows.findIndex((r) => {
        const b = r.getBoundingClientRect();
        return ev.clientY >= b.top && ev.clientY <= b.bottom;
      });
      if (target >= 0 && target !== current) {
        onMove(current, target);
        current = target;
      }
    };
    const up = () => {
      delete row.dataset.dragging;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
}

function RowShell({ children, index, onMove, onRemove, removeLabel, error }: { children: ReactNode; index: number; onMove: (from: number, to: number) => void; onRemove: () => void; removeLabel: string; error?: boolean }) {
  const drag = useDrag(index, onMove);
  return (
    <li data-row className={cn('flex items-center gap-1 rounded-row bg-tile py-1.5 pr-1 pl-1 data-[dragging]:bg-tile-strong', error && 'outline-1 outline-danger')}>
      <button type="button" aria-label="Перетащить" onPointerDown={drag} className="flex size-tap shrink-0 cursor-grab touch-none items-center justify-center text-fg-3">
        <GripVertical className="size-5" aria-hidden />
      </button>
      {children}
      <button type="button" aria-label={removeLabel} onClick={onRemove} className="pressable flex size-tap shrink-0 items-center justify-center rounded-full text-fg-2">
        <X className="size-5" aria-hidden />
      </button>
    </li>
  );
}

/** Ингредиент в редакторе: ≡ · название · степпер (или «долить») · × */
export function IngredientEditRow({
  index,
  name,
  stepper,
  onMove,
  onRemove,
  error,
}: {
  index: number;
  name: string;
  stepper: ReactNode;
  onMove: (from: number, to: number) => void;
  onRemove: () => void;
  error?: boolean;
}) {
  return (
    <RowShell index={index} onMove={onMove} onRemove={onRemove} removeLabel={`Убрать ${name}`} error={error}>
      <span className="line-clamp-2 min-w-0 flex-1 text-subhead text-fg">{name}</span>
      {stepper}
    </RowShell>
  );
}

/** Шаг в редакторе: ≡ · номер в круге (как Steps) · текст · × */
export function StepEditRow({ index, value, onChange, onMove, onRemove }: { index: number; value: string; onChange: (v: string) => void; onMove: (from: number, to: number) => void; onRemove: () => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <RowShell index={index} onMove={onMove} onRemove={onRemove} removeLabel={`Удалить шаг ${index + 1}`}>
      <span className="flex size-8 shrink-0 items-center justify-center self-start rounded-full border-2 border-fg-3/60 text-callout font-semibold text-fg tabular-nums mt-1.5">{index + 1}</span>
      <textarea
        ref={ref}
        rows={1}
        value={value}
        aria-label={`Шаг ${index + 1}`}
        placeholder="Что сделать"
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0 flex-1 resize-none bg-transparent px-2 py-2.5 text-body text-fg outline-none placeholder:text-fg-3"
      />
    </RowShell>
  );
}

/** Цвета обложки: кружки 32 (тач-зона 44) в одну строку на 390, выбранный — обводка fg */
export function ColorDots({ items, value, onChange }: { items: { id: string; cover: Cover }[]; value: Cover; onChange: (c: Cover) => void }) {
  return (
    <div role="radiogroup" aria-label="Цвет обложки" className="flex flex-wrap gap-3.5">
      {items.map(({ id, cover }) => {
        const on = cover.from === value.from && cover.to === value.to;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={`Цвет ${id}`}
            onClick={() => onChange(cover)}
            className={cn('cover-gradient hit-44 size-8 rounded-full outline-2 outline-offset-2', on ? 'outline-fg' : 'outline-transparent')}
            style={{ '--cover-from': cover.from, '--cover-to': cover.to } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
}

/** Живая крепость: «≈ 26% · Крепкий» — слово цветом шкалы; не из чего считать — подсказка (hint) */
export function AbvLine({ abv, strength, hint = 'посчитаем по составу' }: { abv?: number; strength?: Strength; hint?: string }) {
  return (
    <p className="flex min-h-tap items-center gap-2 text-subhead text-fg-2" aria-live="polite">
      Крепость
      {abv === undefined || !strength ? (
        <span className="text-fg-3">{hint}</span>
      ) : (
        <span>
          <span className="text-fg tabular-nums">≈ {abv}%</span> · <span className={cn('font-semibold', STRENGTH_TONE[strength])}>{strengthLabel(strength)}</span>
        </span>
      )}
    </p>
  );
}
