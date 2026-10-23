---
name: cocktail-data
description: Схема и правила данных рецептов коктейлей в src/data/cocktails.json и словаря ингредиентов src/data/ingredients.json — поля, единицы (мл), ингредиенты и их ref, метод, бокал, лёд, теги и вкусы, словари и правила валидации. Использовать при добавлении, правке или проверке рецептов и при типизации данных в коде.
---

# Данные коктейлей

Файлы: `src/data/cocktails.json` — массив объектов `Cocktail`;
`src/data/ingredients.json` — словарь ингредиентов `IngredientDef[]`.
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

type Base = "gin" | "rum" | "whiskey" | "tequila" | "vodka" | "brandy" | "aperitif" | "non-alcoholic";

type Cover = {
  from: string;            // "#RRGGBB" — верх градиента, светлее/ярче
  to: string;              // "#RRGGBB" — низ градиента, тёмный: относительная яркость < 0.15
};

type Ingredient = {
  ref: string;             // id из словаря ingredients.json: "gin", "lime"
  name: string;            // "Джин", с заглавной — для отображения
  amountMl?: number;       // объём в мл — основная единица
  amount?: number;         // для штучных: 1, 2, 0.5
  unit?: "ml" | "dash" | "barspoon" | "piece" | "slice" | "leaf" | "pinch" | "top";
  // unit "top" — «долить»: без amountMl/amount, при пересчёте порций не умножается
  optional?: boolean;
  category: "spirit" | "liqueur" | "wine" | "bitter" | "syrup" | "juice" | "soda" | "dairy" | "egg" | "garnish" | "other";
};
```

## Словарь ингредиентов (`src/data/ingredients.json`)

```ts
type IngredientDef = {
  id: string;        // kebab-case латиницей: "campari"
  name: string;      // "Кампари", с заглавной
  aliases: string[]; // нижний регистр, латиница и рус.: ["campari", "кампари"]; включает name в нижнем регистре
  group: "spirit" | "liqueur" | "bitter" | "syrup" | "juice-fruit" | "soda" | "other";
  pantry?: true;     // всегда есть дома: вода, сахар, соль, перец
  popular?: true;    // ~12 самых ходовых (не pantry): группа «Популярное», быстрый старт
};
```

- **Один продукт — один id.** «Сок лайма» и «Долька лайма» → `lime`;
  «Сахар», «Сахар-рафинад», «Коричневый сахар» → `sugar` (pantry);
  «Текила бланко»/«Текила репосадо» → `tequila`; «Просекко»/«Шампанское» →
  `sparkling-wine`; «Трипл сек»/«Апельсиновый кюрасао» → `triple-sec`;
  «Эспрессо»/«Горячий кофе» → `coffee`. Название в рецепте (`name`) может
  уточнять продукт, `ref` — нет.
- Группы: вермуты, херес, игристое — `liqueur` (модификаторы на вине);
  свежие фрукты, соки и мята — `juice-fruit`; молочное, яйцо, кофе, чай,
  соусы, пряности — `other`.
- Гарнир (`garnish`) — свободная строка, `ref` не имеет; в словарь попадает
  только то, что есть в `ingredients[]` (например, мята в Мохито).
- Новый `ref` заводится в словаре одновременно с рецептом; неиспользуемых
  id в словаре нет (кроме pantry).

## Словари

- `Method`: `build` (в бокале), `stir` (смешать в стакане), `shake`,
  `dry-shake`, `blend`, `muddle`, `layer`, `throw`.
- `Glass` — **утверждённый список из 10 бокалов** (решение владельца, 2026-10-23), у каждого
  свой силуэт в `GlassIllustration`, без маппинга «на ближайший»:
  `rocks` (Рокс), `highball` (Хайбол), `collins` (Коллинз), `coupe` (Купе),
  `martini` (Мартини), `flute` (Флюте), `wine` (Винный), `hurricane` (Харрикейн),
  `copper-mug` (Медная кружка), `irish-coffee` (Айриш-кофе).
  Новый бокал — только вместе с новым силуэтом и записью в этот список.
  Лёд на иконке не рисуется (поле `ice` — в параметрах рецепта), поэтому бокал
  всегда выглядит одинаково.
- `Base` (в этом порядке — и порядок массива): `gin`, `rum`, `whiskey`,
  `tequila`, `vodka`, `brandy`, `aperitif`, `non-alcoholic` — главная база
  для чипсов, не обязательно крепчайший ингредиент (Негрони, Апероль Шприц →
  `aperitif`; писко, коньяк, Вье Карре → `brandy`).
- `Ingredient.unit`: `ml` (по умолчанию для `amountMl`), `dash` (дэш), `barspoon`
  (бар. л.), `piece` (шт.), `slice` (долька), `leaf` (лист), `pinch` (щепотка),
  `top` — «долить»: количество не указывается, при пересчёте порций
  (`amountMl × n`, `amount × n`) не умножается.
- `Ice`: `none` (подача без льда), `cubes`, `big-cube`, `crushed`, `sphere`.
- `Tag` (свободный список, но предпочтительно из словаря): `classic`, `sour`,
  `bitter`, `sweet`, `fruity`, `herbal`, `citrus`, `creamy`, `spicy`,
  `refreshing`, `summer`, `winter`, `brunch`, `aperitif`, `digestif`,
  `tiki`, `party`, `easy`, `non-alcoholic`.
- **Вкус** (фасет фильтра) — подмножество тегов: `sour`, `sweet`, `bitter`,
  `fruity`, `herbal`, `refreshing`, `creamy`, `spicy`. У каждого коктейля
  ≥ 1 вкусовой тег.
- Безалкогольные: `base: "non-alcoholic"`, `abv: 0`,
  `strength: "non-alcoholic"`, тег `non-alcoholic`.

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
9. `base` — из словаря `Base`; на каждую базу ≥ 5 коктейлей; массив
   упорядочен по базам.
10. `cover.from` и `cover.to` — hex `^#[0-9A-Fa-f]{6}$`;
    относительная яркость `cover.to` (WCAG, sRGB) < 0.15, чтобы белый текст
    названия читался; `from` светлее `to`.
11. `glass` — из утверждённого списка 10 бокалов (см. словари); `coupe`, `martini`, `flute` — без льда.
12. Рецепты — классические спецификации (IBA/общепринятые); при сомнении —
   пометка в отчёте, а не выдумка.
13. У каждого ингредиента есть `ref`, он существует в словаре; одно
    `name` — всегда один и тот же `ref`.
14. Словарь: `id` уникальны и kebab-case, `aliases` непусты и в нижнем
    регистре, `group` из списка; каждый id используется хотя бы в одном
    рецепте (pantry — только предупреждение).
15. ≥ 1 вкусовой тег; `base: non-alcoholic` ⇔ `abv: 0`.

## Исключение из правила «только токены»

`cover.from` / `cover.to` — это **данные** конкретного напитка (атмосферный
цвет, близкий к реальному: Негрони — рубиново-красный → тёмно-бордовый,
Дайкири — бледный лаймово-кремовый → тёмный оливково-зелёный), а не UI-токены.
Компоненты применяют их как inline-градиент обложки; это разрешённое
исключение из правила «никаких #hex в компонентах». Сами hex живут только
в `cocktails.json`, не в коде компонентов.

## Проверка

`node scripts/validate-cocktails.mjs` — валидирует всю базу по правилам выше,
ненулевой код выхода при ошибках. Проверяет и словарь `ingredients.json`.

## Пример

```json
{
  "id": "negroni",
  "name": "Негрони",
  "nameEn": "Negroni",
  "description": "Горько-сладкий итальянский аперитив в равных пропорциях.",
  "ingredients": [
    { "ref": "gin", "name": "Джин", "amountMl": 30, "category": "spirit" },
    { "ref": "campari", "name": "Кампари", "amountMl": 30, "category": "bitter" },
    { "ref": "sweet-vermouth", "name": "Красный вермут", "amountMl": 30, "category": "wine" }
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
