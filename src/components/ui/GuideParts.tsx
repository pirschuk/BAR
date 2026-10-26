import type { ReactNode } from 'react';
import { Link } from 'react-router';
import {
  ArrowRightLeft,
  ArrowUpToLine,
  CircleDot,
  Citrus,
  Droplet,
  Egg,
  GlassWater,
  Layers,
  Leaf,
  RotateCw,
  Tornado,
  Vibrate,
  Waves,
  type LucideIcon,
} from 'lucide-react';
import type { Glass } from '../../types/cocktail';
import type { Term, TermKind } from '../../lib/glossary';
import { cn } from '../../lib/cn';
import { GlassIllustration } from './GlassIllustration';
import { ToolIllustration } from './ToolIllustration';

// --- «Барная азбука»: иллюстрация статьи, плитка темы, плитка бокала, строка статьи ---

/** Методы и меры — иконки: силуэта у действия нет */
const ICONS: Record<string, LucideIcon> = {
  'method:build': GlassWater,
  'method:stir': RotateCw,
  'method:shake': Vibrate,
  'method:dry-shake': Egg,
  'method:muddle': Leaf,
  'method:blend': Tornado,
  'method:layer': Layers,
  'method:throw': ArrowRightLeft,
  'measure:measure-dash': Droplet,
  'measure:measure-top': ArrowUpToLine,
  'measure:measure-zest': Citrus,
  'measure:measure-twist': Waves,
  'measure:measure-rim': CircleDot,
};

/**
 * Картинка статьи: бокал — GlassIllustration, инструмент и лёд — ToolIllustration (тот же линейный стиль),
 * метод и мера — иконка Lucide на круге tile-strong. size: m — в строке (56), l — в шторке (120).
 */
export function TermArt({ term, size = 'm', className }: { term: Pick<Term, 'kind' | 'id'>; size?: 'm' | 'l'; className?: string }) {
  const box = size === 'l' ? 'size-30' : 'size-14';
  if (term.kind === 'glass') return <GlassIllustration shape={term.id as Glass} className={cn(box, className)} />;
  const art = term.kind === 'ice' ? `ice-${term.id}` : term.id === 'measure-barspoon' ? 'tool-barspoon' : term.id;
  if (term.kind === 'tool' || term.kind === 'ice' || art === 'tool-barspoon') return <ToolIllustration id={art} className={cn(box, className)} />;
  const Icon = ICONS[`${term.kind}:${term.id}`] ?? Droplet;
  // круг иконки — легче силуэта: в шторке 96, не 120
  return (
    <span className={cn('flex shrink-0 items-center justify-center rounded-full bg-tile-strong text-fg', size === 'l' ? 'size-24' : box, className)} aria-hidden>
      <Icon className={size === 'l' ? 'size-10' : 'size-6'} strokeWidth={1.75} />
    </span>
  );
}

/** Картинка темы в ленте «Моего бара» — представитель раздела */
const TOPIC_ART: Record<TermKind, Pick<Term, 'kind' | 'id'>> = {
  glass: { kind: 'glass', id: 'coupe' },
  tool: { kind: 'tool', id: 'tool-shaker' },
  method: { kind: 'method', id: 'stir' },
  ice: { kind: 'ice', id: 'big-cube' },
  measure: { kind: 'measure', id: 'measure-dash' },
};

/** Плитка темы в ленте «Барная азбука» (CardRail, 160): картинка, название, число статей; ведёт к разделу */
export function GuideTile({ topic, label, count, to, pressed }: { topic: TermKind; label: string; count: number; to: string; pressed?: boolean }) {
  return (
    <Link to={to} viewTransition data-pressed={pressed || undefined} className="pressable-scale flex h-40 flex-col justify-between rounded-tile bg-tile p-4">
      <TermArt term={TOPIC_ART[topic]} />
      <span>
        <span className="block text-headline text-fg">{label}</span>
        <span className="block text-footnote text-fg-2 tabular-nums">{count}</span>
      </span>
    </Link>
  );
}

/** Плитка бокала в сетке азбуки: силуэт, название, объём */
export function GlassGuideTile({ term, ml, onClick, pressed }: { term: Term; ml?: number; onClick: () => void; pressed?: boolean }) {
  return (
    <button type="button" onClick={onClick} data-pressed={pressed || undefined} className="pressable-scale flex w-full flex-col items-center rounded-tile bg-tile px-3 pt-4 pb-3 text-center">
      <GlassIllustration shape={term.id as Glass} className="h-24 w-20" />
      <span className="mt-2 text-headline text-fg">{term.name}</span>
      {ml && <span className="text-footnote text-fg-2 tabular-nums">{ml} мл</span>}
    </button>
  );
}

/** Строка статьи [Noom]: название и «для чего» одной-двумя строками слева, картинка справа; «· есть дома» — зелёным */
export function GuideRow({ term, onClick, owned, pressed, meta }: { term: Term; onClick: () => void; owned?: boolean; pressed?: boolean; meta?: ReactNode }) {
  return (
    <button type="button" onClick={onClick} data-pressed={pressed || undefined} className="pressable flex min-h-row-l w-full items-center gap-3 rounded-row bg-tile py-3 pr-3 pl-4 text-left">
      <span className="min-w-0 flex-1">
        <span className="block text-headline text-fg">
          {term.name}
          {owned && <span className="text-subhead font-normal text-success"> · есть дома</span>}
          {meta}
        </span>
        <span className="mt-0.5 line-clamp-2 block text-footnote text-fg-2">{term.what}</span>
      </span>
      <TermArt term={term} />
    </button>
  );
}
