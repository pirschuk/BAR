import { describe, expect, it } from 'vitest';
import { sanitizeFavorites, toggleFavorite } from './favorites';
import { applyFilters, EMPTY_FILTERS, filtersToParams, parseFilters } from './filters';
import { cocktails } from './cocktails';

describe('favorites', () => {
  it('добавленный — в начало, повторный тап убирает', () => {
    expect(toggleFavorite(['negroni'], 'mojito')).toEqual(['mojito', 'negroni']);
    expect(toggleFavorite(['mojito', 'negroni'], 'mojito')).toEqual(['negroni']);
  });
  it('мусор и удалённые из базы id отбрасываются', () => {
    expect(sanitizeFavorites(['negroni', 'no-such', 42, 'negroni'])).toEqual(['negroni']);
    expect(sanitizeFavorites({ a: 1 })).toEqual([]);
  });
  it('фильтр fav=1: в URL и в выдаче', () => {
    const f = parseFilters(new URLSearchParams('fav=1'));
    expect(f.fav).toBe(true);
    expect(filtersToParams(f)).toEqual({ fav: '1' });
    const fav = new Set(['negroni', 'mojito']);
    const out = applyFilters(cocktails, f, undefined, (c) => fav.has(c.id));
    expect(out.map((c) => c.id).sort()).toEqual(['mojito', 'negroni']);
    expect(applyFilters(cocktails, EMPTY_FILTERS).length).toBe(cocktails.length);
  });
});
