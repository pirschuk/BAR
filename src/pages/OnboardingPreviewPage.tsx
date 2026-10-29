import { useState } from 'react';
import { Link } from 'react-router';
import { RotateCcw } from 'lucide-react';
import { Onboarding } from '../components/Onboarding';
import { Button, buttonClass } from '../components/ui/Button';

const CHOICE: Record<'quick' | 'bar' | 'catalog' | 'skip', string> = {
  quick: '«Быстрый старт» — добавил бы базовый бар и открыл «Мой бар»',
  bar: '«Отмечу сам» — открыл бы «Мой бар»',
  catalog: '«Сначала посмотрю каталог» — открыл бы каталог',
  skip: '«Пропустить» — открыл бы приложение',
};

/**
 * /onboarding — просмотр онбординга отдельно: открывается всегда, не меняет бар и не помечает онбординг
 * пройденным. В конце — что произошло бы на самом деле и «Посмотреть ещё раз».
 */
export function OnboardingPreviewPage() {
  const [run, setRun] = useState(0);
  const [result, setResult] = useState<keyof typeof CHOICE | null>(null);
  if (!result)
    return <Onboarding key={run} open onClose={() => setResult('skip')} onFinish={(c) => setResult(c)} />;
  return (
    <main className="pt-safe pb-safe flex min-h-svh flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-display text-fg">Просмотр онбординга</h1>
      <p className="mt-4 text-body text-fg-2">{CHOICE[result]}. В режиме просмотра ничего не сохраняется.</p>
      <div className="mt-8 flex w-full flex-col gap-2">
        <Button icon={RotateCcw} className="w-full" onClick={() => (setResult(null), setRun((n) => n + 1))}>
          Посмотреть ещё раз
        </Button>
        <Link to="/" className={buttonClass('plain', 'l', 'w-full text-fg-2!')}>
          В приложение
        </Link>
      </div>
    </main>
  );
}
