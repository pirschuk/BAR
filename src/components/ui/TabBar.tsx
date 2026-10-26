import { useState } from 'react';
import { NavLink } from 'react-router';
import { Dices, LayoutGrid, Wine, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

type Tab = { to: string; label: string; icon: LucideIcon };

type Props = {
  tabs?: Tab[];
  /** центральное действие — «Мне повезёт» [CREME] */
  onLucky?: () => void;
  luckyDisabled?: boolean;
  /** для витрины: рисовать в потоке, а не fixed */
  inline?: boolean;
  /** для витрины: подсветить таб как нажатый */
  pressedTo?: string;
  /** для витрины: какой таб показать активным */
  activeTo?: string;
};

export const TABS: Tab[] = [
  { to: '/', label: 'Каталог', icon: LayoutGrid },
  { to: '/bar', label: 'Мой бар', icon: Wine },
];

/**
 * Плавающая стеклянная пилюля: отступ 16 от краёв и снизу (над safe-area), высота 64,
 * активный таб — подложка surface-2; по центру — круглая кнопка 48 «Мне повезёт» (tile-strong, не белая) [GitHub, Crouton, CREME]
 */
export function TabBar({ tabs = TABS, onLucky, luckyDisabled, inline, pressedTo, activeTo }: Props) {
  const [left, right] = [tabs.slice(0, 1), tabs.slice(1)];
  const [roll, setRoll] = useState(0);
  const item = (t: Tab) => (
    <NavLink
      key={t.to}
      to={t.to}
      end
      data-pressed={pressedTo === t.to || undefined}
      className={({ isActive }) =>
        cn(
          'pressable flex h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-caption',
          (activeTo ? activeTo === t.to : isActive) ? 'bg-surface-2 text-fg' : 'text-fg-2',
        )
      }
    >
      <t.icon className="size-6" strokeWidth={1.75} aria-hidden />
      {t.label}
    </NavLink>
  );
  return (
    <div className={cn(inline ? 'px-4' : 'pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto max-w-app px-4 pb-tabbar-gap')}>
      <nav
        aria-label="Разделы"
        className="tabbar-glass pointer-events-auto flex h-16 items-center gap-2 rounded-full border border-border px-2"
      >
        {left.map(item)}
        <button
          type="button"
          onClick={() => {
            setRoll((r) => r + 1);
            onLucky?.();
          }}
          disabled={luckyDisabled}
          aria-label="Мне повезёт"
          title={luckyDisabled ? 'Скоро' : 'Мне повезёт'}
          // действие, а не раздел: спокойный круг на стекле, без заливки — не путается с выбранным табом
          className="pressable-scale hit-44 flex size-12 shrink-0 items-center justify-center rounded-full bg-tile-strong text-fg disabled:opacity-40"
        >
          {/* «бросок»: кубик делает оборот на каждый тап */}
          <Dices key={roll} className={cn('size-6', roll > 0 && 'motion-safe:animate-roll')} aria-hidden />
        </button>
        {right.map(item)}
      </nav>
    </div>
  );
}
