import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, Outlet, RouterProvider, ScrollRestoration, useLocation } from 'react-router';
import { TabBar } from './components/ui/TabBar';
import { BarPage } from './pages/BarPage';
import './styles/index.css';
import { CatalogPage } from './pages/CatalogPage';
import { CocktailPage } from './pages/CocktailPage';
import { DesignSystemPage } from './pages/DesignSystemPage';
import { NotFoundPage } from './pages/NotFoundPage';

// таб-бар — только на корневых экранах; на рецепте обложка во весь экран
const TAB_ROOTS = new Set(['/', '/bar']);

function Layout() {
  const { pathname } = useLocation();
  return (
    <>
      <ScrollRestoration />
      <Outlet />
      {/* «Мне повезёт» — срез 2c */}
      {TAB_ROOTS.has(pathname) && <TabBar luckyDisabled />}
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
      { path: '/cocktail/:slug', element: <CocktailPage /> },
      { path: '/design-system', element: <DesignSystemPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
], { basename: import.meta.env.BASE_URL });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
