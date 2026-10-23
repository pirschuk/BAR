import { useEffect, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router';
import { cn } from '../../lib/cn';

type Props = {
  icon: LucideIcon;
  text: string;
  /** текстовое действие справа: «Открыть» */
  action?: ReactNode;
  /** закрыть через 3 с; не задано — тост висит (витрина) */
  onDone?: () => void;
  /** для витрины: рисовать в потоке, а не fixed */
  inline?: boolean;
};

/**
 * Тост [Swiggy, Doji]: тёмная стеклянная пилюля внизу над safe-area, иконка + текст + текстовое действие.
 * Живёт 3 с, читается скринридером (aria-live). Без таймера — для витрины.
 */
export function Toast({ icon: Icon, text, action, onDone, inline }: Props) {
  useEffect(() => {
    if (!onDone) return;
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div
      className={cn(
        inline ? 'px-4' : 'pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto max-w-app px-4 pb-safe-sm',
      )}
      role="status"
      aria-live="polite"
    >
      <div className="pointer-events-auto glass flex h-btn-l items-center gap-3 rounded-full pr-2 pl-4 text-subhead text-on-media motion-safe:animate-toast-in">
        <Icon className="size-5 shrink-0 fill-current text-on-media-accent" aria-hidden />
        <span className="min-w-0 flex-1 truncate">{text}</span>
        {action}
      </div>
    </div>
  );
}

/** Действие тоста — ссылка-текст акцентом, тач-зона 44 */
export function ToastAction({ to, children, onClick }: { to: string; children: ReactNode; onClick?: () => void }) {
  return (
    <Link to={to} onClick={onClick} className="pressable inline-flex h-tap shrink-0 items-center rounded-full px-3 text-subhead font-semibold text-on-media-accent">
      {children}
    </Link>
  );
}
