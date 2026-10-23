import { cn } from '../../lib/cn';

/** Шаги крупно [Apple News]: «ШАГ N» капсом + текст title-3, воздух 24, без карточек */
export function Steps({ steps, className }: { steps: string[]; className?: string }) {
  return (
    <ol className={cn('flex flex-col gap-6 px-4', className)}>
      {steps.map((step, i) => (
        <li key={i}>
          <p className="text-caption font-semibold tracking-caps text-fg-2 uppercase" aria-hidden>
            Шаг {i + 1}
          </p>
          <p className="mt-2 text-title-3 font-normal! text-fg">{step}</p>
        </li>
      ))}
    </ol>
  );
}
