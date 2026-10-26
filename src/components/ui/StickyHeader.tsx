import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

/**
 * Липкая шапка: пока не прилипла — фон экрана; прилипла — стекло (без линии, язык v2).
 * Large title над ней уезжает при скролле, поиск и фильтры остаются под рукой.
 * forceStuck — для витрины.
 */
export function StickyHeader({ children, forceStuck, className }: { children: ReactNode; forceStuck?: boolean; className?: string }) {
  const sentinel = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || forceStuck !== undefined) return;
    const io = new IntersectionObserver(([e]) => setStuck(!e?.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [forceStuck]);

  const isStuck = forceStuck ?? stuck;
  return (
    <>
      <div ref={sentinel} aria-hidden />
      <div
        data-stuck={isStuck || undefined}
        className={cn(
          'top-0 z-20 transition-colors',
          forceStuck === undefined && 'sticky',
          // язык v2: прилипла — стекло без линии снизу
          isStuck ? 'sticky-glass pt-safe-stuck' : 'bg-bg',
          className,
        )}
      >
        {children}
      </div>
    </>
  );
}
