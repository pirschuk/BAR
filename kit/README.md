# Набор правил разработки PWA (из BAR)

Что переносится: стек, процесс, команды Claude Code, хуки, скрипты проверки, деплой «тестовый стенд → продакшен»
и инженерные правила PWA. **Внешний вид не переносится**: скилл дизайн-системы — пустой каркас, визуальный язык
нового приложения строится заново. Специфика BAR (рецепты, `bartender`, токены и компоненты) сюда не входит.

## Быстрый старт

```bash
# из корня BAR
kit/apply.sh ../my-app "MyApp" owner/my-app 5173 "короткое описание"
```

Скрипт копирует `kit/template/` в проект и подставляет название, владельца, репозиторий, порт.
Существующие файлы не трогает — кладёт рядом `*.kit` для ручного слияния.

## Что внутри `template/`

| Файл | Зачем |
|---|---|
| `CLAUDE.md` | правила проекта: стек, команды, поток релиза, процесс `/idea → /code → /look → /ref`, правила |
| `.claude/commands/idea.md` | продакт-режим: продумать фичу, записать `plan.md`, ждать «го» |
| `.claude/commands/code.md` | реализовать план: сначала каталог `/design-system`, потом экран, проверка |
| `.claude/commands/look.md` | скриншот роута → разбор P0/P1/P2 → правки → повтор |
| `.claude/commands/ref.md` | референс Mobbin → правила в скилл дизайн-системы |
| `.claude/agents/ui-inspector.md` | субагент-критик по скриншотам |
| `.claude/skills/design-system/SKILL.md` | пустой каркас дизайн-системы + как его вести + чек-лист проверки |
| `.claude/skills/pwa-engineering/SKILL.md` | механика PWA без дизайна: URL и «Назад», базовый путь, офлайн и кэш, установка iPhone/Android, standalone, данные, первый запуск, переходы, производительность, проверки |
| `.claude/hooks/typecheck.sh` + `settings.json` | `tsc` после каждой правки `.ts/.tsx`, разрешения на dev/build/скриншоты |
| `scripts/screenshot.mjs` | скриншот 390×844 @2x, `--full`, `--click`, `--intro` |
| `scripts/split-shot.py`, `montage.py` | нарезать длинный скриншот / склеить в ряд |
| `scripts/make-icons.mjs`, `make-splash.mjs` | иконки PWA и заставки iPhone из `public/favicon.svg` |
| `scripts/spa-fallback.mjs`, `serve-gh-pages.mjs` | прямые ссылки SPA на Pages + локальная эмуляция |
| `.github/workflows/deploy-gh-pages.yml` | тестовый стенд: ветки `claude/**` → GitHub Pages |
| `vercel.json` | продакшен: только страница установки, без служебных страниц, кэш, без превью веток `claude/**` |
| `plan.md`, `docs/previews/README.md`, `refs/` | пустые заготовки |

## Код проекта (вручную, один раз)

**package.json**
```json
"engines": { "node": ">=22.12" },
"scripts": {
  "dev": "vite --host 127.0.0.1 --port 5173 --strictPort",
  "build": "tsc -b && vite build",
  "build:gh-pages": "BASE_PATH=/<repo>/ npm run build && node scripts/spa-fallback.mjs",
  "test": "vitest run"
}
```
devDependencies: `playwright` (скриншоты), `vitest`, `vite-plugin-pwa`.

**vite.config.ts** — базовый путь из `BASE_PATH` (`'/'` локально и на Vercel, `'/<repo>/'` на Pages), манифест с
`start_url`/`scope`/`id` = base, `display: standalone`, иконки относительными путями, `globIgnores: ['**/splash/**']`.
Образец — `vite.config.ts` в BAR.

**index.html** — `viewport-fit=cover`, `theme-color`, `apple-mobile-web-app-*`, `apple-touch-icon`,
`<link>` заставок из `make-splash.mjs`, description и `og:*`.

**.gitignore** — `.screenshots/`.

**Роутер** — `createBrowserRouter(..., { basename: import.meta.env.BASE_URL })`; служебные маршруты
(`/design-system`, просмотр онбординга и установки) — только если `import.meta.env.VITE_INTERNAL !== '0'`.

## Механика из BAR, которую можно взять (вид — переделать под себя)

| Механика | Файлы в BAR |
|---|---|
| Направление переходов, платформа, View Transitions | `src/lib/motion.ts` (без CSS-раздела «Движение» — это вид BAR) |
| Свайп назад на iPhone (standalone) | `src/components/SwipeBack.tsx` |
| Шторка: хэш, закрытие с анимацией, смах | логика в `src/components/ui/BottomSheet.tsx` (`useLeaving`, жест) |
| Установка: события, платформа, гейт продакшена | `src/lib/install.ts`, `Root` в `src/main.tsx` |
| Первый запуск: когда показывать | `src/lib/onboarding.ts` |
| Перетаскивание строк | `useDrag` в `src/components/ui/EditorFields.tsx` |
| Стор над localStorage | `src/lib/favorites.ts` (`useSyncExternalStore`, `storage`) |

## Настройка площадок

1. **GitHub Pages:** Settings → Pages → Source: GitHub Actions.
2. **Ветка `main`** — продакшен. Основная ветка репозитория — `main` (Settings → General → Default branch).
3. **Vercel:** Add New → Project → репозиторий; Settings → Git → Production Branch = `main`.
4. Пуш в `main` из облачной сессии Claude в режиме Auto блокируется как продакшен-деплой. Вливайте через pull request
   (это и есть «принимаю») или дайте разрешение на `git push` в `main`.
