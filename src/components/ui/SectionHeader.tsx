import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

/** Заголовок секции title-2 + действие/контрол справа */
export function SectionHeader({ title, action, className }: { title: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex min-h-tap items-center justify-between gap-3 px-4', className)}>
      <h2 className="text-title-2 text-fg">{title}</h2>
      {action}
    </div>
  );
}
