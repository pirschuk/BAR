import { useRef, useState } from 'react';
import { Heart, Pencil, Wrench } from 'lucide-react';
import { IconButton } from '../components/ui/Button';
import { setNav } from '../lib/motion';
import { missing, toolsFor, useInventory } from '../lib/inventory';
import { AvailabilityLine, InfoNote } from '../components/ui/Availability';
import { useLocation, useNavigate, useParams } from 'react-router';
import { getCocktail, scaleIngredient, servingVolume, type Servings } from '../lib/cocktails';
import { CocktailHero } from '../components/ui/CocktailHero';
import { NavBar, useNavReveal } from '../components/ui/NavBar';
import { FavoriteButton } from '../components/ui/FavoriteButton';
import { Toast, ToastAction } from '../components/ui/Toast';
import { useFavorites } from '../lib/favorites';
import { ParamTiles } from '../components/ui/ParamTiles';
import { SectionHeader } from '../components/ui/SectionHeader';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { GarnishNote, IngredientList, IngredientTile } from '../components/ui/IngredientTile';
import { Steps } from '../components/ui/Steps';
import { cocktailParams } from '../components/cocktailStats';
import { coverStyle } from '../components/ui/CocktailCard';
import { NotFoundPage } from './NotFoundPage';
import { TermSheet, useTermSheet } from '../components/TermSheet';

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
  const favorites = useFavorites();
  // тост — только на добавление [Swiggy]: показывает, где искать избранное
  const [toast, setToast] = useState(0);
  // навбар проявляется, как только заголовок подходит к нему
  const titleRef = useRef<HTMLHeadingElement>(null);
  const navVisible = useNavReveal(titleRef, [cocktail?.id]);
  // тап по плитке «Метод / Бокал / Лёд» — статья «Барной азбуки» в шторке
  const { term, openTerm, closeTerm } = useTermSheet();

  if (!cocktail) return <NotFoundPage title="Коктейль не найден" />;

  // пришли из приложения — назад по истории (фильтр и скролл каталога сохраняются), иначе — в каталог
  const back = () => (location.key !== 'default' ? navigate(-1) : (setNav('back'), navigate('/', { viewTransition: true })));

  const isFav = favorites.has(cocktail.id);
  const toggleFav = () => setToast(favorites.toggle(cocktail.id) ? (n) => n + 1 : 0);

  const lacking = missing(cocktail, inv);
  const lackingRefs = new Set(lacking.map((m) => m.ref));
  const toolHints = inv.size ? toolsFor(cocktail).filter((t) => !inv.has(t.id)) : [];

  return (
    // тинт напитка: цвет обложки продолжается под контентом и растворяется в фоне
    <main className="recipe-tint min-h-svh pb-safe" style={coverStyle(cocktail)}>
      {/* «Назад» и ♡ закреплены сразу (навбар), обложка — без своих кнопок */}
      <NavBar title={cocktail.name} onBack={back} visible={navVisible} action={
          // авторский — «Изменить» рядом с ♡
          cocktail.custom ? (
            <div className="flex gap-2">
              <IconButton icon={Pencil} label="Изменить" variant="glass" size="xl" iconClassName="size-6!" onClick={() => navigate(`/cocktail/${cocktail.id}/edit`, { viewTransition: true })} />
              <FavoriteButton on={isFav} onToggle={toggleFav} />
            </div>
          ) : (
            <FavoriteButton on={isFav} onToggle={toggleFav} />
          )
        }
      />
      <CocktailHero cocktail={cocktail} titleRef={titleRef} />

      <p className="mt-2 px-4 text-body text-fg-2">{cocktail.description}</p>
      <ParamTiles items={cocktailParams(cocktail, (kind, id) => openTerm({ kind, id }))} className="mx-4 mt-5" />

      <SectionHeader
        size="l"
        title="Ингредиенты"
        className="mt-10"
        action={
          // выход порции — рядом с множителем [Alma]: в строку с Unbounded-заголовком не входит
          <div className="flex items-center justify-between gap-3">
            <SegmentedControl label="Порции" options={SERVINGS} value={servings} onChange={setServings} />
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
      </IngredientList>
      {cocktail.garnish && <GarnishNote value={cocktail.garnish} className="mx-4 mt-3" />}

      <SectionHeader size="l" title="Приготовление" meta={timeMeta(cocktail.timeMin)} className="mt-10" />
      {/* инструмент нужен до начала — подсказка перед первым шагом */}
      {toolHints.map((t) => (
        <InfoNote key={t.id} tile icon={Wrench} className="mx-4 mt-4">
          Понадобится {t.name.toLowerCase()} — {t.substitute}.
        </InfoNote>
      ))}
      <Steps steps={cocktail.steps} className="mt-5" />
      <TermSheet term={term} open={!!term} onClose={closeTerm} />
      {toast > 0 && (
        <Toast key={toast} icon={Heart} text="В избранном" action={<ToastAction to="/?fav=1">Открыть</ToastAction>} onDone={() => setToast(0)} />
      )}
    </main>
  );
}
