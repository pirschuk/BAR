import { ChevronRight, CircleCheck, CircleDashed, Wine, type LucideIcon } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { Link } from 'react-router';
import { countLabel } from '../../lib/cocktails';
import { cn } from '../../lib/cn';
import { Button, buttonClass } from './Button';

type BannerProps =
  | { state: 'empty-bar' }
  | { state: 'all' }
  | { state: 'missing'; names: string[]; onHave: () => void };

/**
 * Наличие в рецепте: «Всё есть дома» / «Не хватает N: …» + «Это есть» / приглашение заполнить бар.
 * tile — статус над списком ингредиентов на тинте: не плитка-строка, а другой тип блока —
 * «всё есть» с зелёной подложкой, остальное — контур без заливки; кнопка справа.
 */
export function AvailabilityBanner(props: BannerProps & { focusOnMount?: boolean; tile?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  // после «Это есть» кнопка исчезает — фокус переводим на новый баннер, а не теряем на <body>
  useEffect(() => {
    if (props.focusOnMount) ref.current?.focus();
  }, [props.focusOnMount]);
  const t = props.tile;
  const base = cn('flex gap-3 px-4', t ? 'min-h-row-l rounded-row py-2.5' : 'rounded-control bg-surface py-3');
  const outline = t && 'border border-tile-strong';
  if (props.state === 'all')
    return (
      <div ref={ref} tabIndex={-1} className={cn(base, 'items-center outline-none', t && 'bg-success/12')} role="status">
        <CircleCheck className="size-5 shrink-0 text-success" aria-hidden />
        <p className="text-subhead text-fg">Всё есть дома</p>
      </div>
    );
  if (props.state === 'empty-bar')
    return (
      <Link to="/bar" className={cn(base, outline, 'pressable items-center')}>
        <Wine className="size-5 shrink-0 text-fg-2" aria-hidden />
        <p className="min-w-0 flex-1 text-subhead text-fg">Отметьте свой бар — покажем, чего не хватает</p>
        <ChevronRight className="size-4 shrink-0 text-fg-3" aria-hidden />
      </Link>
    );
  const n = props.names.length;
  const text = (
    <p className="text-subhead text-fg">
      Не хватает {n}: <span className="text-fg-2">{props.names.join(', ')}</span>
    </p>
  );
  if (t)
    return (
      <div className={cn(base, outline, 'items-center')} role="status">
        <CircleDashed className="size-5 shrink-0 text-fg-2" aria-hidden />
        <div className="min-w-0 flex-1">{text}</div>
        <Button variant="secondary" size="s" className="bg-tile-strong!" onClick={props.onHave}>
          Это есть
        </Button>
      </div>
    );
  return (
    <div className={cn(base, 'items-start')} role="status">
      <CircleDashed className="mt-px size-5 shrink-0 text-fg-2" aria-hidden />
      {/* две строки: текст на всю ширину, кнопка под ним — название не рвётся */}
      <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
        {text}
        <Button variant="secondary" size="s" onClick={props.onHave}>
          Это есть
        </Button>
      </div>
    </div>
  );
}

/** Итог «Моего бара»: сколько можно приготовить + сколько без одного ингредиента + CTA [Kitchen Stories] */
export function BarSummary({ can, nearly, to }: { can: number; nearly: number; to: string }) {
  return (
    <section className="rounded-card bg-surface p-4" aria-label="Итог бара">
      <p className="text-subhead text-fg-2">Можно приготовить</p>
      <p className="mt-0.5 text-large-title text-fg tabular-nums">{can}</p>
      <p className="mt-1 text-footnote text-fg-2">
        {nearly > 0 ? `ещё ${countLabel(nearly)} — без одного ингредиента` : can > 0 ? 'из того, что есть дома' : 'добавьте 1–2 ингредиента — список появится'}
      </p>
      {can > 0 && (
        <Link to={to} className={buttonClass('primary', 'l', 'mt-4 w-full')}>
          Показать {countLabel(can)}
        </Link>
      )}
    </section>
  );
}

/** Нейтральная подсказка: иконка 16 + текст subhead на surface-2 (инструменты, хранилище) */
export function InfoNote({ icon: Icon, children, className, tile }: { icon: LucideIcon; children: ReactNode; className?: string; tile?: boolean }) {
  return (
    <p className={cn('flex items-start px-4 py-3 text-subhead text-fg-2', tile ? 'gap-3 rounded-row bg-tile' : 'gap-2 rounded-control bg-surface-2', className)}>
      <Icon className={cn('shrink-0', tile ? 'size-5' : 'mt-0.5 size-4')} aria-hidden />
      <span>{children}</span>
    </p>
  );
}
