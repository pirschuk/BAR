import type { Cocktail, Ingredient } from '../types/cocktail';
import { getIngredient } from './filters';

// --- Вид напитка из состава: цвет смеси и плотность (картинка DrinkArtReal) ---

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (rgb: number[]) => '#' + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
/** Смешать два цвета: t = 0 — a, t = 1 — b */
export const mixColor = (a: string, b: string, t: number) => toHex(hex(a).map((v, i) => v + (hex(b)[i]! - v) * t));

/** Объём строки для картинки, мл: «долить» — 60, барная ложка — 5, дэш и штучное — 2 */
export const artVolume = (i: Ingredient) => i.amountMl ?? (i.unit === 'top' ? 60 : i.unit === 'barspoon' ? 5 : 2);

/**
 * Цвет смеси — средневзвешенное цветов по объёму × силе окраски (look.tint); плотность — от «окрашенности»
 * и доли непрозрачного (сливки, пюре). Ингредиенты-«не жидкость» (мята, дольки) цвет не меняют.
 */
export function drinkColor(c: Pick<Cocktail, 'ingredients'>): { color: string; opacity: number } {
  let r = 0, g = 0, b = 0, sum = 0, total = 0, opaqueVol = 0;
  for (const i of c.ingredients) {
    const look = getIngredient(i.ref)?.look;
    if (!look || look.body === 'none') continue;
    const v = artVolume(i);
    const k = v * look.tint;
    const [cr, cg, cb] = hex(look.color);
    r += cr! * k; g += cg! * k; b += cb! * k; sum += k; total += v;
    if (look.body === 'opaque') opaqueVol += v;
  }
  if (!sum || !total) return { color: '#dfe8ec', opacity: 0.4 };
  // прозрачная смесь (джин-тоник, палома) остаётся прозрачной: плотность растёт с окрашенностью и долей непрозрачного
  return { color: toHex([r / sum, g / sum, b / sum]), opacity: Math.min(0.96, 0.28 + Math.min(1, sum / total) * 0.7 + (opaqueVol / total) * 0.6) };
}
