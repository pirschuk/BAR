import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

type Props = {
  /** без иконки — язык v2 (без картинок-заглушек) */
  icon?: LucideIcon;
  title: string;
  /** одна строка: что сделать [GitHub, Careem] */
  hint: string;
  /** одно действие — обычно Button secondary M */
  action?: ReactNode;
  className?: string;
};

/** Пустое состояние: иконка в круге 96, заголовок title-2, одна подсказка, одно действие */
export function EmptyState({ icon: Icon, title, hint, action, className }: Props) {
  return (
    <div className={cn('flex flex-col items-center px-8 py-10 text-center', className)}>
      {Icon && (
        <span className="mb-5 flex size-24 items-center justify-center rounded-full bg-surface-2 text-fg-2">
          <Icon className="size-10" strokeWidth={1.5} aria-hidden />
        </span>
      )}
      <h2 className="text-title-2 text-fg">{title}</h2>
      <p className="mt-1.5 text-subhead text-fg-2">{hint}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
