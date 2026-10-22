import type { ReactNode } from 'react';
import { ArrowUpLeft, Clock, Search, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

/** Подсветка совпадения запроса в тексте (регистр и ё/е не важны) */
export function Highlight({ text, query }: { text: string; query: string }) {
  const norm = (s: string) => s.toLowerCase().replace(/ё/g, 'е');
  const i = query ? norm(text).indexOf(norm(query.trim())) : -1;
  if (i < 0) return <>{text}</>;
  const end = i + query.trim().length;
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-transparent font-semibold text-fg">{text.slice(i, end)}</mark>
      {text.slice(end)}
    </>
  );
}

type RowProps = {
  icon?: LucideIcon;
  /** вместо иконки — миниатюра (например, обложка коктейля) */
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  onClick?: () => void;
  pressed?: boolean;
  /** стрелка «подставить в поле» справа */
  trailingFill?: boolean;
};

/** Строка поиска: недавнее (часы) или подсказка (лупа / миниатюра). Высота ≥ 48 [Uber Eats, CREME] */
export function SearchRow({ icon: Icon = Search, leading, title, subtitle, onClick, pressed, trailingFill }: RowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-pressed={pressed || undefined}
      className="pressable flex min-h-row w-full items-center gap-3 px-4 py-1.5 text-left"
    >
      <span className="flex size-8 shrink-0 items-center justify-center text-fg-2">{leading ?? <Icon className="size-5" aria-hidden />}</span>
      <span className={cn('min-w-0 flex-1 border-b border-border py-2')}>
        <span className="block truncate text-body text-fg">{title}</span>
        {subtitle && <span className="block truncate text-footnote text-fg-3">{subtitle}</span>}
      </span>
      {trailingFill && <ArrowUpLeft className="size-5 shrink-0 text-fg-3" aria-hidden />}
    </button>
  );
}

export function RecentRow(props: Omit<RowProps, 'icon' | 'leading'>) {
  return <SearchRow icon={Clock} trailingFill {...props} />;
}

/** Заголовок блока внутри поиска: «Недавние» + действие справа */
export function SearchSectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex min-h-tap items-center justify-between px-4">
      <h3 className="text-footnote font-semibold text-fg-2 uppercase">{title}</h3>
      {action}
    </div>
  );
}
