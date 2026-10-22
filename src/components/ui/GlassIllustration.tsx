import { useId } from 'react';
import type { GlassShape } from '../../lib/cocktails';
import type { Ice } from '../../types/cocktail';
import { cn } from '../../lib/cn';

/**
 * Силуэт бокала поверх обложки. viewBox 120×160, бокал стоит на y=148.
 * body — контур чаши (он же маска жидкости), liquid — уровень напитка, extra — ножка/дно.
 */
type GlassGeometry = { body: string; liquidTop: number; extra?: string; iceBox: [number, number, number, number] };

const GEOMETRY: Record<GlassShape, GlassGeometry> = {
  rocks: {
    body: 'M30 78 L34 142 Q34 148 40 148 L80 148 Q86 148 86 142 L90 78 Z',
    liquidTop: 100,
    extra: 'M35 136 L85 136',
    iceBox: [38, 96, 82, 134],
  },
  highball: {
    body: 'M38 36 L41 142 Q41 148 47 148 L73 148 Q79 148 79 142 L82 36 Z',
    liquidTop: 58,
    extra: 'M41 138 L79 138',
    iceBox: [44, 60, 76, 136],
  },
  collins: {
    body: 'M42 22 L44 142 Q44 148 50 148 L70 148 Q76 148 76 142 L78 22 Z',
    liquidTop: 44,
    extra: 'M44 138 L76 138',
    iceBox: [47, 46, 73, 136],
  },
  coupe: {
    body: 'M22 60 Q24 96 60 98 Q96 96 98 60 Z',
    liquidTop: 68,
    extra: 'M60 98 L60 144 M40 148 Q60 140 80 148',
    iceBox: [0, 0, 0, 0],
  },
  martini: {
    body: 'M18 50 L60 100 L102 50 Z',
    liquidTop: 60,
    extra: 'M60 100 L60 144 M40 148 Q60 140 80 148',
    iceBox: [0, 0, 0, 0],
  },
  wine: {
    body: 'M36 28 Q31 70 40 86 Q60 108 80 86 Q89 70 84 28 Z',
    liquidTop: 56,
    extra: 'M60 104 L60 144 M40 148 Q60 140 80 148',
    iceBox: [42, 58, 78, 92],
  },
};

function IceCubes({ ice, box }: { ice: Ice; box: [number, number, number, number] }) {
  const [x1, y1, x2, y2] = box;
  if (ice === 'none' || x2 === 0) return null;
  const w = x2 - x1;
  const h = y2 - y1;
  if (ice === 'big-cube' || ice === 'sphere') {
    const s = Math.min(w, h) * 0.78;
    const x = x1 + (w - s) / 2;
    const y = y2 - s - 2;
    return ice === 'sphere' ? (
      <circle cx={x + s / 2} cy={y + s / 2} r={s / 2} className="ice" />
    ) : (
      <rect x={x} y={y} width={s} height={s} rx={5} className="ice" />
    );
  }
  if (ice === 'crushed') {
    // колотый лёд: россыпь неровных осколков; псевдослучайно, но стабильно между рендерами
    let seed = 7;
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    // плотность по площади: бокал заполнен колотым льдом
    const shards = Array.from({ length: Math.round((w * h) / 70) }, () => {
      const size = 6 + rnd() * 4;
      return { x: x1 + rnd() * (w - size), y: y1 + 4 + rnd() * (h - size - 4), size, rot: rnd() * 90 - 45 };
    });
    return (
      <g>
        {shards.map((s, i) => (
          <rect key={i} x={s.x} y={s.y} width={s.size} height={s.size * 0.8} rx={2} className="ice" transform={`rotate(${s.rot} ${s.x + s.size / 2} ${s.y + s.size / 2})`} />
        ))}
      </g>
    );
  }
  // кубики: 1–2 колонки по ширине бокала, до 3 рядов от дна
  const cols = w >= 40 ? 2 : 1;
  const s = Math.min((w - 4) / cols - 3, 20);
  const rows = Math.max(1, Math.min(3, Math.floor((h - 4) / (s + 3))));
  const cubes: [number, number, number][] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      cubes.push([x1 + (w - cols * (s + 3)) / 2 + c * (s + 3) + (r % 2 ? 2 : -1), y2 - (r + 1) * (s + 3), r * 9 + c * 13 - 10]);
  return (
    <g>
      {cubes.map(([x, y, rot], i) => (
        <rect key={i} x={x} y={y} width={s} height={s} rx={3} transform={`rotate(${rot} ${x + s / 2} ${y + s / 2})`} className="ice" />
      ))}
    </g>
  );
}

type Props = { shape: GlassShape; ice?: Ice; className?: string; title?: string };

/** Силуэт бокала: белые линии + полупрозрачный напиток и лёд. Рисуется поверх cover-gradient. */
export function GlassIllustration({ shape, ice = 'none', className, title }: Props) {
  const clip = useId();
  const g = GEOMETRY[shape];
  return (
    <svg
      viewBox="0 0 120 160"
      className={cn('glass-illustration text-on-media', className)}
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
        <IceCubes ice={ice} box={g.iceBox} />
      </g>
      <path d={g.body} fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      {g.extra && <path d={g.extra} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />}
    </svg>
  );
}
