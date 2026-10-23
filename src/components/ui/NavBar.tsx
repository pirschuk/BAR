import { ChevronLeft } from 'lucide-react';
import { cn } from '../../lib/cn';
import { IconButton } from './Button';

type Props = {
  title: string;
  onBack: () => void;
  /** показан — когда название на обложке ушло под верх экрана */
  visible: boolean;
  /** для витрины: рисовать в потоке, а не fixed */
  inline?: boolean;
};

/**
 * Навбар рецепта в стиле iOS: стекло, «Назад» слева, название по центру (headline, в одну строку).
 * Появляется при скролле, когда крупное название обложки уехало вверх; скрытый — не фокусируется.
 */
export function NavBar({ title, onBack, visible, inline }: Props) {
  return (
    <div
      inert={!visible}
      aria-hidden={!visible || undefined}
      className={cn(
        'sticky-glass z-20 border-b border-border transition-[opacity,translate] duration-200 motion-reduce:transition-none',
        inline ? 'relative pt-2' : 'fixed inset-x-0 top-0 mx-auto max-w-app pt-safe-stuck',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0',
      )}
    >
      <div className="relative flex h-tap items-center px-4 pb-1">
        <IconButton icon={ChevronLeft} label="Назад" onClick={onBack} />
        {/* центр по ширине экрана: поля под кнопку с обеих сторон */}
        <p className="pointer-events-none absolute inset-x-16 truncate text-center text-headline text-fg">{title}</p>
      </div>
    </div>
  );
}
