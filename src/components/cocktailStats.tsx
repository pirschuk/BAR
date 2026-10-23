import { Flame, Martini, Shuffle, Snowflake } from 'lucide-react';
import type { Cocktail } from '../types/cocktail';
import { glassLabel, iceLabel, methodLabel, strengthLabel } from '../lib/cocktails';
import type { Param } from './ui/ParamTiles';

/** Цвет слова крепости: от зелёного (без алкоголя) к красному (крепкий) */
export const STRENGTH_TONE: Record<Cocktail['strength'], string> = {
  'non-alcoholic': 'text-strength-none',
  light: 'text-strength-light',
  medium: 'text-strength-medium',
  strong: 'text-strength-strong',
};

/** 4 параметра рецепта для ParamTiles: метод, бокал, лёд, крепость словом и цветом */
export function cocktailParams(c: Cocktail): Param[] {
  return [
    { icon: Shuffle, label: 'Метод', value: methodLabel(c.method) },
    { icon: Martini, label: 'Бокал', value: glassLabel(c.glass) },
    { icon: Snowflake, label: 'Лёд', value: iceLabel(c.ice) },
    { icon: Flame, label: 'Крепость', value: strengthLabel(c.strength), tone: STRENGTH_TONE[c.strength] },
  ];
}
