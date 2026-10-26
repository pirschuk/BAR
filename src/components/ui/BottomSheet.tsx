import { useEffect, useId, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { IconButton } from './Button';

export type Detent = 'medium' | 'large';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** шаг внутри шторки: шеврон «Назад» слева от заголовка */
  onBack?: () => void;
  children: ReactNode;
  /** липкий футер (кнопки) */
  footer?: ReactNode;
  initialDetent?: Detent;
  /** для витрины: рисовать внутри страницы, без портала, скрима и блокировки скролла */
  inline?: boolean;
};

const CLOSE_DRAG = 90;
const EXPAND_DRAG = -60;

/**
 * Нижняя шторка: хэндл 36×5, радиус 28 сверху, детенты medium/large,
 * свайп за хэндл/шапку вниз — закрыть (или large → medium), вверх — large;
 * тап по скриму и Esc закрывают. Футер липкий, с safe-area. [Fresha, Viator]
 */
export function BottomSheet({ open, onClose, title, onBack, children, footer, initialDetent = 'medium', inline }: Props) {
  const [detent, setDetent] = useState<Detent>(initialDetent);
  const [drag, setDrag] = useState(0);
  const start = useRef<number | null>(null);
  const titleId = useId();
  const dialog = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (open) setDetent(initialDetent);
  }, [open, initialDetent]);

  useEffect(() => {
    if (!open || inline) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const prev = document.body.style.overflow;
    const opener = document.activeElement as HTMLElement | null;
    const root = document.getElementById('root');
    document.body.style.overflow = 'hidden';
    // фон недоступен для Tab и скринридера, пока открыта шторка (aria-modal сам этого не делает)
    root?.setAttribute('inert', '');
    dialog.current?.focus();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      root?.removeAttribute('inert');
      window.removeEventListener('keydown', onKey);
      opener?.focus({ preventScroll: true });
    };
  }, [open, inline, onClose]);

  if (!open) return null;

  const onDown = (e: PointerEvent) => {
    // кнопки в шапке (✕) — не жест: иначе pointer capture уводит click с кнопки на шапку
    if ((e.target as HTMLElement).closest('button')) return;
    start.current = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    if (start.current !== null) setDrag(e.clientY - start.current);
  };
  const onUp = () => {
    if (start.current === null) return;
    if (drag > CLOSE_DRAG) {
      if (detent === 'large' && initialDetent === 'medium') setDetent('medium');
      else onClose();
    } else if (drag < EXPAND_DRAG) setDetent('large');
    start.current = null;
    setDrag(0);
  };

  const sheet = (
    <div
      ref={dialog}
      tabIndex={-1}
      role="dialog"
      aria-modal={inline ? undefined : true}
      aria-labelledby={titleId}
      className={cn(
        'flex w-full flex-col overflow-hidden rounded-t-sheet bg-surface text-fg outline-none',
        inline ? 'relative max-h-sheet-medium' : 'animate-sheet-in pointer-events-auto mx-auto max-w-app',
        !inline && (detent === 'large' ? 'h-sheet-large' : 'max-h-sheet-medium'),
      )}
      style={drag ? { transform: `translateY(${Math.max(drag, -40)}px)`, transition: 'none' } : undefined}
    >
      <div
        className="shrink-0 cursor-grab touch-none select-none"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <div className="flex justify-center pt-2 pb-1" aria-hidden>
          <span className="h-[5px] w-9 rounded-full bg-fg-3/40" />
        </div>
        <div className={cn('flex items-center justify-between gap-3 border-b px-4 pb-3', scrolled ? 'border-border' : 'border-transparent')}>
          <div className="flex min-w-0 items-center gap-3">
            {onBack && <IconButton icon={ChevronLeft} label="Назад" onClick={onBack} />}
            <h2 id={titleId} className="truncate text-title-2 text-fg">
              {title}
            </h2>
          </div>
          <IconButton icon={X} label="Закрыть" onClick={onClose} />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-x-clip overflow-y-auto overscroll-contain pb-4" onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 0)}>
        {children}
      </div>
      {footer && <div className="pb-safe-sm shrink-0 border-t border-border px-4 pt-3">{footer}</div>}
    </div>
  );

  if (inline) return sheet;

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button type="button" aria-hidden tabIndex={-1} onClick={onClose} className="animate-fade-in absolute inset-0 bg-scrim" />
      <div className="pointer-events-none relative">{sheet}</div>
    </div>,
    document.body,
  );
}

/** Секция внутри шторки: заголовок headline + содержимое; разделитель и 24 между секциями [Fresha] */
export function SheetSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-border py-5 last:border-b-0">
      <h3 className="mb-3 px-4 text-headline text-fg">{title}</h3>
      {children}
    </section>
  );
}

/**
 * Футер шторки: нейтральное текстовое «Сбросить» + primary-пилюля L «Показать N» на остаток ширины
 * [Viator, Insight Timer]. Две равные пилюли не берём: «Показать 13 коктейлей» не помещается в половину.
 */
export function SheetFooter({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 [&>:last-child]:w-full">{children}</div>;
}
