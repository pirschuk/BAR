import { useState } from 'react';
import { Citrus, Wrench } from 'lucide-react';
import { missing, toolsFor, useInventory } from '../lib/inventory';
import { AvailabilityBanner, InfoNote } from '../components/ui/Availability';
import { useLocation, useNavigate, useParams } from 'react-router';
import { getCocktail, plural, scaleIngredient, type Servings } from '../lib/cocktails';
import { CocktailHero } from '../components/ui/CocktailHero';
import { ParamTiles } from '../components/ui/ParamTiles';
import { SectionHeader } from '../components/ui/SectionHeader';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { IngredientTile } from '../components/ui/IngredientTile';
import { Steps } from '../components/ui/Steps';
import { cocktailParams } from '../components/cocktailStats';
import { coverStyle } from '../components/ui/CocktailCard';
import { NotFoundPage } from './NotFoundPage';

export const SERVINGS: { value: Servings; label: string }[] = [
  { value: 1, label: '1×' },
  { value: 2, label: '2×' },
  { value: 4, label: '4×' },
];

/** «4 шага · ~3 мин» — мета-пилюля «Приготовления» */
export function stepsMeta(steps: number, timeMin: number) {
  return `${steps} ${plural(steps, ['шаг', 'шага', 'шагов'])} · ~${timeMin} мин`;
}

export function CocktailPage() {
  const { slug } = useParams();
  const cocktail = getCocktail(slug);
  const navigate = useNavigate();
  const location = useLocation();
  const [servings, setServings] = useState<Servings>(1);
  const { inv, add } = useInventory();
  const [justAdded, setJustAdded] = useState(false);

  if (!cocktail) return <NotFoundPage title="Коктейль не найден" />;

  // пришли из приложения — назад по истории (фильтр и скролл каталога сохраняются), иначе — в каталог
  const back = () => (location.key !== 'default' ? navigate(-1) : navigate('/'));

  const lacking = missing(cocktail, inv);
  const lackingRefs = new Set(lacking.map((m) => m.ref));
  const toolHints = inv.size ? toolsFor(cocktail).filter((t) => !inv.has(t.id)) : [];

  return (
    // тинт напитка: цвет обложки продолжается под контентом и растворяется в фоне
    <main className="recipe-tint min-h-svh pb-safe" style={coverStyle(cocktail)}>
      <CocktailHero cocktail={cocktail} onBack={back} />

      <p className="mt-2 px-4 text-body text-fg-2">{cocktail.description}</p>
      <ParamTiles items={cocktailParams(cocktail)} className="mx-4 mt-5" />

      <SectionHeader
        size="l"
        title="Ингредиенты"
        className="mt-8"
        action={<SegmentedControl size="l" label="Порции" options={SERVINGS} value={servings} onChange={setServings} />}
      />
      <ul className="mt-3 flex flex-col gap-2 px-4">
        <li>
          {inv.size === 0 ? (
            <AvailabilityBanner tile state="empty-bar" />
          ) : lacking.length === 0 ? (
            <AvailabilityBanner tile state="all" focusOnMount={justAdded} />
          ) : (
            <AvailabilityBanner tile state="missing" names={lacking.map((m) => m.name)} onHave={() => (add(lacking.map((m) => m.ref)), setJustAdded(true))} />
          )}
        </li>
        {cocktail.ingredients.map((ing) => (
          <li key={ing.name}>
            <IngredientTile
              name={ing.name}
              optional={ing.optional}
              amount={scaleIngredient(ing, servings)}
              missing={inv.size > 0 && lackingRefs.has(ing.ref)}
            />
          </li>
        ))}
        {cocktail.garnish && (
          <li>
            <IngredientTile name={cocktail.garnish} note="Украшение" icon={Citrus} />
          </li>
        )}
      </ul>

      <SectionHeader size="l" title="Приготовление" meta={stepsMeta(cocktail.steps.length, cocktail.timeMin)} className="mt-10" />
      <Steps steps={cocktail.steps} className="mt-4" />
      {toolHints.map((t) => (
        <InfoNote key={t.id} tile icon={Wrench} className="mx-4 mt-6">
          Нужен {t.name.toLowerCase()} — {t.substitute}.
        </InfoNote>
      ))}
    </main>
  );
}
