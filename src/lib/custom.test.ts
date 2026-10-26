import { describe, expect, it } from 'vitest';
import data from '../data/cocktails.json';
import type { Cocktail } from '../types/cocktail';
import { baseOf, computeAbv, draftErrors, EMPTY_DRAFT, lineFor, strengthOf, toCocktail } from './custom';

const base = data as Cocktail[];

describe('крепость авторских — формула откалибрована на базе', () => {
  it('≥ 90% базовых рецептов — в пределах 4 п.п. от их abv', () => {
    const diffs = base.map((c) => ({ id: c.id, want: c.abv, got: computeAbv(c.ingredients, c.method, c.glass) }));
    const ok = diffs.filter((d) => Math.abs(d.got - d.want) <= 4);
    if (ok.length / diffs.length < 0.9) console.table(diffs.filter((d) => Math.abs(d.got - d.want) > 4));
    expect(ok.length / diffs.length).toBeGreaterThanOrEqual(0.9);
  });
  it('безалкогольный — 0, слово по порогам', () => {
    expect(strengthOf(0)).toBe('non-alcoholic');
    expect(strengthOf(11)).toBe('light');
    expect(strengthOf(22)).toBe('medium');
    expect(strengthOf(23)).toBe('strong');
  });
});

describe('черновик', () => {
  it('пустой — нельзя сохранить', () => {
    expect(draftErrors(EMPTY_DRAFT).length).toBeGreaterThan(0);
  });
  it('собранный — Cocktail с custom и посчитанной крепостью', () => {
    const d = {
      ...EMPTY_DRAFT,
      name: 'Мескаль Негрони',
      ingredients: [
        { ref: 'mezcal', name: '', amountMl: 30, category: 'spirit' as const },
        { ref: 'campari', name: '', amountMl: 30, category: 'bitter' as const },
        { ref: 'sweet-vermouth', name: '', amountMl: 30, category: 'wine' as const },
      ],
      steps: ['Перемешать со льдом', ''],
    };
    expect(draftErrors(d)).toEqual([]);
    const c = toCocktail(d, 1000);
    expect(c.custom).toBe(true);
    expect(c.ingredients.map((i) => i.name)).toEqual(['Мескаль', 'Кампари', 'Красный вермут']);
    expect(c.steps).toEqual(['Перемешать со льдом']);
    // ≈ 22% — как у классического Негрони (24) с поправкой на разбавление
    expect(c.abv).toBeGreaterThanOrEqual(20);
    expect(c.abv).toBeLessThanOrEqual(26);
  });
  it('свой ингредиент не пройдёт', () => {
    const d = { ...EMPTY_DRAFT, name: 'X', steps: ['a'], ingredients: [{ ref: 'elderflower-homemade', name: 'Бузина', amountMl: 30, category: 'syrup' as const }, { ref: 'gin', name: '', amountMl: 30, category: 'spirit' as const }] };
    expect(draftErrors(d)).toContain('Ингредиенты — только из справочника');
  });
});

describe('база по составу', () => {
  // негрони в каталоге — «Аперитив» (редакторский выбор: джин, кампари и вермут поровну); правило даёт «Джин»
  it('совпадает с base у базовых рецептов (кроме негрони)', () => {
    const wrong = base.filter((c) => c.id !== 'negroni' && baseOf(c.ingredients) !== c.base).map((c) => `${c.id}: ${baseOf(c.ingredients)} ≠ ${c.base}`);
    expect(wrong).toEqual([]);
  });
  it('поровну крепких (Лонг-Айленд) — тот, что выше в списке', () => {
    const li = ['vodka', 'gin', 'white-rum', 'tequila'].map((ref) => ({ ...lineFor(ref), amountMl: 15 }));
    expect(baseOf(li)).toBe('vodka');
    expect(baseOf([li[2]!, ...li])).toBe('rum');
  });
  it('без крепкого — аперитив, без алкоголя — безалкогольный', () => {
    expect(baseOf([lineFor('campari'), lineFor('soda')])).toBe('aperitif');
    expect(baseOf([lineFor('lime'), lineFor('soda')])).toBe('non-alcoholic');
  });
});
