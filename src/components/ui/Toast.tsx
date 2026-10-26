import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motionMs } from './BottomSheet';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router';
import { cn } from '../../lib/cn';

type Props = {
  icon: LucideIcon;
  text: string;
  /** иконка залита акцентом (♥); false — контуром (корзина, галочка) */
  filled?: boolean;
  /** текстовое действие справа: «Открыть» */
  action?: ReactNode;
  /** закрыть через 3 с; не задано — тост висит (витрина) */
  onDone?: () => void;
  /** для витрины: рисовать в потоке, а не fixed */
  inline?: boolean;
  /** на экране с таб-баром — над ним */
  aboveTabBar?: boolean;
};

/**
 * Тост [Swiggy, Doji]: непрозрачная пилюля surface-2 с тенью внизу над safe-area — читается поверх любого контента; иконка + текст + текстовое действие.
 * Живёт 3 с, читается скринридером (aria-live). Без таймера — для витрины.
 */
export function Toast({ icon: Icon, text, action, onDone, inline, filled = true, aboveTabBar }: Props) {
  // таймер не перезапускается от перерисовок родителя (onDone — новая функция на каждый рендер)
  const done = useRef(onDone);
  done.current = onDone;
  const timed = !!onDone;
  // через 3 с — уходит вниз (--dur-toast-out), потом onDone
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    if (!timed) return;
    const out = motionMs('--dur-toast-out', 160);
    const t1 = setTimeout(() => setLeaving(true), 3000 - out);
    const t2 = setTimeout(() => done.current?.(), 3000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [timed]);
  return (
    <div
      className={cn(
        inline ? 'px-4' : 'pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto max-w-app px-4',
        !inline && (aboveTabBar ? 'pb-tabbar' : 'pb-safe-sm'),
      )}
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          'pointer-events-auto toast-surface flex h-btn-l items-center gap-3 rounded-full pr-2 pl-4 text-subhead text-fg',
          leaving ? 'animate-toast-out' : 'motion-safe:animate-toast-in',
        )}
      >
        <Icon className={cn('size-5 shrink-0', filled ? 'fill-current text-accent' : 'text-fg-2')} aria-hidden />
        <span className="min-w-0 flex-1 truncate">{text}</span>
        {action}
      </div>
    </div>
  );
}

const ACTION = 'pressable inline-flex h-tap shrink-0 items-center rounded-full px-3 text-subhead font-semibold text-accent';

/** Действие тоста — текст акцентом, тач-зона 44: `to` — переход («Открыть»), иначе кнопка («Вернуть») */
export function ToastAction({ to, children, onClick }: { to?: string; children: ReactNode; onClick?: () => void }) {
  return to ? (
    <Link to={to} viewTransition onClick={onClick} className={ACTION}>
      {children}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={ACTION}>
      {children}
    </button>
  );
}
