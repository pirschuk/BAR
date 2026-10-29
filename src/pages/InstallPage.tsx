import { Download, EllipsisVertical, Lock, Share, SquarePlus } from 'lucide-react';
import { useInstall } from '../lib/install';
import { Button } from '../components/ui/Button';
import { Steps } from '../components/ui/Steps';

/** Иконка интерфейса браузера внутри шага: «нажмите [⎋]» */
function Glyph({ icon: Icon, label }: { icon: typeof Share; label: string }) {
  return (
    <span className="mx-1 inline-flex size-7 translate-y-1.5 items-center justify-center rounded-control bg-tile-strong text-accent" role="img" aria-label={label}>
      <Icon className="size-4" aria-hidden />
    </span>
  );
}

type Props = {
  /** для витрины: какую платформу показать */
  platform?: 'ios' | 'android' | 'desktop' | 'inapp';
  /** для витрины: Android дал окно установки */
  canPrompt?: boolean;
};

/**
 * Страница установки — то, что видит человек, открыв ссылку в браузере (сборка для Vercel).
 * iPhone: установка только вручную — три шага с иконками Safari. Android: кнопка «Установить» (системное окно),
 * если браузер его не дал — путь через меню ⋮. Браузер мессенджера — «откройте в Safari / Chrome».
 * Компьютер — «откройте на телефоне». Приложения в браузере нет: полная функциональность — после установки.
 */
export function InstallPage({ platform: forced, canPrompt: forcedPrompt }: Props) {
  const install = useInstall();
  const platform = forced ?? install.platform;
  const canPrompt = forcedPrompt ?? install.canPrompt;
  const icon = `${import.meta.env.BASE_URL}icons/icon-512.png`;

  return (
    <main className="pt-safe pb-safe flex min-h-svh flex-col px-4">
      <div className="flex flex-1 flex-col items-center justify-center pt-12 text-center">
        <img src={icon} alt="" className="size-24 rounded-tile" />
        <h1 className="mt-5 font-display text-display text-fg">BAR</h1>
        <p className="mt-2 max-w-72 text-body text-fg-2">Коктейли, рецепты и ваш домашний бар. Работает без интернета.</p>
      </div>

      <section className="mt-10 rounded-tile bg-tile py-5" aria-label="Как установить">
        {install.installed ? (
          <p className="px-5 text-body text-fg">Готово — откройте BAR с экрана «Домой».</p>
        ) : platform === 'ios' ? (
          <>
            <h2 className="px-4 text-headline text-fg">Установите на iPhone</h2>
            <Steps
              className="mt-4"
              steps={[
                <>
                  Нажмите <Glyph icon={Share} label="Поделиться" /> внизу экрана
                </>,
                <>
                  Выберите <Glyph icon={SquarePlus} label="На экран Домой" /> «На экран Домой»
                </>,
                <>Нажмите «Добавить» — BAR появится среди приложений</>,
              ]}
            />
          </>
        ) : platform === 'android' ? (
          canPrompt ? (
            <div className="px-4">
              <h2 className="text-headline text-fg">Установите на телефон</h2>
              <p className="mt-1 text-subhead text-fg-2">Займёт пару секунд, место — меньше фотографии.</p>
              <Button icon={Download} className="mt-4 w-full" onClick={install.prompt}>
                Установить
              </Button>
            </div>
          ) : (
            <>
              <h2 className="px-4 text-headline text-fg">Установите на телефон</h2>
              <Steps
                className="mt-4"
                steps={[
                  <>
                    Откройте меню браузера <Glyph icon={EllipsisVertical} label="Меню" />
                  </>,
                  <>Выберите «Установить приложение» или «Добавить на главный экран»</>,
                ]}
              />
            </>
          )
        ) : platform === 'inapp' ? (
          <>
            <h2 className="px-4 text-headline text-fg">Откройте в браузере</h2>
            <p className="mt-1 px-4 text-subhead text-fg-2">Из мессенджера установить нельзя.</p>
            <Steps
              className="mt-4"
              steps={[
                <>
                  Нажмите <Glyph icon={EllipsisVertical} label="Меню" /> или <Glyph icon={Share} label="Поделиться" /> в углу экрана
                </>,
                <>Выберите «Открыть в Safari» или «Открыть в Chrome» — и установите оттуда</>,
              ]}
            />
          </>
        ) : (
          <p className="px-5 text-body text-fg">Откройте эту ссылку на телефоне — BAR устанавливается как приложение на iPhone и Android.</p>
        )}
      </section>

      <p className="mt-4 flex gap-2 px-1 text-footnote text-fg-2">
        <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        Бесплатно, без регистрации. Ваш бар, избранное и свои коктейли хранятся только на этом телефоне.
      </p>
    </main>
  );
}
