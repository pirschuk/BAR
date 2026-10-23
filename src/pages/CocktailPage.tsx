import { useEffect, useRef, useState } from 'react';
import { Heart, Wrench } from 'lucide-react';
import { missing, toolsFor, useInventory } from '../lib/inventory';
import { AvailabilityLine, InfoNote } from '../components/ui/Availability';
import { useLocation, useNavigate, useParams } from 'react-router';
import { getCocktail, scaleIngredient, servingVolume, type Servings } from '../lib/cocktails';
import { CocktailHero } from '../components/ui/CocktailHero';
import { NavBar } from '../components/ui/NavBar';
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
  // навбар появляется, когда низ обложки (с названием) ушёл под верхние 64px экрана
  const heroEnd = useRef<HTMLDivElement>(null);
  const [navVisible, setNavVisible] = useState(false);
  useEffect(() => {
    const el = heroEnd.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e && setNavVisible(!e.isIntersecting && e.boundingClientRect.top < 64), {
      rootMargin: '-64px 0px 0px 0px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, [cocktail?.id]);

  if (!cocktail) return <NotFoundPage title="Коктейль не найден" />;

  // пришли из приложения — назад по истории (фильтр и скролл каталога сохраняются), иначе — в каталог
  const back = () => (location.key !== 'default' ? navigate(-1) : navigate('/'));

  const isFav = favorites.has(cocktail.id);
  const toggleFav = () => setToast(favorites.toggle(cocktail.id) ? (n) => n + 1 : 0);

  const lacking = missing(cocktail, inv);
  const lackingRefs = new Set(lacking.map((m) => m.ref));
  const toolHints = inv.size ? toolsFor(cocktail).filter((t) => !inv.has(t.id)) : [];

  return (
    // тинт напитка: цвет обложки продолжается под контентом и растворяется в фоне
    <main className="recipe-tint min-h-svh pb-safe" style={coverStyle(cocktail)}>
      <NavBar title={cocktail.name} onBack={back} visible={navVisible} action={<FavoriteButton place="bar" on={isFav} onToggle={toggleFav} />} />
      <CocktailHero cocktail={cocktail} onBack={back} action={<FavoriteButton place="cover" on={isFav} onToggle={toggleFav} />} />
      <div ref={heroEnd} aria-hidden />

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
      {toast > 0 && (
        <Toast key={toast} icon={Heart} text="В избранном" action={<ToastAction to="/?fav=1">Открыть</ToastAction>} onDone={() => setToast(0)} />
      )}
    </main>
  );
}
