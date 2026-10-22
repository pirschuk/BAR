import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, Outlet, RouterProvider, ScrollRestoration } from 'react-router';
import './styles/index.css';
import { CatalogPage } from './pages/CatalogPage';
import { CocktailPage } from './pages/CocktailPage';
import { DesignSystemPage } from './pages/DesignSystemPage';
import { NotFoundPage } from './pages/NotFoundPage';

function Layout() {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  );
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <CatalogPage /> },
      { path: '/cocktail/:slug', element: <CocktailPage /> },
      { path: '/design-system', element: <DesignSystemPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
