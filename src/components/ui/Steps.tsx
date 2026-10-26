import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

/**
 * Шаги таймлайном [Superpower, Julienne]: номер в круге 32 слева, вертикальная линия к следующему номеру
 * (у последнего — нет), текст body справа; между шагами 32; без подложек. Шаг — текст или текст с иконкой (установка).
 */
export function Steps({ steps, className }: { steps: ReactNode[]; className?: string }) {
  return (
    <ol className={cn('px-4', className)}>
      {steps.map((step, i) => (
        <li key={i} className="relative flex gap-3 pb-8 last:pb-0">
          {i < steps.length - 1 && <span className="absolute top-9 bottom-1 left-3.75 w-0.5 rounded-full bg-fg-3/50" aria-hidden />}
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-fg-3/60 text-callout font-semibold text-fg tabular-nums">
            {i + 1}
          </span>
          <div className="min-w-0 pt-1.25 text-body text-fg">{step}</div>
        </li>
      ))}
    </ol>
  );
}
