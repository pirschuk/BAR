import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { useMemo } from 'react';
import { createBrowserRouter, Outlet, RouterProvider, ScrollRestoration, useLocation, useNavigate } from 'react-router';
import { LuckySheet } from './components/LuckySheet';
import { Button } from './components/ui/Button';
import { cocktails, countLabel } from './lib/cocktails';
import { useFavorites } from './lib/favorites';
import { applyFilters, hasFacetFilters, parseFilters } from './lib/filters';
import { canMake, useInventory } from './lib/inventory';
import type { Cocktail } from './types/cocktail';
import { TabBar } from './components/ui/TabBar';
import { BarPage } from './pages/BarPage';
import { BarSectionPage } from './pages/BarSectionPage';
import './styles/index.css';
import { CatalogPage } from './pages/CatalogPage';
import { CocktailPage } from './pages/CocktailPage';
import { NotFoundPage } from './pages/NotFoundPage';

// таб-бар — только на корневых экранах; на рецепте обложка во весь экран
const TAB_ROOTS = new Set(['/', '/bar']);

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { inv } = useInventory();
  const { list: favList } = useFavorites();
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
  }, [location.pathname, location.search, inv, favList]);

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
      <Outlet />
      {onRoot && <TabBar onLucky={openLucky} />}
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

// basename = base из vite.config.ts: '/' локально и на Vercel, '/BAR/' на GitHub Pages
const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <CatalogPage /> },
      { path: '/bar', element: <BarPage /> },
      { path: '/bar/:section', element: <BarSectionPage /> },
      { path: '/cocktail/:slug', element: <CocktailPage /> },
      // витрина — отдельным чанком: пользователю приложения она не нужна
      { path: '/design-system', lazy: async () => ({ Component: (await import('./pages/DesignSystemPage')).DesignSystemPage }) },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
], { basename: import.meta.env.BASE_URL });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
