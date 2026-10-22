import type { ButtonHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'l' | 'm';

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-fg',
  secondary: 'bg-surface-2 text-fg',
  ghost: 'bg-transparent text-accent',
};

const SIZE: Record<ButtonSize, string> = {
  // L — CTA, pill; M — действия, радиус 12
  l: 'h-btn-l rounded-full px-6',
  m: 'h-tap rounded-control px-4',
};

/** Классы кнопки — для <Link>, который должен выглядеть как Button */
export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'l', className?: string) {
  return cn(
    'pressable-scale inline-flex items-center justify-center gap-2 text-headline select-none',
    'disabled:pointer-events-none disabled:opacity-40 aria-disabled:pointer-events-none aria-disabled:opacity-40',
    VARIANT[variant],
    SIZE[size],
    className,
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  pressed?: boolean;
};

export function Button({ variant, size, icon: Icon, pressed, className, children, type = 'button', ...rest }: ButtonProps) {
  return (
    <button type={type} data-pressed={pressed || undefined} className={buttonClass(variant, size, className)} {...rest}>
      {Icon && <Icon className="size-5" aria-hidden />}
      {children}
    </button>
  );
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: LucideIcon;
  label: string;
  /** tonal — на фоне экрана, glass — поверх обложки */
  variant?: 'tonal' | 'glass';
  pressed?: boolean;
};

/** Круглая кнопка-иконка: визуально 36, тач-зона 44 */
export function IconButton({ icon: Icon, label, variant = 'tonal', pressed, className, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      data-pressed={pressed || undefined}
      className={cn(
        'pressable-scale hit-44 inline-flex size-glass-btn shrink-0 items-center justify-center rounded-full',
        'disabled:pointer-events-none disabled:opacity-40',
        variant === 'glass' ? 'glass text-on-media' : 'bg-surface-2 text-fg',
        className,
      )}
      {...rest}
    >
      <Icon className="size-5" aria-hidden />
    </button>
  );
}
