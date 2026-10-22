import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

export type Stat = { icon: LucideIcon; label: string; value: ReactNode };

/** 4 параметра рецепта: иконка, подпись, значение; волосяные линии сверху и снизу */
export function StatGrid({ items, className }: { items: Stat[]; className?: string }) {
  return (
    <dl className={cn('grid grid-cols-4 gap-2 border-y border-border py-4', className)}>
      {items.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex min-w-0 flex-col gap-1">
          <Icon className="size-5 text-fg-2" aria-hidden />
          <dt className="text-footnote text-fg-3">{label}</dt>
          <dd className="truncate text-headline text-fg">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

const STRENGTH_NAME = ['безалкогольный', 'лёгкий', 'средний', 'крепкий', 'очень крепкий'];

/** Крепость: 4 деления + «~24%» */
export function StrengthMeter({ level, abv }: { level: 0 | 1 | 2 | 3 | 4; abv: number }) {
  return (
    <span className="flex flex-col gap-1.5" aria-label={`${STRENGTH_NAME[level]}, около ${abv}%`}>
      <span aria-hidden>~{abv}%</span>
      <span className="flex gap-1" aria-hidden>
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={cn('h-1.5 flex-1 rounded-full', i <= level ? 'bg-accent' : 'bg-fg-3/30')} />
        ))}
      </span>
    </span>
  );
}
