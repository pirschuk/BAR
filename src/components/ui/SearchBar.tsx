import { forwardRef, type InputHTMLAttributes } from 'react';
import { Search, XCircle } from 'lucide-react';
import { cn } from '../../lib/cn';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & {
  value: string;
  onChange: (value: string) => void;
  /** показывать «Отмена» справа (поле в фокусе / режим поиска) [iOS, CREME] */
  showCancel?: boolean;
  onCancel?: () => void;
};

/** Поиск: 44, радиус 12, фон surface-2, лупа 18, ⓧ при вводе, «Отмена» в режиме поиска */
export const SearchBar = forwardRef<HTMLInputElement, Props>(function SearchBar(
  { value, onChange, showCancel, onCancel, className, placeholder = 'Поиск', disabled, ...rest },
  ref,
) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <label
        className={cn(
          'flex h-field min-w-0 flex-1 items-center gap-3 rounded-full bg-tile pl-5 text-fg-2',
          'focus-within:outline-1 focus-within:outline-fg-3',
          disabled && 'opacity-40',
        )}
      >
        <Search className="size-5 shrink-0" aria-hidden />
        <input
          ref={ref}
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="h-full min-w-0 flex-1 bg-transparent text-ellipsis text-body text-fg outline-none placeholder:text-fg-3 [&::-webkit-search-cancel-button]:hidden"
          {...rest}
        />
        {value && (
          <button
            type="button"
            aria-label="Очистить"
            onClick={() => onChange('')}
            className="flex h-full w-field shrink-0 items-center justify-center text-fg-3"
          >
            <XCircle className="size-5" aria-hidden />
          </button>
        )}
        {!value && <span className="w-3" aria-hidden />}
      </label>
      {showCancel && (
        <button type="button" onClick={onCancel} className="pressable h-field shrink-0 text-body text-fg">
          Отмена
        </button>
      )}
    </div>
  );
});
