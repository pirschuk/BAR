import { Flame, Martini, Shuffle, Snowflake } from 'lucide-react';
import type { Cocktail } from '../types/cocktail';
import { glassLabel, iceLabel, methodLabel, strengthLevel } from '../lib/cocktails';
import { StrengthMeter, type Stat } from './ui/StatGrid';

/** 4 параметра рецепта для StatGrid: метод, бокал, лёд, крепость */
export function cocktailStats(c: Cocktail): Stat[] {
  return [
    { icon: Shuffle, label: 'Метод', value: methodLabel(c.method) },
    { icon: Martini, label: 'Бокал', value: glassLabel(c.glass) },
    { icon: Snowflake, label: 'Лёд', value: iceLabel(c.ice) },
    { icon: Flame, label: 'Крепость', value: <StrengthMeter level={strengthLevel(c.abv)} abv={c.abv} /> },
  ];
}
