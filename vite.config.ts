import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// Базовый путь: '/' локально и на Vercel; '/BAR/' — сборка для GitHub Pages (BASE_PATH в workflow)
const base = normalizeBase(process.env.BASE_PATH);

function normalizeBase(value: string | undefined): string {
  if (!value || value === '/') return '/';
  return `/${value.replace(/^\/+|\/+$/g, '')}/`;
}

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'BAR — коктейли',
        short_name: 'BAR',
        description: 'Каталог коктейлей с рецептами и пересчётом порций',
        lang: 'ru',
        // относительно base: на Pages — /BAR/, на Vercel и локально — /
        start_url: base,
        scope: base,
        id: base,
        display: 'standalone',
        orientation: 'portrait',
        // = --bg тёмной темы (styles/index.css)
        background_color: '#0E0E10',
        theme_color: '#0E0E10',
        icons: [
          // пути относительно манифеста (он лежит в base)
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json,woff2}'],
        // офлайн-навигация по любому роуту SPA внутри base
        navigateFallback: `${base}index.html`,
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts'],
  },
});
