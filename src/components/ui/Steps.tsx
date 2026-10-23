import { cn } from '../../lib/cn';

/**
 * Шаги таймлайном [Superpower, Julienne]: номер в круге 28 слева, вертикальная линия к следующему номеру
 * (у последнего — нет), текст title-3 400 справа; без подложек.
 */
export function Steps({ steps, className }: { steps: string[]; className?: string }) {
  return (
    <ol className={cn('px-4', className)}>
      {steps.map((step, i) => (
        <li key={i} className="relative flex gap-3 pb-6 last:pb-0">
          {i < steps.length - 1 && <span className="absolute top-8 bottom-1 left-3.25 w-0.5 rounded-full bg-fg-3/50" aria-hidden />}
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-fg-3/60 text-footnote font-semibold text-fg tabular-nums">
            {i + 1}
          </span>
          <p className="min-w-0 pt-px text-title-3 font-normal! text-fg">{step}</p>
        </li>
      ))}
    </ol>
  );
}
