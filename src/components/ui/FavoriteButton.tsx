import { useState } from 'react';
import { Heart } from 'lucide-react';
import { cn } from '../../lib/cn';
import { IconButton } from './Button';

type Props = {
  on: boolean;
  onToggle: () => void;
  pressed?: boolean;
};

/**
 * Сердце «в избранное» в закреплённом навбаре (стекло 56) [Swiggy, Shop]: контур → заливка акцентом, «пульс» 200 мс при добавлении
 * (без анимации при reduced-motion), короткая вибрация на Android. Состояние — aria-pressed.
 */
export function FavoriteButton({ on, onToggle, pressed }: Props) {
  // ключ перезапускает анимацию на каждое добавление
  const [beat, setBeat] = useState(0);
  const click = () => {
    if (!on) {
      setBeat((b) => b + 1);
      navigator.vibrate?.(10);
    }
    onToggle();
  };
  return (
    <IconButton
      key={beat}
      icon={Heart}
      label={on ? 'Убрать из избранного' : 'В избранное'}
      aria-pressed={on}
      variant="glass"
      size="xl"
      pressed={pressed}
      onClick={click}
      className={cn(on && 'text-on-media-accent!')}
      iconClassName={cn(on && 'fill-current', beat > 0 && 'motion-safe:animate-pop')}
    />
  );
}
