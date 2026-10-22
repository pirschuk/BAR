import { cn } from '../../lib/cn';

/** Шаги приготовления: номер в круге 28 + текст callout */
export function StepList({ steps, className }: { steps: string[]; className?: string }) {
  return (
    <ol className={cn('flex flex-col gap-4 px-4', className)}>
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-footnote font-semibold text-fg tabular-nums">
            {i + 1}
          </span>
          <span className="pt-1 text-callout text-fg">{step}</span>
        </li>
      ))}
    </ol>
  );
}
