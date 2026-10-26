import { useMemo, useRef, useState } from 'react';
import { useBlocker, useLocation, useNavigate, useParams } from 'react-router';
import { Flame, Martini, Plus, Shuffle, Snowflake, Trash2 } from 'lucide-react';
import { BASES, GLASSES, ICES, METHODS, getCocktail, glassLabel, iceLabel, methodLabel } from '../lib/cocktails';
import { COVERS, EMPTY_DRAFT, baseOf, computeAbv, coverFor, draftErrors, lineFor, stepOf, strengthOf, toCocktail, toDraft, useCustomCocktails, type Draft } from '../lib/custom';
import type { Base, Glass, Ice, Method } from '../types/cocktail';
import { NavBar, useNavReveal } from '../components/ui/NavBar';
import { CocktailHero } from '../components/ui/CocktailHero';
import { TextField } from '../components/ui/TextField';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Button } from '../components/ui/Button';
import { BottomSheet } from '../components/ui/BottomSheet';
import { PickRow } from '../components/ui/BarRows';
import { AbvLine, ColorDots, IngredientEditRow, ParamPickRow, StepEditRow, Stepper, TextArea } from '../components/ui/EditorFields';
import { IngredientPickSheet } from '../components/IngredientPickSheet';
import { NotFoundPage } from './NotFoundPage';
import { scaleIngredient } from '../lib/cocktails';

type Param = 'base' | 'glass' | 'method' | 'ice';

const OPTIONS: Record<Param, { title: string; items: { id: string; label: string }[] }> = {
  base: { title: 'База', items: BASES },
  glass: { title: 'Бокал', items: GLASSES },
  method: { title: 'Метод', items: METHODS.map((id) => ({ id, label: methodLabel(id) })) },
  ice: { title: 'Лёд', items: ICES.map((id) => ({ id, label: iceLabel(id) })) },
};

function move<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [x] = next.splice(from, 1);
  next.splice(to, 0, x!);
  return next;
}

/**
 * Редактор авторского коктейля: /new и /cocktail/:slug/edit.
 * Превью-обложка → название, описание → параметры (шторки выбора) → ингредиенты только из справочника
 * со степпером и живой крепостью → украшение → шаги. «Сохранить» — в навбаре, пока форма неполная — disabled.
 */
export function CocktailEditorPage() {
  const { slug } = useParams();
  const editing = slug ? getCocktail(slug) : undefined;
  const navigate = useNavigate();
  const location = useLocation();
  const { upsert, remove } = useCustomCocktails();

  const initial = useMemo(() => (editing?.custom ? toDraft(editing) : EMPTY_DRAFT), [editing]);
  const [d, setD] = useState<Draft>(initial);
  // база и обложка следуют за составом, пока их не выбрали вручную
  const [manual, setManual] = useState({ base: !!editing, cover: !!editing });
  const set = (patch: Partial<Draft>) =>
    setD((x) => {
      const next = { ...x, ...patch };
      if (patch.ingredients && !manual.base) next.base = baseOf(patch.ingredients) ?? next.base;
      if (!manual.cover) next.cover = coverFor(next.base);
      return next;
    });
  const dirty = JSON.stringify(d) !== JSON.stringify(initial);
  const errors = draftErrors(d);
  const abv = d.ingredients.length ? computeAbv(d.ingredients, d.method, d.glass) : undefined;
  const preview = toCocktail({ ...d, name: d.name || 'Название', ingredients: d.ingredients.filter((i) => i.ref) }, 0);

  const titleRef = useRef<HTMLHeadingElement>(null);
  const navVisible = useNavReveal(titleRef);

  // --- шторки — в хэше: «Назад» закрывает шторку, а не форму ---
  const sheet = location.hash.slice(1);
  const openSheet = (id: string) => navigate({ hash: id }, { state: { sheet: true }, preventScrollReset: true });
  const closeSheet = () => {
    if ((location.state as { sheet?: boolean } | null)?.sheet) navigate(-1);
    else navigate({ hash: '' }, { replace: true, preventScrollReset: true });
  };

  // уход с несохранёнными правками — спросить; переходы по хэшу шторок и сохранение не блокируются
  const leaving = useRef(false);
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && !leaving.current && currentLocation.pathname !== nextLocation.pathname);

  if (slug && !editing?.custom) return <NotFoundPage title="Коктейль не найден" />;

  const back = () => (location.key !== 'default' ? navigate(-1) : navigate(editing ? `/cocktail/${editing.id}` : '/'));
  const save = () => {
    const c = toCocktail(d);
    upsert(c);
    leaving.current = true;
    // новый — рецепт вместо формы; правка — назад к рецепту
    if (editing && location.key !== 'default') navigate(-1);
    else navigate(`/cocktail/${c.id}`, { replace: true });
  };
  const del = () => {
    if (!editing) return;
    remove(editing.id);
    leaving.current = true;
    navigate('/', { replace: true, state: { deleted: editing } });
  };

  const picked = new Set(d.ingredients.map((i) => i.ref));
  const toggleIngredient = (ref: string) =>
    set({ ingredients: picked.has(ref) ? d.ingredients.filter((i) => i.ref !== ref) : [...d.ingredients, lineFor(ref)] });
  const setAmount = (index: number, v: number) =>
    set({ ingredients: d.ingredients.map((i, k) => (k !== index ? i : i.amountMl !== undefined ? { ...i, amountMl: v } : { ...i, amount: v })) });
  const pick = (param: Param, id: string) => {
    if (param === 'base') {
      setManual((m) => ({ ...m, base: true }));
      set({ base: id as Base });
    } else if (param === 'glass') set({ glass: id as Glass });
    else if (param === 'method') set({ method: id as Method });
    else set({ ice: id as Ice });
    closeSheet();
  };
  const param = (Object.keys(OPTIONS) as Param[]).find((p) => sheet === `pick-${p}`);
  const value: Record<Param, string> = { base: BASES.find((b) => b.id === d.base)!.label, glass: glassLabel(d.glass), method: methodLabel(d.method), ice: iceLabel(d.ice) };

  return (
    <main className="min-h-svh bg-bg pb-safe">
      <NavBar
        title={editing ? 'Изменить коктейль' : 'Новый коктейль'}
        tone="plain"
        onBack={back}
        visible={navVisible}
        action={
          <Button className="h-nav-btn! rounded-full! px-5!" disabled={errors.length > 0} onClick={save}>
            Сохранить
          </Button>
        }
      />
      <CocktailHero cocktail={preview} titleRef={titleRef} height="preview" />

      <div className="mt-4 px-4">
        <ColorDots items={COVERS} value={d.cover} onChange={(cover) => (setManual((m) => ({ ...m, cover: true })), setD((x) => ({ ...x, cover })))} />
      </div>

      <div className="mt-6 flex flex-col gap-4 px-4">
        <TextField label="Название" value={d.name} onChange={(name) => set({ name })} placeholder="Например: Вечер в Оахаке" maxLength={40} />
        <TextArea label="Описание" value={d.description} onChange={(description) => set({ description })} placeholder="Каким получился — пара слов о вкусе" maxLength={200} />
      </div>

      <SectionHeader size="l" title="Параметры" className="mt-10" />
      <div className="mt-3 flex flex-col gap-2 px-4">
        <ParamPickRow icon={Flame} label="База" value={value.base} onClick={() => openSheet('pick-base')} />
        <ParamPickRow icon={Martini} label="Бокал" value={value.glass} onClick={() => openSheet('pick-glass')} />
        <ParamPickRow icon={Shuffle} label="Метод" value={value.method} onClick={() => openSheet('pick-method')} />
        <ParamPickRow icon={Snowflake} label="Лёд" value={value.ice} onClick={() => openSheet('pick-ice')} />
      </div>

      <SectionHeader size="l" title="Ингредиенты" meta={d.ingredients.length || undefined} className="mt-10" />
      <div className="px-4">
        <AbvLine abv={abv} strength={abv === undefined ? undefined : strengthOf(abv)} />
      </div>
      {d.ingredients.length > 0 && (
        <ul className="mt-1 flex flex-col gap-2 px-4">
          {d.ingredients.map((ing, k) => {
            const top = ing.unit === 'top';
            const amount = ing.amountMl ?? ing.amount;
            return (
              <IngredientEditRow
                key={ing.ref}
                index={k}
                name={ing.name}
                onMove={(from, to) => set({ ingredients: move(d.ingredients, from, to) })}
                onRemove={() => set({ ingredients: d.ingredients.filter((_, j) => j !== k) })}
                stepper={
                  <Stepper
                    label={`Количество: ${ing.name}`}
                    value={top ? undefined : amount}
                    unit={scaleIngredient(ing, 1).unit}
                    step={stepOf(ing)}
                    min={stepOf(ing)}
                    onChange={top ? undefined : (v) => setAmount(k, v)}
                  />
                }
              />
            );
          })}
        </ul>
      )}
      <div className="mt-3 px-4">
        <Button variant="secondary" icon={Plus} className="w-full" onClick={() => openSheet('add-ingredients')}>
          {d.ingredients.length ? 'Добавить ещё' : 'Добавить ингредиенты'}
        </Button>
      </div>
      <TextField className="mx-4 mt-5" label="Украшение" value={d.garnish} onChange={(garnish) => set({ garnish })} placeholder="Например: цедра апельсина" maxLength={60} />

      <SectionHeader size="l" title="Приготовление" className="mt-10" />
      <ol className="mt-3 flex flex-col gap-2 px-4">
        {d.steps.map((s, k) => (
          <StepEditRow
            key={k}
            index={k}
            value={s}
            onChange={(v) => set({ steps: d.steps.map((x, j) => (j === k ? v : x)) })}
            onMove={(from, to) => set({ steps: move(d.steps, from, to) })}
            onRemove={() => set({ steps: d.steps.length > 1 ? d.steps.filter((_, j) => j !== k) : [''] })}
          />
        ))}
      </ol>
      <div className="mt-3 px-4">
        <Button variant="secondary" icon={Plus} className="w-full" onClick={() => set({ steps: [...d.steps, ''] })}>
          Добавить шаг
        </Button>
      </div>

      {errors.length > 0 && (
        <p className="mt-6 px-4 text-footnote text-fg-2" aria-live="polite">
          Чтобы сохранить, нужно: {errors.map((e) => e.toLowerCase()).join(', ')}
        </p>
      )}
      {editing && (
        <div className="mt-8 px-4">
          <Button variant="plain" icon={Trash2} className="w-full text-danger!" onClick={del}>
            Удалить коктейль
          </Button>
        </div>
      )}
      <div className="h-10" />

      {/* выбор параметра — список с радио, тап выбирает и закрывает */}
      <BottomSheet open={!!param} onClose={closeSheet} title={param ? OPTIONS[param].title : ''}>
        <div className="pb-4">
          {param &&
            OPTIONS[param].items.map((o) => (
              <PickRow key={o.id} radio title={o.label} on={d[param] === o.id} onToggle={() => pick(param, o.id)} />
            ))}
        </div>
      </BottomSheet>
      <IngredientPickSheet open={sheet === 'add-ingredients'} onClose={closeSheet} picked={picked} onToggle={toggleIngredient} />

      {/* выход с несохранёнными правками */}
      <BottomSheet open={blocker.state === 'blocked'} onClose={() => blocker.reset?.()} title="Выйти без сохранения?">
        <p className="px-4 text-body text-fg-2">Изменения в коктейле пропадут.</p>
        <div className="flex flex-col gap-2 px-4 pt-5 pb-4">
          <Button className="w-full" onClick={() => blocker.reset?.()}>
            Продолжить редактирование
          </Button>
          <Button variant="plain" className="w-full text-danger!" onClick={() => blocker.proceed?.()}>
            Выйти без сохранения
          </Button>
        </div>
      </BottomSheet>
    </main>
  );
}
