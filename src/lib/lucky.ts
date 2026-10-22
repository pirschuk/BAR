// «Мне повезёт»: перемешанная колода без повторов, по кругу.

export type Deck = { order: string[]; index: number };

/** Фишер — Йейтс; random подменяется в тестах */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function makeDeck(ids: readonly string[], random: () => number = Math.random): Deck {
  return { order: shuffle(ids, random), index: 0 };
}

export function current(deck: Deck): string | undefined {
  return deck.order[deck.index];
}

/** Следующая карта; когда колода кончилась — новая перетасовка, первая карта не равна последней показанной */
export function next(deck: Deck, random: () => number = Math.random): Deck {
  if (deck.index + 1 < deck.order.length) return { ...deck, index: deck.index + 1 };
  const last = current(deck);
  const order = shuffle(deck.order, random);
  if (order.length > 1 && order[0] === last) [order[0], order[1]] = [order[1]!, order[0]!];
  return { order, index: 0 };
}

/** Карта под верхней (выглядывает сзади) */
export function peek(deck: Deck): string | undefined {
  if (deck.order.length < 2) return undefined;
  return deck.order[deck.index + 1] ?? deck.order[0];
}
