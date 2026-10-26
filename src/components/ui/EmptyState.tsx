import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

type Props = {
  title: string;
  /** одна строка: что сделать [GitHub, Careem] */
  hint: string;
  /** одно действие — обычно Button secondary M */
  action?: ReactNode;
  className?: string;
};

/** Пустое состояние: иконка в круге 96, заголовок title-2, одна подсказка, одно действие */
export function EmptyState({ title, hint, action, className }: Props) {
  return (
    <div className={cn('flex flex-col items-center px-8 py-10 text-center', className)}>
      <h2 className="text-title-2 text-fg">{title}</h2>
      <p className="mt-1.5 text-subhead text-fg-2">{hint}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
