import { useId } from 'react';
import type { Cocktail, Glass, Ice } from '../../types/cocktail';
import { cn } from '../../lib/cn';
import { GEOMETRY } from './GlassIllustration';

// ============================================================================================
// ПРОТОТИП (только витрина): картинка напитка собирается из данных рецепта — бокал, цвет жидкости
// из ингредиентов, лёд, пена / пузырьки / сливки, украшение на краю. Работает и для авторских.
// Два стиля на выбор: flat — плоский вектор в духе силуэтов; soft — «мягкое стекло» с объёмом.
// ============================================================================================

export type GarnishKind = 'orange-twist' | 'lemon-twist' | 'lime-wedge' | 'orange-wheel' | 'cherry' | 'mint' | 'pineapple' | 'bitters-drops' | 'none';
export type DrinkStyle = 'flat' | 'soft';

/** Цвет ингредиента и «сила» окраски: прозрачное (джин, ром) почти не красит, кампари красит сильно */
type Tint = { c: string; w: number; opaque?: boolean };
const CLEAR: Tint = { c: '#f4f1e8', w: 0.06 };
const TINTS: Record<string, Tint> = {
  gin: CLEAR,
  vodka: CLEAR,
  'white-rum': CLEAR,
  pisco: CLEAR,
  maraschino: CLEAR,
  'simple-syrup': CLEAR,
  soda: { c: '#f4f1e8', w: 0.03 },
  campari: { c: '#c8102e', w: 3 },
  aperol: { c: '#ff5a0a', w: 2.5 },
  'sweet-vermouth': { c: '#6e1a12', w: 1.6 },
  lime: { c: '#c9e27a', w: 0.6 },
  lemon: { c: '#f2e68a', w: 0.6 },
  'pineapple-juice': { c: '#f6d55c', w: 1 },
  'coconut-cream': { c: '#f7f1e3', w: 1.4, opaque: true },
  cream: { c: '#f3e8d6', w: 1.4, opaque: true },
  'egg-white': { c: '#fbf6ea', w: 0.2 },
  'creme-de-violette': { c: '#7d5bb3', w: 8 },
  'coffee-liqueur': { c: '#3a1d10', w: 2 },
  'sparkling-wine': { c: '#f1df93', w: 0.5 },
  angostura: { c: '#5a1a10', w: 0.5 },
};

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (rgb: number[]) => '#' + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const mix = (a: string, b: string, t: number) => toHex(hex(a).map((v, i) => v + (hex(b)[i]! - v) * t));

/** Цвет и плотность напитка: средневзвешенное по объёму × силе окраски */
export function drinkColor(c: Pick<Cocktail, 'ingredients'>): { color: string; opacity: number } {
  let r = 0, g = 0, b = 0, sum = 0, vol = 0, opaqueVol = 0;
  for (const i of c.ingredients) {
    const t = TINTS[i.ref];
    if (!t) continue;
    const v = i.amountMl ?? (i.unit === 'top' ? 60 : i.unit === 'barspoon' ? 5 : 1);
    const k = v * t.w;
    const [cr, cg, cb] = hex(t.c);
    r += cr! * k; g += cg! * k; b += cb! * k; sum += k; vol += v;
    if (t.opaque) opaqueVol += v;
  }
  if (!sum) return { color: '#f4f1e8', opacity: 0.35 };
  const color = toHex([r / sum, g / sum, b / sum]);
  // прозрачные напитки (мартини, джин-тоник) — светлее и прозрачнее; со сливками — плотные
  const strength = Math.min(1, sum / vol);
  return { color, opacity: Math.min(0.97, 0.6 + strength * 0.35 + (opaqueVol / vol) * 0.5) };
}

/** Детерминированный «случай» по id: раскладка льда, пузырьков, наклон украшения у каждого коктейля своя */
function rng(seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/** Габариты чаши из пути: x — края, y — дно (для льда и пузырьков) */
function bounds(body: string) {
  const n = body.match(/-?\d+(\.\d+)?/g)!.map(Number);
  const xs = n.filter((_, i) => i % 2 === 0);
  const ys = n.filter((_, i) => i % 2 === 1);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}

/** Точка на краю бокала справа — куда садится украшение */
const RIM: Partial<Record<Glass, [number, number]>> = {
  rocks: [90, 80], highball: [84, 46], collins: [74, 12], coupe: [95, 62], martini: [99, 52],
  flute: [70, 18], wine: [83, 30], hurricane: [77, 16], 'copper-mug': [80, 56], 'irish-coffee': [83, 32],
};

function IceLayer({ ice, box, top, rand, style }: { ice: Ice; box: ReturnType<typeof bounds>; top: number; rand: () => number; style: DrinkStyle }) {
  const fill = style === 'soft' ? 'rgb(255 255 255 / 0.16)' : 'rgb(255 255 255 / 0.1)';
  const stroke = 'rgb(255 255 255 / 0.7)';
  const w = box.x1 - box.x0;
  if (ice === 'none') return null;
  if (ice === 'big-cube' || ice === 'sphere') {
    const s = Math.min(w * 0.62, 40);
    const cx = (box.x0 + box.x1) / 2;
    const cy = Math.max(top + s / 2 - 6, box.y1 - s / 2 - 10);
    return ice === 'sphere' ? (
      <g>
        <circle cx={cx} cy={cy} r={s / 2} fill={fill} stroke={stroke} strokeWidth="1.5" />
        <path d={`M${cx - s / 4} ${cy - s / 5} Q${cx - s / 6} ${cy - s / 3} ${cx} ${cy - s / 2.6}`} stroke="white" strokeOpacity="0.8" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </g>
    ) : (
      <g transform={`rotate(${rand() * 10 - 5} ${cx} ${cy})`}>
        <rect x={cx - s / 2} y={cy - s / 2} width={s} height={s} rx="4" fill={fill} stroke={stroke} strokeWidth="1.5" />
        <path d={`M${cx - s / 2 + 5} ${cy - s / 2 + 8} L${cx - s / 2 + 5} ${cy + s / 6}`} stroke="white" strokeOpacity="0.8" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    );
  }
  // колотый: редкие неровные осколки по всей высоте; кубики — 2–4 крупных у дна и середины
  const pieces = [];
  if (ice === 'crushed') {
    const n = Math.round(((box.y1 - top) * w) / 90);
    for (let i = 0; i < n; i++) {
      const x = box.x0 + 4 + rand() * (w - 8);
      const y = top + 2 + rand() * (box.y1 - top - 6);
      const k = 3 + rand() * 4;
      pieces.push(
        <path key={i} d={`M${x} ${y - k} L${x + k} ${y - k * 0.2} L${x + k * 0.4} ${y + k} L${x - k * 0.8} ${y + k * 0.5} Z`} fill={fill} stroke={stroke} strokeOpacity="0.6" strokeWidth="0.8" strokeLinejoin="round" />,
      );
    }
  } else {
    const size = Math.min(16, w * 0.32);
    const count = w > 50 ? 4 : 3;
    for (let i = 0; i < count; i++) {
      const x = box.x0 + 5 + rand() * (w - size - 10);
      const y = top + 4 + (i / count) * (box.y1 - top - size - 10) + rand() * 4;
      pieces.push(
        <g key={i} transform={`rotate(${rand() * 36 - 18} ${x + size / 2} ${y + size / 2})`}>
          <rect x={x} y={y} width={size} height={size} rx="3" fill={fill} stroke={stroke} strokeWidth="1.3" />
          <path d={`M${x + 3} ${y + 4} L${x + 3} ${y + size / 2}`} stroke="white" strokeOpacity="0.8" strokeWidth="1.2" strokeLinecap="round" />
        </g>,
      );
    }
  }
  return <g>{pieces}</g>;
}

function Garnish({ kind, at, rand }: { kind: GarnishKind; at: [number, number]; rand: () => number }) {
  const [x, y] = at;
  const tilt = rand() * 16 - 8;
  switch (kind) {
    case 'orange-twist':
    case 'lemon-twist': {
      const c = kind === 'orange-twist' ? '#ff8a2a' : '#f5d33f';
      return (
        <g transform={`rotate(${tilt} ${x} ${y})`}>
          <path d={`M${x - 4} ${y - 2} q8 -10 16 -4 q8 6 0 14 q-6 6 -10 0`} fill="none" stroke={c} strokeWidth="5" strokeLinecap="round" />
          <path d={`M${x - 4} ${y - 2} q8 -10 16 -4 q8 6 0 14 q-6 6 -10 0`} fill="none" stroke="white" strokeOpacity="0.35" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      );
    }
    case 'lime-wedge':
    case 'orange-wheel': {
      const [peel, flesh] = kind === 'lime-wedge' ? ['#5aa02c', '#c9e27a'] : ['#ff7a1a', '#ffc46b'];
      const r = kind === 'lime-wedge' ? 12 : 15;
      return (
        <g transform={`rotate(${tilt - 20} ${x} ${y})`}>
          <circle cx={x} cy={y} r={r} fill={peel} />
          <circle cx={x} cy={y} r={r - 2.5} fill={flesh} />
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <line key={a} x1={x} y1={y} x2={x + Math.cos((a * Math.PI) / 180) * (r - 3)} y2={y + Math.sin((a * Math.PI) / 180) * (r - 3)} stroke={peel} strokeOpacity="0.5" strokeWidth="1" />
          ))}
          {/* надрез — долька сидит на краю */}
          <rect x={x - 1.5} y={y} width="3" height={r + 1} fill="black" fillOpacity="0.35" />
        </g>
      );
    }
    case 'cherry':
      return (
        <g>
          <path d={`M${x - 10} ${y + 6} Q${x - 4} ${y - 18} ${x + 6} ${y - 22}`} fill="none" stroke="#3d6b2a" strokeWidth="2" strokeLinecap="round" />
          <circle cx={x - 10} cy={y + 10} r="7" fill="#b3122e" />
          <circle cx={x - 12} cy={y + 8} r="2" fill="white" fillOpacity="0.6" />
        </g>
      );
    case 'mint':
      return (
        <g transform={`rotate(${tilt} ${x} ${y})`}>
          {[[-6, -14, -30], [4, -18, 20], [-2, -26, -5], [8, -8, 45]].map(([dx, dy, a], i) => (
            <ellipse key={i} cx={x + dx!} cy={y + dy!} rx="5" ry="9" transform={`rotate(${a} ${x + dx!} ${y + dy!})`} fill={i % 2 ? '#4caf50' : '#6cc66b'} stroke="#2e7d32" strokeWidth="0.8" />
          ))}
        </g>
      );
    case 'pineapple':
      return (
        <g transform={`rotate(${tilt + 15} ${x} ${y})`}>
          <path d={`M${x - 14} ${y + 4} L${x + 14} ${y + 4} L${x} ${y - 16} Z`} fill="#f6c945" stroke="#c9922a" strokeWidth="1.2" />
          <path d={`M${x} ${y - 16} l-5 -10 M${x} ${y - 16} l1 -12 M${x} ${y - 16} l6 -9`} stroke="#4f8a2f" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      );
    default:
      return null;
  }
}

type Props = {
  cocktail: Pick<Cocktail, 'id' | 'glass' | 'ice' | 'method' | 'ingredients'>;
  garnish?: GarnishKind;
  style?: DrinkStyle;
  className?: string;
};

/** Картинка напитка из данных рецепта (прототип) */
export function DrinkArt({ cocktail, garnish = 'none', style = 'flat', className }: Props) {
  const uid = useId().replace(/:/g, '');
  const g = GEOMETRY[cocktail.glass];
  const box = bounds(g.body);
  const rand = rng(cocktail.id);
  const { color, opacity: baseOpacity } = drinkColor(cocktail);
  const opacity = cocktail.method === 'blend' ? Math.max(baseOpacity, 0.92) : baseOpacity;
  const refs = new Set(cocktail.ingredients.map((i) => i.ref));
  const fizzy = refs.has('soda') || refs.has('sparkling-wine') || refs.has('tonic') || refs.has('ginger-beer');
  const foam = refs.has('egg-white');
  const top = g.liquidTop;
  const light = mix(color, '#ffffff', style === 'soft' ? 0.2 : 0.06);
  const dark = mix(color, '#000000', style === 'soft' ? 0.5 : 0.35);
  // блендер: лёд перемолот — плотная однородная масса с инеем, без кусков
  const frozen = cocktail.method === 'blend';
  const bubbles = fizzy
    ? Array.from({ length: 14 }, () => ({ x: box.x0 + 6 + rand() * (box.x1 - box.x0 - 12), y: top + 6 + rand() * (box.y1 - top - 14), r: 0.8 + rand() * 1.6 }))
    : [];

  return (
    <svg viewBox="0 0 120 160" className={cn('overflow-visible', className)} aria-hidden>
      <defs>
        <clipPath id={`c${uid}`}>
          <path d={g.body} />
        </clipPath>
        <linearGradient id={`l${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={light} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
        <linearGradient id={`s${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="white" stopOpacity="0.5" />
          <stop offset="0.35" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <filter id={`b${uid}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>

      {/* soft: свечение напитка за бокалом */}
      {style === 'soft' && <path d={g.body} fill={mix(color, '#ffffff', 0.3)} opacity="0.7" filter={`url(#b${uid})`} transform="translate(0 6)" />}

      <g clipPath={`url(#c${uid})`}>
        {/* тёмная подложка в чаше: напиток не сливается с обложкой того же цвета */}
        <rect x="0" y={top} width="120" height="160" fill="black" opacity={style === 'soft' ? 0.25 : 0.4} />
        {/* жидкость */}
        <rect x="0" y={top} width="120" height="160" fill={`url(#l${uid})`} opacity={opacity} />
        {/* поверхность */}
        <rect x="0" y={top} width="120" height="1.6" fill="white" opacity="0.55" />
        {/* пена (белок) */}
        {foam && (
          <g>
            <rect x="0" y={top} width="120" height="9" fill="#fbf6ea" opacity="0.95" />
            {refs.has('angostura') && [0.3, 0.5, 0.7].map((p) => <circle key={p} cx={box.x0 + (box.x1 - box.x0) * p} cy={top + 4} r="1.8" fill="#7a2416" />)}
          </g>
        )}
        {/* сливки сверху (белый русский) */}
        {refs.has('cream') && cocktail.method === 'build' && (
          <path d={`M0 ${top} H120 V${top + 14} Q90 ${top + 22} 60 ${top + 12} Q30 ${top + 4} 0 ${top + 16} Z`} fill="#f3e8d6" opacity="0.92" />
        )}
        {frozen ? (
          Array.from({ length: 40 }, (_, i) => <circle key={i} cx={box.x0 + rand() * (box.x1 - box.x0)} cy={top + rand() * (box.y1 - top)} r={0.6 + rand()} fill="white" opacity={0.35 + rand() * 0.4} />)
        ) : (
          <IceLayer ice={cocktail.ice} box={box} top={top} rand={rand} style={style} />
        )}
        {bubbles.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={p.r} fill="none" stroke="white" strokeOpacity="0.75" strokeWidth="0.8" />
        ))}
        {/* блик стекла */}
        <rect x="0" y="0" width="120" height="160" fill={`url(#s${uid})`} opacity={style === 'soft' ? 0.9 : 0.5} />
      </g>

      {/* контур бокала */}
      <path d={g.body} fill="white" fillOpacity={style === 'soft' ? 0.08 : 0.04} stroke="white" strokeOpacity={style === 'soft' ? 0.55 : 1} strokeWidth={style === 'soft' ? 1.6 : 2.5} strokeLinejoin="round" />
      {g.extra && <path d={g.extra} fill="none" stroke="white" strokeOpacity={style === 'soft' ? 0.55 : 1} strokeWidth={style === 'soft' ? 1.6 : 2.5} strokeLinecap="round" />}
      {style === 'soft' && (
        <g clipPath={`url(#c${uid})`}>
          {/* отражения: широкая полоса слева и узкая справа, мягкий блик на поверхности */}
          <path d={`M${box.x0 + 4} ${box.y0} L${box.x0 + 12} ${box.y0} L${box.x0 + 14} ${box.y1} L${box.x0 + 6} ${box.y1} Z`} fill="white" opacity="0.22" />
          <path d={`M${box.x1 - 8} ${box.y0} L${box.x1 - 6} ${box.y0} L${box.x1 - 7} ${box.y1} L${box.x1 - 9} ${box.y1} Z`} fill="white" opacity="0.35" />
          <ellipse cx={(box.x0 + box.x1) / 2} cy={top + 1} rx={(box.x1 - box.x0) / 2.4} ry="2.4" fill="white" opacity="0.4" />
        </g>
      )}

      {RIM[cocktail.glass] && <Garnish kind={garnish} at={RIM[cocktail.glass]!} rand={rand} />}
    </svg>
  );
}
