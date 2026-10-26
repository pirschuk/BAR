import data from '../data/glossary.json';
import type { Cocktail, Glass, Ice, Method } from '../types/cocktail';
import { GLASSES, ICES, METHODS } from './cocktails';
import { TOOLS } from './inventory';

// --- Барная азбука: статьи из glossary.json, связь с коктейлями считается из cocktails.json ---

export type TermKind = 'glass' | 'tool' | 'method' | 'ice' | 'measure';
export type Term = { kind: TermKind; id: string; name: string; what: string; why: string; substitute?: string };

export const TERMS = data as Term[];

export const TOPICS: { id: TermKind; label: string }[] = [
  { id: 'glass', label: 'Бокалы' },
  { id: 'tool', label: 'Инструменты' },
  { id: 'method', label: 'Методы' },
  { id: 'ice', label: 'Лёд' },
  { id: 'measure', label: 'Меры' },
];
export const isTermKind = (v: string | null): v is TermKind => TOPICS.some((t) => t.id === v);
export const termsOf = (kind: TermKind) => TERMS.filter((t) => t.kind === kind);

/** Хэш шторки статьи: #term-glass-coupe (вид — до первого дефиса, id может содержать дефисы) */
export const termHash = (t: Pick<Term, 'kind' | 'id'>) => `#term-${t.kind}-${t.id}`;
export function termFromHash(hash: string): Term | undefined {
  const m = hash.match(/^#term-(\w+)-(.+)$/);
  return m ? TERMS.find((t) => t.kind === m[1] && t.id === m[2]) : undefined;
}
export const getTerm = (kind: TermKind, id: string) => TERMS.find((t) => t.kind === kind && t.id === id);

/** Объём бокала — из GLASSES (как в порциях), не из текста статьи */
export const glassMl = (id: string) => GLASSES.find((g) => g.id === id)?.ml;

// инструменты без записи в «Моём баре» — с какими методами связаны (для ленты «Коктейли …»)
const TOOL_METHODS: Record<string, Method[]> = {
  ...Object.fromEntries(TOOLS.map((t) => [t.id, t.methods])),
  'tool-mixing-glass': ['stir'],
  'tool-strainer': ['shake', 'stir'],
};

/** Коктейли, где встречается статья; null — связи нет (джиггер, ободок): ленту не показываем */
export function cocktailsFor(t: Term, list: readonly Cocktail[]): Cocktail[] | null {
  switch (t.kind) {
    case 'glass':
      return list.filter((c) => c.glass === (t.id as Glass));
    case 'method':
      return list.filter((c) => c.method === (t.id as Method));
    case 'ice':
      return list.filter((c) => c.ice === (t.id as Ice));
    case 'tool': {
      const m = TOOL_METHODS[t.id];
      return m ? list.filter((c) => m.includes(c.method)) : null;
    }
    case 'measure': {
      const unit = { 'measure-dash': 'dash', 'measure-barspoon': 'barspoon', 'measure-top': 'top' }[t.id];
      if (unit) return list.filter((c) => c.ingredients.some((i) => i.unit === unit));
      if (t.id === 'measure-zest' || t.id === 'measure-twist') return list.filter((c) => /цедр|твист/i.test(c.garnish ?? ''));
      return null;
    }
  }
}

/** Фильтр каталога для «Все N ›»: только бокал, метод, лёд */
export function catalogLink(t: Term): string | null {
  if (t.kind === 'glass' && GLASSES.some((g) => g.id === t.id)) return `/?glass=${t.id}`;
  if (t.kind === 'method' && METHODS.includes(t.id as Method)) return `/?method=${t.id}`;
  if (t.kind === 'ice' && ICES.includes(t.id as Ice)) return `/?ice=${t.id}`;
  return null;
}

/** «Коктейли в купе», «Коктейли с шейкером» — подпись ленты */
export function relatedTitle(t: Term): string {
  if (t.kind === 'glass') return `Коктейли в бокале «${t.name}»`;
  if (t.kind === 'ice') return t.id === 'none' ? 'Коктейли без льда' : `Коктейли со льдом «${t.name.toLowerCase()}»`;
  if (t.kind === 'method') return `Коктейли: ${t.name.toLowerCase()}`;
  return `Где пригодится: ${t.name.toLowerCase()}`;
}
