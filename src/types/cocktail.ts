// Схема — .claude/skills/cocktail-data/SKILL.md

export type Base = 'gin' | 'rum' | 'whiskey' | 'tequila' | 'vodka' | 'brandy' | 'aperitif' | 'non-alcoholic';

export type Taste = 'sour' | 'sweet' | 'bitter' | 'fruity' | 'herbal' | 'refreshing' | 'creamy' | 'spicy';

export type Method = 'build' | 'stir' | 'shake' | 'dry-shake' | 'blend' | 'muddle' | 'layer' | 'throw';

/** Утверждённый список бокалов (10): у каждого свой силуэт в GlassIllustration, без подмен */
export type Glass =
  | 'rocks'
  | 'highball'
  | 'collins'
  | 'coupe'
  | 'martini'
  | 'flute'
  | 'wine'
  | 'hurricane'
  | 'copper-mug'
  | 'irish-coffee';

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
  /** id из словаря src/data/ingredients.json */
  ref: string;
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

export type IngredientGroup = 'spirit' | 'liqueur' | 'bitter' | 'syrup' | 'juice-fruit' | 'soda' | 'other';

/** Словарь ингредиентов — src/data/ingredients.json */
export type IngredientDef = {
  id: string;
  name: string;
  aliases: string[];
  group: IngredientGroup;
  /** вода, лёд, сахар, соль — всегда «есть» */
  pantry?: boolean;
  popular?: boolean;
};
