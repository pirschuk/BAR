import { cn } from '../../lib/cn';

/** Индикатор слайдов: точки 8, активная — пилюля 24 акцентом; плавно перетекает */
export function PageDots({ count, index, className }: { count: number; index: number; className?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-2', className)} role="img" aria-label={`Экран ${index + 1} из ${count}`}>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={cn('h-2 rounded-full transition-all duration-300 motion-reduce:transition-none', i === index ? 'w-6 bg-accent' : 'w-2 bg-fg-3/50')}
        />
      ))}
    </div>
  );
}
