import { useState } from 'react';
import { Wrench } from 'lucide-react';
import { missing, toolsFor, useInventory } from '../lib/inventory';
import { AvailabilityLine, InfoNote } from '../components/ui/Availability';
import { useLocation, useNavigate, useParams } from 'react-router';
import { GARNISH_AMOUNT, getCocktail, scaleIngredient, servingVolume, type Servings } from '../lib/cocktails';
import { CocktailHero } from '../components/ui/CocktailHero';
import { ParamTiles } from '../components/ui/ParamTiles';
import { SectionHeader } from '../components/ui/SectionHeader';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { IngredientList, IngredientTile } from '../components/ui/IngredientTile';
import { Steps } from '../components/ui/Steps';
import { cocktailParams } from '../components/cocktailStats';
import { coverStyle } from '../components/ui/CocktailCard';
import { NotFoundPage } from './NotFoundPage';

export const SERVINGS: { value: Servings; label: string }[] = [
  { value: 1, label: '1×' },
  { value: 2, label: '2×' },
  { value: 4, label: '4×' },
];

/** «~3 мин» — мета-пилюля «Приготовления» */
export const timeMeta = (timeMin: number) => `~${timeMin} мин`;

export function CocktailPage() {
  const { slug } = useParams();
  const cocktail = getCocktail(slug);
  const navigate = useNavigate();
  const location = useLocation();
  const [servings, setServings] = useState<Servings>(1);
  const { inv } = useInventory();

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
        className="mt-10"
        action={
          // выход порции — рядом с множителем [Alma]: в строку с Unbounded-заголовком не входит
          <div className="flex items-center justify-between gap-3">
            <SegmentedControl size="l" label="Порции" options={SERVINGS} value={servings} onChange={setServings} />
            <span className="text-right text-subhead text-fg-2 tabular-nums">{servingVolume(cocktail, servings)}</span>
          </div>
        }
      />
      <div className="mx-4 mt-2">
        {inv.size === 0 ? (
          <AvailabilityLine state="empty-bar" />
        ) : lacking.length === 0 ? (
          <AvailabilityLine state="all" />
        ) : (
          <AvailabilityLine state="missing" names={lacking.map((m) => m.name)} />
        )}
      </div>
      <IngredientList className="mx-4 mt-2">
        {cocktail.ingredients.map((ing) => (
          <IngredientTile
            key={ing.name}
            name={ing.name}
            optional={ing.optional}
            amount={scaleIngredient(ing, servings)}
            missing={inv.size > 0 && lackingRefs.has(ing.ref)}
          />
        ))}
        {cocktail.garnish && <IngredientTile name={cocktail.garnish} amount={GARNISH_AMOUNT} />}
      </IngredientList>

      <SectionHeader size="l" title="Приготовление" meta={timeMeta(cocktail.timeMin)} className="mt-10" />
      <Steps steps={cocktail.steps} className="mt-5" />
      {toolHints.map((t) => (
        <InfoNote key={t.id} tile icon={Wrench} className="mx-4 mt-6">
          Понадобится {t.name.toLowerCase()} — {t.substitute}.
        </InfoNote>
      ))}
    </main>
  );
}
