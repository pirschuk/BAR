import { describe, expect, it } from 'vitest';
import { cocktails, countLabel, filterByBase, getCocktail, scaleIngredient, strengthLevel } from './cocktails';

describe('countLabel', () => {
  it.each([
    [1, '1 коктейль'],
    [2, '2 коктейля'],
    [5, '5 коктейлей'],
    [11, '11 коктейлей'],
    [12, '12 коктейлей'],
    [21, '21 коктейль'],
    [22, '22 коктейля'],
  ])('%i → %s', (n, label) => expect(countLabel(n)).toBe(label));
});

describe('scaleIngredient', () => {
  it('умножает мл на порции', () => {
    expect(scaleIngredient({ name: 'Джин', amountMl: 30, category: 'spirit' }, 4)).toEqual({ value: '120', unit: 'мл' });
  });
  it('«долить» не умножается', () => {
    expect(scaleIngredient({ name: 'Содовая', unit: 'top', category: 'soda' }, 4)).toEqual({ value: '', unit: 'долить' });
  });
  it('штучные — со склонением и дробями', () => {
    expect(scaleIngredient({ name: 'Мята', amount: 12, unit: 'leaf', category: 'garnish' }, 2)).toEqual({ value: '24', unit: 'листа' });
    expect(scaleIngredient({ name: 'Лайм', amount: 0.5, unit: 'slice', category: 'garnish' }, 1)).toEqual({ value: '½', unit: 'дольки' });
    expect(scaleIngredient({ name: 'Ангостура', amount: 2, unit: 'dash', category: 'bitter' }, 2)).toEqual({ value: '4', unit: 'дэш' });
  });
});

describe('каталог', () => {
  it('по 2 коктейля на каждую базу', () => {
    expect(filterByBase(cocktails, 'rum')).toHaveLength(2);
    expect(filterByBase(cocktails, null)).toHaveLength(12);
  });
  it('поиск по id', () => {
    expect(getCocktail('negroni')?.name).toBe('Негрони');
    expect(getCocktail('nope')).toBeUndefined();
  });
  it('крепость в 4 деления', () => {
    expect([0, 8, 15, 24, 30].map(strengthLevel)).toEqual([0, 1, 2, 3, 4]);
  });
});
