import { describe, expect, it } from 'vitest';
import { BASES, cocktails, countLabel, filterByBase, getCocktail, scaleIngredient, strengthLevel } from './cocktails';
import {
  EMPTY_FILTERS,
  activeCount,
  applyFilters,
  facetLabel,
  filtersToParams,
  ingredients,
  matchesQuery,
  parseFilters,
  similarFor,
  suggestIngredients,
} from './filters';

describe('countLabel', () => {
  it.each([
    [1, '1 коктейль'],
    [2, '2 коктейля'],
    [5, '5 коктейлей'],
    [11, '11 коктейлей'],
    [21, '21 коктейль'],
    [52, '52 коктейля'],
  ])('%i → %s', (n, label) => expect(countLabel(n)).toBe(label));
});

describe('scaleIngredient', () => {
  it('умножает мл на порции', () => {
    expect(scaleIngredient({ ref: 'gin', name: 'Джин', amountMl: 30, category: 'spirit' }, 4)).toEqual({ value: '120', unit: 'мл' });
  });
  it('«долить» не умножается', () => {
    expect(scaleIngredient({ ref: 'soda', name: 'Содовая', unit: 'top', category: 'soda' }, 4)).toEqual({ value: '', unit: 'долить' });
  });
  it('штучные — со склонением и дробями', () => {
    expect(scaleIngredient({ ref: 'mint', name: 'Мята', amount: 12, unit: 'leaf', category: 'garnish' }, 2)).toEqual({ value: '24', unit: 'листа' });
    expect(scaleIngredient({ ref: 'lime', name: 'Лайм', amount: 0.5, unit: 'slice', category: 'garnish' }, 1)).toEqual({ value: '½', unit: 'дольки' });
  });
});

describe('база', () => {
  it('≥ 48 коктейлей, каждая база ≥ 5', () => {
    expect(cocktails.length).toBeGreaterThanOrEqual(48);
    for (const b of BASES) expect(filterByBase(cocktails, b.id).length, b.id).toBeGreaterThanOrEqual(5);
  });
  it('ref каждого ингредиента есть в словаре', () => {
    const ids = new Set(ingredients.map((i) => i.id));
    for (const c of cocktails) for (const i of c.ingredients) expect(ids.has(i.ref), `${c.id}: ${i.ref}`).toBe(true);
  });
  it('поиск по id и крепость в 4 деления', () => {
    expect(getCocktail('negroni')?.name).toBe('Негрони');
    expect([0, 8, 15, 24, 30].map(strengthLevel)).toEqual([0, 1, 2, 3, 4]);
  });
});

describe('поиск', () => {
  const negroni = getCocktail('negroni')!;
  it('по названию RU/EN, без учёта регистра', () => {
    expect(matchesQuery(negroni, 'НЕГРОНИ')).toBe(true);
    expect(matchesQuery(negroni, 'negroni')).toBe(true);
  });
  it('по ингредиенту и синониму', () => {
    expect(matchesQuery(negroni, 'кампари')).toBe(true);
    expect(matchesQuery(negroni, 'campari')).toBe(true);
    expect(matchesQuery(negroni, 'текила')).toBe(false);
  });
  it('все слова запроса должны найтись', () => {
    expect(matchesQuery(negroni, 'джин кампари')).toBe(true);
    expect(matchesQuery(negroni, 'джин мята')).toBe(false);
  });
  it('подсказка-ингредиент по началу слова', () => {
    expect(suggestIngredients('камп', cocktails).map((d) => d.id)).toContain('campari');
    expect(suggestIngredients('к', cocktails)).toEqual([]);
  });
});

describe('фильтры', () => {
  it('URL ↔ состояние, мусор отбрасывается', () => {
    const f = parseFilters(new URLSearchParams('q=лайм&base=rum,gin,zzz&taste=sour&strength=light&ing=nope'));
    expect(f).toEqual({ q: 'лайм', base: ['rum', 'gin'], taste: ['sour'], strength: ['light'], ing: null });
    expect(filtersToParams(f)).toEqual({ q: 'лайм', base: 'rum,gin', taste: 'sour', strength: 'light' });
    expect(filtersToParams(EMPTY_FILTERS)).toEqual({});
  });
  it('внутри фасета — ИЛИ, между фасетами — И', () => {
    const rumOrGin = applyFilters(cocktails, { ...EMPTY_FILTERS, base: ['rum', 'gin'] });
    expect(rumOrGin.every((c) => c.base === 'rum' || c.base === 'gin')).toBe(true);
    const sourRum = applyFilters(cocktails, { ...EMPTY_FILTERS, base: ['rum'], taste: ['sour'] });
    expect(sourRum.length).toBeGreaterThan(0);
    expect(sourRum.every((c) => c.base === 'rum' && c.tags.includes('sour'))).toBe(true);
  });
  it('фильтр по ингредиенту', () => {
    const withCampari = applyFilters(cocktails, { ...EMPTY_FILTERS, ing: 'campari' });
    expect(withCampari.map((c) => c.id)).toContain('negroni');
    expect(withCampari.every((c) => c.ingredients.some((i) => i.ref === 'campari'))).toBe(true);
  });
  it('бейдж и подпись фасета', () => {
    const f = { ...EMPTY_FILTERS, base: ['rum', 'gin'] as const, taste: ['sour'] as const, ing: 'campari' };
    const state = { ...f, base: [...f.base], taste: [...f.taste] };
    expect(activeCount(state)).toBe(4);
    expect(facetLabel('base', state)).toBe('Ром +1');
    expect(facetLabel('taste', state)).toBe('Кислый');
    expect(facetLabel('strength', state)).toBe('Крепость');
  });
  it('«Похожие» не пустые, даже если выдача пуста', () => {
    expect(similarFor(cocktails, { ...EMPTY_FILTERS, q: 'zzz', base: ['rum'] }).length).toBeGreaterThan(0);
  });
});
