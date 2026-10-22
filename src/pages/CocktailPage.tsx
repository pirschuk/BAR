import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { getCocktail, scaleIngredient, type Servings } from '../lib/cocktails';
import { CocktailHero } from '../components/ui/CocktailHero';
import { StatGrid } from '../components/ui/StatGrid';
import { SectionHeader } from '../components/ui/SectionHeader';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { IngredientRow } from '../components/ui/IngredientRow';
import { StepList } from '../components/ui/StepList';
import { cocktailStats } from '../components/cocktailStats';
import { NotFoundPage } from './NotFoundPage';

export const SERVINGS: { value: Servings; label: string }[] = [
  { value: 1, label: '1×' },
  { value: 2, label: '2×' },
  { value: 4, label: '4×' },
];

export function CocktailPage() {
  const { slug } = useParams();
  const cocktail = getCocktail(slug);
  const navigate = useNavigate();
  const location = useLocation();
  const [servings, setServings] = useState<Servings>(1);
  // отметки живут, пока открыта страница; смена порций их не сбрасывает
  const [checked, setChecked] = useState<ReadonlySet<number>>(new Set());

  if (!cocktail) return <NotFoundPage title="Коктейль не найден" />;

  // пришли из приложения — назад по истории (фильтр и скролл каталога сохраняются), иначе — в каталог
  const back = () => (location.key !== 'default' ? navigate(-1) : navigate('/'));
  const toggle = (i: number) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (!next.delete(i)) next.add(i);
      return next;
    });

  return (
    <main className="pb-safe">
      <CocktailHero cocktail={cocktail} onBack={back} />

      <p className="mt-4 px-4 text-body text-fg-2">{cocktail.description}</p>
      <StatGrid items={cocktailStats(cocktail)} className="mx-4 mt-5" />

      <SectionHeader
        title="Ингредиенты"
        className="mt-6"
        action={<SegmentedControl label="Порции" options={SERVINGS} value={servings} onChange={setServings} />}
      />
      <ul className="mt-1">
        {cocktail.ingredients.map((ing, i) => (
          <li key={ing.name}>
            <IngredientRow
              name={ing.name}
              optional={ing.optional}
              amount={scaleIngredient(ing, servings)}
              checked={checked.has(i)}
              onToggle={() => toggle(i)}
            />
          </li>
        ))}
      </ul>
      {cocktail.garnish && (
        <p className="mt-2 px-4 text-subhead text-fg-2">Украшение: {cocktail.garnish.toLowerCase()}</p>
      )}

      <SectionHeader title="Приготовление" className="mt-8" />
      <StepList steps={cocktail.steps} className="mt-2" />
    </main>
  );
}
