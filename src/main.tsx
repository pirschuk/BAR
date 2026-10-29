import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { useEffect, useMemo, useState } from 'react';
import { createBrowserRouter, Outlet, ScrollRestoration, useLocation, useNavigate, type RouteObject } from 'react-router';
import { SwipeBack } from './components/SwipeBack';
// RouterProvider из react-router/dom — с flushSync: переходы View Transitions снимают кадр синхронно
import { RouterProvider } from 'react-router/dom';
import { initMotion } from './lib/motion';
import { initInstall, installGate, skipInstall } from './lib/install';
import { InstallPage } from './pages/InstallPage';

import { LuckySheet } from './components/LuckySheet';
import { Button } from './components/ui/Button';
import { cocktails, countLabel } from './lib/cocktails';
import { useCustomCocktails } from './lib/custom';
import { useFavorites } from './lib/favorites';
import { applyFilters, hasFacetFilters, parseFilters } from './lib/filters';
import { QUICK_START, canMake, useInventory } from './lib/inventory';
import { ONBOARDING_HASH, markOnboarded, shouldOnboard } from './lib/onboarding';
import { Onboarding } from './components/Onboarding';
import { OnboardingPreviewPage } from './pages/OnboardingPreviewPage';
import type { Cocktail } from './types/cocktail';
import { TabBar } from './components/ui/TabBar';
import { BarPage } from './pages/BarPage';
import { BarSectionPage } from './pages/BarSectionPage';
import './styles/index.css';
import { CatalogPage } from './pages/CatalogPage';
import { CocktailPage } from './pages/CocktailPage';
import { CocktailEditorPage } from './pages/CocktailEditorPage';
import { GuidePage, GuideTopicPage } from './pages/GuidePage';
import { NotFoundPage } from './pages/NotFoundPage';

// таб-бар — только на корневых экранах; на рецепте обложка во весь экран
const TAB_ROOTS = new Set(['/', '/bar']);

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { inv, add } = useInventory();
  const { list: favList } = useFavorites();
  const { list: myList } = useCustomCocktails();
  const onRoot = TAB_ROOTS.has(location.pathname);

  // «Мне повезёт» по контексту таба: каталог — текущие фильтры, «Мой бар» — только то, что можно приготовить
  const lucky = useMemo(() => {
    const able = (c: Cocktail) => canMake(c, inv);
    if (location.pathname === '/bar') {
      const pool = cocktails.filter(able);
      return { pool, caption: `Всё есть дома: ${countLabel(pool.length)}` };
    }
    const f = parseFilters(new URLSearchParams(location.search));
    const pool = applyFilters(cocktails, f, able, (c) => favList.includes(c.id));
    const filtered = hasFacetFilters(f) || !!f.q.trim();
    return { pool, caption: filtered ? `Подходят: ${countLabel(pool.length)}` : `Весь каталог: ${countLabel(pool.length)}` };
  }, [location.pathname, location.search, inv, favList, myList]);

  // онбординг: первый запуск на корне (прямая ссылка на рецепт — не перебиваем); открыт по хэшу — «Назад» закрывает
  useEffect(() => {
    if (onRoot && !location.hash && shouldOnboard())
      navigate({ pathname: location.pathname, search: location.search, hash: ONBOARDING_HASH }, { state: { sheet: true }, preventScrollReset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRoot]);
  const isIntro = onRoot && location.hash === ONBOARDING_HASH;
  const closeIntro = () => {
    markOnboarded();
    if ((location.state as { sheet?: boolean } | null)?.sheet) navigate(-1);
    else navigate({ pathname: location.pathname, search: location.search, hash: '' }, { replace: true, preventScrollReset: true });
  };
  const finishIntro = (choice: 'quick' | 'bar' | 'catalog') => {
    markOnboarded();
    if (choice === 'quick') add(QUICK_START);
    navigate(choice === 'catalog' ? '/' : '/bar', { replace: true });
  };

  const isLucky = onRoot && location.hash === '#lucky';
  const openLucky = () =>
    navigate({ pathname: location.pathname, search: location.search, hash: '#lucky' }, { state: { sheet: true }, preventScrollReset: true });
  const closeLucky = () => {
    if ((location.state as { sheet?: boolean } | null)?.sheet) navigate(-1);
    else navigate({ pathname: location.pathname, search: location.search, hash: '' }, { replace: true, preventScrollReset: true });
  };
  // запись с #lucky заменяется рецептом: «Назад» из рецепта — на экран без шторки
  const openRecipe = (id: string) => navigate(`/cocktail/${id}`, { replace: true });

  const empty =
    location.pathname === '/bar'
      ? {
          title: inv.size ? 'Пока ничего не получится' : 'Бар пока пуст',
          hint: 'Отметьте ещё 1–2 ингредиента — колода соберётся',
          action: (
            <Button variant="secondary" size="m" onClick={closeLucky}>
              К ингредиентам
            </Button>
          ),
        }
      : {
          title: 'Не из чего выбирать',
          hint: 'Ничего не подходит под поиск и фильтры',
          action: (
            <Button variant="secondary" size="m" onClick={() => navigate('/', { replace: true })}>
              Сбросить всё
            </Button>
          ),
        };

  return (
    <>
      <ScrollRestoration />
      <SwipeBack routes={PAGES} disabledOn={(p) => TAB_ROOTS.has(p)} ghostChrome={(p) => TAB_ROOTS.has(p) && <TabBar />}>
        <Outlet />
      </SwipeBack>
      {onRoot && <TabBar onLucky={openLucky} />}
      {/* бар уже не пуст (повтор из «Моего бара») — без финала «Соберите бар» */}
      {onRoot && <Onboarding open={isIntro} onClose={closeIntro} onFinish={inv.size ? null : finishIntro} />}
      {onRoot && (
        <LuckySheet
          open={isLucky}
          onClose={closeLucky}
          pool={lucky.pool}
          caption={lucky.caption}
          onOpenRecipe={openRecipe}
          empty={empty}
          isAvailable={(c) => canMake(c, inv)}
          isFavorite={(c) => favList.includes(c.id)}
        />
      )}
    </>
  );
}

// до роутера: popstate должен узнать направление раньше, чем роутер запустит переход
initMotion();
initInstall();

// basename = base из vite.config.ts: '/' локально и на Vercel, '/BAR/' на GitHub Pages
// страницы приложения — их же рисует «призрак» под свайпом назад
const PAGES: RouteObject[] = [
  { path: '/', element: <CatalogPage /> },
  { path: '/bar', element: <BarPage /> },
  { path: '/bar/:section', element: <BarSectionPage /> },
  { path: '/cocktail/:slug', element: <CocktailPage /> },
  // авторский коктейль: новый и правка — одна форма
  { path: '/new', element: <CocktailEditorPage /> },
  { path: '/cocktail/:slug/edit', element: <CocktailEditorPage /> },
  { path: '/guide', element: <GuidePage /> },
  { path: '/guide/:topic', element: <GuideTopicPage /> },
];

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      ...PAGES,
      // витрина — отдельным чанком: пользователю приложения она не нужна
      { path: '/design-system', lazy: async () => ({ Component: (await import('./pages/DesignSystemPage')).DesignSystemPage }) },
      // страница установки — для просмотра (на Vercel её показывает installGate вместо приложения)
      { path: '/install', element: <InstallPage /> },
      // онбординг отдельно, для просмотра: не меняет данные и не помечается пройденным
      { path: '/onboarding', element: <OnboardingPreviewPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
], { basename: import.meta.env.BASE_URL });

// Vercel: открыли ссылку в браузере — сначала страница установки; «Открыть в браузере» — приложение
function Root() {
  const [gate, setGate] = useState(installGate);
  if (gate) return <InstallPage onContinue={() => (skipInstall(), setGate(false))} />;
  return <RouterProvider router={router} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
