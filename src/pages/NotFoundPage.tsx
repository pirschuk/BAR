import { Link } from 'react-router';
import { buttonClass } from '../components/ui/Button';

export function NotFoundPage({ title = 'Страница не найдена' }: { title?: string }) {
  return (
    <main className="pt-safe pb-safe flex min-h-svh flex-col items-center justify-center gap-2 px-4 text-center">
      <h1 className="text-title-2 text-fg">{title}</h1>
      <p className="text-subhead text-fg-2">Возможно, ссылка устарела.</p>
      <Link to="/" className={buttonClass('primary', 'l', 'mt-6')}>
        В каталог
      </Link>
    </main>
  );
}
