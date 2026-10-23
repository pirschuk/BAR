import { describe, expect, it } from 'vitest';
import { BASES, cocktails, countLabel, filterByBase, getCocktail, inCocktailsLabel, scaleIngredient, servingVolume, strengthLevel } from './cocktails';
import { barSummary, canMake, missing, toolsFor } from './inventory';
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
    expect(f).toEqual({ q: 'лайм', base: ['rum', 'gin'], taste: ['sour'], strength: ['light'], ing: null, can: false, fav: false });
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

describe('мой бар', () => {
  const negroni = getCocktail('negroni')!;
  const inv = new Set(['gin', 'campari']);
  it('недостающие — без «всегда есть» и необязательных', () => {
    expect(missing(negroni, inv).map((m) => m.ref)).toEqual(['sweet-vermouth']);
    const sour = getCocktail('whiskey-sour')!;
    expect(missing(sour, new Set(['bourbon', 'lemon', 'simple-syrup']))).toEqual([]);
  });
  it('пустой бар ничего не «может»', () => {
    expect(canMake(negroni, new Set())).toBe(false);
    expect(barSummary(cocktails, new Set())).toEqual({ can: 0, nearly: 0 });
  });
  it('«Могу сделать» в URL и фильтре', () => {
    const f = parseFilters(new URLSearchParams('can=1'));
    expect(f.can).toBe(true);
    expect(filtersToParams(f)).toEqual({ can: '1' });
    expect(activeCount(f)).toBe(1);
    const full = new Set(['gin', 'campari', 'sweet-vermouth']);
    const list = applyFilters(cocktails, f, (c) => canMake(c, full));
    expect(list.map((c) => c.id)).toContain('negroni');
    expect(list.every((c) => canMake(c, full))).toBe(true);
  });
  it('итог: можно и без одного', () => {
    const s = barSummary(cocktails, new Set(['gin', 'campari', 'sweet-vermouth']));
    expect(s.can).toBeGreaterThanOrEqual(1);
    expect(s.nearly).toBeGreaterThanOrEqual(1);
  });
  it('инструменты — по методу', () => {
    expect(toolsFor(getCocktail('daiquiri')!).map((t) => t.id)).toEqual(['tool-shaker']);
    expect(toolsFor(getCocktail('mojito')!).map((t) => t.id)).toEqual(['tool-muddler']);
  });
});

describe('мне повезёт', () => {
  // детерминированный random для воспроизводимости
  const seeded = (seed: number) => () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  it('без повторов, пока колода не пройдена', async () => {
    const { makeDeck, next, current } = await import('./lucky');
    const ids = cocktails.map((c) => c.id);
    const rnd = seeded(1);
    let d = makeDeck(ids, rnd);
    const seen = new Set<string>();
    for (let i = 0; i < ids.length; i++) {
      seen.add(current(d)!);
      d = next(d, rnd);
    }
    expect(seen.size).toBe(ids.length);
  });
  it('после перетасовки первая карта не повторяет последнюю', async () => {
    const { makeDeck, next, current } = await import('./lucky');
    const rnd = seeded(7);
    for (let n = 0; n < 50; n++) {
      let d = makeDeck(['a', 'b', 'c'], rnd);
      d = next(next(d, rnd), rnd);
      const last = current(d);
      expect(current(next(d, rnd))).not.toBe(last);
    }
  });
  it('одна карта — без «хвоста»', async () => {
    const { makeDeck, peek, next, current } = await import('./lucky');
    const d = makeDeck(['negroni']);
    expect(peek(d)).toBeUndefined();
    expect(current(next(d))).toBe('negroni');
  });
});

describe('servingVolume', () => {
  const gin = { ref: 'gin', name: 'Джин', amountMl: 30, category: 'spirit' } as const;
  it('сумма мл, дэши не считаются', () => {
    expect(servingVolume({ glass: 'rocks', ingredients: [gin, gin, { ref: 'bitters', name: 'Биттер', amount: 2, unit: 'dash', category: 'bitter' }] }, 1)).toBe('≈ 60 мл');
  });
  it('доливка до верха — объём бокала, без «+ доливка»', () => {
    expect(servingVolume({ glass: 'highball', ingredients: [gin, { ref: 'tonic', name: 'Тоник', unit: 'top', category: 'soda' }] }, 2)).toBe('≈ 600 мл');
  });
});

describe('inCocktailsLabel', () => {
  it('предложный падеж', () => {
    expect([1, 2, 5, 21].map(inCocktailsLabel)).toEqual(['в 1 коктейле', 'в 2 коктейлях', 'в 5 коктейлях', 'в 21 коктейле']);
  });
});
