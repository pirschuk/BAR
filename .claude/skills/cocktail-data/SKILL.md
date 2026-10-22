---
name: cocktail-data
description: Схема и правила данных рецептов коктейлей в src/data/cocktails.json — поля, единицы (мл), ингредиенты, метод, бокал, лёд, теги, словари и правила валидации. Использовать при добавлении, правке или проверке рецептов и при типизации данных в коде.
---

# Данные коктейлей

Файл: `src/data/cocktails.json` — массив объектов `Cocktail`.
Типы в коде: `src/types/cocktail.ts` должны совпадать с этой схемой.

## Схема

```ts
type Cocktail = {
  id: string;              // kebab-case латиницей, уникальный: "negroni", "whiskey-sour"
  name: string;            // русское название: "Негрони"
  nameEn: string;          // оригинальное: "Negroni"
  description: string;     // 1–2 предложения, ≤ 160 символов
  image?: string;          // путь от /public: "/cocktails/negroni.webp"; нет — плейсхолдер
  ingredients: Ingredient[];
  method: Method;
  steps: string[];         // 2–6 шагов, каждый — одно действие, повелительное наклонение
  glass: Glass;
  ice: Ice;
  garnish?: string;        // "Апельсиновая цедра"
  abv: number;             // ориентировочная крепость готового напитка, %, 0–45
  strength: "non-alcoholic" | "light" | "medium" | "strong"; // 0 | <12 | 12–22 | >22 % ABV
  difficulty: 1 | 2 | 3;
  timeMin: number;         // минуты приготовления
  tags: Tag[];
  iba?: boolean;           // входит в список IBA
  base: Base;              // главная база для чипсов каталога (Негрони → "aperitif")
  cover: Cover;            // градиент обложки (данные, не UI-токены — см. ниже)
};

type Base = "gin" | "rum" | "whiskey" | "tequila" | "vodka" | "aperitif";

type Cover = {
  from: string;            // "#RRGGBB" — верх градиента, светлее/ярче
  to: string;              // "#RRGGBB" — низ градиента, тёмный: относительная яркость < 0.15
};

type Ingredient = {
  name: string;            // "Джин", с заглавной
  amountMl?: number;       // объём в мл — основная единица
  amount?: number;         // для штучных: 1, 2, 0.5
  unit?: "ml" | "dash" | "barspoon" | "piece" | "slice" | "leaf" | "pinch" | "top";
  // unit "top" — «долить»: без amountMl/amount, при пересчёте порций не умножается
  optional?: boolean;
  category: "spirit" | "liqueur" | "wine" | "bitter" | "syrup" | "juice" | "soda" | "dairy" | "egg" | "garnish" | "other";
};
```

## Словари

- `Method`: `build` (в бокале), `stir` (смешать в стакане), `shake`,
  `dry-shake`, `blend`, `muddle`, `layer`, `throw`.
- `Glass`: `rocks`, `double-rocks`, `highball`, `collins`, `coupe`, `martini`,
  `nick-and-nora`, `hurricane`, `wine`, `flute`, `copper-mug`, `tiki`, `shot`.
- `Glass` в MVP — только 6 силуэтов: `rocks`, `coupe`, `highball`, `collins`,
  `martini`, `wine`. Остальные значения словаря допустимы в схеме, но в UI
  маппятся на ближайший (`double-rocks`→`rocks`, `nick-and-nora`→`coupe`,
  `copper-mug`→`highball`, `flute`→`wine`, `hurricane`/`tiki`→`collins`,
  `shot`→`rocks`); в данные MVP их не заносим.
- `Base`: `gin`, `rum`, `whiskey`, `tequila`, `vodka`, `aperitif` — главная база
  для чипсов, не обязательно крепчайший ингредиент (Негрони, Апероль Шприц →
  `aperitif`).
- `Ingredient.unit`: `ml` (по умолчанию для `amountMl`), `dash` (дэш), `barspoon`
  (бар. л.), `piece` (шт.), `slice` (долька), `leaf` (лист), `pinch` (щепотка),
  `top` — «долить»: количество не указывается, при пересчёте порций
  (`amountMl × n`, `amount × n`) не умножается.
- `Ice`: `none` (подача без льда), `cubes`, `big-cube`, `crushed`, `sphere`.
- `Tag` (свободный список, но предпочтительно из словаря): `classic`, `sour`,
  `bitter`, `sweet`, `fruity`, `herbal`, `citrus`, `creamy`, `spicy`,
  `refreshing`, `summer`, `winter`, `brunch`, `aperitif`, `digestif`,
  `tiki`, `party`, `easy`, `non-alcoholic`.

## Правила валидации

1. `id` уникален, kebab-case, `^[a-z0-9-]+$`.
2. Жидкие ингредиенты — `amountMl` (целое, кратное 5, кроме 2.5/7.5 для
   малых доз). `dash`/`barspoon`/`top` — без `amountMl`.
3. Сумма `amountMl` (без `top`) — 40–250 мл; «шот» — до 60.
4. `strength` согласован с `abv` по порогам выше; `abv: 0` ⇔ тег `non-alcoholic`.
5. `method` согласован с шагами (shake → в шагах есть взбивание).
6. `ice: none` для подачи в coupe/martini/nick-and-nora (лёд только при
   приготовлении).
7. Ингредиенты в порядке добавления/важности: база → модификаторы → доливка.
8. Названия ингредиентов единообразны по всей базе (один «Сахарный сироп»,
   а не «Простой сироп»/«Сироп сахарный»).
9. `base` — из словаря `Base`; в MVP-наборе по 2 коктейля на каждую базу.
10. `cover.from` и `cover.to` — hex `^#[0-9A-Fa-f]{6}$`;
    относительная яркость `cover.to` (WCAG, sRGB) < 0.15, чтобы белый текст
    названия читался; `from` светлее `to`.
11. `glass` — из 6 силуэтов MVP (см. словари).
12. Рецепты — классические спецификации (IBA/общепринятые); при сомнении —
   пометка в отчёте, а не выдумка.

## Исключение из правила «только токены»

`cover.from` / `cover.to` — это **данные** конкретного напитка (атмосферный
цвет, близкий к реальному: Негрони — рубиново-красный → тёмно-бордовый,
Дайкири — бледный лаймово-кремовый → тёмный оливково-зелёный), а не UI-токены.
Компоненты применяют их как inline-градиент обложки; это разрешённое
исключение из правила «никаких #hex в компонентах». Сами hex живут только
в `cocktails.json`, не в коде компонентов.

## Проверка

`node scripts/validate-cocktails.mjs` — валидирует всю базу по правилам выше,
ненулевой код выхода при ошибках.

## Пример

```json
{
  "id": "negroni",
  "name": "Негрони",
  "nameEn": "Negroni",
  "description": "Горько-сладкий итальянский аперитив в равных пропорциях.",
  "ingredients": [
    { "name": "Джин", "amountMl": 30, "category": "spirit" },
    { "name": "Кампари", "amountMl": 30, "category": "bitter" },
    { "name": "Красный вермут", "amountMl": 30, "category": "wine" }
  ],
  "method": "stir",
  "steps": [
    "Наполни смесительный стакан льдом.",
    "Влей джин, кампари и вермут.",
    "Перемешивай 20–30 секунд.",
    "Процеди в рокс на большой кубик льда, укрась цедрой апельсина."
  ],
  "glass": "rocks",
  "ice": "big-cube",
  "garnish": "Апельсиновая цедра",
  "abv": 24,
  "strength": "strong",
  "difficulty": 1,
  "timeMin": 3,
  "tags": ["classic", "bitter", "aperitif", "easy"],
  "iba": true,
  "base": "aperitif",
  "cover": { "from": "#E2343F", "to": "#4A0A14" }
}
```
