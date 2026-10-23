import { describe, expect, it } from 'vitest';
import { cocktails } from './cocktails';
import { effectiveInventory, findBottle, missing, sectionOf, subOf, unlocks, usage, type Bottle } from './inventory';

const laphroaig: Bottle = { id: 'b1', name: 'Laphroaig 10', ref: 'scotch', note: '10 лет' };
const other: Bottle = { id: 'b2', name: 'Сироп лаванды', ref: null };

describe('Мой бар', () => {
  it('бутылка добавляет свой тип в эффективный бар, «Другое» — нет', () => {
    const inv = effectiveInventory(new Set(['lime']), [laphroaig, other]);
    expect([...inv].sort()).toEqual(['lime', 'scotch']);
  });
  it('рецепты видят тип бутылки', () => {
    const c = cocktails.find((x) => x.ingredients.some((i) => i.ref === 'scotch'));
    expect(c).toBeDefined();
    const without = missing(c!, new Set());
    const withBottle = missing(c!, effectiveInventory(new Set(), [laphroaig]));
    expect(withBottle.length).toBe(without.length - 1);
  });
  it('дубль бутылки — по названию без учёта регистра и ё', () => {
    expect(findBottle([laphroaig], '  laphroaig 10 ')).toBe(laphroaig);
    expect(findBottle([laphroaig], 'Lagavulin')).toBeUndefined();
  });
  it('разделы и подкатегории', () => {
    expect([subOf('gin'), sectionOf('gin')]).toEqual(['spirit', 'alcohol']);
    expect([subOf('campari'), sectionOf('campari')]).toEqual(['bitter', 'alcohol']);
    expect([subOf('soda'), sectionOf('soda')]).toEqual(['soda', 'mixers']);
    expect([subOf('tool-shaker'), sectionOf('tool-shaker')]).toEqual(['tools', 'mixers']);
    expect([subOf(null), sectionOf(null)]).toEqual(['custom', 'alcohol']);
  });
  it('«Советуем» в рамках раздела', () => {
    const inv = new Set(['gin', 'sweet-vermouth', 'lime', 'simple-syrup']);
    const alc = unlocks(cocktails, inv, 10, (r) => sectionOf(r) === 'alcohol');
    expect(alc.every((u) => sectionOf(u.ref) === 'alcohol')).toBe(true);
  });
  it('«Докупить»: единственная недостающая, по убыванию', () => {
    const inv = new Set(['gin', 'sweet-vermouth', 'lime', 'simple-syrup']);
    const u = unlocks(cocktails, inv);
    expect(u.length).toBeGreaterThan(0);
    expect(u.length).toBeLessThanOrEqual(3);
    for (let i = 1; i < u.length; i++) expect(u[i - 1]!.count).toBeGreaterThanOrEqual(u[i]!.count);
    expect(unlocks(cocktails, new Set())).toEqual([]);
  });
  it('использование: ингредиент по ref, инструмент по методу', () => {
    expect(usage('lime', cocktails).length).toBe(12);
    expect(usage('tool-blender', cocktails).every((c) => c.method === 'blend')).toBe(true);
  });
});
