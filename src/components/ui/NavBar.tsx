import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { cn } from '../../lib/cn';
import { IconButton } from './Button';

type Props = {
  title: string;
  onBack: () => void;
  /** подложка и название — когда крупный заголовок страницы ушёл под верх экрана */
  visible: boolean;
  /** для витрины: рисовать в потоке, а не fixed */
  inline?: boolean;
  /** действие справа, симметрично «Назад» (IconButton / FavoriteButton size xl) */
  action?: ReactNode;
  /** cover — кнопки стеклом поверх обложки (рецепт); plain — плотнее, на чёрном фоне (страницы бара) */
  tone?: 'cover' | 'plain';
};

/**
 * Навбар: кнопки «Назад» и действие **закреплены всегда** (56, доступны с первого пикселя скролла);
 * подложка `nav-fade` (размытие, сквозь которое виден градиент, с плавным затуханием книзу) и название
 * проявляются, когда крупный заголовок страницы ушёл вверх.
 */
export function NavBar({ title, onBack, visible, inline, action, tone = 'cover' }: Props) {
  // подложка — отдельный fixed-слой, а не ребёнок fixed-контейнера: иначе контейнер становится «корнем»
  // для backdrop-filter, и размывать под ним нечего (Chromium)
  const fade = (
    <div
      aria-hidden
      className={cn(
        'nav-fade pointer-events-none z-20 transition-opacity duration-200 motion-reduce:transition-none',
        inline ? 'absolute inset-x-0 top-0 h-24' : 'h-nav-fade fixed inset-x-0 top-0 mx-auto max-w-app',
        visible ? 'opacity-100' : 'opacity-0',
      )}
    />
  );
  return (
    <>
      {fade}
      <div className={cn('z-20', inline ? 'relative pt-2' : 'pointer-events-none fixed inset-x-0 top-0 mx-auto max-w-app pt-safe-stuck')}>
        <div className="relative flex h-nav-btn items-center gap-3 px-4">
          <IconButton
            icon={ChevronLeft}
            label="Назад"
            size="xl"
            variant={tone === 'cover' ? 'glass' : 'tonal'}
            className={cn('pointer-events-auto', tone === 'plain' && 'bg-tile-strong!')}
            onClick={onBack}
          />
          <p
            aria-hidden={!visible || undefined}
            className={cn(
              'min-w-0 flex-1 truncate text-center text-headline text-fg transition-opacity duration-200 motion-reduce:transition-none',
              visible ? 'opacity-100' : 'opacity-0',
            )}
          >
            {title}
          </p>
          {action ? <div className="pointer-events-auto">{action}</div> : <span className="size-nav-btn" aria-hidden />}
        </div>
      </div>
    </>
  );
}
