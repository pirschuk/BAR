import { useId } from 'react';
import type { Cocktail, Ice, Ingredient } from '../../types/cocktail';
import { cn } from '../../lib/cn';
import { GEOMETRY } from './GlassIllustration';

// ============================================================================================
// ПРОТОТИП (только витрина): картинка напитка из состава рецепта — работает и для авторских.
// Три варианта графики:
//   mix    — смешанный цвет напитка, лёд, пена / пузырьки (базовый);
//   layers — состав слоями: каждый ингредиент — полоса своего цвета, высота ∝ объёму (как постер-инфографика);
//   aura   — за бокалом светятся пятна цветов ингредиентов (размер ∝ объёму), напиток переливается ими же.
// Украшений нет — решение владельца.
// ============================================================================================

export type DrinkStyle = 'mix' | 'layers' | 'aura';

/** Цвет ингредиента и «сила» окраски: прозрачное (джин, ром) почти не красит, кампари красит сильно */
type Tint = { c: string; w: number; opaque?: boolean; clear?: boolean };
const CLEAR: Tint = { c: '#dfe8ec', w: 0.06, clear: true };
const TINTS: Record<string, Tint> = {
  gin: CLEAR,
  vodka: CLEAR,
  'white-rum': CLEAR,
  pisco: CLEAR,
  maraschino: CLEAR,
  'simple-syrup': { c: '#efe6cf', w: 0.1, clear: true },
  soda: { c: '#e4eef2', w: 0.03, clear: true },
  campari: { c: '#d01431', w: 3 },
  aperol: { c: '#ff5a0a', w: 2.5 },
  'sweet-vermouth': { c: '#7a1d12', w: 1.6 },
  lime: { c: '#b9dc5a', w: 0.6 },
  lemon: { c: '#f2e277', w: 0.6 },
  'pineapple-juice': { c: '#f7cf45', w: 1 },
  'coconut-cream': { c: '#f7f1e3', w: 1.4, opaque: true },
  cream: { c: '#f3e8d6', w: 1.4, opaque: true },
  'egg-white': { c: '#fbf6ea', w: 0.2, opaque: true },
  'creme-de-violette': { c: '#8a5fd1', w: 8 },
  'coffee-liqueur': { c: '#4a2412', w: 2 },
  'sparkling-wine': { c: '#f1db7e', w: 0.5 },
  angostura: { c: '#7a2416', w: 0.5 },
  mint: { c: '#5fbf5a', w: 0.3 },
  sugar: { c: '#f6f1e4', w: 0.05, clear: true },
};

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (rgb: number[]) => '#' + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const mix = (a: string, b: string, t: number) => toHex(hex(a).map((v, i) => v + (hex(b)[i]! - v) * t));

/** Объём строки для картинки, мл: «долить» — 60, барная ложка — 5, дэш/штучное — 2 (видно тонкой полосой) */
const vol = (i: Ingredient) => i.amountMl ?? (i.unit === 'top' ? 60 : i.unit === 'barspoon' ? 5 : 2);

/** Цвет и плотность смеси: средневзвешенное по объёму × силе окраски */
export function drinkColor(c: Pick<Cocktail, 'ingredients'>): { color: string; opacity: number } {
  let r = 0, g = 0, b = 0, sum = 0, total = 0, opaqueVol = 0;
  for (const i of c.ingredients) {
    const t = TINTS[i.ref];
    if (!t) continue;
    const v = vol(i);
    const k = v * t.w;
    const [cr, cg, cb] = hex(t.c);
    r += cr! * k; g += cg! * k; b += cb! * k; sum += k; total += v;
    if (t.opaque) opaqueVol += v;
  }
  if (!sum) return { color: '#dfe8ec', opacity: 0.4 };
  return { color: toHex([r / sum, g / sum, b / sum]), opacity: Math.min(0.97, 0.6 + Math.min(1, sum / total) * 0.35 + (opaqueVol / total) * 0.5) };
}

/** Детерминированный «случай» по id: раскладка льда, пузырьков, пятен ауры у каждого коктейля своя */
function rng(seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/** Габариты чаши из пути */
function bounds(body: string) {
  const n = body.match(/-?\d+(\.\d+)?/g)!.map(Number);
  const xs = n.filter((_, i) => i % 2 === 0);
  const ys = n.filter((_, i) => i % 2 === 1);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}
type Box = ReturnType<typeof bounds>;

function IceLayer({ ice, box, top, rand }: { ice: Ice; box: Box; top: number; rand: () => number }) {
  const fill = 'rgb(255 255 255 / 0.1)';
  const stroke = 'rgb(255 255 255 / 0.65)';
  const w = box.x1 - box.x0;
  if (ice === 'none') return null;
  if (ice === 'big-cube' || ice === 'sphere') {
    const s = Math.min(w * 0.62, 40);
    const cx = (box.x0 + box.x1) / 2;
    const cy = Math.max(top + s / 2 - 6, box.y1 - s / 2 - 10);
    return ice === 'sphere' ? (
      <circle cx={cx} cy={cy} r={s / 2} fill={fill} stroke={stroke} strokeWidth="1.4" />
    ) : (
      <rect x={cx - s / 2} y={cy - s / 2} width={s} height={s} rx="4" fill={fill} stroke={stroke} strokeWidth="1.4" transform={`rotate(${rand() * 10 - 5} ${cx} ${cy})`} />
    );
  }
  const pieces = [];
  if (ice === 'crushed') {
    const n = Math.round(((box.y1 - top) * w) / 90);
    for (let i = 0; i < n; i++) {
      const x = box.x0 + 4 + rand() * (w - 8);
      const y = top + 2 + rand() * (box.y1 - top - 6);
      const k = 3 + rand() * 4;
      pieces.push(<path key={i} d={`M${x} ${y - k} L${x + k} ${y - k * 0.2} L${x + k * 0.4} ${y + k} L${x - k * 0.8} ${y + k * 0.5} Z`} fill={fill} stroke={stroke} strokeOpacity="0.6" strokeWidth="0.8" strokeLinejoin="round" />);
    }
  } else {
    const size = Math.min(16, w * 0.32);
    const count = w > 50 ? 4 : 3;
    for (let i = 0; i < count; i++) {
      const x = box.x0 + 5 + rand() * (w - size - 10);
      const y = top + 4 + (i / count) * (box.y1 - top - size - 10) + rand() * 4;
      pieces.push(<rect key={i} x={x} y={y} width={size} height={size} rx="3" fill={fill} stroke={stroke} strokeWidth="1.2" transform={`rotate(${rand() * 36 - 18} ${x + size / 2} ${y + size / 2})`} />);
    }
  }
  return <g>{pieces}</g>;
}

/** Волнистая граница слоя: y — уровень, phase — сдвиг волны (своя у каждого коктейля) */
const wave = (y: number, amp: number, phase: number) => `M0 ${y} C${20 + phase} ${y - amp} ${40 + phase} ${y + amp} 60 ${y} S${100 + phase} ${y - amp} 120 ${y}`;

type Props = {
  cocktail: Pick<Cocktail, 'id' | 'glass' | 'ice' | 'method' | 'ingredients'>;
  style?: DrinkStyle;
  className?: string;
};

/** Картинка напитка из состава рецепта (прототип) */
export function DrinkArt({ cocktail, style = 'mix', className }: Props) {
  const uid = useId().replace(/:/g, '');
  const g = GEOMETRY[cocktail.glass];
  const box = bounds(g.body);
  const rand = rng(cocktail.id);
  const top = g.liquidTop;
  const refs = new Set(cocktail.ingredients.map((i) => i.ref));
  const fizzy = refs.has('soda') || refs.has('sparkling-wine') || refs.has('tonic') || refs.has('ginger-beer');
  const foam = refs.has('egg-white');
  const frozen = cocktail.method === 'blend';
  const { color, opacity: baseOpacity } = drinkColor(cocktail);
  const opacity = frozen ? Math.max(baseOpacity, 0.92) : baseOpacity;

  // ингредиенты с цветом — для слоёв и ауры (белок — пеной, не слоем)
  const parts = cocktail.ingredients
    .filter((i) => TINTS[i.ref] && i.ref !== 'egg-white')
    .map((i) => ({ ref: i.ref, v: vol(i), t: TINTS[i.ref]! }));
  const partsVol = parts.reduce((s, p) => s + p.v, 0) || 1;

  const bubbles = fizzy
    ? Array.from({ length: 14 }, () => ({ x: box.x0 + 6 + rand() * (box.x1 - box.x0 - 12), y: top + 6 + rand() * (box.y1 - top - 14), r: 0.8 + rand() * 1.6 }))
    : [];

  // --- слои: снизу вверх в порядке рецепта ---
  let layers: { y: number; h: number; c: string; o: number }[] = [];
  if (style === 'layers') {
    let y = box.y1;
    const height = box.y1 - top;
    layers = parts.map((p) => {
      const h = Math.max(3, (p.v / partsVol) * height);
      y -= h;
      // прозрачное (джин, ром, содовая) — светлое «стекло жидкости», цветное — плотное
      return { y, h, c: p.t.clear ? '#ffffff' : p.t.c, o: p.t.clear ? 0.26 : 0.95 };
    });
  }

  // --- аура: пятна цветов за бокалом, крупнее у бо́льших объёмов; прозрачные — бледнее ---
  const cx = (box.x0 + box.x1) / 2;
  const cy = (top + box.y1) / 2;
  const blobs =
    style === 'aura'
      ? parts.map((p, i) => {
          const a = (i / parts.length) * Math.PI * 2 + rand() * 1.2;
          const d = 14 + rand() * 18;
          return { x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d * 0.8, r: 16 + Math.sqrt(p.v) * 4.2, c: p.t.c, o: p.t.clear ? 0.35 : 0.85 };
        })
      : [];
  const auraStops = style === 'aura' ? parts.filter((p) => !p.t.clear).sort((a, b) => b.v - a.v) : [];

  return (
    <svg viewBox="0 0 120 160" className={cn('overflow-visible', className)} aria-hidden>
      <defs>
        <clipPath id={`c${uid}`}>
          <path d={g.body} />
        </clipPath>
        <linearGradient id={`l${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix(color, '#ffffff', 0.06)} />
          <stop offset="1" stopColor={mix(color, '#000000', 0.35)} />
        </linearGradient>
        {auraStops.length > 0 && (
          <linearGradient id={`a${uid}`} x1="0" y1="0" x2="1" y2="1">
            {auraStops.map((p, i) => (
              <stop key={p.ref} offset={auraStops.length === 1 ? 0 : i / (auraStops.length - 1)} stopColor={p.t.c} />
            ))}
          </linearGradient>
        )}
        <linearGradient id={`s${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="white" stopOpacity="0.5" />
          <stop offset="0.35" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <filter id={`b${uid}`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>

      {/* аура за бокалом */}
      {blobs.length > 0 && (
        <g filter={`url(#b${uid})`}>
          {blobs.map((b, i) => (
            <circle key={i} cx={b.x} cy={b.y} r={b.r} fill={b.c} opacity={b.o} />
          ))}
        </g>
      )}

      <g clipPath={`url(#c${uid})`}>
        {/* тёмная подложка под напитком (в «слоях» — нет: прозрачные слои должны оставаться светлыми) */}
        {style !== 'layers' && <rect x="0" y={top} width="120" height="160" fill="black" opacity={style === 'aura' ? 0.2 : 0.4} />}

        {style === 'layers' ? (
          <g>
            {layers.map((l, i) => (
              <path key={i} d={`${wave(l.y, i === layers.length - 1 ? 0 : 1.6, (rand() - 0.5) * 16)} V${l.y + l.h + 2} H0 Z`} fill={l.c} opacity={l.o} />
            ))}
            {/* граница-блик между слоями */}
            {layers.slice(0, -1).map((l, i) => (
              <path key={`b${i}`} d={wave(l.y, 1.6, 0)} fill="none" stroke="white" strokeOpacity="0.35" strokeWidth="0.8" />
            ))}
          </g>
        ) : (
          <rect x="0" y={top} width="120" height="160" fill={style === 'aura' && auraStops.length ? `url(#a${uid})` : `url(#l${uid})`} opacity={style === 'aura' ? Math.max(opacity, 0.85) : opacity} />
        )}

        <rect x="0" y={top} width="120" height="1.6" fill="white" opacity="0.55" />
        {foam && <rect x="0" y={top} width="120" height="9" fill="#fbf6ea" opacity="0.95" />}
        {style !== 'layers' && refs.has('cream') && cocktail.method === 'build' && (
          <path d={`M0 ${top} H120 V${top + 14} Q90 ${top + 22} 60 ${top + 12} Q30 ${top + 4} 0 ${top + 16} Z`} fill="#f3e8d6" opacity="0.92" />
        )}
        {frozen
          ? Array.from({ length: 40 }, (_, i) => <circle key={i} cx={box.x0 + rand() * (box.x1 - box.x0)} cy={top + rand() * (box.y1 - top)} r={0.6 + rand()} fill="white" opacity={0.35 + rand() * 0.4} />)
          : style !== 'layers' && <IceLayer ice={cocktail.ice} box={box} top={top} rand={rand} />}
        {bubbles.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={p.r} fill="none" stroke="white" strokeOpacity="0.75" strokeWidth="0.8" />
        ))}
        <rect x="0" y="0" width="120" height="160" fill={`url(#s${uid})`} opacity="0.5" />
      </g>

      <path d={g.body} fill="white" fillOpacity="0.04" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
      {g.extra && <path d={g.extra} fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" />}
    </svg>
  );
}
