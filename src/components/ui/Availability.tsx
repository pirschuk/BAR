import { ChevronRight, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '../../lib/cn';

type AvailabilityProps = { state: 'empty-bar' } | { state: 'all' } | { state: 'missing'; names: string[] };

/**
 * Наличие в рецепте — информер, а не блок [IKEA]: точка 8 + текст, без подложки, рамки и кнопки.
 * Отмечать, что есть дома, — в «Моём баре»; бар пуст — строка-ссылка туда.
 */
export function AvailabilityLine(props: AvailabilityProps) {
  const dot = (cls: string) => <span className={cn('size-2 shrink-0 self-center rounded-full', cls)} aria-hidden />;
  if (props.state === 'empty-bar')
    return (
      <Link to="/bar" viewTransition className="pressable -mx-2 flex min-h-tap items-center gap-2 rounded-control px-2 text-subhead text-fg-2">
        {dot('bg-fg-3')}
        <span className="min-w-0">Отметьте, что есть дома</span>
        <ChevronRight className="-ml-1 size-4 shrink-0 text-fg-3" aria-hidden />
      </Link>
    );
  return (
    <p role="status" className="flex min-h-tap items-center gap-2 py-2 text-subhead text-fg">
      {props.state === 'all' ? (
        <>
          {dot('bg-success')}
          Всё есть дома
        </>
      ) : (
        <>
          {dot('bg-accent')}
          <span className="min-w-0">
            Нет дома: <span className="text-fg-2">{props.names.join(', ')}</span>
          </span>
        </>
      )}
    </p>
  );
}

/** Нейтральная подсказка: иконка 16 + текст subhead на surface-2 (инструменты, хранилище) */
export function InfoNote({ icon: Icon, children, className, tile }: { icon: LucideIcon; children: ReactNode; className?: string; tile?: boolean }) {
  return (
    <p className={cn('flex items-start px-4 py-3 text-subhead text-fg-2', tile ? 'gap-3 rounded-row bg-tile' : 'gap-2 rounded-control bg-surface-2', className)}>
      <Icon className={cn('shrink-0', tile ? 'size-5' : 'mt-0.5 size-4')} aria-hidden />
      <span>{children}</span>
    </p>
  );
}

/** Информер-подсказка без подложки: иконка 16 + subhead fg-2 (пустой ряд «Избранное») */
export function HintLine({ icon: Icon, children, className }: { icon: LucideIcon; children: ReactNode; className?: string }) {
  return (
    <p className={cn('flex min-h-tap items-start gap-2 py-3 text-left text-subhead text-fg-2', className)}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span className="min-w-0">{children}</span>
    </p>
  );
}
