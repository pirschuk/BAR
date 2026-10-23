import type { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** подсказка под полем */
  hint?: string;
};

/** Поле ввода: подпись footnote над пилюлей bg-tile h 44 (язык v2 — как SearchBar) */
export function TextField({ label, value, onChange, hint, className, id, ...rest }: Props) {
  const inputId = id ?? `f-${label}`;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={inputId} className="px-1 text-footnote text-fg-2">
        {label}
      </label>
      <input
        id={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        className="h-tap rounded-full bg-tile px-4 text-body text-fg outline-none placeholder:text-fg-3 focus:outline-1 focus:outline-fg-3"
        {...rest}
      />
      {hint && <p className="px-1 text-footnote text-fg-3">{hint}</p>}
    </div>
  );
}
