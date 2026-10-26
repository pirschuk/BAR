import type { CSSProperties } from 'react';
import { useId } from 'react';
import type { Glass } from '../../types/cocktail';
import { cn } from '../../lib/cn';

/**
 * Силуэт бокала поверх обложки. viewBox 120×160, бокал стоит на y=148.
 * Утверждённый список — 10 бокалов, у каждого свой силуэт; лёд не рисуем,
 * чтобы один бокал всегда выглядел одинаково (лёд — в параметрах рецепта).
 * body — контур чаши (он же маска жидкости), liquidTop — уровень напитка, extra — ножка, дно, ручка.
 */
type GlassGeometry = { body: string; liquidTop: number; extra?: string };

const STEM = 'M40 148 Q60 140 80 148';

const GEOMETRY: Record<Glass, GlassGeometry> = {
  // низкий широкий стакан с толстым дном
  rocks: {
    body: 'M28 80 L32 142 Q32 148 38 148 L82 148 Q88 148 88 142 L92 80 Z',
    liquidTop: 100,
    extra: 'M33 134 L87 134',
  },
  // средний стакан: шире и ниже коллинза
  highball: {
    body: 'M34 46 L37 142 Q37 148 43 148 L77 148 Q83 148 83 142 L86 46 Z',
    liquidTop: 66,
    extra: 'M37 136 L83 136',
  },
  // самый высокий и узкий стакан
  collins: {
    body: 'M45 10 L46 142 Q46 148 52 148 L68 148 Q74 148 74 142 L75 10 Z',
    liquidTop: 30,
    extra: 'M46 138 L74 138',
  },
  // широкая неглубокая чаша на ножке
  coupe: {
    body: 'M22 62 Q24 96 60 98 Q96 96 98 62 Z',
    liquidTop: 70,
    extra: `M60 98 L60 144 ${STEM}`,
  },
  // V-образная чаша на ножке
  martini: {
    body: 'M18 50 L60 100 L102 50 Z',
    liquidTop: 60,
    extra: `M60 100 L60 144 ${STEM}`,
  },
  // узкая высокая чаша на длинной ножке
  flute: {
    body: 'M49 16 Q47 64 54 84 Q60 94 66 84 Q73 64 71 16 Z',
    liquidTop: 30,
    extra: `M60 92 L60 144 ${STEM}`,
  },
  // округлая чаша на ножке
  wine: {
    body: 'M36 28 Q31 70 40 86 Q60 108 80 86 Q89 70 84 28 Z',
    liquidTop: 58,
    extra: `M60 104 L60 144 ${STEM}`,
  },
  // фигурный «тюльпан» на короткой ножке
  hurricane: {
    body: 'M42 14 Q32 40 44 62 Q52 76 47 96 Q44 112 52 122 L68 122 Q76 112 73 96 Q68 76 76 62 Q88 40 78 14 Z',
    liquidTop: 34,
    extra: `M60 122 L60 142 M44 148 Q60 140 76 148`,
  },
  // кружка-бочонок с ручкой
  'copper-mug': {
    body: 'M30 54 L32 142 Q32 148 38 148 L74 148 Q80 148 80 142 L82 54 Z',
    liquidTop: 70,
    extra: 'M82 72 Q100 72 100 96 Q100 120 81 120 M33 66 L81 66',
  },
  // кружка на ножке с ручкой; сверху слой сливок
  'irish-coffee': {
    body: 'M36 30 L40 100 Q42 110 52 110 L68 110 Q78 110 80 100 L84 30 Z',
    liquidTop: 44,
    extra: `M60 110 L60 142 M44 148 Q60 140 76 148 M84 44 Q100 46 99 66 Q98 86 81 88 M38 56 L82 56`,
  },
};

type Props = { shape: Glass; className?: string; title?: string; style?: CSSProperties };

/** Силуэт бокала: белые линии + полупрозрачный напиток. Рисуется поверх cover-gradient. */
export function GlassIllustration({ shape, className, title, style }: Props) {
  const clip = useId();
  const g = GEOMETRY[shape];
  return (
    <svg
      viewBox="0 0 120 160"
      className={cn('glass-illustration text-on-media', className)}
      style={style}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <clipPath id={clip}>
          <path d={g.body} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect x="0" y={g.liquidTop} width="120" height="160" fill="currentColor" opacity="0.22" />
        <rect x="0" y={g.liquidTop} width="120" height="2" fill="currentColor" opacity="0.5" />
      </g>
      <path d={g.body} fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      {g.extra && <path d={g.extra} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />}
    </svg>
  );
}
