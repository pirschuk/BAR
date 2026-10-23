import { Flame, Martini, Shuffle, Snowflake } from 'lucide-react';
import type { Cocktail } from '../types/cocktail';
import { glassLabel, iceLabel, methodLabel, strengthLabel, strengthLevel } from '../lib/cocktails';
import { StrengthTicks, type Param } from './ui/ParamTiles';

/** 4 параметра рецепта для ParamTiles: метод, бокал, лёд, крепость словом + деления */
export function cocktailParams(c: Cocktail): Param[] {
  return [
    { icon: Shuffle, label: 'Метод', value: methodLabel(c.method) },
    { icon: Martini, label: 'Бокал', value: glassLabel(c.glass) },
    { icon: Snowflake, label: 'Лёд', value: iceLabel(c.ice) },
    { icon: Flame, label: 'Крепость', value: strengthLabel(c.strength), extra: <StrengthTicks level={strengthLevel(c.abv)} /> },
  ];
}
