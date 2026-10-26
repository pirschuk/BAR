import { useEffect, useState } from 'react';
import { detectPlatform, isStandalone } from './motion';

// --- Установка PWA: Android — системное окно по beforeinstallprompt; iPhone — только вручную («Поделиться → На экран Домой») ---

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

let deferred: InstallPrompt | null = null;
let installed = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** До рендера: событие приходит один раз и рано */
export function initInstall() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as InstallPrompt;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    installed = true;
    deferred = null;
    emit();
  });
}

export type InstallState = {
  /** ios — инструкция; android — кнопка, если браузер дал окно установки, иначе инструкция через меню */
  platform: 'ios' | 'android' | 'desktop';
  canPrompt: boolean;
  installed: boolean;
  prompt: () => Promise<void>;
};

const isMobile = () => /Android|iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));

export function useInstall(): InstallState {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => void listeners.delete(l);
  }, []);
  return {
    platform: !isMobile() ? 'desktop' : detectPlatform(),
    canPrompt: !!deferred,
    installed: installed || isStandalone(),
    prompt: async () => {
      if (!deferred) return;
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === 'accepted') installed = true;
      deferred = null;
      emit();
    },
  };
}

const SKIP_KEY = 'bar-skip-install';

/**
 * Страница установки вместо приложения: только в сборке для Vercel (VITE_INSTALL_PAGE=1),
 * только во вкладке браузера (не в установленном приложении) и если не выбрали «Открыть в браузере».
 */
export function installGate(): boolean {
  if (import.meta.env.VITE_INSTALL_PAGE !== '1' || isStandalone()) return false;
  try {
    return sessionStorage.getItem(SKIP_KEY) !== '1';
  } catch {
    return true;
  }
}

export function skipInstall() {
  try {
    sessionStorage.setItem(SKIP_KEY, '1');
  } catch {
    // приватный режим — до перезагрузки
  }
}
