import { cn } from '../../lib/cn';

/**
 * Линейные силуэты для «Барной азбуки» — в стиле GlassIllustration: белый контур 2.5, заливка 6%,
 * «жидкость»/акцент 22%. viewBox 120×120, предмет вписан в поле 8…112.
 * body — контур с заливкой; lines — детали без заливки; fill — плотные мелкие части.
 */
type Shape = { body?: string; lines?: string; fill?: string };

const SHAPES: Record<string, Shape> = {
  // двойной конус
  'tool-jigger': {
    body: 'M36 14 L84 14 L64 58 L56 58 Z M56 62 L64 62 L86 106 L34 106 Z',
    lines: 'M52 60 L68 60',
  },
  // шейкер «кобблер»: крышка, ситечко, корпус
  'tool-shaker': {
    body: 'M53 8 Q60 3 67 8 L67 17 L53 17 Z M47 19 L73 19 L77 36 L43 36 Z M42 39 L78 39 L72 108 Q72 114 66 114 L54 114 Q48 114 48 108 Z',
    lines: 'M46 58 L74 58',
  },
  // длинная витая ложка по диагонали
  'tool-barspoon': {
    body: 'M22 108 Q16 98 26 94 Q36 92 36 100 Q34 110 22 108 Z',
    lines: 'M34 96 L92 20 M44 86 L50 90 M52 75 L58 79 M60 64 L66 68 M68 53 L74 57 M76 42 L82 46',
    fill: 'M96 16 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0',
  },
  // толстостенный стакан с носиком и гранями
  'tool-mixing-glass': {
    body: 'M30 22 L90 22 L86 106 Q86 114 78 114 L42 114 Q34 114 34 106 Z',
    lines: 'M30 22 L23 15 M46 30 L47 104 M60 30 L60 104 M74 30 L73 104',
  },
  // хоторн: диск с пружиной и ручкой
  'tool-strainer': {
    body: 'M20 54 A30 30 0 1 0 80 54 A30 30 0 1 0 20 54 Z M80 46 L112 36 Q116 40 113 44 L82 58 Z',
    lines:
      'M26 80 q4 7 8 0 q4 7 8 0 q4 7 8 0 q4 7 8 0 q4 7 8 0 q4 7 8 0 M38 48 h0 M50 42 h0 M62 48 h0 M44 60 h0 M56 60 h0 M50 70 h0',
  },
  // ситечко-конус с ручкой
  'tool-fine-strainer': {
    body: 'M22 44 L90 44 Q86 84 56 104 Q26 84 22 44 Z',
    lines: 'M90 44 L114 34 M22 44 L12 44 M34 58 L78 58 M40 72 L72 72 M48 86 L64 86 M44 46 L50 96 M56 46 L56 102 M68 46 L62 96',
  },
  // деревянный пестик с зубчатой головкой
  'tool-muddler': {
    body: 'M54 8 Q60 4 66 8 L67 92 L53 92 Z M48 94 L72 94 L72 108 L68 104 L64 110 L60 104 L56 110 L52 104 L48 108 Z',
  },
  // Y-образный нож для цедры
  'tool-peeler': {
    body: 'M54 64 L66 64 L64 112 Q60 116 56 112 Z',
    lines: 'M60 64 L36 28 M60 64 L84 28 M32 26 L88 26 M38 32 L82 32',
  },
  // кувшин на моторе
  'tool-blender': {
    body: 'M38 18 L82 18 L76 76 L44 76 Z M34 80 L86 80 L90 112 L30 112 Z',
    lines: 'M34 12 L86 12 M50 66 L70 62 M60 64 L60 76',
    fill: 'M60 96 m-6 0 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0',
  },

  // --- лёд ---
  'ice-cubes': {
    body: 'M14 60 L44 52 L52 82 L22 90 Z M58 34 L88 26 L96 56 L66 64 Z M60 74 L90 70 L94 100 L64 104 Z',
  },
  'ice-big-cube': {
    body: 'M60 18 L98 36 L98 82 L60 102 L22 82 L22 36 Z',
    lines: 'M22 36 L60 56 L98 36 M60 56 L60 102',
  },
  'ice-crushed': {
    body:
      'M14 96 L28 80 L44 90 L36 108 Z M40 74 L58 66 L64 84 L48 92 Z M62 88 L78 78 L90 94 L74 106 Z M80 66 L98 62 L102 80 L86 84 Z M24 64 L40 56 L46 72 L30 78 Z M50 46 L66 40 L72 56 L56 62 Z M88 96 L104 92 L108 108 L92 110 Z M46 98 L60 94 L64 110 L50 112 Z',
  },
  'ice-sphere': {
    body: 'M22 62 A38 38 0 1 0 98 62 A38 38 0 1 0 22 62 Z',
    lines: 'M38 50 Q44 36 58 32',
  },
  'ice-none': {
    lines: 'M24 60 A36 36 0 1 0 96 60 A36 36 0 1 0 24 60 M35 35 L85 85',
  },
};

export const hasToolIllustration = (id: string) => id in SHAPES;

/** Силуэт инструмента или льда по id статьи (`tool-shaker`, `ice-crushed`); нет силуэта — ничего */
export function ToolIllustration({ id, className }: { id: string; className?: string }) {
  const s = SHAPES[id];
  if (!s) return null;
  return (
    <svg viewBox="0 0 120 120" className={cn('glass-illustration text-on-media', className)} aria-hidden>
      {s.body && <path d={s.body} fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />}
      {s.lines && <path d={s.lines} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
      {s.fill && <path d={s.fill} fill="currentColor" fillOpacity="0.5" />}
    </svg>
  );
}
