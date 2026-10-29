import { useId, type ReactNode } from 'react';
import type { Cocktail, Glass } from '../../types/cocktail';
import { cn } from '../../lib/cn';
import { drinkColor } from './DrinkArt';

// ============================================================================================
// ПРОТОТИП (только витрина): «реалистичная» картинка напитка из состава рецепта.
// Бокал строится по профилю (полуширина на высоте) в ракурсе 3/4: эллипсы горлышка и дна, толстое донышко,
// блики по краям, ножка и подставка. Жидкость с объёмом и мениском, объёмный лёд, пузырьки, пена,
// запотевание, тень и цветной отсвет на «столе». viewBox 120×160, центр бокала x = 60.
// ============================================================================================

const CX = 60;
const E = 0.17; // сплющенность эллипсов (ракурс)

type Profile = {
  /** профиль чаши сверху вниз: [y, полуширина] */
  bowl: [number, number][];
  /** толщина стеклянного дна (стаканы) */
  base?: number;
  /** ножка: от низа чаши до подставки */
  stem?: [number, number];
  /** подставка: y и полуширина */
  foot?: [number, number];
  /** уровень напитка */
  level: number;
  handle?: 'mug' | 'irish';
  metal?: boolean;
};

const PROFILES: Record<Glass, Profile> = {
  rocks: { bowl: [[80, 33], [140, 29]], base: 9, level: 98 },
  highball: { bowl: [[38, 25], [142, 23]], base: 8, level: 54 },
  collins: { bowl: [[12, 17], [144, 16]], base: 8, level: 26 },
  coupe: { bowl: [[60, 39], [64, 38.5], [72, 35], [80, 28], [86, 19], [90, 9], [91.5, 2]], stem: [91, 143], foot: [146, 21], level: 67 },
  martini: { bowl: [[46, 43], [96, 2.5]], stem: [95, 143], foot: [146, 21], level: 56 },
  flute: { bowl: [[12, 11.5], [40, 12.5], [66, 10.5], [80, 6.5], [87, 2]], stem: [86, 143], foot: [146, 17], level: 24 },
  wine: { bowl: [[24, 22], [38, 26], [56, 27.5], [74, 23], [88, 13], [95, 3]], stem: [94, 143], foot: [146, 21], level: 60 },
  hurricane: { bowl: [[10, 19], [28, 21.5], [46, 17], [62, 11.5], [80, 13.5], [98, 13.5], [112, 10], [118, 3]], stem: [117, 142], foot: [146, 18], level: 28 },
  'copper-mug': { bowl: [[50, 26], [144, 24.5]], level: 58, handle: 'mug', metal: true },
  'irish-coffee': { bowl: [[26, 23], [60, 22], [92, 18.5], [102, 11], [106, 3]], stem: [105, 142], foot: [146, 18], level: 40, handle: 'irish' },
};

/** Полуширина чаши на высоте y: гладкая кривая через точки профиля (Catmull-Rom по высоте), без изломов */
function hwAt(p: [number, number][], y: number): number {
  if (y <= p[0]![0]) return p[0]![1];
  for (let i = 1; i < p.length; i++) {
    const [y1, w1] = p[i - 1]!;
    const [y2, w2] = p[i]!;
    if (y <= y2) {
      const w0 = (p[i - 2] ?? p[i - 1]!)[1];
      const w3 = (p[i + 1] ?? p[i]!)[1];
      const t = (y - y1) / (y2 - y1);
      const t2 = t * t;
      const t3 = t2 * t;
      return 0.5 * (2 * w1 + (-w0 + w2) * t + (2 * w0 - 5 * w1 + 4 * w2 - w3) * t2 + (-w0 + 3 * w1 - 3 * w2 + w3) * t3);
    }
  }
  return p[p.length - 1]![1];
}

/** Плавная кривая через точки (Catmull-Rom → кубические Безье) */
function smooth(pts: [number, number][]): string {
  if (pts.length < 3) return pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
  let d = `M${pts[0]![0]} ${pts[0]![1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[i + 2] ?? p2;
    d += ` C${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]} ${p2[1]}`;
  }
  return d;
}

/** Плотный профиль: точки через каждые 2 по высоте — для гладких стенок */
function dense(p: [number, number][]): [number, number][] {
  const out: [number, number][] = [];
  const y0 = p[0]![0];
  const y1 = p[p.length - 1]![0];
  for (let y = y0; y < y1; y += 2) out.push([y, hwAt(p, y)]);
  out.push([y1, p[p.length - 1]![1]]);
  return out;
}

function rng(seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (rgb: number[]) => '#' + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const mix = (a: string, b: string, t: number) => toHex(hex(a).map((v, i) => v + (hex(b)[i]! - v) * t));

/** Объёмный кубик льда в изометрии: верх светлее, боковые грани прозрачнее, тонкие светлые рёбра */
function Cube({ x, y, s, rot, tint }: { x: number; y: number; s: number; rot: number; tint: string }) {
  const w = s * 0.5;
  const h = s * 0.28;
  const d = s * 0.55;
  const T: [number, number] = [x, y - h];
  const R: [number, number] = [x + w, y - h / 2];
  const C: [number, number] = [x, y];
  const L: [number, number] = [x - w, y - h / 2];
  const P = (pts: [number, number][]) => pts.map(([a, b]) => `${a},${b}`).join(' ');
  return (
    <g transform={`rotate(${rot} ${x} ${y})`} strokeLinejoin="round">
      <polygon points={P([L, C, [C[0], C[1] + d], [L[0], L[1] + d]])} fill={mix(tint, '#ffffff', 0.55)} fillOpacity="0.32" stroke="white" strokeOpacity="0.55" strokeWidth="0.7" />
      <polygon points={P([C, R, [R[0], R[1] + d], [C[0], C[1] + d]])} fill={mix(tint, '#ffffff', 0.3)} fillOpacity="0.22" stroke="white" strokeOpacity="0.45" strokeWidth="0.7" />
      <polygon points={P([T, R, C, L])} fill="white" fillOpacity="0.42" stroke="white" strokeOpacity="0.8" strokeWidth="0.7" />
      {/* блик на ребре */}
      <path d={`M${L[0] + 2} ${L[1] + 2} L${L[0] + 2} ${L[1] + d - 3}`} stroke="white" strokeOpacity="0.85" strokeWidth="0.9" strokeLinecap="round" />
    </g>
  );
}

type Props = {
  cocktail: Pick<Cocktail, 'id' | 'glass' | 'ice' | 'method' | 'ingredients'>;
  className?: string;
};

/** «Реалистичная» картинка напитка (прототип) */
export function DrinkArtReal({ cocktail, className }: Props) {
  const uid = useId().replace(/:/g, '');
  const id = (k: string) => `${k}${uid}`;
  const url = (k: string) => `url(#${k}${uid})`;
  const pr = PROFILES[cocktail.glass];
  const rand = rng(cocktail.id);
  const refs = new Set(cocktail.ingredients.map((i) => i.ref));
  const fizzy = refs.has('soda') || refs.has('sparkling-wine') || refs.has('tonic') || refs.has('ginger-beer');
  const foam = refs.has('egg-white');
  const frozen = cocktail.method === 'blend';
  const creamFloat = refs.has('cream') && cocktail.method === 'build';
  const { color, opacity } = drinkColor(cocktail);
  const liquidOpacity = frozen ? 0.96 : Math.max(0.55, opacity);

  const bowl = dense(pr.bowl);
  const top = bowl[0]!;
  const bottom = bowl[bowl.length - 1]!;
  const rimY = top[0];
  const rimW = top[1];
  const botY = bottom[0];
  const botW = bottom[1];
  const left = bowl.map(([y, w]) => [CX - w, y] as [number, number]);
  const right = bowl.map(([y, w]) => [CX + w, y] as [number, number]).reverse();
  const flatBottom = botW > 6;

  // внутренность чаши: стенки + нижняя дуга (передняя) + верхняя дуга (задняя)
  const interior =
    smooth(left) +
    (flatBottom ? ` A${botW} ${botW * E} 0 0 0 ${CX + botW} ${botY}` : ` L${CX + botW} ${botY}`) +
    ' ' + smooth(right).replace(/^M/, 'L') +
    ` A${rimW} ${rimW * E} 0 0 0 ${CX - rimW} ${rimY} Z`;

  const level = pr.level;
  const lw = hwAt(pr.bowl, level);
  const glassBottom = botY + (pr.base ?? 0);
  const groundY = pr.foot ? pr.foot[0] : glassBottom;
  const groundW = pr.foot ? pr.foot[1] : botW;

  // --- лёд ---
  const ice: ReactNode[] = [];
  const inner = (y: number) => hwAt(pr.bowl, y) - 3;
  if (!frozen && !pr.metal) {
    if (cocktail.ice === 'cubes') {
      const span = botY - level;
      const n = Math.max(2, Math.min(5, Math.round(span / 22)));
      for (let i = 0; i < n; i++) {
        const y = level - 4 + (i * (span - 8)) / n + rand() * 4;
        const s = Math.min(22, inner(y) * 1.1);
        const x = CX + (i % 2 ? 1 : -1) * (inner(y) - s * 0.55) * (0.4 + rand() * 0.5);
        ice.push(<Cube key={i} x={x} y={y} s={s} rot={rand() * 30 - 15} tint={color} />);
      }
    } else if (cocktail.ice === 'big-cube') {
      const s = Math.min(46, lw * 1.35);
      ice.push(<Cube key="big" x={CX + (rand() - 0.5) * 4} y={level + 2} s={s} rot={rand() * 8 - 4} tint={color} />);
    } else if (cocktail.ice === 'sphere') {
      const r = Math.min(20, lw * 0.7);
      ice.push(
        <g key="sphere">
          <circle cx={CX} cy={botY - r - 2} r={r} fill={url('sph')} stroke="white" strokeOpacity="0.5" strokeWidth="0.7" />
          <ellipse cx={CX - r * 0.35} cy={botY - r * 1.45 - 2} rx={r * 0.28} ry={r * 0.16} fill="white" opacity="0.8" />
        </g>,
      );
    } else if (cocktail.ice === 'crushed') {
      const n = Math.round(((botY - level) * lw) / 30);
      for (let i = 0; i < n; i++) {
        const y = level - 6 + rand() * (botY - level);
        const x = CX + (rand() * 2 - 1) * inner(Math.max(y, rimY));
        const k = 2.5 + rand() * 3.5;
        ice.push(
          <path
            key={i}
            d={`M${x} ${y - k} L${x + k} ${y - k * 0.3} L${x + k * 0.5} ${y + k} L${x - k * 0.9} ${y + k * 0.6} Z`}
            fill="white"
            fillOpacity={0.18 + rand() * 0.3}
            stroke="white"
            strokeOpacity="0.55"
            strokeWidth="0.5"
            strokeLinejoin="round"
          />,
        );
      }
    }
  }

  // --- пузырьки ---
  const bubbles = fizzy
    ? Array.from({ length: 22 }, () => {
        const y = level + 4 + rand() * (botY - level - 6);
        return { x: CX + (rand() * 2 - 1) * inner(y), y, r: 0.6 + rand() * 1.5 };
      })
    : [];

  // --- запотевание: капли на нижних двух третях холодного стакана ---
  const drops =
    cocktail.ice !== 'none' && !pr.stem && !pr.metal
      ? Array.from({ length: 12 }, () => {
          const y = level + rand() * (botY - level);
          return { x: CX + (rand() * 2 - 1) * (hwAt(pr.bowl, y) - 1.5), y, r: 0.5 + rand() * 1.1 };
        })
      : [];

  const light = mix(color, '#ffffff', 0.18);
  const deep = mix(color, '#000000', 0.45);

  return (
    <svg viewBox="0 0 120 160" className={cn('overflow-visible', className)} aria-hidden>
      <defs>
        <clipPath id={id('in')}>
          <path d={interior} />
        </clipPath>
        <linearGradient id={id('liq')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={light} />
          <stop offset="1" stopColor={deep} />
        </linearGradient>
        {/* объём: края темнее середины */}
        <linearGradient id={id('vol')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="black" stopOpacity="0.45" />
          <stop offset="0.3" stopColor="black" stopOpacity="0" />
          <stop offset="0.7" stopColor="black" stopOpacity="0" />
          <stop offset="1" stopColor="black" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id={id('wall')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="white" stopOpacity="0.55" />
          <stop offset="0.12" stopColor="white" stopOpacity="0.08" />
          <stop offset="0.82" stopColor="white" stopOpacity="0.02" />
          <stop offset="0.92" stopColor="white" stopOpacity="0.3" />
          <stop offset="1" stopColor="white" stopOpacity="0.05" />
        </linearGradient>
        <radialGradient id={id('sph')} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="white" stopOpacity="0.6" />
          <stop offset="1" stopColor="white" stopOpacity="0.08" />
        </radialGradient>
        <linearGradient id={id('stem')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="white" stopOpacity="0.15" />
          <stop offset="0.4" stopColor="white" stopOpacity="0.7" />
          <stop offset="1" stopColor="white" stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id={id('cu')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#6e3013" />
          <stop offset="0.25" stopColor="#c8743d" />
          <stop offset="0.42" stopColor="#f2b27a" />
          <stop offset="0.6" stopColor="#b8642f" />
          <stop offset="1" stopColor="#5a2610" />
        </linearGradient>
        <filter id={id('blur')} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      {/* стол: тень и цветной отсвет напитка */}
      <ellipse cx={CX} cy={groundY + 1} rx={groundW * 1.15} ry={groundW * E * 1.4} fill="black" opacity="0.5" filter={url('blur')} />
      {!pr.metal && <ellipse cx={CX + 6} cy={groundY + 2} rx={groundW * 1.3} ry={groundW * E * 1.8} fill={color} opacity="0.35" filter={url('blur')} />}

      {/* ножка и подставка */}
      {pr.stem && (
        <g>
          <ellipse cx={CX} cy={pr.foot![0]} rx={pr.foot![1]} ry={pr.foot![1] * E} fill="white" fillOpacity="0.1" stroke="white" strokeOpacity="0.55" strokeWidth="0.9" />
          <path d={`M${CX - pr.foot![1] + 3} ${pr.foot![0] - 0.5} Q${CX} ${pr.foot![0] - 5} ${CX + pr.foot![1] - 3} ${pr.foot![0] - 0.5}`} fill="none" stroke="white" strokeOpacity="0.35" strokeWidth="0.8" />
          <rect x={CX - 1.8} y={pr.stem[0]} width="3.6" height={pr.stem[1] - pr.stem[0]} rx="1.8" fill={url('stem')} />
        </g>
      )}

      {pr.metal ? (
        // медная кружка: напиток виден только сверху
        <g>
          <path d={interior} fill={url('cu')} />
          {Array.from({ length: 30 }, (_, i) => {
            const y = rimY + 8 + rand() * (botY - rimY - 12);
            return <ellipse key={i} cx={CX + (rand() * 2 - 1) * (hwAt(pr.bowl, y) - 3)} cy={y} rx="2.2" ry="1.4" fill="white" opacity={0.05 + rand() * 0.12} />;
          })}
          <path d={`M${CX + rimW - 1} ${rimY + 16} C${CX + rimW + 20} ${rimY + 14} ${CX + rimW + 20} ${rimY + 62} ${CX + rimW - 1} ${rimY + 60}`} fill="none" stroke={url('cu')} strokeWidth="6" strokeLinecap="round" />
          <ellipse cx={CX} cy={rimY} rx={rimW} ry={rimW * E} fill={mix(color, '#000000', 0.25)} />
          {cocktail.ice !== 'none' && [-10, 4, 13].map((dx, i) => (
            <rect key={i} x={CX + dx - 5} y={rimY - 4 + (i % 2) * 2} width="10" height="7" rx="1.5" fill="white" fillOpacity="0.45" stroke="white" strokeOpacity="0.8" strokeWidth="0.6" transform={`rotate(${i * 20 - 15} ${CX + dx} ${rimY})`} />
          ))}
          <ellipse cx={CX} cy={rimY} rx={rimW} ry={rimW * E} fill="none" stroke="#f6c08f" strokeWidth="1.6" />
        </g>
      ) : (
        <>
          {/* задняя кромка горлышка */}
          <path d={`M${CX - rimW} ${rimY} A${rimW} ${rimW * E} 0 0 1 ${CX + rimW} ${rimY}`} fill="none" stroke="white" strokeOpacity="0.35" strokeWidth="0.9" />

          <g clipPath={url('in')}>
            {/* стекло изнутри — лёгкая дымка */}
            <rect x="0" y="0" width="120" height="160" fill="white" opacity="0.04" />
            {/* напиток */}
            <rect x="0" y={level} width="120" height="160" fill={url('liq')} opacity={liquidOpacity} />
            <rect x={CX - lw - 4} y={level} width={lw * 2 + 8} height="160" fill={url('vol')} />
            {frozen &&
              Array.from({ length: 60 }, (_, i) => (
                <circle key={i} cx={CX + (rand() * 2 - 1) * lw} cy={level + rand() * (botY - level)} r={0.4 + rand() * 0.9} fill="white" opacity={0.25 + rand() * 0.45} />
              ))}
            {bubbles.map((b, i) => (
              <g key={i}>
                <circle cx={b.x} cy={b.y} r={b.r} fill="white" fillOpacity="0.08" stroke="white" strokeOpacity="0.7" strokeWidth="0.45" />
                <circle cx={b.x - b.r * 0.35} cy={b.y - b.r * 0.35} r={b.r * 0.3} fill="white" opacity="0.9" />
              </g>
            ))}
          </g>

          {/* поверхность напитка: эллипс светлее, мениск по краю */}
          <ellipse cx={CX} cy={level} rx={lw} ry={lw * E} fill={mix(color, '#ffffff', foam || creamFloat ? 0.85 : 0.3)} opacity={Math.min(1, liquidOpacity + 0.1)} />
          {creamFloat && <ellipse cx={CX} cy={level + 4} rx={lw} ry={lw * E + 3} fill="#f3e8d6" opacity="0.9" clipPath={url('in')} />}
          {foam && (
            <g clipPath={url('in')}>
              <rect x="0" y={level} width="120" height="7" fill="#f8f1e2" />
              {Array.from({ length: 18 }, (_, i) => (
                <circle key={i} cx={CX + (rand() * 2 - 1) * lw} cy={level + rand() * 6} r={0.4 + rand() * 0.6} fill="#d9cdb4" />
              ))}
            </g>
          )}
          <ellipse cx={CX} cy={level} rx={lw} ry={lw * E} fill="none" stroke="white" strokeOpacity="0.55" strokeWidth="0.7" />
          {/* лёд — поверх поверхности: верхние кубики выглядывают из напитка */}
          <g clipPath={url('in')}>{ice}</g>

          {/* стенки: блики по краям (френель), тонкие контуры */}
          <path d={interior} fill={url('wall')} />
          {pr.base && (
            // толстое дно стакана
            <g>
              <path
                d={`M${CX - botW} ${botY} A${botW} ${botW * E} 0 0 0 ${CX + botW} ${botY} L${CX + botW} ${glassBottom} A${botW} ${botW * E} 0 0 1 ${CX - botW} ${glassBottom} Z`}
                fill="white"
                fillOpacity="0.16"
              />
              <path d={`M${CX - botW + 4} ${glassBottom - 2} A${botW - 4} ${(botW - 4) * E} 0 0 0 ${CX + botW - 4} ${glassBottom - 2}`} fill="none" stroke="white" strokeOpacity="0.5" strokeWidth="0.8" />
              <path d={`M${CX - botW} ${glassBottom} A${botW} ${botW * E} 0 0 0 ${CX + botW} ${glassBottom}`} fill="none" stroke="white" strokeOpacity="0.6" strokeWidth="1" />
              <path d={`M${CX - botW} ${botY} L${CX - botW} ${glassBottom} M${CX + botW} ${botY} L${CX + botW} ${glassBottom}`} stroke="white" strokeOpacity="0.6" strokeWidth="1" />
            </g>
          )}
          <path d={smooth(left)} fill="none" stroke="white" strokeOpacity="0.75" strokeWidth="1.1" />
          <path d={smooth(right)} fill="none" stroke="white" strokeOpacity="0.55" strokeWidth="1.1" />
          {flatBottom && !pr.base && <path d={`M${CX - botW} ${botY} A${botW} ${botW * E} 0 0 0 ${CX + botW} ${botY}`} fill="none" stroke="white" strokeOpacity="0.55" strokeWidth="1" />}
          {/* вертикальный блик слева */}
          <path d={smooth(bowl.filter((_, i) => i % 2 === 0).map(([y, w]) => [CX - w + 4, y + 4] as [number, number]).slice(0, -2))} fill="none" stroke="white" strokeOpacity="0.6" strokeWidth="1.6" strokeLinecap="round" />
          {/* передняя кромка горлышка — самая яркая линия */}
          <path d={`M${CX - rimW} ${rimY} A${rimW} ${rimW * E} 0 0 0 ${CX + rimW} ${rimY}`} fill="none" stroke="white" strokeOpacity="0.9" strokeWidth="1.2" />
          {/* запотевание */}
          {drops.map((d, i) => (
            <g key={i}>
              <ellipse cx={d.x} cy={d.y} rx={d.r * 0.7} ry={d.r * 1.1} fill="white" opacity="0.14" />
              <circle cx={d.x - d.r * 0.2} cy={d.y - d.r * 0.4} r={d.r * 0.25} fill="white" opacity="0.45" />
            </g>
          ))}
          {/* ручка айриш-кофе */}
          {pr.handle === 'irish' && (
            <path d={`M${CX + rimW - 1} ${rimY + 10} C${CX + rimW + 16} ${rimY + 10} ${CX + rimW + 16} ${rimY + 46} ${CX + rimW - 4} ${rimY + 48}`} fill="none" stroke="white" strokeOpacity="0.6" strokeWidth="3" strokeLinecap="round" />
          )}
        </>
      )}
    </svg>
  );
}
