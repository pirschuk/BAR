// Схема — .claude/skills/cocktail-data/SKILL.md

export type Base = 'gin' | 'rum' | 'whiskey' | 'tequila' | 'vodka' | 'aperitif';

export type Method = 'build' | 'stir' | 'shake' | 'dry-shake' | 'blend' | 'muddle' | 'layer' | 'throw';

export type Glass =
  | 'rocks'
  | 'double-rocks'
  | 'highball'
  | 'collins'
  | 'coupe'
  | 'martini'
  | 'nick-and-nora'
  | 'hurricane'
  | 'wine'
  | 'flute'
  | 'copper-mug'
  | 'tiki'
  | 'shot';

export type Ice = 'none' | 'cubes' | 'big-cube' | 'crushed' | 'sphere';

export type Strength = 'non-alcoholic' | 'light' | 'medium' | 'strong';

export type Unit = 'ml' | 'dash' | 'barspoon' | 'piece' | 'slice' | 'leaf' | 'pinch' | 'top';

export type IngredientCategory =
  | 'spirit'
  | 'liqueur'
  | 'wine'
  | 'bitter'
  | 'syrup'
  | 'juice'
  | 'soda'
  | 'dairy'
  | 'egg'
  | 'garnish'
  | 'other';

export type Ingredient = {
  name: string;
  amountMl?: number;
  amount?: number;
  unit?: Unit;
  optional?: boolean;
  category: IngredientCategory;
};

export type Cover = {
  from: string;
  to: string;
};

export type Cocktail = {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  image?: string;
  ingredients: Ingredient[];
  method: Method;
  steps: string[];
  glass: Glass;
  ice: Ice;
  garnish?: string;
  abv: number;
  strength: Strength;
  difficulty: 1 | 2 | 3;
  timeMin: number;
  tags: string[];
  iba?: boolean;
  base: Base;
  cover: Cover;
};
